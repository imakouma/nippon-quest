/**
 * MasteryStore: 単元（unit）ごとの習熟度 0〜1。正答 score の指数移動平均。
 * GameState に保存されるプレーンなオブジェクトを包む。
 */
import type { QuestionResult } from '../contracts';

export interface MasteryRecord {
  value: number; // 0〜1
  n: number; // 試行回数
  lastAt: number; // epoch ms
}

export type MasteryData = Record<string, MasteryRecord>;

export class MasteryStore {
  constructor(
    private readonly data: MasteryData = {},
    private readonly alpha = 0.3,
  ) {}

  get(unit: string): number {
    return this.data[unit]?.value ?? 0;
  }

  attempts(unit: string): number {
    return this.data[unit]?.n ?? 0;
  }

  record(unit: string, result: Pick<QuestionResult, 'score'>, now = Date.now()): void {
    const prev = this.data[unit];
    const value = prev ? prev.value + this.alpha * (result.score - prev.value) : result.score;
    this.data[unit] = { value, n: (prev?.n ?? 0) + 1, lastAt: now };
  }

  /** 習熟度が閾値未満の単元（弱い順） */
  weakUnits(units: string[], threshold = 0.7): string[] {
    return units.filter((u) => this.get(u) < threshold).sort((a, b) => this.get(a) - this.get(b));
  }

  toJSON(): MasteryData {
    return this.data;
  }
}
