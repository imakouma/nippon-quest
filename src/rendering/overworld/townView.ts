/** Town-only display indices; -1 keeps the original background tile. */
export function townView(background: readonly number[], width: number, height: number): number[] {
  const stone = (tile: number | undefined) => tile === 5 || tile === 15;
  return background.map((tile, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
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
