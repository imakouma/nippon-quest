// @vitest-environment jsdom
import { h, render } from 'preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RendererContext } from '../../src/questions/contracts';
import { TextInputView } from '../../src/questions/renderers/text-input/TextInputView';

const context = {
  grade: 3,
  question: { subject: 'sansu', grade: 3 },
  timeLimitMs: 10000,
  assets: { image: (path: string) => path },
} as RendererContext;

afterEach(() => render(null, document.body));

describe('text input illustrations', () => {
  it('provides a scrollable, labelled image when alt text is supplied', () => {
    render(
      h(TextInputView, {
        ctx: context,
        payload: {
          prompt: '表を見よう',
          answers: ['9'],
          promptImage: 'table.svg',
          promptImageAlt: '表の内容',
        },
        onDone: vi.fn(),
      }),
      document.body,
    );
    const image = document.querySelector<HTMLImageElement>('.nq-input-illustration img');
    expect(image?.alt).toBe('表の内容');
    expect(image?.parentElement?.tabIndex).toBe(0);
    expect(document.querySelector('input')).not.toBeNull();
    expect(document.querySelector('button')).not.toBeNull();
  });

  it('preserves decorative images in the existing layout', () => {
    render(
      h(TextInputView, {
        ctx: context,
        payload: { prompt: '問題', answers: ['1'], promptImage: 'old.png' },
        onDone: vi.fn(),
      }),
      document.body,
    );
    expect(document.querySelector('.nq-q-prompt-img')?.getAttribute('alt')).toBe('');
    expect(document.querySelector('.nq-input-illustration')).toBeNull();
  });
});
