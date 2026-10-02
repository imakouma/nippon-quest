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
 * 島の最後の県なら、次の島（order の次）の最初の県へ。最後の島の最後の県と、どの島にも無い県は null。
 */
export function nextStop(
  world: World,
  areaId: string,
  fieldKeyOf: (areaId: string) => string = (id) => `${id}-field`,
): NextStop | null {
  const islands = [...world.islands].sort((a, b) => a.order - b.order);
  const k = islands.findIndex((i) => i.areas.includes(areaId));
  if (k < 0) return null;
  const areas = islands[k]!.areas;
  const next = areas[areas.indexOf(areaId) + 1] ?? islands[k + 1]?.areas[0];
  return next ? { id: next, mapKey: fieldKeyOf(next) } : null;
}

/** progress.eventsDone に入れる「中ボスを倒した」しるし */
export const midBossFlag = (areaId: string): string => `midboss.${areaId}`;

/** progress.eventsDone に入れる「ダンジョンの おくの 県ボスを倒した」しるし */
export const areaBossFlag = (areaId: string): string => `boss.${areaId}`;

/** 裏ステージの ラスボス（歴史上の 人物）を 倒した しるし（progress.eventsDone） */
export const lastBossFlag = (areaId: string): string => `lastboss.${areaId}`;

/** 名所エリアの ぬしを 倒した しるし（progress.eventsDone）。この エリアが openedBy の 関所が ひらく */
export const regionBossFlag = (areaId: string, regionId: string): string =>
  `regionboss.${areaId}.${regionId}`;

/** dex.motifs に入れる「名所スタンプ」の id。スタンプを持っている＝その名所を見つけた */
export const motifStamp = (areaId: string, motifId: string): string => `${areaId}.${motifId}`;
