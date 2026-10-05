/**
 * 名所の絵（32×32 の「えはがき」）を かく 道具。空・地面・海などの 背景と、形（だ円・三角・線）と、輪郭。
 * 1 マス = 1 ドット。色は NQ-48 だけ。外周 1px は わく（ink）用に あけておく（frame() が かく）。
 * カットインでは ×3（96px）で 出る。
 */
import { makeGrid, outline, put, type Grid } from '../grid';
import { NQ, shadeOf } from '../palette';

export { NQ };
export type { Grid };
export const MA = 32;
const S = MA;

/** 場面の えらび（v）。例：castle の 'black'、flowers の 'purple' */
export interface SceneOpt {
  v?: string;
  /** 名所ごとの 数（木の ならびなどを 少しずつ かえたいとき） */
  seed: number;
}
export type SceneFn = (g: Grid, o: SceneOpt) => void;

export const sh = (c: string): string => shadeOf(c);

// ───────────────────────── 点・形 ─────────────────────────

/** わく（外周 1px）の 内がわだけに かく */
export function dot(g: Grid, x: number, y: number, col: string): void {
  const X = Math.round(x);
  const Y = Math.round(y);
  if (X >= 1 && Y >= 1 && X <= S - 2 && Y <= S - 2) put(g, X, Y, col);
}

export function box(g: Grid, x0: number, y0: number, x1: number, y1: number, col: string): void {
  for (let y = Math.round(y0); y <= Math.round(y1); y++)
    for (let x = Math.round(x0); x <= Math.round(x1); x++) dot(g, x, y, col);
}

/** だ円（shade があれば 右下を かげに）。clip で 一部だけ */
export function oval(
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

/** 線（w = 2 なら 右どなりも） */
export function seg(g: Grid, x0: number, y0: number, x1: number, y1: number, col: string, w = 1): void {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = y0 + ((y1 - y0) * i) / n;
    dot(g, x, y, col);
    if (w > 1) dot(g, x + 1, y, col);
  }
}

/** 三角形を ぬる（山・屋根・テントなど） */
export function tri(
  g: Grid,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  col: string,
): void {
  const minX = Math.floor(Math.min(ax, bx, cx));
  const maxX = Math.ceil(Math.max(ax, bx, cx));
  const minY = Math.floor(Math.min(ay, by, cy));
  const maxY = Math.ceil(Math.max(ay, by, cy));
  const side = (px: number, py: number, x0: number, y0: number, x1: number, y1: number) =>
    (px - x1) * (y0 - y1) - (x0 - x1) * (py - y1);
  for (let y = minY; y <= maxY; y++)
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const d1 = side(px, py, ax, ay, bx, by);
      const d2 = side(px, py, bx, by, cx, cy);
      const d3 = side(px, py, cx, cy, ax, ay);
      const neg = d1 < 0 || d2 < 0 || d3 < 0;
      const pos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(neg && pos)) dot(g, x, y, col);
    }
}

/** 太い線（まるい 先）。木の みき・柱・川 */
export function thick(g: Grid, x0: number, y0: number, x1: number, y1: number, r: number, col: string): void {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    oval(g, x0 + (x1 - x0) * t + 0.5, y0 + (y1 - y0) * t + 0.5, r, r, col);
  }
}

/** すでに 色がある マスのうち、条件に 合う マスを col に（もよう） */
export function pattern(g: Grid, col: string, on: (x: number, y: number) => boolean): void {
  for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) if (g[y]![x] && on(x, y)) put(g, x, y, col);
}

/**
 * 主役を 別の 紙に かいて、まわりを ink で ふちどってから 背景に のせる（背景に うもれない）。
 * 背景の 上に 直接 かくと 輪郭が つかないので、建物・動物・人は これで かく
 */
export function layer(g: Grid, draw: (l: Grid) => void, ink: string = NQ.ink): void {
  const l = makeGrid(S, S);
  draw(l);
  outline(l, ink);
  for (let y = 1; y < S - 1; y++)
    for (let x = 1; x < S - 1; x++) {
      const c = l[y]![x];
      if (c) put(g, x, y, c);
    }
}

// ───────────────────────── 背景 ─────────────────────────

export type SkyMode = 'day' | 'dusk' | 'night' | 'snow' | 'cloudy';

const SKY: Record<SkyMode, string[]> = {
  day: [NQ.azure, NQ.sky, NQ.ice],
  dusk: [NQ.violet, NQ.lavender, NQ.apricot],
  night: [NQ.night, NQ.navy, NQ.indigo],
  snow: [NQ.silver, NQ.cloud, NQ.paper],
  cloudy: [NQ.gray, NQ.silver, NQ.cloud],
};

/** 空で ぜんぶを ぬる（上から 3 だん）。night は 星も */
export function sky(g: Grid, mode: SkyMode = 'day', seed = 0): void {
  const [a, b, c] = SKY[mode];
  for (let y = 1; y < S - 1; y++) {
    const col = y < 9 ? a! : y < 17 ? b! : c!;
    for (let x = 1; x < S - 1; x++) put(g, x, y, col);
  }
  if (mode === 'night')
    for (let i = 0; i < 9; i++) {
      const x = 2 + ((i * 11 + seed * 7) % 28);
      const y = 2 + ((i * 7 + seed * 3) % 12);
      dot(g, x, y, i % 3 ? NQ.cloud : NQ.cream);
    }
  if (mode === 'snow')
    for (let i = 0; i < 14; i++) dot(g, 2 + ((i * 13 + seed) % 28), 2 + ((i * 5 + seed * 3) % 26), NQ.white);
}

/** y から 下を 地面に（top は いちばん上の 1 列の 色） */
export function ground(g: Grid, y: number, col: string, top?: string): void {
  box(g, 1, y, S - 2, S - 2, col);
  if (top) box(g, 1, y, S - 2, y, top);
}

/** y から 下を 海に（白い なみ） */
export function sea(g: Grid, y: number, col: string = NQ.azure, seed = 0): void {
  box(g, 1, y, S - 2, S - 2, col);
  box(g, 1, y, S - 2, y, NQ.sky);
  for (let i = 0; i < 6; i++) {
    const x = 2 + ((i * 9 + seed * 5) % 26);
    const yy = y + 2 + ((i * 5) % Math.max(1, S - 3 - y));
    dot(g, x, yy, NQ.ice);
    dot(g, x + 1, yy, NQ.ice);
  }
}

/** なだらかな 丘・遠い 山なみ（y は ふもと、h は 高さ） */
export function hills(g: Grid, y: number, h: number, col: string, seed = 0): void {
  for (let x = 1; x < S - 1; x++) {
    const top = y - h * (0.55 + 0.45 * Math.sin((x + seed * 5) / 4.2) * Math.cos((x + seed) / 7));
    for (let yy = Math.round(top); yy <= y; yy++) dot(g, x, yy, col);
  }
}

export function cloud(g: Grid, cx: number, cy: number, w = 6): void {
  oval(g, cx, cy, w / 2, 1.6, NQ.white);
  oval(g, cx - w / 4, cy - 1, w / 4, 1.4, NQ.white);
}

export function sun(g: Grid, cx: number, cy: number, r = 3, col: string = NQ.cream): void {
  oval(g, cx, cy, r, r, col);
}

export function moon(g: Grid, cx: number, cy: number, r = 3): void {
  oval(
    g,
    cx,
    cy,
    r,
    r,
    NQ.cream,
    undefined,
    (x, y) => (x + 0.5 - cx - 1.4) ** 2 + (y + 0.5 - cy + 1) ** 2 > r * r,
  );
}

/** 外周 1px の わく */
export function frame(g: Grid, col: string = NQ.ink): void {
  for (let i = 0; i < S; i++) {
    put(g, i, 0, col);
    put(g, i, S - 1, col);
    put(g, 0, i, col);
    put(g, S - 1, i, col);
  }
}

// ───────────────────────── よく 使う 小物 ─────────────────────────

/** 松・杉などの 木（cx, 根もと by、高さ h） */
export function tree(g: Grid, cx: number, by: number, h: number, col: string = NQ.green): void {
  seg(g, cx, by, cx, by - 2, NQ.brown);
  tri(g, cx - h / 2.6, by - 2, cx + h / 2.6, by - 2, cx, by - h, col);
}

/** まるい 木（広葉樹・さくら） */
export function roundTree(g: Grid, cx: number, by: number, r: number, col: string): void {
  seg(g, cx, by, cx, by - r, NQ.brown);
  oval(g, cx, by - r - r * 0.6, r, r * 0.9, col, sh(col));
}
