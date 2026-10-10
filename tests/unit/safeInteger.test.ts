import { describe, expect, it } from 'vitest';
import { addProgressValue } from '../../src/shared/safeInteger';

describe('進行値の安全な加算', () => {
  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY])(
    '不正な加算値 %s では現在値を変更しない',
    (amount) => {
      expect(addProgressValue(10, amount)).toBe(10);
    },
  );

  it('安全整数の範囲内では加算する', () => {
    expect(addProgressValue(10, 5)).toBe(15);
  });

  it('安全整数の上限を超える場合は上限で飽和する', () => {
    expect(addProgressValue(Number.MAX_SAFE_INTEGER - 1, 2)).toBe(Number.MAX_SAFE_INTEGER);
  });
});
