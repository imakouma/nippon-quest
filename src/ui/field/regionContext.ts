import { NQ } from '../../rendering/palette';
import { areaAt, type RegionGrid } from './WorldMapOverlay';

/** 現在県以外を暗いシルエットと県境で描き、県同士の位置関係を残す。 */
export function drawRegionContext(
  canvas: HTMLCanvasElement,
  region: RegionGrid & { here: number },
  cell: number,
): void {
  canvas.width = region.width * cell;
  canvas.height = region.height * cell;
  const ctx = canvas.getContext('2d')!;
  for (let y = 0; y < region.height; y++)
    for (let x = 0; x < region.width; x++) {
      const area = areaAt(region, x, y);
      // 現在県は上に重ねる詳細地図へ任せる。ここでも描くと、解像度差で海岸から
      // 暗いシルエットがはみ出し、県の端が黒く欠けて見える。
      if (area < 0 || area === region.here) continue;
      const left = x * cell;
      const top = y * cell;
      ctx.fillStyle = NQ.night;
      ctx.fillRect(left, top, cell, cell);
      ctx.fillStyle = NQ.slate;
      if (areaAt(region, x - 1, y) !== area) ctx.fillRect(left, top, 1, cell);
      if (areaAt(region, x + 1, y) !== area) ctx.fillRect(left + cell - 1, top, 1, cell);
      if (areaAt(region, x, y - 1) !== area) ctx.fillRect(left, top, cell, 1);
      if (areaAt(region, x, y + 1) !== area) ctx.fillRect(left, top + cell - 1, cell, 1);
    }
}
