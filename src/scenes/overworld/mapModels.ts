import type { ContentIndex } from '../../core/content/loader';
import type { Area } from '../../core/content/schemas';
import { canChallengeIslandBoss } from '../../core/progression/island';
import { midBossFlag, motifStamp } from '../../core/progression/route';
import type { GameState } from '../../core/state/schema';
import type { RegionMiniView } from '../../ui/field/RegionMiniMap';
import type { AreaMark, AreaMapView, PlaceOption } from '../../ui/field/AreaMap';
import type { MapAreaInfo, MapRegionInfo, WorldMapData } from '../../ui/field/WorldMapOverlay';
import { isSpecialtyMotif } from './catalogs';

const TILE = 16;

/** Phaser に依存しない、Tiled objects レイヤーのうち地図表示に必要な形。 */
export interface MapObject {
  type?: string;
  name?: string;
  x?: number;
  y?: number;
  properties?: readonly { name: string; value: unknown }[];
}

export interface MapBaseDetail {
  key: string;
  width: number;
  height: number;
  tiles: readonly number[];
  land: [number, number, number, number] | null;
}

export interface MapBase extends MapBaseDetail {
  objects: readonly MapObject[];
}

/** Phaser のキャッシュから受け取る Tiled JSON のうち、地図表示に必要な部分。 */
export interface TiledMapSource<T extends MapObject = MapObject> {
  width: number;
  height: number;
  layers: readonly { name: string; data?: number[]; objects?: T[] }[];
}

export interface RegionPartition {
  ids: string[];
  rows: string[];
}

/** Tiled の regions プロパティを安全に読む。不正・旧形式なら領域なしとして扱う。 */
export function parseRegionPartition(raw: unknown): RegionPartition | null {
  if (typeof raw !== 'string') return null;
  try {
    const data = JSON.parse(raw) as { ids?: unknown; rows?: unknown };
    if (
      !Array.isArray(data.ids) ||
      !data.ids.every((id): id is string => typeof id === 'string') ||
      !Array.isArray(data.rows) ||
      !data.rows.every((row): row is string => typeof row === 'string')
    )
      return null;
    return { ids: data.ids, rows: data.rows };
  } catch {
    return null;
  }
}

/** Tiled JSON から地図表示の基礎データと陸地の範囲を作る。 */
export function mapBaseFromTiled<T extends MapObject>(
  key: string,
  source: TiledMapSource<T> | undefined,
): (Omit<MapBase, 'objects'> & { objects: T[] }) | null {
  const tiles = source?.layers.find((layer) => layer.name === 'background')?.data;
  if (!source || !tiles) return null;
  let land: MapBase['land'] = null;
  for (let index = 0; index < tiles.length; index++) {
    if (tiles[index] === 3) continue;
    const x = index % source.width;
    const y = Math.floor(index / source.width);
    land = land
      ? [Math.min(land[0], x), Math.min(land[1], y), Math.max(land[2], x), Math.max(land[3], y)]
      : [x, y, x, y];
  }
  return {
    key,
    width: source.width,
    height: source.height,
    tiles,
    objects: [...(source.layers.find((layer) => layer.name === 'objects')?.objects ?? [])],
    land,
  };
}

/** ワープ先。画面に表示する値と、Scene が移動に使う値をまとめる。 */
export interface MapPlace extends PlaceOption {
  map: string;
  spawn: string;
  tile?: [number, number];
}

export interface Enclave {
  enclaveId: string;
  name: string;
}

type Sign = { motif: Area['motifs'][number]; stamp: string; kind: 'sign-off' | 'sign-todo' | 'sign-done' };
type Box = { motif: Area['motifs'][number]; stamp: string; opened: boolean };

const objectProp = (object: MapObject, name: string): unknown =>
  object.properties?.find((property) => property.name === name)?.value;

const objectTile = (object: MapObject): [number, number] => [
  Math.floor((object.x ?? 0) / TILE),
  Math.floor((object.y ?? 0) / TILE),
];

function signFor(object: MapObject, mapKey: string, area: Area, game: GameState | undefined): Sign | null {
  const event =
    object.type === 'event'
      ? area.events.find(
          (candidate) => candidate.trigger.map === mapKey && candidate.trigger.objectName === object.name,
        )
      : undefined;
  const motifId = object.type === 'landmark' ? objectProp(object, 'motifId') : event?.motifId;
  const motif = area.motifs.find((candidate) => candidate.id === motifId);
  if (!motif) return null;
  const stamp = motifStamp(area.id, motif.id);
  const found = game?.dex.motifs.includes(stamp) ?? false;
  const done = !event || (game?.progress.eventsDone.includes(event.id) ?? false);
  return { motif, stamp, kind: !found ? 'sign-off' : done ? 'sign-done' : 'sign-todo' };
}

function boxFor(object: MapObject, area: Area, game: GameState | undefined): Box | null {
  const motif = area.motifs.find((candidate) => candidate.id === objectProp(object, 'motifId'));
  if (!motif) return null;
  const stamp = motifStamp(area.id, motif.id);
  return { motif, stamp, opened: game?.dex.motifs.includes(stamp) ?? false };
}

/** 県の全体地図に描く地形、印、主人公位置を組み立てる。 */
export function areaMapView(input: {
  base: MapBase | null;
  area: Area | undefined;
  game: GameState | undefined;
  currentMapKey: string;
  heroTile: [number, number] | null;
  region: RegionMiniView | null;
}): AreaMapView | null {
  const { base, area, game, currentMapKey, heroTile, region } = input;
  if (!base) return null;
  const onBase = base.key === currentMapKey;
  let hero = onBase ? heroTile : null;
  const marks: AreaMark[] = [];
  for (const object of base.objects) {
    const [x, y] = objectTile(object);
    if (object.type === 'transition') {
      const target = String(objectProp(object, 'targetMap') ?? '');
      const kind = target.endsWith('-town') ? 'town' : target.endsWith('-dungeon') ? 'dungeon' : 'ship';
      marks.push({ x, y, kind });
      if (!onBase && target === currentMapKey) hero = [x, y];
    } else if (object.type === 'midboss' && area?.midBoss) {
      const beaten = game?.progress.eventsDone.includes(midBossFlag(area.id)) ?? false;
      marks.push({ x, y, kind: beaten ? 'warp' : 'boss' });
    } else if ((object.type === 'event' || object.type === 'landmark') && area) {
      const sign = signFor(object, base.key, area, game);
      if (sign) marks.push({ x, y, kind: sign.kind });
    } else if (object.type === 'specialty' && area) {
      const box = boxFor(object, area, game);
      if (box) marks.push({ x, y, kind: box.opened ? 'box-open' : 'box' });
    }
  }
  return { key: base.key, width: base.width, height: base.height, tiles: base.tiles, marks, hero, region };
}

/** 地図からワープできる訪問済みの場所・発見済みの名所を抽出する。 */
export function mapPlaces(input: {
  base: MapBase | null;
  area: Area | undefined;
  game: GameState | undefined;
  revealAll: boolean;
  enclaves: readonly Enclave[];
  labels: { town: string; dungeon: string };
}): MapPlace[] {
  const { base, area, game, revealAll, enclaves, labels } = input;
  if (!base || !area || !game) return [];
  const been = (key: string) => revealAll || (game.progress.counters[`visit:${key}`] ?? 0) > 0;
  const maps: MapPlace[] = [];
  const signs: MapPlace[] = [];
  for (const object of base.objects) {
    const at = objectTile(object);
    if (object.type === 'transition') {
      const target = String(objectProp(object, 'targetMap') ?? '');
      if (target === base.key || !been(target) || maps.some((place) => place.map === target)) continue;
      const enclave = enclaves.find((candidate) => candidate.enclaveId === target);
      const town = target.endsWith('-town');
      const dungeon = target.endsWith('-dungeon');
      maps.push({
        id: `map:${target}`,
        name: town
          ? (area.town?.name ?? labels.town)
          : dungeon
            ? labels.dungeon
            : (enclave?.name ?? area.name),
        icon: town ? 'town' : dungeon ? 'dungeon' : enclave ? 'ship' : 'field',
        at,
        map: target,
        spawn: 'spawn',
      });
    } else if (object.type === 'event' || object.type === 'landmark') {
      const sign = signFor(object, base.key, area, game);
      if (!sign || (sign.kind === 'sign-off' && !revealAll)) continue;
      signs.push({
        id: `sign:${sign.stamp}`,
        name: sign.motif.name,
        icon: 'star',
        at,
        map: base.key,
        spawn: 'spawn',
        tile: at,
      });
    } else if (object.type === 'specialty') {
      const box = boxFor(object, area, game);
      if (!box?.opened) continue;
      signs.push({
        id: `box:${box.stamp}`,
        name: box.motif.name,
        icon: 'chest',
        at,
        map: base.key,
        spawn: 'spawn',
        tile: at,
      });
    }
  }
  return [...maps, ...signs];
}

/** セーブの訪問記録を、全国地図で使う県IDの集合へ変換する。 */
export function visitedAreaIds(
  currentAreaId: string,
  game: GameState | undefined,
  content: ContentIndex | undefined,
  revealAll: boolean,
): Set<string> {
  const visited = new Set([currentAreaId]);
  if (revealAll) for (const id of content?.areas.keys() ?? []) visited.add(id);
  for (const [key, count] of Object.entries(game?.progress.counters ?? {}))
    if (key.startsWith('visit:') && count > 0) visited.add(key.slice('visit:'.length).split('-')[0] ?? '');
  return visited;
}

/** 左上の地方ミニマップ。現在県の詳細地形と主人公位置だけを重ねる。 */
export function regionMiniMapView(input: {
  data: WorldMapData | undefined;
  areaId: string;
  visited: Set<string>;
  base: MapBaseDetail | null;
  heroOnBase: [number, number] | null;
  fallbackAt?: [number, number];
}): RegionMiniView | null {
  const region = input.data?.regions.find((candidate) =>
    candidate.areas.some((area) => area.id === input.areaId),
  );
  if (!region) return null;
  const here = region.areas.findIndex((area) => area.id === input.areaId);
  const letter = String.fromCharCode(97 + here);
  let focus: [number, number, number, number] | null = null;
  region.rows.forEach((row, y) =>
    [...row].forEach((cell, x) => {
      if (cell !== letter) return;
      focus = focus
        ? [Math.min(focus[0], x), Math.min(focus[1], y), Math.max(focus[2], x), Math.max(focus[3], y)]
        : [x, y, x, y];
    }),
  );
  const land = input.base?.land ?? null;
  const at: [number, number] | undefined =
    land && input.heroOnBase
      ? [
          (input.heroOnBase[0] - land[0] + 0.5) / (land[2] - land[0] + 1),
          (input.heroOnBase[1] - land[1] + 0.5) / (land[3] - land[1] + 1),
        ]
      : input.fallbackAt;
  const capital = here >= 0 ? region.areas[here]!.capital : null;
  const hero: [number, number] | null =
    focus && at
      ? [focus[0] + at[0] * (focus[2] - focus[0] + 1), focus[1] + at[1] * (focus[3] - focus[1] + 1)]
      : capital
        ? [capital[0] + 0.5, capital[1] + 0.5]
        : null;
  return {
    id: region.id,
    width: region.width,
    height: region.height,
    rows: region.rows,
    areas: region.areas,
    visited: region.areas.map((area) => input.visited.has(area.id)),
    here,
    hero,
    focus,
    detail:
      input.base && land
        ? { key: input.base.key, tiles: input.base.tiles, width: input.base.width, land }
        : null,
  };
}

/** にほんちずの地方・県ごとの解放状況、スタンプ、中ボス進行を組み立てる。 */
export function worldMapRegionViews(input: {
  data: WorldMapData | undefined;
  content: ContentIndex | undefined;
  game: GameState | undefined;
  visited: Set<string>;
  kana: (ruby: string) => string;
}): MapRegionInfo[] {
  const { data, content, game, visited, kana } = input;
  if (!data || !content) return [];
  const islands = new Map(content.world.islands.map((island) => [island.id, island]));
  const boss = (area: Area | undefined): MapAreaInfo['boss'] => {
    if (!area?.midBoss) return 'none';
    return game?.progress.eventsDone.includes(midBossFlag(area.id)) ? 'done' : 'yet';
  };
  return data.regions
    .filter((region) => islands.has(region.id))
    .sort((a, b) => islands.get(a.id)!.order - islands.get(b.id)!.order)
    .map((region) => {
      const island = islands.get(region.id)!;
      const foundSigns = island.areas.filter((id) => game?.progress.areaSigns.includes(id)).length;
      const cleared = game?.progress.islandsCleared.includes(island.id) ?? false;
      const ready = !!game && canChallengeIslandBoss(content.world, island.id, game.progress);
      return {
        id: region.id,
        name: island.name,
        width: region.width,
        height: region.height,
        rows: region.rows,
        status: island.status,
        islandBoss: {
          name: content.monsters.get(island.bossId)?.name ?? island.bossId,
          state: cleared ? 'done' : ready ? 'ready' : 'locked',
          foundSigns,
          requiredSigns: island.areas.length,
        },
        areas: region.areas.map((entry): MapAreaInfo => {
          const area = content.areas.get(entry.id);
          const stamps = entry.stamps.flatMap((id) => {
            const motif = area?.motifs.find((candidate) => candidate.id === id);
            if (!motif) return [];
            const box = isSpecialtyMotif(motif) && !area?.events.some((event) => event.motifId === id);
            return [
              { name: game?.dex.motifs.includes(motifStamp(entry.id, id)) ? kana(motif.name) : null, box },
            ];
          });
          return {
            id: entry.id,
            name: area?.name ?? entry.id,
            capital: entry.capital,
            stamps,
            boss: boss(area),
            visited: island.status === 'playable' && visited.has(entry.id),
          };
        }),
      };
    });
}
