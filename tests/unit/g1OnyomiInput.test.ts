import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  generateKanjiQuestions,
  buildKanjiQuestionFiles,
  type CanonicalKanjiRecord,
} from '../../scripts/generate-kanji-questions';
import { textInputPayloadSchema, textInputScore } from '../../src/questions/renderers/text-input/schema';

const records = JSON.parse(
  readFileSync(new URL('../../content/kanji/readings.json', import.meta.url), 'utf8'),
) as CanonicalKanjiRecord[];
const generated = generateKanjiQuestions(records, new Set(['山', '石', '風']));
const questions = generated.onyomi.filter((q) => q.grade === 1);

describe('1年生の音読み入力問題', () => {
  it('一ばんおいしいパンの一をひらがなで答える', () => {
    expect(questions[0]).toMatchObject({
      id: 'kokugo.g1.kanji-onyomi.0001',
      type: 'text-input',
      payload: { prompt: '一ばんおいしいパン', answers: ['いち'] },
    });
    const payload = textInputPayloadSchema.parse(questions[0]!.payload);
    expect(textInputScore(payload, ['いち'])).toBe(1);
    expect(textInputScore(payload, ['ひと'])).toBe(0);
    expect(textInputScore(payload, ['いちばん'])).toBe(0);
  });
  it('80問とも例文の漢字一字だけを問い、読みを見せず、同じIDで保存する', () => {
    expect(questions).toHaveLength(80);
    const prompts = new Set<string>();
    for (const q of questions) {
      expect(q.type).toBe('text-input');
      const payload = textInputPayloadSchema.parse(q.payload);
      expect(payload.answers).toHaveLength(1);
      expect(payload.prompt.match(/\p{Script=Han}/gu)).toEqual([q.character]);
      expect(payload.prompt).not.toMatch(/[[\]]/);
      expect(payload.answers[0]).toMatch(/^[ぁ-ゖー]+$/u);
      expect(payload.template).toBe('よみかた：{{INPUT}}');
      expect(payload.suffix).toBeUndefined();
      prompts.add(payload.prompt);
    }
    expect(prompts.size).toBe(80);
    for (const file of buildKanjiQuestionFiles('onyomi', questions)) {
      expect(
        JSON.parse(readFileSync(new URL(`../../content/${file.file}`, import.meta.url), 'utf8')),
      ).toEqual(file.questions);
    }
  });
  it('2〜6年の音読みと全年の訓読みは選択式のまま', () => {
    expect(generated.onyomi.filter((q) => q.grade !== 1).every((q) => q.type === 'choice')).toBe(true);
    expect(generated.kunyomi.every((q) => q.type === 'choice')).toBe(true);
  });
});
