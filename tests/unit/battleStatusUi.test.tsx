// @vitest-environment jsdom
import { h } from 'preact';
import { render } from 'preact/compat';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnemyWindow } from '../../src/ui/battle/BattleStatus';
import type { EnemyView } from '../../src/ui/battle/store';
import { setDictionary } from '../../src/ui/i18n';

vi.mock('../../src/ui/PixelIcon', () => ({ PixelIcon: () => null }));

beforeEach(() => {
  setDictionary({
    battle: {
      boss: '強[つよ]い ワスレモノ',
      hp: 'HP',
      lv: 'Lv',
    },
  });
});

afterEach(() => {
  render(null, document.body);
  document.body.replaceChildren();
});

const enemy = (isBoss: boolean): EnemyView => ({
  name: 'ワスレモノ',
  level: 5,
  hp: 155,
  maxHp: 155,
  element: 'mizu',
  weaknessRevealed: false,
  isBoss,
  defMult: 1,
  effects: [],
});

describe('EnemyWindow', () => {
  it('ボスも通常敵と同じ名前・Lv・HP表記で表示する', () => {
    const normalHost = document.createElement('div');
    const bossHost = document.createElement('div');

    render(h(EnemyWindow, { e: enemy(false) }), normalHost);
    render(h(EnemyWindow, { e: enemy(true) }), bossHost);

    expect(normalHost.textContent).toContain('ワスレモノ');
    expect(normalHost.textContent).toContain('Lv 5');
    expect(normalHost.textContent).toContain('155/155');
    expect(bossHost.innerHTML).toBe(normalHost.innerHTML);
  });
});
