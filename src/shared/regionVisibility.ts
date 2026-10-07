/** 地図上で、まだ解放されていない名所エリアを表す描画専用タイル。 */
export const LOCKED_REGION_TILE = -1;

export const regionMapTile = (tile: number, hidden: boolean): number => (hidden ? LOCKED_REGION_TILE : tile);
