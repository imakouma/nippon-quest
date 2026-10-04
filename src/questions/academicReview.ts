import { z } from 'zod';

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
