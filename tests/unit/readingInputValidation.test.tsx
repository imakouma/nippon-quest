// @vitest-environment jsdom
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import ja from '../../content/i18n/ja.json';
import questions from '../../content/questions/kokugo/g1/kanji-onyomi/set-001.json';
import { setDictionary } from '../../src/ui/i18n';
import { TextInputView } from '../../src/questions/renderers/text-input/TextInputView';
import { ReadingPrompt } from '../../src/questions/renderers/text-input/ReadingPrompt';
import type { RendererContext } from '../../src/questions/contracts';

afterEach(() => render(null, document.body));

async function mountReading() {
  setDictionary(ja);
  await act(() =>
    render(
      h(TextInputView, {
        ctx: {
          question: questions[0],
          grade: 1,
          timeLimitMs: 0,
          speak: vi.fn(),
        } as unknown as RendererContext,
        payload: questions[0]!.payload,
        onDone: vi.fn(),
      }),
      document.body,
    ),
  );
  return document.querySelector('input')!;
}

async function enter(input: HTMLInputElement, value: string) {
  await act(() => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

it('初期状態にひらがな案内を出さず、読む漢字だけを強調する', async () => {
  await mountReading();
  expect(document.body.textContent).not.toContain('ひらがなで');
  expect(document.querySelector('mark')?.textContent).toBe('一');
  expect(document.querySelector('.nq-q-prompt')?.textContent).toBe('一ばんおいしいパン');
});

it.each(['イチ', '一', 'ichi', '123', 'い ち', 'いち!'])(
  'ひらがな以外の%sは採点せず、直すと案内が消える',
  async (value) => {
    const input = await mountReading();
    await enter(input, value);
    expect(document.querySelector('[role="alert"]')?.textContent).toBe('ひらがなで こたえよう');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    await act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(input.disabled).toBe(false);
    expect(document.querySelector('.nq-feedback')).toBeNull();
    await enter(input, 'いち');
    expect(document.body.textContent).not.toContain('ひらがなで');
    expect(input.getAttribute('aria-invalid')).not.toBe('true');
    await act(() => document.querySelector<HTMLButtonElement>('.nq-input-submit')!.click());
    expect(document.querySelector('.nq-feedback-correct')).not.toBeNull();
  },
);

it('IME変換中は案内を出さず、変換確定後だけ検証する', async () => {
  const input = await mountReading();
  await act(() => {
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  });
  await enter(input, 'ichi');
  expect(document.body.textContent).not.toContain('ひらがなで');
  await act(() => {
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  });
  expect(document.body.textContent).toContain('ひらがなで こたえよう');
  await enter(input, '');
  expect(document.body.textContent).not.toContain('ひらがなで');
  await enter(input, 'か\u3099');
  expect(input.getAttribute('aria-invalid')).not.toBe('true');
});

it('読み問題以外の文字入力ではカタカナも通常どおり採点する', async () => {
  setDictionary(ja);
  await act(() =>
    render(
      h(TextInputView, {
        ctx: {
          question: { subject: 'kokugo', grade: 1 },
          grade: 1,
          timeLimitMs: 0,
          speak: vi.fn(),
        } as unknown as RendererContext,
        payload: { prompt: 'なまえ', answers: ['パン'] },
        onDone: vi.fn(),
      }),
      document.body,
    ),
  );
  await enter(document.querySelector('input')!, 'パン');
  await act(() => document.querySelector<HTMLButtonElement>('.nq-input-submit')!.click());
  expect(document.querySelector('.nq-feedback-correct')).not.toBeNull();
  expect(document.querySelector('.nq-q-reading')).toBeNull();
});

it('補助ルビを強調対象にせず、未注釈の漢字だけを強調する', () => {
  render(h(ReadingPrompt, { text: '学校[がっこう]の 本', grade: 1 }), document.body);
  expect([...document.querySelectorAll('mark')].map((mark) => mark.textContent)).toEqual(['本']);
});
