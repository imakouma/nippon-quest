/** バトル結果をバッグ編成まで反映する純粋な後処理。Scene は通知の表示だけを担当する。 */
import type { ContentIndex } from '../content/loader';
import { partyFromGameState } from '../battle/setup';
import {
  applyBattleResult,
  heroLevel,
  levelForXp,
  type AppliedBattle,
  type BattleSummary,
} from './battleResult';
import { bagCapacity, bagContext, stowNewMonster } from './bag';
import type { GameState } from '../state/schema';
import { checkpointBattleResume, type PersistedBattleEndPayload } from '../state/battleResume';

export interface BattleSettlement {
  state: AppliedBattle['state'];
  level: { before: number; after: number; bagCapacity: number; bagGrew: boolean };
  monsterLevelUps: { uid: string; before: number; after: number }[];
  recruitStored: boolean;
}

export interface CappedLevelSync {
  state: GameState;
  level: { before: number; after: number };
  monsterLevelUps: { uid: string; before: number; after: number }[];
}

export interface BattleSettlementDecision {
  applied: boolean;
  state: GameState;
  settlement: BattleSettlement | null;
  goldLost: number;
  result: PersistedBattleEndPayload | null;
}

const scaledResource = (current: number, oldMaximum: number, newMaximum: number, minimum: number) =>
  Math.max(minimum, Math.min(newMaximum, Math.round((current / Math.max(1, oldMaximum)) * newMaximum)));

export function syncCappedLevels(
  previous: GameState,
  next: GameState,
  content: ContentIndex,
): CappedLevelSync {
  const before = heroLevel(previous, content.xp.hero);
  const after = heroLevel(next, content.xp.hero);
  let state = next;
  if (state.player.level !== after) {
    state = { ...state, player: { ...state.player, level: after } };
  }
  if (after > before) {
    const oldStats = partyFromGameState(previous, content).hero.stats;
    const newStats = partyFromGameState(state, content).hero.stats;
    state = {
      ...state,
      player: {
        ...state.player,
        hp: scaledResource(state.player.hp, oldStats.hp, newStats.hp, 1),
        mp: scaledResource(state.player.mp, oldStats.mp, newStats.mp, 0),
      },
    };
  }

  const previousLevels = new Map(previous.party.owned.map((monster) => [monster.uid, monster.level]));
  const monsterLevelUps: CappedLevelSync['monsterLevelUps'] = [];
  const owned = state.party.owned.map((monster) => {
    const level = Math.max(monster.level, levelForXp(content.xp.monster, monster.xp, monster.levelCap));
    const oldLevel = previousLevels.get(monster.uid) ?? monster.level;
    if (level > oldLevel) monsterLevelUps.push({ uid: monster.uid, before: oldLevel, after: level });
    return level === monster.level ? monster : { ...monster, level };
  });
  if (owned.some((monster, index) => monster !== state.party.owned[index])) {
    state = { ...state, party: { ...state.party, owned } };
  }
  return { state, level: { before, after }, monsterLevelUps };
}

export function settleBattleBag(
  previous: AppliedBattle['state'],
  applied: AppliedBattle,
  content: ContentIndex,
): BattleSettlement {
  let state = applied.state;
  let recruitStored = false;
  if (applied.newMonsterUid) {
    const joined = state.party.owned.find((monster) => monster.uid === applied.newMonsterUid);
    const speciesInitialLevelCap = joined
      ? content.monsters.get(joined.monsterId)?.initialLevelCap
      : undefined;
    if (joined && speciesInitialLevelCap && joined.levelCap < speciesInitialLevelCap) {
      state = {
        ...state,
        party: {
          ...state.party,
          owned: state.party.owned.map((monster) =>
            monster.uid === joined.uid ? { ...monster, levelCap: speciesInitialLevelCap } : monster,
          ),
        },
      };
    }
  }
  const synced = syncCappedLevels(previous, state, content);
  state = synced.state;
  if (applied.newMonsterUid) {
    const stow = stowNewMonster(state, applied.newMonsterUid, bagContext(state, content));
    state = stow.state;
    recruitStored = !stow.inBag;
  }
  const capacity = bagCapacity(synced.level.after, content.settings.bag);
  return {
    state,
    level: {
      ...synced.level,
      bagCapacity: capacity,
      bagGrew: capacity > bagCapacity(synced.level.before, content.settings.bag),
    },
    monsterLevelUps: synced.monsterLevelUps,
    recruitStored,
  };
}

/**
 * 永続 battleId/sequence を guard にして、戦闘結果と完了台帳を同じ state へ一度だけ反映する。
 * 保存再試行や遅延した Scene event は no-op になり、最新の学習・プレイ時間更新を基底に保つ。
 */
export function settleBattleOnce(
  previous: GameState,
  input: { battleId: string; sequence: number; summary: BattleSummary },
  content: ContentIndex,
  now = Date.now(),
): BattleSettlementDecision {
  const active = previous.battle.active;
  const duplicateResult =
    active?.battleId === input.battleId && active.phase.kind === 'settled' ? active.phase.result : null;
  if (
    !active ||
    active.battleId !== input.battleId ||
    active.sequence !== input.sequence ||
    active.sequence <= previous.battle.finalizedThrough ||
    active.phase.kind !== 'awaiting-result' ||
    active.battleState.outcome !== input.summary.outcome
  ) {
    return {
      applied: false,
      state: previous,
      settlement: null,
      goldLost: duplicateResult?.goldLost ?? 0,
      result: duplicateResult,
    };
  }

  const applied = applyBattleResult(previous, input.summary, content.settings, now);
  const settled = settleBattleBag(previous, applied, content);
  const result: PersistedBattleEndPayload = {
    outcome: input.summary.outcome,
    goldLost: applied.goldLost,
  };
  const withSettledPhase = checkpointBattleResume(settled.state, input.battleId, {
    battleState: active.battleState,
    questionRngState: active.questionRngState,
    perfectBySubject: active.perfectBySubject,
    phase: { kind: 'settled', result },
  });
  const state: GameState = {
    ...withSettledPhase,
    battle: {
      ...withSettledPhase.battle,
      finalizedThrough: active.sequence,
    },
  };
  return {
    applied: true,
    state,
    settlement: { ...settled, state },
    goldLost: applied.goldLost,
    result,
  };
}
