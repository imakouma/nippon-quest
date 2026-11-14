// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { setDictionary } from '../../src/ui/i18n';
import type { QuestionBase, RendererContext } from '../../src/questions/contracts';
import { defaultRandomCalculation } from '../../src/questions/renderers/random-calculation/schema';
import {
  createCalculationQuestion,
  randomCalculationRenderer,
} from '../../src/questions/renderers/random-calculation';
import { choiceRenderer } from '../../src/questions/renderers/choice';
import { textInputRenderer } from '../../src/questions/renderers/text-input';
import { choicePayloadSchema } from '../../src/questions/renderers/choice/schema';
import { textInputPayloadSchema, textInputScore } from '../../src/questions/renderers/text-input/schema';

setDictionary(JSON.parse(readFileSync('content/i18n/ja.json', 'utf8')));
afterEach(() => vi.restoreAllMocks());
const question: QuestionBase = {
  id: 'sansu.g1.tashizan.random.test',
  unit: 'sansu.g1.tashizan',
  subject: 'sansu',
  grade: 1,
  type: 'random-calculation',
  explanation: 'STALE',
  payload: { ...defaultRandomCalculation, prompt: 'たしざん' },
};

describe('random calculation adapter', () => {
  it.each(['choice', 'text-input'] as const)(
    'builds a valid %s question with the right answer and explanation',
    (response) => {
      const source = { ...question, payload: { ...defaultRandomCalculation, prompt: 'たしざん', response } };
      const result = createCalculationQuestion(source, 'one');
      expect(result).toEqual(createCalculationQuestion(source, 'one'));
      expect(result.question.id).toBe(source.id);
      expect(result.question.explanation).not.toContain('STALE');
      expect(result.question.explanation).toContain(
        `${result.detail.left} ＋ ${result.detail.right} ＝ ${result.detail.answer}`,
      );
      if (response === 'choice') {
        const payload = choicePayloadSchema.parse(result.question.payload);
        expect(payload.choices.find((c) => c.id === payload.answer)?.text).toBe(String(result.detail.answer));
        expect(payload.shuffle).toBe(false);
      } else {
        const payload = textInputPayloadSchema.parse(result.question.payload);
        expect(textInputScore(payload, [String(result.detail.answer)])).toBe(1);
        expect(textInputScore(payload, [String(result.detail.answer + 1)])).toBe(0);
        expect(payload.template).toContain('{{INPUT}}');
      }
      expect(source.explanation).toBe('STALE');
    },
  );

  it.each(['choice', 'text-input'] as const)(
    'delegates %s once and retains scoring, abort signal and generated detail',
    async (response) => {
      const target = response === 'choice' ? choiceRenderer : textInputRenderer;
      const completed = {
        questionId: question.id,
        score: 0,
        timeMs: 321,
        attempts: 0,
        timedOut: true,
        detail: { values: [''] },
      };
      const mount = vi.spyOn(target, 'mount').mockResolvedValue(completed);
      const ctx: RendererContext = {
        question: { ...question, payload: { ...defaultRandomCalculation, prompt: 'たしざん', response } },
        grade: 1,
        container: document.createElement('div'),
        assets: { image: (p) => p, audio: (p) => p },
        speak: vi.fn(),
        timeLimitMs: 500,
        signal: new AbortController().signal,
      };
      const result = await randomCalculationRenderer.mount(ctx);
      expect(mount).toHaveBeenCalledTimes(1);
      const delegated = mount.mock.calls[0]![0];
      expect(delegated.container).toBe(ctx.container);
      expect(delegated.signal).toBe(ctx.signal);
      expect(delegated.timeLimitMs).toBe(ctx.timeLimitMs);
      expect(result).toMatchObject(completed);
      const generated = result.detail!.generated as { seed: string };
      expect(delegated.question).toEqual(createCalculationQuestion(ctx.question, generated.seed).question);
    },
  );
});

it('remainder questions grade two inputs and encode unique answer pairs in choices', () => {
  const payload = {
    prompt: 'わりざん',
    operation: 'divide',
    stage: 'division',
    leftMin: 17,
    leftMax: 17,
    rightMin: 5,
    rightMax: 5,
    carry: false,
    remainder: true,
    response: 'text-input',
  };
  const source = { ...question, grade: 3 as const, unit: 'sansu.g3.random-calculation', payload };
  const input = createCalculationQuestion(source, 'remainder');
  const parsed = textInputPayloadSchema.parse(input.question.payload);
  expect(parsed.answers).toEqual(['3', '2']);
  expect(textInputScore(parsed, ['3', '2'])).toBe(1);
  expect(textInputScore(parsed, ['3', '3'])).toBeLessThan(1);
  expect(input.question.explanation).toContain('5 × 3 ＋ 2 ＝ 17');
  const choice = createCalculationQuestion(
    { ...source, payload: { ...payload, response: 'choice' } },
    'remainder',
  );
  const choices = choicePayloadSchema.parse(choice.question.payload);
  expect(choices.choices.find((c) => c.id === choices.answer)?.text).toBe('3 あまり 2');
  expect(new Set(choices.choices.map((c) => c.text)).size).toBe(4);
  expect(() => createCalculationQuestion({ ...source, grade: 1 }, 'bad')).toThrow();
});
