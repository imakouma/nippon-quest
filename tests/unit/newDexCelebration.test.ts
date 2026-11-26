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

it('実際の図鑑の順番に沿って新しい枠と前後の登録数を示す', async () => {
  const { buildDexPage } = await import('../../src/scenes/battle/newDexCelebration');
  const entries = Array.from({ length: 13 }, (_, index) => ({
    id: `m${index + 1}`,
    known: index === 0 || index === 6,
  }));
  const page = buildDexPage(entries, 'm8');
  expect(page).toEqual({
    before: 2,
    after: 3,
    total: 13,
    slots: [
      { id: 'm7', number: 7, known: true, target: false },
      { id: 'm8', number: 8, known: false, target: true },
      { id: 'm9', number: 9, known: false, target: false },
      { id: 'm10', number: 10, known: false, target: false },
      { id: 'm11', number: 11, known: false, target: false },
      { id: 'm12', number: 12, known: false, target: false },
    ],
  });
  expect(buildDexPage(entries, 'missing')).toBeNull();
  expect(buildDexPage(entries, 'm7')).toBeNull();
});
