import { describe, expect, it } from 'vitest';
import { bulkPromotable } from '../../scripts/promote-legacy-bulk';
import type { StagedLegacyQuestion } from '../../scripts/import-legacy-questions';

describe('旧問題の一括昇格', () => {
  it('視覚依存を除外し legacy メタデータを本番へ持ち込まない', () => {
    const base = {
      id: 'legacy.sansu.g1.x.1',
      type: 'text-input',
      subject: 'sansu',
      grade: 1,
      unit: 'sansu.g1.legacy-math-1-1',
      tags: [],
      payload: { prompt: '1+1', answers: ['2'] },
      legacy: {
        source: 'autonomy-game',
        nodeId: 'math_1_1',
        sourceIndex: 0,
        fingerprint: 'x',
        reviewStatus: 'unreviewed',
        reviewFlags: [],
      },
    } as StagedLegacyQuestion;
    expect(
      bulkPromotable([
        base,
        {
          ...base,
          id: 'legacy.sansu.g1.x.2',
          legacy: { ...base.legacy, reviewFlags: ['external-visual-context'] },
        },
      ]),
    ).toEqual([expect.not.objectContaining({ legacy: expect.anything() })]);
  });
});
