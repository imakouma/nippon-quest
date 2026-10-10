import { applyReward } from '../../core/progression/eventReward';
import { innRest } from '../../core/progression/town';
import type { GameState } from '../../core/state/schema';

interface InnStayOptions {
  getGame: () => GameState | undefined;
  setGame: (game: GameState) => void;
  max: (game: GameState) => { hp: number; mp: number };
  inn: { map: string; x: number; y: number };
  reviewed: number;
  onFree: () => Promise<void>;
}

/** 宿泊結果を先に保存し、その後の案内中に入る状態更新を失わない。 */
export async function commitInnStay(options: InnStayOptions): Promise<GameState | null> {
  const current = options.getGame();
  if (!current) return null;
  const rested = innRest(current, options.max(current), options.inn);
  const state = options.reviewed
    ? applyReward(rested.state, { gold: options.reviewed * 5 }).state
    : rested.state;
  options.setGame(state);
  if (!rested.paid) await options.onFree();
  return state;
}
