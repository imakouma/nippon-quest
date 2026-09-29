/**
 * アイテムのアイコン（16×16。ぜんぶの どうぐに ある）。本番の PNG（assets/items/<id>.png）が できるまでの仮素材。
 * id から「かたち」（くだもの・魚・めん・焼きもの…）と 色を えらんで、円・だ円・線で かく。外周 1px の ink は自動。
 * 色は NQ-48 だけ。どれにも当てはまらない どうぐは、種類（どうぐ・そざい・そうび…）の かたちに なる。
 */
import type { Item } from '../../core/content/schemas';
import { makeGrid, outline, put, toCanvas, type Grid } from './grid';
import { NQ, shadeOf } from './palette';

export const ITEM_ICON_SIZE = 16;
const S = ITEM_ICON_SIZE;

/** a = おもな色、b = 2 番目の色、c = アクセント */
interface Pal {
  a: string;
  b: string;
  c: string;
}
type Draw = (g: Grid, p: Pal) => void;

const sh = (c: string): string => shadeOf(c);

// ───────────────────────── かく道具 ─────────────────────────

/** 外周 1px は輪郭のために空けておく */
function dot(g: Grid, x: number, y: number, col: string): void {
  const X = Math.round(x);
  const Y = Math.round(y);
  if (X >= 1 && Y >= 1 && X <= S - 2 && Y <= S - 2) put(g, X, Y, col);
}

/** だ円（shade があれば右下を かげに）。clip で一部だけ */
function oval(
  g: Grid,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  col: string,
  shade?: string,
  clip?: (x: number, y: number) => boolean,
): void {
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy > 1 || (clip && !clip(x, y))) continue;
      dot(g, x, y, shade && dx * 0.6 + dy * 0.8 > 0.45 ? shade : col);
    }
}

function box(g: Grid, x0: number, y0: number, x1: number, y1: number, col: string): void {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) dot(g, x, y, col);
}

/** 線（w = 2 なら右どなりも） */
function seg(g: Grid, x0: number, y0: number, x1: number, y1: number, col: string, w = 1): void {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = y0 + ((y1 - y0) * i) / n;
    dot(g, x, y, col);
    if (w > 1) dot(g, x + 1, y, col);
  }
}

/** 太い線（まるい先）。長いやさい・つつ・ぼう */
function thick(
  g: Grid,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
  col: string,
  shade?: string,
): void {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    oval(g, x0 + (x1 - x0) * t + 0.5, y0 + (y1 - y0) * t + 0.5, r, r, col, shade);
  }
}

/** 中の模様：条件に合うマス（すでに色があるマスだけ）を col に */
function pattern(g: Grid, col: string, on: (x: number, y: number) => boolean): void {
  for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) if (g[y]![x] && on(x, y)) put(g, x, y, col);
}

function plate(g: Grid): void {
  oval(g, 8, 12, 6.6, 2.6, NQ.cloud, NQ.silver);
}

function bowl(g: Grid, col: string): void {
  for (let y = 8; y <= 13; y++) {
    const hw = 6.2 - (y - 8) * 0.6;
    for (let x = Math.round(8 - hw); x <= Math.round(7 + hw); x++)
      dot(g, x, y, x > 8 && y > 9 ? sh(col) : col);
  }
  box(g, 6, 14, 9, 14, sh(col));
}

// ───────────────────────── かたち ─────────────────────────

const T = {
  // くだもの・やさい
  fruit: (g, p) => {
    oval(g, 8, 9, 5.6, 5.2, p.a, sh(p.a));
    seg(g, 8, 3, 8, 4.5, NQ.brown);
    for (const [x, y] of [
      [9, 3],
      [10, 3],
      [10, 2],
      [11, 2],
    ] as const)
      dot(g, x, y, p.c);
    dot(g, 5, 7, NQ.white);
    dot(g, 6, 6, NQ.white);
  },
  peach: (g, p) => {
    oval(g, 8, 9, 5.6, 5.2, p.a, sh(p.a));
    seg(g, 8, 4.5, 7, 9, sh(p.a));
    oval(g, 10.5, 10.5, 2, 2, p.b);
    dot(g, 9, 3, p.c);
    dot(g, 10, 3, p.c);
    dot(g, 5, 7, NQ.white);
  },
  citrus: (g, p) => {
    oval(g, 8, 9, 5.8, 5.2, p.a, sh(p.a));
    pattern(g, sh(p.a), (x, y) => (x * 3 + y * 5) % 11 === 0);
    dot(g, 8, 4, NQ.forest);
    dot(g, 9, 3, p.c);
    dot(g, 10, 3, p.c);
    dot(g, 5, 7, NQ.cream);
    dot(g, 6, 6, NQ.cream);
  },
  pine: (g, p) => {
    oval(g, 8, 10, 4.6, 4.6, p.a, sh(p.a));
    pattern(g, sh(p.a), (x, y) => (x + y) % 3 === 0 || (x - y + 30) % 3 === 0);
    seg(g, 8, 5, 8, 1, NQ.leaf);
    seg(g, 7, 5, 5, 2, NQ.green);
    seg(g, 9, 5, 11, 2, NQ.green);
  },
  grape: (g, p) => {
    for (const [x, y] of [
      [6, 5],
      [10, 5],
      [8, 7.5],
      [5, 8.5],
      [11, 8.5],
      [8, 10.5],
      [6, 12],
      [10, 12],
      [8, 13.5],
    ] as const)
      oval(g, x, y, 1.8, 1.8, p.a, sh(p.a));
    seg(g, 8, 1, 8, 3.5, NQ.brown);
    dot(g, 9, 2, p.c);
    dot(g, 10, 2, p.c);
  },
  cherry: (g, p) => {
    oval(g, 5.5, 11, 2.5, 2.5, p.a, sh(p.a));
    oval(g, 10.5, 11, 2.5, 2.5, p.a, sh(p.a));
    seg(g, 5, 8.5, 8, 3, NQ.green);
    seg(g, 10, 8.5, 8, 3, NQ.green);
    dot(g, 9, 2, NQ.leaf);
    dot(g, 10, 2, NQ.leaf);
    dot(g, 5, 10, NQ.white);
    dot(g, 10, 10, NQ.white);
  },
  strawberry: (g, p) => {
    for (let y = 5; y <= 13; y++) {
      const hw = 5.2 - (y - 5) * 0.6;
      for (let x = Math.round(8 - hw); x <= Math.round(7 + hw); x++) dot(g, x, y, x > 8 ? sh(p.a) : p.a);
    }
    pattern(g, NQ.cream, (x, y) => y > 5 && (x * 2 + y * 3) % 5 === 0);
    box(g, 5, 4, 10, 4, NQ.leaf);
    dot(g, 7, 3, NQ.green);
    dot(g, 9, 3, NQ.green);
    seg(g, 8, 1, 8, 3, NQ.green);
  },
  melon: (g, p) => {
    oval(g, 8, 9, 6.2, 5.8, p.a, sh(p.a));
    pattern(g, p.b, (x, y) => y > 3 && (x % 3 === 0 || y % 3 === 0));
    seg(g, 8, 2, 8, 3.5, NQ.brown);
  },
  watermelon: (g, p) => {
    oval(g, 8, 9, 6.2, 5.8, p.a, sh(p.a));
    pattern(g, p.b, (x) => x % 3 === 1);
    seg(g, 8, 2, 8, 3.5, NQ.brown);
  },
  olive: (g, p) => {
    seg(g, 2, 4, 13, 4, NQ.brown);
    oval(g, 6, 9.5, 2.2, 3, p.a, sh(p.a));
    oval(g, 10.5, 9, 2.2, 3, p.a, sh(p.a));
    seg(g, 6, 5, 6, 6.5, NQ.brown);
    seg(g, 10, 5, 10, 6, NQ.brown);
    oval(g, 3.5, 6, 1.6, 1, NQ.forest);
    oval(g, 13, 6, 1.6, 1, NQ.forest);
  },
  root: (g, p) => {
    thick(g, 4.5, 5, 11.5, 12.5, 1.9, p.a, sh(p.a));
    seg(g, 4, 5, 2, 1, NQ.leaf, 2);
    seg(g, 4, 5, 6, 1, NQ.green, 2);
    seg(g, 12, 13, 13.5, 14, p.a);
  },
  tuber: (g, p) => {
    oval(g, 8, 8.5, 6.3, 3.6, p.a, sh(p.a));
    pattern(g, p.b, (x, y) => (x * 5 + y * 3) % 13 === 0);
    seg(g, 13.5, 8.5, 14, 10, NQ.brown);
  },
  lotus: (g, p) => {
    oval(g, 8, 8.5, 6, 5.4, p.a, sh(p.a));
    for (const [x, y] of [
      [8, 8.5],
      [5, 8],
      [11, 8],
      [6.5, 11],
      [9.5, 11],
      [6.5, 6],
      [9.5, 6],
    ] as const)
      oval(g, x, y, 1.1, 1.1, p.b);
  },
  potato: (g, p) => {
    oval(g, 8, 9, 6, 4.6, p.a, sh(p.a));
    for (const [x, y] of [
      [5, 8],
      [9, 10],
      [11, 7],
      [7, 11],
    ] as const)
      dot(g, x, y, p.b);
  },
  onion: (g, p) => {
    oval(g, 8, 10, 5.2, 4.4, p.a, sh(p.a));
    box(g, 7, 5, 9, 5, p.a);
    dot(g, 8, 4, p.a);
    seg(g, 8, 1, 8, 3, NQ.leaf);
    pattern(g, p.b, (x, y) => y > 6 && (x === 6 || x === 10));
    dot(g, 7, 14, NQ.tan);
    dot(g, 9, 14, NQ.tan);
  },
  leafy: (g, p) => {
    oval(g, 8, 9, 6.2, 5.6, p.a, sh(p.a));
    seg(g, 8, 14, 8, 5, p.b);
    seg(g, 8, 11, 4, 7, p.b);
    seg(g, 8, 11, 12, 7, p.b);
  },
  negi: (g, p) => {
    thick(g, 3.5, 13, 7.5, 7.5, 1.5, p.a, sh(p.a));
    thick(g, 7.5, 7.5, 11.5, 2, 1.5, p.b, sh(p.b));
  },
  longveg: (g, p) => {
    thick(g, 5, 4.5, 11, 12.5, 2, p.a, sh(p.a));
    oval(g, 5, 4, 2.2, 1.6, p.b);
    seg(g, 4, 3, 3, 1, NQ.green);
  },
  strips: (g, p) => {
    for (const k of [4, 8, 12])
      for (let y = 3; y <= 13; y++) {
        const x = k + Math.round(Math.sin(y * 0.9 + k) * 0.8);
        dot(g, x, y, p.a);
        dot(g, x + 1, y, sh(p.a));
      }
  },
  cluster: (g, p) => {
    for (const [x, y] of [
      [5, 9],
      [10.5, 9],
      [7.8, 12],
      [7.8, 6],
    ] as const) {
      oval(g, x, y, 2, 2.4, p.a, sh(p.a));
      dot(g, x - 0.5, y - 2.6, p.b);
    }
  },
  mushroom: (g, p) => {
    oval(g, 8, 7.5, 6.3, 4, p.a, sh(p.a), (_x, y) => y <= 7);
    box(g, 3, 8, 12, 8, sh(p.b));
    box(g, 7, 9, 9, 13, p.b);
    for (const [x, y] of [
      [6, 5],
      [10, 6],
      [8, 4],
    ] as const)
      dot(g, x, y, NQ.cream);
  },
  wasabi: (g, p) => {
    thick(g, 7.5, 12.5, 7.5, 7, 1.8, p.a, sh(p.a));
    oval(g, 4.5, 4.5, 2.6, 1.8, NQ.green, NQ.forest);
    oval(g, 11.5, 4.5, 2.6, 1.8, NQ.green, NQ.forest);
    seg(g, 7, 6, 5, 5, NQ.forest);
    seg(g, 8, 6, 10, 5, NQ.forest);
  },
  herb: (g, p) => {
    oval(g, 5.5, 7, 2.4, 4, p.a, sh(p.a));
    oval(g, 10.5, 7, 2.4, 4, p.a, sh(p.a));
    oval(g, 8, 5, 2, 3.2, p.b);
    seg(g, 8, 14, 8, 6, NQ.forest);
  },
  // 海のもの
  fish: (g, p) => {
    oval(g, 7, 8.5, 5.6, 3.1, p.a, sh(p.a));
    pattern(g, p.b, (x, y) => y >= 10 && x >= 3 && x <= 10);
    for (let x = 12; x <= 14; x++) {
      const h = (x - 11) * 1.3;
      for (let y = Math.round(8.5 - h); y <= Math.round(8.5 + h - 1); y++) dot(g, x, y, p.a);
    }
    dot(g, 7, 5, p.a);
    dot(g, 4, 7, NQ.ink);
  },
  eel: (g, p) => {
    for (let x = 1; x <= 14; x++) {
      const y = 8 + Math.round(Math.sin(x * 0.7) * 2);
      dot(g, x, y, p.a);
      dot(g, x, y + 1, sh(p.a));
    }
    dot(g, 2, 7, NQ.ink);
  },
  fugu: (g, p) => {
    oval(g, 7.5, 9, 5.5, 4.8, p.a, sh(p.a));
    pattern(g, p.b, (_x, y) => y >= 11);
    pattern(g, sh(p.a), (x, y) => y < 9 && (x + y) % 4 === 0);
    box(g, 13, 8, 14, 10, p.a);
    dot(g, 5, 8, NQ.ink);
  },
  smallfish: (g, p) => {
    for (const [x, y] of [
      [5, 5],
      [10, 6],
      [6, 10],
      [11, 11],
    ] as const) {
      oval(g, x, y, 2.2, 1, p.a, sh(p.a));
      dot(g, x - 1.6, y - 0.4, NQ.ink);
    }
  },
  crab: (g, p) => {
    oval(g, 8, 9.5, 5, 3, p.a, sh(p.a));
    oval(g, 3.5, 5.5, 1.8, 1.6, p.a);
    oval(g, 12.5, 5.5, 1.8, 1.6, p.a);
    seg(g, 4, 7, 5, 8, p.a);
    seg(g, 12, 7, 11, 8, p.a);
    for (const [x0, y0, x1, y1] of [
      [4, 10, 2, 12],
      [5, 11, 3, 13],
      [12, 10, 14, 12],
      [11, 11, 13, 13],
    ] as const)
      seg(g, x0, y0, x1, y1, p.a);
    dot(g, 7, 7, NQ.ink);
    dot(g, 9, 7, NQ.ink);
  },
  shrimp: (g, p) => {
    for (const [x, y] of [
      [4, 4.5],
      [6.2, 3.8],
      [8.6, 4],
      [10.6, 5.2],
      [11.6, 7.6],
      [11, 10],
      [9, 11.4],
    ] as const)
      oval(g, x, y, 1.9, 1.9, p.a, sh(p.a));
    dot(g, 7, 12, p.b);
    dot(g, 6, 13, p.b);
    dot(g, 8, 13, p.b);
    seg(g, 3, 4, 1, 1, p.b);
    dot(g, 4, 4, NQ.ink);
  },
  shell: (g, p) => {
    for (let y = 3; y <= 13; y++)
      for (let x = 1; x <= 14; x++) {
        const dx = x + 0.5 - 8;
        const dy = y + 0.5 - 13.5;
        if (Math.hypot(dx, dy) > 10 || Math.abs(dx) > (13.5 - y) * 0.75 + 1.5) continue;
        dot(g, x, y, Math.floor(Math.atan2(dx, -dy) * 4) % 2 ? sh(p.a) : p.a);
      }
    box(g, 6, 12, 9, 13, p.b);
  },
  octopus: (g, p) => {
    oval(g, 8, 6.5, 4.6, 4.2, p.a, sh(p.a));
    for (const [x0, y0, x1, y1] of [
      [5, 9, 3, 13],
      [7, 10, 6, 14],
      [9, 10, 10, 14],
      [11, 9, 13, 13],
    ] as const)
      seg(g, x0, y0, x1, y1, p.a, 2);
    dot(g, 6, 6, NQ.ink);
    dot(g, 10, 6, NQ.ink);
  },
  squid: (g, p) => {
    for (let y = 2; y <= 8; y++) {
      const hw = (y - 1) * 0.55;
      for (let x = Math.round(8 - hw); x <= Math.round(7 + hw); x++) dot(g, x, y, x > 8 ? sh(p.a) : p.a);
    }
    oval(g, 8, 9.5, 3, 2.2, p.a);
    for (const [x0, x1] of [
      [6, 5],
      [8, 8],
      [10, 11],
    ] as const)
      seg(g, x0, 11, x1, 14, p.a);
    dot(g, 7, 9, NQ.ink);
    dot(g, 9, 9, NQ.ink);
  },
  seaweed: (g, p) => {
    for (const k of [4, 8, 11])
      for (let y = 3; y <= 14; y++) {
        const x = k + Math.round(Math.sin(y * 0.9 + k));
        dot(g, x, y, p.a);
        dot(g, x + 1, y, sh(p.a));
      }
  },
  nori: (g, p) => {
    box(g, 3, 3, 12, 12, p.a);
    pattern(g, p.c, (x, y) => (x * 7 + y * 3) % 9 === 0);
    box(g, 3, 8, 12, 9, p.b);
  },
  // 料理
  noodle: (g, p) => {
    bowl(g, p.b);
    box(g, 3, 7, 12, 7, p.c);
    for (let x = 3; x <= 12; x++) {
      dot(g, x, 6 + (x % 2), p.a);
      if (x % 3 === 0) dot(g, x, 7, p.a);
    }
    seg(g, 9, 2, 13, 6, NQ.tan);
    seg(g, 11, 1, 14, 4, NQ.tan);
  },
  riceBowl: (g, p) => {
    bowl(g, p.b);
    oval(g, 8, 8, 5.2, 3, NQ.white, undefined, (_x, y) => y <= 8);
    for (const [x, y] of [
      [6, 6],
      [9, 7],
      [10, 6],
      [7, 7],
    ] as const)
      dot(g, x, y, NQ.cloud);
  },
  soupBowl: (g, p) => {
    bowl(g, p.b);
    box(g, 3, 7, 12, 7, p.c);
    for (const [x, y] of [
      [5, 6],
      [8, 6],
      [11, 7],
      [6, 7],
    ] as const)
      dot(g, x, y, p.a);
  },
  sushi: (g, p) => {
    oval(g, 8, 10.5, 5.5, 2.4, NQ.white, NQ.cloud);
    oval(g, 8, 8.5, 5.8, 2.1, p.a, sh(p.a));
    pattern(g, p.b, (x, y) => y >= 7 && y <= 9 && x % 3 === 0 && y < 10);
  },
  steak: (g, p) => {
    oval(g, 8, 9, 6, 4.6, p.a, sh(p.a));
    pattern(g, p.b, (x, y) => (x * 3 + y * 5) % 7 === 0);
    oval(g, 12, 10, 1.6, 2, p.c);
  },
  drumstick: (g, p) => {
    oval(g, 7, 7, 4.6, 4.2, p.a, sh(p.a));
    seg(g, 10, 10, 12.5, 12.5, p.b, 2);
    oval(g, 13, 13.5, 1.4, 1.2, p.b);
    oval(g, 12.5, 12.5, 1.2, 1.4, p.b);
  },
  tongue: (g, p) => {
    oval(g, 5, 9, 3.2, 2.2, p.a, sh(p.a));
    oval(g, 8.5, 7.5, 3.2, 2.2, p.a, sh(p.a));
    oval(g, 11, 10.5, 3, 2, p.a, sh(p.a));
    pattern(g, p.b, (x, y) => (x + y * 2) % 5 === 0);
  },
  gyoza: (g, p) => {
    plate(g);
    for (const [x, y] of [
      [5, 9.5],
      [8.5, 8.5],
      [11.5, 9.8],
    ] as const) {
      oval(g, x, y, 2.6, 1.8, p.a, sh(p.a));
      dot(g, x, y - 1.2, p.b);
    }
  },
  plateDisc: (g, p) => {
    plate(g);
    oval(g, 8, 9, 5.5, 3.2, p.a, sh(p.a));
    pattern(g, p.b, (x, y) => y <= 9 && (x + y) % 3 === 0);
    pattern(g, p.c, (x, y) => y === 8 && x % 2 === 0);
  },
  plateBalls: (g, p) => {
    plate(g);
    for (const [x, y] of [
      [5, 9.5],
      [8, 8.5],
      [11, 9.5],
      [8, 11],
    ] as const) {
      oval(g, x, y, 1.9, 1.9, p.a, sh(p.a));
      dot(g, x, y - 1, p.b);
    }
    dot(g, 7, 7, p.c);
    dot(g, 10, 8, p.c);
  },
  skewer: (g, p) => {
    seg(g, 2, 14, 13, 3, NQ.tan);
    for (const [x, y] of [
      [5.5, 10.5],
      [8, 8],
      [10.5, 5.5],
    ] as const) {
      oval(g, x, y, 2.4, 2.4, p.a, sh(p.a));
      dot(g, x - 0.8, y - 1, p.b);
    }
  },
  tanpo: (g, p) => {
    seg(g, 1, 14, 14, 1, NQ.tan);
    thick(g, 4.2, 11.8, 10.8, 5.2, 2, p.a, sh(p.a));
    pattern(g, p.b, (x, y) => (x * 3 + y) % 5 === 0 && x > 3 && x < 12);
  },
  castella: (g, p) => {
    box(g, 2, 7, 13, 12, p.a);
    box(g, 2, 11, 13, 12, sh(p.a));
    box(g, 2, 5, 13, 6, p.b);
    box(g, 2, 13, 13, 13, NQ.paper);
  },
  cracker: (g, p) => {
    oval(g, 8, 8.5, 6, 6, p.a, sh(p.a));
    pattern(g, sh(p.a), (x, y) => (x * 5 + y * 7) % 9 === 0);
    box(g, 3, 7, 13, 9, p.b);
  },
  mochi: (g, p) => {
    plate(g);
    oval(g, 5.5, 9, 2.6, 2.2, p.a, sh(p.a));
    oval(g, 10.5, 9, 2.6, 2.2, p.a, sh(p.a));
    oval(g, 8, 6.5, 2.6, 2.2, p.a, sh(p.a));
    pattern(g, p.b, (x, y) => y < 11 && (x + y) % 4 === 0);
  },
  block: (g, p) => {
    box(g, 3, 6, 12, 12, p.a);
    box(g, 3, 6, 12, 6, p.b);
    box(g, 12, 7, 12, 12, sh(p.a));
    pattern(g, p.c, (x, y) => y > 6 && (x * 3 + y * 5) % 8 === 0);
  },
  kamaboko: (g, p) => {
    box(g, 2, 12, 13, 13, NQ.tan);
    oval(g, 8, 12, 5.8, 5.2, p.a, undefined, (_x, y) => y <= 11);
    oval(g, 8, 12, 4.2, 3.6, NQ.white, undefined, (_x, y) => y <= 11);
  },
  milk: (g, p) => {
    box(g, 5, 5, 10, 13, NQ.white);
    box(g, 10, 5, 10, 13, NQ.cloud);
    box(g, 6, 3, 9, 4, NQ.white);
    box(g, 6, 2, 9, 2, p.a);
    box(g, 5, 8, 10, 10, p.a);
  },
  pod: (g, p) => {
    thick(g, 3, 11, 12, 5, 2, p.a, sh(p.a));
    for (const [x, y] of [
      [5, 9.5],
      [8, 7.8],
      [11, 6],
    ] as const)
      oval(g, x + 0.5, y + 0.5, 1.2, 1.2, p.b);
    seg(g, 12, 5, 14, 3, NQ.green);
  },
  beans: (g, p) => {
    plate(g);
    for (const [x, y] of [
      [5, 10],
      [7, 10],
      [9, 10],
      [11, 10],
      [6, 8.5],
      [8, 8.5],
      [10, 8.5],
      [7, 7],
      [9, 7],
    ] as const) {
      oval(g, x + 0.5, y + 0.5, 1.2, 1.2, p.a);
    }
    dot(g, 7, 7, p.b);
    dot(g, 9, 9, p.b);
  },
  peanut: (g, p) => {
    oval(g, 6, 6.5, 2.8, 3.2, p.a, sh(p.a));
    oval(g, 10, 10, 2.8, 3.2, p.a, sh(p.a));
    pattern(g, sh(p.a), (x, y) => (x + y) % 3 === 0);
  },
  bottle: (g, p) => {
    box(g, 5, 6, 10, 13, p.a);
    box(g, 10, 6, 10, 13, sh(p.a));
    box(g, 6, 4, 9, 5, p.a);
    box(g, 7, 2, 8, 3, p.c);
    box(g, 5, 9, 10, 11, p.b);
  },
  jar: (g, p) => {
    oval(g, 8, 10, 5.2, 4, p.a, sh(p.a));
    box(g, 4, 5, 11, 6, p.b);
    dot(g, 8, 4, p.b);
    box(g, 5, 9, 10, 10, p.c);
  },
  salt: (g, p) => {
    oval(g, 8, 12, 6, 2, p.a, sh(p.a));
    oval(g, 8, 11, 4.5, 3.4, NQ.white, NQ.cloud, (_x, y) => y <= 11);
  },
  tea: (g, p) => {
    for (let y = 6; y <= 13; y++) {
      const hw = 4.2 - (y - 6) * 0.15;
      for (let x = Math.round(8 - hw); x <= Math.round(7 + hw); x++) dot(g, x, y, x > 9 ? sh(p.b) : p.b);
    }
    box(g, 5, 6, 10, 6, p.a);
    for (const [x, y] of [
      [6, 4],
      [7, 3],
      [6, 2],
      [9, 4],
      [10, 3],
      [9, 2],
    ] as const)
      dot(g, x, y, NQ.cloud);
  },
  // 工芸品
  pot: (g, p) => {
    box(g, 5, 2, 10, 2, p.a);
    box(g, 6, 3, 9, 4, p.a);
    oval(g, 8, 9.5, 5.4, 4.8, p.a, sh(p.a));
    box(g, 6, 14, 9, 14, sh(p.a));
    pattern(g, p.b, (_x, y) => y === 8 || y === 9);
    pattern(g, p.c, (x, y) => y === 11 && x % 2 === 0);
  },
  paper: (g, p) => {
    box(g, 3, 4, 12, 11, p.a);
    pattern(g, p.b, (x, y) => (x * 5 + y * 3) % 7 === 0);
    box(g, 2, 3, 2, 12, NQ.beige);
    box(g, 13, 3, 13, 12, NQ.beige);
    box(g, 10, 9, 11, 10, p.c);
  },
  lacquer: (g, p) => {
    box(g, 2, 6, 13, 12, p.a);
    box(g, 2, 5, 13, 6, sh(p.a));
    box(g, 2, 8, 13, 8, p.b);
    pattern(g, p.c, (x, y) => y > 8 && (x * 3 + y * 2) % 5 === 0);
  },
  glass: (g, p) => {
    for (let y = 4; y <= 13; y++) {
      const hw = 3.9 - (y - 4) * 0.12;
      for (let x = Math.round(8 - hw); x <= Math.round(7 + hw); x++) dot(g, x, y, p.a);
    }
    pattern(g, p.b, (x, y) => y > 5 && ((x + y) % 3 === 0 || (x - y + 30) % 3 === 0));
    box(g, 4, 4, 11, 4, NQ.ice);
  },
  cloth: (g, p) => {
    box(g, 2, 5, 13, 12, p.a);
    box(g, 2, 8, 13, 8, sh(p.a));
    pattern(g, p.b, (x, y) => y !== 8 && (x * 2 + y * 3) % 5 === 0);
    box(g, 2, 12, 13, 12, p.c);
  },
  stripes: (g, p) => {
    box(g, 2, 5, 13, 12, p.a);
    pattern(g, p.b, (x) => x % 3 === 0);
    box(g, 2, 8, 13, 8, sh(p.a));
  },
  kettle: (g, p) => {
    oval(g, 8, 10, 5.2, 4.2, p.a, sh(p.a));
    pattern(g, sh(p.a), (x, y) => y > 8 && (x + y) % 2 === 0);
    box(g, 6, 5, 9, 6, p.a);
    dot(g, 8, 4, p.a);
    for (const [x, y] of [
      [4, 5],
      [5, 4],
      [6, 3],
      [7, 3],
      [8, 2],
      [9, 3],
      [10, 3],
      [11, 4],
      [12, 5],
    ] as const)
      dot(g, x, y, p.b);
    seg(g, 12, 9, 14, 7, p.a);
  },
  scissors: (g, p) => {
    seg(g, 4, 2, 10, 10, NQ.silver, 2);
    seg(g, 11, 2, 6, 10, NQ.cloud, 2);
    oval(g, 5, 12, 2, 1.8, p.a);
    oval(g, 11, 12, 2, 1.8, p.a);
    dot(g, 8, 7, NQ.slate);
  },
  goldleaf: (g) => {
    box(g, 3, 3, 10, 10, NQ.gold);
    box(g, 6, 6, 13, 13, NQ.yellow);
    box(g, 6, 6, 10, 10, NQ.ochre);
  },
  kokeshi: (g, p) => {
    oval(g, 8, 5, 3.2, 3, NQ.beige);
    oval(g, 8, 4, 3.2, 2, NQ.bark, undefined, (_x, y) => y <= 4);
    dot(g, 7, 6, NQ.ink);
    dot(g, 9, 6, NQ.ink);
    box(g, 6, 8, 10, 14, p.a);
    pattern(g, p.b, (x, y) => y > 8 && (x + y) % 3 === 0);
  },
  hina: (g, p) => {
    oval(g, 8, 5, 2.8, 2.6, NQ.beige);
    oval(g, 8, 4, 2.8, 1.8, NQ.bark, undefined, (_x, y) => y <= 4);
    dot(g, 8, 2, NQ.gold);
    for (let y = 8; y <= 14; y++) {
      const hw = 2 + (y - 8) * 0.6;
      for (let x = Math.round(8 - hw); x <= Math.round(7 + hw); x++) dot(g, x, y, p.a);
    }
    box(g, 7, 8, 8, 9, p.b);
    pattern(g, p.c, (x, y) => y > 10 && (x + y) % 4 === 0);
  },
  daruma: (g, p) => {
    oval(g, 8, 8.5, 5.6, 6, p.a, sh(p.a));
    oval(g, 8, 7, 3, 2.3, NQ.white);
    dot(g, 7, 7, NQ.ink);
    dot(g, 9, 7, NQ.ink);
    box(g, 7, 11, 9, 12, p.b);
  },
  cow: (g, p) => {
    oval(g, 9.5, 9, 4.6, 3, p.a, sh(p.a));
    oval(g, 4, 7.5, 2.4, 2.2, p.a);
    seg(g, 7, 11, 7, 13, NQ.bark);
    seg(g, 11, 11, 11, 13, NQ.bark);
    dot(g, 9, 8, p.b);
    dot(g, 11, 9, p.b);
    dot(g, 3, 5, NQ.cream);
    dot(g, 5, 5, NQ.cream);
    dot(g, 3, 7, NQ.ink);
  },
  bear: (g, p) => {
    oval(g, 9, 10, 4.6, 3.2, p.a, sh(p.a));
    oval(g, 4.5, 7.5, 2.8, 2.5, p.a);
    dot(g, 3, 5, p.a);
    dot(g, 6, 5, p.a);
    seg(g, 7, 12, 7, 13, sh(p.a));
    seg(g, 11, 12, 11, 13, sh(p.a));
    seg(g, 1, 9, 3, 9, p.b, 2);
    dot(g, 4, 7, NQ.ink);
  },
  fan: (g, p) => {
    oval(g, 8, 6, 5.2, 4.8, p.a, sh(p.a));
    seg(g, 8, 10, 4, 3, p.b);
    seg(g, 8, 10, 8, 2, p.b);
    seg(g, 8, 10, 12, 3, p.b);
    seg(g, 8, 10, 8, 14, NQ.tan);
  },
  brush: (g, p) => {
    thick(g, 5, 10, 11.5, 2.5, 0.9, p.a);
    pattern(g, sh(p.a), (x, y) => (x + y) % 4 === 0);
    oval(g, 3.5, 12.5, 1.8, 1.8, p.b);
    dot(g, 2, 14, p.b);
  },
  inkstick: (g, p) => {
    box(g, 6, 2, 9, 13, p.a);
    dot(g, 7, 5, p.b);
    dot(g, 8, 7, p.b);
    dot(g, 7, 9, p.b);
  },
  inkstone: (g, p) => {
    box(g, 3, 3, 12, 13, p.a);
    box(g, 5, 5, 10, 7, p.b);
    pattern(g, sh(p.a), (x, y) => y > 8 && (x * 3 + y) % 5 === 0);
  },
  abacus: (g) => {
    box(g, 2, 4, 13, 12, NQ.brown);
    box(g, 3, 5, 12, 11, NQ.beige);
    box(g, 3, 7, 12, 7, NQ.brown);
    for (let x = 4; x <= 11; x += 2) {
      dot(g, x, 6, NQ.bark);
      dot(g, x, 9, NQ.bark);
      dot(g, x, 10, NQ.bark);
    }
  },
  koma: (g) => {
    for (let y = 3; y <= 13; y++) {
      const hw = y < 6 ? (y - 2) * 1.3 : 4.2;
      for (let x = Math.round(8 - hw); x <= Math.round(7 + hw); x++) dot(g, x, y, x > 9 ? NQ.tan : NQ.sand);
    }
    for (const [x, y] of [
      [7, 7],
      [8, 7],
      [8, 8],
      [7, 9],
      [8, 10],
    ] as const)
      dot(g, x, y, NQ.ink);
  },
  whisk: (g, p) => {
    box(g, 7, 9, 8, 14, p.a);
    for (const x of [4, 6, 8, 10, 12]) seg(g, 7.5, 9, x, 2, p.b);
    box(g, 6, 9, 9, 9, NQ.brown);
  },
  charcoal: (g, p) => {
    thick(g, 3, 10, 11, 5, 1.5, p.a, sh(p.a));
    thick(g, 4, 13, 12, 9, 1.5, p.a, sh(p.a));
    dot(g, 6, 7, p.b);
    dot(g, 9, 11, p.b);
  },
  incense: (g, p) => {
    for (const x of [6, 7, 8, 9, 10]) seg(g, x, 5, x, 13, p.a);
    box(g, 6, 9, 10, 9, p.b);
    for (const [x, y] of [
      [7, 3],
      [8, 2],
      [9, 3],
      [8, 1],
    ] as const)
      dot(g, x, y, NQ.cloud);
  },
  pearl: (g, p) => {
    oval(g, 8, 11.5, 6, 3, p.a, sh(p.a), (_x, y) => y >= 10);
    oval(g, 8, 8, 3.2, 3.2, NQ.white, NQ.cloud);
    dot(g, 7, 7, p.b);
  },
  glasses: (g, p) => {
    for (const cx of [4.5, 11.5])
      for (let y = 4; y <= 12; y++)
        for (let x = 1; x <= 14; x++) {
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - 8.5) / 3;
          if (d <= 1) dot(g, x, y, d > 0.6 ? p.a : p.b);
        }
    seg(g, 7, 7, 9, 7, p.a);
  },
  stone: (g, p) => {
    oval(g, 8, 9.5, 5.8, 4.4, p.a, sh(p.a));
    pattern(g, p.b, (x, y) => (x * 7 + y * 5) % 11 === 0);
  },
  bow: (g, p) => {
    for (let y = 2; y <= 14; y++) dot(g, 5 + Math.round(Math.sin(((y - 2) / 12) * Math.PI) * 4), y, p.a);
    seg(g, 5, 2, 5, 14, p.b);
    box(g, 8, 7, 9, 9, NQ.bark);
  },
  woodbox: (g, p) => {
    box(g, 2, 8, 13, 11, sh(p.a));
    oval(g, 8, 7.5, 6, 2.3, p.a);
    box(g, 2, 9, 13, 9, p.b);
  },
  mosaic: (g) => {
    box(g, 3, 4, 12, 12, NQ.tan);
    pattern(g, NQ.bark, (x, y) => (x + y) % 4 === 0);
    pattern(g, NQ.sand, (x, y) => (x - y + 40) % 4 === 0);
  },
  rush: (g, p) => {
    for (let x = 5; x <= 10; x++) seg(g, x, 2, x, 14, x % 2 ? p.a : sh(p.a));
    box(g, 4, 8, 11, 9, p.b);
  },
  carving: (g, p) => {
    box(g, 3, 3, 12, 13, p.a);
    oval(g, 8, 8, 3, 2.2, sh(p.a));
    seg(g, 5, 11, 11, 5, p.b);
  },
  lantern: (g, p) => {
    oval(g, 8, 8.5, 4.6, 5, p.a, sh(p.a));
    pattern(g, p.b, (_x, y) => y % 3 === 0);
    box(g, 6, 2, 9, 3, NQ.bark);
    box(g, 6, 14, 9, 14, NQ.bark);
    dot(g, 7, 7, NQ.cream);
  },
  // そうび・そざい・だいじな もの
  sword: (g, p) => {
    thick(g, 5, 10, 12.5, 2.5, 0.8, p.a);
    seg(g, 3, 9, 7, 13, NQ.gold, 1);
    seg(g, 4, 12, 2, 14, NQ.brown, 1);
  },
  helmet: (g, p) => {
    oval(g, 8, 10, 5.6, 5, p.a, sh(p.a), (_x, y) => y <= 10);
    box(g, 2, 10, 13, 11, sh(p.a));
    seg(g, 8, 2, 8, 5, p.b);
    dot(g, 5, 4, p.b);
    dot(g, 4, 3, p.b);
    dot(g, 11, 4, p.b);
    dot(g, 12, 3, p.b);
  },
  necklace: (g, p) => {
    for (let k = 0; k <= 8; k++) {
      const a = Math.PI * (0.1 + (0.8 * k) / 8);
      oval(g, 8 + Math.cos(a) * 5.2, 5 + Math.sin(a) * 6, 1.1, 1.1, p.a);
    }
    oval(g, 8, 12, 1.8, 1.8, p.b);
    dot(g, 9, 13, p.b);
  },
  armor: (g, p) => {
    box(g, 2, 4, 13, 6, p.a);
    box(g, 4, 6, 11, 13, p.a);
    pattern(g, sh(p.a), (_x, y) => y % 3 === 0 && y > 6);
    box(g, 7, 4, 8, 5, p.b);
  },
  greaves: (g, p) => {
    for (let y = 4; y <= 12; y++)
      box(g, Math.round(5 - (y - 4) * 0.3), y, Math.round(10 + (y - 4) * 0.3), y, p.a);
    pattern(g, sh(p.a), (x) => x % 3 === 0);
    box(g, 4, 3, 11, 3, p.b);
  },
  boots: (g, p) => {
    box(g, 3, 4, 6, 12, p.a);
    box(g, 3, 12, 7, 13, sh(p.a));
    box(g, 9, 4, 12, 12, p.a);
    box(g, 9, 12, 13, 13, sh(p.a));
    box(g, 3, 6, 6, 6, p.b);
    box(g, 9, 6, 12, 6, p.b);
  },
  amulet: (g, p) => {
    box(g, 5, 5, 10, 13, p.a);
    box(g, 6, 4, 9, 4, p.a);
    box(g, 10, 6, 10, 13, sh(p.a));
    seg(g, 7, 1, 6, 4, p.b);
    seg(g, 8, 1, 9, 4, p.b);
    for (const y of [7, 9, 11]) dot(g, 7.5, y, p.b);
  },
  ore: (g, p) => {
    oval(g, 8, 9.5, 5.6, 4.2, p.a, sh(p.a));
    for (const [x, y] of [
      [6, 8],
      [9, 10],
      [10, 7],
    ] as const)
      dot(g, x, y, p.b);
  },
  log: (g, p) => {
    box(g, 2, 6, 11, 11, p.a);
    box(g, 2, 10, 11, 11, sh(p.a));
    oval(g, 12, 8.5, 2, 2.8, p.b);
    dot(g, 12, 8, sh(p.a));
  },
  shard: (g, p) => {
    for (let y = 3; y <= 13; y++) {
      const x0 = Math.round(5 + (y - 3) * 0.3);
      const x1 = Math.round(11 - (y - 3) * 0.45);
      for (let x = x0; x <= x1; x++) dot(g, x, y, x > (x0 + x1) / 2 ? sh(p.a) : p.a);
    }
    pattern(g, p.b, (x, y) => (x + y * 2) % 5 === 0);
  },
  fang: (g, p) => {
    for (let y = 2; y <= 13; y++) {
      const w = 3 - (y - 2) * 0.22;
      const cx = 7 + Math.sin((y - 2) * 0.25) * 2;
      for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++) dot(g, x, y, x > cx ? sh(p.a) : p.a);
    }
  },
  feather: (g, p) => {
    // はね：ななめの 軸に 羽毛が ついた 1 まい（右下が かげ、先に 光）
    for (let i = 0; i <= 11; i++) {
      const x = 3.6 + i * 0.7;
      const y = 12.6 - i * 0.85;
      const w = Math.sin((i / 11) * Math.PI) * 3;
      for (let d = -w; d <= w; d += 0.6) dot(g, x + d * 0.55, y + d * 0.6, d > 0 ? sh(p.a) : p.a);
    }
    seg(g, 3.6, 12.8, 11.6, 3, p.b);
    for (const [x, y] of [
      [6, 10],
      [8, 7],
    ] as const)
      dot(g, x, y, p.c);
  },
  crate: (g, p) => {
    box(g, 3, 5, 12, 12, p.a);
    box(g, 3, 5, 12, 6, p.b);
    box(g, 7, 5, 8, 12, p.c);
  },
} satisfies Record<string, Draw>;

export type ItemShape = keyof typeof T;

const pal = (a: string, b: string = shadeOf(a), c: string = NQ.leaf): Pal => ({ a, b, c });

/** 焼きもの：産地ごとの色（ゆう薬・もよう） */
const POTTERY: Readonly<Record<string, Pal>> = {
  setoyaki: pal(NQ.white, NQ.blue, NQ.sky),
  tokonameyaki: pal(NQ.brick, NQ.amber, NQ.sand),
  minoyaki: pal(NQ.green, NQ.beige, NQ.brown),
  kutaniyaki: pal(NQ.gold, NQ.green, NQ.red),
  tobeyaki: pal(NQ.white, NQ.navy, NQ.sky),
  koishiwarayaki: pal(NQ.tan, NQ.brown, NQ.beige),
  kasamayaki: pal(NQ.amber, NQ.brown, NQ.sand),
  satsumayaki: pal(NQ.cream, NQ.gold, NQ.red),
  bankoyaki: pal(NQ.brown, NQ.bark, NQ.sand),
  aritayaki: pal(NQ.white, NQ.blue, NQ.red),
  hasamiyaki: pal(NQ.paper, NQ.azure, NQ.navy),
  bizenyaki: pal(NQ.brick, NQ.bark, NQ.amber),
  ontayaki: pal(NQ.sand, NQ.brown, NQ.cream),
  hagiyaki: pal(NQ.beige, NQ.blush, NQ.tan),
  mashikoyaki: pal(NQ.amber, NQ.bark, NQ.cream),
  shigarakiyaki: pal(NQ.tan, NQ.brown, NQ.green),
};

/** ぬりもの：産地ごとの色 */
const LACQUER: Readonly<Record<string, Pal>> = {
  'tsugaru-nuri': pal(NQ.bark, NQ.red, NQ.gold),
  wajimanuri: pal(NQ.red, NQ.gold, NQ.bark),
  wakasanuri: pal(NQ.bark, NQ.gold, NQ.cream),
  'kishu-shikki': pal(NQ.red, NQ.bark, NQ.gold),
  'kiso-shikki': pal(NQ.brick, NQ.gold, NQ.bark),
};

/** id（県の名前を のぞいた部分）→ かたち と 色。上から順に くらべる */
const RULES: readonly [RegExp, ItemShape, Pal | ((id: string) => Pal)][] = [
  // しんかの どうぐ（ほかの きまりに たまたま当たらないよう いちばん先に：比内地鶏の「hina」・なりごまの しる「ushi」など）
  [/hinaijidori|dashi$/, 'soupBowl', pal(NQ.cream, NQ.brick, NQ.amber)],
  [/narigoma|shirushi/, 'koma', pal(NQ.sand)],
  [/-no-hana$/, 'herb', pal(NQ.white, NQ.blush)],
  [/-no-futa$/, 'lacquer', pal(NQ.red, NQ.gold, NQ.bark)],
  [/-no-fude$/, 'brush', pal(NQ.tan, NQ.red)],
  [/goya-no-tane$/, 'cluster', pal(NQ.tan, NQ.leaf)],
  [/cochin-no-hane/, 'herb', pal(NQ.sand, NQ.tan)],
  [
    /-no-hane$/,
    'feather',
    (id) =>
      /toki/.test(id)
        ? pal(NQ.blush, NQ.berry, NQ.white)
        : /umineko|shiratori/.test(id)
          ? pal(NQ.white, NQ.cloud, NQ.gold)
          : pal(NQ.brown, NQ.bark, NQ.cream),
  ],
  [/mango-no-ami$/, 'fruit', pal(NQ.vermilion, NQ.white)],
  [/yu-no-hana$/, 'shard', pal(NQ.cream, NQ.yellow)],
  [/ayu$/, 'fish', pal(NQ.teal, NQ.silver)],
  [/hisui-no-genseki$/, 'stone', pal(NQ.leaf, NQ.green, NQ.white)],
  [/hamanasu/, 'herb', pal(NQ.blush, NQ.berry)],
  [/akamatsu-no-maki$/, 'log', pal(NQ.brick, NQ.tan)],
  // 地名に たまたま 魚・牛の文字が入る どうぐ（淡路の「aji」・八代の「ushi」など）を 先に きめる
  [/ajiishi/, 'ore', pal(NQ.silver, NQ.slate)],
  [/igusa/, 'rush', pal(NQ.leaf, NQ.sand)],
  [/senko/, 'rush', pal(NQ.forest, NQ.gold)],
  // 料理（めん・どんぶり は くだもの・魚より先に。「せんべい汁」「たこ焼き」なども）
  [/senbeijiru|imoni/, 'soupBowl', pal(NQ.beige, NQ.brick, NQ.amber)],
  [/houtou/, 'noodle', pal(NQ.cream, NQ.bark, NQ.amber)],
  [/wanko/, 'noodle', pal(NQ.tan, NQ.red, NQ.brown)],
  [/soba/, 'noodle', pal(NQ.tan, NQ.brick, NQ.brown)],
  [/udon/, 'noodle', pal(NQ.cream, NQ.navy, NQ.sand)],
  [/ramen/, 'noodle', pal(NQ.yellow, NQ.cloud, NQ.amber)],
  [/reimen/, 'noodle', pal(NQ.cloud, NQ.silver, NQ.brick)],
  [/somen/, 'noodle', pal(NQ.white, NQ.sky, NQ.ice)],
  [/takoyaki/, 'plateBalls', pal(NQ.amber, NQ.brown, NQ.leaf)],
  [/okonomiyaki/, 'plateDisc', pal(NQ.amber, NQ.brown, NQ.cream)],
  [/gyoza/, 'gyoza', pal(NQ.sand, NQ.amber)],
  [/jakoten/, 'plateDisc', pal(NQ.tan, NQ.brown, NQ.sand)],
  [/chicken|tebasaki/, 'drumstick', pal(NQ.amber, NQ.white)],
  [/kiritanpo/, 'tanpo', pal(NQ.beige, NQ.amber)],
  [/manju/, 'skewer', pal(NQ.amber, NQ.brown)],
  [
    /zushi/,
    'sushi',
    (id) =>
      /kakinoha/.test(id)
        ? pal(NQ.green, NQ.lime)
        : /funa/.test(id)
          ? pal(NQ.apricot, NQ.cream)
          : pal(NQ.blush, NQ.white),
  ],
  [/okome/, 'riceBowl', pal(NQ.white, NQ.navy)],
  // 肉・牛乳
  [/gyunyu/, 'milk', pal(NQ.sky)],
  [/gyutan/, 'tongue', pal(NQ.blush, NQ.berry)],
  [/kurobuta/, 'steak', pal(NQ.blush, NQ.white, NQ.cream)],
  // ことばの おわりの「gyu / ushi」だけ（yatsUSHIro の い草が 牛肉に なっていた）
  [/(gyu|ushi)(-|$)/, 'steak', pal(NQ.red, NQ.white, NQ.cream)],
  // 海のもの
  [/maguro/, 'fish', pal(NQ.navy, NQ.silver)],
  [/katsuo/, 'fish', pal(NQ.blue, NQ.cloud)],
  [/buri/, 'fish', pal(NQ.azure, NQ.cloud)],
  // 「あじ」だけの ことば（awAJIの たまねぎ・wAJIma塗・sakurAJIma大根が 魚に なっていた）
  [/(^|-)aji$/, 'fish', pal(NQ.teal, NQ.silver)],
  [/zake/, 'fish', pal(NQ.apricot, NQ.cream)],
  [/fugu/, 'fugu', pal(NQ.ochre, NQ.white)],
  [/unagi/, 'eel', pal(NQ.amber)],
  [/shirasu/, 'smallfish', pal(NQ.cloud)],
  [/gani|zuwai/, 'crab', pal(NQ.vermilion)],
  [/ebi/, 'shrimp', (id) => (/ise/.test(id) ? pal(NQ.red, NQ.brick) : pal(NQ.vermilion, NQ.orange))],
  [
    /-kaki$|iwagaki|hotate|shijimi|hamaguri/,
    'shell',
    (id) =>
      /hotate/.test(id)
        ? pal(NQ.sand, NQ.white)
        : /shijimi/.test(id)
          ? pal(NQ.slate, NQ.gray)
          : /hamaguri/.test(id)
            ? pal(NQ.beige, NQ.tan)
            : pal(NQ.silver, NQ.cloud),
  ],
  [/-tako$/, 'octopus', pal(NQ.berry)],
  // 「いか」だけの ことば（suIKA が いかに なっていた）
  [/(^|-)ika$|hotaruika/, 'squid', (id) => (/hotaru/.test(id) ? pal(NQ.sky) : pal(NQ.cloud))],
  [/wakame|konbu/, 'seaweed', pal(NQ.green)],
  [/nori$/, 'nori', pal(NQ.forest, NQ.paper, NQ.teal)],
  // くだもの
  [/ringo/, 'fruit', pal(NQ.red)],
  [/momo|hakuto/, 'peach', pal(NQ.blush, NQ.berry)],
  [/nijisseiki/, 'fruit', pal(NQ.lime)],
  [/nashi/, 'fruit', pal(NQ.sand)],
  [/gaki/, 'fruit', pal(NQ.orange)],
  [/biwa/, 'fruit', pal(NQ.apricot)],
  [/mango/, 'fruit', pal(NQ.vermilion)],
  [/mikan/, 'citrus', pal(NQ.orange)],
  [/hyuganatsu|lemon/, 'citrus', pal(NQ.yellow)],
  [/yuzu/, 'citrus', pal(NQ.gold)],
  [/sudachi|kabosu/, 'citrus', pal(NQ.leaf)],
  [/pineapple/, 'pine', pal(NQ.gold)],
  [/muscat/, 'grape', pal(NQ.lime)],
  [/budo/, 'grape', pal(NQ.violet)],
  [/sakuranbo/, 'cherry', pal(NQ.red)],
  [/ichigo/, 'strawberry', pal(NQ.red)],
  [/melon/, 'melon', pal(NQ.lime, NQ.sprout)],
  [/suika/, 'watermelon', pal(NQ.green, NQ.forest)],
  [/-ume$/, 'fruit', pal(NQ.berry)],
  [/olive/, 'olive', pal(NQ.leaf)],
  // やさい
  [/daikon|udo$/, 'root', pal(NQ.white)],
  [/renkon/, 'lotus', pal(NQ.beige, NQ.tan)],
  [/satsumaimo|naruto-kintoki/, 'tuber', pal(NQ.berry, NQ.cream)],
  [/hoshiimo/, 'strips', pal(NQ.orange)],
  [/kanpyo/, 'strips', pal(NQ.beige)],
  [/jagaimo/, 'potato', pal(NQ.sand, NQ.brown)],
  [/tamanegi/, 'onion', pal(NQ.apricot, NQ.cream)],
  [/kyabetsu|retasu|nozawana/, 'leafy', pal(NQ.lime, NQ.sprout)],
  [/negi/, 'negi', pal(NQ.white, NQ.leaf)],
  [/nasu/, 'longveg', pal(NQ.indigo, NQ.green)],
  [/manganji|goya/, 'longveg', pal(NQ.leaf, NQ.green)],
  [/rakkyo/, 'cluster', pal(NQ.white, NQ.leaf)],
  [/shiitake/, 'mushroom', pal(NQ.brown, NQ.beige)],
  [/wasabi/, 'wasabi', pal(NQ.lime)],
  [/konnyaku/, 'block', pal(NQ.gray, NQ.silver, NQ.slate)],
  // お茶・おかし・まめ・ちょうみりょう
  [/cha$/, 'tea', pal(NQ.leaf, NQ.beige)],
  [/castella/, 'castella', pal(NQ.yellow, NQ.brown)],
  [/karukan/, 'block', pal(NQ.white, NQ.paper, NQ.cloud)],
  [/senbei/, 'cracker', pal(NQ.amber, NQ.forest)],
  [/zunda/, 'mochi', pal(NQ.lime, NQ.green)],
  [/kamaboko|sasakama/, 'kamaboko', pal(NQ.blush)],
  [/kuromame/, 'beans', pal(NQ.bark, NQ.white)],
  [/natto/, 'beans', pal(NQ.amber, NQ.cream)],
  [/dadachamame/, 'pod', pal(NQ.leaf, NQ.lime)],
  [/rakkasei/, 'peanut', pal(NQ.sand)],
  [/shoyu/, 'bottle', pal(NQ.bark, NQ.paper, NQ.red)],
  [/miso/, 'jar', pal(NQ.amber, NQ.brown, NQ.cream)],
  [/-shio$/, 'salt', pal(NQ.navy)],
  // 工芸品
  [/yaki$/, 'pot', (id) => POTTERY[id] ?? pal(NQ.tan, NQ.brown, NQ.beige)],
  [/washi/, 'paper', pal(NQ.paper, NQ.cloud, NQ.red)],
  [/nuri|shikki/, 'lacquer', (id) => LACQUER[id] ?? pal(NQ.red, NQ.gold, NQ.bark)],
  [/kiriko/, 'glass', pal(NQ.azure, NQ.ice)],
  [/glass/, 'glass', pal(NQ.aqua, NQ.mint)],
  [/shibori|aizome/, 'cloth', pal(NQ.indigo, NQ.white, NQ.navy)],
  [/chirimen/, 'cloth', pal(NQ.blush, NQ.cream, NQ.berry)],
  [/bingata/, 'cloth', pal(NQ.yellow, NQ.red, NQ.azure)],
  [/denim/, 'cloth', pal(NQ.denim, NQ.orange, NQ.navy)],
  [/jofu|chijimi/, 'stripes', pal(NQ.ice, NQ.sky)],
  [/towel/, 'stripes', pal(NQ.white, NQ.sky)],
  [/tekki/, 'kettle', pal(NQ.night, NQ.slate)],
  [/doki$/, 'pot', pal(NQ.amber, NQ.brown, NQ.gold)],
  [/tsubame-sanjo/, 'scissors', pal(NQ.red)],
  [/kinpaku/, 'goldleaf', pal(NQ.gold)],
  [/kokeshi/, 'kokeshi', pal(NQ.red, NQ.gold)],
  [/hina/, 'hina', pal(NQ.red, NQ.gold, NQ.azure)],
  [/daruma/, 'daruma', pal(NQ.red, NQ.gold)],
  [/koboshi/, 'daruma', pal(NQ.vermilion, NQ.gold)],
  [/akabeko/, 'cow', pal(NQ.red, NQ.white)],
  [/guma/, 'bear', pal(NQ.brown, NQ.sky)],
  [/uchiwa/, 'fan', (id) => (/marugame/.test(id) ? pal(NQ.azure, NQ.cloud) : pal(NQ.blush, NQ.paper))],
  [/fude/, 'brush', pal(NQ.tan, NQ.bark)],
  [/zumi/, 'inkstick', pal(NQ.night, NQ.gold)],
  [/suzuri/, 'inkstone', pal(NQ.slate, NQ.night)],
  [/soroban/, 'abacus', pal(NQ.brown)],
  [/koma$/, 'koma', pal(NQ.sand)],
  [/chasen/, 'whisk', pal(NQ.sand, NQ.cream)],
  [/binchotan/, 'charcoal', pal(NQ.night, NQ.silver)],
  [/senko/, 'incense', pal(NQ.green, NQ.gold)],
  [/shinju/, 'pearl', pal(NQ.silver, NQ.ice)],
  [/megane/, 'glasses', pal(NQ.navy, NQ.ice)],
  [/ajiishi/, 'stone', pal(NQ.silver, NQ.slate)],
  [/daikyu/, 'bow', pal(NQ.brown, NQ.cloud)],
  [/magewappa/, 'woodbox', pal(NQ.sand, NQ.brown)],
  [/yosegi/, 'mosaic', pal(NQ.tan)],
  [/igusa/, 'rush', pal(NQ.lime, NQ.red)],
  [/chokoku/, 'carving', pal(NQ.sand, NQ.brown)],
  // そざい・どうぐ（青森の むかしからの どうぐ・しんかの どうぐ など）
  [/nebuta-no-akari/, 'lantern', pal(NQ.vermilion, NQ.cream)],
  [/magatama/, 'necklace', pal(NQ.tan, NQ.leaf)],
  [/kubikazari/, 'necklace', pal(NQ.red, NQ.gold)],
  [/-ita$/, 'log', pal(NQ.sand, NQ.beige)],
  [/kine$/, 'log', pal(NQ.brown, NQ.tan)],
  [/ito$/, 'rush', pal(NQ.cloud, NQ.azure)],
  [/kazaguruma/, 'fan', pal(NQ.red, NQ.yellow)],
  [/shizuku/, 'shard', pal(NQ.sky, NQ.ice)],
  [/kyuri/, 'longveg', pal(NQ.green, NQ.lime)],
  [/sasa/, 'herb', pal(NQ.green, NQ.leaf)],
  [/benibana/, 'herb', pal(NQ.orange, NQ.red)],
  [/otama/, 'brush', pal(NQ.silver, NQ.slate)],
  [/tane$/, 'cluster', pal(NQ.tan, NQ.leaf)],
  [/hata$/, 'cloth', pal(NQ.white, NQ.red, NQ.red)],
  [/tetsu$/, 'ore', pal(NQ.slate, NQ.silver)],
  [/hiba-zai/, 'log', pal(NQ.tan, NQ.sand)],
  [/doki-kakera/, 'shard', pal(NQ.tan, NQ.brown)],
  [/mizu-no-kakera/, 'shard', pal(NQ.sky, NQ.ice)],
  [/yakusugi-no-kakera/, 'log', pal(NQ.brown, NQ.tan)],
  [/ashitaba/, 'herb', pal(NQ.leaf, NQ.lime)],
  [/kiba/, 'fang', pal(NQ.paper)],
];

/** 種類ごとの かたち（どのきまりにも当てはまらない どうぐ） */
function byKind(item: Pick<Item, 'id' | 'kind'>): [ItemShape, Pal] {
  const id = item.id;
  switch (item.kind) {
    case 'weapon':
      return ['sword', /maguro/.test(id) ? pal(NQ.sky) : /dou/.test(id) ? pal(NQ.amber) : pal(NQ.silver)];
    case 'head':
      return /kubikazari/.test(id) ? ['necklace', pal(NQ.tan, NQ.green)] : ['helmet', pal(NQ.red, NQ.gold)];
    case 'chest':
      return ['armor', /ringo/.test(id) ? pal(NQ.red, NQ.leaf) : pal(NQ.slate, NQ.gold)];
    case 'legs':
      return ['greaves', pal(NQ.tan, NQ.brown)];
    case 'feet':
      return ['boots', /nuri/.test(id) ? pal(NQ.bark, NQ.red) : pal(NQ.brown, NQ.tan)];
    case 'key':
      return ['amulet', pal(NQ.red, NQ.gold)];
    case 'consumable':
      return ['herb', pal(NQ.leaf, NQ.lime)];
    case 'material':
      return ['shard', pal(NQ.tan, NQ.brown)];
  }
}

/** そのどうぐの かたち と 色（fallback = どのきまりにも当てはまらず、種類の かたち） */
export function itemIconDesign(item: Pick<Item, 'id' | 'kind'>): {
  shape: ItemShape;
  pal: Pal;
  fallback: boolean;
} {
  // めいさんひんの そうび（<県>-meisan-<名産品>）は その 名産品の かたち（無ければ 部位の かたち）
  const meisan = /^[a-z]+-meisan-(.+)$/.exec(item.id)?.[1];
  if (meisan)
    for (const [re, shape, p] of RULES)
      if (re.test(meisan)) return { shape, pal: typeof p === 'function' ? p(meisan) : p, fallback: false };
  // そうび・だいじな もの は 種類の かたち（ぬりの ブーツ・マグロの ずつき なども）
  if (['weapon', 'head', 'chest', 'legs', 'feet', 'key'].includes(item.kind)) {
    const [shape, p] = byKind(item);
    return { shape, pal: p, fallback: false };
  }
  // 県の名前を のぞいた部分だけで くらべる（fuk「ushi」ma・tok「ushi」ma が 牛（ushi）に 当たらないように）
  const short = item.id.slice(item.id.indexOf('-') + 1);
  for (const [re, shape, p] of RULES)
    if (re.test(short)) return { shape, pal: typeof p === 'function' ? p(short) : p, fallback: false };
  const [shape, p] = byKind(item);
  return { shape, pal: p, fallback: true };
}

/** 16×16 のマス目（外周の ink こみ） */
export function itemIconGrid(item: Pick<Item, 'id' | 'kind'>): Grid {
  const { shape, pal: p } = itemIconDesign(item);
  const g = makeGrid(S, S);
  T[shape](g, p);
  outline(g, NQ.ink);
  return g;
}

const urls = new Map<string, string>();

/** DOM で使う data URL（<img> を image-rendering: pixelated で拡大する）。本番の PNG ができたら そちらを優先する */
export function itemIconUrl(item: Pick<Item, 'id' | 'kind'>): string {
  const hit = urls.get(item.id);
  if (hit) return hit;
  const u = toCanvas(itemIconGrid(item)).toDataURL();
  urls.set(item.id, u);
  return u;
}
