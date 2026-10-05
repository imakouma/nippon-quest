import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  applyAttemptToConcepts,
  attemptEventSchema,
  createAttemptEvent,
  diagnosisCandidates,
  dueReviewQuestions,
  estimatedRetention,
  pickDiagnosticQuestion,
  validateCurriculumGraph,
  type AttemptEvent,
} from '../../src/core/learning';

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

  it('独力正解で理解・定着・復習間隔が上がる', () => {
    const states = applyAttemptToConcepts({}, attempt(), link);
    const state = states['sansu.g1.addition.single-digit']!;
    expect(state.understanding).toBeGreaterThan(0);
    expect(state.retention).toBeGreaterThan(0);
    expect(state.independentSuccesses).toBe(1);
    expect(state.dueAt).toBeGreaterThan(5_000);
  });

  it('ヒント付き正解は独力正解として数えない', () => {
    const states = applyAttemptToConcepts({}, attempt({ hintsUsed: 1, attempts: 2 }), link);
    expect(states['sansu.g1.addition.single-digit']!.independentSuccesses).toBe(0);
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

  it('時間経過で推定保持率が下がる', () => {
    const state = applyAttemptToConcepts({}, attempt(), link)['sansu.g1.addition.single-digit']!;
    expect(estimatedRetention(state, state.lastSeenAt + 30 * 86_400_000)).toBeLessThan(state.retention);
  });
});

describe('根拠を残す診断候補', () => {
  const link = graph.questionLinks.find((item) => item.questionId === 'sansu.g1.tashizan.0002')!;

  it('直接知識・前提知識・選択誤答を候補として返す', () => {
    const candidates = diagnosisCandidates(graph, link, {}, 'b');
    expect(candidates.map((item) => item.conceptId)).toContain('sansu.g1.addition.single-digit');
    expect(candidates.map((item) => item.conceptId)).toContain('sansu.g1.addition.meaning');
    expect(candidates[0]?.confidence).toBeLessThan(1);
    expect(candidates.find((item) => item.conceptId.includes('misconception'))?.reasons[0]).toMatch(
      /選んだ答え/,
    );
  });

  it('原因候補を最もよく切り分ける別問題を選ぶ', () => {
    const candidates = diagnosisCandidates(graph, link, {}, 'b');
    const diagnostic = pickDiagnosticQuestion(graph.questionLinks, candidates, [link.questionId]);
    expect(diagnostic).not.toBeNull();
    expect(diagnostic?.questionId).not.toBe(link.questionId);
  });

  it('履歴なしと、理解後に忘れた可能性を理由として区別する', () => {
    const withoutHistory = diagnosisCandidates(graph, link, {}, undefined, 5_000);
    expect(withoutHistory[0]?.reasons.join()).toMatch(/履歴がなく/);

    let states = applyAttemptToConcepts({}, attempt(), link);
    for (let i = 1; i <= 3; i++)
      states = applyAttemptToConcepts(states, attempt({ id: `attempt-${i}`, answeredAt: 5_000 + i }), link);
    const muchLater = states['sansu.g1.addition.single-digit']!.lastSeenAt + 120 * 86_400_000;
    const forgotten = diagnosisCandidates(graph, link, states, undefined, muchLater);
    expect(
      forgotten.find((item) => item.conceptId === 'sansu.g1.addition.single-digit')?.reasons.join(),
    ).toMatch(/忘れている可能性/);
  });
});

describe('復習スケジューリング', () => {
  const link = graph.questionLinks.find((item) => item.questionId === 'sansu.g1.tashizan.0002')!;

  it('期限前は出さず、期限を過ぎると対応問題を候補にする', () => {
    const states = applyAttemptToConcepts({}, attempt(), link);
    const dueAt = states['sansu.g1.addition.single-digit']!.dueAt;
    expect(dueReviewQuestions(graph, states, dueAt - 1)).toEqual([]);
    expect(dueReviewQuestions(graph, states, dueAt)[0]?.questionId).toBeTruthy();
  });

  it('除外した問題は候補に戻さない', () => {
    const states = applyAttemptToConcepts({}, attempt(), link);
    const dueAt = states['sansu.g1.addition.single-digit']!.dueAt;
    const ids = dueReviewQuestions(graph, states, dueAt, ['sansu.g1.tashizan.0002']).map(
      (item) => item.questionId,
    );
    expect(ids).not.toContain('sansu.g1.tashizan.0002');
  });
});
