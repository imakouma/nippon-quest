import { CITY_ROAD_TILES } from '../../shared/cityRoadTiles';

export const TOWN_ROOFS = [6, 16, 17, 18, 65, 66, 67, 68] as const;
export const TOWN_ROOF_START = 19;
export const TOWN_GROUND_COUNT = 6;
export const TOWN_SHOP_START = TOWN_ROOF_START + TOWN_GROUND_COUNT * TOWN_ROOFS.length * 16;
export const TOWN_FARM_TILE = TOWN_SHOP_START + 16;

/** Town-only display indices; -1 keeps the original background tile. */
export function townView(
  background: readonly number[],
  width: number,
  height: number,
  decor?: readonly number[],
): number[] {
  const stone = (tile: number | undefined) => tile === 5 || tile === 15;
  const groundType = (tile: number | undefined) => {
    if (tile === 1 || tile === 13 || tile === 14) return 0;
    if (tile === 61 || tile === 62) return 1;
    if (tile === 63 || tile === 64) return 2;
    if (tile === 5 || tile === 15 || tile === 168 || tile === 169) return 3;
    if (tile === 166 || tile === 167) return 4;
    if (
      tile === CITY_ROAD_TILES.road ||
      tile === CITY_ROAD_TILES.lineV ||
      tile === CITY_ROAD_TILES.lineH ||
      tile === 164 ||
      tile === 165
    )
      return 5;
    return -1;
  };
  return background.map((tile, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    const roof = TOWN_ROOFS.findIndex((id) => id === tile);
    if (roof >= 0) {
      let ground = 0;
      search: for (let distance = 1; distance < width + height; distance++) {
        for (let dy = -distance; dy <= distance; dy++) {
          for (const dx of [-1, 1].map((sign) => sign * (distance - Math.abs(dy)))) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const candidate = groundType(background[ny * width + nx]);
            if (candidate >= 0) {
              ground = candidate;
              break search;
            }
          }
        }
      }
      const same = (dx: number, dy: number) => {
        const nx = x + dx;
        const ny = y + dy;
        return nx >= 0 && ny >= 0 && nx < width && ny < height && background[ny * width + nx] === tile;
      };
      const mask =
        (same(0, -1) ? 1 : 0) | (same(1, 0) ? 2 : 0) | (same(0, 1) ? 4 : 0) | (same(-1, 0) ? 8 : 0);
      return TOWN_ROOF_START + (ground * TOWN_ROOFS.length + roof) * 16 + mask;
    }
    if (stone(tile)) {
      const adjacent = (dx: number, dy: number) => {
        const nx = x + dx;
        const ny = y + dy;
        return nx < 0 || ny < 0 || nx >= width || ny >= height || stone(background[ny * width + nx]);
      };
      const mask =
        (adjacent(0, -1) ? 1 : 0) |
        (adjacent(1, 0) ? 2 : 0) |
        (adjacent(0, 1) ? 4 : 0) |
        (adjacent(-1, 0) ? 8 : 0);
      return y > 0 && background[index - width] === 21 ? TOWN_SHOP_START + mask : mask;
    }
    if (tile === 1 || tile === 13 || tile === 14) {
      if ([31, 74, 75, 76, 77].includes(decor?.[index] ?? -1)) return TOWN_FARM_TILE;
      return 16 + (((Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0) % 3);
    }
    return -1;
  });
}
