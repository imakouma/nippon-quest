/**
 * バトルの エフェクトの ドット絵（×4 で表示）。色は NQ-48 だけ。docs/06 §4：外周 1px の ink（光る もの・白い 形は 輪郭なし）。
 *  - 火の玉・水の しずく・葉っぱ・岩・やみの 玉・土けむり・小石：属性の色で 描いて ink の 輪郭
 *  - 風の 刃・光の 柱・属性の かけら（火の粉・あわ・葉・風・きらめき・やみの ほのお）：輪郭なし（光って 見えるように）
 *  - 光の わ・星・こうげきの 形（ひっかき・かみつき・つき・ななめ切り・×・回転切り・地ひびき）：白。Phaser 側で 属性の色を つける
 */
import { makeGrid, outline, paint, put, toCanvas, type Grid } from '../art/grid';
import { NQ } from '../art/palette';

export type FxKind =
  | 'fireball'
  | 'drop'
  | 'leaf'
  | 'rock'
  | 'orb'
  | 'dust'
  | 'wind'
  | 'beam'
  | 'ring'
  | 'spark'
  | 'claw'
  | 'bite'
  | 'thrust'
  | 'diag'
  | 'cross'
  | 'spin'
  | 'shock'
  | 'ember'
  | 'bubble'
  | 'leafbit'
  | 'pebble'
  | 'gust'
  | 'twinkle'
  | 'wisp';

export const FX_KINDS: readonly FxKind[] = [
  'fireball',
  'drop',
  'leaf',
  'rock',
  'orb',
  'dust',
  'wind',
  'beam',
  'ring',
  'spark',
  'claw',
  'bite',
  'thrust',
  'diag',
  'cross',
  'spin',
  'shock',
  'ember',
  'bubble',
  'leafbit',
  'pebble',
  'gust',
  'twinkle',
  'wisp',
];

interface Pixmap {
  rows: readonly string[];
  colors: Readonly<Record<string, string>>;
  /** ink の 輪郭を つけるか */
  ink: boolean;
}

const MAPS: Readonly<Partial<Record<FxKind, Pixmap>>> = {
  fireball: {
    rows: ['..vvvv..', '.vaaaav.', 'vaaccaav', 'vaccccav', 'vaccccav', 'vaaccaav', '.vaaaav.', '..vvvv..'],
    colors: { v: NQ.vermilion, a: NQ.apricot, c: NQ.cream },
    ink: true,
  },
  drop: {
    rows: ['...b...', '..bbb..', '..bbb..', '.bbsbb.', '.bsibb.', 'bbsibbb', 'bbbbbbb', '.bbbbb.', '..bbb..'],
    colors: { b: NQ.azure, s: NQ.sky, i: NQ.ice },
    ink: true,
  },
  leaf: {
    rows: ['.....ll.', '...llllg', '.llllgl.', 'lllglll.', 'lgglll..', '.ll.....'],
    colors: { l: NQ.leaf, g: NQ.green },
    ink: true,
  },
  rock: {
    rows: [
      '...tttt...',
      '..tsstbt..',
      '.tsstttbt.',
      'tsttttttbt',
      'tttttttbbt',
      'ttttttbbbt',
      '.tbbbbbbt.',
      '..tttttt..',
    ],
    colors: { t: NQ.tan, s: NQ.sand, b: NQ.brown },
    ink: true,
  },
  orb: {
    rows: ['..iiii..', '.ivvvvi.', 'ivvllvvi', 'ivllllvi', 'ivllllvi', 'ivvllvvi', '.ivvvvi.', '..iiii..'],
    colors: { i: NQ.indigo, v: NQ.violet, l: NQ.lavender },
    ink: true,
  },
  dust: {
    rows: ['..cc....', '.cwwcc..', 'cwwwwwc.', 'ccwwwwcc', '.cccccc.'],
    colors: { c: NQ.cloud, w: NQ.white },
    ink: true,
  },
  wind: {
    rows: [
      '.........mww',
      '.......mmww.',
      '.....mmww...',
      '...mmww.....',
      '..mww.......',
      '.mw.........',
      'mw..........',
    ],
    colors: { m: NQ.mint, w: NQ.white },
    ink: false,
  },
  spark: {
    rows: [
      '....w....',
      '....w....',
      '...www...',
      '..wwwww..',
      'wwwwwwwww',
      '..wwwww..',
      '...www...',
      '....w....',
      '....w....',
    ],
    colors: { w: NQ.white },
    ink: false,
  },
  // ── こうげきの 形（白）
  bite: {
    rows: [
      '.wwwwwwwwwwwww.',
      'wwwwwwwwwwwwwww',
      '.w..w..w..w..w.',
      '...............',
      '...............',
      '.w..w..w..w..w.',
      'wwwwwwwwwwwwwww',
      '.wwwwwwwwwwwww.',
    ],
    colors: { w: NQ.white },
    ink: false,
  },
  thrust: {
    rows: [
      '....wwwwwwwwwwwwwwwwwww....',
      '..wwwwwwwwwwwwwwwwwwwwwww..',
      'wwwwwwwwwwwwwwwwwwwwwwwwwww',
      '..wwwwwwwwwwwwwwwwwwwwwww..',
      '....wwwwwwwwwwwwwwwwwww....',
    ],
    colors: { w: NQ.white },
    ink: false,
  },
  // ── 属性の かけら（当たったときに ちる・必殺技の ためで あつまる）
  ember: {
    rows: ['..a..', '.aya.', 'ayyya', 'avyva', '.vvv.'],
    colors: { a: NQ.apricot, y: NQ.cream, v: NQ.vermilion },
    ink: false,
  },
  bubble: {
    rows: ['.sss.', 'sw..s', 's...s', 's...s', '.sss.'],
    colors: { s: NQ.sky, w: NQ.white },
    ink: false,
  },
  leafbit: {
    rows: ['...ll', '.lllg', 'llgl.', '.l...'],
    colors: { l: NQ.leaf, g: NQ.green },
    ink: false,
  },
  pebble: {
    rows: ['.tt.', 'tsbt', 'tbbt', '.tt.'],
    colors: { t: NQ.tan, s: NQ.sand, b: NQ.brown },
    ink: true,
  },
  gust: {
    rows: ['...mmww', 'mmww...'],
    colors: { m: NQ.mint, w: NQ.white },
    ink: false,
  },
  twinkle: {
    rows: ['..c..', '..w..', 'cwwwc', '..w..', '..c..'],
    colors: { c: NQ.cream, w: NQ.white },
    ink: false,
  },
  wisp: {
    rows: ['.l..', '.ll.', 'lvl.', 'lvvl', '.vv.', '.i..'],
    colors: { l: NQ.lavender, v: NQ.violet, i: NQ.indigo },
    ink: false,
  },
};

function fromMap(m: Pixmap): Grid {
  const pad = m.ink ? 1 : 0;
  const g = makeGrid(m.rows[0]!.length + pad * 2, m.rows.length + pad * 2);
  paint(g, m.rows, m.colors, pad, pad);
  if (m.ink) outline(g, NQ.ink);
  return g;
}

/** 光の わ：16×16、太さ 2 の 白い 円（色は Phaser でつける） */
function ring(): Grid {
  const g = makeGrid(16, 16);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      if (d >= 5.6 && d <= 7.6) put(g, x, y, NQ.white);
    }
  return g;
}

/** 光の 柱：12×48。ふちは 黄、まん中ほど 白い（下の はしを 足もとに 立てて、たてに のばして 使う） */
function beam(): Grid {
  const g = makeGrid(12, 48);
  const cols = [
    null,
    NQ.yellow,
    NQ.cream,
    NQ.cream,
    NQ.white,
    NQ.white,
    NQ.white,
    NQ.white,
    NQ.cream,
    NQ.cream,
    NQ.yellow,
    null,
  ];
  for (let y = 0; y < 48; y++) cols.forEach((c, x) => c && put(g, x, y, c));
  return g;
}

/** ひっかき：右上 → 左下の 3 本の すじ（まん中は 少し 上。はしは 細い） */
function claw(): Grid {
  const g = makeGrid(18, 16);
  for (let k = 0; k < 3; k++)
    for (let t = 0; t < 12; t++) {
      const x = Math.round(9 + k * 3 - t * 0.55);
      const y = 2 + t - (k === 1 ? 1 : 0);
      put(g, x, y, NQ.white);
      if (t > 1 && t < 10) put(g, x + 1, y, NQ.white);
    }
  return g;
}

/** ななめ切り：左上 → 右下の 1 本（はしは 細い）。左右反転で もう 1 本 */
function diag(): Grid {
  const g = makeGrid(20, 20);
  for (let t = 1; t < 19; t++) {
    put(g, t, t, NQ.white);
    if (t > 3 && t < 16) put(g, t + 1, t, NQ.white);
  }
  return g;
}

/** ×：ななめ切りを 2 本 かさねた 形（会心の 一撃） */
function cross(): Grid {
  const g = diag();
  const w = g[0]!.length;
  diag().forEach((row, y) => row.forEach((c, x) => c && put(g, w - 1 - x, y, c)));
  return g;
}

/** 回転切り：太さが だんだん 細くなる、すきまの ある 円 */
function spin(): Grid {
  const g = makeGrid(28, 28);
  const a0 = 0.35;
  const a1 = Math.PI * 2 - 0.2;
  for (let y = 0; y < 28; y++)
    for (let x = 0; x < 28; x++) {
      let a = Math.atan2(y - 13.5, x - 13.5);
      if (a < 0) a += Math.PI * 2;
      if (a < a0 || a > a1) continue;
      const f = (a - a0) / (a1 - a0);
      const d = Math.hypot(x - 13.5, y - 13.5);
      if (d <= 13.5 && d >= 13.5 - (1 + 3 * (1 - f))) put(g, x, y, NQ.white);
    }
  return g;
}

/** 地ひびき：足もとに ひろがる たいらな わ（40×8 の だ円） */
function shock(): Grid {
  const g = makeGrid(40, 8);
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 40; x++) {
      const e = ((x - 19.5) / 19.5) ** 2 + ((y - 3.5) / 3.5) ** 2;
      if (e >= 0.55 && e <= 1) put(g, x, y, NQ.white);
    }
  return g;
}

const DRAWN: Readonly<Partial<Record<FxKind, () => Grid>>> = { ring, beam, claw, diag, cross, spin, shock };

/** エフェクトの ドット絵（Canvas に する 前。テストで 色を しらべる） */
export function fxGrid(kind: FxKind): Grid {
  const draw = DRAWN[kind];
  return draw ? draw() : fromMap(MAPS[kind]!);
}

export function fxArt(kind: FxKind): HTMLCanvasElement {
  return toCanvas(fxGrid(kind));
}
