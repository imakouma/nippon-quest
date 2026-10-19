import { readFileSync } from 'node:fs';
import type { LonLat } from '../data/geo.js';
import { TRANSPORT_LINKS, type TransportLink } from '../data/interPrefectureLinks.js';
import type { TerrainMap } from '../gen-terrain.js';
import type { LandBorderLink } from '../terrain/prefectureBorders.js';
import { components, project } from '../terrain/raster.js';
import { interPrefectureObjectDefinitions } from './interPrefectureObjects.js';

type Point = [number, number];

interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: { name: string; type: string; value: unknown }[];
}

interface TiledLayer {
  name: string;
  type: string;
  data?: number[];
  objects?: TiledObject[];
}

export interface ExistingFieldMap {
  width: number;
  height: number;
  layers: TiledLayer[];
  nextobjectid: number;
  [key: string]: unknown;
}

const TILE_SIZE = 16;
const BLOCK_TILE = 3;
const ROAD_TILE = 163;
const SIGN_GAP = 3;

class ExistingMapLand {
  readonly w: number;
  readonly cells: string;
  readonly label: Int32Array;
  readonly largest: number;

  constructor(
    private readonly terrain: TerrainMap,
    collision: readonly number[],
  ) {
    this.w = terrain.width;
    this.cells = terrain.rows.join('');
    const walkable = [...this.cells].map(
      (cell, index) => collision[index] !== BLOCK_TILE && !['.', '~', 'x', 'W'].includes(cell),
    );
    const result = components(walkable, terrain.width, terrain.height);
    this.label = result.label;
    this.largest = result.sizes.indexOf(Math.max(...result.sizes));
  }

  walk = (index: number): boolean => this.label[index]! >= 0;
  idx = ([x, y]: Point): number => y * this.w + x;

  tile(position: LonLat): Point {
    const panel =
      this.terrain.panels.find(
        ({ bbox }) =>
          position[0] >= bbox[0] &&
          position[0] <= bbox[2] &&
          position[1] >= bbox[1] &&
          position[1] <= bbox[3],
      ) ?? this.terrain.panels[this.terrain.panels.length - 1]!;
    return project(panel.proj, position);
  }

  coastal(index: number): boolean {
    return this.adjacent(index).some((candidate) => this.cells[candidate] === '.');
  }

  adjacent(index: number): number[] {
    const x = index % this.w;
    return [index + this.w, x < this.w - 1 ? index + 1 : -1, x > 0 ? index - 1 : -1, index - this.w].filter(
      (candidate) => candidate >= 0 && candidate < this.cells.length,
    );
  }
}

class ExistingObjectPlacer {
  private readonly taken: { at: Point; labeled: boolean }[] = [];
  private readonly gates = new Set<number>();

  constructor(private readonly land: ExistingMapLand) {}

  reserve(at: Point, labeled: boolean, gate: boolean): void {
    this.taken.push({ at, labeled });
    if (gate && this.land.walk(this.land.idx(at))) this.gates.add(this.land.idx(at));
  }

  private free(x: number, y: number, labeled: boolean): boolean {
    return this.taken.every(({ at, labeled: other }) => {
      const dx = Math.abs(at[0] - x);
      const dy = Math.abs(at[1] - y);
      if (dx === 0 && dy === 0) return false;
      return !(labeled && other && Math.max(dx, dy) < SIGN_GAP);
    });
  }

  private keepsLandConnected(index: number): boolean {
    const open = (candidate: number) =>
      candidate !== index &&
      this.land.label[candidate] === this.land.label[index] &&
      !this.gates.has(candidate);
    const neighbors = this.land.adjacent(index).filter(open);
    if (neighbors.length <= 1) return true;
    const seen = new Set([neighbors[0]!]);
    const queue = [neighbors[0]!];
    for (let head = 0; head < queue.length; head++)
      for (const candidate of this.land.adjacent(queue[head]!))
        if (open(candidate) && !seen.has(candidate)) {
          seen.add(candidate);
          queue.push(candidate);
        }
    return neighbors.every((candidate) => seen.has(candidate));
  }

  gate(target: Point, allowed: (index: number) => boolean): Point {
    const candidates: [number, number][] = [];
    for (let index = 0; index < this.land.cells.length; index++) {
      if (!this.land.walk(index) || !allowed(index)) continue;
      const x = index % this.land.w;
      const y = Math.floor(index / this.land.w);
      if (!this.free(x, y, true)) continue;
      candidates.push([(x + 0.5 - target[0]) ** 2 + (y + 0.5 - target[1]) ** 2, index]);
    }
    candidates.sort((left, right) => left[0] - right[0] || left[1] - right[1]);
    const hit = candidates.find(([, index]) => this.keepsLandConnected(index));
    if (!hit) throw new Error('県間入口を置ける安全なマスがありません');
    const at: Point = [hit[1] % this.land.w, Math.floor(hit[1] / this.land.w)];
    this.reserve(at, true, true);
    return at;
  }

  hasImmediateArrival(index: number): boolean {
    return this.land.adjacent(index).some((candidate) => {
      const x = candidate % this.land.w;
      const y = Math.floor(candidate / this.land.w);
      return this.land.label[candidate] === this.land.label[index] && this.free(x, y, false);
    });
  }

  besideImmediate(at: Point, preferred: readonly number[] = []): Point {
    const entry = this.land.idx(at);
    for (const candidate of [...new Set([...preferred, ...this.land.adjacent(entry)])]) {
      const x = candidate % this.land.w;
      const y = Math.floor(candidate / this.land.w);
      if (this.land.label[candidate] !== this.land.label[entry] || !this.free(x, y, false)) continue;
      const arrival: Point = [x, y];
      this.reserve(arrival, false, false);
      return arrival;
    }
    throw new Error('県間入口の隣に到着地点を置けません');
  }
}

function reserveExistingObjects(place: ExistingObjectPlacer, objects: readonly TiledObject[]): void {
  for (const object of objects) {
    const x = Math.floor(object.x / TILE_SIZE);
    const y = Math.floor(object.y / TILE_SIZE);
    const width = Math.max(1, Math.ceil(object.width / TILE_SIZE));
    const height = Math.max(1, Math.ceil(object.height / TILE_SIZE));
    const labeled = !['spawn', 'regionGate', 'regionBoss', 'structure'].includes(object.type);
    const gate = object.type === 'transition' || object.type === 'midboss';
    for (let dy = 0; dy < height; dy++)
      for (let dx = 0; dx < width; dx++)
        place.reserve([x + dx, y + dy], labeled && dx === 0 && dy === 0, gate);
  }
}

function connectEntrancesToRoads(
  map: ExistingFieldMap,
  land: ExistingMapLand,
  existingObjects: readonly TiledObject[],
  generatedObjects: readonly TiledObject[],
): void {
  const background = map.layers.find((layer) => layer.name === 'background')?.data;
  const collision = map.layers.find((layer) => layer.name === 'collision')?.data;
  const town = existingObjects.find((object) => object.name === 'to_town');
  if (!background || !collision || !town) throw new Error('県間入口を道へつなぐ地面・町入口がありません');
  const indexOf = (object: TiledObject) =>
    Math.floor(object.y / TILE_SIZE) * map.width + Math.floor(object.x / TILE_SIZE);
  const neighbors = (index: number) => land.adjacent(index);
  const passThrough = new Set(['regionGate', 'transition']);
  const blockers = new Set(
    existingObjects
      .filter((object) => object.type !== 'spawn' && !passThrough.has(object.type))
      .flatMap((object) => {
        const x0 = Math.floor(object.x / TILE_SIZE);
        const y0 = Math.floor(object.y / TILE_SIZE);
        const width = Math.max(1, Math.ceil(object.width / TILE_SIZE));
        const height = Math.max(1, Math.ceil(object.height / TILE_SIZE));
        return Array.from(
          { length: width * height },
          (_, offset) => (y0 + Math.floor(offset / width)) * map.width + x0 + (offset % width),
        );
      }),
  );
  const open = (index: number) =>
    index >= 0 && index < background.length && collision[index] !== BLOCK_TILE && !blockers.has(index);
  const townIndex = indexOf(town);
  const road = new Set([townIndex]);
  const connected = [townIndex];
  for (let head = 0; head < connected.length; head++)
    for (const next of neighbors(connected[head]!))
      if (!road.has(next) && background[next] === ROAD_TILE) {
        road.add(next);
        connected.push(next);
      }

  const added = new Set<number>();
  for (const entrance of generatedObjects.filter((object) => object.type === 'interPrefectureLink')) {
    const goal = indexOf(entrance);
    if (road.has(goal)) continue;
    const previous = new Int32Array(background.length).fill(-2);
    const queue = [...road];
    for (const index of queue) previous[index] = -1;
    let hit = -1;
    for (let head = 0; head < queue.length && hit < 0; head++)
      for (const next of neighbors(queue[head]!)) {
        if (previous[next] !== -2 || (!open(next) && next !== goal)) continue;
        previous[next] = queue[head]!;
        if (next === goal) {
          hit = next;
          break;
        }
        queue.push(next);
      }
    if (hit < 0) throw new Error(`${entrance.name}: 町から入口まで道をつなげません`);
    for (let index = hit; index >= 0 && !road.has(index); index = previous[index]!) {
      road.add(index);
      added.add(index);
    }
  }
  const widened = new Set(added);
  for (const index of added) {
    const x = index % map.width;
    const side = [
      x < map.width - 1 ? index + 1 : -1,
      index + map.width,
      x > 0 ? index - 1 : -1,
      index - map.width,
    ].find(open);
    if (side !== undefined) widened.add(side);
  }
  for (const index of widened) background[index] = ROAD_TILE;
}

/** 既存フィールドの地形・地域・物体を保ち、県間入口だけを正規カタログから同期する。 */
export function syncInterPrefectureMap(input: {
  prefId: string;
  map: ExistingFieldMap;
  terrain: TerrainMap;
  borders: readonly LandBorderLink[];
  transports: readonly TransportLink[];
}): ExistingFieldMap {
  const map = structuredClone(input.map);
  const collision = map.layers.find((layer) => layer.name === 'collision')?.data;
  const objectLayer = map.layers.find((layer) => layer.type === 'objectgroup');
  if (!collision || !objectLayer?.objects)
    throw new Error(`${input.prefId}-field: collision/objects がありません`);
  const linkIds = new Set(
    [...input.borders, ...input.transports]
      .filter(
        (link) =>
          link.areas.includes(input.prefId) ||
          ('endpoints' in link && link.endpoints.some((endpoint) => endpoint.areaId === input.prefId)),
      )
      .map((link) => link.id),
  );
  const objects = objectLayer.objects.filter(
    (object) =>
      object.type !== 'interPrefectureLink' &&
      !(object.type === 'spawn' && linkIds.has(object.name.slice(5))),
  );
  const land = new ExistingMapLand(input.terrain, collision);
  const place = new ExistingObjectPlacer(land);
  reserveExistingObjects(place, objects);
  const definitions = interPrefectureObjectDefinitions({
    prefId: input.prefId,
    land,
    place,
    inMain: (index) => land.label[index] === land.largest,
    borders: input.borders,
    transports: input.transports,
  });
  let nextId = Math.max(0, ...objects.map((object) => object.id)) + 1;
  const generated: TiledObject[] = definitions.map((definition) => ({
    id: nextId++,
    name: definition.name,
    type: definition.type,
    x: definition.at[0] * TILE_SIZE,
    y: definition.at[1] * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
    ...(definition.properties ? { properties: definition.properties } : {}),
  }));
  connectEntrancesToRoads(map, land, objects, generated);
  objectLayer.objects = [...objects, ...generated];
  map.nextobjectid = nextId;
  return map;
}

/** CLI用: 既存JSONを読み、正規交通カタログを使って県間入口だけを同期する。 */
export function syncInterPrefectureMapFile(
  prefId: string,
  filePath: string,
  terrain: TerrainMap,
  borders: readonly LandBorderLink[],
): ExistingFieldMap {
  return syncInterPrefectureMap({
    prefId,
    map: JSON.parse(readFileSync(filePath, 'utf8')) as ExistingFieldMap,
    terrain,
    borders,
    transports: TRANSPORT_LINKS,
  });
}
