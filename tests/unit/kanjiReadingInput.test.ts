import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildKanjiQuestionFiles,
  generateKanjiQuestions,
  normalizeKanjiReading,
  type CanonicalKanjiRecord,
} from '../../scripts/generate-kanji-questions';
import { textInputPayloadSchema, textInputScore } from '../../src/questions/renderers/text-input/schema';

const records = JSON.parse(
  readFileSync(new URL('../../content/kanji/readings.json', import.meta.url), 'utf8'),
) as CanonicalKanjiRecord[];
const generated = generateKanjiQuestions(records, new Set(['山', '石', '風']));

describe('全学年の漢字の読み入力', () => {
  for (const grade of [1, 2, 3, 4, 5, 6]) {
    for (const category of ['onyomi', 'kunyomi'] as const) {
      it(`${grade}年${category}の全問が例文入力になり、正規読みと対象漢字を保つ`, () => {
        const questions = generated[category].filter((q) => q.grade === grade);
        const gradeRecords = records.filter((r) => r.grade === grade);
        expect(questions).toHaveLength(gradeRecords.length);
        expect(new Set(questions.map((q) => q.character))).toEqual(
          new Set(gradeRecords.filter((r) => r[category].length > 0).map((r) => r.character)),
        );
        const prompts = new Set<string>();
        for (const [index, question] of questions.entries()) {
          expect(question.id).toBe(
            `kokugo.g${grade}.kanji-${category}.${String(index + 1).padStart(4, '0')}`,
          );
          expect(question.type).toBe('text-input');
          const payload = textInputPayloadSchema.parse(question.payload);
          expect(payload.prompt.match(/\p{Script=Han}/gu)).toEqual([question.character]);
          expect(payload.prompt).not.toMatch(/[[\]]|Enter|ひらがなで/);
          expect(payload.answers).toHaveLength(1);
          expect(payload.answers[0]).toMatch(/^[ぁ-ゖー]+$/u);
          expect(payload.template).toMatch(/^よみかた：\{\{INPUT\}\}[ぁ-ゖー]*$/u);
          expect(payload.suffix).toBeUndefined();
          const ending = payload.template!.split('{{INPUT}}')[1]!;
          expect(payload.prompt).toContain(question.character + ending);
          if (category === 'onyomi') expect(ending).toBe('');
          const record = gradeRecords.find((r) => r.character === question.character)!;
          expect(record[category].map((r) => normalizeKanjiReading(r.reading))).toContain(
            payload.answers[0]! + ending,
          );
          expect(textInputScore(payload, payload.answers)).toBe(1);
          expect(textInputScore(payload, ['まちがい'])).toBe(0);
          if (ending) expect(textInputScore(payload, [payload.answers[0]! + ending])).toBe(0);
          prompts.add(payload.prompt);
        }
        expect(prompts.size).toBe(questions.length);
        for (const file of buildKanjiQuestionFiles(category, questions)) {
          expect(
            JSON.parse(readFileSync(new URL(`../../content/${file.file}`, import.meta.url), 'utf8')),
          ).toEqual(file.questions);
        }
      });
    }
  }
});
