import { describe, expect, it } from 'vitest';
import {
  monsterBodyImageScale,
  monsterBodyOrigin,
  monsterImageScale,
  visiblePixelBounds,
} from '../../src/rendering/monsterImageScale';

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

  it('透明余白を除いた身体領域を測る', () => {
    const opaque = new Set(['1,1', '4,1', '2,2', '3,3']);
    const bounds = visiblePixelBounds(6, 5, (x, y) => (opaque.has(`${x},${y}`) ? 255 : 0));

    expect(bounds).toEqual({ x: 1, y: 1, width: 4, height: 3 });
    expect(monsterBodyImageScale(bounds, 96)).toBe(32);
    expect(monsterBodyOrigin(bounds, 6, 5)).toEqual({ x: 0.5, y: 0.8 });
  });

  it('透明ピクセルしかない異常素材はフレーム全体へ安全に戻す', () => {
    expect(visiblePixelBounds(8, 6, () => 0)).toEqual({ x: 0, y: 0, width: 8, height: 6 });
  });
});
