// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { VirtualStick } from '../../src/ui/field/VirtualStick';

it('パッドのタッチ開始を、画面全体のタップ移動へ流さない', () => {
  const root = document.createElement('div');
  document.body.append(root);
  const windowTouch = vi.fn();
  window.addEventListener('touchstart', windowTouch);
  try {
    act(() => render(h(VirtualStick, { label: 'いどう', onDirection: vi.fn() }), root));
    root
      .querySelector('[role="group"]')!
      .dispatchEvent(new Event('touchstart', { bubbles: true, cancelable: true }));
    expect(windowTouch).not.toHaveBeenCalled();
    root.dispatchEvent(new Event('touchstart', { bubbles: true }));
    expect(windowTouch).toHaveBeenCalledTimes(1);
  } finally {
    window.removeEventListener('touchstart', windowTouch);
    act(() => render(null, root));
    root.remove();
  }
});
