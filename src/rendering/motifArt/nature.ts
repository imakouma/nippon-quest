/**
 * 名所の絵：しぜん（山・火山・湖・滝・峡谷・川・海岸・島・花・森…）。
 * それぞれ 32×32 の えはがき。背景（空・地面・海）から かいて、主役は layer() で ふちどる。v で えらび。
 * src/rendering/motifArt/index.ts の MOTIF_SCENES が どの 名所に どれを 使うか。
 */
import {
  box,
  cloud,
  dot,
  hills,
  layer,
  NQ,
  oval,
  pattern,
  roundTree,
  sea,
  seg,
  sky,
  sun,
  thick,
  tree,
  tri,
  type Grid,
  type SceneFn,
} from './kit';

export type NatureKey =
  | 'mountain'
  | 'snowPeak'
  | 'volcano'
  | 'volcanicVent'
  | 'highland'
  | 'mesa'
  | 'lake'
  | 'pond'
  | 'spring'
  | 'waterfall'
  | 'gorge'
  | 'river'
  | 'riverBoat'
  | 'tubBoat'
  | 'beach'
  | 'mirrorBeach'
  | 'sandbar'
  | 'island'
  | 'islands'
  | 'rockyCoast'
  | 'capeCliff'
  | 'whirlpool'
  | 'driftIce'
  | 'strait'
  | 'cave'
  | 'karst'
  | 'flowers'
  | 'sakura'
  | 'riceTerrace'
  | 'forest'
  | 'bigCedar'
  | 'wetland'
  | 'dunes'
  | 'icyTrees'
  | 'jade'
  | 'sacredRock';

/** いちばん 右・下の 内がわの マス */
const E = 30;

// ───────────────────────── この ファイルだけの 道具 ─────────────────────────

/** 0〜1 の 数（seed と i で きまる） */
const rnd = (seed: number, i: number): number => {
  const s = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** 2×2 の かたまりごとの 0〜1（もみじ・花の むら） */
const blk = (x: number, y: number, seed = 0): number =>
  rnd(seed + Math.floor(x / 2) * 7, Math.floor(y / 2) * 13);

const FING = [0, 2, 1, 3, 1, 0, 2];

/**
 * 山（三角・台形）。右半分は かげ。snowH で 雪の ぼうし（下は ぎざぎざ）。
 * topHalf で 頂上を たいらに、pow > 1 で すそが ひろがる（富士山）
 */
function peak(
  g: Grid,
  cx: number,
  top: number,
  base: number,
  halfW: number,
  col: string,
  shade: string,
  snowH = 0,
  topHalf = 0,
  pow = 1,
): void {
  const h = Math.max(1, base - top);
  for (let y = Math.round(top); y <= Math.round(base); y++) {
    const t = Math.min(1, Math.max(0, (y - top + 0.5) / h));
    const half = topHalf + (halfW - topHalf) * t ** pow;
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
      const snow = snowH > 0 && y < top + snowH + FING[((x % 7) + 7) % 7]! - 1;
      const right = x > cx;
      dot(g, x, y, snow ? (right ? NQ.cloud : NQ.white) : right ? shade : col);
    }
  }
}

/** 水の 上の 横線（なみ・光） */
function ripples(
  g: Grid,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  col: string,
  seed: number,
  n = 6,
  len = 2,
): void {
  for (let i = 0; i < n; i++) {
    const x = x0 + Math.floor(rnd(seed, i) * Math.max(1, x1 - x0 - len + 2));
    const y = y0 + Math.floor(rnd(seed, i + 50) * (y1 - y0 + 1));
    box(g, x, y, x + len - 1, y, col);
  }
}

/** ぱらぱらと 点 */
function speckle(
  g: Grid,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  col: string,
  seed: number,
  n: number,
): void {
  for (let i = 0; i < n; i++)
    dot(
      g,
      x0 + Math.floor(rnd(seed, i + 100) * (x1 - x0 + 1)),
      y0 + Math.floor(rnd(seed, i + 200) * (y1 - y0 + 1)),
      col,
    );
}

/** 小さな 人（x, 足もと y。2 マスはば）。layer の 中で つかう */
function person(l: Grid, x: number, y: number, body: string, hat?: string): void {
  box(l, x, y - 2, x + 1, y, body);
  box(l, x, y - 4, x + 1, y - 3, NQ.skinLight);
  if (hat) {
    box(l, x - 1, y - 4, x + 2, y - 4, hat);
    box(l, x, y - 5, x + 1, y - 5, hat);
  } else box(l, x, y - 4, x + 1, y - 4, NQ.hairBlack);
}

/** 細長い 木の 舟（y は ふなべり） */
function longBoat(l: Grid, x0: number, x1: number, y: number): void {
  dot(l, x0 - 1, y - 1, NQ.tan);
  box(l, x0, y, x1, y, NQ.tan);
  box(l, x0 + 1, y + 1, x1 - 1, y + 1, NQ.brown);
  box(l, x0 + 2, y + 2, x1 - 2, y + 2, NQ.bark);
}

/** 日本の 松（くねった みきと、たいらな 葉の かたまり） */
function pine(g: Grid, x: number, by: number, h: number, flip = false): void {
  const d = flip ? -1 : 1;
  seg(g, x, by, x + d, by - h * 0.5, NQ.brown, 2);
  seg(g, x + d, by - h * 0.5, x, by - h + 1, NQ.brown);
  oval(g, x + 0.5, by - h + 0.5, 3.4, 1.6, NQ.green, NQ.forest);
  oval(g, x + d * 3 + 0.5, by - h * 0.62, 2.6, 1.3, NQ.green, NQ.forest);
  oval(g, x - d * 2 + 0.5, by - h * 0.38, 2.2, 1.2, NQ.green, NQ.forest);
}

/** 滝の 水（たての すじ） */
function fall(g: Grid, x0: number, x1: number, y0: number, y1: number): void {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const k = (x - x0) % 3;
      dot(g, x, y, (y * 2 + x * 5) % 9 === 0 ? NQ.sky : k === 1 ? NQ.ice : NQ.white);
    }
}

/** しぶき */
function splash(g: Grid, cx: number, y: number, w: number): void {
  oval(g, cx, y, w, 1.8, NQ.white);
  oval(g, cx - w * 0.7, y - 0.8, w * 0.45, 1.5, NQ.white);
  oval(g, cx + w * 0.7, y - 0.8, w * 0.45, 1.5, NQ.white);
  dot(g, cx - w - 1, y - 2, NQ.ice);
  dot(g, cx + w + 1, y - 2, NQ.ice);
}

/**
 * 左右の かべ（まん中 16 に むかって すぼまる：峡谷・雪の大谷）。
 * open(y) は まん中の あき（半分）、k は かべの 上の はしからの 深さ
 */
function walls(
  g: Grid,
  vy: number,
  slope: number,
  open: (y: number) => number,
  paint: (x: number, y: number, d: number, k: number) => string,
): void {
  for (let y = 1; y <= E; y++)
    for (let x = 1; x <= E; x++) {
      const d = Math.abs(x + 0.5 - 16);
      const top = vy - (d - 1) * slope;
      if (d > open(y) && y >= top) dot(g, x, y, paint(x, y, d, y - top));
    }
}

/** けむり（もくもく。灰色の ふち） */
function smoke(g: Grid, puffs: [number, number, number][], col: string = NQ.cloud): void {
  layer(
    g,
    (l) => {
      for (const [x, y, r] of puffs) oval(l, x, y, r, r * 0.8, col);
      for (const [x, y, r] of puffs) oval(l, x - r * 0.3, y - r * 0.3, r * 0.45, r * 0.35, NQ.white);
    },
    NQ.gray,
  );
}

/** 湯気（白い すじが ゆらゆら 立つ） */
function steam(g: Grid, x: number, y: number, h: number): void {
  layer(
    g,
    (l) => {
      for (let i = 0; i < h; i++) {
        const xx = x + Math.round(Math.sin(i * 0.9) * 1.2);
        dot(l, xx, y - i, NQ.white);
        dot(l, xx + 1, y - i, i > h * 0.5 ? NQ.cloud : NQ.white);
        if (i > h * 0.6) dot(l, xx - 1, y - i, NQ.white);
      }
    },
    NQ.silver,
  );
}

/** 水面（col）と さざなみ */
function water(g: Grid, y0: number, y1: number, col: string, seed: number, hi: string = NQ.sky): void {
  box(g, 1, y0, E, y1, col);
  ripples(g, 2, y0 + 1, E - 1, y1, hi, seed, 7, 2);
}

/** 草むらの つぶ */
function grassDots(g: Grid, y0: number, y1: number, col: string, seed: number, n = 18): void {
  speckle(g, 1, y0, E, y1, col, seed, n);
}

/** 花（まん中 c、花びら p） */
function flower(g: Grid, x: number, y: number, p: string, c: string): void {
  dot(g, x - 1, y, p);
  dot(g, x + 1, y, p);
  dot(g, x, y - 1, p);
  dot(g, x, y + 1, p);
  dot(g, x, y, c);
}

/** さかさの 山（水に うつる） */
function mirrorY(g: Grid, y0: number, y1: number, axis: number, map: (c: string) => string): void {
  for (let y = y0; y <= y1; y++) {
    const sy = Math.round(2 * axis - y);
    if (sy < 1 || sy > E) continue;
    for (let x = 1; x <= E; x++) {
      const c = g[sy]![x];
      if (c) dot(g, x, y, map(c));
    }
  }
}

// ───────────────────────── 山 ─────────────────────────

const mountain: SceneFn = (g, o) => {
  const s = o.seed;
  switch (o.v) {
    case 'snow': {
      sky(g, 'day', s);
      cloud(g, 24 - (s % 4), 4, 7);
      peak(g, 25, 11, 24, 10, NQ.gray, NQ.slate, 3);
      layer(g, (l) => peak(l, 12, 4, 24, 14, NQ.denim, NQ.navy, 7));
      box(g, 1, 23, E, E, NQ.green);
      for (let i = 0; i < 8; i++) tree(g, 2 + i * 4 + (s % 2), 29 - (i % 2), 6, NQ.forest);
      return;
    }
    case 'cliff': {
      sky(g, 'day', s);
      cloud(g, 24 - (s % 5), 3, 6);
      sea(g, 24, NQ.azure, s);
      // 山の 尾根が のこぎりの 歯（とがった 岩が ならぶ）
      layer(g, (l) => {
        for (let x = 1; x <= E; x++) {
          const t = (x + 1) % 5;
          const tooth = t <= 2 ? t * 2.5 : (5 - t) * 2.5;
          const top = Math.round(12 + Math.abs(x - 14) * 0.35 - tooth);
          const foot = 25 - Math.round(Math.abs(x - 14) * 0.25);
          box(l, x, top, x, foot, t < 3 ? NQ.silver : NQ.gray);
          if (x % 5 === 2) seg(l, x, top + 3, x, top + 8, NQ.slate);
        }
        pattern(l, NQ.green, (x, y) => y > 18 + ((x * 3) % 4));
        pattern(l, NQ.forest, (x, y) => y > 18 && (x * 5 + y * 3) % 7 === 0);
      });
      return;
    }
    case 'rock': {
      sky(g, 'day', s);
      cloud(g, 6 + (s % 4), 6, 6);
      hills(g, 24, 8, NQ.teal, s);
      layer(g, (l) => {
        peak(l, 16, 3, 27, 9, NQ.silver, NQ.gray);
        pattern(l, NQ.gray, (x, y) => (x * 5 + y * 3) % 7 === 0);
      });
      for (let y = 7; y <= 25; y++) {
        const x = 13 + Math.round(Math.sin(y / 2.5) * 1.5);
        dot(g, x, y, y % 2 ? NQ.ink : NQ.gold);
      }
      layer(g, (l) => person(l, 14, 15, NQ.red, NQ.cream));
      box(g, 1, 26, E, E, NQ.green);
      for (let i = 0; i < 8; i++) tree(g, 2 + i * 4, 30, 5, i % 2 ? NQ.forest : NQ.leaf);
      return;
    }
    case 'twin': {
      sky(g, 'day', s);
      cloud(g, 24 - (s % 5), 4, 7);
      layer(g, (l) => {
        peak(l, 21, 7, 23, 11, NQ.green, NQ.forest);
        peak(l, 10, 5, 23, 11, NQ.green, NQ.forest);
      });
      dot(g, 10, 5, NQ.silver);
      dot(g, 21, 7, NQ.silver);
      box(g, 1, 23, E, E, NQ.lime);
      for (let y = 24; y <= E; y += 2) box(g, 1, y, E, y, NQ.leaf);
      for (let x = 3; x <= E; x += 7) seg(g, x, 23, x - 3, E, NQ.sprout);
      return;
    }
    case 'sea': {
      sky(g, 'day', s);
      cloud(g, 5 + (s % 4), 5, 6);
      sea(g, 21, NQ.azure, s);
      layer(g, (l) => peak(l, 18, 5, 22, 12, NQ.green, NQ.forest, 0, 0.6, 1.3));
      box(g, 8, 22, 29, 22, NQ.sand);
      box(g, 6, 23, 30, 24, NQ.lime);
      box(g, 4, 25, 30, 25, NQ.sand);
      for (let i = 0; i < 5; i++) roundTree(g, 12 + i * 4, 24, 1.5, NQ.leaf);
      return;
    }
    case 'grass': {
      sky(g, 'day', s);
      cloud(g, 24 - (s % 5), 5, 7);
      cloud(g, 6, 9, 5);
      layer(g, (l) => oval(l, 16, 31, 18, 21, NQ.leaf, NQ.green));
      pattern(g, NQ.lime, (x, y) => y > 11 && (x * 3 + y * 5) % 11 === 0 && g[y]![x] === NQ.leaf);
      oval(g, 11, 15, 4, 2, NQ.lime);
      for (let y = 12; y <= E; y++) {
        const x = 16 + Math.round(Math.sin(y / 2) * (y - 10) * 0.35);
        dot(g, x, y, NQ.sand);
      }
      return;
    }
    case 'ropeway': {
      sky(g, 'day', s);
      cloud(g, 7 + (s % 5), 4, 6);
      layer(g, (l) => {
        peak(l, 20, 3, 28, 16, NQ.green, NQ.forest);
        pattern(l, NQ.silver, (x, y) => y < 9 && (x + y) % 3 === 0);
      });
      seg(g, 3, 25, 26, 6, NQ.ink);
      layer(g, (l) => {
        box(l, 22, 5, 26, 7, NQ.paper);
        box(l, 1, 24, 4, 27, NQ.paper);
        seg(l, 13, 17, 13, 19, NQ.slate);
        box(l, 11, 19, 15, 22, NQ.red);
        box(l, 12, 20, 14, 20, NQ.ice);
      });
      box(g, 1, 28, E, E, NQ.forest);
      for (let i = 0; i < 8; i++) tree(g, 2 + i * 4, E, 5, NQ.green);
      return;
    }
    case 'forest': {
      sky(g, 'day', s);
      cloud(g, 24 - (s % 4), 5, 6);
      layer(g, (l) => peak(l, 16, 4, 29, 17, NQ.green, NQ.forest));
      for (let r = 0; r < 5; r++) {
        const y = 12 + r * 4;
        const half = ((y - 4) / 25) * 17;
        for (let x = 16 - half + 2; x < 16 + half - 1; x += 3)
          tree(g, x + (r % 2), y, 5, x > 16 ? NQ.forest : NQ.leaf);
      }
      for (let y = 8; y <= E; y++) dot(g, 15 + Math.round(Math.sin(y / 2.2) * (y - 5) * 0.25), y, NQ.sand);
      layer(g, (l) => {
        tri(l, 13, 5, 19, 5, 16, 2, NQ.vermilion);
        box(l, 14, 5, 18, 6, NQ.paper);
      });
      return;
    }
    case 'range': {
      sky(g, 'day', s);
      cloud(g, 6 + (s % 6), 3, 6);
      peak(g, 5, 7, 20, 8, NQ.denim, NQ.navy, 3);
      peak(g, 26, 6, 20, 8, NQ.denim, NQ.navy, 3);
      peak(g, 16, 4, 20, 9, NQ.denim, NQ.navy, 4);
      layer(g, (l) => {
        peak(l, 9, 11, 25, 10, NQ.teal, NQ.night);
        peak(l, 23, 10, 25, 11, NQ.green, NQ.forest);
      });
      box(g, 1, 24, E, E, NQ.leaf);
      grassDots(g, 25, E, NQ.lime, s);
      for (let i = 0; i < 4; i++) tree(g, 3 + i * 8, E, 5, NQ.forest);
      return;
    }
    default: {
      sky(g, 'day', s);
      cloud(g, 6 + (s % 5), 5, 7);
      peak(g, 26, 10, 22, 10, NQ.teal, NQ.night);
      layer(g, (l) => {
        peak(l, 13, 4, 24, 14, NQ.green, NQ.forest);
        pattern(l, NQ.silver, (x, y) => y < 8 && (x + y) % 3 !== 0);
      });
      box(g, 1, 23, E, E, NQ.leaf);
      box(g, 1, 23, E, 23, NQ.lime);
      grassDots(g, 24, E, NQ.lime, s);
      for (let i = 0; i < 4; i++) tree(g, 4 + i * 8 + (s % 3), 29, 6, NQ.forest);
    }
  }
};

/** 富士山（大きな 雪の ぼうし、すそが ひろい） */
function fuji(g: Grid, cx: number, top: number, base: number, halfW: number, snowH: number): void {
  layer(g, (l) => peak(l, cx, top, base, halfW, NQ.blue, NQ.navy, snowH, 2, 1.5));
}

const snowPeak: SceneFn = (g, o) => {
  const s = o.seed;
  if (o.v === 'wall') {
    sky(g, 'day', s);
    peak(g, 8, 7, 15, 7, NQ.denim, NQ.navy, 3);
    peak(g, 24, 8, 15, 7, NQ.denim, NQ.navy, 3);
    peak(g, 16, 5, 15, 8, NQ.denim, NQ.navy, 4);
    box(g, 1, 14, E, E, NQ.slate);
    for (let y = 16; y <= E; y += 3) box(g, 16, y, 16, y + 1, NQ.cream);
    walls(
      g,
      15,
      0.85,
      (y) => (y < 14 ? 0 : 0.6 + (y - 14) * 0.5),
      (x, y, d, k) =>
        k < 1
          ? NQ.white
          : d < 1.6 + (y - 14) * 0.5
            ? NQ.cloud
            : Math.round(y + d * 0.4) % 3 === 0
              ? NQ.cloud
              : NQ.white,
    );
    layer(g, (l) => {
      box(l, 14, 20, 18, 23, NQ.leaf);
      box(l, 14, 20, 18, 20, NQ.cream);
      box(l, 15, 21, 17, 21, NQ.ice);
      dot(l, 14, 24, NQ.ink);
      dot(l, 18, 24, NQ.ink);
    });
    return;
  }
  if (o.v === 'lake') {
    sky(g, 'day', s);
    cloud(g, 5 + (s % 4), 4, 6);
    fuji(g, 16, 4, 15, 16, 4);
    box(g, 1, 15, E, 16, NQ.forest);
    for (let i = 0; i < 8; i++) tree(g, 2 + i * 4, 16, 3, NQ.green);
    mirrorY(g, 17, E, 16.5, (c) =>
      c === NQ.white || c === NQ.cloud
        ? NQ.ice
        : c === NQ.blue || c === NQ.navy || c === NQ.ink
          ? NQ.blue
          : c === NQ.green || c === NQ.forest
            ? NQ.teal
            : NQ.azure,
    );
    ripples(g, 2, 18, E - 1, E, NQ.sky, s, 8, 3);
    return;
  }
  sky(g, 'day', s);
  cloud(g, 24 - (s % 5), 4, 7);
  fuji(g, 16, 6, 23, 17, 6);
  box(g, 1, 23, E, E, NQ.leaf);
  box(g, 1, 23, E, 24, NQ.forest);
  for (let i = 0; i < 9; i++) tree(g, 1 + i * 4, 25, 4, NQ.green);
  grassDots(g, 26, E, NQ.lime, s);
};

// ───────────────────────── 火山 ─────────────────────────

const volcano: SceneFn = (g, o) => {
  const s = o.seed;
  if (o.v === 'snow') {
    sky(g, 'day', s);
    layer(g, (l) => {
      peak(l, 15, 6, 24, 17, NQ.white, NQ.cloud, 0, 3);
      pattern(l, NQ.silver, (x, y) => y > 8 && (x * 3 + y * 7) % 13 === 0);
      box(l, 13, 6, 17, 6, NQ.slate);
    });
    steam(g, 15, 5, 5);
    steam(g, 9, 15, 7);
    steam(g, 20, 13, 6);
    box(g, 1, 24, E, E, NQ.white);
    oval(g, 11, 27, 5, 1.6, NQ.azure);
    for (let i = 0; i < 4; i++) tree(g, 20 + i * 3, 29, 6, NQ.forest);
    for (let i = 0; i < 4; i++) dot(g, 20 + i * 3, 25, NQ.white);
    return;
  }
  if (o.v === 'sea') {
    sky(g, 'day', s);
    smoke(g, [
      [15, 6, 3],
      [18, 4, 3.5],
      [22, 3, 3],
      [26, 4, 2.5],
    ]);
    sea(g, 20, NQ.azure, s);
    layer(g, (l) => {
      peak(l, 12, 8, 21, 14, NQ.brown, NQ.bark, 0, 2);
      peak(l, 20, 10, 21, 10, NQ.brown, NQ.bark, 0, 1.5);
      pattern(l, NQ.green, (x, y) => y > 15 && (x > 16 ? true : (x + y) % 2 === 0));
      pattern(l, NQ.forest, (x, y) => y > 15 && x > 16 && (x + y) % 3 === 0);
    });
    layer(g, (l) => {
      box(l, 20, 26, 26, 26, NQ.white);
      box(l, 21, 27, 25, 27, NQ.red);
      box(l, 22, 24, 24, 25, NQ.yellow);
    });
    return;
  }
  if (o.v === 'caldera') {
    sky(g, 'day', s);
    smoke(g, [
      [17, 7, 2.5],
      [19, 5, 3],
      [23, 4, 2.5],
    ]);
    hills(g, 16, 4, NQ.teal, s);
    layer(g, (l) => {
      peak(l, 16, 10, 17, 9, NQ.silver, NQ.gray, 0, 3.5);
      box(l, 13, 10, 19, 10, NQ.aqua);
    });
    box(g, 1, 17, E, E, NQ.lime);
    hills(g, 21, 3, NQ.leaf, s + 3);
    box(g, 1, 21, E, E, NQ.leaf);
    oval(g, 10, 25, 5, 1.8, NQ.azure);
    box(g, 8, 24, 10, 24, NQ.sky);
    grassDots(g, 21, E, NQ.lime, s);
    layer(g, (l) => {
      box(l, 20, 25, 23, 26, NQ.brown);
      dot(l, 24, 25, NQ.brown);
      dot(l, 20, 27, NQ.bark);
      dot(l, 23, 27, NQ.bark);
    });
    return;
  }
  sky(g, 'day', s);
  smoke(g, [
    [16, 8, 2.5],
    [18, 5, 3],
    [22, 3, 3],
  ]);
  sea(g, 25, NQ.azure, s);
  layer(g, (l) => {
    peak(l, 16, 10, 25, 15, NQ.brown, NQ.bark, 0, 3.5, 1.3);
    box(l, 13, 10, 19, 10, NQ.vermilion);
    pattern(l, NQ.tan, (x, y) => y > 12 && x < 16 && (x * 2 + y) % 5 === 0);
    pattern(l, NQ.green, (x, y) => y > 21);
  });
};

const volcanicVent: SceneFn = (g, o) => {
  const s = o.seed;
  sky(g, 'day', s);
  hills(g, 14, 7, NQ.brown, s);
  hills(g, 15, 3, NQ.tan, s + 2);
  box(g, 1, 15, E, E, NQ.yellow);
  pattern(g, NQ.ochre, (x, y) => y >= 15 && blk(x, y, s) < 0.3);
  pattern(g, NQ.cream, (x, y) => y >= 15 && blk(x, y, s + 1) < 0.15);
  layer(g, (l) => {
    oval(l, 6, 25, 4, 2.5, NQ.silver, NQ.gray);
    oval(l, 24, 23, 5, 3, NQ.silver, NQ.gray);
    oval(l, 15, 28, 3, 2, NQ.gray, NQ.slate);
    oval(l, 28, 29, 3, 2, NQ.silver, NQ.gray);
  });
  steam(g, 6, 21, 11);
  steam(g, 23, 19, 13);
  steam(g, 15, 25, 9);
  steam(g, 12, 18, 6);
};

// ───────────────────────── 高原・台地 ─────────────────────────

const highland: SceneFn = (g, o) => {
  const s = o.seed;
  if (o.v === 'forest') {
    sky(g, 'day', s);
    smoke(g, [[19, 4, 2]]);
    peak(g, 17, 7, 14, 12, NQ.slate, NQ.night, 0, 2);
    box(g, 1, 14, E, E, NQ.lime);
    for (let y = 18; y <= E; y++) {
      const h = (y - 17) * 0.4;
      box(g, 16 - h, y, 16 + h, y, NQ.sand);
    }
    const xs = [3, 8, 23, 28, 12, 20];
    xs.forEach((x, i) => {
      const by = i < 4 ? 29 : 22;
      const h = i < 4 ? 14 : 8;
      seg(g, x, by, x, by - h, NQ.white);
      for (let y = by - h; y <= by; y += 3) dot(g, x, y, NQ.ink);
      oval(g, x + 0.5, by - h, i < 4 ? 4 : 2.6, i < 4 ? 3 : 2, NQ.leaf, NQ.green);
    });
    return;
  }
  if (o.v === 'cow') {
    sky(g, 'day', s);
    cloud(g, 6 + (s % 5), 4, 6);
    layer(g, (l) => peak(l, 18, 5, 16, 13, NQ.teal, NQ.night, 2));
    box(g, 1, 16, E, E, NQ.leaf);
    hills(g, 19, 2, NQ.lime, s);
    grassDots(g, 20, E, NQ.lime, s, 22);
    const cow = (l: Grid, x: number, y: number, f: number): void => {
      box(l, x, y, x + 5, y + 2, NQ.white);
      dot(l, x + 1, y, NQ.hairBlack);
      box(l, x + 2, y + 1, x + 3, y + 2, NQ.hairBlack);
      dot(l, x + 5, y + 1, NQ.hairBlack);
      const hx = f > 0 ? x + 6 : x - 2;
      box(l, hx, y - 1, hx + 1, y + 1, NQ.white);
      dot(l, f > 0 ? hx + 1 : hx, y + 1, NQ.blush);
      dot(l, f > 0 ? hx : hx + 1, y - 1, NQ.hairBlack);
      for (const lx of [x, x + 1, x + 4, x + 5]) dot(l, lx, y + 3, NQ.hairBlack);
    };
    layer(g, (l) => {
      cow(l, 4, 23, 1);
      cow(l, 20, 25, -1);
      cow(l, 14, 19, 1);
    });
    return;
  }
  sky(g, 'day', s);
  cloud(g, 7 + (s % 6), 4, 7);
  cloud(g, 24, 8, 5);
  hills(g, 16, 6, NQ.teal, s);
  box(g, 1, 16, E, E, NQ.leaf);
  hills(g, 20, 3, NQ.lime, s + 1);
  box(g, 1, 20, E, E, NQ.lime);
  pattern(g, NQ.leaf, (x, y) => y > 20 && (x * 3 + y * 5) % 9 === 0);
  for (let i = 0; i < 12; i++) {
    const x = 2 + Math.floor(rnd(s, i) * 28);
    const y = 21 + Math.floor(rnd(s, i + 9) * 9);
    dot(g, x, y, i % 3 === 0 ? NQ.white : i % 3 === 1 ? NQ.yellow : NQ.blush);
  }
  roundTree(g, 25, 20, 2, NQ.green);
  roundTree(g, 5, 18, 1.6, NQ.green);
  for (let x = 2; x <= E; x += 4) seg(g, x, 26, x, 28, NQ.brown);
  box(g, 1, 27, E, 27, NQ.tan);
};

const mesa: SceneFn = (g, o) => {
  const s = o.seed;
  sky(g, 'day', s);
  cloud(g, 24 - (s % 5), 4, 6);
  sea(g, 21, NQ.azure, s);
  layer(g, (l) => {
    for (let y = 9; y <= 21; y++) {
      const half = y < 12 ? 8 + (y - 9) * 0.7 : 10 + (y - 12) * 0.5;
      box(l, 16 - half, y, 16 + half, y, NQ.green);
      box(l, 17, y, 16 + half, y, NQ.forest);
    }
    box(l, 8, 9, 24, 9, NQ.leaf);
    for (const x of [7, 10, 22, 25]) seg(l, x, 11, x - (x < 16 ? 1 : -1), 15, NQ.gray);
  });
  box(g, 1, 21, E, 21, NQ.sand);
  layer(g, (l) => {
    oval(l, 27, 25, 3, 1.5, NQ.green, NQ.forest);
    oval(l, 6, 27, 2, 1, NQ.green);
  });
};

// ───────────────────────── 湖・池・わき水 ─────────────────────────

const lake: SceneFn = (g, o) => {
  const s = o.seed;
  switch (o.v) {
    case 'statue': {
      sky(g, 'day', s);
      cloud(g, 7 + (s % 4), 4, 6);
      hills(g, 14, 7, NQ.green, s);
      hills(g, 14, 3, NQ.forest, s + 3);
      water(g, 14, E, NQ.blue, s, NQ.azure);
      oval(g, 16, 25, 3.5, 1.3, NQ.gray);
      // 金色の 女の人の 像（頭・うで・すそが ひろがる きもの）
      layer(g, (l) => {
        oval(l, 16, 13, 1.6, 1.6, NQ.gold);
        tri(l, 13, 24.5, 19, 24.5, 16, 15, NQ.gold);
        tri(l, 16, 15, 19, 24.5, 16.5, 24.5, NQ.ochre);
        box(l, 15, 15, 16, 16, NQ.gold);
        seg(l, 14, 17, 12, 15, NQ.gold);
        seg(l, 17, 17, 19, 15, NQ.ochre);
        dot(l, 16, 12, NQ.cream);
      });
      for (let y = 27; y <= E; y += 2) box(g, 15, y, 16, y, NQ.ochre);
      return;
    }
    case 'autumn': {
      sky(g, 'day', s);
      hills(g, 15, 6, NQ.teal, s);
      water(g, 15, E, NQ.azure, s);
      const cols = [NQ.red, NQ.orange, NQ.gold, NQ.vermilion];
      for (let i = 0; i < 9; i++) roundTree(g, 1 + i * 3.6, 16, 1.4, cols[(i + s) % 4]!);
      layer(g, (l) => {
        roundTree(l, 3, E + 1, 4, NQ.red);
        roundTree(l, 27, E + 1, 4, NQ.orange);
        roundTree(l, 8, E + 2, 3, NQ.gold);
      });
      return;
    }
    case 'five': {
      sky(g, 'day', s);
      box(g, 1, 7, E, 9, NQ.blue);
      ripples(g, 2, 8, E - 1, 9, NQ.azure, s, 4);
      box(g, 1, 10, E, E, NQ.green);
      pattern(g, NQ.forest, (x, y) => y >= 10 && blk(x, y, s) < 0.35);
      pattern(g, NQ.leaf, (x, y) => y >= 10 && blk(x, y, s + 5) < 0.2);
      layer(g, (l) => {
        oval(l, 7, 14, 5, 2.5, NQ.mint);
        oval(l, 20, 13, 7, 2.5, NQ.aqua);
        oval(l, 25, 20, 4.5, 3, NQ.azure);
        oval(l, 11, 22, 6, 3.5, NQ.blue);
        oval(l, 19, 27, 5, 2.2, NQ.teal);
      });
      return;
    }
    case 'mountain': {
      sky(g, 'day', s);
      cloud(g, 24 - (s % 5), 4, 6);
      layer(g, (l) => {
        peak(l, 15, 4, 17, 14, NQ.green, NQ.forest, 2);
        peak(l, 21, 7, 17, 8, NQ.green, NQ.forest);
      });
      water(g, 17, E, NQ.azure, s, NQ.ice);
      box(g, 1, 17, E, 17, NQ.forest);
      box(g, 1, 28, E, E, NQ.sand);
      box(g, 1, 28, E, 28, NQ.beige);
      return;
    }
    case 'deep': {
      sky(g, 'day', s);
      cloud(g, 7 + (s % 5), 3, 6);
      box(g, 1, 8, E, E, NQ.forest);
      hills(g, 10, 3, NQ.forest, s);
      pattern(g, NQ.green, (x, y) => y >= 8 && blk(x, y, s) < 0.4);
      oval(g, 16, 19, 14, 8, NQ.brown);
      oval(g, 16, 18.5, 13, 6.8, NQ.indigo);
      oval(g, 16, 18, 12, 6, NQ.blue);
      ripples(g, 6, 14, 26, 23, NQ.azure, s, 5, 3);
      layer(g, (l) => oval(l, 19, 18, 1.8, 1.2, NQ.green));
      box(g, 1, 28, E, E, NQ.leaf);
      for (let x = 2; x <= E; x += 3) seg(g, x, 27, x, 29, NQ.brown);
      box(g, 1, 27, E, 27, NQ.tan);
      return;
    }
    case 'island': {
      sky(g, 'day', s);
      cloud(g, 6 + (s % 4), 4, 6);
      peak(g, 24, 8, 15, 8, NQ.teal, NQ.night);
      hills(g, 15, 4, NQ.green, s);
      water(g, 15, E, NQ.azure, s);
      layer(g, (l) => {
        oval(l, 15, 21, 8, 3.5, NQ.green, NQ.forest, (_x, y) => y <= 21);
        box(l, 8, 21, 22, 22, NQ.brown);
      });
      for (let i = 0; i < 4; i++) tree(g, 11 + i * 3, 19 - (i % 2), 4, NQ.forest);
      box(g, 9, 24, 21, 24, NQ.blue);
      return;
    }
    case 'sail': {
      sky(g, 'day', s);
      cloud(g, 23 - (s % 5), 4, 6);
      peak(g, 6, 9, 14, 5, NQ.teal, NQ.night);
      peak(g, 11, 10, 14, 5, NQ.teal, NQ.night);
      water(g, 14, E, NQ.azure, s);
      const boat = (l: Grid, x: number, y: number, w: number): void => {
        box(l, x, y - w * 1.2, x + w, y - 2, NQ.white);
        pattern(
          l,
          NQ.cloud,
          (xx, yy) => yy < y - 1 && xx > x && xx < x + w && (xx - x) % 2 === 0 && !!l[yy]![xx],
        );
        seg(l, x + w / 2, y - 1, x + w / 2, y - 2, NQ.brown);
        box(l, x - 1, y - 1, x + w + 1, y, NQ.brown);
      };
      layer(g, (l) => {
        boat(l, 5, 26, 7);
        boat(l, 20, 20, 5);
      });
      return;
    }
    case 'dam': {
      sky(g, 'day', s);
      cloud(g, 7 + (s % 5), 3, 6);
      hills(g, 11, 5, NQ.teal, s);
      box(g, 1, 11, E, 16, NQ.azure);
      box(g, 1, 11, E, 11, NQ.sky);
      ripples(g, 3, 12, 28, 16, NQ.sky, s, 5, 3);
      for (let y = 8; y <= E; y++) {
        const w = 1 + (y - 8) * 0.3;
        box(g, 1, y, w, y, NQ.green);
        box(g, E - w, y, E, y, NQ.green);
      }
      layer(g, (l) => {
        for (let y = 17; y <= 27; y++) {
          const half = 13 - (y - 17) * 0.25;
          box(l, 16 - half, y, 16 + half, y, NQ.silver);
          box(l, 16 + half - 2, y, 16 + half, y, NQ.gray);
        }
        box(l, 3, 17, 29, 17, NQ.cloud);
        for (let x = 4; x <= 28; x += 3) dot(l, x, 16, NQ.cloud);
        pattern(l, NQ.gray, (_x, y) => y > 18 && y % 3 === 0);
        box(l, 14, 18, 17, 27, NQ.white);
        pattern(l, NQ.ice, (x, y) => y > 18 && x >= 14 && x <= 17 && (x + y) % 3 === 0);
      });
      box(g, 1, 28, E, E, NQ.teal);
      splash(g, 15.5, 28, 3);
      pattern(g, NQ.forest, (x, y) => g[y]![x] === NQ.green && blk(x, y, s) < 0.4);
      return;
    }
    case 'big': {
      sky(g, 'day', s);
      cloud(g, 8 + (s % 5), 4, 7);
      cloud(g, 24, 8, 5);
      hills(g, 14, 3, NQ.teal, s);
      for (let x = 14; x <= E; x++) for (let y = 10; y <= 13; y++) dot(g, x, y, y < 12 ? NQ.sky : NQ.ice);
      box(g, 1, 14, E, E, NQ.azure);
      box(g, 1, 14, E, 15, NQ.sky);
      ripples(g, 2, 17, E - 1, E, NQ.sky, s, 10, 3);
      layer(g, (l) => {
        box(l, 18, 18, 23, 18, NQ.white);
        box(l, 19, 17, 21, 17, NQ.red);
      });
      box(g, 1, 27, 8, E, NQ.leaf);
      for (let x = 2; x <= 9; x += 2) seg(g, x, 27, x + 1, 23, NQ.green);
      return;
    }
    default: {
      sky(g, 'day', s);
      cloud(g, 22 - (s % 5), 4, 7);
      peak(g, 8, 9, 16, 9, NQ.teal, NQ.night, 2);
      hills(g, 16, 4, NQ.green, s);
      water(g, 16, E, NQ.azure, s);
      box(g, 1, 16, E, 16, NQ.forest);
      layer(g, (l) => {
        box(l, 18, 22, 24, 22, NQ.white);
        box(l, 19, 21, 22, 21, NQ.white);
        box(l, 19, 23, 23, 23, NQ.blue);
      });
      box(g, 1, 27, E, E, NQ.leaf);
      for (let x = 2; x <= E; x += 3) seg(g, x, 27, x + 1, 24, NQ.green);
    }
  }
};

const pond: SceneFn = (g, o) => {
  const s = o.seed;
  sky(g, 'day', s);
  peak(g, 16, 2, 9, 16, NQ.teal, NQ.night, 0, 3);
  box(g, 1, 9, E, E, NQ.green);
  pattern(g, NQ.forest, (x, y) => y >= 9 && blk(x, y, s) < 0.4);
  layer(g, (l) => {
    oval(l, 9, 15, 7, 3.5, NQ.blue);
    oval(l, 22, 21, 7, 3.5, NQ.teal);
    oval(l, 10, 26, 6, 3, NQ.aqua);
  });
  ripples(g, 5, 14, 12, 16, NQ.azure, s, 2);
  ripples(g, 19, 20, 25, 22, NQ.aqua, s + 1, 2);
  ripples(g, 6, 25, 13, 27, NQ.mint, s + 2, 2);
  tree(g, 26, 14, 6, NQ.forest);
  tree(g, 29, 15, 5, NQ.forest);
  tree(g, 20, 29, 6, NQ.forest);
  tree(g, 3, 21, 5, NQ.forest);
};

const spring: SceneFn = (g, o) => {
  const s = o.seed;
  if (o.v === 'carp') {
    box(g, 1, 1, E, E, NQ.aqua);
    for (let i = 0; i < 18; i++) {
      const x = 2 + Math.floor(rnd(s, i) * 28);
      const y = 7 + Math.floor(rnd(s, i + 30) * 18);
      oval(g, x, y, 1.2, 0.8, i % 2 ? NQ.mint : NQ.teal);
    }
    box(g, 1, 1, E, 5, NQ.silver);
    box(g, 1, 26, E, E, NQ.silver);
    for (let x = 1; x <= E; x++) {
      dot(g, x, (x % 4) + 1 === 2 ? 3 : 5, NQ.gray);
      if (x % 4 === 0) seg(g, x, 1, x, 5, NQ.gray);
      if (x % 4 === 2) seg(g, x, 26, x, E, NQ.gray);
    }
    box(g, 1, 28, E, 28, NQ.gray);
    const carp = (l: Grid, x: number, y: number, f: number, body: string, spot: string): void => {
      oval(l, x, y, 3, 1.3, body);
      dot(l, x + f, y - 1, spot);
      dot(l, x - f, y, spot);
      tri(l, x - f * 2.5, y + 0.5, x - f * 4.8, y - 1.5, x - f * 4.8, y + 2.5, body);
      dot(l, x + f * 2, y, NQ.ink);
    };
    layer(g, (l) => {
      carp(l, 10, 11, 1, NQ.red, NQ.white);
      carp(l, 22, 16, -1, NQ.white, NQ.red);
      carp(l, 12, 21, 1, NQ.gold, NQ.orange);
    });
    return;
  }
  if (o.v === 'fuji') {
    sky(g, 'day', s);
    fuji(g, 18, 3, 15, 13, 4);
    box(g, 1, 15, E, E, NQ.leaf);
    layer(g, (l) => {
      tri(l, 1, 16, 12, 16, 6, 9, NQ.tan);
      pattern(l, NQ.brown, (x, y) => y > 11 && (x + y) % 3 === 0);
      box(l, 2, 16, 10, 19, NQ.paper);
      box(l, 4, 17, 5, 19, NQ.bark);
    });
    layer(g, (l) => oval(l, 18, 25, 11, 4.5, NQ.mint));
    oval(g, 18, 25.5, 8, 3, NQ.aqua);
    speckle(g, 11, 23, 25, 27, NQ.teal, s, 10);
    layer(g, (l) => {
      oval(l, 16, 25, 1.5, 0.8, NQ.slate);
      oval(l, 21, 26, 1.5, 0.8, NQ.slate);
    });
    return;
  }
  sky(g, 'day', s);
  box(g, 1, 10, E, E, NQ.green);
  for (let i = 0; i < 8; i++) tree(g, 2 + i * 4, 13, 6, NQ.forest);
  layer(g, (l) => oval(l, 16, 22, 13, 6, NQ.mint));
  oval(g, 16, 22.5, 9, 3.8, NQ.aqua);
  speckle(g, 5, 18, 27, 26, NQ.teal, s, 14);
  for (let i = 0; i < 4; i++) oval(g, 12 + i * 3, 22 - (i % 2) * 2, 0.8, 0.8, NQ.white);
};

// ───────────────────────── 滝 ─────────────────────────

function cliffBg(g: Grid, s: number, y0: number, y1: number): void {
  box(g, 1, y0, E, y1, NQ.gray);
  pattern(g, NQ.slate, (x, y) => y >= y0 && y <= y1 && (x * 5 + y * 3) % 7 === 0);
  pattern(g, NQ.silver, (x, y) => y >= y0 && y <= y1 && (x * 3 + y * 7) % 11 === 0);
  pattern(g, NQ.green, (x, y) => y >= y0 && y <= y1 && blk(x, y, s) < 0.18);
}

const waterfall: SceneFn = (g, o) => {
  const s = o.seed;
  switch (o.v) {
    case 'wide': {
      sky(g, 'day', s);
      box(g, 1, 6, E, 10, NQ.green);
      for (let i = 0; i < 8; i++) tree(g, 2 + i * 4, 10, 6, NQ.forest);
      cliffBg(g, s, 11, 22);
      fall(g, 4, 27, 12, 21);
      box(g, 4, 11, 27, 11, NQ.sky);
      water(g, 22, E, NQ.azure, s);
      splash(g, 9, 22, 4);
      splash(g, 22, 22, 4);
      splash(g, 15.5, 22.5, 3);
      return;
    }
    case 'steps': {
      sky(g, 'day', s);
      cliffBg(g, s, 3, E);
      const tiers: [number, number, number, number][] = [
        [13, 18, 3, 8],
        [10, 20, 10, 14],
        [8, 23, 16, 20],
        [5, 26, 22, 25],
      ];
      for (const [x0, x1, y0, y1] of tiers) {
        fall(g, x0, x1, y0, y1);
        box(g, x0 - 1, y1 + 1, x1 + 1, y1 + 1, NQ.slate);
        oval(g, (x0 + x1) / 2, y1 + 0.5, (x1 - x0) / 2 + 1, 1, NQ.white);
      }
      water(g, 27, E, NQ.azure, s);
      box(g, 1, 3, E, 4, NQ.green);
      layer(g, (l) => {
        roundTree(l, 3, 14, 2.5, NQ.leaf);
        roundTree(l, 28, 17, 2.5, NQ.leaf);
      });
      return;
    }
    case 'tall': {
      sky(g, 'day', s);
      cloud(g, 24 - (s % 4), 3, 5);
      box(g, 1, 4, 13, E, NQ.gray);
      box(g, 18, 3, E, E, NQ.slate);
      pattern(g, NQ.silver, (x, y) => x < 14 && (x * 3 + y * 5) % 7 === 0);
      pattern(g, NQ.gray, (x, y) => x > 17 && (x * 3 + y * 5) % 6 === 0);
      box(g, 14, 2, 17, E, NQ.gray);
      pattern(g, NQ.green, (x, y) => (x < 6 || x > 25) && blk(x, y, s) < 0.35);
      box(g, 1, 3, 13, 4, NQ.green);
      box(g, 18, 2, E, 3, NQ.green);
      fall(g, 15, 16, 2, 25);
      water(g, 26, E, NQ.azure, s);
      splash(g, 15.5, 26, 4);
      oval(g, 15.5, 24, 5, 2, NQ.cloud);
      oval(g, 15.5, 24.3, 3, 1.2, NQ.white);
      return;
    }
    case 'pagoda': {
      sky(g, 'day', s);
      box(g, 14, 1, E, E, NQ.slate);
      pattern(g, NQ.gray, (x, y) => (x * 3 + y * 5) % 6 === 0);
      box(g, 14, 1, 17, E, NQ.forest);
      box(g, 27, 1, E, E, NQ.forest);
      fall(g, 20, 24, 2, 26);
      water(g, 27, E, NQ.azure, s);
      splash(g, 22, 27, 4);
      box(g, 1, 20, 16, E, NQ.green);
      for (let i = 0; i < 4; i++) roundTree(g, 1 + i * 4, E + 1, 3, NQ.forest);
      layer(g, (l) => {
        const tier = (y: number, w: number): void => {
          box(l, 9 - w, y, 9 + w, y + 2, NQ.vermilion);
          box(l, 10, y, 9 + w, y + 2, NQ.brick);
          box(l, 8 - w, y - 1, 10 + w, y - 1, NQ.bark);
          box(l, 9 - w, y - 2, 9 + w, y - 2, NQ.bark);
        };
        tier(22, 3);
        tier(17, 2.5);
        tier(12, 2);
        seg(l, 9, 9, 9, 5, NQ.gold);
        box(l, 8, 25, 10, 26, NQ.vermilion);
      });
      return;
    }
    default: {
      const autumn = o.v === 'autumn';
      sky(g, 'day', s);
      cloud(g, 6 + (s % 5), 3, 6);
      cliffBg(g, s, 5, 23);
      box(g, 1, 4, E, 6, NQ.green);
      fall(g, 13, 18, 5, 23);
      box(g, 13, 5, 18, 5, NQ.sky);
      water(g, 24, E, NQ.azure, s);
      splash(g, 15.5, 24, 5);
      if (autumn) {
        const cols = [NQ.red, NQ.orange, NQ.vermilion, NQ.gold];
        layer(g, (l) => {
          roundTree(l, 4, 24, 4, NQ.red);
          roundTree(l, 27, 25, 4, NQ.orange);
          roundTree(l, 8, E + 1, 3, NQ.gold);
          roundTree(l, 23, E + 2, 3, NQ.vermilion);
        });
        for (let i = 0; i < 8; i++) roundTree(g, 2 + i * 4, 6, 1.5, cols[(i + s) % 4]!);
      } else {
        for (let i = 0; i < 8; i++) tree(g, 2 + i * 4, 6, 5, NQ.forest);
        layer(g, (l) => {
          roundTree(l, 4, 25, 3.5, NQ.leaf);
          roundTree(l, 27, 26, 3.5, NQ.green);
        });
      }
    }
  }
};

// ───────────────────────── 峡谷・川 ─────────────────────────

const gorge: SceneFn = (g, o) => {
  const s = o.seed;
  const open = (y: number): number => (y < 13 ? 0.6 : 0.6 + (y - 13) * 0.45);
  const rock = (x: number, y: number, d: number, k: number): string => {
    if (k < 1.5) return NQ.green;
    if (k < 3 && (x + y) % 2 === 0) return NQ.forest;
    const right = x > 15;
    if (Math.round(y + d * 0.5) % 4 === 0) return right ? NQ.slate : NQ.gray;
    return right ? NQ.gray : NQ.silver;
  };
  switch (o.v) {
    case 'autumn': {
      sky(g, 'day', s);
      box(g, 1, 12, E, E, NQ.azure);
      ripples(g, 10, 20, 22, E, NQ.ice, s, 6);
      const cols = [NQ.red, NQ.orange, NQ.gold, NQ.vermilion, NQ.red, NQ.green];
      walls(g, 13, 0.75, open, (x, y, d, k) => {
        if (d < open(y) + 1.5 && k > 3) return x > 15 ? NQ.gray : NQ.silver;
        return cols[Math.floor(blk(x, y, s + (k < 2 ? 3 : 0)) * cols.length)]!;
      });
      return;
    }
    case 'stream': {
      box(g, 1, 1, E, E, NQ.green);
      pattern(g, NQ.forest, (x, y) => blk(x, y, s) < 0.45);
      pattern(g, NQ.leaf, (x, y) => blk(x, y, s + 2) < 0.15);
      for (let y = 1; y <= E; y++) {
        const cx = 16 + Math.sin(y / 5) * 5;
        const half = 1.5 + y * 0.15;
        box(g, cx - half, y, cx + half, y, NQ.aqua);
        dot(g, cx - half + 1, y, NQ.mint);
        if (y % 4 === 0) box(g, cx - 1, y, cx + 1, y, NQ.white);
      }
      layer(g, (l) => {
        const rocks: [number, number, number][] = [
          [9, 26, 3.5],
          [24, 24, 3],
          [15, 16, 2],
          [22, 11, 2],
          [5, 13, 2.5],
          [27, 29, 3],
        ];
        for (const [x, y, r] of rocks) {
          oval(l, x, y, r, r * 0.7, NQ.leaf, NQ.green);
          oval(l, x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.25, NQ.lime);
        }
      });
      return;
    }
    case 'arch': {
      sky(g, 'day', s);
      hills(g, 18, 7, NQ.green, s);
      box(g, 1, 18, E, E, NQ.forest);
      for (let y = 18; y <= E; y++) {
        const half = 2 + (y - 18) * 0.5;
        box(g, 16 - half, y, 16 + half, y, NQ.aqua);
      }
      ripples(g, 11, 22, 21, E, NQ.mint, s, 5);
      layer(g, (l) => {
        oval(l, 16, 26, 15, 21, NQ.silver, NQ.gray, (x, y) => {
          const dx = (x + 0.5 - 16) / 9;
          const dy = (y + 0.5 - 26) / 15;
          return dx * dx + dy * dy > 1 && y <= 26;
        });
        pattern(l, NQ.green, (x, y) => y < 9 && blk(x, y, s) < 0.5);
        pattern(l, NQ.gray, (x, y) => y > 9 && (x * 3 + y * 5) % 7 === 0);
      });
      return;
    }
    case 'boat': {
      sky(g, 'day', s);
      box(g, 1, 12, E, E, NQ.teal);
      ripples(g, 8, 18, 24, E, NQ.aqua, s, 6, 3);
      walls(
        g,
        12,
        1.2,
        (y) => (y < 12 ? 1 : 2 + (y - 12) * 0.35),
        (x, y, d, k) =>
          k < 2 ? NQ.green : x % 3 === 0 ? (x > 15 ? NQ.slate : NQ.gray) : x > 15 ? NQ.gray : NQ.silver,
      );
      layer(g, (l) => {
        longBoat(l, 9, 23, 23);
        person(l, 12, 22, NQ.blue);
        person(l, 16, 22, NQ.red);
        person(l, 20, 22, NQ.indigo, NQ.sand);
        seg(l, 22, 14, 24, 25, NQ.brown);
      });
      return;
    }
    case 'waterfall': {
      sky(g, 'day', s);
      box(g, 1, 10, E, E, NQ.teal);
      walls(
        g,
        10,
        1.5,
        (y) => (y < 10 ? 1 : 2.5 + (y - 10) * 0.3),
        (x, y, d, k) =>
          k < 1.5 ? NQ.green : x % 2 === 0 ? (x > 15 ? NQ.night : NQ.slate) : x > 15 ? NQ.slate : NQ.gray,
      );
      fall(g, 6, 7, 3, 22);
      splash(g, 7, 23, 2.5);
      ripples(g, 9, 20, 24, E, NQ.aqua, s, 5, 3);
      layer(g, (l) => {
        box(l, 15, 26, 22, 26, NQ.vermilion);
        box(l, 16, 27, 21, 27, NQ.brick);
        person(l, 18, 25, NQ.blue);
        seg(l, 16, 23, 14, 28, NQ.brown);
      });
      return;
    }
    case 'train': {
      sky(g, 'day', s);
      box(g, 1, 12, E, E, NQ.aqua);
      ripples(g, 10, 24, 22, E, NQ.white, s, 5, 2);
      walls(g, 12, 1, open, (x, y, d, k) =>
        k < 2
          ? NQ.green
          : blk(x, y, s) < 0.55
            ? x > 15
              ? NQ.forest
              : NQ.green
            : x > 15
              ? NQ.gray
              : NQ.silver,
      );
      layer(g, (l) => {
        box(l, 1, 17, E, 17, NQ.red);
        for (let x = 3; x <= E; x += 4) {
          seg(l, x, 18, x + 2, 20, NQ.red);
          seg(l, x + 2, 18, x, 20, NQ.red);
        }
        box(l, 1, 20, E, 20, NQ.red);
        box(l, 12, 23, 13, E, NQ.brick);
        box(l, 20, 23, 21, E, NQ.brick);
        box(l, 5, 13, 10, 16, NQ.orange);
        box(l, 12, 13, 17, 16, NQ.orange);
        box(l, 19, 13, 24, 16, NQ.orange);
        for (const x of [5, 12, 19]) box(l, x + 1, 14, x + 4, 14, NQ.cream);
        box(l, 25, 12, 28, 16, NQ.brick);
        box(l, 26, 13, 27, 13, NQ.ice);
      });
      return;
    }
    default: {
      sky(g, 'day', s);
      cloud(g, 16, 4, 6);
      box(g, 1, 12, E, E, NQ.azure);
      ripples(g, 9, 18, 23, E, NQ.white, s, 7, 2);
      walls(g, 13, 0.75, open, rock);
    }
  }
};

const river: SceneFn = (g, o) => {
  const s = o.seed;
  switch (o.v) {
    case 'bridge': {
      sky(g, 'day', s);
      cloud(g, 7 + (s % 5), 4, 6);
      hills(g, 16, 9, NQ.green, s);
      hills(g, 16, 4, NQ.forest, s + 4);
      water(g, 16, E, NQ.teal, s, NQ.aqua);
      box(g, 1, 16, E, 16, NQ.sand);
      layer(g, (l) => {
        box(l, 1, 20, E, 21, NQ.silver);
        box(l, 1, 20, E, 20, NQ.cloud);
        for (let x = 4; x <= E; x += 7) box(l, x, 22, x + 1, 24, NQ.gray);
        person(l, 20, 19, NQ.red);
      });
      box(g, 1, 25, E, 25, NQ.aqua);
      return;
    }
    case 'blue': {
      sky(g, 'day', s);
      hills(g, 13, 8, NQ.green, s);
      box(g, 1, 13, E, E, NQ.forest);
      pattern(g, NQ.green, (x, y) => y > 13 && blk(x, y, s) < 0.4);
      for (let y = 12; y <= E; y++) {
        const cx = 16 + Math.sin(y / 4) * (y - 10) * 0.35;
        const half = 1 + (y - 12) * 0.55;
        box(g, cx - half - 1, y, cx + half + 1, y, NQ.cloud);
        box(g, cx - half, y, cx + half, y, NQ.aqua);
        box(g, cx - half * 0.5, y, cx + half * 0.5, y, NQ.azure);
      }
      speckle(g, 6, 20, 26, E, NQ.mint, s, 8);
      return;
    }
    case 'alps': {
      sky(g, 'day', s);
      layer(g, (l) => {
        peak(l, 7, 4, 16, 8, NQ.denim, NQ.navy, 5);
        peak(l, 17, 3, 16, 9, NQ.denim, NQ.navy, 5);
        peak(l, 27, 5, 16, 8, NQ.denim, NQ.navy, 5);
      });
      box(g, 1, 16, E, E, NQ.green);
      for (let i = 0; i < 9; i++) tree(g, 1 + i * 4, 19, 5, NQ.forest);
      for (let y = 18; y <= E; y++) {
        const half = 2 + (y - 18) * 0.7;
        box(g, 16 - half - 1, y, 16 + half + 1, y, NQ.cloud);
        box(g, 16 - half, y, 16 + half, y, NQ.aqua);
      }
      ripples(g, 10, 22, 22, E, NQ.mint, s, 5);
      layer(g, (l) => {
        box(l, 2, 23, 29, 23, NQ.brown);
        box(l, 3, 18, 3, 23, NQ.bark);
        box(l, 28, 18, 28, 23, NQ.bark);
        for (let x = 4; x <= 27; x++) {
          const y = 18 + Math.round(3 * Math.sin(((x - 3) / 25) * Math.PI));
          dot(l, x, y, NQ.tan);
        }
      });
      return;
    }
    default: {
      sky(g, 'day', s);
      cloud(g, 7 + (s % 5), 4, 6);
      hills(g, 13, 5, NQ.teal, s);
      box(g, 1, 13, E, E, NQ.lime);
      for (let y = 15; y <= E; y += 3) box(g, 1, y, E, y, NQ.leaf);
      for (let y = 12; y <= E; y++) {
        const cx = 16 + Math.sin(y / 3.5) * (y - 10) * 0.45;
        const half = 0.6 + (y - 12) * 0.3;
        box(g, cx - half - 1, y, cx + half + 1, y, NQ.sand);
        box(g, cx - half, y, cx + half, y, NQ.azure);
        dot(g, cx - half * 0.3, y, y % 3 ? NQ.azure : NQ.sky);
      }
      roundTree(g, 5, 20, 2, NQ.green);
      roundTree(g, 27, 17, 1.6, NQ.green);
      layer(g, (l) => {
        tri(l, 22, 25, 28, 25, 25, 22, NQ.brick);
        box(l, 23, 25, 27, 27, NQ.paper);
      });
    }
  }
};

const riverBoat: SceneFn = (g, o) => {
  const s = o.seed;
  if (o.v === 'canal') {
    sky(g, 'day', s);
    box(g, 1, 9, E, 13, NQ.silver);
    for (let y = 9; y <= 13; y += 2) box(g, 1, y, E, y, NQ.gray);
    for (let x = 2; x <= E; x += 3) seg(g, x, 9, x, 13, NQ.gray);
    box(g, 1, 7, E, 8, NQ.leaf);
    water(g, 14, E, NQ.teal, s, NQ.aqua);
    for (const x of [4, 13, 24]) {
      seg(g, x, 8, x, 3, NQ.brown);
      oval(g, x, 3, 4, 2.5, NQ.lime, NQ.leaf);
      for (let i = -3; i <= 3; i += 2) seg(g, x + i, 4, x + i, 7 + ((i + 3) % 3) * 2, NQ.leaf);
    }
    layer(g, (l) => {
      longBoat(l, 5, 25, 22);
      person(l, 9, 21, NQ.red);
      person(l, 13, 21, NQ.azure);
      person(l, 17, 21, NQ.gold);
      person(l, 22, 21, NQ.indigo, NQ.sand);
      seg(l, 25, 13, 27, 26, NQ.brown);
    });
    return;
  }
  sky(g, 'day', s);
  cloud(g, 8 + (s % 5), 4, 6);
  hills(g, 17, 9, NQ.green, s);
  hills(g, 17, 5, NQ.forest, s + 2);
  water(g, 17, E, NQ.teal, s, NQ.aqua);
  box(g, 1, 17, E, 17, NQ.sand);
  layer(g, (l) => {
    longBoat(l, 4, 26, 23);
    person(l, 8, 22, NQ.red);
    person(l, 12, 22, NQ.blue);
    person(l, 16, 22, NQ.gold);
    person(l, 22, 22, NQ.indigo, NQ.sand);
    seg(l, 25, 13, 28, 27, NQ.brown);
  });
};

const tubBoat: SceneFn = (g, o) => {
  const s = o.seed;
  sky(g, 'day', s);
  cloud(g, 22 - (s % 4), 4, 6);
  water(g, 13, E, NQ.azure, s);
  box(g, 1, 13, E, 13, NQ.sky);
  layer(g, (l) => {
    oval(l, 5, 16, 6, 3.5, NQ.gray, NQ.slate, (_x, y) => y <= 16);
    oval(l, 27, 15, 4, 2.5, NQ.gray, NQ.slate, (_x, y) => y <= 15);
  });
  pattern(g, NQ.green, (x, y) => y < 14 && (x < 9 || x > 24) && g[y]![x] === NQ.gray && (x + y) % 2 === 0);
  layer(g, (l) => {
    person(l, 15, 21, NQ.indigo);
    tri(l, 11.5, 17, 20.5, 17, 16, 13, NQ.sand);
    box(l, 12, 16, 20, 16, NQ.tan);
    oval(l, 16, 23, 8, 3.5, NQ.brown);
    oval(l, 16, 22, 7, 2, NQ.bark, undefined, (_x, y) => y <= 21);
    box(l, 9, 23, 23, 23, NQ.tan);
    box(l, 10, 25, 22, 25, NQ.tan);
    seg(l, 20, 18, 26, 26, NQ.tan);
  });
  ripples(g, 5, 27, 27, 29, NQ.ice, s, 4, 3);
};

// ───────────────────────── 海べ ─────────────────────────

function surf(g: Grid, y: number, seed: number): void {
  for (let x = 1; x <= E; x++) {
    const yy = y + Math.round(Math.sin((x + seed) / 2.2) * 0.8);
    dot(g, x, yy, NQ.white);
    dot(g, x, yy + 1, NQ.ice);
  }
}

const beach: SceneFn = (g, o) => {
  const s = o.seed;
  switch (o.v) {
    case 'long': {
      sky(g, 'day', s);
      cloud(g, 20 - (s % 5), 4, 7);
      box(g, 1, 12, E, E, NQ.azure);
      box(g, 1, 12, E, 12, NQ.sky);
      for (let y = 12; y <= E; y++) {
        const t = (y - 12) / 18;
        const sea0 = 3 + t * 20;
        const land = 2 - t * 14;
        box(g, 1, y, land, y, NQ.green);
        box(g, land + 1, y, sea0, y, NQ.sand);
        dot(g, sea0 + 1, y, NQ.white);
        dot(g, sea0 + 2, y, NQ.ice);
        if (y % 3 === 0) box(g, sea0 + 4, y, sea0 + 7, y, NQ.ice);
      }
      for (let i = 0; i < 4; i++) tree(g, 1 + i * 2, 13 + i * 5, 4 + i, NQ.forest);
      return;
    }
    case 'emerald': {
      sky(g, 'day', s);
      cloud(g, 16 + (s % 5), 4, 6);
      box(g, 1, 11, E, E, NQ.teal);
      box(g, 1, 11, E, 11, NQ.sky);
      for (let y = 16; y <= E; y++) box(g, 1, y, E, y, y < 21 ? NQ.aqua : NQ.mint);
      layer(g, (l) => {
        oval(l, 3, 13, 6, 4, NQ.green, NQ.forest, (_x, y) => y <= 13);
        oval(l, 29, 12, 7, 4, NQ.green, NQ.forest, (_x, y) => y <= 12);
        oval(l, 17, 14, 3, 2.5, NQ.green, NQ.forest, (_x, y) => y <= 14);
        oval(l, 22, 15, 2, 1.5, NQ.green, undefined, (_x, y) => y <= 15);
      });
      for (let y = 25; y <= E; y++) box(g, 1, y, E, y, NQ.paper);
      surf(g, 25, s);
      ripples(g, 2, 17, E - 1, 23, NQ.white, s, 5);
      return;
    }
    case 'white': {
      sky(g, 'day', s);
      sun(g, 25, 5, 2.5, NQ.cream);
      box(g, 1, 13, E, 21, NQ.azure);
      box(g, 1, 13, E, 13, NQ.sky);
      box(g, 1, 17, E, 21, NQ.aqua);
      box(g, 1, 22, E, E, NQ.white);
      pattern(g, NQ.paper, (x, y) => y > 22 && (x * 3 + y * 5) % 7 === 0);
      surf(g, 21, s);
      for (const [x, y] of [
        [6, 15],
        [14, 18],
        [22, 16],
      ] as const) {
        dot(g, x, y, NQ.white);
        dot(g, x - 1, y, NQ.ice);
        dot(g, x + 1, y, NQ.ice);
      }
      layer(g, (l) => {
        seg(l, 9, 18, 9, 28, NQ.brown);
        oval(l, 9, 19, 5, 2, NQ.red, undefined, (_x, y) => y <= 19);
        pattern(l, NQ.white, (x, y) => y < 20 && x % 3 === 0 && !!l[y]![x] && l[y]![x] !== NQ.brown);
      });
      return;
    }
    default: {
      const car = o.v === 'car';
      sky(g, 'day', s);
      cloud(g, 8 + (s % 6), 4, 7);
      box(g, 1, 12, E, 21, NQ.azure);
      box(g, 1, 12, E, 12, NQ.sky);
      ripples(g, 2, 14, E - 1, 20, NQ.ice, s, 6, 3);
      box(g, 1, 22, E, E, car ? NQ.tan : NQ.sand);
      pattern(g, NQ.beige, (x, y) => y > 22 && (x * 5 + y * 3) % 9 === 0);
      surf(g, 21, s);
      if (car) {
        box(g, 1, 28, E, 28, NQ.brown);
        layer(g, (l) => {
          box(l, 9, 24, 21, 27, NQ.red);
          box(l, 12, 21, 18, 23, NQ.red);
          box(l, 13, 22, 17, 23, NQ.ice);
          box(l, 20, 25, 21, 25, NQ.cream);
          oval(l, 12, 28, 1.6, 1.6, NQ.hairBlack);
          oval(l, 19, 28, 1.6, 1.6, NQ.hairBlack);
        });
      } else {
        pine(g, 26, 26, 12, true);
        dot(g, 8, 26, NQ.blush);
        dot(g, 14, 28, NQ.cream);
      }
    }
  }
};

const mirrorBeach: SceneFn = (g, o) => {
  const s = o.seed;
  sky(g, 'dusk', s);
  sun(g, 22, 11, 2.5, NQ.cream);
  box(g, 1, 14, E, 15, NQ.violet);
  mirrorY(g, 16, E, 15, (c) => c);
  box(g, 1, 28, E, 28, NQ.tan);
  box(g, 6, 27, 14, 27, NQ.tan);
  // ジャンプする 人の かげと、ぬれた すなに うつった さかさの かげ
  const JUMP = [
    '...###...',
    '...###...',
    '##..#..##',
    '.#######.',
    '...###...',
    '...###...',
    '..##.##..',
    '..#...#..',
    '.##...##.',
  ];
  JUMP.forEach((row, i) =>
    [...row].forEach((ch, x) => {
      if (ch !== '#') return;
      dot(g, 7 + x, 3 + i, NQ.ink);
      dot(g, 7 + x, 27 - i, NQ.night);
    }),
  );
};

const sandbar: SceneFn = (g, o) => {
  const s = o.seed;
  if (o.v === 'fuji') {
    sky(g, 'day', s);
    fuji(g, 22, 5, 16, 11, 4);
    box(g, 1, 16, E, 16, NQ.forest);
    water(g, 17, 23, NQ.azure, s);
    box(g, 1, 24, E, E, NQ.sand);
    surf(g, 23, s);
    layer(g, (l) => {
      pine(l, 5, E, 20);
      pine(l, 13, E, 14, true);
    });
    return;
  }
  sky(g, 'day', s);
  hills(g, 11, 6, NQ.teal, s);
  box(g, 1, 11, E, E, NQ.azure);
  ripples(g, 2, 12, E - 1, E, NQ.sky, s, 8, 3);
  for (let x = 1; x <= E; x++) {
    const y = 27 - (x - 1) * 0.55;
    box(g, x, y - 1.2, x, y + 0.6, NQ.green);
    dot(g, x, y + 1, NQ.sand);
    if (x % 2 === 0) dot(g, x, y - 2, NQ.forest);
  }
  layer(g, (l) => oval(l, 1, E + 3, 8, 6, NQ.leaf, NQ.green));
};

const island: SceneFn = (g, o) => {
  const s = o.seed;
  sky(g, 'day', s);
  cloud(g, 6 + (s % 5), 4, 6);
  if (o.v === 'bridge') {
    box(g, 1, 12, E, E, NQ.teal);
    box(g, 1, 12, E, 12, NQ.sky);
    for (let y = 15; y <= E; y++) box(g, 1, y, E, y, y < 22 ? NQ.aqua : NQ.mint);
    layer(g, (l) => oval(l, 23, 13, 9, 4, NQ.green, NQ.forest, (_x, y) => y <= 13));
    box(g, 15, 13, E, 13, NQ.paper);
    layer(g, (l) => {
      for (let x = 1; x <= 18; x++) {
        const y = 28 - (x - 1) * 0.8;
        box(l, x, y, x, y + 1, NQ.cloud);
        if (x % 4 === 0) box(l, x, y + 2, x, y + 4, NQ.silver);
      }
    });
    ripples(g, 2, 20, E - 1, E, NQ.white, s, 5);
    return;
  }
  water(g, 17, E, NQ.azure, s);
  box(g, 1, 17, E, 17, NQ.sky);
  layer(g, (l) => {
    oval(l, 17, 18, 10, 7, NQ.green, NQ.forest, (_x, y) => y <= 18);
    box(l, 7, 17, 27, 19, NQ.tan);
    box(l, 8, 19, 26, 19, NQ.brown);
  });
  for (let i = 0; i < 5; i++) roundTree(g, 11 + i * 3, 14 - (i % 2), 1.6, i % 2 ? NQ.forest : NQ.leaf);
  if (o.v === 'tower') {
    layer(g, (l) => {
      box(l, 20, 5, 22, 13, NQ.white);
      box(l, 22, 5, 22, 13, NQ.cloud);
      box(l, 19, 3, 23, 5, NQ.silver);
      box(l, 20, 2, 22, 2, NQ.cream);
      for (let x = 1; x <= 9; x++) box(l, x, 22 + (x - 1) * 0.3, x, 22 + (x - 1) * 0.3, NQ.cloud);
    });
  }
  surf(g, 20, s);
};

const islands: SceneFn = (g, o) => {
  const s = o.seed;
  sky(g, 'day', s);
  cloud(g, 23 - (s % 5), 4, 6);
  water(g, 12, E, NQ.azure, s, NQ.sky);
  box(g, 1, 12, E, 12, NQ.sky);
  if (o.v === 'pine') {
    const rock = (l: Grid, x: number, by: number, w: number, h: number): void => {
      oval(l, x + 0.5, by - h * 0.5 + 0.5, w + 1, h * 0.5 + 1, NQ.cloud, NQ.silver);
      box(l, x - w, by - 1, x + w + 1, by, NQ.silver);
      pattern(
        l,
        NQ.gray,
        (xx, yy) => yy > by - h && yy <= by && Math.abs(xx - x) <= w && (xx * 3 + yy) % 5 === 0,
      );
      pine(l, x, by - h, Math.max(4, h + 1));
    };
    layer(g, (l) => {
      rock(l, 5, 17, 2, 3);
      rock(l, 16, 15, 1.5, 2);
      rock(l, 25, 20, 3, 5);
      rock(l, 10, 26, 3, 5);
    });
    layer(g, (l) => {
      box(l, 16, 26, 25, 27, NQ.white);
      box(l, 17, 28, 24, 28, NQ.red);
      box(l, 18, 24, 22, 25, NQ.white);
      box(l, 19, 25, 21, 25, NQ.ice);
    });
    return;
  }
  const isl: [number, number, number, number][] = [
    [4, 14, 3, 1.8],
    [11, 13, 2, 1.2],
    [20, 14, 4, 2],
    [28, 13, 2.5, 1.5],
    [8, 19, 4, 2.5],
    [25, 20, 5, 3],
    [16, 23, 3, 2],
    [5, 28, 5, 3.5],
    [27, 29, 4, 3],
  ];
  layer(g, (l) => {
    for (const [x, y, rx, ry] of isl) {
      oval(l, x, y + 0.5, rx, ry, NQ.green, NQ.forest, (_x, yy) => yy <= y);
      oval(l, x - rx * 0.3, y - ry * 0.4, rx * 0.4, ry * 0.3, NQ.leaf);
    }
  });
};

const rockyCoast: SceneFn = (g, o) => {
  const s = o.seed;
  switch (o.v) {
    case 'white': {
      sky(g, 'day', s);
      water(g, 14, 25, NQ.azure, s);
      box(g, 1, 14, E, 14, NQ.sky);
      layer(g, (l) => {
        const spike = (x: number, top: number, w: number): void => {
          tri(l, x - w, 25, x + w, 25, x - 0.5, top, NQ.paper);
          tri(l, x - 0.5, top, x + w, 25, x + 1, 25, NQ.cloud);
        };
        spike(4, 8, 4);
        spike(9, 11, 3);
        spike(22, 9, 3.5);
        spike(27, 7, 4);
        pattern(l, NQ.silver, (x, y) => y > 12 && (x * 3 + y) % 5 === 0);
      });
      pine(g, 4, 9, 5);
      pine(g, 27, 8, 5, true);
      pine(g, 22, 10, 4);
      box(g, 1, 26, E, E, NQ.cloud);
      speckle(g, 1, 26, E, E, NQ.silver, s, 30);
      speckle(g, 1, 26, E, E, NQ.white, s + 1, 20);
      box(g, 1, 25, E, 25, NQ.white);
      return;
    }
    case 'washboard': {
      sky(g, 'day', s);
      box(g, 1, 9, E, E, NQ.azure);
      box(g, 1, 9, E, 9, NQ.sky);
      layer(g, (l) => {
        oval(l, 16, 13, 6, 3, NQ.green, NQ.forest, (_x, y) => y <= 13);
        box(l, 10, 13, 22, 14, NQ.sand);
      });
      for (const x of [13, 16, 19]) {
        seg(g, x, 12, x, 8, NQ.brown);
        seg(g, x - 2, 7, x + 2, 7, NQ.leaf);
        dot(g, x, 6, NQ.leaf);
      }
      for (let y = 16; y <= E; y++)
        for (let x = 1; x <= E; x++) {
          const k = Math.floor((x + (y - 16) * 1.3) / 3);
          dot(g, x, y, k % 2 === 0 ? (y > 22 ? NQ.gray : NQ.silver) : k % 4 === 1 ? NQ.teal : NQ.slate);
        }
      box(g, 1, 16, E, 16, NQ.white);
      return;
    }
    case 'candle': {
      sky(g, 'dusk', s);
      box(g, 1, 17, E, E, NQ.indigo);
      box(g, 1, 17, E, 17, NQ.lavender);
      for (let y = 19; y <= E; y += 2) box(g, 14 - (y % 4), y, 18 + (y % 4), y, NQ.orange);
      layer(g, (l) => {
        box(l, 15, 12, 17, 24, NQ.brown);
        box(l, 17, 12, 17, 24, NQ.bark);
        box(l, 13, 22, 19, 24, NQ.brown);
        dot(l, 16, 11, NQ.green);
      });
      oval(g, 16, 8.5, 2.6, 2.6, NQ.gold);
      oval(g, 15.5, 8, 1.3, 1.3, NQ.cream);
      oval(g, 16, 8.5, 1, 3.5, NQ.gold);
      return;
    }
    default: {
      sky(g, 'day', s);
      water(g, 13, E, NQ.blue, s, NQ.azure);
      box(g, 1, 13, E, 13, NQ.sky);
      // ごつごつの 岩の がけ（左）と 岩だな（手前）、海に 立つ 岩
      layer(g, (l) => {
        for (let x = 1; x <= E; x++) {
          const b = Math.floor(x / 2);
          const j = Math.floor(rnd(s, b) * 3);
          const top = x < 11 ? 6 + x * 0.4 + j : 23 + j - (x > 24 ? 2 : 0);
          box(l, x, top, x, E, NQ.brown);
          dot(l, x, top, NQ.tan);
          if (x % 4 === 0) seg(l, x, top + 2, x, E, NQ.bark);
        }
        for (const [x, y, w, h] of [
          [17, 18, 2.5, 4],
          [24, 15, 2, 3],
        ] as const) {
          box(l, x - w, y - h, x + w, y + 2, NQ.brown);
          box(l, x - w + 1, y - h - 1, x + w - 1, y - h, NQ.tan);
          seg(l, x, y - h + 1, x, y + 2, NQ.bark);
        }
        pattern(l, NQ.tan, (x, y) => (x * 5 + y * 3) % 9 === 0 && l[y]![x] === NQ.brown);
      });
      splash(g, 12, 22, 2.5);
      splash(g, 17, 21, 3);
      splash(g, 27, 21, 2.5);
      splash(g, 24, 18, 2);
    }
  }
};

const capeCliff: SceneFn = (g, o) => {
  const s = o.seed;
  switch (o.v) {
    case 'north': {
      sky(g, 'cloudy', s);
      box(g, 1, 14, E, E, NQ.navy);
      box(g, 1, 14, E, 14, NQ.denim);
      hills(g, 14, 1.5, NQ.silver, s);
      ripples(g, 2, 16, E - 1, E, NQ.denim, s, 7, 3);
      for (let i = 0; i < 4; i++) {
        const x = 18 + i * 3;
        box(g, x, 22 + i * 2, x + 3, 22 + i * 2, NQ.white);
      }
      layer(g, (l) => {
        for (let y = 20; y <= E; y++) {
          const x1 = 17 + Math.round((y - 20) * 0.6);
          box(l, 1, y, x1, y, y < 23 ? NQ.leaf : NQ.brown);
          if (y >= 23) box(l, x1 - 1, y, x1, y, NQ.bark);
        }
        pattern(l, NQ.tan, (x, y) => y > 23 && (x * 3 + y * 5) % 7 === 0 && l[y]![x] === NQ.brown);
      });
      layer(g, (l) => {
        tri(l, 6, 21, 13, 21, 9.5, 5, NQ.silver);
        tri(l, 9.5, 5, 9.5, 21, 13, 21, NQ.gray);
        box(l, 5, 20, 14, 21, NQ.slate);
      });
      return;
    }
    case 'elephant': {
      sky(g, 'day', s);
      box(g, 1, 16, E, E, NQ.teal);
      for (let y = 20; y <= E; y++) box(g, 1, y, E, y, y < 25 ? NQ.aqua : NQ.teal);
      box(g, 1, 16, E, 16, NQ.sky);
      // 頭（おでこ）から 海へ のびる 鼻と、その あいだの 穴
      layer(g, (l) => {
        box(l, 1, 10, 17, 27, NQ.beige);
        oval(l, 16, 15, 10, 7, NQ.beige);
        for (let y = 15; y <= 27; y++) {
          const x0 = 21 + Math.round((y - 15) * 0.15);
          box(l, x0, y, x0 + 3 + Math.round((y - 15) * 0.1), y, NQ.beige);
        }
        oval(l, 19.5, 20, 2.5, 3, NQ.beige);
        for (let y = 20; y <= 27; y++)
          for (let x = 18; x <= 20 + Math.round((y - 20) * 0.15); x++) l[y]![x] = null;
        box(l, 1, 8, 20, 9, NQ.green);
        oval(l, 10, 8, 9, 2, NQ.green, undefined, (_x, y) => y <= 9);
        pattern(l, NQ.sand, (x, y) => y > 10 && (x * 3 + y * 5) % 7 === 0 && l[y]![x] === NQ.beige);
        oval(l, 13, 16, 3, 4, NQ.sand);
      });
      dot(g, 20, 13, NQ.ink);
      box(g, 20, 28, 27, 28, NQ.white);
      return;
    }
    case 'bridge': {
      sky(g, 'day', s);
      box(g, 1, 12, E, E, NQ.blue);
      for (let y = 14; y <= E; y++) {
        const half = 1 + (y - 12) * 0.35;
        box(g, 16 - half, y, 16 + half, y, NQ.azure);
      }
      ripples(g, 11, 18, 21, E, NQ.white, s, 6, 2);
      walls(
        g,
        12,
        0.3,
        (y) => (y < 12 ? 0 : 1 + (y - 12) * 0.35),
        (x, y, d, k) => (k < 1.5 ? NQ.green : (x + y) % 4 === 0 ? NQ.night : NQ.slate),
      );
      layer(g, (l) => {
        box(l, 5, 14, 26, 14, NQ.brown);
        for (let x = 6; x <= 25; x++)
          dot(l, x, 11 + Math.round(2 * Math.sin(((x - 5) / 21) * Math.PI)), NQ.tan);
        seg(l, 5, 10, 5, 14, NQ.bark);
        seg(l, 26, 10, 26, 14, NQ.bark);
      });
      splash(g, 16, 28, 4);
      return;
    }
    default: {
      const waves = o.v === 'waves';
      sky(g, 'day', s);
      cloud(g, 24 - (s % 5), 4, 6);
      water(g, 14, E, NQ.blue, s, NQ.azure);
      box(g, 1, 14, E, 14, NQ.sky);
      layer(g, (l) => {
        for (let y = 6; y <= E; y++) {
          const x1 = y < 8 ? 14 + (y - 6) : 16 - Math.max(0, (y - 22) * 0.2) + Math.round(Math.sin(y) * 0.8);
          box(l, 1, y, x1, y, y < 9 ? NQ.green : NQ.brown);
          if (y >= 9) box(l, x1 - 2, y, x1, y, NQ.bark);
        }
        pattern(l, NQ.tan, (x, y) => y > 9 && (x * 3 + y * 5) % 7 === 0 && l[y]![x] === NQ.brown);
        pattern(l, NQ.leaf, (x, y) => y < 8 && (x + y) % 3 === 0);
      });
      if (waves) {
        layer(
          g,
          (l) => {
            oval(l, 20, 20, 6, 5, NQ.white, NQ.cloud);
            oval(l, 21.5, 21, 3, 2.5, NQ.azure);
            oval(l, 27, 26, 5, 4, NQ.white, NQ.cloud);
            oval(l, 28, 27, 2.5, 2, NQ.azure);
            oval(l, 18, 13, 3, 3, NQ.white);
            oval(l, 19, 9, 2, 2, NQ.white);
            oval(l, 24, 12, 1.5, 1.5, NQ.white);
          },
          NQ.blue,
        );
      } else {
        splash(g, 18, 27, 3);
        splash(g, 18, 19, 2);
      }
    }
  }
};

const whirlpool: SceneFn = (g, o) => {
  const s = o.seed;
  sky(g, 'day', s);
  hills(g, 10, 4, NQ.green, s);
  box(g, 1, 10, E, E, NQ.blue);
  box(g, 1, 10, E, 10, NQ.azure);
  const spiral = (cx: number, cy: number, r: number): void => {
    oval(g, cx, cy, r + 1, (r + 1) * 0.55, NQ.azure);
    const turns = Math.PI * 4;
    for (let t = 0.8; t < turns; t += 0.05) {
      const rr = (t / turns) * r;
      const x = cx + Math.cos(t) * rr;
      const y = cy + Math.sin(t) * rr * 0.55;
      dot(g, x, y, NQ.white);
      if (t > turns * 0.45) dot(g, x, y + 1, NQ.ice);
    }
    oval(g, cx, cy, 1.4, 1, NQ.navy);
  };
  spiral(10, 21, 8);
  spiral(25, 16, 5);
  ripples(g, 2, 26, E - 1, E, NQ.azure, s, 4, 3);
  layer(g, (l) => {
    box(l, 1, 7, E, 7, NQ.paper);
    box(l, 1, 8, E, 8, NQ.silver);
    box(l, 7, 1, 8, 13, NQ.cloud);
    box(l, 23, 1, 24, 13, NQ.cloud);
    for (let x = 1; x <= E; x++) {
      const y =
        x < 8 ? 2 + (8 - x) * 0.6 : x > 23 ? 2 + (x - 23) * 0.6 : 2 + Math.sin(((x - 8) / 15) * Math.PI) * 4;
      dot(l, x, y, NQ.slate);
    }
  });
  layer(g, (l) => {
    box(l, 19, 25, 27, 26, NQ.white);
    box(l, 20, 27, 26, 27, NQ.red);
    box(l, 21, 23, 25, 24, NQ.cream);
    box(l, 22, 24, 24, 24, NQ.ice);
  });
};

const driftIce: SceneFn = (g, o) => {
  const s = o.seed;
  sky(g, 'day', s);
  layer(g, (l) => {
    peak(l, 8, 5, 12, 10, NQ.white, NQ.cloud, 0, 0);
    peak(l, 20, 6, 12, 9, NQ.white, NQ.cloud, 0, 0);
    pattern(l, NQ.silver, (x, y) => y > 8 && (x * 5 + y * 3) % 7 === 0);
  });
  box(g, 1, 12, E, E, NQ.blue);
  for (let i = 0; i < 22; i++) {
    const y = 13 + Math.floor(rnd(s, i) * 18);
    const x = Math.floor(rnd(s, i + 40) * 32);
    const w = 1.5 + ((y - 12) / 18) * 4 * (0.6 + rnd(s, i + 80) * 0.6);
    layer(g, (l) => oval(l, x, y, w, w * 0.45, NQ.white, NQ.cloud), NQ.navy);
  }
  box(g, 1, 12, E, 12, NQ.cloud);
  layer(g, (l) => {
    oval(l, 22, 25, 2.5, 1.3, NQ.gray);
    dot(l, 21, 24, NQ.ink);
    dot(l, 23, 24, NQ.ink);
  });
};

const strait: SceneFn = (g, o) => {
  const s = o.seed;
  sky(g, 'day', s);
  cloud(g, 8 + (s % 5), 4, 6);
  water(g, 12, E, NQ.azure, s);
  layer(g, (l) => oval(l, 26, 13, 9, 3.5, NQ.teal, NQ.night, (_x, y) => y <= 12));
  layer(g, (l) => {
    oval(l, 0, 30, 12, 9, NQ.green, NQ.forest);
    for (let i = 0; i < 3; i++) box(l, 2 + i * 3, 24 - i, 3 + i * 3, 25 - i, NQ.paper);
  });
  for (let x = 23; x <= 29; x++) dot(g, x, 23 + (x % 2), NQ.white);
  layer(g, (l) => {
    box(l, 12, 21, 23, 23, NQ.white);
    box(l, 13, 24, 22, 24, NQ.blue);
    box(l, 12, 22, 23, 22, NQ.red);
    box(l, 14, 18, 20, 20, NQ.white);
    box(l, 15, 19, 19, 19, NQ.ice);
    box(l, 17, 16, 18, 17, NQ.blue);
  });
};

// ───────────────────────── 洞くつ・カルスト ─────────────────────────

function caveBg(g: Grid, s: number): void {
  box(g, 1, 1, E, E, NQ.bark);
  oval(g, 16, 17, 13, 11, NQ.hairBrown);
  oval(g, 16, 18, 9, 7, NQ.brown);
  for (let i = 0; i < 9; i++) {
    const x = 2 + i * 3.4 + (rnd(s, i) - 0.5) * 1.5;
    const h = 4 + Math.floor(rnd(s, i + 20) * 7);
    tri(g, x - 1.5, 1, x + 1.5, 1, x, 1 + h, i % 2 ? NQ.beige : NQ.sand);
    dot(g, x, 2 + h, NQ.cream);
  }
}

const cave: SceneFn = (g, o) => {
  const s = o.seed;
  caveBg(g, s);
  if (o.v === 'lake') {
    oval(g, 16, 25, 15, 5.5, NQ.blue);
    oval(g, 16, 25, 11, 3.8, NQ.azure);
    oval(g, 16, 24.5, 6, 2, NQ.sky);
    box(g, 12, 24, 20, 24, NQ.ice);
    ripples(g, 5, 23, 26, 28, NQ.sky, s, 4, 3);
    return;
  }
  box(g, 1, 26, E, E, NQ.hairBrown);
  layer(g, (l) => {
    for (const [x, h] of [
      [5, 9],
      [11, 5],
      [21, 7],
      [27, 11],
    ] as const) {
      tri(l, x - 2, 27, x + 2, 27, x, 27 - h, NQ.beige);
      tri(l, x, 27 - h, x + 2, 27, x + 0.5, 27, NQ.sand);
    }
  });
  oval(g, 16, 17, 3, 3, NQ.cream);
  oval(g, 16, 17, 1.6, 1.6, NQ.white);
  box(g, 1, 28, E, 28, NQ.tan);
  for (let x = 2; x <= E; x += 4) seg(g, x, 26, x, 28, NQ.gold);
  box(g, 1, 26, E, 26, NQ.gold);
};

const karst: SceneFn = (g, o) => {
  const s = o.seed;
  sky(g, 'day', s);
  cloud(g, 8 + (s % 5), 4, 7);
  hills(g, 14, 4, NQ.leaf, s);
  box(g, 1, 14, E, E, NQ.leaf);
  hills(g, 20, 3, NQ.lime, s + 2);
  box(g, 1, 20, E, E, NQ.lime);
  pattern(g, NQ.leaf, (x, y) => y > 20 && (x * 3 + y * 5) % 9 === 0);
  layer(
    g,
    (l) => {
      for (let i = 0; i < 18; i++) {
        const y = 12 + Math.floor(rnd(s, i) * 18);
        const x = 1 + Math.floor(rnd(s, i + 30) * 30);
        const w = 0.6 + ((y - 12) / 18) * 2.2;
        oval(l, x, y, w, w * 0.9 + 0.3, NQ.paper, NQ.silver);
      }
    },
    NQ.gray,
  );
  for (let y = 20; y <= E; y++) dot(g, 16 + Math.round(Math.sin(y / 3) * 2), y, NQ.sand);
};

// ───────────────────────── 花・さくら・田んぼ ─────────────────────────

/** 奥に むかって すぼまる 畑の すじ（row(k) で すじの 色） */
function rows(g: Grid, y0: number, vx: number, row: (k: number, y: number) => string): void {
  for (let y = y0; y <= E; y++)
    for (let x = 1; x <= E; x++) {
      const t = (y - y0 + 1) / (E - y0 + 1);
      const k = Math.floor(((x + 0.5 - vx) / t + 64) / 3);
      dot(g, x, y, row(k, y));
    }
}

const flowers: SceneFn = (g, o) => {
  const s = o.seed;
  switch (o.v) {
    case 'white': {
      sky(g, 'day', s);
      box(g, 1, 9, E, 15, NQ.azure);
      box(g, 1, 9, E, 9, NQ.sky);
      ripples(g, 2, 11, E - 1, 15, NQ.sky, s, 4);
      hills(g, 18, 4, NQ.green, s);
      box(g, 1, 18, E, E, NQ.green);
      for (let i = 0; i < 26; i++) {
        const y = 16 + Math.floor(rnd(s, i) * 15);
        const x = 1 + Math.floor(rnd(s, i + 50) * 30);
        seg(g, x, y, x, y + 2, NQ.leaf);
        if (y > 22) flower(g, x, y, NQ.white, NQ.gold);
        else {
          dot(g, x, y, NQ.white);
          dot(g, x + 1, y, NQ.gold);
        }
      }
      return;
    }
    case 'purple': {
      sky(g, 'day', s);
      cloud(g, 7 + (s % 5), 4, 6);
      hills(g, 14, 5, NQ.denim, s);
      box(g, 1, 14, E, 15, NQ.leaf);
      rows(g, 15, 16, (k, y) => (k % 2 ? NQ.leaf : (y + k) % 3 === 0 ? NQ.lavender : NQ.violet));
      roundTree(g, 25, 14, 1.5, NQ.green);
      return;
    }
    case 'blue': {
      sky(g, 'day', s);
      cloud(g, 7 + (s % 5), 5, 7);
      layer(g, (l) => oval(l, 16, 33, 20, 21, NQ.sky));
      pattern(g, NQ.azure, (x, y) => y > 12 && g[y]![x] === NQ.sky && (x * 3 + y * 2) % 5 === 0);
      pattern(g, NQ.white, (x, y) => y > 12 && g[y]![x] === NQ.sky && (x * 7 + y * 3) % 13 === 0);
      pattern(g, NQ.blue, (x, y) => y > 24 && g[y]![x] === NQ.sky && (x + y) % 3 === 0);
      roundTree(g, 12, 13, 1.5, NQ.green);
      roundTree(g, 16, 12, 1.8, NQ.green);
      return;
    }
    case 'red': {
      sky(g, 'day', s);
      water(g, 10, 14, NQ.azure, s);
      box(g, 1, 10, E, 10, NQ.sky);
      box(g, 1, 15, E, E, NQ.forest);
      layer(g, (l) => {
        oval(l, 6, 17, 7, 5, NQ.green, NQ.forest);
        oval(l, 25, 16, 7, 5, NQ.green, NQ.forest);
        oval(l, 16, 26, 10, 6, NQ.green, NQ.forest);
      });
      for (let i = 0; i < 16; i++) {
        const x = 2 + Math.floor(rnd(s, i) * 28);
        const y = 13 + Math.floor(rnd(s, i + 20) * 17);
        oval(g, x + 0.5, y + 0.5, 1.3, 1.3, NQ.red);
        dot(g, x, y, NQ.gold);
      }
      box(g, 10, 30, 22, E, NQ.sand);
      return;
    }
    case 'tulip': {
      sky(g, 'day', s);
      cloud(g, 23 - (s % 5), 4, 6);
      hills(g, 13, 3, NQ.green, s);
      const cols = [NQ.red, NQ.yellow, NQ.white, NQ.blush, NQ.orange];
      rows(g, 13, 16, (k, y) => {
        const c = cols[((((k % 5) + 5) % 5) + s) % 5]!;
        return y < 22 ? c : y % 3 === 0 ? NQ.green : c;
      });
      for (let i = 0; i < 6; i++) {
        const x = 3 + i * 5;
        const c = cols[i % 5]!;
        seg(g, x, 30, x, 27, NQ.green);
        box(g, x - 1, 25, x + 1, 26, c);
        dot(g, x, 24, c);
        dot(g, x - 1, 24, c);
        dot(g, x + 1, 24, c);
        dot(g, x, 24, NQ.sky);
      }
      return;
    }
    default: {
      sky(g, 'day', s);
      cloud(g, 7 + (s % 5), 4, 6);
      hills(g, 13, 4, NQ.teal, s);
      box(g, 1, 13, E, E, NQ.green);
      for (let y = 14; y <= E; y++)
        for (let x = 1; x <= E; x++)
          if ((x * 2 + y * 3 + (y % 2) * 3) % (y < 20 ? 3 : 5) === 0)
            dot(g, x, y, y < 20 ? NQ.yellow : NQ.gold);
      layer(g, (l) => {
        for (let a = 0; a < 12; a++) {
          const t = (a / 12) * Math.PI * 2;
          thick(l, 22, 23, 22 + Math.cos(t) * 4.5, 23 + Math.sin(t) * 4.5, 0.7, NQ.yellow);
        }
        oval(l, 22.5, 23.5, 2, 2, NQ.gold);
        oval(l, 22.5, 23.5, 1, 1, NQ.orange);
      });
      seg(g, 22, 29, 22, E, NQ.leaf);
    }
  }
};

const sakura: SceneFn = (g, o) => {
  const s = o.seed;
  if (o.v === 'mountain') {
    // 山ぜんたいが ピンクの さくらで いっぱい（おくは 小さく、手前は 大きく）
    sky(g, 'day', s);
    cloud(g, 24 - (s % 5), 3, 6);
    const bands: [number, number, number][] = [
      [12, 5, 1.3],
      [18, 5, 1.8],
      [24, 5, 2.4],
      [E + 2, 5, 3],
    ];
    bands.forEach(([y, h, r], i) => {
      hills(g, y, h, i % 2 ? NQ.green : NQ.forest, s + i * 3);
      box(g, 1, y, E, E, i % 2 ? NQ.green : NQ.forest);
      layer(
        g,
        (l) => {
          for (let x = 1 + (i % 2) * r; x <= E + 2; x += r * 2.3) {
            if (rnd(s, x * 3 + i) < 0.25) continue;
            const yy = y - h * 0.5 + rnd(s, x + i * 9) * h * 0.6;
            oval(l, x, yy, r, r * 0.8, NQ.blush);
            dot(l, x - r * 0.3, yy - r * 0.3, NQ.paper);
          }
        },
        NQ.berry,
      );
      if (i === 1)
        layer(g, (l) => {
          tri(l, 19, 13, 27, 13, 23, 9, NQ.bark);
          box(l, 20, 13, 26, 15, NQ.vermilion);
        });
    });
    return;
  }
  if (o.v === 'river') {
    sky(g, 'day', s);
    hills(g, 12, 4, NQ.teal, s);
    box(g, 1, 12, E, E, NQ.leaf);
    for (let y = 12; y <= E; y++) {
      const half = 1 + (y - 12) * 0.5;
      box(g, 16 - half - 2, y, 16 + half + 2, y, NQ.yellow);
      box(g, 16 - half, y, 16 + half, y, NQ.azure);
    }
    ripples(g, 11, 20, 21, E, NQ.sky, s, 5);
    const pinkTree = (l: Grid, x: number, by: number, r: number): void => {
      seg(l, x, by, x, by - r * 1.2, NQ.brown);
      oval(l, x + 0.5, by - r * 1.9, r * 1.25, r * 1.05, NQ.blush);
      oval(l, x - r * 0.35, by - r * 2.3, r * 0.45, r * 0.35, NQ.paper);
      pattern(l, NQ.berry, (xx, yy) => yy > by - r * 1.6 && (xx + yy) % 3 === 0 && l[yy]![xx] === NQ.blush);
    };
    for (let i = 0; i < 4; i++)
      for (const side of [-1, 1]) {
        const by = 16 + i * 5;
        const x = 16 + side * (5 + i * 3.4);
        layer(g, (l) => pinkTree(l, x, by, 1.4 + i * 0.9), NQ.berry);
      }
    return;
  }
  sky(g, 'day', s);
  cloud(g, 24 - (s % 5), 4, 6);
  box(g, 1, 24, E, E, NQ.lime);
  hills(g, 25, 2, NQ.leaf, s);
  layer(g, (l) => {
    thick(l, 15, 28, 15, 16, 1.3, NQ.brown);
    seg(l, 15, 18, 10, 12, NQ.brown);
    seg(l, 16, 18, 21, 12, NQ.brown);
    oval(l, 16, 14, 13, 9, NQ.blush);
    for (let x = 4; x <= 28; x += 2) {
      const top = 14;
      const len = 8 + ((x * 7) % 5);
      seg(l, x, top, x, top + len, NQ.blush);
    }
    pattern(l, NQ.berry, (x, y) => y > 16 && (x + y) % 5 === 0 && l[y]![x] === NQ.blush);
    pattern(l, NQ.paper, (x, y) => y < 13 && (x * 3 + y) % 4 === 0 && l[y]![x] === NQ.blush);
  });
};

const riceTerrace: SceneFn = (g, o) => {
  const s = o.seed;
  const toSea = o.v === 'sea';
  sky(g, 'day', s);
  if (toSea) {
    box(g, 1, 6, E, 11, NQ.azure);
    box(g, 1, 6, E, 6, NQ.sky);
    ripples(g, 2, 7, E - 1, 11, NQ.sky, s, 4);
  } else {
    hills(g, 9, 6, NQ.forest, s);
    box(g, 1, 9, E, 10, NQ.forest);
  }
  let y0 = 11;
  for (let i = 0; y0 <= E; i++) {
    const h = 2 + Math.floor(i * 0.7);
    const col = i % 2 ? NQ.leaf : NQ.lime;
    for (let x = 1; x <= E; x++) {
      const curve = Math.round(
        Math.sin((x + i * 4 + s) / 5) * 1.3 + (toSea ? (x - 16) * (x - 16) * -0.01 : 0),
      );
      const top = y0 + curve;
      box(g, x, top, x, top + h, col);
      dot(g, x, top, NQ.sprout);
      dot(g, x, top + h, NQ.green);
    }
    y0 += h + 1;
  }
  pattern(g, NQ.sky, (x, y) => y > 12 && (x * 7 + y * 3) % 23 === 0 && g[y]![x] === NQ.lime);
};

// ───────────────────────── 森・木 ─────────────────────────

const forest: SceneFn = (g, o) => {
  const s = o.seed;
  switch (o.v) {
    case 'sea': {
      sky(g, 'day', s);
      layer(g, (l) => {
        peak(l, 12, 4, 13, 8, NQ.white, NQ.cloud, 0);
        peak(l, 22, 6, 13, 7, NQ.white, NQ.cloud, 0);
        pattern(l, NQ.silver, (x, y) => y > 8 && (x * 3 + y) % 5 === 0);
      });
      water(g, 13, E, NQ.blue, s, NQ.azure);
      box(g, 1, 13, E, 13, NQ.sky);
      layer(g, (l) => {
        for (let y = 12; y <= E; y++) {
          const x1 = 20 - (y - 12) * 0.5;
          box(l, 1, y, x1, y, y < 18 ? NQ.forest : NQ.brown);
          if (y >= 18) box(l, x1 - 1, y, x1, y, NQ.tan);
        }
      });
      for (let i = 0; i < 6; i++) tree(g, 2 + i * 3, 19, 7, i % 2 ? NQ.forest : NQ.green);
      for (let i = 0; i < 5; i++) roundTree(g, 1 + i * 4, 21, 2, NQ.green);
      fall(g, 13, 13, 19, 28);
      splash(g, 13, 29, 2);
      return;
    }
    case 'mist': {
      sky(g, 'cloudy', s);
      hills(g, 14, 5, NQ.silver, s);
      box(g, 1, 14, E, E, NQ.lime);
      pattern(g, NQ.leaf, (x, y) => y > 14 && (x * 3 + y * 5) % 4 === 0);
      // 白く かれた 木（えだを 左右に のばす）が きりの 中に 立つ
      const dead = (l: Grid, x: number, by: number, h: number): void => {
        seg(l, x, by, x, by - h, NQ.paper, 2);
        const br = (y: number, d: number, len: number): void => {
          seg(l, x + (d > 0 ? 1 : 0), y, x + d * len, y - len * 0.8, NQ.paper);
          seg(l, x + d * len * 0.6, y - len * 0.5, x + d * len * 0.4, y - len * 1.1, NQ.paper);
        };
        br(by - h * 0.45, -1, h * 0.3);
        br(by - h * 0.6, 1, h * 0.35);
        br(by - h * 0.85, -1, h * 0.2);
        seg(l, x + 1, by, x + 1, by - h + 1, NQ.cloud);
      };
      for (const [x, by, h] of [
        [4, 15, 6],
        [12, 14, 5],
        [25, 15, 7],
      ] as const)
        dead(g, x, by, h);
      box(g, 1, 15, E, 16, NQ.cloud);
      layer(
        g,
        (l) => {
          dead(l, 8, 29, 17);
          dead(l, 22, 28, 14);
        },
        NQ.gray,
      );
      box(g, 1, 22, E, 22, NQ.cloud);
      pattern(g, NQ.white, (x, y) => (y === 22 || y === 15) && (x + y) % 4 === 0);
      return;
    }
    default: {
      if (o.v !== 'beech') {
        // 亜熱帯の 森：ブロッコリーのような もこもこの 木が 山を おおう
        sky(g, 'day', s);
        cloud(g, 22 - (s % 5), 4, 6);
        const rowsY = [11, 15, 19, 23, 27, 31];
        rowsY.forEach((by, r) => {
          const cols = [NQ.green, NQ.leaf, NQ.green, NQ.leaf, NQ.green, NQ.leaf];
          layer(
            g,
            (l) => {
              for (let x = -1 + (r % 2) * 2; x <= 32; x += 4) {
                const rr = 2.2 + r * 0.35 + rnd(s, x + r * 40) * 0.8;
                oval(
                  l,
                  x + 0.5,
                  by - rr * 0.6 - (x > 8 && x < 24 ? 3 - r * 0.5 : 0),
                  rr,
                  rr * 0.85,
                  cols[r]!,
                  NQ.forest,
                );
              }
              if (r > 0) box(l, 1, by - 3, E, E, cols[r]!);
            },
            NQ.forest,
          );
          pattern(
            g,
            NQ.lime,
            (x, y) => y < by - 2 && y > by - 6 && (x * 3 + y * 5 + r) % 9 === 0 && g[y]![x] === NQ.leaf,
          );
        });
        layer(g, (l) => {
          seg(l, 24, 29, 24, 20, NQ.brown);
          for (let a = -2; a <= 2; a++) seg(l, 24, 20, 24 + a * 2.2, 19 + Math.abs(a) * 1.2, NQ.lime);
        });
        return;
      }
      box(g, 1, 1, E, E, NQ.leaf);
      pattern(g, NQ.lime, (x, y) => blk(x, y, s) < 0.35);
      pattern(g, NQ.sprout, (x, y) => blk(x, y, s + 4) < 0.12);
      pattern(g, NQ.green, (x, y) => y > 8 && blk(x, y, s + 9) < 0.3);
      for (const [x, w] of [
        [4, 2],
        [12, 1],
        [19, 2],
        [27, 1],
        [8, 1],
      ] as const) {
        box(g, x, 6, x + w, E, NQ.silver);
        box(g, x, 6, x, E, NQ.cloud);
        for (let y = 9; y <= E; y += 5) dot(g, x + w, y, NQ.gray);
        seg(g, x, 10, x - 2, 7, NQ.silver);
      }
      box(g, 1, 27, E, E, NQ.green);
      pattern(g, NQ.leaf, (x, y) => y >= 27 && (x + y) % 2 === 0);
    }
  }
};

const bigCedar: SceneFn = (g, o) => {
  const s = o.seed;
  box(g, 1, 1, E, E, NQ.forest);
  pattern(g, NQ.green, (x, y) => blk(x, y, s) < 0.35);
  box(g, 1, 26, E, E, NQ.green);
  layer(g, (l) => {
    oval(l, 16, 5, 14, 6, NQ.green, NQ.forest);
    for (let y = 6; y <= 27; y++) {
      const half = 3.5 + (y > 20 ? (y - 20) * 0.9 : 0) + Math.sin(y * 1.3) * 0.6;
      box(l, 16 - half, y, 16 + half, y, NQ.brown);
      box(l, 16 + half * 0.3, y, 16 + half, y, NQ.bark);
    }
    seg(l, 12, 9, 6, 5, NQ.brown, 2);
    seg(l, 19, 8, 25, 4, NQ.brown, 2);
    pattern(l, NQ.tan, (x, y) => y > 6 && (x * 5 + y) % 6 === 0 && l[y]![x] === NQ.brown);
    pattern(
      l,
      NQ.leaf,
      (x, y) => y > 8 && blk(x, y, s + 3) < 0.25 && (l[y]![x] === NQ.brown || l[y]![x] === NQ.bark),
    );
    oval(l, 16, 3, 9, 2.5, NQ.leaf);
  });
  layer(g, (l) => {
    box(l, 1, 28, E, 29, NQ.tan);
    box(l, 1, 29, E, 29, NQ.brown);
    for (let x = 2; x <= E; x += 5) seg(l, x, 25, x, 28, NQ.brown);
    box(l, 1, 25, E, 25, NQ.brown);
    person(l, 26, 27, NQ.red, NQ.cream);
  });
};

// ───────────────────────── 湿原・砂丘・樹氷・ひすい・岩 ─────────────────────────

const wetland: SceneFn = (g, o) => {
  const s = o.seed;
  switch (o.v) {
    case 'river': {
      sky(g, 'day', s);
      cloud(g, 22 - (s % 5), 3, 6);
      hills(g, 9, 2, NQ.teal, s);
      for (let y = 9; y <= E; y++) {
        const k = Math.floor((y - 9) ** 0.8 / 2);
        box(g, 1, y, E, y, [NQ.leaf, NQ.lime, NQ.ochre, NQ.leaf, NQ.lime, NQ.sand][k % 6]!);
      }
      pattern(g, NQ.green, (x, y) => y > 9 && (x * 3 + y * 7) % 11 === 0);
      for (let y = 9; y <= E; y++) {
        const t = (y - 9) / 21;
        const cx = 15 + Math.sin(y / (1.2 + t * 2.2)) * (2 + t * 9);
        const half = 0.5 + t * 1.6;
        box(g, cx - half, y, cx + half, y, NQ.azure);
        dot(g, cx - half, y, NQ.sky);
      }
      layer(g, (l) => {
        box(l, 22, 24, 25, 25, NQ.white);
        seg(l, 25, 24, 26, 21, NQ.hairBlack);
        dot(l, 26, 20, NQ.red);
        dot(l, 27, 21, NQ.gray);
        dot(l, 21, 24, NQ.hairBlack);
        seg(l, 23, 26, 23, 28, NQ.hairBlack);
        seg(l, 24, 26, 24, 28, NQ.hairBlack);
      });
      return;
    }
    case 'geese': {
      for (let y = 1; y <= E; y++) box(g, 1, y, E, y, y < 7 ? NQ.lavender : y < 13 ? NQ.apricot : NQ.cream);
      sun(g, 23, 16, 3, NQ.gold);
      hills(g, 18, 2, NQ.violet, s);
      box(g, 1, 18, E, E, NQ.lavender);
      box(g, 1, 18, E, 18, NQ.apricot);
      box(g, 20, 20, 26, 20, NQ.gold);
      box(g, 21, 22, 25, 22, NQ.gold);
      ripples(g, 2, 20, E - 1, 25, NQ.apricot, s, 5, 3);
      box(g, 1, 27, E, E, NQ.hairBrown);
      for (let x = 1; x <= E; x += 2) seg(g, x, 27, x + (x % 3) - 1, 23 + (x % 3), NQ.bark);
      const bird = (x: number, y: number): void => {
        dot(g, x - 2, y - 1, NQ.ink);
        box(g, x - 1, y, x + 1, y, NQ.ink);
        dot(g, x + 2, y - 1, NQ.ink);
      };
      const flock = (x: number, y: number, n: number): void => {
        bird(x, y);
        for (let i = 1; i <= n; i++) {
          bird(x - i * 4, y + i * 2);
          bird(x + i * 4, y + i * 2);
        }
      };
      flock(11 + (s % 3), 3, 2);
      flock(24, 10, 1);
      bird(4, 14);
      bird(15, 13);
      return;
    }
    case 'swan': {
      sky(g, 'day', s);
      layer(g, (l) => {
        peak(l, 9, 5, 14, 10, NQ.denim, NQ.navy, 5);
        peak(l, 23, 6, 14, 9, NQ.denim, NQ.navy, 4);
      });
      box(g, 1, 14, E, 15, NQ.white);
      water(g, 16, E, NQ.azure, s);
      const swan = (l: Grid, x: number, y: number, f: number): void => {
        oval(l, x, y, 4, 1.8, NQ.white, NQ.cloud, (_x, yy) => yy <= y + 0.5);
        seg(l, x + f * 3, y - 1, x + f * 3, y - 5, NQ.white);
        dot(l, x + f * 4, y - 5, NQ.orange);
        dot(l, x + f * 3, y - 5, NQ.white);
        dot(l, x + f * 2, y - 1, NQ.white);
        dot(l, x - f * 3.5, y - 1, NQ.white);
      };
      layer(g, (l) => {
        swan(l, 9, 24, 1);
        swan(l, 21, 21, -1);
        swan(l, 23, 28, 1);
      });
      return;
    }
    default: {
      sky(g, 'day', s);
      cloud(g, 7 + (s % 5), 4, 6);
      layer(g, (l) => peak(l, 22, 5, 13, 10, NQ.teal, NQ.night, 2));
      hills(g, 13, 2, NQ.green, s);
      box(g, 1, 13, E, E, NQ.lime);
      pattern(g, NQ.leaf, (x, y) => y > 13 && blk(x, y, s) < 0.35);
      for (let i = 0; i < 4; i++) oval(g, 3 + i * 8, 15 + (i % 2) * 3, 2.5, 0.8, NQ.sky);
      for (let y = 14; y <= E; y++) {
        const t = (y - 13) / 17;
        const cx = 14 - t * 4;
        const half = 0.5 + t * 3.5;
        box(g, cx - half, y, cx + half, y, NQ.sand);
        if (half > 1.5) dot(g, cx, y, NQ.tan);
        if (y % 3 === 0) box(g, cx - half, y, cx + half, y, NQ.tan);
      }
      for (let i = 0; i < 12; i++) {
        const x = 1 + Math.floor(rnd(s, i) * 30);
        const y = 20 + Math.floor(rnd(s, i + 7) * 10);
        if (Math.abs(x - (14 - ((y - 13) / 17) * 4)) < 5) continue;
        dot(g, x, y, NQ.white);
        dot(g, x, y - 1, NQ.white);
        dot(g, x + 1, y, NQ.cream);
        dot(g, x, y + 1, NQ.green);
      }
    }
  }
};

const dunes: SceneFn = (g, o) => {
  const s = o.seed;
  sky(g, 'day', s);
  cloud(g, 7 + (s % 5), 4, 7);
  box(g, 1, 11, E, 13, NQ.azure);
  box(g, 1, 11, E, 11, NQ.sky);
  for (let x = 1; x <= E; x++) {
    const ridge = 13 - Math.round(Math.sin((x + s) / 5) * 2 + 1);
    for (let y = ridge; y <= E; y++) {
      const lit = x < 16 ? y < ridge + 6 : y < ridge + 2;
      dot(g, x, y, lit ? NQ.beige : NQ.sand);
    }
  }
  for (let x = 1; x <= E; x++) {
    const r2 = 22 + Math.round(Math.sin((x + s * 2) / 4) * 2);
    for (let y = r2; y <= E; y++) dot(g, x, y, x > 18 ? NQ.tan : NQ.sand);
    dot(g, x, r2, NQ.beige);
  }
  pattern(
    g,
    NQ.tan,
    (x, y) => y > 13 && (y * 3 + Math.round(Math.sin(x / 2) * 1.5)) % 5 === 0 && g[y]![x] !== NQ.azure,
  );
  // らくだ（こぶ 2 つ）
  const CAMEL = ['..#..#...##', '.######..#.', '#########..', '.#.#..#.#..', '.#.#..#.#..'];
  layer(g, (l) =>
    CAMEL.forEach((row, i) =>
      [...row].forEach((ch, x) => {
        if (ch === '#') dot(l, 18 + x, 9 + i, i > 2 ? NQ.brown : NQ.tan);
      }),
    ),
  );
  layer(g, (l) => person(l, 9, 19, NQ.red));
  for (let i = 0; i < 4; i++) dot(g, 11 + i * 2, 21 + i, NQ.tan);
};

const icyTrees: SceneFn = (g, o) => {
  const s = o.seed;
  sky(g, 'day', s);
  cloud(g, 7 + (s % 5), 4, 6);
  layer(g, (l) => peak(l, 20, 6, 20, 16, NQ.white, NQ.cloud));
  box(g, 1, 18, E, E, NQ.white);
  pattern(g, NQ.cloud, (x, y) => y > 18 && (x * 3 + y * 5) % 11 === 0);
  const monster = (l: Grid, x: number, by: number, h: number): void => {
    const w = h * 0.4;
    oval(l, x, by - h * 0.35, w, h * 0.4, NQ.white, NQ.cloud);
    oval(l, x, by - h * 0.7, w * 0.8, h * 0.28, NQ.white, NQ.cloud);
    oval(l, x, by - h * 0.92, w * 0.45, h * 0.15, NQ.white);
    dot(l, x - w * 0.4, by - h * 0.5, NQ.green);
    dot(l, x + w * 0.5, by - h * 0.3, NQ.green);
    dot(l, x, by - h * 0.75, NQ.forest);
  };
  layer(
    g,
    (l) => {
      monster(l, 12, 17, 5);
      monster(l, 17, 16, 4);
      monster(l, 26, 18, 6);
      monster(l, 5, 27, 12);
      monster(l, 15, 29, 10);
      monster(l, 25, E, 11);
    },
    NQ.silver,
  );
};

const jade: SceneFn = (g, o) => {
  const s = o.seed;
  sky(g, 'day', s);
  water(g, 11, 17, NQ.azure, s);
  box(g, 1, 11, E, 11, NQ.sky);
  surf(g, 17, s);
  box(g, 1, 19, E, E, NQ.silver);
  for (let i = 0; i < 40; i++) {
    const x = 1 + Math.floor(rnd(s, i) * 30);
    const y = 19 + Math.floor(rnd(s, i + 60) * 12);
    const c = [NQ.gray, NQ.cloud, NQ.tan, NQ.slate][i % 4]!;
    oval(g, x + 0.5, y + 0.5, 1.2 + (y - 19) * 0.08, 0.8 + (y - 19) * 0.05, c);
  }
  layer(g, (l) => {
    const stone = (x: number, y: number, r: number): void => {
      oval(l, x, y, r, r * 0.75, NQ.teal);
      oval(l, x - r * 0.2, y - r * 0.15, r * 0.65, r * 0.45, NQ.aqua);
      oval(l, x - r * 0.4, y - r * 0.35, r * 0.25, r * 0.2, NQ.mint);
    };
    stone(10, 25, 4);
    stone(21, 27, 3);
    stone(25, 22, 2);
  });
  dot(g, 8, 23, NQ.white);
  dot(g, 19, 25, NQ.white);
};

const sacredRock: SceneFn = (g, o) => {
  const s = o.seed;
  box(g, 1, 1, E, E, NQ.forest);
  pattern(g, NQ.green, (x, y) => blk(x, y, s) < 0.45);
  pattern(g, NQ.leaf, (x, y) => blk(x, y, s + 3) < 0.15);
  for (let y = 9; y <= E; y++) {
    const half = (y - 8) * 0.28;
    box(g, 16 - half, y, 16 + half, y, y < 20 ? NQ.cream : y < 24 ? NQ.sky : NQ.azure);
  }
  box(g, 14, 20, 18, 20, NQ.sky);
  dot(g, 16, 22, NQ.green);
  dot(g, 17, 22, NQ.green);
  layer(g, (l) => {
    for (let y = 3; y <= E; y++) {
      const inner = 16 - (y - 8) * 0.28;
      const outer = 2 + (y < 10 ? (10 - y) * 1.4 : 0);
      if (y >= 8) {
        box(l, outer, y, inner - 1, y, NQ.silver);
        box(l, 32 - inner, y, 31 - outer, y, NQ.gray);
      } else {
        box(l, outer, y, 15, y, NQ.silver);
        box(l, 16, y, 31 - outer, y, NQ.gray);
      }
    }
    pattern(l, NQ.slate, (x, y) => (x * 3 + y * 5) % 9 === 0);
    pattern(l, NQ.green, (x, y) => y < 12 && blk(x, y, s + 7) < 0.3);
  });
  for (let x = 4; x <= 28; x += 3) seg(g, x, 1, x, 3 + ((x * 7) % 5), NQ.leaf);
};

export const NATURE: Record<NatureKey, SceneFn> = {
  mountain,
  snowPeak,
  volcano,
  volcanicVent,
  highland,
  mesa,
  lake,
  pond,
  spring,
  waterfall,
  gorge,
  river,
  riverBoat,
  tubBoat,
  beach,
  mirrorBeach,
  sandbar,
  island,
  islands,
  rockyCoast,
  capeCliff,
  whirlpool,
  driftIce,
  strait,
  cave,
  karst,
  flowers,
  sakura,
  riceTerrace,
  forest,
  bigCedar,
  wetland,
  dunes,
  icyTrees,
  jade,
  sacredRock,
};
