/**
 * content/world/japan.json の攻略順に合わせ、青森以外の地域ボスレベルを再配分する。
 * 青森の10段階は導入バランスのため保持する。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

interface WorldFile {
  islands: Array<{ areas: string[] }>;
}

interface AreaFile {
  id: string;
  regions: Array<{ id: string; boss?: { level: number } }>;
}

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const checkOnly = process.argv.includes('--check');
const world = JSON.parse(readFileSync(`${ROOT}content/world/japan.json`, 'utf8')) as WorldFile;
const areas = world.islands.flatMap((island) => island.areas).filter((areaId) => areaId !== 'aomori');
const files = areas.map((areaId) => {
  const path = `${ROOT}content/prefectures/${areaId}.json`;
  return { path, raw: readFileSync(path, 'utf8'), data: JSON.parse(readFileSync(path, 'utf8')) as AreaFile };
});
const bosses = files.flatMap(({ data }) =>
  data.regions.map((region) => {
    if (!region.boss) throw new Error(`${data.id}/${region.id}: 地域ボスがいません`);
    return region.boss;
  }),
);

if (bosses.length !== 145) throw new Error(`青森以外の地域ボスが145体ではありません (${bosses.length}体)`);

bosses.forEach((boss, index) => {
  boss.level = 15 + Math.floor((index * 36) / (bosses.length - 1));
});

const stale: string[] = [];
let written = 0;
for (const file of files) {
  const next = `${JSON.stringify(file.data, null, 2)}\n`;
  if (next === file.raw) continue;
  if (checkOnly) stale.push(file.data.id);
  else {
    writeFileSync(file.path, next);
    written += 1;
  }
}

if (stale.length) {
  console.error(`地域ボスレベルが攻略順と不一致: ${stale.join(', ')}`);
  process.exitCode = 1;
} else if (checkOnly) console.log('地域ボスレベル: 145体が攻略順と一致');
else console.log(`地域ボスレベル: ${written}県を更新`);
