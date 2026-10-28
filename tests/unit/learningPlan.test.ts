import { describe, expect, it } from 'vitest';
import type { CurriculumGraph, QuestionConceptLink } from '../../src/core/learning/model';
import type { AttemptEvent, ConceptState } from '../../src/core/learning/state';
import { buildLearningPlan, type LearningPlanInput } from '../../src/core/learning/learningPlan';
import type { Grade, QuestionBase } from '../../src/questions/contracts';
import { QuestionBank } from '../../src/questions/engine/bank';

const question = (id: string, grade: Grade = 3, unit = `sansu.g${grade}.unit`): QuestionBase => ({
  id,
  type: 'choice',
  subject: 'sansu',
  grade,
  unit,
  payload: {},
});

const concept = (id: string, grade: Grade = 3, unit = `sansu.g${grade}.unit`) => ({
  id,
  subject: 'sansu' as const,
  grade,
  unit,
  name: id,
  description: id,
  kind: 'concept' as const,
  memoryType: 'concept' as const,
  curriculumCodes: [],
  sourceIds: ['source'],
  review: { status: 'draft' as const },
});

const link = (
  questionId: string,
  conceptIds: string[],
  role: 'primary' | 'supporting' | 'reading' = 'supporting',
): QuestionConceptLink => ({
  questionId,
  concepts: conceptIds.map((conceptId) => ({ conceptId, role, weight: 1 })),
  diagnosticValue: 0.5,
  reviewStatus: 'draft',
  misconceptionSignals: [],
});

const graph = (
  concepts: CurriculumGraph['concepts'],
  questionLinks: QuestionConceptLink[],
): CurriculumGraph => ({
  schemaVersion: 1,
  sources: [],
  concepts,
  relations: [],
  questionLinks,
});

const bankWith = (...questions: QuestionBase[]): QuestionBank => {
  const bank = new QuestionBank();
  for (const item of questions) bank.add(item);
  return bank;
};

const attempt = (
  id: string,
  questionId: string,
  answeredAt: number,
  reason: AttemptEvent['reason'],
  overrides: Partial<AttemptEvent> = {},
): AttemptEvent => ({
  id,
  profileId: 'local',
  questionId,
  presentedAt: answeredAt - 100,
  answeredAt,
  score: 0,
  timeMs: 100,
  attempts: 2,
  hintsUsed: 1,
  timedOut: true,
  reason,
  appVersion: 'test',
  ...overrides,
});

const conceptState = (overrides: Partial<ConceptState> = {}): ConceptState => ({
  understanding: 0.5,
  retention: 0.6,
  confidence: 0.5,
  attempts: 1,
  independentSuccesses: 0,
  streak: 0,
  lastSeenAt: Date.UTC(2026, 0, 1, 15),
  lastSuccessAt: null,
  lastFailureAt: null,
  dueAt: Date.UTC(2026, 0, 1, 15),
  intervalDays: 1,
  ...overrides,
});

const input = (
  curriculum: CurriculumGraph,
  questionBank: QuestionBank,
  now: number,
  overrides: Partial<LearningPlanInput> = {},
): LearningPlanInput => ({
  graph: curriculum,
  questionBank,
  conceptStates: {},
  attempts: [],
  recentQuestionIds: [],
  unitMastery: {},
  grandfatheredUnitIds: [],
  gradeScope: { grade: 3, includeLower: false, challengeHigher: false },
  now,
  ...overrides,
});

describe('buildLearningPlan JST day', () => {
  it('JST 00:00直前と直後で当日完了を切り替える', () => {
    const boundary = Date.UTC(2026, 0, 1, 15);
    const curriculum = graph(
      [concept('before'), concept('after')],
      [link('before-question', ['before']), link('after-question', ['after'])],
    );
    const bank = bankWith(question('before-question'), question('after-question'));
    const attempts = [
      attempt('before', 'before-question', boundary - 1, 'review'),
      attempt('after', 'after-question', boundary, 'diagnosis'),
    ];

    expect(
      buildLearningPlan(input(curriculum, bank, boundary - 1, { attempts })).map((item) => item.questionId),
    ).toEqual(['before-question']);
    expect(
      buildLearningPlan(input(curriculum, bank, boundary, { attempts })).map((item) => item.questionId),
    ).toEqual(['after-question']);
  });

  it('同じJST日の異なる時刻で同じevaluationNowを推薦に使う', () => {
    const dayStart = Date.UTC(2026, 0, 1, 15);
    const curriculum = graph([concept('due')], [link('due-question', ['due'])]);
    const bank = bankWith(question('due-question'));
    const overrides = {
      conceptStates: { due: conceptState({ lastSeenAt: dayStart, dueAt: dayStart }) },
    };

    const morning = buildLearningPlan(input(curriculum, bank, dayStart + 1, overrides));
    const evening = buildLearningPlan(input(curriculum, bank, dayStart + 86_399_999, overrides));

    expect(evening).toEqual(morning);
    expect(morning).toEqual([
      {
        questionId: 'due-question',
        actualUnitId: 'sansu.g3.unit',
        reason: 'due-review',
        conceptIds: ['due'],
        completed: false,
      },
    ]);
  });
});

describe('buildLearningPlan completed items', () => {
  it('reviewとdiagnosisだけを成績に関係なく完了とし、最初のイベントreasonを保持する', () => {
    const dayStart = Date.UTC(2026, 0, 1, 15);
    const ids = ['duplicate', 'review', 'battle', 'event', 'playground', 'unknown'];
    const curriculum = graph(
      ids.map((id) => concept(id)),
      ids.map((id) => link(`${id}-question`, [id])),
    );
    const bank = bankWith(...ids.map((id) => question(`${id}-question`)));
    const attempts = [
      attempt('later', 'duplicate-question', dayStart + 20, 'review', { score: 1, timedOut: false }),
      attempt('earlier', 'duplicate-question', dayStart + 10, 'diagnosis'),
      attempt('review', 'review-question', dayStart + 30, 'review'),
      attempt('battle', 'battle-question', dayStart + 40, 'battle'),
      attempt('event', 'event-question', dayStart + 50, 'event'),
      attempt('playground', 'playground-question', dayStart + 60, 'playground'),
      attempt('unknown', 'unknown-question', dayStart + 70, 'unknown'),
    ];

    const plan = buildLearningPlan(input(curriculum, bank, dayStart + 100, { attempts }));

    expect(plan).toMatchObject([
      { questionId: 'duplicate-question', reason: 'diagnosis', completed: true },
      { questionId: 'review-question', reason: 'review', completed: true },
    ]);
    expect(plan.every((item) => item.completed)).toBe(true);
  });

  it('完了イベントを決定的に並べて問題ごとに一意化し、最大3件にする', () => {
    const dayStart = Date.UTC(2026, 0, 1, 15);
    const ids = ['a', 'b', 'c', 'd'];
    const curriculum = graph(
      ids.map((id) => concept(id)),
      ids.map((id) => link(`${id}-question`, [id])),
    );
    const bank = bankWith(...ids.map((id) => question(`${id}-question`)));
    const attempts = [
      attempt('z', 'd-question', dayStart + 30, 'review'),
      attempt('b', 'b-question', dayStart + 10, 'review'),
      attempt('a', 'a-question', dayStart + 10, 'diagnosis'),
      attempt('c', 'c-question', dayStart + 20, 'review'),
      attempt('duplicate', 'a-question', dayStart + 40, 'review'),
    ];

    expect(
      buildLearningPlan(input(curriculum, bank, dayStart + 100, { attempts })).map(
        ({ questionId, completed }) => ({ questionId, completed }),
      ),
    ).toEqual([
      { questionId: 'a-question', completed: true },
      { questionId: 'b-question', completed: true },
      { questionId: 'c-question', completed: true },
    ]);
  });

  it('QuestionBankから消えた問題とリンク切れ問題をダミー完了にしない', () => {
    const dayStart = Date.UTC(2026, 0, 1, 15);
    const valid = question('valid-question', 1, 'sansu.g1.legacy-math-1-2');
    const unlinked = question('unlinked-question', 1);
    const curriculum = graph([concept('b', 1), concept('a', 1)], [link('valid-question', ['b', 'a', 'b'])]);
    const attempts = [
      attempt('valid', 'valid-question', dayStart + 1, 'review'),
      attempt('deleted', 'deleted-question', dayStart + 2, 'review'),
      attempt('unlinked', 'unlinked-question', dayStart + 3, 'diagnosis'),
    ];

    expect(
      buildLearningPlan(
        input(curriculum, bankWith(valid, unlinked), dayStart + 100, {
          attempts,
          gradeScope: { grade: 1, includeLower: false, challengeHigher: false },
        }),
      ),
    ).toEqual([
      {
        questionId: 'valid-question',
        actualUnitId: 'sansu.g1.tashizan',
        reason: 'review',
        conceptIds: ['a', 'b'],
        completed: true,
      },
    ]);
  });
});
