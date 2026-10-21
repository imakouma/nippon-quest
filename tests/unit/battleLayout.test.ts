import { describe, expect, it } from 'vitest';
import { BATTLE_SCALE, battleLayout } from '../../src/scenes/battle/layout';

describe('戦闘画面の配置', () => {
  it('省略時は正式仕様の奥行きビューを返す', () => {
    expect(battleLayout()).toEqual(battleLayout('depth'));
  });

  it('奥行き試作では敵を上奥、味方を下手前へ置く', () => {
    const layout = battleLayout('depth');

    expect(layout.enemy.y).toBeLessThan(layout.partner.y);
    expect(layout.enemy.y).toBeLessThan(layout.hero.y);
    expect(BATTLE_SCALE + layout.enemy.scaleStep).toBeLessThan(layout.hero.scale);
    expect(BATTLE_SCALE + layout.enemy.scaleStep).toBeLessThan(layout.partner.scale);
  });
});
