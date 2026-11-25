// @vitest-environment jsdom
import { h } from 'preact';
import { render } from 'preact/compat';
import { act } from 'preact/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { BattleHud } from '../../src/ui/battle/BattleHud';
import { HudStore, type SkillOption } from '../../src/ui/battle/store';

vi.mock('../../src/ui/PixelIcon', () => ({ PixelIcon: () => null }));
vi.mock('../../src/ui/sfx', () => ({ playSfx: () => undefined }));
afterEach(() => render(null, document.body));

const skill = (id: string, cost: number, disabled = false): SkillOption => ({
  key: id,
  id,
  actorId: 'hero',
  name: id,
  subject: 'sansu',
  gradeRange: [1, 1],
  element: 'hino',
  stars: 1,
  cost,
  have: 0,
  effect: 'damage',
  disabled,
});

it('通常技とチャージ技を切り替え、ゲージ不足を防ぎ、表示中の技をキーボードで選ぶ', async () => {
  const store = new HudStore();
  const action = vi.fn();
  store.onAction = action;
  await act(() => {
    store.set({
      intro: false,
      menu: 'skills',
      skills: [skill('normal', 0), skill('charge', 50, true)],
      gauges: [{ subject: 'sansu', value: 0, max: 100, marks: [50], boosted: false }],
    });
    render(h(BattleHud, { store }), document.body);
  });
  expect(document.querySelector('[data-skill="normal"]')).not.toBeNull();
  expect(document.querySelector('[data-skill="charge"]')).toBeNull();
  const toggle = document.querySelector<HTMLButtonElement>('[data-charge-toggle]')!;
  expect(toggle).not.toBeNull();
  await act(() => toggle.click());
  expect(document.querySelector('[data-skill="normal"]')).toBeNull();
  expect(document.querySelector('[data-skill="charge"]')?.getAttribute('aria-disabled')).toBe('true');
  await act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
  });
  expect(action).not.toHaveBeenCalled();
  await act(() => store.set({ skills: [skill('normal', 0), skill('charge', 50)] }));
  await act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
  });
  expect(action).toHaveBeenLastCalledWith({ t: 'skill', key: 'charge' });
  await act(() => store.set({ menu: 'commands' }));
  await act(() => store.set({ menu: 'skills', cursor: 0 }));
  expect(document.querySelector('[data-skill="normal"]')).not.toBeNull();
  expect(document.querySelector('[data-skill="charge"]')).toBeNull();
});

it('チャージ技が未編成でも通常技へ戻れ、道具メニューをチャージ操作で覆わない', async () => {
  const store = new HudStore();
  const action = vi.fn();
  store.onAction = action;
  await act(() => {
    store.set({
      intro: false,
      menu: 'skills',
      skills: [skill('normal', 0)],
      gauges: [{ subject: 'sansu', value: 100, max: 100, marks: [], boosted: false }],
    });
    render(h(BattleHud, { store }), document.body);
  });
  await act(() => document.querySelector<HTMLButtonElement>('[data-charge-toggle]')!.click());
  expect(document.querySelectorAll('[data-skill]')).toHaveLength(0);
  expect(document.querySelector('.nq-menu-empty')).not.toBeNull();
  await act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
  });
  expect(action).not.toHaveBeenCalled();
  await act(() => document.querySelector<HTMLButtonElement>('[data-charge-toggle]')!.click());
  expect(document.querySelector('[data-skill="normal"]')).not.toBeNull();
  await act(() => store.set({ menu: 'items' }));
  expect(document.querySelector('[data-charge-toggle]')).toBeNull();
});
