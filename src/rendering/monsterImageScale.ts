/** 素材の解像度とは独立して、戦闘の表示枠と縦横比を維持する。 */
export function monsterImageScale(width: number, height: number, size: number, scale: number): number {
  return (size * scale) / Math.max(width, height);
}

export interface PixelBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 透明余白を除き、ニュートラル姿勢で見えている身体の矩形を返す。 */
export function visiblePixelBounds(
  width: number,
  height: number,
  alphaAt: (x: number, y: number) => number,
): PixelBounds {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1)
      if (alphaAt(x, y) > 0) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
  return right < left || bottom < top
    ? { x: 0, y: 0, width, height }
    : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

/** 設定身長を、透明余白ではなく身体そのものの高さへ対応させる。 */
export function monsterBodyImageScale(bounds: PixelBounds, targetBodyHeight: number): number {
  return targetBodyHeight / bounds.height;
}

/** 見えている身体の下中央を戦闘の足元へ固定する原点。 */
export function monsterBodyOrigin(
  bounds: PixelBounds,
  frameWidth: number,
  frameHeight: number,
): { x: number; y: number } {
  return {
    x: (bounds.x + bounds.width / 2) / frameWidth,
    y: (bounds.y + bounds.height) / frameHeight,
  };
}
