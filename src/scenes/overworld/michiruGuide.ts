import type { World } from '../../core/content/schemas';
import { lastBossFlag, midBossFlag } from '../../core/progression/route';
import type { GameState } from '../../core/state/schema';
import type { MapKind } from './geography';

export type MichiruGuideKey =
  'wake' | 'islandBoss' | 'town' | 'dungeon' | 'secret' | 'secretDone' | 'warp' | 'explore';

export interface MichiruGuideInput {
  prologueDone: boolean;
  kind: MapKind;
  islandBossReady: boolean;
  areaBossDone: boolean;
  midBossDone: boolean;
  lastBossDone: boolean;
}

/** 現在の場所と物語進行から、ミチルが示す次の一歩を一つだけ選ぶ。 */
export function michiruGuideKey(input: MichiruGuideInput): MichiruGuideKey {
  if (!input.prologueDone) return 'wake';
  if (input.islandBossReady) return 'islandBoss';
  if (input.kind === 'town') return 'town';
  if (input.kind === 'dungeon' && !input.areaBossDone) return 'dungeon';
  if (input.kind === 'secret') return input.lastBossDone ? 'secretDone' : 'secret';
  if (input.kind === 'field' && input.midBossDone) return 'warp';
  return 'explore';
}

/** Scene の外で GameState から現在の案内を組み立てる。 */
export function currentMichiruGuideKey(
  context: [GameState | null | undefined, MapKind, string | undefined, World | undefined],
): MichiruGuideKey {
  const [game, kind, areaId, world] = context;
  const eventsDone = new Set(game?.progress.eventsDone ?? []);
  const island = areaId ? world?.islands.find((candidate) => candidate.areas.includes(areaId)) : undefined;
  return michiruGuideKey({
    prologueDone: (game?.progress.counters['story.prologue'] ?? 0) > 0,
    kind,
    islandBossReady:
      !!island &&
      !game?.progress.islandsCleared.includes(island.id) &&
      island.areas.every((id) => game?.progress.areaSigns.includes(id)),
    areaBossDone: !!areaId && game?.progress.areaSigns.includes(areaId) === true,
    midBossDone: !!areaId && eventsDone.has(midBossFlag(areaId)),
    lastBossDone: !!areaId && eventsDone.has(lastBossFlag(areaId)),
  });
}
