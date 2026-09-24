/**
 * 都道府県ファイルの雛形を生成する（47県への展開用）。
 *   pnpm scaffold:area iwate        → content/prefectures/iwate.json（存在すれば何もしない）
 *   pnpm scaffold:all-areas         → 未作成の県をすべて生成
 *   pnpm scaffold:area iwate --force → 上書き
 * 生成物は status: "stub"。コンテンツ担当が motifs 以下を埋めて "playable" にする。
 */
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PREFECTURES } from './data/prefectures';

const OUT = fileURLToPath(new URL('../content/prefectures/', import.meta.url));
const args = process.argv.slice(2);
const force = args.includes('--force');
const targets = args.includes('--all')
  ? PREFECTURES.map((p) => p.id)
  : args.filter((a) => !a.startsWith('--'));

if (targets.length === 0) {
  console.error('usage: pnpm scaffold:area <areaId> [--force] | pnpm scaffold:all-areas');
  process.exit(1);
}

let written = 0;
for (const id of targets) {
  const p = PREFECTURES.find((x) => x.id === id);
  if (!p) {
    console.error(`unknown area id: ${id}`);
    process.exit(1);
  }
  const file = `${OUT}${id}.json`;
  if (existsSync(file) && !force) {
    console.log(`skip (exists): ${id}`);
    continue;
  }
  const stub = {
    $schema: '../../schemas/prefectures.schema.json',
    id: p.id,
    name: p.name,
    island: p.island,
    capital: p.capital,
    status: 'stub',
    mapKeys: { field: `${p.id}-field`, town: `${p.id}-town`, dungeon: `${p.id}-dungeon` },
    motifs: [],
    encounters: [],
    events: [],
    shop: [],
    missions: [],
    town: { name: `${p.name}の 町[まち]`, npcs: [] },
  };
  writeFileSync(file, JSON.stringify(stub, null, 2) + '\n');
  written++;
  console.log(`wrote: content/prefectures/${id}.json`);
}
console.log(`${written} file(s) written`);
