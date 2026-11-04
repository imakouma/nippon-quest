// @vitest-environment jsdom
import { h, render } from 'preact';
import { afterEach, expect, it, vi } from 'vitest';
import ja from '../../content/i18n/ja.json';
import { setDictionary } from '../../src/ui/i18n';
import { TextInputView } from '../../src/questions/renderers/text-input/TextInputView';
import type { RendererContext } from '../../src/questions/contracts';

afterEach(() => render(null, document.body));
it('offers speech even when the equation replaces the repeated prompt', () => {
  setDictionary(ja);
  const speak = vi.fn();
  render(
    h(TextInputView, {
      ctx: {
        grade: 1,
        question: { subject: 'sansu', grade: 1 },
        timeLimitMs: 0,
        speak,
      } as unknown as RendererContext,
      payload: { prompt: '3+2=', template: '3+2={{INPUT}}', answers: ['5'] },
      onDone: vi.fn(),
    }),
    document.body,
  );
  document.querySelector<HTMLButtonElement>('button[aria-label="よみあげ"]')!.click();
  expect(speak).toHaveBeenCalledExactlyOnceWith('3たす2はしかく');
});
