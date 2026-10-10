/** バトル状態の複製。ターン解決は常に入力を変更しない。 */
export function cloneBattleValue<T>(value: T): T {
  return structuredClone(value);
}

/** 数値を指定範囲へ収める。 */
export function clampBattleValue(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/** 教科ごとのゲージを空で初期化する。 */
export function emptyGauges(): SubjectGauges {
  return { kokugo: 0, sansu: 0, rika: 0, shakai: 0, seikatsu: 0, eigo: 0 };
}
import type { SubjectGauges } from './types';
