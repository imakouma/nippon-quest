import { z } from 'zod/v3';
import type { Subject } from './contracts';

const sourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9.-]*$/),
  title: z.string().min(1),
  authority: z.string().min(1),
  url: z.string().url(),
  subjects: z.array(z.enum(['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo'])).min(1),
  checkedAt: z.string().date(),
});

const approvedReviewSchema = z.object({
  file: z.string().regex(/^questions\/.+\.json$/),
  status: z.literal('approved'),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  reviewer: z.string().min(1),
  reviewedAt: z.string().date(),
  sourceIds: z.array(z.string().min(1)).min(1),
  note: z.string().optional(),
});

/**
 * 学術的正確性は自動判定せず、「誰が・何を根拠に・どの内容を確認したか」を固定する。
 * approved のハッシュが教材ファイルと違えば validate:content が失敗する。
 */
export const academicReviewLedgerSchema = z.object({
  version: z.literal(1),
  policy: z.object({
    owner: z.string().min(1),
    reviewIntervalMonths: z.number().int().positive(),
    changingFactsRequireCurrentSource: z.boolean(),
  }),
  sources: z.array(sourceSchema),
  reviews: z.array(approvedReviewSchema),
});

export type AcademicReviewLedger = z.infer<typeof academicReviewLedgerSchema>;

export type AcademicReviewInvalidReason =
  | 'missing-file'
  | 'duplicate-review'
  | 'hash-mismatch'
  | 'review-expired'
  | 'review-in-future'
  | 'unknown-source'
  | 'source-expired'
  | 'source-in-future'
  | 'source-subject-mismatch';

export interface AcademicReviewTarget {
  file: string;
  sha256: string;
  subjects: readonly Subject[];
}

export interface AcademicReviewAssessment {
  validFiles: string[];
  invalidReviews: Array<{ file: string; reasons: AcademicReviewInvalidReason[] }>;
}

/** 確認日から指定月数が経過したかをUTCの日付単位で判定する。 */
export function isAcademicReviewExpired(
  reviewedAt: string,
  intervalMonths: number,
  now = new Date(),
): boolean {
  const [year, month, day] = reviewedAt.split('-').map(Number);
  const expiresAt = new Date(Date.UTC(year!, month! - 1 + intervalMonths, day!));
  return now.getTime() >= expiresAt.getTime();
}

export function isAcademicReviewDateInFuture(date: string, now = new Date()): boolean {
  const [year, month, day] = date.split('-').map(Number);
  const value = Date.UTC(year!, month! - 1, day!);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return value > today;
}

/**
 * ファイル名だけで承認扱いにせず、内容・期限・出典がすべて現行の記録だけを有効とする。
 * invalidReviews は監査キューと content 検証が同じ理由を表示するための共通結果。
 */
export function assessAcademicReviews(
  ledger: AcademicReviewLedger,
  targets: AcademicReviewTarget[],
  now = new Date(),
): AcademicReviewAssessment {
  const targetByFile = new Map(targets.map((target) => [target.file, target]));
  const sourceById = new Map(ledger.sources.map((source) => [source.id, source]));
  const reviewsByFile = new Map<string, AcademicReviewLedger['reviews']>();
  for (const review of ledger.reviews) {
    const reviews = reviewsByFile.get(review.file) ?? [];
    reviews.push(review);
    reviewsByFile.set(review.file, reviews);
  }
  const validFiles: string[] = [];
  const invalidReviews: AcademicReviewAssessment['invalidReviews'] = [];

  for (const [file, reviews] of reviewsByFile) {
    const reasons = new Set<AcademicReviewInvalidReason>();
    const target = targetByFile.get(file);
    if (!target) reasons.add('missing-file');
    if (reviews.length !== 1) reasons.add('duplicate-review');

    for (const review of reviews) {
      if (target && review.sha256 !== target.sha256) reasons.add('hash-mismatch');
      if (isAcademicReviewDateInFuture(review.reviewedAt, now)) {
        reasons.add('review-in-future');
      }
      if (isAcademicReviewExpired(review.reviewedAt, ledger.policy.reviewIntervalMonths, now)) {
        reasons.add('review-expired');
      }
      const coveredSubjects = new Set<Subject>();
      let hasUnknownSource = false;
      for (const sourceId of review.sourceIds) {
        const source = sourceById.get(sourceId);
        if (!source) {
          reasons.add('unknown-source');
          hasUnknownSource = true;
        } else {
          for (const subject of source.subjects) coveredSubjects.add(subject);
          if (isAcademicReviewDateInFuture(source.checkedAt, now)) {
            reasons.add('source-in-future');
          }
          if (isAcademicReviewExpired(source.checkedAt, ledger.policy.reviewIntervalMonths, now)) {
            reasons.add('source-expired');
          }
        }
      }
      if (!hasUnknownSource && target?.subjects.some((subject) => !coveredSubjects.has(subject))) {
        reasons.add('source-subject-mismatch');
      }
    }

    if (reasons.size === 0) validFiles.push(file);
    else invalidReviews.push({ file, reasons: [...reasons] });
  }

  return {
    validFiles: validFiles.sort(),
    invalidReviews: invalidReviews.sort((a, b) => a.file.localeCompare(b.file)),
  };
}
