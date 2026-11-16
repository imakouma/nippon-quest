// @vitest-environment jsdom
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import ja from '../../content/i18n/ja.json';
import type { QuestionBase, RendererContext } from '../../src/questions/contracts';
import { ChoiceView } from '../../src/questions/renderers/choice/ChoiceView';
import { choicePayloadSchema } from '../../src/questions/renderers/choice/schema';
import { setDictionary } from '../../src/ui/i18n';
import { readUnitQuestionSets } from './questionSetFixture';

afterEach(() => render(null, document.body));

it.each([
  ['kokugo/g1/legacy-jpn-1-1', 'legacy.kokugo.g1.jpn-1-1.c14981bbfd9d'],
  ['kokugo/g1/joshi', 'kokugo.g1.joshi.0002'],
  ['kokugo/g3/legacy-jpn-3-15', 'legacy.kokugo.g3.jpn-3-15.02f3a8f0a82c'],
  ['kokugo/g5/legacy-jpn-5-kanji-1', 'source.kokugo.g5.jpn-5-kanji-1.e602af47e67c'],
  ['kokugo/g6/legacy-jpn-6-kanji-9', 'source.kokugo.g6.jpn-6-kanji-9.685247422d65'],
  ['sansu/g2/legacy-math-2-16', 'legacy.sansu.g2.math-2-16.34d0521d92a6'],
  ['sansu/g2/legacy-math-2-17', 'legacy.sansu.g2.math-2-17.6a31345deb9e'],
  ['rika/g3/legacy-cur-1503-10', 'legacy.rika.g3.cur-1503-10.e58ebf4e9b98'],
])('文字・数字・単位の読みは音声なしで解答できる: %s', (unit, id) => {
  setDictionary(ja);
  const question = readUnitQuestionSets<QuestionBase>(...unit.split('/')).find((q) => q.id === id)!;
  const payload = choicePayloadSchema.parse(question.payload);
  const speak = vi.fn();
  render(
    h(ChoiceView, {
      ctx: {
        question,
        grade: question.grade,
        timeLimitMs: 0,
        assets: { image: (path: string) => path },
        speak,
      } as unknown as RendererContext,
      payload,
      order: payload.choices.map((choice) => choice.id),
      onDone: vi.fn(),
    }),
    document.body,
  );
  expect(document.querySelector('.nq-btn-speak')).toBeNull();
  const answerIndex = payload.choices.findIndex((choice) => choice.id === payload.answer);
  act(() => document.querySelectorAll<HTMLButtonElement>('.nq-choice')[answerIndex]!.click());
  expect(document.querySelector('.nq-feedback-correct')).not.toBeNull();
  expect(speak).not.toHaveBeenCalled();
});
