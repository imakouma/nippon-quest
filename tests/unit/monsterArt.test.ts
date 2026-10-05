import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContent, type ContentIndex, type FileReader } from '../../src/core/content/loader';
import { MONSTER_DESIGNS } from '../../src/rendering/monsters';
import { colorsOf, designGrid } from '../../src/rendering/monsters/design';
import { NQ, NQ48 } from '../../src/rendering/palette';
import { MONSTER_SIZE } from '../../src/rendering/battle/pixelArt';

const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const read: FileReader = async (rel) => JSON.parse(readFileSync(CONTENT + rel, 'utf8'));

/** キー（<id> / <id>.p<番号> / <id>.field）→ モンスター id */
const baseId = (key: string) => key.replace(/\.(p\d+|field)$/, '');
const entries = Object.entries(MONSTER_DESIGNS);
const grids = new Map(entries.map(([key, design]) => [key, designGrid(design)]));
const palette = new Set<string>(NQ48);

let c: ContentIndex;
beforeAll(async () => {
  c = await loadContent(read);
});

/** docs/06 §2.2 の規格：地方ボス 56 / 中ボス 40（フィールドの版は 32）/ 県ボス 48 / 通常 32 */
function expectedSize(key: string): number {
  const id = baseId(key);
  const m = c.monsters.get(id)!;
  if (key.endsWith('.field')) return 32;
  // 北海道は 県 id と 島 id が 同じ。地方ボスは 島 id だけの モンスター
  if (!c.areas.has(m.area) && c.world.islands.some((i) => i.id === m.area)) return MONSTER_SIZE.islandBoss;
  if ([...c.areas.values()].some((a) => a.midBoss === id)) return MONSTER_SIZE.midBoss;
  return m.isBoss ? MONSTER_SIZE.boss : MONSTER_SIZE.normal;
}

describe('手描きモンスター（docs/06 の規格）', () => {
  it('キーのモンスターが content にある', () => {
    for (const [key] of entries) expect(c.monsters.has(baseId(key)), key).toBe(true);
  });

  it('47 都道府県の モンスターは 全員 そろっている（中ボスは フィールドの 版、県ボスは 後半の すがたも）', () => {
    for (const m of c.monsters.values()) {
      expect(MONSTER_DESIGNS[m.id], m.id).toBeDefined();
      if ([...c.areas.values()].some((a) => a.midBoss === m.id))
        expect(MONSTER_DESIGNS[`${m.id}.field`], `${m.id}.field`).toBeDefined();
      if ([...c.areas.values()].some((a) => a.boss === m.id))
        expect(MONSTER_DESIGNS[`${m.id}.p0`], `${m.id}.p0`).toBeDefined();
    }
  });

  it('大きさが種類の規格どおり', () => {
    for (const [key, d] of entries) {
      expect(d.size, key).toBe(expectedSize(key));
      for (const layer of d.layers) {
        const w = layer.mirror ? d.size / 2 : d.size;
        for (const row of layer.rows) expect((layer.x ?? 0) + row.length, key).toBeLessThanOrEqual(w);
        expect((layer.y ?? 0) + layer.rows.length, key).toBeLessThanOrEqual(d.size);
      }
    }
  });

  it('色は NQ-48 だけ、色数は上限まで（通常・フィールド 12、ボス 15）', () => {
    for (const [key, d] of entries) {
      const cs = colorsOf(grids.get(key)!);
      expect(
        [...cs].filter((color) => !palette.has(color)),
        key,
      ).toEqual([]);
      const limit = d.size <= 32 ? 12 : 15;
      expect(cs.size, key).toBeLessThanOrEqual(limit);
    }
  });

  it('外周の輪郭が切れていない（キャンバスのふちに付く色は ink だけ）', () => {
    for (const [key, d] of entries) {
      const g = grids.get(key)!;
      const S = d.size;
      const invalid = Array.from({ length: S }, (_, i) => [
        g[0]![i],
        g[S - 1]![i],
        g[i]![0],
        g[i]![S - 1],
      ]).flatMap((colors, i) => colors.filter((color) => color && color !== NQ.ink).map(() => i));
      expect(invalid, key).toEqual([]);
    }
  });

  it('足もとは下端から 0〜2 ドット', () => {
    for (const [key, d] of entries) {
      const g = grids.get(key)!;
      const lowest = g.reduce((low, row, y) => (row.some(Boolean) ? y : low), -1);
      expect(d.size - 1 - lowest, key).toBeLessThanOrEqual(2);
    }
  });

  it('中ボス・県ボスは王冠のしるし（金と赤い宝石）がある', () => {
    for (const [key, d] of entries) {
      const m = c.monsters.get(baseId(key))!;
      if (!m.isBoss || (!c.areas.has(m.area) && c.world.islands.some((i) => i.id === m.area))) continue;
      const cs = colorsOf(grids.get(key)!);
      expect(cs.has(NQ.gold) && cs.has(NQ.red), key).toBe(true);
    }
  });
});
