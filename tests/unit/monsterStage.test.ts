import { describe, expect, it } from 'vitest';
import type { BattleLayout } from '../../src/scenes/battle/layout';
import { monsterStageScale } from '../../src/scenes/battle/monsterStage';

const layout: BattleLayout = {
  enemy: { x: 0, y: 0, scaleStep: 0 },
  hero: { x: 0, y: 0, scale: 4 },
  partner: { x: 0, y: 0, scale: 4 },
  bossMaxHeight: 240,
};

describe('戦闘モンスターの表示倍率', () => {
  it('ボスだけを一段拡大し、レイアウト上限を超える場合は拡大しない', () => {
    expect(monsterStageScale(48, false, layout)).toBe(4);
    expect(monsterStageScale(48, true, layout)).toBe(5);
    expect(monsterStageScale(56, true, layout)).toBe(4);
  });
});
