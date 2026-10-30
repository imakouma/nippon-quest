export type TilePoint = [number, number];

interface ImmediateArrivalLand {
  w: number;
  cells: string;
  label: Int32Array;
  idx(position: TilePoint): number;
}

export function adjacentTileIndexes(
  land: Pick<ImmediateArrivalLand, 'w' | 'cells'>,
  index: number,
): number[] {
  const x = index % land.w;
  return [index + land.w, x < land.w - 1 ? index + 1 : -1, x > 0 ? index - 1 : -1, index - land.w].filter(
    (candidate) => candidate >= 0 && candidate < land.cells.length,
  );
}

export function hasImmediateArrivalTile(
  land: ImmediateArrivalLand,
  index: number,
  free: (x: number, y: number) => boolean,
  required?: number,
): boolean {
  const candidates = required === undefined ? adjacentTileIndexes(land, index) : [required];
  return candidates.some((candidate) => {
    if (candidate < 0 || candidate >= land.cells.length) return false;
    const x = candidate % land.w;
    const y = Math.floor(candidate / land.w);
    return land.label[candidate] === land.label[index] && free(x, y);
  });
}

export function findImmediateArrivalTile(
  land: ImmediateArrivalLand,
  at: TilePoint,
  preferred: readonly number[],
  free: (x: number, y: number) => boolean,
  exact = false,
): TilePoint | null {
  const entry = land.idx(at);
  const candidates = exact ? preferred : [...preferred, ...adjacentTileIndexes(land, entry)];
  for (const candidate of [...new Set(candidates)]) {
    if (candidate < 0 || candidate >= land.cells.length) continue;
    const x = candidate % land.w;
    const y = Math.floor(candidate / land.w);
    if (land.label[candidate] === land.label[entry] && free(x, y)) return [x, y];
  }
  return null;
}
