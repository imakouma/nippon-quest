import { describe, expect, it } from 'vitest';
import { virtualStickDirection } from '../../src/ui/field/VirtualStick';

describe('スマホのバーチャルスティック', () => {
  it('中心付近は移動させない', () => {
    expect(virtualStickDirection(0.1, 0.1)).toBeNull();
  });

  it('斜め入力は強い軸の上下左右へ決定する', () => {
    expect(virtualStickDirection(0.8, 0.3)).toBe('right');
    expect(virtualStickDirection(-0.9, 0.2)).toBe('left');
    expect(virtualStickDirection(0.2, -0.8)).toBe('up');
    expect(virtualStickDirection(0.2, 0.8)).toBe('down');
  });
});
