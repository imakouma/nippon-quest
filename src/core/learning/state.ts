import { z } from 'zod';
import { addProgressValue } from '../../shared/safeInteger';
import type { QuestionConceptLink } from './model';

const safeLearningIntegerSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

export const attemptEventSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1).default('local'),
  questionId: z.string().min(1),
  presentedAt: safeLearningIntegerSchema,
  answeredAt: safeLearningIntegerSchema,
  firstAnswer: z.string().optional(),
  finalAnswer: z.string().optional(),
  score: z.number().min(0).max(1),
  timeMs: safeLearningIntegerSchema,
  attempts: safeLearningIntegerSchema,
  hintsUsed: safeLearningIntegerSchema.default(0),
  timedOut: z.boolean().default(false),
  reason: z.enum(['battle', 'event', 'review', 'diagnosis', 'playground', 'unknown']),
  appVersion: z.string().min(1),
});

export const conceptStateSchema = z.object({
  understanding: z.number().min(0).max(1),
  retention: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  attempts: safeLearningIntegerSchema,
  independentSuccesses: safeLearningIntegerSchema,
  streak: safeLearningIntegerSchema,
  lastSeenAt: safeLearningIntegerSchema,
  lastSuccessAt: safeLearningIntegerSchema.nullable(),
  lastFailureAt: safeLearningIntegerSchema.nullable(),
  dueAt: safeLearningIntegerSchema,
  intervalDays: z.number().positive(),
});

export type AttemptEvent = z.infer<typeof attemptEventSchema>;
export type ConceptState = z.infer<typeof conceptStateSchema>;
export type ConceptStateData = Record<string, ConceptState>;

/** 詳細な解答ログは診断に必要な直近分だけを保持する。概念別の集約値は別途永続化される。 */
export const MAX_ATTEMPT_HISTORY = 5_000;

export function appendAttemptEvent(history: AttemptEvent[], event: AttemptEvent): void {
  history.push(event);
  const excess = history.length - MAX_ATTEMPT_HISTORY;
  if (excess > 0) history.splice(0, excess);
}

export function nextAttemptSequence(history: readonly AttemptEvent[]): number {
  const suffix = history.at(-1)?.id.match(/-(\d+)$/)?.[1];
  if (suffix) {
    const previous = Number(suffix);
    if (Number.isSafeInteger(previous)) return Math.min(Number.MAX_SAFE_INTEGER, previous + 1);
  }
  return history.length;
}

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
  const presentedAt = normalizeLearningInteger(input.presentedAt);
  const answeredAt = normalizeLearningInteger(input.answeredAt);
  return {
    id: `${answeredAt}-${input.questionId}-${input.sequence}`,
    profileId: 'local',
    questionId: input.questionId,
    presentedAt,
    answeredAt,
    ...(finalAnswer
      ? { finalAnswer, ...(input.result.attempts === 1 ? { firstAnswer: finalAnswer } : {}) }
      : {}),
    score: input.result.score,
    timeMs: normalizeLearningInteger(input.result.timeMs),
    attempts: normalizeLearningInteger(input.result.attempts),
    hintsUsed: normalizeLearningInteger(input.result.detail?.hintsUsed),
    timedOut: input.result.timedOut ?? false,
    reason: input.reason,
    appVersion: input.appVersion,
  };
}

const DAY = 86_400_000;

export function initialConceptState(now: number): ConceptState {
  const safeNow = normalizeLearningInteger(now);
  return {
    understanding: 0,
    retention: 0,
    confidence: 0,
    attempts: 0,
    independentSuccesses: 0,
    streak: 0,
    lastSeenAt: safeNow,
    lastSuccessAt: null,
    lastFailureAt: null,
    dueAt: safeNow,
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
    const streak = success ? addProgressValue(prev.streak, 1) : 0;
    const intervalDays = success ? Math.min(60, Math.max(1, prev.intervalDays * (independent ? 2 : 1.4))) : 1;
    const intervalMs = normalizeLearningInteger(intervalDays * DAY);
    const retention = success
      ? clamp(prev.retention + 0.18 * (1 - prev.retention))
      : clamp(prev.retention * 0.65);
    const attempts = addProgressValue(prev.attempts, 1);
    next[mapped.conceptId] = {
      understanding,
      retention,
      confidence: clamp(1 - Math.exp(-attempts / 4)),
      attempts,
      independentSuccesses: addProgressValue(prev.independentSuccesses, success && independent ? 1 : 0),
      streak,
      lastSeenAt: attempt.answeredAt,
      lastSuccessAt: success ? attempt.answeredAt : prev.lastSuccessAt,
      lastFailureAt: success ? prev.lastFailureAt : attempt.answeredAt,
      dueAt: addProgressValue(attempt.answeredAt, intervalMs),
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

function normalizeLearningInteger(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.round(value)));
}

function serializedAnswer(detail?: Record<string, unknown>): string | undefined {
  if (!detail) return undefined;
  for (const key of ['chosen', 'values', 'picks', 'prediction', 'value']) {
    const value = detail[key];
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) {
      try {
        return JSON.stringify(value);
      } catch {
        // 分析用の回答詳細が壊れていても、スコアや学習履歴は記録する。
      }
    }
  }
  return undefined;
}
