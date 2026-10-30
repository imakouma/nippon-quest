import { PREFECTURE_BORDER_TILE, ROAD_TILE } from '../../src/core/world/ground.js';

interface TerrainGrid {
  width: number;
  height: number;
  rows: readonly string[];
}

export interface PrefectureBorderGate {
  entryIndex: number;
  arrivalIndex: number;
}

interface BorderDefinition {
  name: string;
  type: string;
  at: [number, number];
  properties?: readonly { name: string; value: unknown }[];
}

const OUTSIDE_LAND_TILE = 1;
const OUTSIDE = new Set(['.', '~', 'x']);

function adjacent(index: number, width: number, length: number): number[] {
  const x = index % width;
  return [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, index - width, index + width].filter(
    (candidate) => candidate >= 0 && candidate < length,
  );
}

function completesTwoByTwo(index: number, walls: ReadonlySet<number>, width: number, height: number): boolean {
  const x = index % width;
  const y = Math.floor(index / width);
  for (const left of [x - 1, x]) {
    for (const top of [y - 1, y]) {
      if (left < 0 || left + 1 >= width || top < 0 || top + 1 >= height) continue;
      const topLeft = top * width + left;
      if ([topLeft, topLeft + 1, topLeft + width, topLeft + width + 1].every((cell) => cell === index || walls.has(cell)))
        return true;
    }
  }
  return false;
}

/**
 * 県外陸地 x のうち自県に接する一列を石垣にし、斜めの切れ目だけ草側の一マスでつなぐ。
 * 県境門の正面だけは道として開ける。
 * 深い県外陸地は草原のままなので、隣県も陸続きに見える。
 */
export function paintPrefectureBorders(
  terrain: TerrainGrid,
  background: number[],
  gates: readonly PrefectureBorderGate[],
): void {
  const cells = terrain.rows.join('');
  if (terrain.rows.length !== terrain.height || cells.length !== terrain.width * terrain.height)
    throw new Error('県境を描けません: 地形の大きさが不正です');
  if (background.length !== cells.length) throw new Error('県境を描けません: background の大きさが不正です');

  const openings = new Set<number>();
  for (const gate of gates) {
    const neighbors = adjacent(gate.entryIndex, terrain.width, cells.length);
    const oppositeArrival = gate.entryIndex * 2 - gate.arrivalIndex;
    const opening =
      (neighbors.includes(oppositeArrival) && cells[oppositeArrival] === 'x'
        ? oppositeArrival
        : neighbors.find((candidate) => cells[candidate] === 'x')) ?? -1;
    if (opening >= 0) openings.add(opening);
  }

  const boundaries = new Set<number>();
  for (let index = 0; index < cells.length; index++) {
    if (
      cells[index] === 'x' &&
      adjacent(index, terrain.width, cells.length).some((candidate) => !OUTSIDE.has(cells[candidate]!))
    )
      boundaries.add(index);
  }

  const connectorCandidates = new Set<number>();
  for (const index of boundaries) {
    const x = index % terrain.width;
    const y = Math.floor(index / terrain.width);
    for (const dx of [-1, 1]) {
      if (y + 1 >= terrain.height || x + dx < 0 || x + dx >= terrain.width) continue;
      const diagonal = index + terrain.width + dx;
      if (!boundaries.has(diagonal)) continue;
      const between = [index + dx, index + terrain.width].filter((candidate) => cells[candidate] === 'x');
      if (between.length === 1) connectorCandidates.add(between[0]!);
    }
  }
  const walls = new Set(boundaries);
  for (const connector of [...connectorCandidates].sort((a, b) => a - b)) {
    if (!completesTwoByTwo(connector, walls, terrain.width, terrain.height)) walls.add(connector);
  }

  for (let index = 0; index < cells.length; index++) {
    if (cells[index] !== 'x') continue;
    background[index] = openings.has(index)
      ? ROAD_TILE
      : walls.has(index)
        ? PREFECTURE_BORDER_TILE
        : OUTSIDE_LAND_TILE;
  }
}

/** 県間入口の定義から門の向きを求め、県境の背景を描く。 */
export function paintGeneratedPrefectureBorders(
  terrain: TerrainGrid,
  background: number[],
  definitions: readonly BorderDefinition[],
): void {
  paintPrefectureBorders(
    terrain,
    background,
    definitions.flatMap((entry) => {
      const property = (name: string) => entry.properties?.find((item) => item.name === name)?.value;
      if (entry.type !== 'interPrefectureLink' || property('infrastructure') !== 'landBorder') return [];
      const arrival = definitions.find((item) => item.name === `from_${String(property('linkId'))}`);
      if (!arrival) throw new Error(`${entry.name}: 県境の到着地点がありません`);
      const indexOf = ([x, y]: [number, number]) => y * terrain.width + x;
      return [{ entryIndex: indexOf(entry.at), arrivalIndex: indexOf(arrival.at) }];
    }),
  );
}
