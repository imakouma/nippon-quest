// @vitest-environment jsdom
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { expect, it, vi } from 'vitest';
import { DirectionPad } from '../../src/ui/field/DirectionPad';

vi.mock('../../src/ui/i18n', () => ({ t: (key: string) => key }));

it('押した方向へ移動し、指を離すかキャンセルすると停止する', () => {
  for (const name of ['onpointerdown', 'onpointerup', 'onpointercancel', 'onlostpointercapture']) {
    Object.defineProperty(HTMLElement.prototype, name, { configurable: true, value: null });
  }
  const root = document.createElement('div');
  document.body.append(root);
  const onDirection = vi.fn();
  act(() => render(h(DirectionPad, { onDirection }), root));
  const right = root.querySelector<HTMLButtonElement>('[aria-label="field.moveRight"]')!;
  right.setPointerCapture = vi.fn();
  const send = (type: string) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'pointerId', { value: 1 });
    act(() => {
      right.dispatchEvent(event);
    });
  };
  send('pointerdown');
  send('pointerup');
  send('pointerdown');
  send('pointercancel');
  expect(onDirection.mock.calls).toEqual([['right'], [null], ['right'], [null]]);
  act(() => render(null, root));
  root.remove();
});
