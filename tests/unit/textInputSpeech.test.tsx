// @vitest-environment jsdom
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
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

it('かな入力では文字キーボードを使い、変換確定のEnterでは採点しない', async () => {
  setDictionary(ja);
  await act(() =>
    render(
      h(TextInputView, {
        ctx: {
          grade: 1,
          question: { subject: 'kokugo', grade: 1 },
          timeLimitMs: 0,
          speak: vi.fn(),
        } as unknown as RendererContext,
        payload: { prompt: '一ばんおいしいパン', template: 'よみかた：{{INPUT}}', answers: ['いち'] },
        onDone: vi.fn(),
      }),
      document.body,
    ),
  );
  const input = document.querySelector('input')!;
  expect(input.inputMode).toBe('text');
  await act(() => {
    input.value = 'いち';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  for (const options of [{ isComposing: true }, { keyCode: 229 }]) {
    await act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, ...options }));
    });
    expect(document.querySelector('input')).toBe(input);
    expect(input.disabled).toBe(false);
  }
  await act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
  expect(input.disabled).toBe(true);
  expect(document.querySelector('[role="status"]')?.textContent).toContain('せいかい');
});
