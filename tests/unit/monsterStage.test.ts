import { describe, expect, it } from 'vitest';
import { battleLayout } from '../../src/scenes/battle/layout';
import { monsterBodyGroundY, monsterBodyTargetHeight } from '../../src/scenes/battle/monsterStage';

describe('キャラ固有身長の戦闘表示高', () => {
  it('旧サイドビューでは100cmを96pxとして大型ほど強く反映する', () => {
    const layout = battleLayout('side');

    expect(monsterBodyTargetHeight(10, layout)).toBe(48);
    expect(monsterBodyTargetHeight(32, layout)).toBeCloseTo(51.3, 1);
    expect(monsterBodyTargetHeight(38, layout)).toBeCloseTo(56.38, 1);
    expect(monsterBodyTargetHeight(100, layout)).toBe(96);
    expect(monsterBodyTargetHeight(120, layout)).toBeCloseTo(106.13, 1);
    expect(monsterBodyTargetHeight(350, layout)).toBeCloseTo(191.21, 1);
    expect(monsterBodyTargetHeight(580, layout)).toBe(250);
  });

  it('正式な奥行きビューでは下限60pxと上限250pxへ収める', () => {
    const layout = battleLayout('depth');

    expect(monsterBodyTargetHeight(10, layout)).toBe(60);
    expect(monsterBodyTargetHeight(100, layout)).toBe(96);
    expect(monsterBodyTargetHeight(580, layout)).toBe(250);
  });

  it('大型の敵だけ足元を下げて身体上端の安全ラインを守る', () => {
    const layout = battleLayout('depth');
    const sideLayout = battleLayout('side');

    expect(monsterBodyGroundY(60, layout)).toBe(layout.enemy.y);
    expect(monsterBodyGroundY(106.13, layout)).toBe(layout.enemy.y);
    expect(monsterBodyGroundY(191.21, layout)).toBeCloseTo(331.21, 2);
    expect(monsterBodyGroundY(250, layout)).toBe(390);
    expect(monsterBodyGroundY(250, layout) - 250).toBe(layout.enemy.minBodyTop);
    expect(monsterBodyGroundY(250, sideLayout)).toBe(sideLayout.enemy.y);
  });

  it('設定身長が大きいほど画面上の身体高が小さくならない', () => {
    const layout = battleLayout('depth');
    const heights = [10, 16, 32, 38, 100, 120, 350, 580].map((cm) => monsterBodyTargetHeight(cm, layout));

    expect(heights).toEqual([...heights].sort((a, b) => a - b));
  });
});
