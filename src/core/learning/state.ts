import { z } from 'zod';
import type { QuestionConceptLink } from './model';

export const attemptEventSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1).default('local'),
  questionId: z.string().min(1),
  presentedAt: z.number().int().nonnegative(),
  answeredAt: z.number().int().nonnegative(),
  firstAnswer: z.string().optional(),
  finalAnswer: z.string().optional(),
  score: z.number().min(0).max(1),
  timeMs: z.number().int().nonnegative(),
  attempts: z.number().int().nonnegative(),
  hintsUsed: z.number().int().nonnegative().default(0),
  timedOut: z.boolean().default(false),
  reason: z.enum(['battle', 'event', 'review', 'diagnosis', 'playground', 'unknown']),
  appVersion: z.string().min(1),
});

export const conceptStateSchema = z.object({
  understanding: z.number().min(0).max(1),
  retention: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  attempts: z.number().int().nonnegative(),
  independentSuccesses: z.number().int().nonnegative(),
  streak: z.number().int().nonnegative(),
  lastSeenAt: z.number().int().nonnegative(),
  lastSuccessAt: z.number().int().nonnegative().nullable(),
  lastFailureAt: z.number().int().nonnegative().nullable(),
  dueAt: z.number().int().nonnegative(),
  intervalDays: z.number().positive(),
});

export type AttemptEvent = z.infer<typeof attemptEventSchema>;
export type ConceptState = z.infer<typeof conceptStateSchema>;
export type ConceptStateData = Record<string, ConceptState>;

interface AttemptResultInput {
  score: number;
  timeMs: number;
  attempts: number;
  timedOut?: boolean;
  detail?: Record<string, unknown>;
}

export function createAttemptEvent(input: {
  questionId: string;
  result: AttemptResultInput;
  presentedAt: number;
  answeredAt: number;
  sequence: number;
  reason: AttemptEvent['reason'];
  appVersion: string;
}): AttemptEvent {
  const finalAnswer = serializedAnswer(input.result.detail);
  return {
    id: `${input.answeredAt}-${input.questionId}-${input.sequence}`,
    profileId: 'local',
    questionId: input.questionId,
    presentedAt: input.presentedAt,
    answeredAt: input.answeredAt,
    ...(finalAnswer
      ? { finalAnswer, ...(input.result.attempts === 1 ? { firstAnswer: finalAnswer } : {}) }
      : {}),
    score: input.result.score,
    timeMs: Math.max(0, Math.round(input.result.timeMs)),
    attempts: Math.max(0, Math.round(input.result.attempts)),
    hintsUsed: Number(input.result.detail?.hintsUsed ?? 0),
    timedOut: input.result.timedOut ?? false,
    reason: input.reason,
    appVersion: input.appVersion,
  };
}

const DAY = 86_400_000;

export function initialConceptState(now: number): ConceptState {
  return {
    understanding: 0,
    retention: 0,
    confidence: 0,
    attempts: 0,
    independentSuccesses: 0,
    streak: 0,
    lastSeenAt: now,
    lastSuccessAt: null,
    lastFailureAt: null,
    dueAt: now,
    intervalDays: 1,
  };
}

/** 説明可能な初期アルゴリズム。学習データが貯まるまでは決定論的に保つ。 */
export function applyAttemptToConcepts(
  current: ConceptStateData,
  attempt: AttemptEvent,
  link: QuestionConceptLink,
): ConceptStateData {
  const next = { ...current };
  for (const mapped of link.concepts) {
    const prev = next[mapped.conceptId] ?? initialConceptState(attempt.answeredAt);
    const independent = attempt.hintsUsed === 0 && attempt.attempts === 1 && !attempt.timedOut;
    const evidence = attempt.score * (independent ? 1 : 0.75);
    const alpha = Math.min(0.4, 0.18 + mapped.weight * 0.22);
    const understanding = clamp(prev.understanding + alpha * (evidence - prev.understanding));
    const success = attempt.score >= 0.8;
    const streak = success ? prev.streak + 1 : 0;
    const intervalDays = success ? Math.min(60, Math.max(1, prev.intervalDays * (independent ? 2 : 1.4))) : 1;
    const retention = success
      ? clamp(prev.retention + 0.18 * (1 - prev.retention))
      : clamp(prev.retention * 0.65);
    const attempts = prev.attempts + 1;
    next[mapped.conceptId] = {
      understanding,
      retention,
      confidence: clamp(1 - Math.exp(-attempts / 4)),
      attempts,
      independentSuccesses: prev.independentSuccesses + (success && independent ? 1 : 0),
      streak,
      lastSeenAt: attempt.answeredAt,
      lastSuccessAt: success ? attempt.answeredAt : prev.lastSuccessAt,
      lastFailureAt: success ? prev.lastFailureAt : attempt.answeredAt,
      dueAt: attempt.answeredAt + intervalDays * DAY,
      intervalDays,
    };
  }
  return next;
}

export function estimatedRetention(state: ConceptState, now: number): number {
  const elapsedDays = Math.max(0, now - state.lastSeenAt) / DAY;
  return clamp(state.retention * Math.exp(-elapsedDays / Math.max(1, state.intervalDays)));
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function serializedAnswer(detail?: Record<string, unknown>): string | undefined {
  if (!detail) return undefined;
  for (const key of ['chosen', 'values', 'picks', 'prediction', 'value']) {
    const value = detail[key];
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return JSON.stringify(value);
  }
  return undefined;
}
