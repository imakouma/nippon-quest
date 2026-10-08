// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'preact/test-utils';
import type { QuestionBase, QuestionRenderer, RendererContext } from '../../src/questions/contracts';
import { choiceRenderer } from '../../src/questions/renderers/choice';
import { experimentRenderer } from '../../src/questions/renderers/experiment';
import { numberBuildRenderer } from '../../src/questions/renderers/number-build';
import { pictureWordRenderer } from '../../src/questions/renderers/picture-word';
import { sortOrderRenderer } from '../../src/questions/renderers/sort-order';
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
  {
    name: 'sort-order',
    renderer: sortOrderRenderer,
    payload: {
      prompt: '古い じゅんに ならべよう',
      direction: 'horizontal',
      cards: [
        { id: 'new', text: 'いま' },
        { id: 'old', text: 'むかし' },
      ],
      answer: ['old', 'new'],
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
        remainingTime: 'のこり {n} びょう',
        answerNumber: 'こたえ {n}',
        answerSubmit: 'こたえる',
        textInputEnterHint: 'で つぎの らんへ／ぜんぶ いれたら こたえる',
        numberBuildClear: 'けす',
        numberBuildCurrent: 'いまの すうじ {n}',
        numberBuildAnswer: 'こたえる',
        pictureWordPrompt: 'どれ？',
        pictureAlt: 'もんだいの え',
        experimentPredict: 'よそう',
        experimentTry: 'ためす',
        sortMoveEarlier: '{name}を まえへ',
        sortMoveLater: '{name}を うしろへ',
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  for (const testCase of cases) {
    it(`${testCase.name} は中断済み signal を演出待ちなしで完了する`, async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
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
      let settled = false;
      void resultPromise.then(() => {
        settled = true;
      });
      await act(async () => {
        await Promise.resolve();
      });

      expect(settled).toBe(true);
      await expect(resultPromise).resolves.toMatchObject({ score: 0, timedOut: true });
      expect(warn).not.toHaveBeenCalled();
    });
  }

  it('choice は回答後のフィードバック待機中でも中断を即時完了する', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.append(container);
    const controller = new AbortController();
    const testCase = cases[0]!;

    let resultPromise!: Promise<unknown>;
    act(() => {
      resultPromise = testCase.renderer.mount(
        context(testCase.renderer.type, testCase.payload, container, controller.signal),
      );
    });
    act(() => {
      (container.querySelector('.nq-choice') as HTMLButtonElement).click();
      controller.abort();
    });
    let settled = false;
    void resultPromise.then(() => {
      settled = true;
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(settled).toBe(true);
    await expect(resultPromise).resolves.toMatchObject({ score: 0, timedOut: true });

    const nextQuestion = document.createElement('div');
    nextQuestion.textContent = 'つぎの もんだい';
    container.replaceChildren(nextQuestion);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(container.contains(nextQuestion)).toBe(true);
  });

  it('picture-word は正解後のフィードバック待機中でも中断を即時完了する', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.append(container);
    const controller = new AbortController();
    const testCase = cases[3]!;

    let resultPromise!: Promise<unknown>;
    act(() => {
      resultPromise = testCase.renderer.mount(
        context(testCase.renderer.type, testCase.payload, container, controller.signal),
      );
    });
    act(() => {
      (container.querySelector('.nq-pw-card') as HTMLButtonElement).click();
      controller.abort();
    });
    let settled = false;
    void resultPromise.then(() => {
      settled = true;
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(settled).toBe(true);
    await expect(resultPromise).resolves.toMatchObject({ score: 0, timedOut: true });

    const nextQuestion = document.createElement('div');
    nextQuestion.textContent = 'つぎの もんだい';
    container.replaceChildren(nextQuestion);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(container.contains(nextQuestion)).toBe(true);
  });

  it('experiment は結果演出中でも中断を即時完了する', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.append(container);
    const controller = new AbortController();
    const testCase = cases[4]!;

    let resultPromise!: Promise<unknown>;
    act(() => {
      resultPromise = testCase.renderer.mount(
        context(testCase.renderer.type, testCase.payload, container, controller.signal),
      );
    });
    act(() => {
      (container.querySelector('.nq-exp-choices button') as HTMLButtonElement).click();
    });
    act(() => {
      (container.querySelector('.nq-exp-next') as HTMLButtonElement).click();
    });
    act(() => {
      (container.querySelector('.nq-exp-next') as HTMLButtonElement).click();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_500);
    });
    act(() => controller.abort());
    let settled = false;
    void resultPromise.then(() => {
      settled = true;
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(settled).toBe(true);
    await expect(resultPromise).resolves.toMatchObject({ score: 0, timedOut: true });

    const nextQuestion = document.createElement('div');
    nextQuestion.textContent = 'つぎの もんだい';
    container.replaceChildren(nextQuestion);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(container.contains(nextQuestion)).toBe(true);
  });
});
