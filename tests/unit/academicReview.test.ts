import { describe, expect, it } from 'vitest';
import {
  assessAcademicReviews,
  isAcademicReviewExpired,
  type AcademicReviewLedger,
} from '../../src/questions/academicReview';

describe('学術レビューの期限', () => {
  it('確認日から指定月数に達するまでは有効', () => {
    expect(isAcademicReviewExpired('2025-10-03', 12, new Date('2026-10-02T23:59:59Z'))).toBe(false);
  });

  it('指定月数に達した日から再レビュー対象', () => {
    expect(isAcademicReviewExpired('2025-10-03', 12, new Date('2026-10-03T00:00:00Z'))).toBe(true);
  });

  it('月末をまたぐ確認期限もUTC日付で判定する', () => {
    expect(isAcademicReviewExpired('2024-02-29', 12, new Date('2025-03-01T00:00:00Z'))).toBe(true);
  });
});

const target = {
  file: 'questions/sansu/g1/sample.json',
  sha256: 'a'.repeat(64),
  subjects: ['sansu'] as const,
};
const validLedger: AcademicReviewLedger = {
  version: 1,
  policy: {
    owner: '教材レビュー担当',
    reviewIntervalMonths: 12,
    changingFactsRequireCurrentSource: true,
  },
  sources: [
    {
      id: 'mext',
      title: '学習指導要領',
      authority: '文部科学省',
      url: 'https://example.test/mext',
      subjects: ['sansu'],
      checkedAt: '2026-10-01',
    },
  ],
  reviews: [
    {
      file: target.file,
      status: 'approved',
      sha256: target.sha256,
      reviewer: '確認者',
      reviewedAt: '2026-10-02',
      sourceIds: ['mext'],
    },
  ],
};

describe('学術レビューの有効性判定', () => {
  const now = new Date('2026-10-22T00:00:00Z');

  it('現行ハッシュと有効な出典を持つ期限内レビューだけを承認済みにする', () => {
    expect(assessAcademicReviews(validLedger, [target], now)).toEqual({
      validFiles: [target.file],
      invalidReviews: [],
    });
  });

  it.each([
    ['内容変更', { reviews: [{ ...validLedger.reviews[0]!, sha256: 'b'.repeat(64) }] }, 'hash-mismatch'],
    [
      'レビュー期限切れ',
      { reviews: [{ ...validLedger.reviews[0]!, reviewedAt: '2025-10-01' }] },
      'review-expired',
    ],
    ['未知の出典', { reviews: [{ ...validLedger.reviews[0]!, sourceIds: ['unknown'] }] }, 'unknown-source'],
    [
      '出典確認期限切れ',
      { sources: [{ ...validLedger.sources[0]!, checkedAt: '2025-10-01' }] },
      'source-expired',
    ],
    [
      '未来日のレビュー',
      { reviews: [{ ...validLedger.reviews[0]!, reviewedAt: '2026-10-23' }] },
      'review-in-future',
    ],
    [
      '未来日に確認した出典',
      { sources: [{ ...validLedger.sources[0]!, checkedAt: '2026-10-23' }] },
      'source-in-future',
    ],
    [
      '対象教科を扱わない出典',
      {
        sources: [
          {
            ...validLedger.sources[0]!,
            subjects: ['kokugo'],
          } satisfies AcademicReviewLedger['sources'][number],
        ],
      },
      'source-subject-mismatch',
    ],
  ])('%sは未承認へ戻す', (_name, override, reason) => {
    const result = assessAcademicReviews({ ...validLedger, ...override }, [target], now);
    expect(result.validFiles).toEqual([]);
    expect(result.invalidReviews).toEqual([{ file: target.file, reasons: [reason] }]);
  });

  it('重複した承認記録は未承認へ戻す', () => {
    const result = assessAcademicReviews(
      { ...validLedger, reviews: [...validLedger.reviews, validLedger.reviews[0]!] },
      [target],
      now,
    );
    expect(result.validFiles).toEqual([]);
    expect(result.invalidReviews).toEqual([{ file: target.file, reasons: ['duplicate-review'] }]);
  });

  it('存在しない問題ファイルの承認記録を無効にする', () => {
    const result = assessAcademicReviews(validLedger, [], now);
    expect(result.invalidReviews).toEqual([{ file: target.file, reasons: ['missing-file'] }]);
  });
});
