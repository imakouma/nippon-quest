/**
 * フィールドの「中ボス → ワープホール → 次の県」の道すじ。純粋関数のみ。
 * 県の順番は content/world/japan.json の islands[].order と islands[].areas の並び（コードに県名を書かない）。
 */
import type { World } from '../content/schemas';

export interface NextStop {
  id: string;
  mapKey: string;
}

/**
 * 中ボスを倒したあとのワープ先のフィールド。同じ島（地方）の次の県。
 * 島の最後の県では地方ボスが次の島への結界を管理するため null。
 * どの島にも無い県も null。
 */
export function nextStop(
  world: World,
  areaId: string,
  fieldKeyOf: (areaId: string) => string = (id) => `${id}-field`,
): NextStop | null {
  const island = world.islands.find((candidate) => candidate.areas.includes(areaId));
  if (!island) return null;
  const next = island.areas[island.areas.indexOf(areaId) + 1];
  return next ? { id: next, mapKey: fieldKeyOf(next) } : null;
}

/** progress.eventsDone に入れる「中ボスを倒した」しるし */
export const midBossFlag = (areaId: string): string => `midboss.${areaId}`;

interface AreaCompletionProgress {
  areaSigns: readonly string[];
  eventsDone: readonly string[];
}

/** 県間移動の順序上、すでに攻略済みとして飛ばせる県か。 */
export function areaTravelCompleted(progress: AreaCompletionProgress, areaId: string): boolean {
  return progress.areaSigns.includes(areaId) || progress.eventsDone.includes(midBossFlag(areaId));
}

/**
 * 現行の地理順で最初の未攻略県。
 * 旧攻略順の途中セーブでも、既完了県をもう一度要求しない。
 */
export function nextIncompleteArea(
  world: World,
  islandId: string,
  progress: AreaCompletionProgress,
): string | null {
  const island = world.islands.find((candidate) => candidate.id === islandId);
  return island?.areas.find((areaId) => !areaTravelCompleted(progress, areaId)) ?? null;
}

/** progress.eventsDone に入れる「ダンジョンの おくの 県ボスを倒した」しるし */
export const areaBossFlag = (areaId: string): string => `boss.${areaId}`;

/** 裏ステージの ラスボス（歴史上の 人物）を 倒した しるし（progress.eventsDone） */
export const lastBossFlag = (areaId: string): string => `lastboss.${areaId}`;

/** 名所エリアの ぬしを 倒した しるし（progress.eventsDone）。この エリアが openedBy の 関所が ひらく */
export const regionBossFlag = (areaId: string, regionId: string): string =>
  `regionboss.${areaId}.${regionId}`;

interface RegionProgress {
  areaSigns: readonly string[];
  eventsDone: readonly string[];
}

/**
 * 地域制を追加する前に県をクリアしたセーブも、その県の地域ボスを撃破済みとして扱う。
 * これにより既存プレイヤーの関所や地図を再ロックしない。
 */
export function regionBossDefeated(
  progress: RegionProgress | null | undefined,
  areaId: string,
  regionId: string,
): boolean {
  return (
    progress?.areaSigns.includes(areaId) === true ||
    progress?.eventsDone.includes(midBossFlag(areaId)) === true ||
    progress?.eventsDone.includes(regionBossFlag(areaId, regionId)) === true
  );
}

/** 次の県を開く中ボスへ進めるのは、県内の地域のぬしを全員倒したあと。 */
export function allRegionBossesDefeated(
  progress: RegionProgress | null | undefined,
  areaId: string,
  regionIds: readonly string[],
): boolean {
  return regionIds.every((regionId) => regionBossDefeated(progress, areaId, regionId));
}

/** dex.motifs に入れる「名所スタンプ」の id。スタンプを持っている＝その名所を見つけた */
export const motifStamp = (areaId: string, motifId: string): string => `${areaId}.${motifId}`;
