// @vitest-environment jsdom
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { choiceRenderer } from '../../src/questions/renderers/choice';
import { textInputRenderer } from '../../src/questions/renderers/text-input';
import type { QuestionRenderer, RendererContext } from '../../src/questions/contracts';
import { setDictionary } from '../../src/ui/i18n';

beforeEach(() => {
  vi.useFakeTimers();
  setDictionary({ question: { showExplanation: 'かんがえかたを みる', next: 'つぎへ' } });
});
afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

for (const [renderer, payload] of [
  [
    choiceRenderer,
    {
      prompt: '1+1',
      choices: [
        { id: 'a', text: '2' },
        { id: 'b', text: '3' },
      ],
      answer: 'a',
      shuffle: false,
    },
  ],
  [textInputRenderer, { prompt: '1+1', answers: ['2'] }],
] as const) {
  function mount(subject: 'sansu' | 'kokugo' = 'sansu', grade: 1 | 4 = 1, explanation = '答[こた]えは 2') {
    const container = document.createElement('div');
    document.body.append(container);
    const controller = new AbortController();
    const ctx: RendererContext = {
      container,
      grade,
      signal: controller.signal,
      timeLimitMs: 60_000,
      question: {
        id: 'test',
        type: renderer.type,
        subject,
        grade,
        unit: 'sansu.g1.test',
        payload,
        explanation,
      },
      assets: { image: (p) => p, audio: (p) => p },
      speak: vi.fn(),
    };
    let result!: ReturnType<QuestionRenderer['mount']>;
    act(() => {
      result = renderer.mount(ctx);
    });
    const answer = () =>
      act(() => {
        if (renderer.type === 'choice') (container.querySelector('.nq-choice') as HTMLButtonElement).click();
        else {
          const input = container.querySelector('input')!;
          input.value = '2';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    const submit = () =>
      act(() => {
        if (renderer.type === 'text-input')
          (container.querySelector('.nq-input-submit') as HTMLButtonElement).click();
      });
    return { container, controller, result, answer, submit };
  }
  it(`${renderer.type}: holds feedback, reveals explanation and excludes review time`, async () => {
    const { container, result, answer, submit } = mount();
    answer();
    submit();
    let settled = false;
    void result.then(() => {
      settled = true;
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(settled).toBe(false);
    expect(container.querySelector('.nq-feedback-correct')).not.toBeNull();
    expect(document.activeElement).toBe(container.querySelector('.nq-review-next'));
    act(() => (container.querySelector('.nq-review-explain') as HTMLButtonElement).click());
    expect(container.querySelector('ruby')).not.toBeNull();
    expect(document.activeElement).toBe(container.querySelector('.nq-review p'));
    act(() => (container.querySelector('.nq-review-next') as HTMLButtonElement).click());
    expect(await result).toMatchObject({ score: 1, timeMs: 0, timedOut: false });
  });
  it(`${renderer.type}: allows continuing without an explanation`, async () => {
    const { container, result, answer, submit } = mount('sansu', 1, '');
    answer();
    submit();
    expect(container.querySelector('.nq-review-explain')).toBeNull();
    act(() => (container.querySelector('.nq-review-next') as HTMLButtonElement).click());
    expect(await result).toMatchObject({ score: 1 });
  });
  it(`${renderer.type}: grade 4 math still advances after 900 ms`, async () => {
    const { result, answer, submit } = mount('sansu', 4);
    answer();
    submit();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(await result).toMatchObject({ score: 1 });
  });
  it(`${renderer.type}: abort during review settles once`, async () => {
    const { controller, result, answer, submit } = mount();
    answer();
    submit();
    act(() => controller.abort());
    expect(await result).toMatchObject({ score: 0, timedOut: true });
  });
  it(`${renderer.type}: other subjects still advance after 900 ms`, async () => {
    const { result, answer, submit } = mount('kokugo', 4);
    answer();
    submit();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(await result).toMatchObject({ score: 1 });
  });
}
