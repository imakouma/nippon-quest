/** 素材の解像度とは独立して、戦闘の表示枠と縦横比を維持する。 */
export function monsterImageScale(width: number, height: number, size: number, scale: number): number {
  return (size * scale) / Math.max(width, height);
}
