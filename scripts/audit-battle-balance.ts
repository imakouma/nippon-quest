import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';
import { computeDamage, fleeChance } from '../src/core/battle/damage';
import { makeHero, makeMonster } from '../src/core/battle/factory';
import { loadContent, type FileReader } from '../src/core/content/loader';
import { createRng } from '../src/core/rng';
import { createNewGame } from '../src/core/state/newGame';
import {
  BALANCE_LEVELS,
  combatPressure,
  legacyDamage,
  legacyStatsAtLevel,
  median,
  relativeDrift,
  type LegacyStats,
} from './battle-balance-model';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT = `${ROOT}content/`;
const BASELINE_REF = process.env.NQ_BALANCE_BASELINE_REF ?? 'de57236^';
const CONDITIONS = { perfect: 2, average: 1.2, miss: 0.5 } as const;
const MAX_MEDIAN_DRIFT = 0.35;
const read: FileReader = async (relative) => JSON.parse(await readFile(CONTENT + relative, 'utf8'));
const content = await loadContent(read);
const fresh = createNewGame({ name: 'バランス監査', grade: 3 }, 0);
const starterSkill = content.skills.get(fresh.player.skills[0]!)!;

interface LegacyMonster {
  id: string;
  isBoss?: boolean;
  baseStats: LegacyStats;
  growth: LegacyStats;
}

interface AuditRow {
  id: string;
  boss: boolean;
  level: number;
  condition: 'normal' | keyof typeof CONDITIONS;
  dealt: number;
  received: number;
  turnsToWin: number;
  turnsToLose: number;
  pressure: number;
  fleeChance: number;
}

function gitArchiveFiles(): Map<string, string> {
  const archive = execFileSync(
    'git',
    ['archive', BASELINE_REF, 'content/monsters', 'content/balance/settings.json'],
    { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 },
  );
  const files = new Map<string, string>();
  for (let offset = 0; offset + 512 <= archive.length;) {
    const header = archive.subarray(offset, offset + 512);
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    if (!name) break;
    const size = Number.parseInt(
      header.subarray(124, 136).toString('ascii').replace(/\0.*$/, '').trim() || '0',
      8,
    );
    const dataStart = offset + 512;
    if (name.endsWith('.json'))
      files.set(name, archive.subarray(dataStart, dataStart + size).toString('utf8'));
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  return files;
}

const baselineFiles = gitArchiveFiles();
const monsterPaths = [...baselineFiles.keys()].filter((path) => path.startsWith('content/monsters/'));
const baselineById = new Map(
  monsterPaths
    .map((path) => JSON.parse(baselineFiles.get(path)!) as LegacyMonster)
    .map((monster) => [monster.id, monster] as const),
);
const baselineSettings = JSON.parse(baselineFiles.get('content/balance/settings.json')!) as {
  heroGrowth: LegacyStats;
  damageScale: number;
};
const oldHeroBase: LegacyStats = { hp: 40, mp: 10, atk: 8, def: 6, spd: 7, wis: 5 };
const before: AuditRow[] = [];
const after: AuditRow[] = [];

for (const monster of content.monsters.values()) {
  const oldMonster = baselineById.get(monster.id);
  if (!oldMonster) throw new Error(`${BASELINE_REF} に ${monster.id} がありません`);
  for (const level of BALANCE_LEVELS) {
    if (monster.isBoss && level === 1) continue;
    const hero = makeHero(
      {
        name: 'バランス監査',
        level,
        baseStats: fresh.player.baseStats,
        growth: content.settings.heroGrowth,
        skills: fresh.player.skills,
        equipment: {},
      },
      content.items,
      content.sets,
    );
    const enemy = makeMonster(monster, level);
    const oldHero = legacyStatsAtLevel(oldHeroBase, baselineSettings.heroGrowth, level);
    const oldEnemy = legacyStatsAtLevel(oldMonster.baseStats, oldMonster.growth, level);
    const modes: Array<{ condition: AuditRow['condition']; score: number | null; scoreMultiplier: number }> =
      [
        { condition: 'normal', score: null, scoreMultiplier: 1 },
        ...Object.entries(CONDITIONS).map(([condition, scoreMultiplier]) => ({
          condition: condition as keyof typeof CONDITIONS,
          score: condition === 'perfect' ? 1 : condition === 'average' ? 0.65 : 0,
          scoreMultiplier,
        })),
      ];
    for (const mode of modes) {
      const isNormal = mode.condition === 'normal';
      const dealt = computeDamage({
        attacker: hero,
        defender: enemy,
        skill: isNormal ? null : starterSkill,
        score: mode.score,
        combo: 0,
        canCrit: false,
        settings: content.settings,
        elements: content.elements,
        rng: createRng(`${monster.id}:${level}:${mode.condition}:hero`),
      }).amount;
      const received = computeDamage({
        attacker: enemy,
        defender: hero,
        skill: null,
        score: null,
        combo: 0,
        canCrit: false,
        settings: content.settings,
        elements: content.elements,
        rng: createRng(`${monster.id}:${level}:${mode.condition}:enemy`),
      }).amount;
      after.push({
        id: monster.id,
        boss: monster.isBoss,
        level,
        condition: mode.condition,
        dealt,
        received,
        turnsToWin: Math.ceil(enemy.stats.hp / dealt),
        turnsToLose: Math.ceil(hero.stats.hp / received),
        pressure: combatPressure(enemy.stats.hp / dealt, hero.stats.hp / received),
        fleeChance: fleeChance(hero, enemy),
      });
      const oldDealt = legacyDamage({
        attack: oldHero.atk,
        defense: oldEnemy.def,
        wisdom: oldHero.wis,
        power: isNormal ? 100 : starterSkill.power,
        scoreMultiplier: mode.scoreMultiplier,
        scale: baselineSettings.damageScale,
      });
      const oldReceived = legacyDamage({
        attack: oldEnemy.atk,
        defense: oldHero.def,
        wisdom: oldEnemy.wis,
        power: 100,
        scoreMultiplier: 1,
        scale: baselineSettings.damageScale,
      });
      before.push({
        id: oldMonster.id,
        boss: oldMonster.isBoss ?? false,
        level,
        condition: mode.condition,
        dealt: oldDealt,
        received: oldReceived,
        turnsToWin: Math.ceil(oldEnemy.hp / oldDealt),
        turnsToLose: Math.ceil(oldHero.hp / oldReceived),
        pressure: combatPressure(oldEnemy.hp / oldDealt, oldHero.hp / oldReceived),
        fleeChance: Math.min(0.95, Math.max(0.15, (oldHero.spd / Math.max(1, oldEnemy.spd)) * 0.5)),
      });
    }
  }
}

const groups = [...new Set(after.map((row) => `${row.boss}:${row.level}:${row.condition}`))];
const outliers = groups.flatMap((group) => {
  const [boss, level, condition] = group.split(':');
  const matches = (row: AuditRow) =>
    String(row.boss) === boss && String(row.level) === level && row.condition === condition;
  const oldRows = before.filter(matches);
  const newRows = after.filter(matches);
  const oldPressure = median(oldRows.map((row) => row.pressure));
  const newPressure = median(newRows.map((row) => row.pressure));
  const pressureDrift = relativeDrift(oldPressure, newPressure);
  const oldFlee = median(oldRows.map((row) => row.fleeChance));
  const newFlee = median(newRows.map((row) => row.fleeChance));
  const fleeDrift = newFlee - oldFlee;
  return Math.abs(pressureDrift) > MAX_MEDIAN_DRIFT || Math.abs(fleeDrift) > 0.1
    ? [
        {
          boss: boss === 'true',
          level: Number(level),
          condition,
          oldPressure,
          newPressure,
          pressureDrift,
          oldFlee,
          newFlee,
          fleeDrift,
        },
      ]
    : [];
});

const metadata = {
  baselineRef: BASELINE_REF,
  levels: BALANCE_LEVELS,
  conditions: ['normal', ...Object.keys(CONDITIONS)],
  maximumMedianDrift: MAX_MEDIAN_DRIFT,
};
const json = (value: unknown) => format(JSON.stringify(value), { parser: 'json' });
await writeFile(
  `${ROOT}tests/fixtures/battle-balance-before.json`,
  await json({ model: 'legacy-six-stats', metadata, rows: before }),
);
await writeFile(
  `${ROOT}tests/fixtures/battle-balance-after.json`,
  await json({ model: 'academic-stats-pokemon-like-v1', metadata, outliers, rows: after }),
);
console.log(
  `battle balance: ${content.monsters.size} monsters / ${after.length} scenarios / ${outliers.length} outliers`,
);
for (const outlier of outliers) console.error(JSON.stringify(outlier));
if (outliers.length) process.exitCode = 1;
