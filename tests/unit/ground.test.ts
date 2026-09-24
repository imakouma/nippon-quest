import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { zoneForGround } from '../../src/core/battle/setup';
import { loadContent, type ContentIndex } from '../../src/core/content/loader';
import { GROUND_TILES, GROUNDS, groundOfTile, type Ground } from '../../src/core/world/ground';
import { read } from './helpers';

const MAPS = fileURLToPath(new URL('../../maps/', import.meta.url));
const background = (mapKey: string): number[] =>
  (
    JSON.parse(readFileSync(`${MAPS}${mapKey}.json`, 'utf8')) as {
      layers: { name: string; data?: number[] }[];
    }
  ).layers.find((l) => l.name === 'background')?.data ?? [];

let c: ContentIndex;
beforeAll(async () => {
  c = await loadContent(read);
});

describe('フィールドの 地面の 性質（docs/00 §2.2）', () => {
  it('地面の タイルは ほかの 地面と かさならず、水や 町の タイルは 地面で ない', () => {
    const all = GROUNDS.flatMap((g) => [...GROUND_TILES[g]]);
    expect(new Set(all).size).toBe(all.length);
    for (const g of GROUNDS) for (const t of GROUND_TILES[g]) expect(groundOfTile(t)).toBe(g);
    expect(groundOfTile(3)).toBeNull();
    expect(groundOfTile(5)).toBeNull();
    expect(groundOfTile(undefined)).toBeNull();
  });

  it('フィールドでは 地面の 出現表。くさはら・表の 無い 地面は field、ダンジョンは そのまま', () => {
    const aomori = c.areas.get('aomori')!;
    expect(zoneForGround(aomori, 'field', 'beach')).toBe('beach');
    expect(zoneForGround(aomori, 'field', 'forest')).toBe('forest');
    expect(zoneForGround(aomori, 'field', 'grass')).toBe('field');
    expect(zoneForGround(aomori, 'field', null)).toBe('field');
    expect(zoneForGround(aomori, 'dungeon', 'beach')).toBe('dungeon');
    // 秋田は すなはまの 表が 無いので、くさはらの 表
    expect(zoneForGround(c.areas.get('akita')!, 'field', 'beach')).toBe('field');
  });

  it('県の フィールドの 陸は どの マスも どれかの 地面（3 は 海・湖・県の外）', () => {
    for (const a of c.areas.values()) {
      if (!a.mapKeys) continue;
      const bad = background(a.mapKeys.field).filter((t) => t !== 3 && !groundOfTile(t));
      expect(bad, a.id).toEqual([]);
    }
  });

  it('地面の 出現表が ある 県は、その 地面が フィールドに ある（出番の ない 表を 作らない）', () => {
    for (const a of c.areas.values()) {
      if (!a.mapKeys) continue;
      const here = new Set(background(a.mapKeys.field).map(groundOfTile));
      for (const e of a.encounters) {
        if (e.zone === 'field' || e.zone === 'dungeon') continue;
        expect(GROUNDS, `${a.id}: ${e.zone}`).toContain(e.zone);
        expect(here.has(e.zone as Ground), `${a.id}: ${e.zone}`).toBe(true);
      }
    }
  });

  it('どの 県も、フィールドの 3% 以上を しめる もり・やま・たはた には 出現表が あり、くさはらと 顔ぶれが ちがう', () => {
    for (const a of c.areas.values()) {
      if (!a.mapKeys) continue;
      const land = background(a.mapKeys.field)
        .map(groundOfTile)
        .filter((g): g is Ground => g !== null);
      const who = (zone: string) =>
        a.encounters
          .find((e) => e.zone === zone)
          ?.table.map((t) => t.monsterId)
          .sort()
          .join(',');
      for (const g of ['forest', 'mountain', 'farm'] as const) {
        if (land.filter((x) => x === g).length / land.length < 0.03) continue;
        expect(who(g), `${a.id}: ${g}`).toBeDefined();
        expect(who(g), `${a.id}: ${g}`).not.toBe(who('field'));
      }
    }
  });

  it('東北の 県は もり・やま・たはたの 出現表が あり、くさはらと 顔ぶれが ちがう', () => {
    const tohoku = c.world.islands.find((i) => i.id === 'tohoku')!;
    for (const id of tohoku.areas) {
      const a = c.areas.get(id)!;
      const who = (zone: string) =>
        a.encounters
          .find((e) => e.zone === zone)
          ?.table.map((t) => t.monsterId)
          .sort()
          .join(',');
      for (const g of ['forest', 'mountain', 'farm']) {
        expect(who(g), `${id}: ${g}`).toBeDefined();
        expect(who(g), `${id}: ${g}`).not.toBe(who('field'));
      }
    }
  });
});
