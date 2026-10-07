/**
 * 地方図の47都道府県を、地理生成元・地方マスタ・ゲーム用 worldmap の三者で照合する。
 * 輪郭を手で採点する代わりに、欠落、所属違い、低解像度による形のつぶれを生成後に止める。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ISLANDS, PREFECTURES } from './data/prefectures.js';

interface Region {
  id: string;
  width: number;
  height: number;
  rows: string[];
  areas: { id: string; capital: [number, number] }[];
}

interface TerrainMap {
  kind: string;
  width: number;
  height: number;
  areas?: string[];
  rows: string[];
}

const root = fileURLToPath(new URL('../', import.meta.url));
const worldMap = JSON.parse(readFileSync(`${root}public/worldmap.json`, 'utf8')) as { regions: Region[] };
const terrain = JSON.parse(readFileSync(`${root}scripts/data/terrain.json`, 'utf8')) as {
  maps: Record<string, TerrainMap>;
};
const contentWorld = JSON.parse(readFileSync(`${root}content/world/japan.json`, 'utf8')) as {
  islands: { id: string; areas: string[] }[];
};
const errors: string[] = [];
const fail = (message: string) => errors.push(message);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const masterIds = PREFECTURES.map((p) => p.id);
if (masterIds.length !== 47 || new Set(masterIds).size !== 47)
  fail(`都道府県マスタが47件・重複なしではありません (${masterIds.length}件)`);

const regionIds = ISLANDS.map((r) => r.id);
if (
  !same(
    worldMap.regions.map((r) => r.id),
    regionIds,
  )
)
  fail('worldmap の地方順が地方マスタと違います');
if (
  !same(
    contentWorld.islands.map((r) => r.id),
    regionIds,
  )
)
  fail('content/world の地方順が地方マスタと違います');

const seen = new Set<string>();
for (const regionMaster of ISLANDS) {
  const expected = PREFECTURES.filter((p) => p.island === regionMaster.id).map((p) => p.id);
  const region = worldMap.regions.find((r) => r.id === regionMaster.id);
  const content = contentWorld.islands.find((r) => r.id === regionMaster.id);
  const source = terrain.maps[`${regionMaster.id}-island`];
  if (!region || !content || !source) {
    fail(`${regionMaster.id}: 地方データが一式そろっていません`);
    continue;
  }
  if (
    !same(
      region.areas.map((a) => a.id),
      expected,
    )
  )
    fail(`${region.id}: worldmap の県所属・順序が違います`);
  if (!same(content.areas, expected)) fail(`${region.id}: content/world の県所属・順序が違います`);
  if (!same(source.areas ?? [], expected)) fail(`${region.id}: terrain の県所属・順序が違います`);
  if (region.width !== source.width || region.height !== source.height)
    fail(`${region.id}: worldmap と地理生成元の寸法が違います`);
  const expectedRows = source.rows.map((row) =>
    [...row]
      .map((cell) => (cell >= 'a' && cell < String.fromCharCode(97 + expected.length) ? cell : '.'))
      .join(''),
  );
  if (!same(region.rows, expectedRows)) fail(`${region.id}: worldmap の輪郭が地理生成元と違います`);

  region.areas.forEach((area, index) => {
    if (seen.has(area.id)) fail(`${area.id}: 複数の地方に重複しています`);
    seen.add(area.id);
    const letter = String.fromCharCode(97 + index);
    const cells: [number, number][] = [];
    region.rows.forEach((row, y) =>
      [...row].forEach((cell, x) => {
        if (cell === letter) cells.push([x, y]);
      }),
    );
    if (cells.length < 60)
      fail(`${area.id}: 輪郭が${cells.length}マスしかなく、形がつぶれています（最低60）`);
    if (cells.length) {
      const xs = cells.map(([x]) => x);
      const ys = cells.map(([, y]) => y);
      if (Math.min(Math.max(...xs) - Math.min(...xs) + 1, Math.max(...ys) - Math.min(...ys) + 1) < 6)
        fail(`${area.id}: 輪郭の短辺が6マス未満です`);
    }
    const [cx, cy] = area.capital;
    if (region.rows[cy]?.[cx] !== letter) fail(`${area.id}: 県庁所在地が県の輪郭内にありません`);
  });
  console.log(`✓ ${region.id}: ${expected.length}都道府県 / ${region.width}x${region.height}`);
}

const missing = masterIds.filter((id) => !seen.has(id));
const extra = [...seen].filter((id) => !masterIds.includes(id));
if (missing.length) fail(`地方図にない県: ${missing.join(', ')}`);
if (extra.length) fail(`マスタにない県: ${extra.join(', ')}`);

if (errors.length) {
  console.error(`\n地方図監査: ${errors.length}件の問題`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`\n地方図監査 OK: 10地方・47都道府県。所属、輪郭、解像度、県庁所在地を確認しました。`);
}
