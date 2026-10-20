import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERO_MAX_LEVEL = 200;
const MONSTER_MAX_LEVEL = 100;

export function heroXpMultiplier(targetLevel: number): number {
  if (targetLevel <= 100) return 1;
  if (targetLevel <= 120) return 8;
  if (targetLevel <= 150) return 12;
  if (targetLevel <= 180) return 18;
  return 25;
}

function cumulativeXp(
  maxLevel: number,
  base: number,
  exponent: number,
  multiplier: (level: number) => number,
) {
  const result = [0];
  for (let targetLevel = 2; targetLevel <= maxLevel; targetLevel += 1) {
    const growthCount = targetLevel - 1;
    const delta = Math.round(base * growthCount ** exponent) * multiplier(targetLevel);
    result.push(result[result.length - 1]! + delta);
  }
  return result;
}

export function buildXpTables() {
  return {
    $schema: '../../schemas/xp.schema.json',
    hero: cumulativeXp(HERO_MAX_LEVEL, 20, 1.6, heroXpMultiplier),
    monster: cumulativeXp(MONSTER_MAX_LEVEL, 15, 1.5, () => 1),
  };
}

function main(): void {
  const target = fileURLToPath(new URL('../content/balance/xp.json', import.meta.url));
  writeFileSync(target, `${JSON.stringify(buildXpTables(), null, 2)}\n`);
  console.log(`xp table: hero Lv${HERO_MAX_LEVEL} / monster Lv${MONSTER_MAX_LEVEL}`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href) main();
