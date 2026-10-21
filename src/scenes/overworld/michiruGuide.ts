import type { World } from '../../core/content/schemas';
import {
  interPrefectureAccess,
  interPrefectureChapterLinks,
  type InterPrefectureLinkRef,
} from '../../core/progression/interPrefecture';
import { lastBossFlag, nextIncompleteArea } from '../../core/progression/route';
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

/** 現在の地方内、または次の地方で最初に攻略すべき県を求める。 */
function guidanceTargetArea(game: GameState, areaId: string, world: World): string | null {
  const island = world.islands.find((candidate) => candidate.areas.includes(areaId));
  if (!island) return null;
  if (!game.progress.islandsCleared.includes(island.id)) {
    const targetArea = nextIncompleteArea(world, island.id, game.progress);
    return targetArea === areaId ? null : targetArea;
  }

  const nextIsland = world.islands
    .filter((candidate) => candidate.status === 'playable' && candidate.order > island.order)
    .sort((a, b) => a.order - b.order)
    .find((candidate) => !game.progress.islandsCleared.includes(candidate.id));
  return nextIsland ? nextIncompleteArea(world, nextIsland.id, game.progress) : null;
}

/** worldの攻略順と正規の章間移動だけで、案内用の経路グラフを組み立てる。 */
function guidanceRouteLinks(world: World): readonly InterPrefectureLinkRef[] {
  const storyLinks = world.islands
    .filter((island) => island.status === 'playable')
    .flatMap((island) =>
      island.areas.slice(0, -1).map((areaId, index) => ({
        id: `guide-${areaId}-${island.areas[index + 1]!}`,
        areas: [areaId, island.areas[index + 1]!] as const,
        unlockRole: 'story' as const,
      })),
    );
  return [...storyLinks, ...interPrefectureChapterLinks()];
}

/** 開いている正規経路をBFSし、目的地へ向かう最初の隣県を返す。 */
function firstGuidanceStep(
  game: GameState,
  currentArea: string,
  targetArea: string,
  world: World,
): string | null {
  const links = guidanceRouteLinks(world);
  const visited = new Set([currentArea]);
  const queue: Array<{ areaId: string; firstStep: string | null }> = [
    { areaId: currentArea, firstStep: null },
  ];

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor]!;
    for (const link of links) {
      const neighbor =
        link.areas[0] === current.areaId
          ? link.areas[1]
          : link.areas[1] === current.areaId
            ? link.areas[0]
            : null;
      if (!neighbor || visited.has(neighbor)) continue;
      const directedLink: InterPrefectureLinkRef = {
        ...link,
        areas: [current.areaId, neighbor],
      };
      if (!interPrefectureAccess(world, directedLink, game.progress, false).open) continue;

      const firstStep = current.firstStep ?? neighbor;
      if (neighbor === targetArea) return firstStep;
      visited.add(neighbor);
      queue.push({ areaId: neighbor, firstStep });
    }
  }
  return null;
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
  if (game && areaId && world) {
    const targetArea = guidanceTargetArea(game, areaId, world);
    const nextArea = targetArea ? firstGuidanceStep(game, areaId, targetArea, world) : null;
    if (nextArea)
      for (const link of links) {
        if (
          link.currentArea === areaId &&
          link.targetArea === nextArea &&
          interPrefectureAccess(world, link, game.progress, false).open
        ) {
          nextLink = link;
          break;
        }
      }
  }
  return currentMichiruGuideKey([game, kind, areaId, world, nextLink]);
}
