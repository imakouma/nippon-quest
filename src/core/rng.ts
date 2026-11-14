/**
 * シード付き乱数。プロジェクト内で乱数が必要なときは必ずこれを使う（Math.random 禁止・ESLint で検出）。
 * 対戦の決定論性（同じシード＋同じコマンド列 → 同じ結果）の土台。
 */
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
      const total = items.reduce((s, x) => s + x.weight, 0);
      let r = prng() * total;
      for (const x of items) {
        r -= x.weight;
        if (r < 0) return x.item;
      }
      return items[items.length - 1]!.item;
    },
    state: () => prng.state(),
  };
  return rng;
}

/** 実行ごとに違うシードが欲しいとき（新規ゲーム開始など）。crypto があればそれを使う */
export function freshSeed(): string {
  const g = globalThis as { crypto?: Crypto };
  if (g.crypto?.getRandomValues) {
    const a = new Uint32Array(2);
    g.crypto.getRandomValues(a);
    return `${a[0]!.toString(36)}${a[1]!.toString(36)}`;
  }
  return `${Date.now().toString(36)}`;
}
