import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  applyAttemptToConcepts,
  attemptEventSchema,
  conceptStateSchema,
  createAttemptEvent,
  diagnosisCandidates,
  dueReviewQuestions,
  estimatedRetention,
  initialConceptState,
  pickDiagnosticQuestion,
  validateCurriculumGraph,
  type AttemptEvent,
} from '../../src/core/learning';
import { stripRuby } from '../../src/ui/ruby';

const path = fileURLToPath(new URL('../../content/curriculum/sansu-g1-foundations.json', import.meta.url));
const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
const result = validateCurriculumGraph(raw);
if (!result.graph) throw new Error(result.errors.join('\n'));
const graph = result.graph;

const attempt = (over: Partial<AttemptEvent> = {}): AttemptEvent => ({
  id: 'attempt-1',
  profileId: 'local',
  questionId: 'sansu.g1.tashizan.0002',
  presentedAt: 1_000,
  answeredAt: 5_000,
  score: 1,
  timeMs: 4_000,
  attempts: 1,
  hintsUsed: 0,
  timedOut: false,
  reason: 'diagnosis',
  appVersion: 'test',
  ...over,
});

describe('学習知識グラフ', () => {
  it('小学1年算数のグラフは参照切れ・循環なしで検証できる', () => {
    expect(result.errors).toEqual([]);
    expect(graph.concepts.length).toBeGreaterThanOrEqual(8);
    expect(graph.questionLinks.length).toBeGreaterThanOrEqual(9);
    expect(
      graph.concepts
        .filter((concept) => concept.kind !== 'misconception')
        .every((concept) => concept.curriculumCodes.length > 0),
    ).toBe(true);
  });

  it('存在しない概念参照と prerequisite 循環を拒否する', () => {
    const broken = structuredClone(graph);
    broken.relations.push({
      from: 'sansu.g1.addition.single-digit',
      to: 'sansu.g1.number.compose-decompose',
      kind: 'prerequisite',
      strength: 1,
      rationale: 'テスト用循環',
      sourceIds: [],
      reviewStatus: 'draft',
    });
    const firstLink = broken.questionLinks[0];
    const firstConcept = firstLink?.concepts[0];
    if (!firstConcept) throw new Error('テスト用の questionLink/concept がありません');
    firstConcept.conceptId = 'missing';
    const checked = validateCurriculumGraph(broken);
    expect(checked.errors.some((error) => error.includes('存在しません'))).toBe(true);
    expect(checked.errors.some((error) => error.includes('cycle'))).toBe(true);
  });
});

describe('概念別学習状態', () => {
  const link = graph.questionLinks.find((item) => item.questionId === 'sansu.g1.tashizan.0002')!;
  const primaryConceptId = link.concepts[0]!.conceptId;

  it('独力正解で理解・定着・復習間隔が上がる', () => {
    const states = applyAttemptToConcepts({}, attempt(), link);
    const state = states[primaryConceptId]!;
    expect(state.understanding).toBeGreaterThan(0);
    expect(state.retention).toBeGreaterThan(0);
    expect(state.independentSuccesses).toBe(1);
    expect(state.dueAt).toBeGreaterThan(5_000);
  });

  it('ヒント付き正解は独力正解として数えない', () => {
    const states = applyAttemptToConcepts({}, attempt({ hintsUsed: 1, attempts: 2 }), link);
    expect(states[primaryConceptId]!.independentSuccesses).toBe(0);
  });

  it('ヒント付き正解の復習期限を整数ミリ秒で保存できる', () => {
    const states = applyAttemptToConcepts({}, attempt({ hintsUsed: 1, attempts: 2 }), link);
    const state = states[primaryConceptId]!;

    expect(state.dueAt).toBe(5_000 + Math.round(1.4 * 86_400_000));
    expect(Number.isSafeInteger(state.dueAt)).toBe(true);
    expect(conceptStateSchema.parse(state)).toEqual(state);
  });

  it('復習期限が安全整数の上限を超えない', () => {
    const states = applyAttemptToConcepts(
      {},
      attempt({ presentedAt: Number.MAX_SAFE_INTEGER, answeredAt: Number.MAX_SAFE_INTEGER }),
      link,
    );
    const state = states[primaryConceptId]!;

    expect(state.dueAt).toBe(Number.MAX_SAFE_INTEGER);
    expect(conceptStateSchema.parse(state)).toEqual(state);
  });

  it('未回答の時間切れを0回答として保持できる', () => {
    const timedOut = attemptEventSchema.parse(attempt({ attempts: 0, timedOut: true, score: 0 }));
    expect(timedOut.attempts).toBe(0);
  });

  it('構造化回答を最終回答として保存し、複数操作を初回回答と決めつけない', () => {
    const event = createAttemptEvent({
      questionId: 'test',
      result: { score: 0.5, timeMs: 12.4, attempts: 2, detail: { picks: ['a', 'b'] } },
      presentedAt: 1,
      answeredAt: 2,
      sequence: 0,
      reason: 'event',
      appVersion: 'test',
    });
    expect(event.finalAnswer).toBe('["a","b"]');
    expect(event.firstAnswer).toBeUndefined();
    expect(event.timeMs).toBe(12);
  });

  it.each([
    (() => {
      const cyclic: unknown[] = [];
      cyclic.push(cyclic);
      return cyclic;
    })(),
    [1n],
  ])('直列化できない回答詳細があっても回答履歴を作る', (picks) => {
    const event = createAttemptEvent({
      questionId: 'test',
      result: { score: 1, timeMs: 10, attempts: 1, detail: { picks } },
      presentedAt: 1,
      answeredAt: 2,
      sequence: 0,
      reason: 'event',
      appVersion: 'test',
    });

    expect(event.finalAnswer).toBeUndefined();
    expect(event.score).toBe(1);
    expect(attemptEventSchema.parse(event)).toEqual(event);
  });

  it('不正な計測値を0へ正規化し、保存可能な回答履歴を作る', () => {
    const event = createAttemptEvent({
      questionId: 'test',
      result: {
        score: 0,
        timeMs: Number.NaN,
        attempts: Number.POSITIVE_INFINITY,
        detail: { hintsUsed: 'invalid' },
      },
      presentedAt: 1,
      answeredAt: 2,
      sequence: 0,
      reason: 'event',
      appVersion: 'test',
    });

    expect(event.timeMs).toBe(0);
    expect(event.attempts).toBe(0);
    expect(event.hintsUsed).toBe(0);
    expect(attemptEventSchema.parse(event)).toEqual(event);
  });

  it('巨大な有限の計測値を安全整数の上限で飽和する', () => {
    const event = createAttemptEvent({
      questionId: 'test',
      result: {
        score: 0,
        timeMs: Number.MAX_VALUE,
        attempts: Number.MAX_VALUE,
        detail: { hintsUsed: Number.MAX_VALUE },
      },
      presentedAt: 1,
      answeredAt: 2,
      sequence: 0,
      reason: 'event',
      appVersion: 'test',
    });

    expect(event.timeMs).toBe(Number.MAX_SAFE_INTEGER);
    expect(event.attempts).toBe(Number.MAX_SAFE_INTEGER);
    expect(event.hintsUsed).toBe(Number.MAX_SAFE_INTEGER);
  });

  it.each(['timeMs', 'attempts', 'hintsUsed'] as const)(
    '安全整数を超えた回答履歴の計測値 %s を拒否する',
    (key) => {
      expect(() =>
        attemptEventSchema.parse({
          ...attempt(),
          [key]: Number.MAX_SAFE_INTEGER + 1,
        }),
      ).toThrow();
    },
  );

  it.each(['presentedAt', 'answeredAt'] as const)('安全整数を超えた回答日時 %s を拒否する', (key) => {
    expect(() =>
      attemptEventSchema.parse({
        ...attempt(),
        [key]: Number.MAX_SAFE_INTEGER + 1,
      }),
    ).toThrow();
  });

  it('時間経過で推定保持率が下がる', () => {
    const state = applyAttemptToConcepts({}, attempt(), link)[primaryConceptId]!;
    expect(estimatedRetention(state, state.lastSeenAt + 30 * 86_400_000)).toBeLessThan(state.retention);
  });

  it('回答回数の各カウンターは安全整数の上限を超えない', () => {
    const current = initialConceptState(1_000);
    current.attempts = Number.MAX_SAFE_INTEGER;
    current.independentSuccesses = Number.MAX_SAFE_INTEGER;
    current.streak = Number.MAX_SAFE_INTEGER;

    const states = applyAttemptToConcepts({ [primaryConceptId]: current }, attempt(), link);
    const state = states[primaryConceptId]!;

    expect(state.attempts).toBe(Number.MAX_SAFE_INTEGER);
    expect(state.independentSuccesses).toBe(Number.MAX_SAFE_INTEGER);
    expect(state.streak).toBe(Number.MAX_SAFE_INTEGER);
  });

  it.each(['attempts', 'independentSuccesses', 'streak'] as const)(
    '安全整数を超えた概念カウンター %s を拒否する',
    (key) => {
      expect(() =>
        conceptStateSchema.parse({
          ...initialConceptState(1_000),
          [key]: Number.MAX_SAFE_INTEGER + 1,
        }),
      ).toThrow();
    },
  );

  it.each(['lastSeenAt', 'lastSuccessAt', 'lastFailureAt', 'dueAt'] as const)(
    '安全整数を超えた概念日時 %s を拒否する',
    (key) => {
      expect(() =>
        conceptStateSchema.parse({
          ...initialConceptState(1_000),
          [key]: Number.MAX_SAFE_INTEGER + 1,
        }),
      ).toThrow();
    },
  );
});

describe('根拠を残す診断候補', () => {
  const link = graph.questionLinks.find((item) => item.questionId === 'sansu.g1.tashizan.0002')!;
  const primaryConceptId = link.concepts[0]!.conceptId;

  it('直接知識・選択誤答を候補として返す', () => {
    const candidates = diagnosisCandidates(graph, link, {}, 'b');
    expect(candidates.map((item) => item.conceptId)).toContain(primaryConceptId);
    expect(candidates[0]?.confidence).toBeLessThan(1);
    expect(
      stripRuby(candidates.find((item) => item.conceptId.includes('misconception'))?.reasons[0] ?? ''),
    ).toMatch(/選んだ答え/);
  });

  it('原因候補を最もよく切り分ける別問題を選ぶ', () => {
    const candidates = diagnosisCandidates(graph, link, {}, 'b');
    const diagnostic = pickDiagnosticQuestion(graph.questionLinks, candidates, [link.questionId]);
    expect(diagnostic).not.toBeNull();
    expect(diagnostic?.questionId).not.toBe(link.questionId);
  });

  it('履歴なしと、理解後に忘れた可能性を理由として区別する', () => {
    const withoutHistory = diagnosisCandidates(graph, link, {}, undefined, 5_000);
    expect(stripRuby(withoutHistory[0]?.reasons.join() ?? '')).toMatch(/回答履歴.*なく/);

    let states = applyAttemptToConcepts({}, attempt(), link);
    for (let i = 1; i <= 3; i++)
      states = applyAttemptToConcepts(states, attempt({ id: `attempt-${i}`, answeredAt: 5_000 + i }), link);
    const muchLater = states[primaryConceptId]!.lastSeenAt + 120 * 86_400_000;
    const forgotten = diagnosisCandidates(graph, link, states, undefined, muchLater);
    expect(
      stripRuby(forgotten.find((item) => item.conceptId === primaryConceptId)?.reasons.join() ?? ''),
    ).toMatch(/忘.*可能性/);
  });
});

describe('復習スケジューリング', () => {
  const link = graph.questionLinks.find((item) => item.questionId === 'sansu.g1.tashizan.0002')!;
  const primaryConceptId = link.concepts[0]!.conceptId;

  it('期限前は出さず、期限を過ぎると対応問題を候補にする', () => {
    const states = applyAttemptToConcepts({}, attempt(), link);
    const dueAt = states[primaryConceptId]!.dueAt;
    expect(dueReviewQuestions(graph, states, dueAt - 1)).toEqual([]);
    expect(dueReviewQuestions(graph, states, dueAt)[0]?.questionId).toBeTruthy();
  });

  it('除外した問題は候補に戻さない', () => {
    const states = applyAttemptToConcepts({}, attempt(), link);
    const dueAt = states[primaryConceptId]!.dueAt;
    const ids = dueReviewQuestions(graph, states, dueAt, ['sansu.g1.tashizan.0002']).map(
      (item) => item.questionId,
    );
    expect(ids).not.toContain('sansu.g1.tashizan.0002');
  });
});
