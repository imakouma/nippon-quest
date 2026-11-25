// @vitest-environment jsdom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { BagOverlay, type BagThing } from '../../src/ui/field/BagOverlay';

vi.mock('../../src/ui/sfx', () => ({ playSfx: vi.fn() }));
vi.mock('../../src/ui/PixelIcon', () => ({ PixelIcon: () => null }));
vi.mock('../../src/ui/i18n', () => ({ t: (key: string) => key }));

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

it('控えの道具と仲間をドラッグでバッグに入れ、仲間を控えへ戻せる', () => {
  vi.stubGlobal('CSS', { escape: (value: string) => value });
  Element.prototype.scrollIntoView = vi.fn();
  const thing = (key: string, kind: BagThing['kind'], inBag: boolean): BagThing => ({
    key,
    kind,
    name: key,
    icon: null,
    art: null,
    cost: 1,
    inBag,
    ...(kind === 'item' ? { action: 'pack' as const, usable: true } : {}),
  });
  const hero = thing('hero', 'hero', true);
  const item = thing('item', 'item', false);
  const monster = thing('monster', 'monster', false);
  const packed = thing('packed', 'monster', true);
  const onToggle = vi.fn();
  const onUse = vi.fn();
  const root = document.createElement('div');
  document.body.append(root);
  act(() =>
    render(
      <BagOverlay
        hero={hero}
        inBag={[packed]}
        outside={[item, monster]}
        cells={[
          { kind: 'empty', x: 0, y: 0 },
          { kind: 'item', key: 'packed', x: 1, y: 0, w: 1, h: 1 },
        ]}
        cols={2}
        rows={1}
        dropSlots={{}}
        used={1}
        capacity={9}
        over={false}
        nextLevel={null}
        message={null}
        onToggle={onToggle}
        onUse={onUse}
        onLeader={vi.fn()}
        onEvolve={vi.fn()}
        onGrow={vi.fn()}
        onMove={vi.fn()}
        onRosterRemove={vi.fn()}
        onClose={vi.fn()}
      />,
      root,
    ),
  );
  const drag = (source: Element, target: Element, key: string) => {
    const dataTransfer = { setData: vi.fn(), getData: () => key };
    for (const [element, name] of [
      [source, 'dragstart'],
      [target, 'drop'],
    ] as const) {
      const event = new Event(name, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
      act(() => {
        element.dispatchEvent(event);
      });
    }
  };
  const empty = root.querySelector('.nq-bag-empty')!;
  drag(root.querySelector('[data-bag-key="item"]')!, empty, 'item');
  drag(root.querySelector('[data-bag-key="item"]')!, root.querySelector('.nq-bag-grid')!, 'item');
  drag(root.querySelector('[data-bag-key="monster"]')!, empty, 'monster');
  drag(root.querySelector('[data-bag-key="packed"]')!, root.querySelector('.nq-bag-reserve-grid')!, 'packed');
  expect(onToggle.mock.calls).toEqual([['item'], ['item'], ['monster'], ['packed']]);
  act(() => (root.querySelector('[data-bag-key="item"]') as HTMLButtonElement).click());
  act(() =>
    [...root.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.includes('field.bagUse'))
      ?.click(),
  );
  expect(onUse).toHaveBeenCalledWith('item');
  act(() => render(null, root));
});
