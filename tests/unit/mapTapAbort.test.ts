// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'preact/test-utils';
import type { RendererContext } from '../../src/questions/contracts';
import { mapTapRenderer } from '../../src/questions/renderers/map-tap';
import { setDictionary } from '../../src/ui/i18n';

const question = {
  id: 'shakai.g3.map.0001',
  type: 'map-tap',
  subject: 'shakai' as const,
  grade: 3 as const,
  unit: 'shakai.g3.map',
  payload: {
    prompt: 'ここは どこ？',
    image: 'map.png',
    hotspots: [
      { x: 50, y: 50, label: 'まんなか' },
      { x: 20, y: 20, label: 'ひだりうえ' },
    ],
    answerIndex: 0,
    radius: 10,
  },
};

function context(container: HTMLElement, signal: AbortSignal): RendererContext {
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

describe('map-tap renderer cancellation', () => {
  beforeEach(() => {
    setDictionary({
      question: {
        remainingTime: 'のこり {n} びょう',
        mapTapMap: 'ちず',
        mapTapInstruction: 'やじるしキーで うごかして、Enterで こたえる',
        mapTapPosition: 'いまの ばしょ：よこ {x}%　たて {y}%',
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('中断済みの signal を演出待ちなしで 0 点完了する', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.append(container);
    const controller = new AbortController();
    controller.abort();

    let resultPromise!: ReturnType<typeof mapTapRenderer.mount>;
    act(() => {
      resultPromise = mapTapRenderer.mount(context(container, controller.signal));
    });
    let settled = false;
    void resultPromise.then(() => {
      settled = true;
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(settled).toBe(true);
    await expect(resultPromise).resolves.toMatchObject({
      questionId: question.id,
      score: 0,
      attempts: 0,
      timedOut: true,
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('表示中の中断も演出待ちなしで 0 点を一度だけ返す', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.append(container);
    const controller = new AbortController();

    let resultPromise!: ReturnType<typeof mapTapRenderer.mount>;
    act(() => {
      resultPromise = mapTapRenderer.mount(context(container, controller.signal));
    });
    act(() => {
      controller.abort();
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
    await expect(resultPromise).resolves.toMatchObject({ score: 0, attempts: 0, timedOut: true });
  });

  it('選んだ場所を赤い×ではなく読み上げ対象外の中立マーカーで示す', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.append(container);
    const controller = new AbortController();

    act(() => {
      void mapTapRenderer.mount(context(container, controller.signal));
    });
    act(() => {
      container.querySelector<HTMLButtonElement>('.nq-map-tap')!.click();
    });

    const marker = container.querySelector('.nq-map-pick');
    expect(marker).not.toBeNull();
    expect(marker?.textContent).not.toContain('×');
    expect(marker?.getAttribute('aria-hidden')).toBe('true');

    act(() => controller.abort());
  });
});
