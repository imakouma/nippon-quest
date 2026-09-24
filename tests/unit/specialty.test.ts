import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { specialtiesOf, specialtyIndex, withSpecialtyDrops } from '../../src/core/progression/specialty';

describe('特産品のドロップ', () => {
  it('県の特産品は food・craft の motif で、<県>-<motif id> のどうぐがあるもの', async () => {
    const c = await content();
    const list = specialtiesOf(c.areas.get('aomori')!, c.items);
    expect(list.length).toBeGreaterThan(0);
    for (const s of list) {
      expect(['food', 'craft']).toContain(s.motif.kind);
      expect(s.item.id).toBe(`aomori-${s.motif.id}`);
    }
  });

  it('モンスターは その県の特産品を 合わせて rate の確率で落とす（もとのドロップは残す・二重にしない）', async () => {
    const c = await content();
    const rate = c.settings.specialtyDropRate;
    const mons = withSpecialtyDrops(c.monsters, c.areas, c.items, rate);
    const before = c.monsters.get('aomori-ringoron')!;
    const after = mons.get('aomori-ringoron')!;
    // もとのドロップ（りんご 40% など）は そのまま
    for (const d of before.drops) expect(after.drops).toContainEqual(d);
    const ids = after.drops.map((d) => d.itemId);
    expect(new Set(ids).size).toBe(ids.length);
    const added = after.drops.filter((d) => !before.drops.some((b) => b.itemId === d.itemId));
    expect(added.length).toBeGreaterThan(0);
    for (const d of added) expect(d.itemId.startsWith('aomori-')).toBe(true);
    const total = added.reduce((a, d) => a + d.rate, 0);
    expect(total).toBeCloseTo(rate, 2);
    // 元の Map は書き換えない
    expect(c.monsters.get('aomori-ringoron')!.drops).toEqual(before.drops);
  });

  it('ドロップした どうぐが 特産品なら、説明（motif の blurb）が引ける', async () => {
    const c = await content();
    const idx = specialtyIndex(c.areas, c.items);
    const s = idx.get('aomori-ringo')!;
    expect(s.motif.id).toBe('ringo');
    expect(s.motif.blurb.length).toBeGreaterThan(0);
    expect(idx.has('common-yakusou')).toBe(false);
  });
});
