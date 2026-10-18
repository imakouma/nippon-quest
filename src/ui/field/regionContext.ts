import { NQ } from '../../rendering/palette';
import { areaAt, type RegionGrid } from './worldMapModel';

/** 周辺県を暗く、現在県を陸色の下地で描き、県同士の位置関係を切れ目なく残す。 */
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
      const left = x * cell;
      const top = y * cell;
      if (area === region.here) {
        // 解像度の違う詳細地図を重ねても、輪郭誤差が青い海として露出しない下地。
        // 地方図で海になっているマスは area < 0 のため、実際の海岸線は透明のまま残る。
        ctx.fillStyle = NQ.leaf;
        ctx.fillRect(left, top, cell, cell);
        continue;
      }
      if (area < 0) continue;
      ctx.fillStyle = NQ.night;
      ctx.fillRect(left, top, cell, cell);
      ctx.fillStyle = NQ.slate;
      if (areaAt(region, x - 1, y) !== area) ctx.fillRect(left, top, 1, cell);
      if (areaAt(region, x + 1, y) !== area) ctx.fillRect(left + cell - 1, top, 1, cell);
      if (areaAt(region, x, y - 1) !== area) ctx.fillRect(left, top, cell, 1);
      if (areaAt(region, x, y + 1) !== area) ctx.fillRect(left, top + cell - 1, cell, 1);
    }
}
