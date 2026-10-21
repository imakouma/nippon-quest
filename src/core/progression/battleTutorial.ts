import type { GameState } from '../state/schema';

export const BATTLE_TUTORIAL_EVENT = 'tutorial.battle-basics';
export const BATTLE_TUTORIAL_PENDING_COUNTER = 'tutorial.battle-basics.pending';

/** 今回のプロローグを終えたセーブだけ、初回説明の対象として予約する。 */
export function queueBattleTutorial(game: GameState, now = Date.now()): GameState {
  if (game.progress.eventsDone.includes(BATTLE_TUTORIAL_EVENT)) return game;
  const next = structuredClone(game);
  next.progress.counters[BATTLE_TUTORIAL_PENDING_COUNTER] = 1;
  next.updatedAt = now;
  return next;
}

/** 既存セーブへ割り込まず、予約済みの青森フィールドでだけ表示する。 */
export function shouldShowBattleTutorial(mapKey: string, game: GameState): boolean {
  return (
    mapKey === 'aomori-field' &&
    game.progress.counters[BATTLE_TUTORIAL_PENDING_COUNTER] === 1 &&
    !game.progress.eventsDone.includes(BATTLE_TUTORIAL_EVENT)
  );
}

/** 説明を完了し、同じセーブで二度と自動表示しない。 */
export function completeBattleTutorial(game: GameState, now = Date.now()): GameState {
  const next = structuredClone(game);
  delete next.progress.counters[BATTLE_TUTORIAL_PENDING_COUNTER];
  if (!next.progress.eventsDone.includes(BATTLE_TUTORIAL_EVENT)) {
    next.progress.eventsDone.push(BATTLE_TUTORIAL_EVENT);
  }
  next.updatedAt = now;
  return next;
}
