// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'preact/test-utils';
import type { QuestionBase, QuestionRenderer, RendererContext } from '../../src/questions/contracts';
import { choiceRenderer } from '../../src/questions/renderers/choice';
import { experimentRenderer } from '../../src/questions/renderers/experiment';
import { numberBuildRenderer } from '../../src/questions/renderers/number-build';
import { pictureWordRenderer } from '../../src/questions/renderers/picture-word';
import { textInputRenderer } from '../../src/questions/renderers/text-input';
import { setDictionary } from '../../src/ui/i18n';

const cases: { name: string; renderer: QuestionRenderer; payload: unknown }[] = [
  {
    name: 'choice',
    renderer: choiceRenderer,
    payload: {
      prompt: 'どっち？',
      choices: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
      ],
      answer: 'a',
      shuffle: false,
    },
  },
  {
    name: 'text-input',
    renderer: textInputRenderer,
    payload: { prompt: '1 + 1 =', answers: ['2'] },
  },
  {
    name: 'number-build',
    renderer: numberBuildRenderer,
    payload: { mode: 'keypad', prompt: '1 + 1 =', answer: 2 },
  },
  {
    name: 'picture-word',
    renderer: pictureWordRenderer,
    payload: {
      picture: 'apple',
      words: [
        { id: 'apple', text: 'apple' },
        { id: 'dog', text: 'dog' },
      ],
      answer: 'apple',
      shuffle: false,
    },
  },
  {
    name: 'experiment',
    renderer: experimentRenderer,
    payload: {
      title: 'じっけん',
      predict: {
        prompt: 'どうなる？',
        choices: [
          { id: 'on', text: 'つく' },
          { id: 'off', text: 'つかない' },
        ],
        answer: 'on',
      },
      controls: [{ id: 'power', label: 'でんき', type: 'toggle' }],
      outcome: {
        formula: 'power',
        label: 'あかるさ',
        visual: 'circuit',
        visualRange: [0, 1],
      },
    },
  },
];

function context(
  type: string,
  payload: unknown,
  container: HTMLElement,
  signal: AbortSignal,
): RendererContext {
  const question: QuestionBase = {
    id: `sansu.g3.abort.${type}`,
    type,
    subject: 'sansu',
    grade: 3,
    unit: 'sansu.g3.abort',
    payload,
  };
  return {
    container,
    question,
    grade: 3,
    assets: { image: (path) => path, audio: (path) => path },
    speak: () => undefined,
    timeLimitMs: 20_000,
    signal,
  };
}

describe('question renderer cancellation', () => {
  beforeEach(() => {
    setDictionary({
      question: {
        speak: 'よみあげ',
        numberBuildClear: 'けす',
        numberBuildAnswer: 'こたえる',
        pictureWordPrompt: 'どれ？',
        pictureAlt: 'もんだいの え',
        experimentPredict: 'よそう',
        experimentTry: 'ためす',
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  for (const testCase of cases) {
    it(`${testCase.name} は中断済み signal でも待ち続けない`, async () => {
      vi.useFakeTimers();
      const container = document.createElement('div');
      document.body.append(container);
      const controller = new AbortController();
      controller.abort();

      let resultPromise!: Promise<unknown>;
      act(() => {
        resultPromise = testCase.renderer.mount(
          context(testCase.renderer.type, testCase.payload, container, controller.signal),
        );
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_000);
      });

      await expect(resultPromise).resolves.toMatchObject({ score: 0, timedOut: true });
    });
  }
});
