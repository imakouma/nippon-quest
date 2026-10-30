/** 地形記号から背景と衝突レイヤーを作る。 */
export const terrainLayers = (
  land: { cells: string },
  tileOf: (cell: string, index: number) => number,
  blocked: ReadonlySet<string>,
  blockTile: number,
) => ({
  bg: [...land.cells].map(tileOf),
  col: [...land.cells].map((cell) => (blocked.has(cell) ? blockTile : 0)),
});
