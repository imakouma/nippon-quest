/** 2Dバッグを描画するためのセル配置。 */
export type BagCell =
  | { kind: 'item'; key: string; x: number; y: number; w: number; h: number }
  | { kind: 'empty'; x: number; y: number };

export interface BagLayoutItem {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function bagCells(items: readonly BagLayoutItem[], cols: number, rows: number): BagCell[] {
  const covered = new Set<string>();
  for (const it of items)
    for (let y = it.y; y < it.y + it.h; y++)
      for (let x = it.x; x < it.x + it.w; x++) covered.add(`${x},${y}`);
  const cells: BagCell[] = items.map((it) => ({ kind: 'item', ...it }));
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) if (!covered.has(`${x},${y}`)) cells.push({ kind: 'empty', x, y });
  return cells;
}
