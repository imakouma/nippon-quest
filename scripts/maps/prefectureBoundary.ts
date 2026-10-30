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

function surrounding(index: number, width: number, length: number): number[] {
  const x = index % width;
  const y = Math.floor(index / width);
  const height = Math.ceil(length / width);
  const result: number[] = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const nextX = x + dx;
      const nextY = y + dy;
      if ((dx !== 0 || dy !== 0) && nextX >= 0 && nextX < width && nextY >= 0 && nextY < height)
        result.push(nextY * width + nextX);
    }
  return result;
}

/**
 * 県外陸地 x のうち自県に接する一列を隙間なく石垣にし、県境門の正面だけ道として開ける。
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

  const boundary = new Set<number>();
  for (let index = 0; index < cells.length; index++)
    if (
      cells[index] === 'x' &&
      surrounding(index, terrain.width, cells.length).some((candidate) => !OUTSIDE.has(cells[candidate]!))
    )
      boundary.add(index);
  const connectedBoundary = new Set(boundary);
  for (let index = 0; index < cells.length; index++)
    if (cells[index] === 'x' && adjacent(index, terrain.width, cells.length).filter((i) => boundary.has(i)).length >= 2)
      connectedBoundary.add(index);

  for (let index = 0; index < cells.length; index++) {
    if (cells[index] !== 'x') continue;
    background[index] = openings.has(index)
      ? ROAD_TILE
      : connectedBoundary.has(index)
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
