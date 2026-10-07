import { describe, expect, it } from 'vitest';
import { movementDecision } from '../../src/scenes/overworld/movementDecision';

const decide = (patch: Partial<Parameters<typeof movementDecision<string, string>>[0]> = {}) =>
  movementDecision({
    from: [1, 1],
    delta: [1, 0],
    inside: () => true,
    indexOf: (x, y) => y * 10 + x,
    midBossTile: null,
    regionBossAt: () => undefined,
    gateAt: () => undefined,
    gateOpen: () => true,
    areaBossTile: null,
    lastBossTile: null,
    blocked: () => false,
    ...patch,
  });

describe('フィールド移動の優先順', () => {
  it('境界・ボス・閉じた関所・衝突を歩行より優先する', () => {
    expect(decide({ inside: () => false }).kind).toBe('stand');
    expect(decide({ midBossTile: 12 }).kind).toBe('midboss');
    expect(decide({ regionBossAt: () => 'region' })).toEqual({ kind: 'regionBoss', boss: 'region' });
    expect(decide({ gateAt: () => 'gate', gateOpen: () => false })).toEqual({
      kind: 'lockedGate',
      gate: 'gate',
    });
    expect(decide({ blocked: () => true }).kind).toBe('blocked');
    expect(decide()).toEqual({ kind: 'move', x: 2, y: 1 });
  });
});
