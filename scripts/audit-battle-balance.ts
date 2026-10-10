import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadContent, type FileReader } from '../src/core/content/loader';
import { computeDamage } from '../src/core/battle/damage';
import { makeHero, makeMonster } from '../src/core/battle/factory';
import { createRng } from '../src/core/rng';
import { createNewGame } from '../src/core/state/newGame';

const root = fileURLToPath(new URL('..', import.meta.url));
const contentRoot = `${root}content/`;
const read: FileReader = async (relative) => JSON.parse(await readFile(contentRoot + relative, 'utf8'));
const content = await loadContent(read);
const fresh = createNewGame({ name: 'バランス監査', grade: 3 }, 0);
const conditions = { perfect: 1, average: 0.65, miss: 0 } as const;

const rows = [...content.monsters.values()].flatMap((monster) => {
  const level = 5;
  const hero = makeHero(
    {
      name: 'バランス監査',
      level,
      baseStats: fresh.player.baseStats,
      growth: content.settings.heroGrowth,
      skills: [],
      equipment: {},
    },
    content.items,
    content.sets,
  );
  const enemy = makeMonster(monster, level);
  const skill = [...content.skills.values()]
    .filter((candidate) => candidate.effect === 'damage')
    .sort((a, b) => b.power - a.power)[0]!;
  return Object.entries(conditions).map(([condition, score]) => {
    const dealt = computeDamage({
      attacker: hero,
      defender: enemy,
      skill,
      score,
      combo: 0,
      canCrit: false,
      settings: content.settings,
      elements: content.elements,
      rng: createRng(`${monster.id}:${condition}:dealt`),
    }).amount;
    const enemySkill = monster.skills.map((id) => content.skills.get(id)).find((candidate) => candidate?.effect === 'damage');
    const received = computeDamage({
      attacker: enemy,
      defender: hero,
      skill: enemySkill ?? null,
      score: null,
      combo: 0,
      canCrit: false,
      settings: content.settings,
      elements: content.elements,
      rng: createRng(`${monster.id}:${condition}:received`),
    }).amount;
    return {
      id: monster.id,
      boss: monster.isBoss,
      condition,
      level,
      dealt,
      received,
      turnsToWin: Math.ceil(enemy.stats.hp / dealt),
      turnsToLose: Math.ceil(hero.stats.hp / received),
    };
  });
});

const outliers = rows.filter((row) =>
  row.boss ? row.turnsToWin < 1 || row.turnsToWin > 80 : row.turnsToWin < 1 || row.turnsToWin > 40,
);
const report = {
  generatedAt: new Date().toISOString(),
  model: 'academic-stats-pokemon-like-v1',
  assumptions: { level: 5, skill: 'highest-power damage skill', conditions },
  totals: { monsters: content.monsters.size, scenarios: rows.length, outliers: outliers.length },
  outlierIds: [...new Set(outliers.map((row) => row.id))],
  rows,
};
await mkdir(`${root}tests/fixtures`, { recursive: true });
await writeFile(`${root}tests/fixtures/battle-balance-after.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `battle balance: ${report.totals.monsters} monsters / ${report.totals.scenarios} scenarios / ${report.totals.outliers} outliers`,
);
if (report.outlierIds.length) console.log(`outlier ids: ${report.outlierIds.join(', ')}`);
