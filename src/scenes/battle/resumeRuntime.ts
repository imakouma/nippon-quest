import type { ContentIndex } from '../../core/content/loader';
import { settleBattleOnce, type BattleSettlementDecision } from '../../core/progression/battleSettlement';
import type { BattleSummary } from '../../core/progression/battleResult';
import {
  beginBattleResume,
  checkpointBattleResume,
  discardBattleResume,
  type ActiveBattleResume,
  type BattleResumePhase,
  type PersistedBattleLaunch,
} from '../../core/state/battleResume';
import type { GamePersistencePort } from '../../core/state/persistence';
import type { GameState } from '../../core/state/schema';
import type { BattleEvent, BattleState, Command } from '../../core/battle/types';

/** resolved-commandを先に保存し、演出完了までは次のcheckpointを書かない。 */
export async function runCheckpointedBattleCommand(input: {
  command: Command;
  persistResolved: boolean;
  checkpointResolved(command: Command): Promise<void>;
  resolve(): { state: BattleState; events: BattleEvent[] };
  present(events: BattleEvent[]): Promise<void>;
  checkpointSafe(state: BattleState): Promise<void>;
}): Promise<BattleState> {
  if (input.persistResolved) await input.checkpointResolved(input.command);
  const resolved = input.resolve();
  await input.present(resolved.events);
  await input.checkpointSafe(resolved.state);
  return resolved.state;
}

export class BattleResumeRuntime {
  constructor(
    private readonly getGame: () => GameState,
    private readonly persistence: GamePersistencePort,
  ) {}

  async initialize(input: {
    launch: PersistedBattleLaunch;
    battleState: BattleState;
    questionSeed: string;
    questionRngState: unknown;
    perfectBySubject: Readonly<Record<string, number>>;
  }): Promise<{ snapshot: ActiveBattleResume; resumed: boolean }> {
    const current = this.getGame();
    const active = current.battle.active;
    if (active && active.launch.encounterId === input.launch.encounterId && active.phase.kind !== 'settled') {
      return { snapshot: active, resumed: true };
    }
    const started = beginBattleResume(current, input);
    await this.persistence.commit(started.state);
    return { snapshot: started.snapshot, resumed: false };
  }

  async checkpoint(
    battleId: string,
    input: {
      battleState: BattleState;
      questionRngState: unknown;
      perfectBySubject: Readonly<Record<string, number>>;
      phase: BattleResumePhase;
    },
  ): Promise<GameState> {
    const current = this.getGame();
    const next = checkpointBattleResume(current, battleId, input);
    if (next !== current) await this.persistence.commit(next);
    return next;
  }

  async settle(
    battleId: string,
    sequence: number,
    summary: BattleSummary,
    content: ContentIndex,
  ): Promise<BattleSettlementDecision> {
    const decision = settleBattleOnce(this.getGame(), { battleId, sequence, summary }, content);
    // duplicate settlementでも、直前の保存失敗を同じstateで再試行できる。
    if (decision.result) await this.persistence.commit(decision.state);
    return decision;
  }

  async discard(battleId: string): Promise<GameState> {
    const current = this.getGame();
    const next = discardBattleResume(current, battleId);
    if (next !== current) await this.persistence.commit(next);
    return next;
  }
}
