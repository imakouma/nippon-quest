import type { Area } from '../../core/content/schemas';
import { allRegionBossesDefeated, areaBossFlag } from '../../core/progression/route';
import type { GameState } from '../../core/state/schema';
import type { MapKind } from './geography';

interface TransitionLockInput {
  explicitLock: unknown;
  mapKind: MapKind;
  targetMap: string;
  areaId: string;
  hasRegionBosses: boolean;
}

/**
 * Tiled 側の指定を優先しつつ、旧マップの県ダンジョンにも地域進行ロックを補う。
 * 手作りマップを再生成せず、新旧どちらのマップでも同じ進行にするための互換処理。
 */
export function transitionLock(input: TransitionLockInput): string | null {
  if (typeof input.explicitLock === 'string' && input.explicitLock) return input.explicitLock;
  if (input.mapKind === 'field' && input.hasRegionBosses && input.targetMap === `${input.areaId}-dungeon`)
    return 'regionBosses';
  return null;
}

/** 入口のロック理由と現在の進行から、いま通れるかを一か所で判定する。 */
export function isTransitionLocked(
  reason: string | undefined,
  area: Area | undefined,
  progress: GameState['progress'] | undefined,
  revealAll: boolean,
): boolean {
  if (!reason || !area) return false;
  if (reason === 'areaSign') return !progress?.eventsDone.includes(areaBossFlag(area.id));
  if (reason !== 'regionBosses' || revealAll) return false;
  const required = area.regions.filter((region) => region.boss).map((region) => region.id);
  return !allRegionBossesDefeated(progress, area.id, required);
}

interface TintableTransitionIcon {
  isTinted: boolean;
  setTint(color: number): unknown;
  clearTint(): unknown;
}

/** 入口画像を現在のロック状態へそろえ、地域ダンジョンが今開いたかを返す。 */
export function syncTransitionLocks(
  reasons: ReadonlyMap<number, string>,
  icons: ReadonlyMap<number, TintableTransitionIcon>,
  locked: (tile: number) => boolean,
): boolean {
  let regionDungeonOpened = false;
  for (const [tile, icon] of icons) {
    const wasLocked = icon.isTinted;
    const isLocked = locked(tile);
    if (isLocked) icon.setTint(0x555566);
    else icon.clearTint();
    if (reasons.get(tile) === 'regionBosses' && wasLocked && !isLocked) regionDungeonOpened = true;
  }
  return regionDungeonOpened;
}
