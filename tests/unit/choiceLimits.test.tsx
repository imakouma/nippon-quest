// @vitest-environment jsdom
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { requireRenderer } from '../../src/questions/renderers/registry';
import { EditorQuestionForm } from '../../src/tools/editorQuestionForm';
import type { QuestionBase } from '../../src/questions/contracts';
import { normalizeLegacyDatabases } from '../../scripts/import-legacy-questions';
import { replaceQuestionForSave } from '../../src/tools/questionSave';

const options = (count: number) => Array.from({ length: count }, (_, i) => ({ id: `c${i}`, text: `${i}` }));
const question = (count: number): QuestionBase => ({
  id: 'sansu.g1.test.0001',
  type: 'choice',
  subject: 'sansu',
  grade: 1,
  unit: 'sansu.g1.test',
  payload: { prompt: 'えらぼう', choices: options(count), answer: 'c0' },
});

describe('選ぶ問題の上限', () => {
  for (const type of ['choice', 'picture-word', 'kanji-trace', 'experiment']) {
    it(`${type} は8個まで受理し9個を拒否する`, () => {
      const samples = JSON.parse(
        readFileSync(`content/questions/_samples/${type}.json`, 'utf8'),
      ) as QuestionBase[];
      const sample = samples.find(
        (q) => type !== 'kanji-trace' || (q.payload as { mode: string }).mode === 'reading',
      )!;
      for (const count of [2, 7, 8, 9]) {
        const payload = structuredClone(sample.payload) as Record<string, unknown>;
        if (type === 'kanji-trace') {
          payload.choices = options(count).map((c) => c.text);
          payload.answer = '0';
        } else if (type === 'experiment')
          payload.predict = { prompt: 'えらぼう', choices: options(count), answer: 'c0' };
        else {
          payload[type === 'picture-word' ? 'words' : 'choices'] = options(count);
          payload.answer = 'c0';
        }
        expect(requireRenderer(type).schema.safeParse(payload).success).toBe(count <= 8);
      }
    });
  }
  it('保存と旧データ取込も8個を受理し9個を拒否する', () => {
    const original = question(2);
    expect(replaceQuestionForSave([original], [original], original.id, question(8))).toEqual([question(8)]);
    expect(() => replaceQuestionForSave([original], [original], original.id, question(9))).toThrow();
    for (const count of [8, 9]) {
      const result = normalizeLegacyDatabases([
        {
          subject: 'sansu',
          database: {
            math_2_3: [{ question: 'えらぼう', choices: options(count).map((c) => c.text), correctIndex: 7 }],
          },
        },
      ]);
      expect(result.accepted).toHaveLength(count === 8 ? 1 : 0);
      expect(result.rejected).toHaveLength(count === 8 ? 0 : 1);
    }
  });
});

describe('選択肢追加ボタン', () => {
  afterEach(() => render(null, document.body));
  for (const count of [7, 8, 9]) {
    it(`${count}個のときの追加ボタン`, () => {
      act(() =>
        render(
          h(EditorQuestionForm, {
            question: question(count),
            onQuestionChange: vi.fn(),
            onFieldChange: vi.fn(),
            onPayloadChange: vi.fn(),
          }),
          document.body,
        ),
      );
      const add = [...document.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('選択肢を追加'),
      );
      expect(Boolean(add)).toBe(count < 8);
      expect(document.querySelectorAll('.ed-choice-row')).toHaveLength(count);
    });
  }
});
