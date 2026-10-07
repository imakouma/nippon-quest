import { describe, expect, it } from 'vitest';
import { entranceIconScale } from '../../src/rendering/overworld/entranceIcons';

describe('フィールド入口の大きさ', () => {
  it('すべての町を2×2マス相当で表示する', () => {
    expect(entranceIconScale('aomori-town')).toBe(2);
    expect(entranceIconScale('iwate-town')).toBe(2);
  });

  it('町以外は1マスのままにし、明示値は優先する', () => {
    expect(entranceIconScale('aomori-dungeon')).toBe(1);
    expect(entranceIconScale('iwate-town', 3)).toBe(3);
  });
});
