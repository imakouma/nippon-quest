import type { GameState } from '../state/schema';
import { MAX_COMPANIONS } from './bag';

export const STORY_COMPANION_EVENT = 'story.companion-chosen';
export const IWATE_ARRIVAL_COUNTER = 'story.iwate-arrival';
export const STORY_COMPANION_IDS = ['iwate-kagurabi', 'iwate-izumiko', 'iwate-kodamaru'] as const;

export type StoryCompanionId = (typeof STORY_COMPANION_IDS)[number];

export function isStoryCompanionId(id: string): id is StoryCompanionId {
  return STORY_COMPANION_IDS.includes(id as StoryCompanionId);
}

/** セーブ内で選ばれている物語の相棒。仲間の並び順には依存しない。 */
export function storyCompanionId(game: Pick<GameState, 'party'>): StoryCompanionId | null {
  const id = game.party.owned.find((monster) => isStoryCompanionId(monster.monsterId))?.monsterId;
  return id && isStoryCompanionId(id) ? id : null;
}

/** 相棒選択済みか。旧セーブでイベント印だけ／仲間だけが残った場合も重複加入を防ぐ。 */
export function hasStoryCompanion(game: Pick<GameState, 'party' | 'progress'>): boolean {
  return !!storyCompanionId(game) || game.progress.eventsDone.includes(STORY_COMPANION_EVENT);
}

/** 岩手の町の物語で選んだ限定相棒を、既存の仲間を失わずに加える。 */
export function chooseStoryCompanion(
  prev: GameState,
  monsterId: StoryCompanionId,
  now = Date.now(),
): GameState {
  if (hasStoryCompanion(prev)) return prev;

  const next = structuredClone(prev);
  const baseUid = 'story-companion';
  let uid = baseUid;
  let suffix = 2;
  while (next.party.owned.some((monster) => monster.uid === uid)) uid = `${baseUid}#${suffix++}`;
  next.party.owned.push({ uid, monsterId, level: 1, xp: 0 });
  next.party.activeUid = uid;
  const occupied = new Set(
    Object.values(next.party.bagPlacements).map((position) => `${position.x},${position.y}`),
  );
  const open = [
    { x: 1, y: 0 },
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 2, y: 1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
    { x: 2, y: 2 },
  ].find((position) => !occupied.has(`${position.x},${position.y}`));
  if (open && next.party.team.length < MAX_COMPANIONS) {
    next.party.team = [uid, ...next.party.team];
    next.party.bagPlacements[`mon:${uid}`] = { ...open, rotated: false };
  } else {
    next.party.reserve = [uid, ...next.party.reserve.filter((candidate) => candidate !== uid)];
  }
  next.progress.eventsDone.push(STORY_COMPANION_EVENT);
  if (!next.dex.monsters.includes(monsterId)) next.dex.monsters.push(monsterId);
  next.updatedAt = now;
  return next;
}
