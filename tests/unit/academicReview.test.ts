import { describe, expect, it } from 'vitest';
import { isAcademicReviewExpired } from '../../src/questions/academicReview';

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
