import type { GameState } from '../state/schema';
import { MUSUBI_DAMA_ITEM_ID } from './town';

export const MUSUBI_DAMA_GUIDE_COUNTER = 'story.musubi-dama.guide';
export const MUSUBI_DAMA_COMPLETE_COUNTER = 'story.musubi-dama.complete';

export function shouldGuideMusubiDamaPurchase(mapKey: string, game: GameState): boolean {
  return (
    mapKey === 'aomori-town' &&
    !game.progress.counters[MUSUBI_DAMA_GUIDE_COUNTER] &&
    !game.progress.counters[MUSUBI_DAMA_COMPLETE_COUNTER] &&
    (game.inventory[MUSUBI_DAMA_ITEM_ID] ?? 0) <= 0
  );
}

function mark(game: GameState, counter: string, now: number): GameState {
  const state = structuredClone(game);
  state.progress.counters[counter] = 1;
  state.updatedAt = now;
  return state;
}

export function guideMusubiDamaPurchase(game: GameState, now = Date.now()): GameState {
  return mark(game, MUSUBI_DAMA_GUIDE_COUNTER, now);
}

export function completeMusubiDamaOnboarding(game: GameState, now = Date.now()): GameState {
  const state = mark(game, MUSUBI_DAMA_COMPLETE_COUNTER, now);
  if (
    (state.inventory[MUSUBI_DAMA_ITEM_ID] ?? 0) > 0 &&
    !state.party.bagItems.includes(MUSUBI_DAMA_ITEM_ID)
  ) {
    state.party.bagItems.push(MUSUBI_DAMA_ITEM_ID);
  }
  return state;
}

export function recordMusubiDamaPurchase(
  game: GameState,
  itemId: string,
  now = Date.now(),
): { state: GameState; showInstructions: boolean } {
  const showInstructions =
    itemId === MUSUBI_DAMA_ITEM_ID && !game.progress.counters[MUSUBI_DAMA_COMPLETE_COUNTER];
  return {
    state: showInstructions ? completeMusubiDamaOnboarding(game, now) : game,
    showInstructions,
  };
}
