/** 地図上で、まだ開放されていない名所エリアを表す描画専用タイル。海（3）とは区別する。 */
export const LOCKED_REGION_TILE = -1;

/** 未開放エリアは消さず、県の輪郭が分かる影として残す。 */
export const regionMapTile = (tile: number, hidden: boolean): number => (hidden ? LOCKED_REGION_TILE : tile);
