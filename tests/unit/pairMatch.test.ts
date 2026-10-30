// @vitest-environment jsdom

import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { QuestionResult, RendererContext } from '../../src/questions/contracts';
import { pairMatchRenderer } from '../../src/questions/renderers/pair-match';
import { pairMatchPayloadSchema, pairMatchScore } from '../../src/questions/renderers/pair-match/schema';
import { setDictionary } from '../../src/ui/i18n';

const payload = (faceDown: boolean) => ({
  prompt: 'あわせよう',
  pairs: [
    { a: { text: 'A' }, b: { text: 'a' } },
    { a: { text: 'B' }, b: { text: 'b' } },
  ],
  faceDown,
});

function context(container: HTMLElement, faceDown: boolean, signal?: AbortSignal): RendererContext {
  return {
    container,
    question: {
      id: 'shakai.g3.test.0001',
      type: 'pair-match',
      subject: 'shakai',
      grade: 3,
      unit: 'shakai.g3.test',
      payload: payload(faceDown),
    },
    grade: 3,
    assets: { image: (path) => path, audio: (path) => path },
    speak: () => undefined,
    timeLimitMs: 60_000,
    signal,
  };
}

describe('pair-match schema', () => {
  it('ミス回数で減点し、ペア数の2倍で0になる', () => {
    expect(pairMatchScore(0, 3)).toBe(1);
    expect(pairMatchScore(3, 3)).toBeCloseTo(0.5);
    expect(pairMatchScore(9, 3)).toBe(0);
  });

  it('faceDown は省略すると true', () => {
    expect(pairMatchPayloadSchema.parse({ ...payload(true), faceDown: undefined }).faceDown).toBe(true);
  });

  it('文字も絵もない面、1ペア、7ペアを拒否する', () => {
    expect(() =>
      pairMatchPayloadSchema.parse({
        prompt: 'p',
        pairs: [{ a: {}, b: { text: 'x' } }, payload(true).pairs[0]],
      }),
    ).toThrow();
    expect(() => pairMatchPayloadSchema.parse({ prompt: 'p', pairs: [payload(true).pairs[0]] })).toThrow();
    expect(() =>
      pairMatchPayloadSchema.parse({
        prompt: 'p',
        pairs: Array.from({ length: 7 }, () => payload(true).pairs[0]),
      }),
    ).toThrow();
  });
});

describe('pair-match renderer', () => {
  beforeEach(() =>
    setDictionary({
      question: {
        pairMatchBack: 'ふせてある カード',
        pairMatchRetry: 'やりなおす',
        remainingTime: 'のこり {n} びょう',
      },
    }),
  );

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  async function play(picks: (cards: HTMLButtonElement[]) => HTMLButtonElement[][]) {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.append(container);
    let result!: Promise<QuestionResult>;
    act(() => {
      result = pairMatchRenderer.mount(context(container, false));
    });
    const cards = [...container.querySelectorAll<HTMLButtonElement>('.nq-pm-card')];
    for (const turn of picks(cards))
      for (const card of turn)
        await act(async () => {
          card.click();
          await vi.advanceTimersByTimeAsync(900);
        });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    return result;
  }

  it('見えたままのカードを正しく合わせると score 1', async () => {
    const result = await play((cards) => {
      const byText = (text: string) => cards.find((card) => card.textContent === text)!;
      return [
        [byText('A'), byText('a')],
        [byText('B'), byText('b')],
      ];
    });

    expect(result).toMatchObject({ score: 1, attempts: 2, timedOut: false, detail: { misses: 0 } });
  });

  it('同じ列の選び直しはミスにせず、異なるペアは減点する', async () => {
    const result = await play((cards) => {
      const byText = (text: string) => cards.find((card) => card.textContent === text)!;
      return [
        [byText('A'), byText('B'), byText('a')],
        [byText('A'), byText('a')],
        [byText('B'), byText('b')],
      ];
    });

    expect(result).toMatchObject({ score: 0.75, attempts: 3, detail: { misses: 1 } });
  });

  it('ふせたカードは中身を隠し、めくると表になる', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.append(container);
    act(() => {
      void pairMatchRenderer.mount(context(container, true));
    });
    const cards = [...container.querySelectorAll<HTMLButtonElement>('.nq-pm-card')];

    expect(cards).toHaveLength(4);
    expect(cards.every((card) => card.textContent === '？')).toBe(true);
    expect(cards.every((card) => card.getAttribute('aria-label') === 'ふせてある カード')).toBe(true);
    act(() => cards[0]!.click());
    expect(cards[0]!.textContent).not.toBe('？');
  });

  it('やりなおすと揃えたカードと採点を初期化する', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.append(container);
    let result!: Promise<QuestionResult>;
    act(() => {
      result = pairMatchRenderer.mount(context(container, false));
    });
    const byText = (text: string) =>
      [...container.querySelectorAll<HTMLButtonElement>('.nq-pm-card')].find(
        (card) => card.textContent === text,
      )!;

    act(() => byText('A').click());
    act(() => byText('b').click());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    act(() => byText('A').click());
    act(() => byText('a').click());
    expect(container.querySelectorAll('.nq-pm-matched')).toHaveLength(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    act(() => {
      container.querySelector<HTMLButtonElement>('.nq-pm-retry')!.click();
    });
    expect(container.querySelectorAll('.nq-pm-matched')).toHaveLength(0);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(31_000);
    });
    let settled = false;
    void result.then(() => {
      settled = true;
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(settled).toBe(false);

    act(() => byText('A').click());
    act(() => byText('a').click());
    act(() => byText('B').click());
    act(() => byText('b').click());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });

    await expect(result).resolves.toMatchObject({
      score: 1,
      attempts: 2,
      timedOut: false,
      detail: { misses: 0 },
    });
  });

  it('完了演出中の abort は待機 timer を残さず score 0 で即時完了する', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.append(container);
    const controller = new AbortController();
    let result!: Promise<QuestionResult>;
    act(() => {
      result = pairMatchRenderer.mount(context(container, false, controller.signal));
    });
    const byText = (text: string) =>
      [...container.querySelectorAll<HTMLButtonElement>('.nq-pm-card')].find(
        (card) => card.textContent === text,
      )!;
    act(() => {
      byText('A').click();
      byText('a').click();
      byText('B').click();
      byText('b').click();
      controller.abort();
    });

    let settled = false;
    void result.then(() => {
      settled = true;
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(settled).toBe(true);
    await expect(result).resolves.toMatchObject({ score: 0, timedOut: true });
  });
});
