import { describe, expect, it } from 'vitest';
import { monsterImageScale } from '../../src/rendering/monsterImageScale';

describe('モンスター画像の表示倍率', () => {
  it('高解像度素材でも元の戦闘表示枠を維持し、縦横比を保つ', () => {
    const scale = monsterImageScale(1024, 1200, 32, 5);
    expect(1200 * scale).toBeCloseTo(160);
    expect(1024 * scale).toBeLessThan(160);
  });

  it('既存の通常・ボスのドット絵の表示を変えない', () => {
    expect(monsterImageScale(32, 32, 32, 4)).toBe(4);
    expect(monsterImageScale(56, 56, 56, 5)).toBe(5);
  });
});
