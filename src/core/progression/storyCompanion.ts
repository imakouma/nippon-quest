import type { GameState } from '../state/schema';

export const STORY_COMPANION_EVENT = 'story.companion-chosen';
export const IWATE_ARRIVAL_COUNTER = 'story.iwate-arrival';
export const STORY_COMPANION_IDS = ['iwate-kagurabi', 'iwate-izumiko', 'iwate-kodamaru'] as const;

export type StoryCompanionId = (typeof STORY_COMPANION_IDS)[number];

export function isStoryCompanionId(id: string): id is StoryCompanionId {
  return STORY_COMPANION_IDS.includes(id as StoryCompanionId);
}

/** 岩手の町の物語で選んだ限定相棒を、初めての仲間としてバッグへ加える。 */
export function chooseStoryCompanion(
  prev: GameState,
  monsterId: StoryCompanionId,
  now = Date.now(),
): GameState {
  if (prev.progress.eventsDone.includes(STORY_COMPANION_EVENT) || prev.party.owned.length > 0) return prev;

  const next = structuredClone(prev);
  const uid = 'story-companion';
  next.party.owned.push({ uid, monsterId, level: 1, xp: 0 });
  next.party.activeUid = uid;
  next.party.team = [uid];
  next.party.reserve = [];
  next.party.bagPlacements[`mon:${uid}`] = { x: 1, y: 0, rotated: false };
  next.progress.eventsDone.push(STORY_COMPANION_EVENT);
  if (!next.dex.monsters.includes(monsterId)) next.dex.monsters.push(monsterId);
  next.updatedAt = now;
  return next;
}
