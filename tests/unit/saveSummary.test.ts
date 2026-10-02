import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { summarizeSlot } from '../../src/core/state/save';

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
});
