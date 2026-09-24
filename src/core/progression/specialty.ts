/**
 * 特産品（県の motif のうち kind が food・craft で、content/items に <県>-<motif id> のどうぐがあるもの）。純粋関数のみ。
 * 特産品は フィールドの宝箱のほか、その県のモンスターを たおしたときの ドロップでも 手に入る。
 */
import type { Area, Item, Monster, Motif } from '../content/schemas';

export interface Specialty {
  item: Item;
  motif: Motif;
}

/** その県の特産品（どうぐ と、説明を持つ motif） */
export function specialtiesOf(area: Area, items: ReadonlyMap<string, Item>): Specialty[] {
  return area.motifs.flatMap((motif) => {
    if (motif.kind !== 'food' && motif.kind !== 'craft') return [];
    const item = items.get(`${area.id}-${motif.id}`);
    return item ? [{ item, motif }] : [];
  });
}

/** どうぐの id → 特産品（どの県のどの motif か）。ドロップしたときに説明を出すのに使う */
export function specialtyIndex(
  areas: ReadonlyMap<string, Area>,
  items: ReadonlyMap<string, Item>,
): Map<string, Specialty> {
  const out = new Map<string, Specialty>();
  for (const area of areas.values()) for (const s of specialtiesOf(area, items)) out.set(s.item.id, s);
  return out;
}

/**
 * モンスターのドロップに、そのモンスターの県の特産品を足した monsters を返す（元の Map は書き換えない）。
 * 合わせて rate の確率（1 つあたり rate / 特産品の数）。もともとドロップにある特産品は そのまま（二重にしない）。
 * 地方ボス（area が島の id）は県が無いので足さない。
 */
export function withSpecialtyDrops(
  monsters: ReadonlyMap<string, Monster>,
  areas: ReadonlyMap<string, Area>,
  items: ReadonlyMap<string, Item>,
  rate: number,
): Map<string, Monster> {
  const out = new Map<string, Monster>();
  for (const [id, m] of monsters) {
    const area = areas.get(m.area);
    const list = area
      ? specialtiesOf(area, items).filter((s) => !m.drops.some((d) => d.itemId === s.item.id))
      : [];
    if (!list.length || rate <= 0) {
      out.set(id, m);
      continue;
    }
    const each = Math.round((rate / list.length) * 1000) / 1000;
    out.set(id, { ...m, drops: [...m.drops, ...list.map((s) => ({ itemId: s.item.id, rate: each }))] });
  }
  return out;
}
