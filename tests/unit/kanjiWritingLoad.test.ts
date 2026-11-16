// @vitest-environment jsdom
import { act } from 'preact/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { kanjiTraceRenderer } from '../../src/questions/renderers/kanji-trace';
import type { WritingData } from '../../src/questions/renderers/kanji-trace/writingAssessment';
import { loadWriting } from '../../src/questions/renderers/kanji-trace/writingData';
import type { RendererContext } from '../../src/questions/contracts';
import { setDictionary } from '../../src/ui/i18n';
import dictionary from '../../content/i18n/ja.json';
vi.mock('../../src/questions/renderers/kanji-trace/writingData', () => ({ loadWriting: vi.fn() }));
afterEach(() => {
  vi.resetAllMocks();
  document.body.replaceChildren();
});
function context(signal?: AbortSignal): RendererContext {
  setDictionary(dictionary);
  const container = document.createElement('div');
  document.body.append(container);
  return {
    container,
    signal,
    grade: 2,
    timeLimitMs: 60000,
    speak: () => undefined,
    assets: { image: (p) => p, audio: (p) => p },
    question: {
      id: 'loading.test',
      type: 'kanji-trace',
      subject: 'kokugo',
      grade: 2,
      unit: 'test',
      payload: { kanji: '風', reading: 'かぜ' },
    },
  };
}
it('aborts while handwriting data is loading without mounting a late canvas', async () => {
  let finish!: (value: WritingData) => void;
  vi.mocked(loadWriting).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const controller = new AbortController();
  const ctx = context(controller.signal);
  const result = kanjiTraceRenderer.mount(ctx);
  expect(ctx.container.querySelector('[role=status]')).not.toBeNull();
  await act(async () => {
    controller.abort();
  });
  await expect(result).resolves.toMatchObject({ score: 0, attempts: 0, timedOut: true });
  await act(async () => {
    finish({});
  });
  expect(ctx.container.childElementCount).toBe(0);
});
it('propagates a data load failure instead of falling back to permissive scoring', async () => {
  vi.mocked(loadWriting).mockRejectedValue(new Error('offline'));
  const ctx = context();
  await expect(kanjiTraceRenderer.mount(ctx)).rejects.toThrow('offline');
  expect(ctx.container.childElementCount).toBe(0);
});
