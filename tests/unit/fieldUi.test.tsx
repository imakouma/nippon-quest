// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { ContextActionButton } from '../../src/ui/field/ContextActionButton';

vi.mock('../../src/ui/PixelIcon', () => ({ PixelIcon: () => h('span', { 'data-icon': true }) }));

afterEach(() => {
  render(null, document.body);
  document.body.replaceChildren();
});

describe('ContextActionButton', () => {
  it('renders nothing without a resolved action', () => {
    render(h(ContextActionButton, { action: null }), document.body);

    expect(document.querySelector('button')).toBeNull();
  });

  it.each([
    ['talk', '話[はな]す'],
    ['inspect', '調[しら]べる'],
    ['open', '開[あ]ける'],
  ] as const)('renders the %s action as a named native button', (kind, label) => {
    render(h(ContextActionButton, { action: { kind, label, onActivate: vi.fn() } }), document.body);

    const button = document.querySelector('button');
    expect(button?.type).toBe('button');
    expect(button?.classList.contains('nq-context-action')).toBe(true);
    expect(button?.getAttribute('aria-label')).toBe(label.replace(/\[[^\]]+\]/g, ''));
  });

  it('uses the supplied callback once for click and focused Z activation', async () => {
    const onActivate = vi.fn();
    const globalKeydown = vi.fn();
    document.addEventListener('keydown', globalKeydown);
    render(
      h(ContextActionButton, {
        action: { kind: 'talk', label: '話[はな]す', onActivate },
      }),
      document.body,
    );
    const button = document.querySelector<HTMLButtonElement>('button')!;

    await act(async () => button.click());
    await act(async () => {
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true, cancelable: true }));
    });

    expect(onActivate).toHaveBeenCalledTimes(2);
    expect(globalKeydown).not.toHaveBeenCalled();
    expect(button.getAttribute('aria-keyshortcuts')).toBe('Enter Space Z');
    document.removeEventListener('keydown', globalKeydown);
  });

  it.each(['Enter', ' '])('keeps focused %s activation out of the global input handler', (key) => {
    const globalKeydown = vi.fn();
    document.addEventListener('keydown', globalKeydown);
    render(
      h(ContextActionButton, {
        action: { kind: 'talk', label: '話[はな]す', onActivate: vi.fn() },
      }),
      document.body,
    );

    document
      .querySelector<HTMLButtonElement>('button')!
      .dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

    expect(globalKeydown).not.toHaveBeenCalled();
    document.removeEventListener('keydown', globalKeydown);
  });
});
