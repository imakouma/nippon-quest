import { describe, expect, it } from 'vitest';
import { shouldCelebrateNewRecruit } from '../../src/scenes/battle/newDexCelebration';

describe('図鑑への新規登録演出', () => {
  it('新種を仲間にした場合だけ表示する', () => {
    expect(shouldCelebrateNewRecruit('recruited', 'apple', [])).toBe(true);
    expect(shouldCelebrateNewRecruit('recruited', 'apple', ['apple'])).toBe(false);
    expect(shouldCelebrateNewRecruit('victory', 'apple', [])).toBe(false);
    expect(shouldCelebrateNewRecruit('fled', 'apple', [])).toBe(false);
  });
});
