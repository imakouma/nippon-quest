/** 静的画像へ差し替える作業を、県と種類ごとに並べた制作バックログを作る。 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadContent, type FileReader } from '../src/core/content/loader';

interface MissingAsset {
  key: string;
  path: string;
  kind: 'character' | 'portrait' | 'motif';
  area: string;
  priority: number;
}

const ROOT = resolve('.');
const CONTENT = resolve(ROOT, 'content');
const read: FileReader = async (relative) =>
  JSON.parse(await readFile(resolve(CONTENT, relative), 'utf8')) as unknown;

function priorityFor(area: string, areaOrder: ReadonlyMap<string, number>): number {
  // 最初に遊ぶ青森、次に東北、以降はワールド進行順。
  if (area === 'aomori') return 1;
  const order = areaOrder.get(area) ?? 999;
  return order < 7 ? 2 : 3 + Math.floor(order / 10);
}

const content = await loadContent(read);
const areaOrder = new Map(
  content.world.islands.flatMap((island) => island.areas).map((area, index) => [area, index]),
);
const missing: MissingAsset[] = [];

function add(key: string, path: string, kind: MissingAsset['kind'], area: string): void {
  if (existsSync(resolve(ROOT, path))) return;
  missing.push({ key, path, kind, area, priority: priorityFor(area, areaOrder) });
}

for (const area of content.areas.values()) {
  for (const motif of area.motifs) {
    const id = motif.imageKey.replace(/^motif\.[^.]+\./, '');
    add(motif.imageKey, `assets/motifs/${area.id}/${id}.png`, 'motif', area.id);
  }
  for (const npc of area.town?.npcs ?? []) {
    const sprite = npc.spriteKey.replace(/^char\./, '');
    add(npc.spriteKey, `assets/sprites/characters/${sprite}.png`, 'character', area.id);
    if (npc.face) {
      const face = npc.face.replace(/^face\./, '');
      add(npc.face, `assets/portraits/${face}.png`, 'portrait', area.id);
    }
  }
}

missing.sort(
  (a, b) =>
    a.priority - b.priority ||
    (areaOrder.get(a.area) ?? 999) - (areaOrder.get(b.area) ?? 999) ||
    a.kind.localeCompare(b.kind) ||
    a.key.localeCompare(b.key),
);

const byKind = Object.fromEntries(
  ['motif', 'character', 'portrait'].map((kind) => [
    kind,
    missing.filter((item) => item.kind === kind).length,
  ]),
);
const byArea = Object.fromEntries(
  [...new Set(missing.map((item) => item.area))].map((area) => [
    area,
    missing.filter((item) => item.area === area).length,
  ]),
);
const report = {
  generatedAt: new Date().toISOString(),
  total: missing.length,
  byKind,
  byArea,
  nextBatch: missing
    .filter((item) => item.priority === Math.min(...missing.map((x) => x.priority)))
    .slice(0, 30),
  assets: missing,
};

await mkdir(resolve(ROOT, 'imports'), { recursive: true });
await writeFile(resolve(ROOT, 'imports/asset-backlog.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`assets: ${missing.length} static replacements pending (${JSON.stringify(byKind)})`);
