import { describe, expect, it } from 'vitest';
import {
  canonicalUnitId,
  LEGACY_QUESTION_UNIT_ALIASES,
  LEGACY_UNIT_ALIASES,
} from '../../src/core/learning/unitAliases';

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
