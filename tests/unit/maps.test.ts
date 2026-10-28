import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EVENT_SPOTS, LANDMARK_SPOTS, type LonLat } from '../../scripts/data/geo';
import { TOWN_THEMES } from '../../scripts/data/towns';
import { project, type Proj } from '../../scripts/terrain/raster';

/**
 * scaffold:maps が作ったマップが「遊べる」ことを機械的に確かめる。
 *  - maps/ を唯一のマップソースとして検証する
 *  - 遷移先のマップとスポーン地点が存在する
 *  - スタート地点から、そのマップの物体すべてに歩いて（または同じマップの中の船で）行ける
 *  - content の events が使う物体が、マップにちゃんと置かれている
 *  - にほんちず（public/worldmap.json）が world の島・県と、県のフィールドの ★ 看板に合っている
 */
interface Obj {
  name: string;
  type: string;
  x: number;
  y: number;
  properties?: { name: string; value: unknown }[];
}

interface TiledMap {
  width: number;
  height: number;
  layers: { name: string; data?: number[]; objects?: Obj[] }[];
  properties?: { name: string; value: unknown }[];
}

interface RegionGrid {
  ids: string[];
  rows: string[];
}

interface RegionArea {
  id: string;
  regions: { id: string; motifs: string[]; start?: boolean; boss?: unknown }[];
  regionGates: { between: [string, string]; openedBy: string }[];
  events?: { motifId?: string; trigger?: { map: string; objectName: string } }[];
}

interface TerrainMap {
  width: number;
  height: number;
  rows: string[];
  panels: { bbox: [number, number, number, number]; proj: Proj }[];
}

const MAPS = new URL('../../maps/', import.meta.url);
const PREFECTURES = new URL('../../content/prefectures/', import.meta.url);
const WORLD_MAP = new URL('../../public/worldmap.json', import.meta.url);
const WORLD = new URL('../../content/world/japan.json', import.meta.url);
const ITEMS = new URL('../../content/items/', import.meta.url);
const PREFECTURE_BORDER_TILE = 301;
const ROAD_TILE = 163;
const TERRAIN = JSON.parse(
  readFileSync(new URL('../../scripts/data/terrain.json', import.meta.url), 'utf8'),
) as { maps: Record<string, TerrainMap> };

const jsonFiles = (dir: URL) => readdirSync(dir).filter((f) => f.endsWith('.json'));
const maps = new Map<string, TiledMap>(
  jsonFiles(MAPS).map((f) => [
    f.slice(0, -5),
    JSON.parse(readFileSync(new URL(f, MAPS), 'utf8')) as TiledMap,
  ]),
);

const objectsOf = (m: TiledMap) => m.layers.find((l) => l.name === 'objects')?.objects ?? [];
const prop = (o: Obj, name: string) => o.properties?.find((p) => p.name === name)?.value;
const tileIndex = (m: TiledMap, o: Obj) => Math.floor(o.y / 16) * m.width + Math.floor(o.x / 16);

const neighbors = (m: TiledMap, i: number): number[] => {
  const x = i % m.width;
  return [x > 0 ? i - 1 : -1, x < m.width - 1 ? i + 1 : -1, i - m.width, i + m.width].filter(
    (j) => j >= 0 && j < m.width * m.height,
  );
};

/** 'spawn' から4方向に歩いて届くマス。遷移のマスには乗れるが、その先へは歩けない（乗った瞬間に移動するため） */
function reachable(key: string, m: TiledMap, extraBlocked: ReadonlySet<number> = new Set()): Set<number> {
  const col = m.layers.find((l) => l.name === 'collision')?.data ?? [];
  const objs = objectsOf(m);
  const transitions = new Map(objs.filter((o) => o.type === 'transition').map((o) => [tileIndex(m, o), o]));
  const spawnTile = (name: string) => {
    const s = objs.find((o) => o.type === 'spawn' && o.name === name);
    return s ? tileIndex(m, s) : undefined;
  };
  const start = spawnTile('spawn');
  if (start === undefined) return new Set();
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const i = queue.shift()!;
    const warp = transitions.get(i);
    if (warp) {
      // 同じマップの中の船は、着いた先から続けて歩ける
      const to = prop(warp, 'targetMap') === key ? spawnTile(String(prop(warp, 'targetSpawn'))) : undefined;
      if (to !== undefined && !seen.has(to)) {
        seen.add(to);
        queue.push(to);
      }
      continue;
    }
    for (const j of neighbors(m, i)) {
      if (seen.has(j) || col[j] === 3 || extraBlocked.has(j)) continue;
      seen.add(j);
      queue.push(j);
    }
  }
  return seen;
}

function regionGridOf(m: TiledMap): RegionGrid | null {
  const raw = m.properties?.find((property) => property.name === 'regions')?.value;
  if (typeof raw !== 'string') return null;
  try {
    const grid = JSON.parse(raw) as Partial<RegionGrid>;
    return Array.isArray(grid.ids) && Array.isArray(grid.rows)
      ? { ids: grid.ids as string[], rows: grid.rows as string[] }
      : null;
  } catch {
    return null;
  }
}

function regionAt(m: TiledMap, grid: RegionGrid, i: number): string | null {
  const cell = grid.rows[Math.floor(i / m.width)]?.[i % m.width];
  return cell && cell !== '.' ? (grid.ids[cell.charCodeAt(0) - 97] ?? null) : null;
}

function projectedTile(terrain: TerrainMap, [lon, lat]: LonLat): [number, number] {
  const panel =
    terrain.panels.find(({ bbox }) => lon >= bbox[0] && lon <= bbox[2] && lat >= bbox[1] && lat <= bbox[3]) ??
    terrain.panels.at(-1)!;
  return project(panel.proj, [lon, lat]);
}

describe('マップ', () => {
  it.each([...maps.keys()])('%s: 遷移先があり、すべての物体に歩いて行ける', (key) => {
    const m = maps.get(key)!;
    const objs = objectsOf(m);
    expect(objs.some((o) => o.type === 'spawn' && o.name === 'spawn')).toBe(true);
    for (const o of objs.filter((o) => o.type === 'transition')) {
      const target = maps.get(String(prop(o, 'targetMap')));
      expect(target, `${o.name} の行き先`).toBeDefined();
      const spawn = String(prop(o, 'targetSpawn'));
      expect(
        objectsOf(target!).some((t) => t.name === spawn),
        `${o.name} → ${String(prop(o, 'targetMap'))} の ${spawn}`,
      ).toBe(true);
    }
    const seen = reachable(key, m);
    for (const o of objs) {
      // 建物（名所エリアの むら）は 通れない。となりまで 行ければ よい
      if (o.type === 'structure') {
        const i = tileIndex(m, o);
        const near = [i - 1, i + 1, i - m.width, i + m.width * 3, i + m.width * 2];
        expect(
          near.some((j) => seen.has(j)) ||
            [...seen].some(
              (j) =>
                Math.abs((j % m.width) - (i % m.width)) <= 4 &&
                Math.abs(Math.floor(j / m.width) - Math.floor(i / m.width)) <= 4,
            ),
          `${key} の ${o.name} の そばに 行けない`,
        ).toBe(true);
        continue;
      }
      expect(seen.has(tileIndex(m, o)), `${key} の ${o.name} に行けない`).toBe(true);
    }
  });

  it('県外の陸地は陸として描き、門だけを開けた県境を見えるように塞ぐ', () => {
    let neighboringLandTiles = 0;
    let visibleBorderTiles = 0;
    let gateOpenings = 0;
    const renderingErrors: string[] = [];
    const collisionErrors: string[] = [];
    for (const [key, terrain] of Object.entries(TERRAIN.maps)) {
      const map = maps.get(key);
      if (!map) continue;
      const landLinks = objectsOf(map).filter(
        (object) => object.type === 'interPrefectureLink' && prop(object, 'infrastructure') === 'landBorder',
      );
      if (landLinks.length === 0) continue;
      const background = map.layers.find((layer) => layer.name === 'background')?.data ?? [];
      const collision = map.layers.find((layer) => layer.name === 'collision')?.data ?? [];
      const cells = terrain.rows.join('');
      const openings = new Set(
        landLinks.flatMap((object) => {
          const entry = tileIndex(map, object);
          const arrival = objectsOf(map).find(
            (candidate) =>
              candidate.type === 'spawn' && candidate.name === `from_${String(prop(object, 'linkId'))}`,
          );
          const opening = arrival ? entry * 2 - tileIndex(map, arrival) : -1;
          return neighbors(map, entry).includes(opening) && cells[opening] === 'x' ? [opening] : [];
        }),
      );
      expect(terrain.rows, `${key}: 地形の高さ`).toHaveLength(terrain.height);
      for (const [y, row] of terrain.rows.entries()) {
        expect(row, `${key}: 地形 ${y} 行目の幅`).toHaveLength(terrain.width);
        for (const [x, cell] of [...row].entries()) {
          const index = y * terrain.width + x;
          if (cell === 'x') {
            neighboringLandTiles++;
            const boundary = neighbors(map, index).some(
              (candidate) => !['.', '~', 'x'].includes(cells[candidate]!),
            );
            const expected = openings.has(index) ? ROAD_TILE : boundary ? PREFECTURE_BORDER_TILE : 1;
            if (openings.has(index)) gateOpenings++;
            else if (boundary) visibleBorderTiles++;
            if (background[index] !== expected)
              renderingErrors.push(
                `${key}: 県外の陸 (${x}, ${y}) = ${background[index]}, expected ${expected}`,
              );
            if (collision[index] !== 3) collisionErrors.push(`${key}: 県境 (${x}, ${y})`);
          }
        }
      }
    }
    expect(renderingErrors).toEqual([]);
    expect(collisionErrors).toEqual([]);
    expect(neighboringLandTiles).toBeGreaterThan(0);
    expect(visibleBorderTiles).toBeGreaterThan(0);
    expect(gateOpenings).toBeGreaterThan(0);
  });

  it('県のフィールドには中ボスの場所が 1 つ、名所の看板（フィールド・離島）は その県の motifs を指している', () => {
    for (const f of jsonFiles(PREFECTURES)) {
      const area = JSON.parse(readFileSync(new URL(f, PREFECTURES), 'utf8')) as {
        id: string;
        motifs?: { id: string }[];
      };
      const m = maps.get(`${area.id}-field`);
      expect(m, area.id).toBeDefined();
      expect(
        objectsOf(m!).filter((o) => o.type === 'midboss'),
        area.id,
      ).toHaveLength(1);
      for (const key of [`${area.id}-field`, `${area.id}-enclave`])
        for (const o of objectsOf(maps.get(key) ?? { width: 0, height: 0, layers: [] }).filter(
          (x) => x.type === 'landmark' || x.type === 'specialty',
        ))
          expect(
            area.motifs?.some((x) => x.id === prop(o, 'motifId')),
            `${key} の ${o.name}`,
          ).toBe(true);
    }
  });

  it('ゲーム開始地点の近くにボスを置かない', () => {
    const aomori = maps.get('aomori-field')!;
    const objects = objectsOf(aomori);
    const spawn = objects.find((o) => o.type === 'spawn' && o.name === 'spawn')!;
    const sx = Math.floor(spawn.x / 16);
    const sy = Math.floor(spawn.y / 16);
    for (const boss of objects.filter((o) => o.type === 'midboss' || o.type === 'regionBoss')) {
      const distance = Math.abs(Math.floor(boss.x / 16) - sx) + Math.abs(Math.floor(boss.y / 16) - sy);
      expect(distance, `${boss.name} が開始地点に近すぎる`).toBeGreaterThanOrEqual(16);
    }
  });

  it('裏ステージ（secret）の ある 県は、フィールドに 入口が あり、<県>-secret の おくに ラスボスが いる', () => {
    for (const f of jsonFiles(PREFECTURES)) {
      const area = JSON.parse(readFileSync(new URL(f, PREFECTURES), 'utf8')) as {
        id: string;
        secret?: { boss: string };
      };
      if (!area.secret) continue;
      expect(
        objectsOf(maps.get(`${area.id}-field`)!).some((o) => o.name === 'to_secret'),
        `${area.id}-field の 入口`,
      ).toBe(true);
      const secret = maps.get(`${area.id}-secret`);
      expect(secret, `${area.id}-secret`).toBeDefined();
      expect(
        objectsOf(secret!)
          .filter((o) => o.type === 'lastboss')
          .map((o) => o.name),
        area.id,
      ).toEqual([`lastboss_${area.id}`]);
    }
  });

  it('content の events が使う物体がマップに置かれている', () => {
    for (const f of jsonFiles(PREFECTURES)) {
      const area = JSON.parse(readFileSync(new URL(f, PREFECTURES), 'utf8')) as {
        events?: { trigger?: { map: string; objectName: string } }[];
      };
      for (const { trigger } of area.events ?? []) {
        if (!trigger) continue;
        const m = maps.get(trigger.map);
        expect(m, trigger.map).toBeDefined();
        expect(
          objectsOf(m!).some((o) => o.name === trigger.objectName),
          `${trigger.map} の ${trigger.objectName}`,
        ).toBe(true);
      }
    }
  });
});

describe('全国の地域進行マップ', () => {
  const world = JSON.parse(readFileSync(WORLD, 'utf8')) as { islands: { id: string; areas: string[] }[] };
  const areaIds = world.islands.flatMap((island) => island.areas);

  it.each(areaIds)('%s: 地域・関所・地域ボスが実データどおり配置され、順番に全地域へ行ける', (id) => {
    const area = JSON.parse(readFileSync(new URL(`${id}.json`, PREFECTURES), 'utf8')) as RegionArea;
    const map = maps.get(`${id}-field`)!;
    const grid = regionGridOf(map);
    expect(map, `${id}-field`).toBeDefined();
    expect(grid, `${id}: regions プロパティ`).not.toBeNull();
    if (!map || !grid) return;

    const regionIds = area.regions.map((region) => region.id);
    expect(grid.ids, `${id}: regions.ids`).toEqual(regionIds);
    expect(new Set(grid.ids).size, `${id}: regions.ids の重複`).toBe(grid.ids.length);
    expect(grid.rows, `${id}: regions.rows の高さ`).toHaveLength(map.height);
    for (const [y, row] of grid.rows.entries()) {
      expect(row, `${id}: regions.rows[${y}] の幅`).toHaveLength(map.width);
      for (const cell of row) {
        const index = cell.charCodeAt(0) - 97;
        expect(cell === '.' || (index >= 0 && index < grid.ids.length), `${id}: regions の文字 ${cell}`).toBe(
          true,
        );
      }
    }
    if (id !== 'aomori')
      for (const regionId of regionIds) {
        const collision = map.layers.find((layer) => layer.name === 'collision')?.data ?? [];
        const cells = new Set<number>();
        for (let i = 0; i < map.width * map.height; i++)
          if (regionAt(map, grid, i) === regionId && collision[i] !== 3) cells.add(i);
        expect(cells.size, `${id}: ${regionId} の歩けるマス`).toBeGreaterThan(0);
        const first = cells.values().next().value as number;
        const connected = new Set([first]);
        const queue = [first];
        for (let head = 0; head < queue.length; head++)
          for (const next of neighbors(map, queue[head]!))
            if (cells.has(next) && !connected.has(next)) {
              connected.add(next);
              queue.push(next);
            }
        expect(connected.size, `${id}: ${regionId} の歩けるマスは4近傍で1連結`).toBe(cells.size);
      }

    const startRegions = area.regions.filter((region) => region.start);
    expect(startRegions, `${id}: start 地域`).toHaveLength(1);
    const toDungeon = objectsOf(map).find((object) => object.name === 'to_dungeon');
    expect(toDungeon, `${id}: to_dungeon`).toBeDefined();
    if (id !== 'aomori')
      expect(prop(toDungeon!, 'lock'), `${id}: 全地域ボス撃破前のダンジョン封鎖`).toBe('regionBosses');
    for (const name of ['spawn', 'to_town', 'from_town']) {
      const object = objectsOf(map).find((candidate) => candidate.name === name);
      expect(object, `${id}: ${name}`).toBeDefined();
      expect(regionAt(map, grid, tileIndex(map, object!)), `${id}: ${name} の地域`).toBe(startRegions[0]?.id);
    }

    const bosses = objectsOf(map).filter((object) => object.type === 'regionBoss');
    expect(bosses.map((boss) => String(prop(boss, 'region'))).sort(), `${id}: regionBoss`).toEqual(
      area.regions
        .filter((region) => region.boss)
        .map((region) => region.id)
        .sort(),
    );
    for (const boss of bosses) {
      const regionId = String(prop(boss, 'region'));
      expect(regionAt(map, grid, tileIndex(map, boss)), `${id}: ${boss.name} の地域`).toBe(regionId);
    }

    if (id !== 'aomori') {
      const regionByMotif = new Map(
        area.regions.flatMap((region) => region.motifs.map((motifId) => [motifId, region.id] as const)),
      );
      for (const object of objectsOf(map).filter(
        (candidate) => candidate.type === 'landmark' || candidate.type === 'specialty',
      )) {
        const motifId = String(prop(object, 'motifId'));
        const declaredRegion = regionByMotif.get(motifId);
        expect(declaredRegion, `${id}: ${object.name} の motifId ${motifId}`).toBeDefined();
        expect(regionAt(map, grid, tileIndex(map, object)), `${id}: ${object.name} の実配置地域`).toBe(
          declaredRegion,
        );
      }
      for (const event of area.events ?? []) {
        if (!event.motifId || event.trigger?.map !== `${id}-field`) continue;
        const declaredRegion = regionByMotif.get(event.motifId);
        const object = objectsOf(map).find((candidate) => candidate.name === event.trigger?.objectName);
        expect(object, `${id}: event ${event.trigger.objectName}`).toBeDefined();
        expect(
          regionAt(map, grid, tileIndex(map, object!)),
          `${id}: ${event.trigger.objectName} の実配置地域`,
        ).toBe(declaredRegion);
      }

      const terrain = TERRAIN.maps[`${id}-field`]!;
      const collision = map.layers.find((layer) => layer.name === 'collision')?.data ?? [];
      for (const object of objectsOf(map).filter((candidate) =>
        ['event', 'landmark', 'specialty'].includes(candidate.type),
      )) {
        const coordinate =
          object.type === 'event'
            ? EVENT_SPOTS[object.name]
            : LANDMARK_SPOTS[id]?.[String(prop(object, 'motifId'))];
        if (!coordinate) continue;
        const [targetX, targetY] = projectedTile(terrain, coordinate);
        const distance = (i: number) =>
          Math.hypot((i % map.width) + 0.5 - targetX, Math.floor(i / map.width) + 0.5 - targetY);
        let nearest = Infinity;
        for (let i = 0; i < map.width * map.height; i++)
          if (collision[i] !== 3 && regionAt(map, grid, i)) nearest = Math.min(nearest, distance(i));
        const actual = distance(tileIndex(map, object));
        expect(
          actual,
          `${id}: ${object.name} は実座標の最寄り歩行マスから ${Math.max(0, actual - nearest).toFixed(1)} マス移動`,
        ).toBeLessThanOrEqual(nearest + 4);
      }
      const enclave = maps.get(`${id}-enclave`);
      if (enclave) {
        const enclaveRegions = new Set(
          objectsOf(enclave)
            .filter((object) => object.type === 'landmark' || object.type === 'specialty')
            .map((object) => regionByMotif.get(String(prop(object, 'motifId'))))
            .filter((regionId): regionId is string => Boolean(regionId)),
        );
        for (const event of area.events ?? []) {
          if (!event.motifId || event.trigger?.map !== `${id}-enclave`) continue;
          const eventRegion = regionByMotif.get(event.motifId);
          if (eventRegion) enclaveRegions.add(eventRegion);
        }
        expect(enclaveRegions.size, `${id}: 離島 motif の地域`).toBeLessThanOrEqual(1);
        if (enclaveRegions.size) {
          const port = objectsOf(map).find((object) => object.name === `to_${id}-enclave`);
          expect(port, `${id}: 離島への港`).toBeDefined();
          expect(regionAt(map, grid, tileIndex(map, port!)), `${id}: 離島への港の地域`).toBe(
            [...enclaveRegions][0],
          );
        }
      }
    }

    const gates = objectsOf(map).filter((object) => object.type === 'regionGate');
    expect(gates, `${id}: regionGate の数`).toHaveLength(area.regionGates.length);
    for (const gate of area.regionGates) {
      const between = gate.between.join(',');
      const object = gates.find((candidate) => prop(candidate, 'between') === between);
      expect(object, `${id}: ${between} の関所`).toBeDefined();
      if (!object) continue;
      expect(prop(object, 'openedBy'), `${id}: ${between} の openedBy`).toBe(gate.openedBy);
      const at = tileIndex(map, object);
      const actualSides = new Set(
        [at, ...neighbors(map, at)].map((i) => regionAt(map, grid, i)).filter(Boolean),
      );
      for (const regionId of gate.between)
        expect(actualSides.has(regionId), `${id}: ${between} の関所が ${regionId} に接している`).toBe(true);
    }

    if (id !== 'aomori') {
      const bossByRegion = new Map(bosses.map((boss) => [String(prop(boss, 'region')), boss]));
      for (let defeatedCount = 0; defeatedCount < regionIds.length; defeatedCount++) {
        const defeated = new Set(regionIds.slice(0, defeatedCount));
        const blocked = new Set(
          gates
            .filter((gate) => !defeated.has(String(prop(gate, 'openedBy'))))
            .map((gate) => tileIndex(map, gate)),
        );
        for (const boss of bosses)
          if (!defeated.has(String(prop(boss, 'region')))) blocked.add(tileIndex(map, boss));
        const seen = reachable(`${id}-field`, map, blocked);
        const reachedRegions = regionIds.filter((regionId) => {
          for (const tile of seen) if (regionAt(map, grid, tile) === regionId) return true;
          return false;
        });
        expect(reachedRegions, `${id}: 先頭${defeatedCount}地域のboss撃破後に到達できる地域`).toEqual(
          regionIds.slice(0, defeatedCount + 1),
        );

        for (let index = defeatedCount; index < regionIds.length; index++) {
          const regionId = regionIds[index]!;
          const boss = bossByRegion.get(regionId)!;
          const canEngage = neighbors(map, tileIndex(map, boss)).some((tile) => seen.has(tile));
          expect(canEngage, `${id}: ${regionId} のbossへ挑める段階`).toBe(index === defeatedCount);
        }
      }
    } else {
      const defeated = new Set<string>();
      const visited = new Set<string>();
      for (let round = 0; round <= area.regions.length; round++) {
        const blocked = new Set(
          gates
            .filter((gate) => !defeated.has(String(prop(gate, 'openedBy'))))
            .map((gate) => tileIndex(map, gate)),
        );
        for (const boss of bosses)
          if (!defeated.has(String(prop(boss, 'region')))) blocked.add(tileIndex(map, boss));
        const seen = reachable(`${id}-field`, map, blocked);
        for (const i of seen) {
          const regionId = regionAt(map, grid, i);
          if (regionId) visited.add(regionId);
        }
        const next = bosses.filter(
          (boss) =>
            !defeated.has(String(prop(boss, 'region'))) &&
            neighbors(map, tileIndex(map, boss)).some((i) => seen.has(i)),
        );
        if (!next.length) break;
        for (const boss of next) defeated.add(String(prop(boss, 'region')));
      }
      expect([...visited].sort(), `${id}: 到達できる地域`).toEqual([...regionIds].sort());
      expect([...defeated].sort(), `${id}: 順番に戦える地域ボス`).toEqual(
        area.regions
          .filter((region) => region.boss)
          .map((region) => region.id)
          .sort(),
      );
    }
  });
});

describe('町とダンジョン', () => {
  const layer = (m: TiledMap, name: string) => m.layers.find((l) => l.name === name)?.data ?? [];

  it('町には 建物（屋根・かべ・とびら）と かざりが あり、お店の人と 町の人が いる', () => {
    for (const [key, m] of maps) {
      if (!key.endsWith('-town')) continue;
      const bg = layer(m, 'background');
      // 屋根（都会の 町は ビルの 屋上 217）
      expect(
        [6, 16, 17, 18, 65, 66, 67, 68, 217].some((t) => bg.includes(t)),
        `${key} の屋根`,
      ).toBe(true);
      expect(bg.includes(21), `${key} のとびら`).toBe(true);
      expect(layer(m, 'decor').filter((t) => t > 0).length, `${key} のかざり`).toBeGreaterThan(50);
      expect(objectsOf(m).filter((o) => o.type === 'npc').length, `${key} の人`).toBeGreaterThanOrEqual(6);
    }
  });

  it('47都道府県すべての町に歩いて行ける床屋がいる', () => {
    const towns = [...maps].filter(([key]) => key.endsWith('-town'));
    expect(towns).toHaveLength(47);
    for (const [key, map] of towns) {
      const barber = objectsOf(map).find(
        (object) => object.type === 'npc' && prop(object, 'role') === 'barber',
      );
      expect(barber, `${key} の床屋`).toBeDefined();
      expect(reachable(key, map).has(tileIndex(map, barber!)), `${key} の床屋に行ける`).toBe(true);
    }
  });

  it('どの県にも 町の テーマ（scripts/data/towns.ts）が あり、理由（note）が 書いてある', () => {
    for (const f of jsonFiles(PREFECTURES)) {
      const id = f.slice(0, -5);
      expect(TOWN_THEMES[id]?.note, id).toBeTruthy();
    }
  });

  it('町の 見た目は 県ごとに ちがう（使っている タイルの くみあわせが ほぼ 全部 ちがう）', () => {
    const looks = new Set<string>();
    let towns = 0;
    for (const [key, m] of maps) {
      if (!key.endsWith('-town')) continue;
      towns++;
      const tiles = new Set([...layer(m, 'background'), ...layer(m, 'decor')].filter((t) => t > 12));
      looks.add([...tiles].sort((a, b) => a - b).join(','));
    }
    expect(looks.size).toBeGreaterThanOrEqual(towns - 3);
  });

  it('ダンジョンは かべの前の面が あり、たからばこが 2 つ以上（いちばん おくの へやに 1 つ）', () => {
    for (const [key, m] of maps) {
      if (!key.endsWith('-dungeon')) continue;
      expect(
        // かべの前の面の タイル（scripts/scaffold-maps.ts の THEMES の face。テーマを 足したら ここにも 足す）
        [41, 45, 49, 53, 224, 228, 232, 236, 240, 244, 248, 252].some((t) =>
          layer(m, 'background').includes(t),
        ),
        `${key} のかべ`,
      ).toBe(true);
      const chests = objectsOf(m).filter((o) => o.type === 'chest');
      expect(chests.length, key).toBeGreaterThanOrEqual(2);
      expect(
        chests.some((o) => o.name.endsWith('_treasure')),
        key,
      ).toBe(true);
    }
  });
});

interface WorldMapJson {
  regions: {
    id: string;
    width: number;
    height: number;
    rows: string[];
    areas: { id: string; capital: [number, number]; stamps: string[] }[];
  }[];
}

describe('にほんちず（public/worldmap.json）', () => {
  const wm = JSON.parse(readFileSync(WORLD_MAP, 'utf8')) as WorldMapJson;
  const world = JSON.parse(readFileSync(WORLD, 'utf8')) as { islands: { id: string; areas: string[] }[] };

  it('world の島と県がすべてあり、県庁所在地はその県のマスにある', () => {
    expect(wm.regions.map((r) => r.id).sort()).toEqual(world.islands.map((i) => i.id).sort());
    for (const island of world.islands) {
      const r = wm.regions.find((x) => x.id === island.id)!;
      expect(r.areas.map((a) => a.id).sort(), island.id).toEqual([...island.areas].sort());
      expect(r.rows, island.id).toHaveLength(r.height);
      const cells = new RegExp(`^[.a-${String.fromCharCode(96 + r.areas.length)}]{${r.width}}$`);
      for (const row of r.rows) expect(row, island.id).toMatch(cells);
      r.areas.forEach((a, k) =>
        expect(r.rows[a.capital[1]]?.[a.capital[0]], `${a.id} の県庁所在地`).toBe(
          String.fromCharCode(97 + k),
        ),
      );
    }
  });

  it('県の名所の数は、その県のフィールドと離島の ★ 看板（イベントと名所スタンプ）と同じ', () => {
    const stampsOf = new Map(wm.regions.flatMap((r) => r.areas).map((a) => [a.id, a.stamps]));
    for (const f of jsonFiles(PREFECTURES)) {
      const area = JSON.parse(readFileSync(new URL(f, PREFECTURES), 'utf8')) as {
        id: string;
        events?: { motifId: string; trigger?: { map: string; objectName: string } }[];
      };
      const signs = new Set<string>();
      for (const key of [`${area.id}-field`, `${area.id}-enclave`]) {
        for (const o of objectsOf(maps.get(key) ?? { width: 0, height: 0, layers: [] })) {
          if (o.type === 'landmark' || o.type === 'specialty') signs.add(String(prop(o, 'motifId')));
          const ev = area.events?.find((e) => e.trigger?.map === key && e.trigger.objectName === o.name);
          if (o.type === 'event' && ev) signs.add(ev.motifId);
        }
      }
      expect([...(stampsOf.get(area.id) ?? [])].sort(), area.id).toEqual([...signs].sort());
    }
  });

  it('特産品（たべもの・こうげいひん）は宝箱で、あけると もらえる アイテム（<県>-<motif の id>）がある', () => {
    const items = new Set(jsonFiles(ITEMS).map((f) => f.slice(0, -5)));
    for (const f of jsonFiles(PREFECTURES)) {
      const area = JSON.parse(readFileSync(new URL(f, PREFECTURES), 'utf8')) as {
        id: string;
        motifs: { id: string; kind: string }[];
      };
      const kindOf = new Map(area.motifs.map((m) => [m.id, m.kind]));
      for (const key of [`${area.id}-field`, `${area.id}-enclave`])
        for (const o of objectsOf(maps.get(key) ?? { width: 0, height: 0, layers: [] })) {
          const motifId = String(prop(o, 'motifId'));
          if (o.type === 'specialty') {
            expect(['food', 'craft'], `${key} の ${o.name}`).toContain(kindOf.get(motifId));
            expect(items.has(`${area.id}-${motifId}`), `${key} の ${o.name} のアイテム`).toBe(true);
          }
          if (o.type === 'landmark')
            expect(['food', 'craft'], `${key} の ${o.name}`).not.toContain(kindOf.get(motifId));
        }
    }
  });

  it('どの都道府県にも、名所・特産品の ★ 看板が 8 か所以上ある', () => {
    for (const a of wm.regions.flatMap((r) => r.areas))
      expect(a.stamps.length, a.id).toBeGreaterThanOrEqual(8);
  });
});

describe('宝箱の 中身', () => {
  it('どの マップの 宝箱も、content に ある どうぐが 入っている（なくした やくそう・名前だけの どうぐ は ない）', () => {
    const items = new Set(
      readdirSync(new URL('../../content/items/', import.meta.url)).map((f) => f.replace(/\.json$/, '')),
    );
    const dir = MAPS;
    const bad: string[] = [];
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const m = JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as { layers: { objects?: Obj[] }[] };
      for (const o of m.layers.flatMap((l) => l.objects ?? []))
        if (o.type === 'chest') {
          const id = o.properties?.find((p) => p.name === 'itemId')?.value;
          if (typeof id !== 'string' || !items.has(id)) bad.push(`${f}:${o.name}:${String(id)}`);
        }
    }
    expect(bad).toEqual([]);
  });
});
