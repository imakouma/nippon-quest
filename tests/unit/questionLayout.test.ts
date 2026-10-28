import { describe, expect, it } from 'vitest';
import {
  buildQuestionSets,
  compareQuestionLayouts,
  validateQuestionSetLayout,
  type QuestionSourceFile,
} from '../../scripts/question-layout';
import type { QuestionBase } from '../../src/questions/contracts';

function question(index: number, override: Partial<QuestionBase> = {}): QuestionBase {
  return {
    id: `sansu.g1.tashizan.${String(index).padStart(4, '0')}`,
    type: 'choice',
    subject: 'sansu',
    grade: 1,
    unit: 'sansu.g1.tashizan',
    tags: ['skill:addition'],
    payload: { prompt: `${index}+1は？`, choices: [String(index), String(index + 1)], answer: 1 },
    explanation: `${index}に 1を たします。`,
    ...override,
  };
}

function source(questions: QuestionBase[], file = 'questions/sansu/g1/legacy.json'): QuestionSourceFile {
  return { file, questions };
}

describe('question content layout', () => {
  it.each([
    [1, [1]],
    [30, [30]],
    [31, [30, 1]],
    [119, [30, 30, 30, 29]],
  ])('%i問を30問以下の連番セットへ分割する', (count, expectedSizes) => {
    const sets = buildQuestionSets([source(Array.from({ length: count }, (_, i) => question(i + 1)))]);

    expect(sets.map((set) => set.questions.length)).toEqual(expectedSizes);
    expect(sets.map((set) => set.file)).toEqual(
      expectedSizes.map(
        (_, index) => `questions/sansu/g1/tashizan/set-${String(index + 1).padStart(3, '0')}.json`,
      ),
    );
  });

  it('教科・学年・単元ごとに分け、元の単元内順序を保つ', () => {
    const files = [
      source([
        question(1),
        question(2, {
          id: 'kokugo.g2.kanji.0002',
          subject: 'kokugo',
          grade: 2,
          unit: 'kokugo.g2.kanji',
        }),
      ]),
      source(
        [
          question(3),
          question(4, {
            id: 'kokugo.g2.kanji.0004',
            subject: 'kokugo',
            grade: 2,
            unit: 'kokugo.g2.kanji',
          }),
        ],
        'questions/legacy/second.json',
      ),
    ];

    const sets = buildQuestionSets(files);

    expect(sets.map((set) => set.file)).toEqual([
      'questions/kokugo/g2/kanji/set-001.json',
      'questions/sansu/g1/tashizan/set-001.json',
    ]);
    expect(sets[0]!.questions.map(({ id }) => id)).toEqual(['kokugo.g2.kanji.0002', 'kokugo.g2.kanji.0004']);
    expect(sets[1]!.questions.map(({ id }) => id)).toEqual([
      'sansu.g1.tashizan.0001',
      'sansu.g1.tashizan.0003',
    ]);
  });

  it.each([
    [
      '教科',
      question(1, { subject: 'kokugo', unit: 'sansu.g1.tashizan' }),
      'subject/grade と unit が一致しません',
    ],
    ['学年', question(1, { grade: 2, unit: 'sansu.g1.tashizan' }), 'subject/grade と unit が一致しません'],
    ['単元形式', question(1, { unit: 'tashizan' }), '単元コードが不正です'],
  ])('%sの不整合を拒否する', (_name, invalid, message) => {
    expect(() => buildQuestionSets([source([invalid])])).toThrow(message);
  });

  it('重複IDを拒否する', () => {
    expect(() => buildQuestionSets([source([question(1), question(1)])])).toThrow('問題IDが重複しています');
  });

  it('移行前後の完全JSON値と単元内順序が同じならparityを満たす', () => {
    const before = source(Array.from({ length: 31 }, (_, i) => question(i + 1)));
    const after = buildQuestionSets([before]);

    expect(compareQuestionLayouts([before], after)).toEqual({
      ok: true,
      errors: [],
      questions: 31,
      units: 1,
    });
  });

  it.each([
    [
      '値変更',
      (sets: QuestionSourceFile[]) => {
        sets[0]!.questions[0]!.explanation = '変更しました。';
      },
      '問題JSONが変わっています',
    ],
    [
      '欠落',
      (sets: QuestionSourceFile[]) => {
        sets[0]!.questions.shift();
      },
      '問題ID集合が一致しません',
    ],
    [
      '順序変更',
      (sets: QuestionSourceFile[]) => {
        sets[0]!.questions.reverse();
      },
      '単元内の問題順が変わっています',
    ],
  ])('%sをparity検査で検出する', (_name, mutate, message) => {
    const before = source([question(1), question(2)]);
    const after = structuredClone(buildQuestionSets([before]));
    mutate(after);

    const parity = compareQuestionLayouts([before], after);

    expect(parity.ok).toBe(false);
    expect(parity.errors).toContainEqual(expect.stringContaining(message));
  });

  it('正規化済みセットを再処理してもパスと値が変わらない', () => {
    const once = buildQuestionSets([source(Array.from({ length: 31 }, (_, i) => question(i + 1)))]);

    expect(buildQuestionSets(once)).toEqual(once);
    expect(validateQuestionSetLayout(once)).toEqual([]);
  });

  it('上限超過・異種単元・不正パス・連番欠けを検出する', () => {
    const tooLarge = source(
      Array.from({ length: 31 }, (_, i) => question(i + 1)),
      'questions/sansu/g1/tashizan/set-001.json',
    );
    const mixed = source(
      [
        question(40),
        question(41, {
          id: 'sansu.g1.hikizan.0041',
          unit: 'sansu.g1.hikizan',
        }),
      ],
      'questions/sansu/g2/tashizan/set-003.json',
    );

    expect(validateQuestionSetLayout([tooLarge, mixed])).toEqual(
      expect.arrayContaining([
        expect.stringContaining('30問を超えています'),
        expect.stringContaining('複数の単元'),
        expect.stringContaining('正規パスと一致しません'),
        expect.stringContaining('セット番号が連番ではありません'),
      ]),
    );
  });
});
