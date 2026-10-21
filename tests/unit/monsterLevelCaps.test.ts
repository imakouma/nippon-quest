import { describe, expect, it } from 'vitest';
import { suggestInitialLevelCap } from '../../scripts/set-monster-level-caps';

describe('モンスター初期上限の提案', () => {
  it('持っている技の最小学年を10倍する', () => {
    expect(
      suggestInitialLevelCap(
        { id: 'test', area: 'late-area', skills: ['g4-skill', 'g2-skill'] },
        new Map([
          ['g4-skill', 4],
          ['g2-skill', 2],
        ]),
        new Map([['late-area', 5]]),
      ),
    ).toBe(20);
  });

  it('技がないときは所属地方の推奨学年下限を使う', () => {
    expect(
      suggestInitialLevelCap(
        { id: 'test', area: 'grade-four-area', skills: [] },
        new Map(),
        new Map([['grade-four-area', 4]]),
      ),
    ).toBe(40);
  });
});
