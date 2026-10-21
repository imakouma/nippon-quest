import type { TerrainMap } from '../gen-terrain.js';
import { components, project } from '../terrain/raster.js';
import type { LandBorderLink } from '../terrain/prefectureBorders.js';

export type TileDirection = readonly [number, number];

export interface OrientedLandBorderLink extends LandBorderLink {
  outwardFromFirst: TileDirection;
}

const DIRECTIONS: readonly TileDirection[] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];
const MAX_ANCHOR_DISTANCE = 5;
const BLOCKED = new Set(['.', '~', 'x', 'W']);

const opposite = ([x, y]: TileDirection): TileDirection => [-x, -y];
const key = ([x, y]: TileDirection): string => `${x},${y}`;

function step(index: number, direction: TileDirection, width: number, length: number): number {
  const x = index % width;
  const nextX = x + direction[0];
  const next = index + direction[1] * width + direction[0];
  return nextX >= 0 && nextX < width && next >= 0 && next < length ? next : -1;
}

function nearestGateByDirection(map: TerrainMap, anchor: LandBorderLink['anchor']): Map<string, number> {
  const cells = map.rows.join('');
  const walkable = [...cells].map((cell) => !BLOCKED.has(cell));
  const { label, sizes } = components(walkable, map.width, map.height);
  const main = sizes.indexOf(Math.max(...sizes));
  const panel =
    map.panels.find(
      ({ bbox }) =>
        anchor[0] >= bbox[0] && anchor[0] <= bbox[2] && anchor[1] >= bbox[1] && anchor[1] <= bbox[3],
    ) ?? map.panels.at(-1)!;
  const target = project(panel.proj, anchor);
  const nearest = new Map<string, number>();

  for (let index = 0; index < cells.length; index += 1) {
    if (label[index] !== main) continue;
    const x = index % map.width;
    const y = Math.floor(index / map.width);
    const distance = (x + 0.5 - target[0]) ** 2 + (y + 0.5 - target[1]) ** 2;
    if (distance > MAX_ANCHOR_DISTANCE ** 2) continue;
    for (const direction of DIRECTIONS) {
      const outside = step(index, direction, map.width, cells.length);
      const inside = step(index, opposite(direction), map.width, cells.length);
      if (outside < 0 || inside < 0 || cells[outside] !== 'x' || label[inside] !== main) continue;
      const directionKey = key(direction);
      nearest.set(directionKey, Math.min(nearest.get(directionKey) ?? Infinity, distance));
    }
  }
  return nearest;
}

/** 両県のアンカー付近で、門と到着点を正反対に置ける最短の向きを決める。 */
export function orientLandBorderLinks(
  links: readonly LandBorderLink[],
  maps: Readonly<Record<string, TerrainMap>>,
): OrientedLandBorderLink[] {
  return links.map((link) => {
    const first = maps[`${link.areas[0]}-field`];
    const second = maps[`${link.areas[1]}-field`];
    if (!first || !second) throw new Error(`${link.id}: 両県の地形がありません`);
    const firstCandidates = nearestGateByDirection(first, link.anchor);
    const secondCandidates = nearestGateByDirection(second, link.anchor);
    const candidate = DIRECTIONS.map((direction, order) => ({
      direction,
      order,
      distance:
        (firstCandidates.get(key(direction)) ?? Infinity) +
        (secondCandidates.get(key(opposite(direction))) ?? Infinity),
    }))
      .filter(({ distance }) => Number.isFinite(distance))
      .sort((left, right) => left.distance - right.distance || left.order - right.order)[0];
    if (!candidate) throw new Error(`${link.id}: 両県で正反対に開ける県境門がありません`);
    return { ...link, outwardFromFirst: candidate.direction };
  });
}
