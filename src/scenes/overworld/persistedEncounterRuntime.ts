import { discardBattleResume, type ActiveBattleResume } from '../../core/state/battleResume';
import { GAME_PERSISTENCE_PORT_KEY, type GamePersistencePort } from '../../core/state/persistence';
import type { ContentIndex } from '../../core/content/loader';
import type { GameState } from '../../core/state/schema';
import type { BattleEndEvent } from '../battle/contracts';
import type { EncounterContext, EncounterLifecycle } from './encounterLifecycle';

export type PersistedEncounterResumeResult = 'resumed' | 'discarded' | 'busy';

/** 永続戦闘を既存encounter lifecycleへ戻し、field処理完了後だけsnapshotを解放する。 */
export class PersistedEncounterRuntime {
  private finishing: { encounterId: string; promise: Promise<void> } | null = null;

  constructor(
    private readonly lifecycle: EncounterLifecycle,
    private readonly getGame: () => GameState | undefined,
    private readonly persistence: GamePersistencePort,
    private readonly hasEnemy: (enemyId: string) => boolean,
  ) {}

  private context(snapshot: ActiveBattleResume): EncounterContext {
    const { encounterId, encounterSource, ...battle } = snapshot.launch;
    return { id: encounterId, battle, source: encounterSource };
  }

  async resume(snapshot: ActiveBattleResume): Promise<PersistedEncounterResumeResult> {
    if (!this.hasEnemy(snapshot.launch.enemyId)) {
      await this.acknowledge(snapshot.battleId);
      return 'discarded';
    }
    const context = this.context(snapshot);
    if (snapshot.phase.kind === 'settled') {
      const resumed = await this.lifecycle.resumeResult(context, snapshot.phase.result);
      if (resumed) await this.acknowledge(snapshot.battleId);
      return resumed ? 'resumed' : 'busy';
    }
    return (await this.lifecycle.start(context)) ? 'resumed' : 'busy';
  }

  finish(event: BattleEndEvent): Promise<void> {
    if (this.finishing)
      return this.finishing.encounterId === event.encounterId ? this.finishing.promise : Promise.resolve();
    const promise = this.finishOnce(event).finally(() => {
      if (this.finishing?.promise === promise) this.finishing = null;
    });
    this.finishing = { encounterId: event.encounterId, promise };
    return promise;
  }

  private async finishOnce(event: BattleEndEvent): Promise<void> {
    await this.lifecycle.finish(event.encounterId, event.result);
    const active = this.getGame()?.battle.active;
    if (active?.launch.encounterId === event.encounterId && active.phase.kind === 'settled') {
      await this.acknowledge(active.battleId);
    }
  }

  private async acknowledge(battleId: string): Promise<void> {
    const current = this.getGame();
    if (!current) return;
    const next = discardBattleResume(current, battleId);
    if (next !== current) await this.persistence.commit(next);
  }
}

export function createPersistedEncounterRuntime(
  lifecycle: EncounterLifecycle,
  registry: { get(key: string): unknown },
): PersistedEncounterRuntime {
  const persistence = registry.get(GAME_PERSISTENCE_PORT_KEY) as GamePersistencePort | undefined;
  if (!persistence) throw new Error('ゲーム保存portが見つかりません');
  return new PersistedEncounterRuntime(
    lifecycle,
    () => registry.get('game') as GameState | undefined,
    persistence,
    (enemyId) => (registry.get('content') as ContentIndex | undefined)?.monsters.has(enemyId) ?? false,
  );
}
