import { describe, expect, it } from 'vitest';
import { battleLayout } from '../../src/scenes/battle/layout';
import { monsterBodyTargetHeight } from '../../src/scenes/battle/monsterStage';

describe('キャラ固有身長の戦闘表示高', () => {
  it('旧サイドビューでは100cmを96pxとして平方根で圧縮する', () => {
    const layout = battleLayout('side');

    expect(monsterBodyTargetHeight(10, layout)).toBe(48);
    expect(monsterBodyTargetHeight(32, layout)).toBeCloseTo(54.31, 1);
    expect(monsterBodyTargetHeight(38, layout)).toBeCloseTo(59.18, 1);
    expect(monsterBodyTargetHeight(100, layout)).toBe(96);
    expect(monsterBodyTargetHeight(120, layout)).toBeCloseTo(105.16, 1);
    expect(monsterBodyTargetHeight(350, layout)).toBeCloseTo(179.6, 1);
    expect(monsterBodyTargetHeight(580, layout)).toBe(224);
  });

  it('正式な奥行きビューでは狭幅表示後も40px相当を保ち、HUD安全域へ収める', () => {
    const layout = battleLayout('depth');

    expect(monsterBodyTargetHeight(10, layout)).toBe(60);
    expect(monsterBodyTargetHeight(100, layout)).toBe(96);
    expect(monsterBodyTargetHeight(580, layout)).toBe(188);
  });

  it('設定身長が大きいほど画面上の身体高が小さくならない', () => {
    const layout = battleLayout('depth');
    const heights = [10, 16, 32, 38, 100, 120, 350, 580].map((cm) => monsterBodyTargetHeight(cm, layout));

    expect(heights).toEqual([...heights].sort((a, b) => a - b));
  });
});
