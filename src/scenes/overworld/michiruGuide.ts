import type { World } from '../../core/content/schemas';
import { interPrefectureAccess, interPrefectureUnlockRule } from '../../core/progression/interPrefecture';
import { lastBossFlag, midBossFlag } from '../../core/progression/route';
import type { GameState } from '../../core/state/schema';
import type { MapKind } from './geography';
import type { InterPrefectureLink } from './interPrefectureLink';

export type MichiruGuideKey =
  | 'wake'
  | 'islandBoss'
  | 'town'
  | 'dungeon'
  | 'secret'
  | 'secretDone'
  | 'gate'
  | 'bridge'
  | 'tunnel'
  | 'rail'
  | 'ferry'
  | 'explore';

export type MichiruGuideLink = Pick<InterPrefectureLink, 'infrastructure' | 'travelMode'>;

export interface MichiruGuideInput {
  prologueDone: boolean;
  kind: MapKind;
  islandBossReady: boolean;
  areaBossDone: boolean;
  lastBossDone: boolean;
  nextLink: MichiruGuideLink | null;
}

/** 実際に案内する県間リンクを、子どもが探せる入口の種類へ変える。 */
export function michiruLinkGuideKey(
  link: MichiruGuideLink,
): Extract<MichiruGuideKey, 'gate' | 'bridge' | 'tunnel' | 'rail' | 'ferry'> {
  if (link.travelMode === 'rail') return 'rail';
  if (link.travelMode === 'ferry') return 'ferry';
  if (link.infrastructure === 'bridge') return 'bridge';
  if (link.infrastructure === 'tunnel') return 'tunnel';
  return 'gate';
}

/** 現在の場所と物語進行から、ミチルが示す次の一歩を一つだけ選ぶ。 */
export function michiruGuideKey(input: MichiruGuideInput): MichiruGuideKey {
  if (!input.prologueDone) return 'wake';
  if (input.islandBossReady) return 'islandBoss';
  if (input.kind === 'town') return 'town';
  if (input.kind === 'dungeon' && !input.areaBossDone) return 'dungeon';
  if (input.kind === 'secret') return input.lastBossDone ? 'secretDone' : 'secret';
  if (input.kind === 'field' && input.nextLink) return michiruLinkGuideKey(input.nextLink);
  return 'explore';
}

/** Scene の外で GameState から現在の案内を組み立てる。 */
export function currentMichiruGuideKey(
  context: [
    GameState | null | undefined,
    MapKind,
    string | undefined,
    World | undefined,
    (MichiruGuideLink | null)?,
  ],
): MichiruGuideKey {
  const [game, kind, areaId, world, nextLink = null] = context;
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
    lastBossDone: !!areaId && eventsDone.has(lastBossFlag(areaId)),
    nextLink,
  });
}

/** 実マップ上のリンクから、中ボス撃破後に案内すべき物理入口も含めて決める。 */
export function currentMichiruGuideKeyFromLinks(
  context: [
    GameState | null | undefined,
    MapKind,
    string | undefined,
    World | undefined,
    Iterable<InterPrefectureLink>,
  ],
): MichiruGuideKey {
  const [game, kind, areaId, world, links] = context;
  let nextLink: InterPrefectureLink | null = null;
  let storyLink: InterPrefectureLink | null = null;
  if (game && areaId && world)
    for (const link of links) {
      const rule = interPrefectureUnlockRule(world, link);
      if (rule.kind === 'chapter' && interPrefectureAccess(world, link, game.progress, false).open) {
        nextLink = link;
        break;
      }
      if (
        !storyLink &&
        rule.kind === 'story' &&
        rule.completedAreaId === areaId &&
        game.progress.eventsDone.includes(midBossFlag(areaId))
      )
        storyLink = link;
    }
  nextLink ??= storyLink;
  return currentMichiruGuideKey([game, kind, areaId, world, nextLink]);
}
