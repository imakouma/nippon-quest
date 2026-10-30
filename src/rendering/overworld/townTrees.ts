/** Visual positions only; indices refer to the unchanged decor array. */
export function townTrees(decor: readonly number[], width: number) {
  return decor.flatMap((tile, index) => {
    const texture = TOWN_TREE_TEXTURES[tile];
    if (!texture) return [];
    const x = (index % width) * 16 + 8;
    const row = Math.floor(index / width) * 16;
    return [{ index, x, y: row + 15, depth: row + 8, texture }];
  });
}
export const TOWN_TREE_TEXTURES: Readonly<Record<number, string>> = {
  32: 'town-tree-round',
  69: 'town-tree-pine',
  70: 'town-tree-snow-pine',
  71: 'town-tree-palm',
  72: 'town-tree-sakura',
  73: 'town-tree-bamboo',
};
