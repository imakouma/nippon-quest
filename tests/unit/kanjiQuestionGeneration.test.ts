import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildKanjiQuestionFiles,
  generateKanjiQuestions,
  normalizeKanjiReading,
  type CanonicalKanjiRecord,
} from '../../scripts/generate-kanji-questions';

const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const records = JSON.parse(readFileSync(`${CONTENT}kanji/readings.json`, 'utf8')) as CanonicalKanjiRecord[];
const expectedCounts = { 1: 80, 2: 160, 3: 200, 4: 202, 5: 193, 6: 191 } as const;
const preservedWritingCharacters = new Set(['山', '石', '風']);

const generated = generateKanjiQuestions(records, preservedWritingCharacters);

describe('漢字問題生成', () => {
  it('読みを選択肢用の平仮名へ正規化する', () => {
    expect(normalizeKanjiReading('ガク')).toBe('がく');
    expect(normalizeKanjiReading('あ.がる')).toBe('あがる');
  });

  it('全1026字の書き問題を既存3問と重複せず生成する', () => {
    expect(generated.writing).toHaveLength(1023);
    expect(new Set(generated.writing.map((question) => question.payload.kanji)).size).toBe(1023);
    expect(
      generated.writing.every(
        (question) =>
          question.type === 'kanji-trace' &&
          question.payload.mode === 'trace' &&
          question.tags.includes('kanji:writing') &&
          question.tags.includes('kanji:canonical'),
      ),
    ).toBe(true);
    expect(generated.writing.some((question) => preservedWritingCharacters.has(question.payload.kanji))).toBe(
      false,
    );
  });

  it.each([1, 2, 3, 4, 5, 6] as const)('%i年の音読み・訓読みを配当字数と同数生成する', (grade) => {
    expect(generated.onyomi.filter((question) => question.grade === grade)).toHaveLength(
      expectedCounts[grade],
    );
    expect(generated.kunyomi.filter((question) => question.grade === grade)).toHaveLength(
      expectedCounts[grade],
    );
  });

  it('存在しないカテゴリの読み問題を作らない', () => {
    expect(generated.kunyomi.some((question) => question.character === '王')).toBe(false);
    expect(
      generated.onyomi.some((question) => question.character === '貝' || question.character === '畑'),
    ).toBe(false);
  });

  it('読み問題を正規の正解と安全な4択だけで作る', () => {
    const canonical = new Map(records.map((record) => [record.character, record]));
    for (const [category, questions] of [
      ['onyomi', generated.onyomi],
      ['kunyomi', generated.kunyomi],
    ] as const) {
      const signatures = new Set<string>();
      for (const question of questions) {
        const record = canonical.get(question.character)!;
        const validReadings = new Set(record[category].map(({ reading }) => normalizeKanjiReading(reading)));
        const texts = question.payload.choices.map(({ text }) => text);
        const answer = question.payload.choices.find(({ id }) => id === question.payload.answer)!.text;

        expect(texts).toHaveLength(4);
        expect(new Set(texts).size).toBe(4);
        expect(validReadings.has(answer)).toBe(true);
        expect(texts.filter((text) => validReadings.has(text))).toEqual([answer]);
        signatures.add(
          [question.character, answer, ...texts.filter((text) => text !== answer).sort()].join('|'),
        );
      }
      expect(signatures.size).toBe(questions.length);
    }
  });

  it('同じ入力から同じID・順序・選択肢と30問以下のセットを作る', () => {
    expect(generateKanjiQuestions(records, preservedWritingCharacters)).toEqual(generated);
    const files = buildKanjiQuestionFiles('kunyomi', generated.kunyomi);

    expect(files.every((file) => file.questions.length <= 30)).toBe(true);
    expect(files[0]?.file).toBe('questions/kokugo/g1/kanji-kunyomi/set-001.json');
    expect(new Set(generated.kunyomi.map((question) => question.id)).size).toBe(1026);
  });
});
