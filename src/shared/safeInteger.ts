/** 安全整数の上限で飽和させながら、非負の進行値を加算する。 */
export function addProgressValue(current: number, amount: number): number {
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 0) return current;
  return amount >= Number.MAX_SAFE_INTEGER - current ? Number.MAX_SAFE_INTEGER : current + amount;
}
