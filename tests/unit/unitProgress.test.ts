import { describe, expect, it } from 'vitest';
import {
  canonicalUnitId,
  LEGACY_QUESTION_UNIT_ALIASES,
  LEGACY_UNIT_ALIASES,
} from '../../src/core/learning/unitAliases';
import { aggregateUnitMastery } from '../../src/core/learning/unitProgress';

describe('canonicalUnitId', () => {
  it.each([
    ['sansu.g1.tashizan', 'sansu.g1.tashizan'],
    ['sansu.g1.legacy-math-1-2', 'sansu.g1.tashizan'],
    ['math_1_2', 'sansu.g1.tashizan'],
    ['sansu.g1.unknown-unit', 'sansu.g1.unknown-unit'],
  ])('%s を %s に正規化する', (unitId, expected) => {
    expect(canonicalUnitId(unitId)).toBe(expected);
  });

  it('既存の別名対応表を変更しない', () => {
    const legacyNodesBefore = { ...LEGACY_UNIT_ALIASES };
    const legacyQuestionsBefore = { ...LEGACY_QUESTION_UNIT_ALIASES };

    canonicalUnitId('math_1_2');
    canonicalUnitId('sansu.g1.legacy-math-1-2');

    expect(LEGACY_UNIT_ALIASES).toEqual(legacyNodesBefore);
    expect(LEGACY_QUESTION_UNIT_ALIASES).toEqual(legacyQuestionsBefore);
  });
});

describe('aggregateUnitMastery', () => {
  it('空入力と単独の current / legacy question / raw legacy を正規化する', () => {
    const record = { value: 0.75, n: 4, lastAt: 20 };

    expect(aggregateUnitMastery({})).toEqual({});
    for (const unitId of ['sansu.g1.tashizan', 'sansu.g1.legacy-math-1-2', 'math_1_2']) {
      expect(aggregateUnitMastery({ [unitId]: record })).toEqual({
        'sansu.g1.tashizan': record,
      });
    }
  });

  it('分割された同一進捗を既存の重み付き式で集約する', () => {
    const currentOnly = {
      'sansu.g1.tashizan': { value: 0.75, n: 4, lastAt: 20 },
    };
    const legacyOnly = {
      'sansu.g1.legacy-math-1-2': { value: 0.75, n: 4, lastAt: 20 },
    };
    const mixed = {
      'sansu.g1.tashizan': { value: 0.5, n: 2, lastAt: 10 },
      math_1_2: { value: 1, n: 2, lastAt: 20 },
    };
    const expected = {
      'sansu.g1.tashizan': { value: 0.75, n: 4, lastAt: 20 },
    };

    expect(aggregateUnitMastery(currentOnly)).toEqual(expected);
    expect(aggregateUnitMastery(legacyOnly)).toEqual(expected);
    expect(aggregateUnitMastery(mixed)).toEqual(expected);
  });

  it('未知単元と複数単元を保持し、n === 0 を重み1として扱う', () => {
    expect(
      aggregateUnitMastery({
        'sansu.g1.tashizan': { value: 0.2, n: 0, lastAt: 1 },
        'sansu.g1.legacy-math-1-2': { value: 0.8, n: 0, lastAt: 2 },
        math_1_3: { value: 0.9, n: 3, lastAt: 3 },
        'custom.unknown': { value: 0.4, n: 1, lastAt: 4 },
      }),
    ).toEqual({
      'sansu.g1.tashizan': { value: 0.5, n: 0, lastAt: 2 },
      'sansu.g1.hikizan': { value: 0.9, n: 3, lastAt: 3 },
      'custom.unknown': { value: 0.4, n: 1, lastAt: 4 },
    });
  });

  it('同じ内容に見える複数記録も推測で重複排除しない', () => {
    expect(
      aggregateUnitMastery({
        'sansu.g1.tashizan': { value: 0.6, n: 2, lastAt: 8 },
        math_1_2: { value: 0.6, n: 2, lastAt: 8 },
      }),
    ).toEqual({
      'sansu.g1.tashizan': { value: 0.6, n: 4, lastAt: 8 },
    });
  });

  it('入力を変更せず、返却記録を入力と共有しない', () => {
    const input = {
      'sansu.g1.tashizan': { value: 0.7, n: 3, lastAt: 5 },
      math_1_2: { value: 0.9, n: 1, lastAt: 9 },
    };
    const before = structuredClone(input);
    const result = aggregateUnitMastery(input);

    expect(input).toEqual(before);
    expect(result['sansu.g1.tashizan']).not.toBe(input['sansu.g1.tashizan']);

    result['sansu.g1.tashizan']!.value = 0;
    expect(input).toEqual(before);
  });
});
