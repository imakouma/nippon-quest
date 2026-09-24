/**
 * 手描きモンスターの「文字の地図」を Grid にする。docs/06_ART_BIBLE.md §4 の規格どおり：
 *  - 外周 1px の ink は自動で付ける（地図には描かない。外周 1 ドットは '.' で空けておく）
 *  - 'o' は ink（目・口・内側の線）。'.' は透明。ほかの文字は colors の色（NQ-48 だけ）
 *  - mirror のレイヤーは左半分だけ書く。右半分は左右反転で作る（正面の敵は左右ほぼ対称）
 *  - rim：左右対称に描いたあとで「光は左上から」にするため、右半分の右のふちと、下のふちを かげ色にする
 */
import { makeGrid, outline, put, type Grid } from '../grid';
import { NQ } from '../palette';

export interface Layer {
  /** 文字の地図。mirror のときは左半分（幅 size/2）だけ */
  rows: readonly string[];
  /** 左上の位置（ドット）。mirror のときも左半分の位置で書く（右は自動で反転） */
  x?: number;
  y?: number;
  mirror?: boolean;
}

export interface MonsterDesign {
  /** キャンバス 1 辺（MONSTER_SIZE：通常 32 / 中ボス 40 / 県ボス 48 / 地方ボス 56、フィールドの中ボス 32） */
  size: number;
  /** 文字 → 色。'o' を書かなければ ink */
  colors: Readonly<Record<string, string>>;
  /** 下から順に重ねる */
  layers: readonly Layer[];
  /** ふちを かげにする色（ベース → かげ）。ふち＝となりが透明か、別の rim の色 */
  rim?: Readonly<Record<string, string>>;
  /** かげの太さ（ドット）。大きいボスは 2 */
  rimDepth?: number;
}

export function designGrid(d: MonsterDesign): Grid {
  const S = d.size;
  const g = makeGrid(S, S);
  for (const layer of d.layers) {
    const ox = layer.x ?? 0;
    const oy = layer.y ?? 0;
    layer.rows.forEach((row, ry) =>
      [...row].forEach((ch, rx) => {
        if (ch === '.') return;
        const col = d.colors[ch] ?? (ch === 'o' ? NQ.ink : undefined);
        if (!col) throw new Error(`monster design: 色の無い文字 "${ch}"（${ry} 行目）`);
        put(g, ox + rx, oy + ry, col);
        if (layer.mirror) put(g, S - 1 - (ox + rx), oy + ry, col);
      }),
    );
  }
  if (d.rim) shadeRim(g, d.rim, d.rimDepth ?? 1);
  outline(g, NQ.ink);
  return g;
}

function shadeRim(g: Grid, rim: Readonly<Record<string, string>>, depth: number): void {
  const src = g.map((r) => [...r]);
  const w = g[0]!.length;
  const same = (c: string, n: string | null | undefined) => n === c || n === rim[c];
  const edge = (c: string, n: string | null | undefined) => !n || (n in rim && !same(c, n));
  for (let y = 0; y < src.length; y++)
    for (let x = 0; x < w; x++) {
      const c = src[y]![x];
      if (!c || !(c in rim)) continue;
      for (let k = 1; k <= depth; k++)
        if (edge(c, src[y + k]?.[x]) || (x >= w / 2 && edge(c, src[y]![x + k]))) {
          g[y]![x] = rim[c]!;
          break;
        }
    }
}

/** 使っている色（透明をのぞく、ink こみ）。docs/06 §2.3 の色数の上限チェック用 */
export function colorsOf(g: Grid): Set<string> {
  const s = new Set<string>();
  for (const row of g) for (const c of row) if (c) s.add(c);
  return s;
}
