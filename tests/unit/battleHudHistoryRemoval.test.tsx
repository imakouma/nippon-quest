// @vitest-environment jsdom
import { h } from 'preact';
import { render } from 'preact/compat';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BattleHud } from '../../src/ui/battle/BattleHud';
import { HudStore } from '../../src/ui/battle/store';
import { setDictionary } from '../../src/ui/i18n';

vi.mock('../../src/ui/PixelIcon', () => ({ PixelIcon: () => null }));

beforeEach(() => {
  setDictionary({ battle: { commandMenu: 'コマンド' } });
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
});
