/**
 * ドット絵をマス目（Grid）で組み立てる小道具。1 マス = 1 ドット、null = 透明。
 * 仮素材（プロシージャル生成）はすべてここを通して Canvas にする（にじまない・パレット外の色を作らない）。
 */
export type Grid = (string | null)[][];

export const makeGrid = (w: number, h: number): Grid =>
  Array.from({ length: h }, () => Array<string | null>(w).fill(null));

export function put(g: Grid, x: number, y: number, col: string): void {
  const row = g[y];
  if (row && x >= 0 && x < row.length) row[x] = col;
}

/** 左右対称に置く */
export function putSym(g: Grid, x: number, y: number, col: string): void {
  const w = g[0]!.length;
  put(g, x, y, col);
  put(g, w - 1 - x, y, col);
}

/** 塗ったマスの外側（上下左右）を輪郭色で 1 ドット囲む */
export function outline(g: Grid, ink: string): void {
  const h = g.length;
  const w = g[0]!.length;
  const filled = g.map((r) => r.map((c) => c !== null));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (filled[y]![x]) continue;
      const n = filled[y - 1]?.[x] || filled[y + 1]?.[x] || filled[y]![x - 1] || filled[y]![x + 1];
      if (n) g[y]![x] = ink;
    }
}

/**
 * 文字の地図で塗る。'.' は透明、それ以外は colors の色（無い文字は無視）。
 * 例: paint(g, ['.CC.', 'CHHC'], { C: '#f00', H: '#000' }, 1, 1)
 */
export function paint(
  g: Grid,
  rows: readonly string[],
  colors: Readonly<Record<string, string | undefined>>,
  ox = 0,
  oy = 0,
): void {
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const col = ch === '.' ? undefined : colors[ch];
      if (col) put(g, ox + x, oy + y, col);
    }),
  );
}

/** 文字の地図を左右反転する（左向き → 右向き） */
export const mirrorRows = (rows: readonly string[]): string[] => rows.map((r) => [...r].reverse().join(''));

export function toCanvas(g: Grid): HTMLCanvasElement {
  const h = g.length;
  const w = g[0]?.length ?? 0;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const col = g[y]![x];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
  return c;
}

/** 同じ大きさのコマを cols 列で並べて 1 枚のスプライトシートにする */
export function sheetCanvas(frames: Grid[], cols: number): HTMLCanvasElement {
  const fw = frames[0]![0]!.length;
  const fh = frames[0]!.length;
  const rows = Math.ceil(frames.length / cols);
  const c = document.createElement('canvas');
  c.width = fw * cols;
  c.height = fh * rows;
  const ctx = c.getContext('2d')!;
  frames.forEach((f, i) => ctx.drawImage(toCanvas(f), (i % cols) * fw, Math.floor(i / cols) * fh));
  return c;
}
