// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentIndex } from '../../src/core/content/loader';
import { curriculumGraph } from '../../src/core/learning/catalog';
import * as learningPlanProvider from '../../src/core/learning/learningPlan';
import type { CurriculumGraph, QuestionConceptLink } from '../../src/core/learning/model';
import type { AttemptEvent, ConceptState } from '../../src/core/learning/state';
import { createNewGame } from '../../src/core/state/newGame';
import type { GameState } from '../../src/core/state/schema';
import type { Grade, QuestionBase, QuestionResult } from '../../src/questions/contracts';
import type * as QuestionEngine from '../../src/questions/engine';
import type { AskEnv, AskResult } from '../../src/questions/engine';
import { QuestionBank } from '../../src/questions/engine';
import {
  runRoadmapPractice,
  runRoadmapPracticeByQuestionId,
  selectRoadmapPracticeQuestion,
  type RoadmapPracticeHost,
} from '../../src/scenes/overworld/roadmapPractice';

const mocks = vi.hoisted(() => ({
  askById: vi.fn(),
  questionFrame: vi.fn(),
}));

vi.mock('../../src/questions/engine', async (importOriginal) => {
  const actual = await importOriginal<typeof QuestionEngine>();
  return { ...actual, askById: mocks.askById };
});

vi.mock('../../src/ui/QuestionFrame', async () => {
  const { h } = await import('preact');
  return {
    QuestionFrame: (props: Record<string, unknown>) => {
      mocks.questionFrame(props);
      return h('div', { 'data-roadmap-question': 'mounted' });
    },
  };
});

const DAY_START = Date.UTC(2026, 9, 27, 15);

const question = (
  id: string,
  unit = 'sansu.g1.target',
  grade: Grade = 1,
  subject: QuestionBase['subject'] = 'sansu',
): QuestionBase => ({ id, type: 'choice', subject, grade, unit, payload: {} });

const concept = (id: string, unit = 'sansu.g1.target', grade: Grade = 1) => ({
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
  conceptId: string,
  role: 'primary' | 'supporting' = 'primary',
  diagnosticValue = 0.5,
): QuestionConceptLink => ({
  questionId,
  concepts: [{ conceptId, role, weight: 1 }],
  diagnosticValue,
  reviewStatus: 'draft',
  misconceptionSignals: [],
});

const graph = (
  concepts: CurriculumGraph['concepts'],
  questionLinks: CurriculumGraph['questionLinks'],
  relations: CurriculumGraph['relations'] = [],
): CurriculumGraph => ({ schemaVersion: 1, sources: [], concepts, relations, questionLinks });

const bankWith = (...questions: QuestionBase[]): QuestionBank => {
  const bank = new QuestionBank();
  for (const item of questions) bank.add(item);
  return bank;
};

const conceptState = (overrides: Partial<ConceptState> = {}): ConceptState => ({
  understanding: 0.4,
  retention: 0.4,
  confidence: 0.4,
  attempts: 1,
  independentSuccesses: 0,
  streak: 0,
  lastSeenAt: DAY_START - 86_400_000,
  lastSuccessAt: null,
  lastFailureAt: DAY_START - 86_400_000,
  dueAt: DAY_START + 86_400_000,
  intervalDays: 1,
  ...overrides,
});

const attempt = (
  id: string,
  questionId: string,
  reason: AttemptEvent['reason'],
  answeredAt = DAY_START + 1,
): AttemptEvent => ({
  id,
  profileId: 'local',
  questionId,
  presentedAt: answeredAt - 100,
  answeredAt,
  score: 1,
  timeMs: 100,
  attempts: 1,
  hintsUsed: 0,
  timedOut: false,
  reason,
  appVersion: 'test',
});

const planInput = (
  curriculum: CurriculumGraph,
  questionBank: QuestionBank,
  overrides: Partial<learningPlanProvider.LearningPlanInput> = {},
): learningPlanProvider.LearningPlanInput => ({
  graph: curriculum,
  questionBank,
  conceptStates: {},
  attempts: [],
  recentQuestionIds: [],
  unitMastery: {},
  grandfatheredUnitIds: [],
  gradeScope: { grade: 1, includeLower: false, challengeHigher: false },
  now: DAY_START + 1,
  ...overrides,
});

describe('selectRoadmapPracticeQuestion', () => {
  it.each([
    {
      name: '期限到来',
      curriculum: graph([concept('due')], [link('due-question', 'due')]),
      bank: bankWith(question('due-question')),
      overrides: {
        conceptStates: {
          due: conceptState({ dueAt: DAY_START, retention: 0.2 }),
        },
      },
      expected: {
        questionId: 'due-question',
        actualUnitId: 'sansu.g1.target',
        reason: 'due-review',
        conceptIds: ['due'],
      },
    },
    {
      name: '弱い直接前提',
      curriculum: graph(
        [concept('prerequisite', 'sansu.g1.prerequisite'), concept('target')],
        [link('prerequisite-question', 'prerequisite'), link('target-question', 'target')],
        [
          {
            from: 'prerequisite',
            to: 'target',
            kind: 'prerequisite',
            strength: 1,
            rationale: 'direct',
            sourceIds: [],
            reviewStatus: 'draft',
          },
        ],
      ),
      bank: bankWith(question('prerequisite-question', 'sansu.g1.prerequisite'), question('target-question')),
      overrides: { conceptStates: { prerequisite: conceptState() } },
      expected: {
        questionId: 'prerequisite-question',
        actualUnitId: 'sansu.g1.prerequisite',
        reason: 'weak-prerequisite',
        conceptIds: ['prerequisite'],
      },
    },
    {
      name: '未確認primary',
      curriculum: graph([concept('primary')], [link('primary-question', 'primary')]),
      bank: bankWith(question('primary-question')),
      overrides: {},
      expected: {
        questionId: 'primary-question',
        actualUnitId: 'sansu.g1.target',
        reason: 'unseen-primary',
        conceptIds: ['primary'],
      },
    },
    {
      name: '未出題問題',
      curriculum: graph([concept('supporting')], [link('supporting-question', 'supporting', 'supporting')]),
      bank: bankWith(question('supporting-question')),
      overrides: {},
      expected: {
        questionId: 'supporting-question',
        actualUnitId: 'sansu.g1.target',
        reason: 'unseen-question',
        conceptIds: ['supporting'],
      },
    },
  ])('$nameを上流の日次プランからそのまま返す', ({ curriculum, bank, overrides, expected }) => {
    expect(
      selectRoadmapPracticeQuestion(
        planInput(curriculum, bank, overrides as Partial<learningPlanProvider.LearningPlanInput>),
      ),
    ).toEqual(expected);
  });

  it('当日完了を復元して未完了の先頭を選び、候補不足を水増ししない', () => {
    const curriculum = graph(
      [concept('completed'), concept('next', 'sansu.g1.next')],
      [link('completed-question', 'completed'), link('next-question', 'next')],
    );
    const bank = bankWith(question('completed-question'), question('next-question', 'sansu.g1.next'));

    const selection = selectRoadmapPracticeQuestion(
      planInput(curriculum, bank, {
        attempts: [attempt('completed', 'completed-question', 'review')],
      }),
    );
    expect(selection).toMatchObject({ questionId: 'next-question' });
    expect(selection).not.toHaveProperty('completed');
    expect(
      selectRoadmapPracticeQuestion(
        planInput(
          graph([concept('only')], [link('only-question', 'only')]),
          bankWith(question('only-question')),
          {
            attempts: [attempt('only', 'only-question', 'diagnosis')],
          },
        ),
      ),
    ).toBeNull();
    expect(selectRoadmapPracticeQuestion(planInput(graph([], []), bankWith()))).toBeNull();
  });

  it('同順位をquestionIdで安定化し、recentよりfreshを優先して入力を変更しない', () => {
    const curriculum = graph(
      [concept('a'), concept('b')],
      [link('b-question', 'b', 'supporting', 0.5), link('a-question', 'a', 'supporting', 0.5)],
    );
    const bank = bankWith(question('b-question'), question('a-question'));
    const recentQuestionIds = ['a-question'];
    const input = planInput(curriculum, bank, { recentQuestionIds });
    const before = {
      graph: structuredClone(curriculum),
      recentQuestionIds: [...recentQuestionIds],
      questions: bank.all().map((item) => structuredClone(item)),
    };

    expect(selectRoadmapPracticeQuestion(input)?.questionId).toBe('b-question');
    expect(selectRoadmapPracticeQuestion({ ...input, recentQuestionIds: [] })?.questionId).toBe('a-question');
    expect(curriculum).toEqual(before.graph);
    expect(recentQuestionIds).toEqual(before.recentQuestionIds);
    expect(bank.all()).toEqual(before.questions);
  });
});

interface RuntimeFixture {
  game: GameState;
  bank: QuestionBank;
  content: ContentIndex;
  root: HTMLElement;
  host: RoadmapPracticeHost;
  talk: ReturnType<typeof vi.fn>;
  renderHud: ReturnType<typeof vi.fn>;
  rngNext: ReturnType<typeof vi.fn>;
}

function runtimeFixture(item: QuestionBase): RuntimeFixture {
  const game = createNewGame({ name: 'ハル', grade: item.grade }, DAY_START);
  const bank = bankWith(item);
  const content = {
    units: new Map([[item.unit, { id: item.unit, name: '実際[じっさい]の 単元[たんげん]' }]]),
    settings: {
      timeLimitSecByGrade: { [String(item.grade)]: 20 },
      recentQuestionWindow: 20,
      adaptiveWeakUnitRatio: 0.7,
      learningWisdom: { minScore: 0.8, perCorrect: 0.1, maxBonus: 20 },
    },
  } as unknown as ContentIndex;
  const root = document.createElement('div');
  const talk = vi.fn(async () => {});
  const renderHud = vi.fn();
  const rngNext = vi.fn(() => 0);
  const host: RoadmapPracticeHost = {
    registry: { get: (key) => (key === 'bank' ? bank : undefined) },
    rng: { next: rngNext },
    speak: () => {},
    content: () => content,
    gs: () => game,
    root: () => root,
    talk,
    renderHud,
  };
  return { game, bank, content, root, host, talk, renderHud, rngNext };
}

const incompletePlanItem = (
  item: QuestionBase,
  reason: 'due-review' | 'weak-prerequisite' | 'unseen-primary' | 'unseen-question',
) => ({
  questionId: item.id,
  actualUnitId: item.unit,
  reason,
  conceptIds: ['concept'],
  completed: false as const,
});

describe('runRoadmapPractice', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(DAY_START + 1);
    mocks.askById.mockReset();
    mocks.questionFrame.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it.each([
    ['due-review', 'review'],
    ['weak-prerequisite', 'diagnosis'],
    ['unseen-primary', 'diagnosis'],
    ['unseen-question', 'diagnosis'],
  ] as const)('%sを既存Attempt理由%sで記録する', async (reason, expectedAttemptReason) => {
    const item = question('runtime-question', 'sansu.g1.actual', 1, 'sansu');
    const fixture = runtimeFixture(item);
    vi.spyOn(learningPlanProvider, 'buildLearningPlan').mockReturnValue([incompletePlanItem(item, reason)]);
    mocks.askById.mockImplementation(async (env: AskEnv, questionId: string): Promise<AskResult> => {
      expect(fixture.root.querySelector('[data-roadmap-question]')).not.toBeNull();
      const result: QuestionResult = { questionId, score: 0.5, timeMs: 100, attempts: 1 };
      env.onResult?.(item, result, DAY_START);
      return { ...result, unit: item.unit, subject: item.subject };
    });

    const result = await runRoadmapPractice(fixture.host, 'sansu.g1.selected');

    expect(result).toEqual({
      questionId: item.id,
      actualUnitId: item.unit,
      reason,
      conceptIds: ['concept'],
    });
    expect(mocks.askById).toHaveBeenCalledOnce();
    expect(mocks.askById).toHaveBeenCalledWith(expect.any(Object), item.id);
    expect(mocks.questionFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '実際[じっさい]の 単元[たんげん]',
        subject: item.subject,
      }),
    );
    expect(fixture.game.learning.attempts.at(-1)?.reason).toBe(expectedAttemptReason);
    expect(fixture.renderHud).toHaveBeenCalledOnce();
    expect(fixture.rngNext).not.toHaveBeenCalled();
    expect(fixture.root.childElementCount).toBe(0);
  });

  it('今日カードが渡したquestionIdの問題を正確に実行する', async () => {
    const first = question('first-question', 'sansu.g1.first');
    const selected = question('selected-question', 'sansu.g1.selected');
    const fixture = runtimeFixture(selected);
    fixture.bank.add(first);
    vi.spyOn(learningPlanProvider, 'buildLearningPlan').mockReturnValue([
      incompletePlanItem(first, 'due-review'),
      incompletePlanItem(selected, 'unseen-primary'),
    ]);
    mocks.askById.mockResolvedValue({
      questionId: selected.id,
      score: 1,
      timeMs: 100,
      attempts: 1,
      unit: selected.unit,
      subject: selected.subject,
    });

    const result = await runRoadmapPracticeByQuestionId(fixture.host, selected.id);

    expect(result?.questionId).toBe(selected.id);
    expect(mocks.askById).toHaveBeenCalledOnce();
    expect(mocks.askById).toHaveBeenCalledWith(expect.any(Object), selected.id);
  });

  it('候補なしとstale候補では回答前の状態を変えず既存案内だけを表示する', async () => {
    const item = question('stale-question');
    const fixture = runtimeFixture(item);
    const before = structuredClone(fixture.game);
    vi.spyOn(learningPlanProvider, 'buildLearningPlan').mockReturnValue([]);

    expect(await runRoadmapPractice(fixture.host, 'sansu.g1.selected')).toBeNull();
    expect(fixture.talk).toHaveBeenCalledOnce();
    expect(mocks.askById).not.toHaveBeenCalled();
    expect(fixture.game).toEqual(before);

    vi.mocked(fixture.talk).mockClear();
    vi.spyOn(learningPlanProvider, 'buildLearningPlan').mockReturnValue([
      incompletePlanItem(question('missing-question'), 'unseen-question'),
    ]);
    expect(await runRoadmapPractice(fixture.host, 'sansu.g1.selected')).toBeNull();
    expect(fixture.talk).toHaveBeenCalledOnce();
    expect(mocks.askById).not.toHaveBeenCalled();
    expect(fixture.game).toEqual(before);
  });

  it('問題実行が失敗してもUIを片づけ、回答前状態を保持する', async () => {
    const item = question('rejected-question');
    const fixture = runtimeFixture(item);
    const before = structuredClone(fixture.game);
    vi.spyOn(learningPlanProvider, 'buildLearningPlan').mockReturnValue([
      incompletePlanItem(item, 'unseen-primary'),
    ]);
    mocks.askById.mockRejectedValue(new Error('renderer failed'));

    await expect(runRoadmapPractice(fixture.host, 'sansu.g1.selected')).rejects.toThrow('renderer failed');
    expect(fixture.root.childElementCount).toBe(0);
    expect(fixture.renderHud).not.toHaveBeenCalled();
    expect(fixture.game).toEqual(before);
  });

  it('日次プラン入力へGameStateと既得進捗を読み取り専用で渡す', async () => {
    const link = curriculumGraph.questionLinks[0]!;
    const linkedConcept = curriculumGraph.concepts.find((item) => item.id === link.concepts[0]?.conceptId)!;
    const item = question(
      link.questionId,
      linkedConcept.unit,
      linkedConcept.grade as Grade,
      linkedConcept.subject,
    );
    const fixture = runtimeFixture(item);
    fixture.game.learning.includeLower = true;
    fixture.game.learning.challengeHigher = true;
    fixture.game.progress.counters['learning.roadmap-grandfathered:sansu.g1.old'] = 1;
    const planSpy = vi
      .spyOn(learningPlanProvider, 'buildLearningPlan')
      .mockReturnValue([incompletePlanItem(item, 'unseen-primary')]);
    mocks.askById.mockResolvedValue({
      questionId: item.id,
      score: 1,
      timeMs: 100,
      attempts: 1,
      unit: item.unit,
      subject: item.subject,
    });

    await runRoadmapPractice(fixture.host, 'sansu.g1.selected');

    expect(planSpy).toHaveBeenCalledWith({
      graph: curriculumGraph,
      questionBank: expect.objectContaining({ get: expect.any(Function), all: expect.any(Function) }),
      conceptStates: fixture.game.learning.conceptStates,
      attempts: fixture.game.learning.attempts,
      recentQuestionIds: fixture.game.learning.recent,
      unitMastery: fixture.game.learning.mastery,
      grandfatheredUnitIds: ['sansu.g1.old'],
      gradeScope: { grade: item.grade, includeLower: true, challengeHigher: true },
      now: DAY_START + 1,
    });
    expect(planSpy.mock.calls[0]?.[0].questionBank.all()).toEqual([]);
  });
});
