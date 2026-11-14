/** シード付き乱数の共通実装。表示層・ゲーム本体のどちらにも依存しない。 */
import seedrandom from 'seedrandom';

export interface Rng {
  /** [0, 1) */
  next(): number;
  /** [min, max] の整数 */
  int(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
  chance(p: number): boolean;
  /** 重み付き抽選 */
  weighted<T>(items: readonly { item: T; weight: number }[]): T;
  /** 現在の内部状態（セーブ・リプレイ用） */
  state(): unknown;
}

export function createRng(seed: string | number, state?: unknown): Rng {
  const prng = state
    ? seedrandom('', { state: state as seedrandom.State.Arc4 })
    : seedrandom(String(seed), { state: true });
  const rng: Rng = {
    next: () => prng(),
    int: (min, max) => Math.floor(prng() * (max - min + 1)) + min,
    pick: (arr) => {
      if (arr.length === 0) throw new Error('pick: 空配列');
      return arr[Math.floor(prng() * arr.length)]!;
    },
    chance: (p) => prng() < p,
    weighted: (items) => {
      const total = items.reduce((sum, item) => sum + item.weight, 0);
      let remaining = prng() * total;
      for (const item of items) {
        remaining -= item.weight;
        if (remaining < 0) return item.item;
      }
      return items[items.length - 1]!.item;
    },
    state: () => prng.state(),
  };
  return rng;
}

/** 実行ごとに違うシードが欲しいとき（新規ゲーム開始など）。 */
export function freshSeed(): string {
  const global = globalThis as { crypto?: Crypto };
  if (global.crypto?.getRandomValues) {
    const values = new Uint32Array(2);
    global.crypto.getRandomValues(values);
    return `${values[0]!.toString(36)}${values[1]!.toString(36)}`;
  }
  return Date.now().toString(36);
}
