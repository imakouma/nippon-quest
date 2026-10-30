import { z } from 'zod/v3';
import type { ContentKind } from './schemas';

export interface QuestionCatalog {
  version: 1;
  maxQuestionsPerSet: 30;
  totalQuestions: number;
  subjects: Array<{
    subject: 'kokugo' | 'sansu' | 'rika' | 'shakai' | 'seikatsu' | 'eigo';
    count: number;
    grades: Array<{
      grade: 1 | 2 | 3 | 4 | 5 | 6;
      count: number;
      units: Array<{
        unit: string;
        slug: string;
        count: number;
        sets: Array<{ file: string; count: number; types: string[] }>;
      }>;
    }>;
  }>;
}

export interface ContentManifest {
  generatedAt: string;
  files: Record<ContentKind, string[]>;
  questions: string[];
  /** Playground の ?q= 直リンクで全問題を読み込まず、該当ファイルだけ取得する索引。 */
  questionIndex?: Record<string, string>;
  /** ゲーム開始時に選択学年だけ読み込むための索引。 */
  questionFilesByGrade?: Record<string, string[]>;
  /** 問題を全件読まず、教科・学年・単元・セットをたどるための生成カタログ。 */
  questionCatalog?: QuestionCatalog;
}

export const contentManifestSchema = z.object({
  generatedAt: z.string(),
  files: z.record(z.array(z.string().min(1))),
  questions: z.array(z.string().min(1)),
  questionIndex: z.record(z.string().min(1)).optional(),
  questionFilesByGrade: z.record(z.array(z.string().min(1))).optional(),
  questionCatalog: z
    .object({
      version: z.literal(1),
      maxQuestionsPerSet: z.literal(30),
      totalQuestions: z.number().int().nonnegative(),
      subjects: z.array(
        z.object({
          subject: z.enum(['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo']),
          count: z.number().int().nonnegative(),
          grades: z.array(
            z.object({
              grade: z.union([
                z.literal(1),
                z.literal(2),
                z.literal(3),
                z.literal(4),
                z.literal(5),
                z.literal(6),
              ]),
              count: z.number().int().nonnegative(),
              units: z.array(
                z.object({
                  unit: z.string().regex(/^(kokugo|sansu|rika|shakai|seikatsu|eigo)\.g[1-6]\.[a-z0-9-]+$/),
                  slug: z.string().regex(/^[a-z0-9-]+$/),
                  count: z.number().int().positive(),
                  sets: z.array(
                    z.object({
                      file: z.string().regex(/^questions\/.+\.json$/),
                      count: z.number().int().positive().max(30),
                      types: z.array(z.string().min(1)),
                    }),
                  ),
                }),
              ),
            }),
          ),
        }),
      ),
    })
    .optional(),
});
