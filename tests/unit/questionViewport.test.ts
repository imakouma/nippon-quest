// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { questionScale, withQuestionViewport } from '../../src/questions/renderers/shared/questionViewport';
import type { QuestionRenderer, RendererContext } from '../../src/questions/contracts';

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});
describe('proportional question viewport', () => {
  it('uses one scale constrained by both width and height', () => {
    expect(questionScale(960, 540, 540)).toBe(1);
    expect(questionScale(480, 270, 540)).toBe(0.5);
    expect(questionScale(720, 200, 540)).toBeCloseTo(200 / 540);
    expect(questionScale(480, 270, 1080)).toBe(0.25);
    expect(questionScale(0, 0, 540)).toBe(0);
  });
  it('preserves result and abort, and disconnects resizing when the renderer finishes', async () => {
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = disconnect;
      },
    );
    const container = document.createElement('div');
    document.body.append(container);
    const controller = new AbortController();
    let inner!: RendererContext;
    let done!: (r: { questionId: string; score: number; timeMs: number; attempts: number }) => void;
    const renderer = {
      type: 'test',
      mount: (ctx: RendererContext) => {
        inner = ctx;
        return new Promise((resolve) => {
          done = resolve;
        });
      },
    } as QuestionRenderer;
    const pending = withQuestionViewport(renderer).mount({
      container,
      signal: controller.signal,
      question: { id: 'test', type: 'test', subject: 'sansu', grade: 1, unit: 'test', payload: {} },
      grade: 1,
      assets: { image: (path) => path, audio: (path) => path },
      speak: vi.fn(),
      timeLimitMs: 0,
    });
    expect(inner.signal).toBe(controller.signal);
    expect(inner.container).not.toBe(container);
    expect(inner.container.className).toBe('nq-question-canvas');
    const result = { questionId: 'test', score: 1, timeMs: 1234, attempts: 1 };
    done(result);
    expect(await pending).toBe(result);
    expect(disconnect).toHaveBeenCalledOnce();
    expect(container.children).toHaveLength(0);
  });
});
