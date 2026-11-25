// @vitest-environment jsdom
import { h } from 'preact';
import { render } from 'preact/compat';
import { act } from 'preact/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { ChargeControl } from '../../src/ui/battle/ChargeControl';
import { ChargeGaugeFrame } from '../../src/ui/battle/ChargeGaugeFrame';
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
  chargeGain: [10, 40],
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

it('枠ゲージは教科ごとの残量を独立して更新し、範囲外を枠内に収める', () => {
  render(
    h(ChargeGaugeFrame, {
      gauges: [
        { subject: 'kokugo', value: 100, max: 100, marks: [], boosted: false },
        { subject: 'sansu', value: 50, max: 100, marks: [], boosted: false },
      ],
    }),
    document.body,
  );
  const left = document.querySelector('[data-charge-subject="kokugo"]')!;
  const right = document.querySelector('[data-charge-subject="sansu"]')!;
  expect(left.getAttribute('stroke-dasharray')).toBe('50 50');
  expect(right.getAttribute('stroke-dasharray')).toBe('25 75');
  render(
    h(ChargeGaugeFrame, {
      gauges: [
        { subject: 'kokugo', value: -10, max: 100, marks: [], boosted: false },
        { subject: 'sansu', value: 200, max: 100, marks: [], boosted: false },
      ],
    }),
    document.body,
  );
  expect(left.getAttribute('stroke-dasharray')).toBe('0 100');
  expect(right.getAttribute('stroke-dasharray')).toBe('50 50');
});

it('低学年の3教科が枠を均等に分ける', () => {
  render(
    h(ChargeGaugeFrame, {
      gauges: ['kokugo', 'sansu', 'seikatsu'].map((subject) => ({
        subject,
        value: 100,
        max: 100,
        marks: [],
        boosted: false,
      })),
    }),
    document.body,
  );
  const segments = [...document.querySelectorAll('[data-charge-subject]')];
  expect(segments).toHaveLength(3);
  const filledLength = segments.reduce(
    (sum, segment) => sum + Number(segment.getAttribute('stroke-dasharray')!.split(' ')[0]),
    0,
  );
  expect(filledLength).toBeCloseTo(100);
});

it('Qとタップで技詳細を開閉し、Escapeは先に詳細だけを閉じる', async () => {
  const store = new HudStore();
  const action = vi.fn();
  store.onAction = action;
  await act(() => {
    store.set({ intro: false, menu: 'skills', skills: [skill('normal', 0), skill('other', 0)] });
    render(h(BattleHud, { store }), document.body);
  });
  const key = (key: string, repeat = false) =>
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, repeat }));
    });
  expect(document.querySelector('#nq-skill-details')).toBeNull();
  await key('q');
  expect(document.querySelector('#nq-skill-details')).not.toBeNull();
  await key('q', true);
  expect(store.get().skillDetails).toBe(true);
  await key('ArrowDown');
  expect(store.get().cursor).toBe(1);
  await key('Escape');
  expect(store.get().skillDetails).toBe(false);
  expect(action).not.toHaveBeenCalled();
  await act(() => document.querySelector<HTMLButtonElement>('.nq-skill-details-toggle')!.click());
  expect(store.get().skillDetails).toBe(true);
  await key('Q');
  expect(store.get().skillDetails).toBe(false);
  await key('Escape');
  expect(action).toHaveBeenCalledWith({ t: 'back' });
  await act(() => store.set({ skillDetails: true, chargeSkills: true }));
  expect(store.get().skillDetails).toBe(false);
  await act(() => store.set({ skillDetails: true, menu: 'commands' }));
  expect(store.get().skillDetails).toBe(false);
});

it('高学年の縦棒は独立した残量を下から表示し、範囲外を収める', () => {
  const store = new HudStore();
  store.set({
    menu: 'skills',
    gaugeLayout: 'bars',
    gauges: [
      { subject: 'kokugo', value: -10, max: 100, marks: [], boosted: false },
      { subject: 'sansu', value: 50, max: 100, marks: [], boosted: false },
      { subject: 'rika', value: 200, max: 100, marks: [], boosted: false },
      { subject: 'shakai', value: 20, max: 0, marks: [], boosted: false },
    ],
  });
  render(h(ChargeControl, { store, s: store.get() }), document.body);
  expect(document.querySelectorAll('[data-charge-subject]')).toHaveLength(0);
  const fills = [...document.querySelectorAll<HTMLElement>('[data-charge-bar] > i')];
  expect(fills.map((fill) => fill.style.height)).toEqual(['0%', '50%', '100%', '0%']);
});
