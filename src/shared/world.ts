export const DIRECTIONS = ['down', 'left', 'right', 'up'] as const;
export type Dir = (typeof DIRECTIONS)[number];

export interface TilePoint {
  readonly x: number;
  readonly y: number;
}
