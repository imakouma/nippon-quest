import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TRANSPORT_LINKS } from '../../scripts/data/interPrefectureLinks';
import type { LonLat } from '../../scripts/data/geo';
import type { TerrainMap } from '../../scripts/gen-terrain';
import { orientLandBorderLinks } from '../../scripts/maps/landBorderDirections';
import type { LandBorderLink } from '../../scripts/terrain/prefectureBorders';
import { project } from '../../scripts/terrain/raster';

interface Property {
  name: string;
  value: unknown;
}

interface MapObject {
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: Property[];
}

interface TiledMap {
  width: number;
  height: number;
  layers: { name: string; data?: number[]; objects?: MapObject[] }[];
}

const ROOT = new URL('../../', import.meta.url);
const terrain = JSON.parse(readFileSync(new URL('scripts/data/terrain.json', ROOT), 'utf8')) as {
  maps: Record<string, TerrainMap>;
  interPrefectureBorders: LandBorderLink[];
};

const maps = new Map<string, TiledMap>(
  Object.keys(terrain.maps)
    .filter((key) => key.endsWith('-field'))
    .map((key) => [key, JSON.parse(readFileSync(new URL(`maps/${key}.json`, ROOT), 'utf8')) as TiledMap]),
);

const objects = (map: TiledMap): MapObject[] =>
  map.layers.find((layer) => layer.name === 'objects')?.objects ?? [];
const layer = (map: TiledMap, name: string): number[] =>
  map.layers.find((candidate) => candidate.name === name)?.data ?? [];
const property = (object: MapObject, name: string): unknown =>
  object.properties?.find((candidate) => candidate.name === name)?.value;
const tile = (map: TiledMap, object: MapObject): number =>
  Math.floor(object.y / 16) * map.width + Math.floor(object.x / 16);
const neighbors = (map: TiledMap, index: number): number[] => {
  const x = index % map.width;
  return [
    x > 0 ? index - 1 : -1,
    x < map.width - 1 ? index + 1 : -1,
    index - map.width,
    index + map.width,
  ].filter((candidate) => candidate >= 0 && candidate < map.width * map.height);
};
const projected = (map: TerrainMap, [lon, lat]: LonLat): [number, number] => {
  const panel =
    map.panels.find(({ bbox }) => lon >= bbox[0] && lon <= bbox[2] && lat >= bbox[1] && lat <= bbox[3]) ??
    map.panels.at(-1)!;
  return project(panel.proj, [lon, lat]);
};
const distance = (map: TiledMap, object: MapObject, target: [number, number]): number =>
  Math.hypot(Math.floor(object.x / 16) + 0.5 - target[0], Math.floor(object.y / 16) + 0.5 - target[1]);

const allLinks = [
  ...terrain.interPrefectureBorders.map((link) => ({ ...link, endpoints: null })),
  ...TRANSPORT_LINKS,
];

describe('全国の県境門と実在交通の生成物', () => {
  it('95リンクの両端に190個の入口と到着spawnがある', () => {
    const allObjects = [...maps.values()].flatMap(objects);
    expect(allLinks).toHaveLength(95);
    expect(allObjects.filter((object) => object.type === 'interPrefectureLink')).toHaveLength(190);
    expect(
      allObjects.filter((object) =>
        allLinks.some((link) => object.name === `from_${link.id}` && object.type === 'spawn'),
      ),
    ).toHaveLength(190);
  });

  it('全リンクが相互の県・マップ・spawnを正しく指す', () => {
    for (const link of allLinks) {
      link.areas.forEach((areaId, endpointIndex) => {
        const targetArea = link.areas[endpointIndex === 0 ? 1 : 0];
        const map = maps.get(`${areaId}-field`)!;
        const entry = objects(map).filter((object) => object.name === `interpref_${link.id}`);
        const spawn = objects(map).filter((object) => object.name === `from_${link.id}`);
        expect(entry, `${link.id}: ${areaId} の入口`).toHaveLength(1);
        expect(spawn, `${link.id}: ${areaId} の到着点`).toHaveLength(1);
        if (!entry[0] || !spawn[0]) return;
        expect(entry[0].type).toBe('interPrefectureLink');
        expect(property(entry[0], 'linkId')).toBe(link.id);
        expect(property(entry[0], 'targetArea')).toBe(targetArea);
        expect(property(entry[0], 'targetMap')).toBe(`${targetArea}-field`);
        expect(property(entry[0], 'targetSpawn')).toBe(`from_${link.id}`);
        expect(property(entry[0], 'firstTargetSpawn')).toBe('spawn');
        expect(property(entry[0], 'infrastructure')).toBe(link.infrastructure);
        expect(property(entry[0], 'travelMode')).toBe(link.travelMode);
      });
    }
  });

  it('入口と到着点が隣接する安全な別マスにあり、ほかの物体と重ならない', () => {
    for (const link of allLinks)
      for (const areaId of link.areas) {
        const map = maps.get(`${areaId}-field`)!;
        const list = objects(map);
        const entry = list.find((object) => object.name === `interpref_${link.id}`)!;
        const spawn = list.find((object) => object.name === `from_${link.id}`)!;
        const entryTile = tile(map, entry);
        const spawnTile = tile(map, spawn);
        expect(neighbors(map, entryTile), `${link.id}: ${areaId} の到着点`).toContain(spawnTile);
        expect(entryTile).not.toBe(spawnTile);
        expect(layer(map, 'collision')[entryTile]).toBe(0);
        expect(layer(map, 'collision')[spawnTile]).toBe(0);
        for (const [name, index] of [
          ['入口', entryTile],
          ['到着点', spawnTile],
        ] as const) {
          const overlaps = list.filter((object) => {
            const x0 = Math.floor(object.x / 16);
            const y0 = Math.floor(object.y / 16);
            const width = Math.max(1, Math.floor(object.width / 16));
            const height = Math.max(1, Math.floor(object.height / 16));
            const x = index % map.width;
            const y = Math.floor(index / map.width);
            return x >= x0 && x < x0 + width && y >= y0 && y < y0 + height;
          });
          expect(overlaps, `${link.id}: ${areaId} の${name}が重複`).toHaveLength(1);
        }
      }
  });

  it('陸上門は生成器が決めた正反対の向きに開き、その正面が県外陸になる', () => {
    const oriented = orientLandBorderLinks(terrain.interPrefectureBorders, terrain.maps);
    const mismatches = oriented.flatMap((link) =>
      link.areas.flatMap((areaId, endpointIndex) => {
        const map = maps.get(`${areaId}-field`)!;
        const raw = terrain.maps[`${areaId}-field`]!;
        const list = objects(map);
        const entry = list.find((object) => object.name === `interpref_${link.id}`)!;
        const spawn = list.find((object) => object.name === `from_${link.id}`)!;
        const actual = [
          Math.floor(entry.x / 16) - Math.floor(spawn.x / 16),
          Math.floor(entry.y / 16) - Math.floor(spawn.y / 16),
        ] as const;
        const expected =
          endpointIndex === 0
            ? link.outwardFromFirst
            : ([-link.outwardFromFirst[0], -link.outwardFromFirst[1]] as const);
        const entryX = Math.floor(entry.x / 16);
        const entryY = Math.floor(entry.y / 16);
        const outsideX = entryX + expected[0];
        const outsideY = entryY + expected[1];
        const outside = outsideY * raw.width + outsideX;
        return actual[0] === expected[0] &&
          actual[1] === expected[1] &&
          outsideX >= 0 &&
          outsideX < raw.width &&
          outsideY >= 0 &&
          outsideY < raw.height &&
          raw.rows.join('')[outside] === 'x'
          ? []
          : [`${link.id}: ${areaId} actual=${actual.join(',')} expected=${expected.join(',')}`];
      }),
    );

    expect(mismatches).toEqual([]);
  });

  it('陸上門は県外陸と接し、実在交通は指定された地理条件に置かれる', () => {
    for (const link of terrain.interPrefectureBorders)
      for (const areaId of link.areas) {
        const key = `${areaId}-field`;
        const map = maps.get(key)!;
        const entry = objects(map).find((object) => object.name === `interpref_${link.id}`)!;
        const index = tile(map, entry);
        const raw = terrain.maps[key]!;
        const cells = raw.rows.join('');
        const outside = neighbors(map, index).filter((candidate) => cells[candidate] === 'x');
        expect(cells[index], `${link.id}: ${areaId} の門`).not.toBe('x');
        expect(outside.length, `${link.id}: ${areaId} の県外陸`).toBeGreaterThan(0);
        expect(outside.every((candidate) => layer(map, 'collision')[candidate] === 3)).toBe(true);
        expect(
          distance(map, entry, projected(raw, link.anchor)),
          `${link.id}: ${areaId}`,
        ).toBeLessThanOrEqual(5);
      }

    for (const link of TRANSPORT_LINKS)
      link.endpoints.forEach((endpoint) => {
        const key = `${endpoint.areaId}-field`;
        const map = maps.get(key)!;
        const entry = objects(map).find((object) => object.name === `interpref_${link.id}`)!;
        const index = tile(map, entry);
        const raw = terrain.maps[key]!;
        expect(
          distance(map, entry, projected(raw, endpoint.at)),
          `${link.id}: ${endpoint.areaId}`,
        ).toBeLessThanOrEqual(5);
        if (endpoint.placement === 'coast')
          expect(neighbors(map, index).some((candidate) => raw.rows.join('')[candidate] === '.')).toBe(true);
        expect(property(entry, 'unlockRole')).toBe(link.unlockRole);
        expect(property(entry, 'labelKey')).toBe(link.labelKey);
        expect(property(entry, 'placeId')).toBe(endpoint.placeId);
        expect(property(entry, 'endpointNameKey')).toBe(endpoint.nameKey);
      });
  });

  it('町から各入口まで道タイルだけで到達できる', () => {
    for (const [key, map] of maps) {
      const goals = objects(map).filter((object) => object.type === 'interPrefectureLink');
      if (!goals.length) continue;
      const town = objects(map).find((object) => object.name === 'to_town')!;
      const background = layer(map, 'background');
      const start = tile(map, town);
      const seen = new Set([start]);
      const queue = [start];
      for (let head = 0; head < queue.length; head += 1)
        for (const next of neighbors(map, queue[head]!))
          if (!seen.has(next) && background[next] === 163) {
            seen.add(next);
            queue.push(next);
          }
      for (const goal of goals) expect(seen.has(tile(map, goal)), `${key}: ${goal.name} への道`).toBe(true);
    }
  });
});
