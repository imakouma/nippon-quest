// @vitest-environment jsdom
import { h } from 'preact';
import { render } from 'preact/compat';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BattleHud } from '../../src/ui/battle/BattleHud';
import { HudStore, type EnemyView } from '../../src/ui/battle/store';
import { setDictionary } from '../../src/ui/i18n';

vi.mock('../../src/ui/PixelIcon', () => ({ PixelIcon: () => null }));

beforeEach(() => {
  setDictionary({ battle: { commandMenu: 'コマンド', hp: 'HP', lv: 'Lv' } });
});

afterEach(() => {
  render(null, document.body);
  document.body.replaceChildren();
});

describe('BattleHud', () => {
  it('コマンド選択中も戦いの記録を表示しない', () => {
    const store = new HudStore();
    store.set({ intro: false, menu: 'commands' });

    render(h(BattleHud, { store }), document.body);

    expect(document.querySelector('[data-battle-history]')).toBeNull();
    expect(document.body.textContent).not.toContain('たたかいの きろく');
  });

  it('ボスの敵ステータスだけ幅広パネルを使う', () => {
    const enemy = (isBoss: boolean): EnemyView => ({
      name: 'ネブタイショウ',
      level: 5,
      hp: 75,
      maxHp: 75,
      element: 'hikari',
      weaknessRevealed: false,
      isBoss,
      defMult: 1,
      effects: [],
    });
    const normalHost = document.createElement('div');
    const bossHost = document.createElement('div');
    const normalStore = new HudStore();
    const bossStore = new HudStore();
    normalStore.set({ enemy: enemy(false) });
    bossStore.set({ enemy: enemy(true) });

    render(h(BattleHud, { store: normalStore }), normalHost);
    render(h(BattleHud, { store: bossStore }), bossHost);

    expect(normalHost.querySelector('.nq-panel')?.classList.contains('nq-panel-boss')).toBe(false);
    expect(bossHost.querySelector('.nq-panel')?.classList.contains('nq-panel-boss')).toBe(true);
    render(null, normalHost);
    render(null, bossHost);
  });
});
