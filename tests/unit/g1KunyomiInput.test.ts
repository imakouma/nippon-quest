import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  generateKanjiQuestions,
  buildKanjiQuestionFiles,
  type CanonicalKanjiRecord,
} from '../../scripts/generate-kanji-questions';
import { auditKanjiQuestionCoverage } from '../../scripts/audit-kanji-question-coverage';
import { textInputPayloadSchema, textInputScore } from '../../src/questions/renderers/text-input/schema';
import type { QuestionBase } from '../../src/questions/contracts';

const records = JSON.parse(
  readFileSync(new URL('../../content/kanji/readings.json', import.meta.url), 'utf8'),
) as CanonicalKanjiRecord[];
const generated = generateKanjiQuestions(records, new Set(['山', '石', '風']));
const questions = generated.kunyomi.filter((q) => q.grade === 1);

describe('1年生の訓読み入力問題', () => {
  it('送り仮名を入力欄の外へ出し、強調した漢字の読みだけを採点する', () => {
    expect(questions[0]).toMatchObject({
      id: 'kokugo.g1.kanji-kunyomi.0001',
      type: 'text-input',
      payload: { prompt: '一つの りんご', template: 'よみかた：{{INPUT}}つ', answers: ['ひと'] },
    });
    const rest = questions.find((q) => q.character === '休')!;
    const payload = textInputPayloadSchema.parse(rest.payload);
    expect(payload.template).toBe('よみかた：{{INPUT}}む');
    expect(textInputScore(payload, ['やす'])).toBe(1);
    expect(textInputScore(payload, ['やすむ'])).toBe(0);
    expect(rest.explanation).toContain('「休」は「やす」');
  });

  it('80問のIDを保ち、例文に漢字一字だけを使い、常時案内やルビを出さない', () => {
    expect(questions).toHaveLength(80);
    const prompts = new Set<string>();
    for (const [index, q] of questions.entries()) {
      expect(q.id).toBe(`kokugo.g1.kanji-kunyomi.${String(index + 1).padStart(4, '0')}`);
      expect(q.type).toBe('text-input');
      expect(q.tags).toEqual(['kanji:reading:kun', 'kanji:canonical']);
      const payload = textInputPayloadSchema.parse(q.payload);
      expect(payload.prompt.match(/\p{Script=Han}/gu)).toEqual([q.character]);
      expect(payload.prompt).not.toMatch(/[[\]]/);
      expect(payload.answers).toHaveLength(1);
      expect(payload.answers[0]).toMatch(/^[ぁ-ゖー]+$/u);
      expect(payload.suffix).toBeUndefined();
      const ending = payload.template!.split('{{INPUT}}')[1]!;
      const record = records.find((r) => r.character === q.character)!;
      expect(record.kunyomi.map((r) => r.reading.replaceAll('.', ''))).toContain(
        payload.answers[0]! + ending,
      );
      expect(payload.prompt).toContain(q.character + ending);
      prompts.add(payload.prompt);
    }
    expect(prompts.size).toBe(80);
    for (const file of buildKanjiQuestionFiles('kunyomi', questions)) {
      expect(
        JSON.parse(readFileSync(new URL(`../../content/${file.file}`, import.meta.url), 'utf8')),
      ).toEqual(file.questions);
    }
    expect(generated.kunyomi.filter((q) => q.grade > 1).every((q) => q.type === 'choice')).toBe(true);
  });

  it.each([
    [{ answers: ['いち'] }, '正規データの訓読みにありません'],
    [{ template: 'よみかた：{{INPUT}}る' }, '送り仮名'],
    [{ prompt: '一[ひと]つの りんご' }, 'ふりがな'],
  ])('不正な訓読み教材を独立監査で拒否する: %j', (patch, expected) => {
    const sources = (['writing', 'onyomi', 'kunyomi'] as const).flatMap((category) =>
      buildKanjiQuestionFiles(category, generated[category]),
    );
    for (const file of ['questions/kokugo/g1/kanji-trace.json', 'questions/kokugo/g2/kanji-trace.json']) {
      sources.push({
        file,
        questions: JSON.parse(
          readFileSync(new URL(`../../content/${file}`, import.meta.url), 'utf8'),
        ) as QuestionBase[],
      });
    }
    expect(auditKanjiQuestionCoverage(records, sources)).toEqual([]);
    const q = sources.flatMap((s) => s.questions).find((q) => q.id === questions[0]!.id)!;
    q.payload = { ...(q.payload as object), ...patch };
    expect(auditKanjiQuestionCoverage(records, sources).some((error) => error.includes(expected))).toBe(true);
  });
});
