/**
 * バトルの仮ドット絵（本番の PNG が assets/ に揃うまでのプレースホルダ）。色は NQ-48 だけ。
 * - モンスター：id をシードに、属性ごとの形・色で左右対称のドット絵を自動生成（同じ id なら毎回同じ絵）
 *   大きさは docs/06：通常 32 / 中ボス 40 / 県ボス 48 / 地方ボス 56（×4 表示）
 * - 背景：240×135 で描いて 4 倍表示（960×540）。サイドビュー用に、手前に道の帯（ここにみんなが立つ）
 * - エフェクト：斬撃・パーティクル・足もとのかげ
 * 本番画像を Phaser に同じキー（mon.<id> など）で読み込めば、そちらが優先される（Battle.ts 参照）。
 */
import type { Element } from '../../core/content/schemas';
import { createRng, type Rng } from '../../core/rng';
import { makeGrid, outline, put, putSym, sheetCanvas, toCanvas, type Grid } from '../grid';
import { NQ } from '../palette';

export const OUTLINE = NQ.ink;

export interface Palette {
  base: string;
  light: string;
  dark: string;
  accent: string;
}

export const ELEMENT_PALETTE: Record<Element, Palette> = {
  hino: { base: NQ.vermilion, light: NQ.apricot, dark: NQ.brick, accent: NQ.gold },
  mizu: { base: NQ.azure, light: NQ.sky, dark: NQ.blue, accent: NQ.ice },
  mori: { base: NQ.leaf, light: NQ.lime, dark: NQ.green, accent: NQ.sprout },
  tsuchi: { base: NQ.tan, light: NQ.sand, dark: NQ.brown, accent: NQ.beige },
  kaze: { base: NQ.aqua, light: NQ.mint, dark: NQ.teal, accent: NQ.white },
  hikari: { base: NQ.yellow, light: NQ.cream, dark: NQ.ochre, accent: NQ.white },
  yami: { base: NQ.violet, light: NQ.lavender, dark: NQ.indigo, accent: NQ.gold },
  none: { base: NQ.silver, light: NQ.cloud, dark: NQ.slate, accent: NQ.white },
};

/** 属性の代表色（エフェクト・パーティクルの色付け用） */
export const ELEMENT_FX: Record<Element, number> = {
  hino: 0xff9e5e,
  mizu: 0x80c6ff,
  mori: 0x8fe36f,
  tsuchi: 0xe2b27a,
  kaze: 0xa4f0e2,
  hikari: 0xfff3a3,
  yami: 0xa28be6,
  none: 0xffffff,
};

/** モンスターのキャンバスの大きさ（ドット） */
export const MONSTER_SIZE = { normal: 32, midBoss: 40, boss: 48, islandBoss: 56 } as const;

type Shape = 'round' | 'tall' | 'block' | 'bird';
const SHAPE: Record<Element, Shape> = {
  hino: 'tall',
  yami: 'tall',
  mizu: 'round',
  mori: 'round',
  hikari: 'round',
  none: 'round',
  tsuchi: 'block',
  kaze: 'bird',
};

export interface MonsterArtOptions {
  element: Element;
  /** 1 辺のドット数（MONSTER_SIZE） */
  size: number;
  boss?: boolean;
  /** 後ろ姿。顔を描かない */
  back?: boolean;
}

export function monsterArt(id: string, o: MonsterArtOptions): HTMLCanvasElement {
  const rng = createRng(`sprite:${id}`);
  const S = o.size;
  const pal = ELEMENT_PALETTE[o.element];
  const shape = SHAPE[o.element];
  const g = makeGrid(S, S);
  const cx = (S - 1) / 2;

  let rx = S * (0.29 + rng.next() * 0.07);
  let ry = S * (0.25 + rng.next() * 0.07);
  if (shape === 'tall') {
    rx *= 0.82;
    ry *= 1.2;
  }
  if (shape === 'bird') rx *= 0.85;
  const top = o.boss ? 9 : 7;
  const cy = Math.max(top + ry, S - 4 - ry);

  const inBody = (x: number, y: number): boolean => {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    if (shape === 'block') {
      const ax = Math.abs(x - cx);
      const ay = Math.abs(y - cy);
      const corner = ax > rx - 2 && ay > ry - 2;
      return ax <= rx && ay <= ry && !corner;
    }
    return dx * dx + dy * dy <= 1;
  };

  // からだ（陰影は左上が明るく、右下が暗い）
  const hasBelly = rng.chance(0.6);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      if (!inBody(x, y)) continue;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const shade = dx * 0.35 + dy * 0.85;
      let col = shade < -0.55 ? pal.light : shade > 0.5 ? pal.dark : pal.base;
      const bx = (x - cx) / (rx * 0.55);
      const by = (y - (cy + ry * 0.35)) / (ry * 0.5);
      if (hasBelly && !o.back && bx * bx + by * by <= 1) col = shade > 0.7 ? pal.base : pal.accent;
      put(g, x, y, col);
    }

  // あし
  const footX = Math.round(cx - rx * 0.5);
  const footY = Math.round(cy + ry) - 1;
  for (let fx = 0; fx < 3; fx++)
    for (let fy = 0; fy < 3; fy++) putSym(g, footX + fx - 1, footY + fy, fy === 2 ? pal.dark : pal.base);

  // でっぱり（耳・角）
  const bumps = rng.int(0, 2);
  for (let b = 0; b < bumps; b++) {
    const ang = -Math.PI / 2 - (0.4 + rng.next() * 0.8);
    const bx = cx + Math.cos(ang) * rx * 0.9;
    const by = cy + Math.sin(ang) * ry * 0.9;
    const r = 1.2 + rng.next() * 1.3;
    for (let y = Math.floor(by - r); y <= by + r; y++)
      for (let x = Math.floor(bx - r); x <= bx + r; x++)
        if ((x - bx) ** 2 + (y - by) ** 2 <= r * r) putSym(g, x, y, pal.base);
  }

  // もよう（左右対称の水玉）
  if (!o.back || rng.chance(0.5)) {
    const spots = rng.int(0, 3);
    for (let s = 0; s < spots; s++) {
      const sx = Math.round(cx - rng.next() * rx * 0.8);
      const sy = Math.round(cy - ry * 0.2 + (rng.next() - 0.5) * ry);
      if (inBody(sx, sy) && inBody(sx + 1, sy)) {
        putSym(g, sx, sy, pal.dark);
        if (rng.chance(0.5)) putSym(g, sx, sy + 1, pal.dark);
      }
    }
  }

  drawFeature(g, o.element, pal, cx, cy, rx, ry, rng);

  if (!o.back) drawFace(g, o.element, cx, cy, rx, ry, S, rng);
  if (o.boss) drawCrown(g, cx, Math.round(cy - ry) - 1);

  outline(g, OUTLINE);
  return toCanvas(g);
}

function drawFeature(
  g: Grid,
  el: Element,
  pal: Palette,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rng: Rng,
) {
  const topY = Math.round(cy - ry);
  const mid = Math.floor(cx);
  switch (el) {
    case 'hino': {
      // あたまの炎
      const flames = [
        [0, 5],
        [-3, 3],
        [3, 3],
      ] as const;
      for (const [off, h] of flames)
        for (let i = 0; i < h; i++) {
          const col = i < 1 ? NQ.cream : i < 3 ? pal.accent : pal.light;
          put(g, mid + off, topY - i, col);
          put(g, mid + off + 1, topY - i, col);
          if (i < h - 2) put(g, mid + off - (off <= 0 ? 1 : -2), topY - i, pal.light);
        }
      break;
    }
    case 'mizu':
      // ひれ
      for (let i = 0; i < 4; i++)
        for (let w = -Math.max(0, 2 - i); w <= Math.max(0, 2 - i); w++)
          put(g, mid + w + (w >= 0 ? 1 : 0), topY - i, pal.light);
      for (let y = Math.round(cy - 1); y < cy + 3; y++) putSym(g, Math.round(cx - rx) - 1, y, pal.light);
      break;
    case 'mori':
      // ヘタと葉っぱ
      for (let i = 1; i <= 3; i++) put(g, mid + 1, topY - i, NQ.brown);
      for (let x = 0; x < 4; x++)
        for (let y = 0; y < 2; y++)
          put(g, mid + 2 + x, topY - 2 - y + (x === 3 ? 1 : 0), x === 0 ? NQ.green : NQ.lime);
      break;
    case 'kaze':
      // つばさ
      for (let i = 0; i < 6; i++)
        for (let j = 0; j <= Math.floor(i / 2); j++)
          putSym(g, Math.round(cx - rx) - i, Math.round(cy) - 2 + j + i, i % 2 ? pal.light : pal.accent);
      break;
    case 'hikari':
      // わっか
      for (let x = -3; x <= 4; x++) {
        put(g, mid + x, topY - 4, pal.accent);
        if (x === -3 || x === 4) put(g, mid + x, topY - 3, pal.accent);
      }
      break;
    case 'yami':
      // とがった耳
      for (let i = 0; i < 5; i++)
        for (let w = 0; w <= Math.floor((4 - i) / 2); w++)
          putSym(g, Math.round(cx - rx * 0.55) + w, topY + 2 - i, pal.dark);
      break;
    case 'tsuchi':
      // ひび模様
      for (let i = 0; i < 4; i++)
        putSym(g, Math.round(cx - rx * 0.6) + (i % 2), Math.round(cy + 1) + i, pal.dark);
      if (rng.chance(0.5)) for (let x = -2; x <= 3; x++) put(g, mid + x, Math.round(cy + ry * 0.6), pal.dark);
      break;
    case 'none':
      break;
  }
}

function drawFace(g: Grid, el: Element, cx: number, cy: number, rx: number, ry: number, S: number, rng: Rng) {
  const big = S >= 40;
  const ew = big ? 3 : 2;
  const eh = big ? 4 : 3;
  const ey = Math.round(cy - ry * 0.25) - 1;
  const gap = Math.max(2, Math.round(rx * (0.34 + rng.next() * 0.12)));
  const ex = Math.round(cx - gap - ew / 2);
  const white = el === 'yami' ? NQ.gold : NQ.white;
  const square = el === 'tsuchi';
  for (let x = 0; x < ew; x++)
    for (let y = 0; y < eh; y++) {
      if (!square && big && (x === 0 || x === ew - 1) && (y === 0 || y === eh - 1)) continue;
      putSym(g, ex + x, ey + y, white);
    }
  // ひとみ（内側・下寄せ）
  for (let y = 1; y < eh; y++) putSym(g, ex + ew - 1, ey + y, OUTLINE);
  if (big) putSym(g, ex + ew - 2, ey + eh - 1, OUTLINE);
  // ほっぺ
  putSym(g, ex - 1, ey + eh, NQ.blush);
  // くち
  const my = ey + eh + 1;
  const mid = Math.floor(cx);
  const style = rng.int(0, 2);
  if (style === 0) {
    put(g, mid - 1, my, OUTLINE);
    put(g, mid + 2, my, OUTLINE);
    put(g, mid, my + 1, OUTLINE);
    put(g, mid + 1, my + 1, OUTLINE);
  } else if (style === 1) {
    put(g, mid, my, OUTLINE);
    put(g, mid + 1, my, OUTLINE);
    put(g, mid, my + 1, NQ.berry);
    put(g, mid + 1, my + 1, NQ.berry);
  } else {
    for (let x = -1; x <= 2; x++) put(g, mid + x, my, OUTLINE);
    put(g, mid - 1, my + 1, NQ.white);
    put(g, mid + 2, my + 1, NQ.white);
  }
}

function drawCrown(g: Grid, cx: number, baseY: number) {
  const mid = Math.floor(cx);
  for (let x = -4; x <= 5; x++) {
    put(g, mid + x, baseY, NQ.ochre);
    put(g, mid + x, baseY - 1, NQ.gold);
  }
  for (const sx of [-4, 0, 1, 5]) {
    put(g, mid + sx, baseY - 2, NQ.gold);
    put(g, mid + sx, baseY - 3, NQ.gold);
  }
  put(g, mid - 1, baseY - 2, NQ.gold);
  put(g, mid + 2, baseY - 2, NQ.gold);
  put(g, mid, baseY - 1, NQ.red);
  put(g, mid + 1, baseY - 1, NQ.red);
}

// ───────────────────────── 背景（240×135 → 4 倍、サイドビュー） ─────────────────────────
/** field は くさはら。forest〜farm は フィールドの 地面（src/core/world/ground.ts）ごとの 背景 */
export type BackdropKind = 'field' | 'dungeon' | 'boss' | 'forest' | 'mountain' | 'beach' | 'shore' | 'farm';
export const BACKDROP_SCALE = 4;
const W = 240;
const H = 135;
/** 地平線の高さと、みんなが立つ道の帯（ドット単位） */
const HORIZON = 64;
const PATH_TOP = 82;
const PATH_BOTTOM = 97;

interface BackdropPalette {
  sky: string[];
  far: string;
  farTop: string;
  near: string;
  nearTop: string;
  ground: [string, string];
  path: [string, string];
}

const BACKDROPS: Record<BackdropKind, BackdropPalette> = {
  field: {
    sky: [NQ.azure, NQ.sky, NQ.ice],
    far: NQ.blue,
    farTop: NQ.azure,
    near: NQ.green,
    nearTop: NQ.leaf,
    ground: [NQ.lime, NQ.leaf],
    path: [NQ.sand, NQ.tan],
  },
  dungeon: {
    sky: [NQ.ink, NQ.night, NQ.indigo],
    far: NQ.indigo,
    farTop: NQ.violet,
    near: NQ.night,
    nearTop: NQ.indigo,
    ground: [NQ.night, NQ.slate],
    path: [NQ.slate, NQ.gray],
  },
  boss: {
    sky: [NQ.indigo, NQ.berry, NQ.vermilion, NQ.apricot],
    far: NQ.night,
    farTop: NQ.indigo,
    near: NQ.ink,
    nearTop: NQ.night,
    ground: [NQ.night, NQ.indigo],
    path: [NQ.brown, NQ.bark],
  },
  forest: {
    sky: [NQ.sky, NQ.ice],
    far: NQ.green,
    farTop: NQ.leaf,
    near: NQ.forest,
    nearTop: NQ.green,
    ground: [NQ.green, NQ.forest],
    path: [NQ.tan, NQ.brown],
  },
  mountain: {
    sky: [NQ.azure, NQ.sky, NQ.ice],
    far: NQ.slate,
    farTop: NQ.white,
    near: NQ.gray,
    nearTop: NQ.silver,
    ground: [NQ.tan, NQ.brown],
    path: [NQ.sand, NQ.tan],
  },
  beach: {
    sky: [NQ.azure, NQ.sky, NQ.ice],
    far: NQ.blue,
    farTop: NQ.azure,
    near: NQ.azure,
    nearTop: NQ.sky,
    ground: [NQ.sand, NQ.beige],
    path: [NQ.beige, NQ.sand],
  },
  shore: {
    sky: [NQ.azure, NQ.sky, NQ.ice],
    far: NQ.teal,
    farTop: NQ.green,
    near: NQ.azure,
    nearTop: NQ.sky,
    ground: [NQ.lime, NQ.leaf],
    path: [NQ.sand, NQ.tan],
  },
  farm: {
    sky: [NQ.azure, NQ.sky, NQ.ice],
    far: NQ.blue,
    farTop: NQ.azure,
    near: NQ.leaf,
    nearTop: NQ.lime,
    ground: [NQ.leaf, NQ.lime],
    path: [NQ.sand, NQ.tan],
  },
};

/** やまの 背景の とがった 峰（x, 高さ） */
const PEAKS = [
  [30, 34],
  [96, 44],
  [150, 30],
  [208, 40],
] as const;

export function backdropArt(kind: BackdropKind): HTMLCanvasElement {
  const p = BACKDROPS[kind];
  const rng = createRng(`backdrop:${kind}`);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const r = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };

  // 空：帯のグラデーション。境目は 2 ドットの市松（ディザ）
  const band = Math.ceil(HORIZON / p.sky.length);
  p.sky.forEach((col, i) => {
    r(0, i * band, W, band, col);
    const next = p.sky[i + 1];
    if (next) for (let x = i % 2; x < W; x += 2) r(x, i * band + band - 1, 1, 1, next);
  });

  if (kind !== 'dungeon' && kind !== 'boss') {
    for (const [x, y, w] of [
      [26, 12, 24],
      [120, 22, 30],
      [196, 8, 18],
    ] as const) {
      r(x, y, w, 3, NQ.white);
      r(x + 3, y - 2, w - 8, 2, NQ.white);
      r(x + 6, y - 4, w - 14, 2, NQ.white);
      r(x + 1, y + 3, w - 2, 1, NQ.cloud);
    }
  } else if (kind === 'boss') {
    // 地平線にしずむ太陽
    for (let y = -20; y <= 0; y++) {
      const hw = Math.round(Math.sqrt(400 - y * y));
      r(176 - hw, HORIZON - 6 + y, hw * 2, 1, y > -14 ? NQ.apricot : NQ.gold);
    }
  } else {
    // つらら
    for (let x = 0; x < W; x += 10 + rng.int(0, 8)) {
      const h = 6 + rng.int(0, 14);
      for (let i = 0; i < h; i++)
        r(x + Math.floor(i / 3), i, Math.max(1, 6 - Math.floor(i / 2)), 1, NQ.indigo);
    }
    // ひかる結晶
    for (let i = 0; i < 9; i++) {
      const x = rng.int(4, W - 4);
      const y = rng.int(22, 52);
      r(x, y, 1, 3, NQ.ice);
      r(x - 1, y + 1, 3, 1, NQ.aqua);
    }
  }

  if (kind === 'beach') {
    // 水平線まで 海。遠くに 小さな 島と、きらきら
    r(0, HORIZON - 10, W, 14, p.far);
    r(0, HORIZON - 10, W, 1, p.farTop);
    for (let x = 30; x < 62; x++) {
      const hh = Math.round(4 - Math.abs(x - 46) / 4);
      if (hh > 0) r(x, HORIZON - 10 - hh, 1, hh, NQ.teal);
    }
    for (let k = 0; k < 24; k++) r(rng.int(0, W - 3), rng.int(HORIZON - 8, HORIZON + 2), 3, 1, p.farTop);
  } else {
    // 遠くの山なみ（やまの 背景は 高く とがって、雪を かぶる）
    const tall = kind === 'mountain';
    let h = 12;
    for (let x = 0; x < W; x++) {
      h = tall
        ? Math.max(10, ...PEAKS.map(([px, ph]) => Math.round(ph - Math.abs(x - px) * 0.9)))
        : Math.max(6, Math.min(20, h + rng.int(-1, 1)));
      r(x, HORIZON - h, 1, h + 2, p.far);
      r(x, HORIZON - h, 1, tall && h > 22 ? 3 : 1, p.farTop);
    }
  }
  if (kind === 'beach' || kind === 'shore') {
    // 手前は 水（海・湖）と 波うちぎわの あわ
    const top = kind === 'beach' ? HORIZON - 2 : HORIZON - 4;
    r(0, top, W, HORIZON + 4 - top, p.near);
    for (let k = 0; k < 30; k++) r(rng.int(0, W - 4), rng.int(top + 1, HORIZON + 2), 4, 1, p.nearTop);
    for (let x = 0; x < W; x++)
      if ((x + Math.round(Math.sin(x / 5) * 2) + 9) % 9 < 5) r(x, HORIZON + 3, 1, 1, NQ.white);
  } else if (kind === 'forest') {
    // 手前は 木の かんむりの 列と みき
    for (let x = 0; x < W; x++) {
      const y = HORIZON - 8 - Math.round(Math.abs(Math.sin((x * Math.PI) / 14)) * 6);
      r(x, y, 1, 1, p.nearTop);
      r(x, y + 1, 1, HORIZON + 4 - y, p.near);
    }
    for (let x = 6; x < W; x += 14) r(x, HORIZON - 3, 2, 7, NQ.bark);
  } else {
    // 手前の丘（やまは 岩の 高い 丘）
    const amp = kind === 'mountain' ? 6 : 3;
    for (let x = 0; x < W; x++) {
      const y = Math.round(HORIZON - 3 + Math.sin(x / 17) * amp + Math.sin(x / 6) * 1);
      r(x, y, 1, 1, p.nearTop);
      r(x, y + 1, 1, HORIZON + 4 - y, p.near);
    }
  }
  // 地面：奥ほど細い帯（遠近感）
  let y = HORIZON + 2;
  let i = 0;
  while (y < H) {
    const hh = 1 + Math.floor(i / 2);
    r(0, y, W, hh, p.ground[i % 2]!);
    y += hh;
    i++;
  }
  // みんなが立つ道
  r(0, PATH_TOP, W, PATH_BOTTOM - PATH_TOP, p.path[0]);
  r(0, PATH_TOP, W, 1, p.path[1]);
  r(0, PATH_BOTTOM, W, 1, p.path[1]);
  for (let k = 0; k < 40; k++) r(rng.int(0, W), rng.int(PATH_TOP + 2, PATH_BOTTOM - 2), 2, 1, p.path[1]);
  if (kind === 'field') {
    // 草と花
    for (let k = 0; k < 50; k++) {
      const gx = rng.int(0, W);
      const gy = rng.chance(0.5) ? rng.int(HORIZON + 4, PATH_TOP - 2) : rng.int(PATH_BOTTOM + 2, H - 2);
      r(gx, gy, 1, 2, NQ.green);
      r(gx + 2, gy + 1, 1, 1, NQ.green);
      if (rng.chance(0.15)) r(gx + 1, gy - 1, 1, 1, rng.chance(0.5) ? NQ.blush : NQ.white);
    }
  }
  groundDecor(kind, r, rng);
  return c;
}

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;

/** 地面ごとの かざり（道の 上と 下。道の 帯には かからない） */
function groundDecor(kind: BackdropKind, r: Rect, rng: ReturnType<typeof createRng>): void {
  const spot = (): [number, number] => [
    rng.int(0, W - 6),
    rng.chance(0.5) ? rng.int(HORIZON + 6, PATH_TOP - 4) : rng.int(PATH_BOTTOM + 4, H - 4),
  ];
  if (kind === 'forest') {
    for (let k = 0; k < 40; k++) {
      const [gx, gy] = spot();
      r(gx, gy, 1, 2, NQ.leaf);
      r(gx + 2, gy + 1, 1, 1, NQ.leaf);
    }
    // きのこ
    for (let k = 0; k < 7; k++) {
      const [gx, gy] = spot();
      r(gx, gy, 3, 1, NQ.red);
      r(gx + 1, gy - 1, 1, 1, NQ.red);
      r(gx + 1, gy, 1, 1, NQ.white);
      r(gx + 1, gy + 1, 1, 2, NQ.paper);
    }
    // 上の 左右に かかる 木の葉
    for (let y = 0; y < 22; y++) {
      const w = Math.round(20 - y * 0.9 + Math.sin(y * 1.3) * 2);
      if (w <= 0) continue;
      r(0, y, w, 1, NQ.forest);
      r(w - 2, y, 2, 1, NQ.green);
      r(W - w, y, w, 1, NQ.forest);
      r(W - w, y, 2, 1, NQ.green);
    }
  } else if (kind === 'mountain') {
    for (let k = 0; k < 10; k++) {
      const [gx, gy] = spot();
      const w = rng.int(3, 6);
      r(gx, gy, w, 3, NQ.gray);
      r(gx, gy, w - 1, 1, NQ.silver);
      r(gx + 1, gy + 3, w - 1, 1, NQ.slate);
    }
    // 高山の 花（コマクサ）
    for (let k = 0; k < 10; k++) {
      const [gx, gy] = spot();
      r(gx, gy + 1, 1, 1, NQ.green);
      r(gx, gy, 1, 1, NQ.blush);
    }
  } else if (kind === 'beach') {
    for (let k = 0; k < 14; k++) {
      const [gx, gy] = spot();
      r(gx, gy, 2, 1, NQ.paper);
      r(gx, gy + 1, 2, 1, NQ.tan);
    }
    // ヒトデ
    for (let k = 0; k < 4; k++) {
      const [gx, gy] = spot();
      r(gx + 1, gy - 1, 1, 3, NQ.apricot);
      r(gx, gy, 3, 1, NQ.apricot);
    }
  } else if (kind === 'shore') {
    // あし・ガマ（下の あしは 道に かからない 高さから 上へ のびる）
    for (let k = 0; k < 36; k++) {
      const gx = rng.int(0, W - 2);
      const hh = rng.int(5, 9);
      const gy = rng.chance(0.5) ? rng.int(HORIZON + 14, PATH_TOP - 2) : rng.int(PATH_BOTTOM + hh + 4, H - 1);
      r(gx, gy - hh, 1, hh, NQ.green);
      r(gx, gy - hh - 2, 1, 2, NQ.brown);
      r(gx + 1, gy - 3, 1, 1, NQ.green);
    }
  } else if (kind === 'farm') {
    // たんぼの なえの 列（奥ほど 細かい）
    for (let y = HORIZON + 6; y < H - 1; y += y < PATH_TOP ? 3 : 4) {
      if (y >= PATH_TOP - 2 && y <= PATH_BOTTOM + 2) continue;
      for (let x = (y * 3) % 5; x < W; x += 5) r(x, y, 1, 2, NQ.green);
    }
    // かかし
    const [sx, sy] = [200, PATH_TOP - 16];
    r(sx - 3, sy, 7, 1, NQ.ochre);
    r(sx - 2, sy - 1, 5, 1, NQ.ochre);
    r(sx - 1, sy + 1, 3, 2, NQ.cream);
    r(sx - 5, sy + 4, 11, 1, NQ.brown);
    r(sx - 1, sy + 3, 3, 4, NQ.blue);
    r(sx, sy + 7, 1, 6, NQ.brown);
  }
}

/** 足もとのかげ（w ドット幅のだ円。4 倍で表示） */
export function shadowArt(w: number): HTMLCanvasElement {
  const g = makeGrid(w, 4);
  for (let y = 0; y < 4; y++) {
    const inset = y === 0 || y === 3 ? Math.round(w * 0.18) : 0;
    for (let x = inset; x < w - inset; x++) put(g, x, y, NQ.ink);
  }
  return toCanvas(g);
}

/** 斬撃（白。Phaser 側で属性の色を付ける）。32×32 × 3 コマ */
export function slashSheet(): HTMLCanvasElement {
  const frames: Grid[] = [];
  const arcs: [number, number, number][] = [
    [-70, -30, 2],
    [-95, 15, 3],
    [-95, 15, 1],
  ];
  for (const [a0, a1, thick] of arcs) {
    const g = makeGrid(32, 32);
    for (let a = a0; a <= a1; a += 1.5) {
      const rad = (a * Math.PI) / 180;
      for (let k = 0; k < thick; k++) {
        const rr = 22 - k;
        put(g, Math.round(6 + Math.cos(rad) * rr), Math.round(26 + Math.sin(rad) * rr), NQ.white);
      }
    }
    frames.push(g);
  }
  return sheetCanvas(frames, arcs.length);
}

/** パーティクル用の小さな形（白。Phaser 側で色を付ける） */
export function particleArt(kind: 'px' | 'star' | 'heart'): HTMLCanvasElement {
  const shapes: Record<typeof kind, string[]> = {
    px: ['##', '##'],
    star: ['..#..', '.###.', '#####', '.###.', '..#..'],
    heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
  };
  const rows = shapes[kind];
  const g = makeGrid(rows[0]!.length, rows.length);
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch === '#' && put(g, x, y, NQ.white)));
  return toCanvas(g);
}
