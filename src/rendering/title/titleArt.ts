/**
 * タイトル画面のドット絵。色は NQ-48 だけ。背景は 240×135 を ×4（バトルと同じ 1 ドット = 4px）。
 * 開いた「まなびの地図帳」を旅の舞台にする。富士山・海・日の出の観光ポスター風ではなく、
 * 問題を解いて道しるべを増やすゲーム固有の世界観を見せる。
 * ロゴはドットフォント（PixelMplus12）を 12px で描いてマス目に写し、帯の色・輪郭・かげを付けてから拡大する。
 */
import { createRng } from '../../core/rng';
import { makeGrid, outline, put, toCanvas } from '../grid';
import { NQ } from '../palette';

const W = 240;
const H = 135;
/** ロゴの下に広がる地図帳の上端（ドット） */
export const HORIZON = 51;
/** 主人公が立つ地図帳のしおりの高さ（ドット） */
export const CLIFF_TOP = 112;
/** 主人公が立つ x（ドット） */
export const HERO_SPOT = 45;
/** きらめく道しるべの中心 x（ドット） */
export const ROUTE_X = 172;
/** 浮かぶ道しるべの発生範囲（ドット） */
export const ROUTE = { x0: 22, x1: 216, y0: 61, y1: 112 } as const;

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

export function titleBackdrop(): HTMLCanvasElement {
  const { c, r } = painter(W, H);
  const rng = createRng('title-atlas');

  // 濃紺の机と、淡い格子。観光写真ではなく「遊べる学習地図」の土台にする。
  r(0, 0, W, H, NQ.night);
  r(4, 5, W - 8, H - 10, NQ.navy);
  r(7, 8, W - 14, H - 16, NQ.indigo);
  for (let x = 10; x < W - 8; x += 12) r(x, 9, 1, H - 18, NQ.violet);
  for (let y = 12; y < H - 8; y += 12) r(8, y, W - 16, 1, NQ.violet);

  // 開いた地図帳。中央の折り目と、ページ端の金具でゲーム固有の冒険ノートにする。
  const book = { x: 18, y: HORIZON, w: 204, h: 76 };
  r(book.x - 2, book.y - 2, book.w + 4, book.h + 4, NQ.ink);
  r(book.x, book.y, book.w, book.h, NQ.beige);
  r(book.x + 2, book.y + 2, Math.floor(book.w / 2) - 3, book.h - 4, NQ.paper);
  r(book.x + Math.floor(book.w / 2) + 1, book.y + 2, Math.floor(book.w / 2) - 3, book.h - 4, NQ.paper);
  r(book.x + Math.floor(book.w / 2) - 1, book.y, 3, book.h, NQ.tan);
  r(book.x + Math.floor(book.w / 2), book.y + 2, 1, book.h - 4, NQ.brown);
  for (let y = book.y + 8; y < book.y + book.h - 4; y += 11) {
    r(book.x + 6, y, 88, 1, NQ.cloud);
    r(book.x + 111, y, 88, 1, NQ.cloud);
  }

  // 問題を解くと進む「知のルート」。日本列島の写し絵ではなく、学びの章を表す独自の道。
  const route: ReadonlyArray<readonly [number, number]> = [
    [34, 108], [51, 101], [67, 106], [83, 91], [101, 96], [117, 81], [136, 87], [151, 71], [172, 78], [191, 64],
  ];
  for (let i = 1; i < route.length; i++) {
    const [x0, y0] = route[i - 1]!;
    const [x1, y1] = route[i]!;
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let s = 0; s <= steps; s += 2) {
      const x = Math.round(x0 + ((x1 - x0) * s) / steps);
      const y = Math.round(y0 + ((y1 - y0) * s) / steps);
      r(x, y, 1, 1, NQ.teal);
    }
  }
  route.forEach(([x, y], i) => {
    disc(r, x, y, i === route.length - 1 ? 4 : 3, i % 3 === 0 ? NQ.gold : NQ.aqua);
    disc(r, x, y, i === route.length - 1 ? 2 : 1, NQ.cream);
  });

  // 章を表す「本・ことば・ひらめき」のスタンプ。
  const stamps: ReadonlyArray<readonly [number, number, string]> = [
    [45, 75, NQ.red], [75, 67, NQ.azure], [117, 108, NQ.green], [155, 99, NQ.orange], [195, 99, NQ.violet],
  ];
  stamps.forEach(([x, y, col], i) => {
    r(x - 5, y - 5, 11, 11, NQ.ink);
    r(x - 4, y - 4, 9, 9, col);
    if (i % 2 === 0) {
      r(x - 2, y - 2, 5, 1, NQ.white);
      r(x - 2, y, 5, 1, NQ.white);
      r(x - 2, y + 2, 5, 1, NQ.white);
    } else {
      r(x, y - 3, 1, 7, NQ.cream);
      r(x - 3, y, 7, 1, NQ.cream);
    }
  });

  // 左下のしおり。主人公は「景色を見る人」ではなく、次の学びへ出発する人になる。
  r(23, CLIFF_TOP - 2, 58, 4, NQ.ink);
  r(25, CLIFF_TOP - 4, 54, 3, NQ.brick);
  r(29, CLIFF_TOP - 5, 46, 1, NQ.gold);
  for (let n = 0; n < 25; n++) r(rng.int(22, 215), rng.int(56, 122), 1, 1, NQ.silver);
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
