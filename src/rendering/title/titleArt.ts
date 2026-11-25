/**
 * タイトル画面の仮ドット絵。色は NQ-48 だけ。背景は 240×135 を ×4（バトルと同じ 1 ドット = 4px）。
 * 夜明けの海に、地方ごとに分かれた島々と富士山、右の島にお城。手前のがけに桜の木
 * （主人公のうしろ姿・星・雲・花びらはシーン側で動かす）。
 * ロゴはドットフォント（PixelMplus12）を 12px で描いてマス目に写し、帯の色・輪郭・かげを付けてから拡大する。
 */
import { createRng } from '../../core/rng';
import { makeGrid, outline, put, toCanvas } from '../grid';
import { NQ } from '../palette';

const W = 240;
const H = 135;
/** 水平線の高さ（ドット） */
export const HORIZON = 84;
/** 主人公が立つ、がけの上の高さ（ドット） */
export const CLIFF_TOP = 108;
/** 主人公が立つ x（ドット） */
export const HERO_SPOT = 62;
/** 太陽（水平線から顔を出す）と、海にうつる光の道の中心 x（ドット） */
export const SUN_X = 184;
/** 桜の木の花のあたり（花びらが舞い始める範囲・ドット） */
export const SAKURA = { x0: 4, x1: 50, y0: 64, y1: 96 } as const;

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;

function painter(w: number, h: number): { c: HTMLCanvasElement; r: Rect } {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return {
    c,
    r: (x, y, rw, rh, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(x, y, rw, rh);
    },
  };
}

const disc = (r: Rect, cx: number, cy: number, rad: number, col: string) => {
  for (let y = -rad; y <= rad; y++) {
    const hw = Math.round(Math.sqrt(rad * rad - y * y));
    r(cx - hw, cy + y, hw * 2 + 1, 1, col);
  }
};

/** 水平線の上の、なだらかな島のシルエット */
const island = (r: Rect, x0: number, x1: number, h: number, base: number, col: string) => {
  for (let x = x0; x < x1; x++) {
    const t = (x - x0) / (x1 - x0);
    const y = Math.round(base - Math.sin(t * Math.PI) * h - (x % 5 === 0 ? 1 : 0));
    r(x, y, 1, base - y, col);
  }
};

export function titleBackdrop(): HTMLCanvasElement {
  const { c, r } = painter(W, H);
  const rng = createRng('title');

  // 空：上は夜、水平線に近いほど夜明けの色（帯の境目は 2 ドットの市松）
  const sky = [NQ.ink, NQ.night, NQ.indigo, NQ.violet, NQ.berry, NQ.vermilion, NQ.apricot];
  const band = HORIZON / sky.length;
  sky.forEach((col, i) => {
    r(0, i * band, W, band, col);
    const next = sky[i + 1];
    if (next) for (let x = i % 2; x < W; x += 2) r(x, i * band + band - 1, 1, 1, next);
  });

  // 朝日（水平線から顔を出す。下半分はあとで海がかくす）
  disc(r, SUN_X, HORIZON, 14, NQ.gold);
  disc(r, SUN_X, HORIZON, 10, NQ.cream);

  // 遠くの島々
  island(r, 0, 36, 6, HORIZON, NQ.indigo);
  island(r, 132, 160, 3, HORIZON, NQ.indigo);

  // 富士山（まん中の島。朝日の当たる右の稜線だけ明るく）
  const cx = 92;
  const peak = 36;
  const half = 76;
  const slopeY = (d: number) =>
    d <= 5 ? peak : Math.round(peak + Math.pow((d - 5) / (half - 5), 0.62) * (HORIZON - peak));
  for (let x = cx - half; x <= cx + half; x++) {
    const y = slopeY(Math.abs(x - cx));
    if (y >= HORIZON) continue;
    r(x, y, 1, HORIZON - y, NQ.navy);
    if (x > cx) r(x, y, 1, 1, NQ.denim);
  }
  for (let x = cx - 24; x <= cx + 24; x++) {
    const d = Math.abs(x - cx);
    const len = Math.max(1, 14 - Math.round(d * 0.45) + ((x * 5) % 3) - 1);
    r(x, slopeY(d), 1, len, x > cx ? NQ.cloud : NQ.white);
  }

  // 右の島とお城（シルエット）
  island(r, 198, 240, 7, HORIZON, NQ.night);
  const kx = 220;
  const kb = 79;
  r(kx - 9, kb - 3, 19, 3, NQ.night); // 石垣
  r(kx - 7, kb - 7, 15, 4, NQ.night);
  r(kx - 10, kb - 8, 21, 1, NQ.night); // 1 の屋根
  r(kx - 5, kb - 11, 11, 3, NQ.night);
  r(kx - 8, kb - 12, 17, 1, NQ.night); // 2 の屋根
  r(kx - 3, kb - 15, 7, 3, NQ.night);
  r(kx - 6, kb - 16, 13, 1, NQ.night); // 3 の屋根
  r(kx - 1, kb - 18, 3, 2, NQ.night);
  for (const [dx, dy] of [
    [-10, -9],
    [10, -9],
    [-8, -13],
    [8, -13],
    [-6, -17],
    [6, -17],
  ] as const)
    r(kx + dx, kb + dy, 1, 1, NQ.night); // 屋根のはしが はねあがる
  for (const [dx, dy] of [
    [-4, -6],
    [3, -6],
    [0, -10],
  ] as const)
    r(kx + dx, kb + dy, 1, 1, NQ.gold); // 窓のあかり

  // 海
  r(0, HORIZON, W, H - HORIZON, NQ.navy);
  r(0, HORIZON, W, 1, NQ.berry);
  for (let k = 0; k < 110; k++) {
    const y = rng.int(HORIZON + 2, H - 1);
    r(rng.int(0, W - 6), y, rng.int(2, 6), 1, y < HORIZON + 14 ? NQ.violet : NQ.blue);
  }
  // 朝日の光の道（海にうつる）
  let k = 0;
  for (let y = HORIZON + 1; y < H; y += 2, k++) {
    const w = 3 + Math.floor((y - HORIZON) * 0.4) + rng.int(0, 3);
    r(SUN_X - Math.floor(w / 2) + rng.int(-2, 2), y, w, 1, k % 2 ? NQ.gold : NQ.apricot);
  }

  // 近くの小さな島（松の木）
  island(r, 108, 156, 4, 100, NQ.forest);
  for (const px of [118, 126, 140]) {
    for (let i = 0; i < 6; i++) r(px - Math.floor(i / 2), 90 + i, 1 + Math.floor(i / 2) * 2, 1, NQ.forest);
    r(px, 96, 1, 2, NQ.bark);
  }

  // 手前のがけ（左下）
  for (let x = 0; x < 100; x++) {
    const top = x < 80 ? CLIFF_TOP + (x % 11 === 0 ? 1 : 0) : CLIFF_TOP + Math.round((x - 80) * 1.7);
    if (top >= H) continue;
    r(x, top, 1, H - top, NQ.bark);
    if (x < 80) {
      r(x, top, 1, 2, NQ.leaf);
      r(x, top + 2, 1, 1, NQ.green);
    } else r(x, top, 1, 1, NQ.brown);
  }
  for (let n = 0; n < 34; n++) r(rng.int(2, 92), rng.int(CLIFF_TOP + 5, H - 3), 1, rng.int(2, 5), NQ.brown);
  for (let x = 1; x < 78; x += 3 + (x % 4)) r(x, CLIFF_TOP - 1, 1, 1, NQ.lime);

  // 桜の木
  r(22, 84, 3, CLIFF_TOP - 84, NQ.bark);
  r(25, 92, 6, 1, NQ.bark);
  r(15, 95, 7, 1, NQ.bark);
  for (const [bx, by, rad] of [
    [24, 76, 13],
    [11, 85, 9],
    [38, 84, 10],
    [27, 88, 8],
  ] as const) {
    disc(r, bx + 2, by + 2, rad, NQ.berry);
    disc(r, bx, by, rad, NQ.blush);
  }
  for (let n = 0; n < 40; n++)
    r(rng.int(SAKURA.x0, SAKURA.x1), rng.int(SAKURA.y0, SAKURA.y1), 1, 1, n % 3 ? NQ.white : NQ.cream);
  return c;
}

/** 夜明けの雲（下が朝日で明るい）。w ドット幅 */
export function cloudArt(w: number): HTMLCanvasElement {
  const g = makeGrid(w, 6);
  const q = Math.round(w * 0.2);
  for (let x = q; x < w - q * 2; x++) put(g, x, 0, NQ.lavender);
  for (let y = 1; y < 4; y++)
    for (let x = Math.round(q / 2); x < w - Math.round(q / 2); x++) put(g, x, y, NQ.lavender);
  for (let x = 0; x < w; x++) put(g, x, 4, NQ.violet);
  for (let x = q; x < w - q; x++) put(g, x, 5, NQ.apricot);
  return toCanvas(g);
}

/** 小さな形（'#' のところを col で塗る） */
export function pixelsArt(rows: string[], col: string): HTMLCanvasElement {
  const g = makeGrid(rows[0]!.length, rows.length);
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch === '#' && put(g, x, y, col)));
  return toCanvas(g);
}

/** ロゴの下の飾り線（ひし形つき） */
export function ornamentArt(): HTMLCanvasElement {
  const w = 96;
  const g = makeGrid(w, 5);
  for (let x = 6; x < w - 6; x++) {
    put(g, x, 2, NQ.gold);
    put(g, x, 3, NQ.ochre);
  }
  const diamond = (cx: number, s: number) => {
    for (let dy = -s; dy <= s; dy++)
      for (let dx = -(s - Math.abs(dy)); dx <= s - Math.abs(dy); dx++)
        put(g, cx + dx, 2 + dy, dy < 0 ? NQ.cream : NQ.gold);
  };
  diamond(Math.floor(w / 2), 2);
  diamond(4, 1);
  diamond(w - 5, 1);
  outline(g, NQ.ink);
  return toCanvas(g);
}

/**
 * ドットフォントの文字をマス目に写してロゴにする。bands は上から順の帯の色、shadow は右下のかげの色。
 * 12px で描くので、1 ドットがちょうど 1 マスになる（フォントの読み込みを待ってから呼ぶこと）。
 */
export function textLogo(text: string, font: string, bands: string[], shadow: string): HTMLCanvasElement {
  const probe = document.createElement('canvas');
  const pctx = probe.getContext('2d')!;
  pctx.font = `12px ${font}`;
  probe.width = Math.ceil(pctx.measureText(text).width) + 4;
  probe.height = 18;
  const ctx = probe.getContext('2d')!;
  ctx.font = `12px ${font}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 2, 14);
  const { data, width, height } = ctx.getImageData(0, 0, probe.width, probe.height);
  const on = (x: number, y: number) => (data[(y * width + x) * 4 + 3] ?? 0) > 127;
  let x0 = width;
  let x1 = -1;
  let y0 = height;
  let y1 = -1;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (on(x, y)) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  if (x1 < 0) return toCanvas(makeGrid(1, 1));
  const gw = x1 - x0 + 1;
  const gh = y1 - y0 + 1;
  const g = makeGrid(gw + 3, gh + 3);
  for (let y = 0; y < gh; y++) {
    const col = bands[Math.min(bands.length - 1, Math.floor((y / gh) * bands.length))]!;
    for (let x = 0; x < gw; x++) if (on(x0 + x, y0 + y)) put(g, x + 1, y + 1, col);
  }
  outline(g, NQ.ink);
  const filled = g.map((row) => row.map((cell) => cell !== null));
  for (let y = 1; y < g.length; y++)
    for (let x = 1; x < g[0]!.length; x++) if (!filled[y]![x] && filled[y - 1]![x - 1]) put(g, x, y, shadow);
  return toCanvas(g);
}
