export const TOWN_ROOFS = [6, 16, 17, 18, 65, 66, 67, 68] as const;
export const TOWN_ROOF_START = 19;

/** Town-only display indices; -1 keeps the original background tile. */
export function townView(background: readonly number[], width: number, height: number): number[] {
  const stone = (tile: number | undefined) => tile === 5 || tile === 15;
  const groundCounts = [0, 0, 0];
  for (const tile of background) {
    if (tile === 1 || tile === 13 || tile === 14) groundCounts[0]!++;
    if (tile === 61 || tile === 62) groundCounts[1]!++;
    if (tile === 63 || tile === 64) groundCounts[2]!++;
  }
  const ground = groundCounts.indexOf(Math.max(...groundCounts));
  return background.map((tile, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    const roof = TOWN_ROOFS.findIndex((id) => id === tile);
    if (roof >= 0) {
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
      return (
        (adjacent(0, -1) ? 1 : 0) |
        (adjacent(1, 0) ? 2 : 0) |
        (adjacent(0, 1) ? 4 : 0) |
        (adjacent(-1, 0) ? 8 : 0)
      );
    }
    if (tile === 1 || tile === 13 || tile === 14) {
      return 16 + (((Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0) % 3);
    }
    return -1;
  });
}
