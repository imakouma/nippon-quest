import { areaTravelCompleted } from '../../core/progression/route';
import { interPrefectureArrivalKey } from '../../core/progression/interPrefectureArrival';

export type InterPrefectureInfrastructure = 'landBorder' | 'bridge' | 'tunnel' | 'seaRoute';
export type InterPrefectureTravelMode = 'walk' | 'bicycle' | 'roadVehicle' | 'rail' | 'ferry';
export type InterPrefectureUnlockRole = 'chapter' | 'story' | 'shortcut' | 'special';

interface TiledPropertySource {
  name: string;
  value: unknown;
}

/** Phaser の型を持ち込まずに、生成済み Tiled object を読むための最小契約。 */
export interface InterPrefectureLinkObjectSource {
  type?: string;
  name?: string;
  properties?: readonly TiledPropertySource[];
}

/** Scene が県境・実在交通を扱うための、生成スクリプト非依存のモデル。 */
export interface InterPrefectureLink {
  id: string;
  currentArea: string;
  targetArea: string;
  areas: [string, string];
  targetMap: string;
  /** 相手県側の同じリンクへ戻ってくる、相互移動用 spawn。 */
  targetSpawn: string;
  /** 相手県へ初めて通常進行で入るときの入口。 */
  firstTargetSpawn: string;
  infrastructure: InterPrefectureInfrastructure;
  travelMode: InterPrefectureTravelMode;
  unlockRole?: InterPrefectureUnlockRole;
  labelKey?: string;
  placeId?: string;
  endpointNameKey?: string;
}

const INFRASTRUCTURES: readonly InterPrefectureInfrastructure[] = [
  'landBorder',
  'bridge',
  'tunnel',
  'seaRoute',
];
const TRAVEL_MODES: readonly InterPrefectureTravelMode[] = [
  'walk',
  'bicycle',
  'roadVehicle',
  'rail',
  'ferry',
];
const UNLOCK_ROLES: readonly InterPrefectureUnlockRole[] = ['chapter', 'story', 'shortcut', 'special'];

const property = (object: InterPrefectureLinkObjectSource, name: string): unknown =>
  object.properties?.find((candidate) => candidate.name === name)?.value;

function requiredString(object: InterPrefectureLinkObjectSource, name: string): string {
  const value = property(object, name);
  if (typeof value !== 'string' || value.length === 0)
    throw new Error(`interPrefectureLink の ${name} が正しい文字列ではありません`);
  return value;
}

function optionalString(object: InterPrefectureLinkObjectSource, name: string): string | undefined {
  const value = property(object, name);
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length === 0)
    throw new Error(`interPrefectureLink の ${name} が正しい文字列ではありません`);
  return value;
}

function enumValue<T extends string>(
  object: InterPrefectureLinkObjectSource,
  name: string,
  values: readonly T[],
): T {
  const value = requiredString(object, name);
  if (!values.includes(value as T)) throw new Error(`interPrefectureLink の ${name}=${value} は未対応です`);
  return value as T;
}

/**
 * scaffold-maps が作った object をランタイムモデルへ変換する。
 * 別種の object は null、リンクなのに壊れている場合は生成不整合として明示的に失敗させる。
 */
export function parseInterPrefectureLinkObject(
  currentArea: string,
  object: InterPrefectureLinkObjectSource,
): InterPrefectureLink | null {
  if (object.type !== 'interPrefectureLink') return null;
  if (!currentArea) throw new Error('interPrefectureLink の currentArea が空です');

  const targetArea = requiredString(object, 'targetArea');
  if (targetArea === currentArea) throw new Error(`interPrefectureLink の両端が同じ県です: ${currentArea}`);

  const optional = {
    unlockRole: optionalString(object, 'unlockRole'),
    labelKey: optionalString(object, 'labelKey'),
    placeId: optionalString(object, 'placeId'),
    endpointNameKey: optionalString(object, 'endpointNameKey'),
  };
  if (optional.unlockRole && !UNLOCK_ROLES.includes(optional.unlockRole as InterPrefectureUnlockRole))
    throw new Error(`interPrefectureLink の unlockRole=${optional.unlockRole} は未対応です`);

  return {
    id: requiredString(object, 'linkId'),
    currentArea,
    targetArea,
    areas: [currentArea, targetArea],
    targetMap: requiredString(object, 'targetMap'),
    targetSpawn: requiredString(object, 'targetSpawn'),
    firstTargetSpawn: requiredString(object, 'firstTargetSpawn'),
    infrastructure: enumValue(object, 'infrastructure', INFRASTRUCTURES),
    travelMode: enumValue(object, 'travelMode', TRAVEL_MODES),
    ...(optional.unlockRole ? { unlockRole: optional.unlockRole as InterPrefectureUnlockRole } : {}),
    ...(optional.labelKey ? { labelKey: optional.labelKey } : {}),
    ...(optional.placeId ? { placeId: optional.placeId } : {}),
    ...(optional.endpointNameKey ? { endpointNameKey: optional.endpointNameKey } : {}),
  };
}

export interface InterPrefectureDestinationProgress {
  areaSigns: readonly string[];
  eventsDone: readonly string[];
  counters: Readonly<Record<string, number>>;
}

/** 攻略前は通常入口へ送り、攻略後または開発者中は県境同士をつなぐ。セーブは変更しない。 */
export function interPrefectureDestinationSpawn(
  link: InterPrefectureLink,
  progress: InterPrefectureDestinationProgress,
  devAll: boolean,
): string {
  return devAll ||
    areaTravelCompleted(progress, link.targetArea) ||
    progress.counters[interPrefectureArrivalKey(link.targetArea)]
    ? link.targetSpawn
    : link.firstTargetSpawn;
}
