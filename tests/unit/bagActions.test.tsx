// @vitest-environment jsdom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { BagOverlay, type BagThing } from '../../src/ui/field/BagOverlay';

vi.mock('../../src/ui/sfx', () => ({ playSfx: vi.fn() }));
vi.mock('../../src/ui/PixelIcon', () => ({ PixelIcon: () => null }));
vi.mock('../../src/ui/i18n', () => ({ t: (key: string) => key }));
let root: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('CSS', { escape: (s: string) => s });
  Element.prototype.scrollIntoView = vi.fn();
  root = document.createElement('div');
  document.body.append(root);
});
afterEach(() => {
  act(() => render(null, root));
  root.remove();
  vi.unstubAllGlobals();
});
const thing = (key: string, kind: BagThing['kind'], inBag = false): BagThing => ({
  key,
  kind,
  inBag,
  name: key,
  icon: null,
  art: null,
  cost: 1,
});
function setup() {
  const onToggle = vi.fn(),
    onMove = vi.fn();
  act(() =>
    render(
      <BagOverlay
        hero={{ ...thing('hero', 'hero', true), skills: [{ name: 'hero skill', gauge: 1, scan: false }] }}
        inBag={[{ ...thing('packed', 'item', true), action: 'pack' }]}
        outside={[
          thing('mon:one', 'monster'),
          thing('weapon', 'equip'),
          { ...thing('apple', 'item'), action: 'pack' },
          thing('material', 'item'),
        ]}
        cells={[
          { kind: 'empty', x: 0, y: 0 },
          { kind: 'empty', x: 1, y: 0 },
          { kind: 'item', key: 'hero', x: 0, y: 1, w: 1, h: 1 },
        ]}
        cols={2}
        rows={2}
        used={1}
        capacity={4}
        over={false}
        nextLevel={null}
        message={null}
        onToggle={onToggle}
        onMove={onMove}
        onUse={vi.fn()}
        onLeader={vi.fn()}
        onEvolve={vi.fn()}
        onGrow={vi.fn()}
        onRosterRemove={vi.fn()}
        onClose={vi.fn()}
      />,
      root,
    ),
  );
  return { onToggle, onMove };
}
const click = (selector: string) => act(() => root.querySelector<HTMLButtonElement>(selector)!.click());
const filter = (key: string) =>
  act(() =>
    [...root.querySelectorAll<HTMLButtonElement>('.nq-bag-filters button')]
      .find((button) => button.textContent?.includes(`field.bagFilter_${key}`))!
      .click(),
  );
const arrow = (key: string) =>
  act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })));
it('分類で隠れたものを選ばず、選択中のものが隠れたら主人公に戻る', () => {
  setup();
  click('[data-bag-key="weapon"]');
  filter('tool');
  expect(root.querySelector('.nq-party-info')?.textContent).toContain('hero');
  arrow('ArrowDown');
  expect(root.querySelector('.nq-party-info')?.textContent).toContain('packed');
  arrow('ArrowDown');
  expect(root.querySelector('.nq-party-info')?.textContent).toContain('apple');
  filter('all');
  filter('tool');
  expect(root.querySelector('.nq-party-info')?.textContent).toContain('apple');
  arrow('ArrowDown');
  expect(root.querySelector('.nq-party-info')?.textContent).toContain('hero');
  filter('equip');
  arrow('ArrowUp');
  expect(root.querySelector('.nq-party-info')?.textContent).toContain('weapon');
});
it('主人公の詳細に技一覧や星を表示しない', () => {
  setup();
  expect(root.querySelector('.nq-party-info')?.textContent).not.toContain('hero skill');
  expect(root.querySelector('.nq-party-skills')).toBeNull();
});
it('選び直しても詳細が残り、入れるボタンから道具を追加できる', () => {
  const { onToggle } = setup();
  click('[data-bag-key="apple"]');
  click('[data-bag-key="apple"]');
  expect(root.querySelector('.nq-party-info')?.textContent).toContain('apple');
  click('.nq-bag-toggle');
  expect(onToggle).toHaveBeenCalledWith('apple');
});
it('ひかえの仲間をクリックで空きマスに追加できる', () => {
  const { onToggle } = setup();
  click('[data-bag-key="mon:one"]');
  click('.nq-bag-empty');
  expect(onToggle).toHaveBeenCalledWith('mon:one', { x: 0, y: 0 });
});
it('装備を任意の空き位置へ追加し、保管用素材は拒否する', () => {
  const { onToggle, onMove } = setup();
  click('[data-bag-key="weapon"]');
  click('.nq-bag-empty');
  expect(onToggle).toHaveBeenCalledWith('weapon', { x: 0, y: 0 });
  expect(onMove).not.toHaveBeenCalled();
  click('[data-bag-key="material"]');
  expect(root.querySelector<HTMLButtonElement>('.nq-bag-toggle')?.disabled).toBe(true);
  expect(root.querySelector('.nq-party-info')?.textContent).toContain('field.bagStorageOnly');
});
it('すでに入っている道具をマスへ落としても移動や取り外しにしない', () => {
  const { onToggle, onMove } = setup();
  const source = root.querySelector('[data-bag-key="packed"]')!;
  for (const [target, type] of [
    [source, 'dragstart'],
    [root.querySelector('.nq-bag-empty')!, 'drop'],
  ] as const) {
    const e = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(e, 'dataTransfer', { value: { setData: vi.fn(), getData: () => 'packed' } });
    act(() => {
      target.dispatchEvent(e);
    });
  }
  expect(onToggle).not.toHaveBeenCalled();
  expect(onMove).not.toHaveBeenCalled();
  expect(root.querySelector('[role="status"]')?.textContent).toContain('field.bagToolPlace');
});
