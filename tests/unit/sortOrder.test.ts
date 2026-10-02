import { describe, expect, it } from 'vitest';
import { sortOrderPayloadSchema, sortOrderScore } from '../../src/questions/renderers/sort-order/schema';

describe('sort-order', () => {
  it('正しい位置の割合を返す', () =>
    expect(sortOrderScore(['a', 'c', 'b'], ['a', 'b', 'c'])).toBeCloseTo(1 / 3));
  it('存在しない・重複した答えを拒否する', () =>
    expect(() =>
      sortOrderPayloadSchema.parse({
        prompt: 'p',
        cards: [
          { id: 'a', text: 'A' },
          { id: 'b', text: 'B' },
        ],
        answer: ['a', 'a'],
      }),
    ).toThrow());
});
