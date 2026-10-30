/** Visual positions only; indices refer to the unchanged decor array. */
export function townTrees(decor: readonly number[], width: number) {
  return decor.flatMap((tile, index) => {
    if (tile !== 32) return [];
    const x = (index % width) * 16 + 8;
    const row = Math.floor(index / width) * 16;
    return [{ index, x, y: row + 15, depth: row + 8, texture: 'town-tree-round' }];
  });
}
