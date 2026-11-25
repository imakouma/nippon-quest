// @vitest-environment jsdom
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import ja from '../../content/i18n/ja.json';
import { TownOverlay, type TownRow } from '../../src/ui/field/TownOverlay';
import { setDictionary } from '../../src/ui/i18n';

vi.mock('../../src/ui/PixelIcon', () => ({ PixelIcon: () => null }));

const rows: TownRow[] = [
  { key: 'look:hair:0', name: 'かみ：いま', tag: '✓', lines: [], action: null },
  { key: 'look:hair:1', name: 'かみ：あたらしい', lines: [], action: { label: '30Gで かえる', ok: true } },
];
afterEach(() => render(null, document.body));

it('候補を選び直しても支払わず、確定ボタンだけで変更する', async () => {
  setDictionary(ja);
  const onAct = vi.fn();
  const onClose = vi.fn();
  await act(() =>
    render(
      h(TownOverlay, {
        title: '床屋',
        icon: 'role-barber',
        gold: 30,
        rows,
        empty: '',
        message: null,
        keys: '',
        onAct,
        onClose,
      }),
      document.body,
    ),
  );
  const choice = document.querySelectorAll<HTMLButtonElement>('.nq-barber-choice')[1]!;
  await act(() => {
    choice.dispatchEvent(new Event('pointerenter'));
  });
  await act(() => choice.click());
  await act(() => choice.click());
  await act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true }));
  });
  expect(onAct).not.toHaveBeenCalled();
  await act(() => document.querySelector<HTMLButtonElement>('.nq-barber-apply')!.click());
  expect(onAct).toHaveBeenCalledExactlyOnceWith('look:hair:1');
});
