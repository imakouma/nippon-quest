import { z } from 'zod';

export const conceptKindSchema = z.enum([
  'concept',
  'skill',
  'fact',
  'procedure',
  'reading',
  'misconception',
]);

export const relationKindSchema = z.enum([
  'prerequisite',
  'component',
  'related',
  'causal',
  'chronological',
  'spatial',
  'category',
  'contrast',
  'transfer',
]);

const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.string().url(),
  published: z.string().min(1),
  checkedAt: z.string().date(),
  locator: z.string().min(1),
});

export const conceptSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9.-]*$/),
  subject: z.enum(['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo']),
  grade: z.number().int().min(1).max(6),
  unit: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  kind: conceptKindSchema,
  memoryType: z.enum(['fact', 'concept', 'procedure', 'mixed']),
  curriculumCodes: z
    .array(z.string().regex(/^82[A-Z0-9]{14}$/, '小学校学習指導要領コードは16桁です'))
    .default([]),
  recommendedWindow: z
    .object({
      stage: z.enum(['early', 'middle', 'late', 'variable']),
      fromMonth: z.number().int().min(1).max(12).optional(),
      toMonth: z.number().int().min(1).max(12).optional(),
      status: z.enum(['official', 'reference', 'unverified']),
      note: z.string().min(1),
    })
    .optional(),
  sourceIds: z.array(z.string().min(1)).min(1),
  review: z.object({
    status: z.enum(['draft', 'source-checked', 'expert-reviewed']),
    reviewedAt: z.string().date().optional(),
    reviewer: z.string().min(1).optional(),
  }),
});

export const conceptRelationSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  kind: relationKindSchema,
  strength: z.number().min(0).max(1).default(1),
  rationale: z.string().min(1),
  sourceIds: z.array(z.string().min(1)).default([]),
  reviewStatus: z.enum(['draft', 'source-checked', 'expert-reviewed']),
});

export const questionConceptLinkSchema = z.object({
  questionId: z.string().min(1),
  concepts: z
    .array(
      z.object({
        conceptId: z.string().min(1),
        weight: z.number().positive().max(1),
        role: z.enum(['primary', 'supporting', 'reading']),
      }),
    )
    .min(1),
  diagnosticValue: z.number().min(0).max(1),
  reviewStatus: z.enum(['draft', 'source-checked', 'expert-reviewed']),
  misconceptionSignals: z
    .array(
      z.object({
        answerId: z.string().min(1),
        conceptId: z.string().min(1),
        confidence: z.number().min(0).max(1),
        rationale: z.string().min(1),
      }),
    )
    .default([]),
});

export const curriculumGraphSchema = z.object({
  schemaVersion: z.literal(1),
  sources: z.array(sourceSchema).min(1),
  concepts: z.array(conceptSchema).min(1),
  relations: z.array(conceptRelationSchema),
  questionLinks: z.array(questionConceptLinkSchema).default([]),
});

export type CurriculumGraph = z.infer<typeof curriculumGraphSchema>;
export type Concept = z.infer<typeof conceptSchema>;
export type ConceptRelation = z.infer<typeof conceptRelationSchema>;
export type QuestionConceptLink = z.infer<typeof questionConceptLinkSchema>;
