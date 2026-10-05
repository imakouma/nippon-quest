import { describe, expect, it } from 'vitest';
import { evaluateExpression } from '../../src/questions/renderers/experiment/expression';
import { experimentPayloadSchema } from '../../src/questions/renderers/experiment/schema';

describe('experiment', () => {
  it('四則演算・括弧・変数を安全に計算する', () => {
    expect(evaluateExpression('20 + heatSec * 1.2 - (water - 100) * 0.05', { heatSec: 30, water: 200 })).toBe(
      51,
    );
    expect(evaluateExpression('-(a + 2) / 2', { a: 4 })).toBe(-3);
  });

  it('未知の変数やコードらしい記号を拒否する', () => {
    expect(() => evaluateExpression('missing + 1', {})).toThrow('しらない へんすう');
    expect(() => evaluateExpression('globalThis.alert(1)', {})).toThrow();
    expect(() => evaluateExpression('1 / 0', {})).toThrow('けっかが かずに なりません');
  });

  it('予想・操作・結果の契約を検証する', () => {
    const result = experimentPayloadSchema.safeParse({
      title: '水の じっけん',
      predict: {
        prompt: 'どうなる？',
        choices: [
          { id: 'hot', text: 'あつい' },
          { id: 'cold', text: 'つめたい' },
        ],
        answer: 'hot',
      },
      controls: [{ id: 'heatSec', label: '時間', type: 'slider', min: 0, max: 60, step: 10, unit: '秒' }],
      outcome: {
        formula: '20 + heatSec',
        label: '温度',
        unit: '℃',
        visual: 'thermometer',
        visualRange: [0, 100],
      },
      requiredRuns: 2,
    });
    expect(result.success).toBe(true);
  });

  it('選択肢にない正解と重複した操作IDを拒否する', () => {
    const result = experimentPayloadSchema.safeParse({
      title: 'じっけん',
      predict: {
        prompt: 'どうなる？',
        choices: [
          { id: 'a', text: 'A' },
          { id: 'b', text: 'B' },
        ],
        answer: 'c',
      },
      controls: [
        { id: 'x', label: 'X', type: 'toggle' },
        { id: 'x', label: 'X2', type: 'toggle' },
      ],
      outcome: { formula: 'x', label: '結果', visual: 'circuit', visualRange: [0, 1] },
    });
    expect(result.success).toBe(false);
  });

  it('重複した予想選択肢IDを拒否する', () => {
    const result = experimentPayloadSchema.safeParse({
      title: 'じっけん',
      predict: {
        prompt: 'どうなる？',
        choices: [
          { id: 'same', text: 'A' },
          { id: 'same', text: 'B' },
        ],
        answer: 'same',
      },
      controls: [{ id: 'x', label: 'X', type: 'toggle' }],
      outcome: { formula: 'x', label: '結果', visual: 'circuit', visualRange: [0, 1] },
    });
    expect(result.success).toBe(false);
  });
});
