import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { recoverState, summarizeSlot } from '../../src/core/state/save';

describe('セーブスロット概要', () => {
  it('壊れたセーブを続行可能にしない', () => {
    const state = createNewGame({ name: 'ハル', starterMonsterId: 'aomori-ringoron', grade: 3 });
    const broken = { ...state, progress: undefined };
    expect(summarizeSlot(2, broken)).toEqual({ slot: 2, exists: false, corrupted: true });
  });

  it('正常なセーブは安全に検証して概要を返す', () => {
    const state = createNewGame({ name: 'ハル', starterMonsterId: 'aomori-ringoron', grade: 3 });
    expect(summarizeSlot(1, state)).toMatchObject({ slot: 1, exists: true, name: 'ハル' });
  });

  it('主データが壊れていれば正常なバックアップから復旧する', () => {
    const backup = createNewGame({ name: 'バックアップ', starterMonsterId: 'aomori-ringoron', grade: 2 });
    const broken = { ...backup, progress: undefined };
    expect(recoverState(broken, backup)).toEqual({ state: backup, recovered: true });
    expect(summarizeSlot(3, broken, backup)).toMatchObject({
      slot: 3,
      exists: true,
      recovered: true,
      name: 'バックアップ',
    });
  });

  it('主データが正常なら古いバックアップより主データを優先する', () => {
    const current = createNewGame({ name: 'いま', starterMonsterId: 'aomori-ringoron', grade: 3 });
    const backup = createNewGame({ name: 'むかし', starterMonsterId: 'aomori-ringoron', grade: 2 });
    expect(recoverState(current, backup)).toEqual({ state: current, recovered: false });
  });
});
