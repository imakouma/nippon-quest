// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'preact/test-utils';
import type { RendererContext } from '../../src/questions/contracts';
import { mapTapRenderer } from '../../src/questions/renderers/map-tap';

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
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('中断済みの signal でも 0 点で完了する', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.append(container);
    const controller = new AbortController();
    controller.abort();

    let resultPromise!: ReturnType<typeof mapTapRenderer.mount>;
    act(() => {
      resultPromise = mapTapRenderer.mount(context(container, controller.signal));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });

    await expect(resultPromise).resolves.toMatchObject({
      questionId: question.id,
      score: 0,
      attempts: 0,
      timedOut: true,
    });
  });

  it('表示中の中断でも 0 点で一度だけ完了する', async () => {
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
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });

    await expect(resultPromise).resolves.toMatchObject({ score: 0, attempts: 0, timedOut: true });
  });
});
