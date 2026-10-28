import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type Question = {
  id: string;
  type: string;
  unit: string;
  tags?: string[];
  payload: {
    answer?: string | number;
    answers?: string[];
  };
};

type Concept = {
  id: string;
  unit: string;
  kind: string;
  sourceIds: string[];
  review: { status: string };
};

type QuestionLink = {
  questionId: string;
  concepts: Array<{ conceptId: string; role: string }>;
  reviewStatus: string;
  misconceptionSignals: Array<{
    answerId: string;
    conceptId: string;
    confidence: number;
    rationale: string;
  }>;
};

type CurriculumFragment = {
  concepts: Concept[];
  questionLinks: QuestionLink[];
};

type TargetQuestion = {
  id: string;
  stage: string;
  type: string;
  answer: string | number | string[];
  nonStageTags: string[];
};

const root = process.cwd();
const stagePrefix = 'stage:';
const targetUnits = new Set(['sansu.g1.kazu-100', 'sansu.g1.tashizan', 'sansu.g1.kuriagari-kurisagari']);

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(root, path), 'utf8')) as T;
}

function readQuestions(directory: string): Question[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return readQuestions(path);
    if (!entry.name.endsWith('.json')) return [];
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Question[] | { questions?: Question[] };
    return Array.isArray(parsed) ? parsed : (parsed.questions ?? []);
  });
}

function correctAnswer(question: Question): string | number | string[] {
  return question.payload.answer ?? question.payload.answers ?? [];
}

const questions = readQuestions(join(root, 'content/questions/sansu/g1'));
const questionsById = new Map(questions.map((question) => [question.id, question]));
const foundations = readJson<CurriculumFragment>('content/curriculum/sansu-g1-foundations.json');
const term2 = readJson<CurriculumFragment>('content/curriculum/sansu-g1-term2.json');
const concepts = [...foundations.concepts, ...term2.concepts];
const questionLinks = [...foundations.questionLinks, ...term2.questionLinks];

const targetsByUnit: Record<string, TargetQuestion[]> = {
  'kazu-100': [
    {
      id: 'sansu.g1.kazu-100.ringo-blocks-0001',
      stage: 'stage:concrete',
      type: 'number-build',
      answer: 23,
      nonStageTags: ['prefecture:aomori', 'theme:ringo'],
    },
    {
      id: 'sansu.g1.kazu-100.ringo-numberline-0001',
      stage: 'stage:visual',
      type: 'number-build',
      answer: 8,
      nonStageTags: ['prefecture:aomori', 'theme:ringo'],
    },
    {
      id: 'sansu.g1.kazu-100.place-value-0001',
      stage: 'stage:symbolic',
      type: 'choice',
      answer: 'a',
      nonStageTags: [],
    },
    {
      id: 'sansu.g1.kazu-100.place-value-0002',
      stage: 'stage:symbolic',
      type: 'text-input',
      answer: ['52'],
      nonStageTags: [],
    },
    {
      id: 'sansu.g1.kazu-100.place-value-0003',
      stage: 'stage:symbolic',
      type: 'choice',
      answer: 'b',
      nonStageTags: [],
    },
  ],
  tashizan: [
    {
      id: 'sansu.g1.tashizan.0001',
      stage: 'stage:application',
      type: 'choice',
      answer: 'a',
      nonStageTags: ['prefecture:aomori', 'theme:ringo'],
    },
    {
      id: 'sansu.g1.tashizan.0006',
      stage: 'stage:application',
      type: 'choice',
      answer: 'a',
      nonStageTags: [],
    },
    {
      id: 'sansu.g1.tashizan.0007',
      stage: 'stage:application',
      type: 'choice',
      answer: 'b',
      nonStageTags: [],
    },
  ],
  'kuriagari-kurisagari': [
    {
      id: 'sansu.g1.kuriagari-kurisagari.0001',
      stage: 'stage:symbolic',
      type: 'choice',
      answer: 'a',
      nonStageTags: [],
    },
    {
      id: 'sansu.g1.kuriagari-kurisagari.0002',
      stage: 'stage:symbolic',
      type: 'text-input',
      answer: ['15'],
      nonStageTags: [],
    },
    {
      id: 'sansu.g1.kuriagari-kurisagari.0004',
      stage: 'stage:symbolic',
      type: 'choice',
      answer: 'a',
      nonStageTags: [],
    },
    {
      id: 'sansu.g1.kuriagari-kurisagari.0006',
      stage: 'stage:application',
      type: 'choice',
      answer: 'b',
      nonStageTags: [],
    },
  ],
};

const targetQuestions = Object.values(targetsByUnit).flat();
const expectedSignals = [
  ['sansu.g1.tashizan.0001', 'd', 'sansu.g1.misconception.add-instead-difference', 0.65],
  ['sansu.g1.tashizan.0002', 'b', 'sansu.g1.misconception.add-instead-difference', 0.6],
  ['sansu.g1.tashizan.0004', 'b', 'sansu.g1.misconception.add-instead-difference', 0.7],
  ['sansu.g1.kazu-100.place-value-0001', 'b', 'sansu.g1.misconception.tens-ones-reversed', 0.7],
  ['sansu.g1.kuriagari-kurisagari.0001', 'b', 'sansu.g1.misconception.make-ten-arbitrary-split', 0.65],
  ['sansu.g1.kuriagari-kurisagari.0004', 'b', 'sansu.g1.misconception.add-instead-difference', 0.65],
] as const;

describe('学習段階タグ', () => {
  for (const [unitLabel, targets] of Object.entries(targetsByUnit)) {
    describe(unitLabel, () => {
      it('承認済み問題だけが指定stageを持ち、既存契約を保つ', () => {
        for (const target of targets) {
          const question = questionsById.get(target.id);
          expect(question, target.id).toBeDefined();
          expect(question?.unit, target.id).toBe(target.id.split('.').slice(0, -1).join('.'));
          expect(question?.type, target.id).toBe(target.type);
          expect(correctAnswer(question!), target.id).toEqual(target.answer);
          expect(
            (question?.tags ?? []).filter((tag) => !tag.startsWith(stagePrefix)),
            target.id,
          ).toEqual(target.nonStageTags);
          expect(
            (question?.tags ?? []).filter((tag) => tag.startsWith(stagePrefix)),
            target.id,
          ).toEqual([target.stage]);
        }
      });
    });
  }

  it('対象3 Unitではexact matrixの12問だけが4種類のstageを持つ', () => {
    const staged = questions.filter(
      (question) =>
        targetUnits.has(question.unit) && (question.tags ?? []).some((tag) => tag.startsWith(stagePrefix)),
    );
    expect(staged.map((question) => question.id).sort()).toEqual(
      targetQuestions.map((question) => question.id).sort(),
    );
    expect(
      new Set(staged.flatMap((question) => question.tags ?? []).filter((tag) => tag.startsWith(stagePrefix))),
    ).toEqual(new Set(['stage:concrete', 'stage:visual', 'stage:symbolic', 'stage:application']));
  });
});

describe('primary教材カバレッジ', () => {
  it.each([
    ['sansu.g1.number.two-digit-place-value', 4],
    ['sansu.g1.addition.meaning', 3],
    ['sansu.g1.operation.make-ten-strategy', 6],
  ])('%s は基点以上かつ3問以上のprimary問題を保つ', (conceptId, baseline) => {
    const primaryCount = questionLinks.filter((link) =>
      link.concepts.some((concept) => concept.conceptId === conceptId && concept.role === 'primary'),
    ).length;
    expect(primaryCount).toBeGreaterThanOrEqual(baseline);
    expect(primaryCount).toBeGreaterThanOrEqual(3);
  });
});

describe('draft誤概念シグナル', () => {
  const targetSignals = questionLinks.flatMap((link) => {
    const question = questionsById.get(link.questionId);
    if (!question || !targetUnits.has(question.unit)) return [];
    return link.misconceptionSignals.map((signal) => ({ link, signal }));
  });

  it('既存3件を保持し、新規3件を加えた正確な6 tupleにする', () => {
    const actual = targetSignals.map(({ link, signal }) => [
      link.questionId,
      signal.answerId,
      signal.conceptId,
      signal.confidence,
    ]);
    expect(actual).toEqual(expect.arrayContaining(expectedSignals.map((signal) => [...signal])));
    expect(actual).toHaveLength(6);
    expect(
      new Set(actual.map(([questionId, answerId, conceptId]) => `${questionId}|${answerId}|${conceptId}`))
        .size,
    ).toBe(6);
    expect(Math.max(...targetSignals.map(({ signal }) => signal.confidence))).toBeLessThanOrEqual(0.7);
  });

  it.each([
    [
      'foundations',
      'sansu.g1.misconception.tens-ones-reversed',
      'sansu.g1.kazu-100',
      'mext-h29-sansu-commentary',
      'sansu.g1.kazu-100.place-value-0001',
    ],
    [
      'term2',
      'sansu.g1.misconception.make-ten-arbitrary-split',
      'sansu.g1.kuriagari-kurisagari',
      'mext-h29-sansu-g1-term2',
      'sansu.g1.kuriagari-kurisagari.0001',
    ],
  ])(
    '%s の新規Conceptとsignal linkはdraftのままにする',
    (_fragment, conceptId, unit, sourceId, questionId) => {
      const concept = concepts.find((entry) => entry.id === conceptId);
      const link = questionLinks.find((entry) => entry.questionId === questionId);
      const signal = link?.misconceptionSignals.find((entry) => entry.conceptId === conceptId);

      expect(concept).toMatchObject({ unit, kind: 'misconception', review: { status: 'draft' } });
      expect(concept?.sourceIds).toContain(sourceId);
      expect(link?.reviewStatus).toBe('draft');
      expect(signal?.rationale).toContain('一度だけでは断定しない');
    },
  );

  it('term2の既存Concept向け新規signalもdraftかつ非断定表現にする', () => {
    const link = questionLinks.find((entry) => entry.questionId === 'sansu.g1.kuriagari-kurisagari.0004');
    const signal = link?.misconceptionSignals.find(
      (entry) => entry.conceptId === 'sansu.g1.misconception.add-instead-difference',
    );

    expect(link?.reviewStatus).toBe('draft');
    expect(signal).toMatchObject({ answerId: 'b', confidence: 0.65 });
    expect(signal?.rationale).toContain('一度だけでは断定しない');
  });
});

describe('報酬・セーブ境界', () => {
  it('対象問題へruntime報酬や永続化フィールドを追加しない', () => {
    for (const target of targetQuestions) {
      const question = questionsById.get(target.id);
      expect(question).not.toHaveProperty('reward');
      expect(question).not.toHaveProperty('mastery');
      expect(question).not.toHaveProperty('schemaVersion');
    }
  });
});
