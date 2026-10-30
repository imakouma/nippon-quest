import { describe, expect, it } from 'vitest';
import { movementDecision } from '../../src/scenes/overworld/movementDecision';

const decide = (patch: Partial<Parameters<typeof movementDecision<string, string, string>>[0]> = {}) =>
  movementDecision({
    from: [1, 1],
    delta: [1, 0],
    inside: () => true,
    indexOf: (x, y) => y * 10 + x,
    midBossTile: null,
    regionBossAt: () => undefined,
    gateAt: () => undefined,
    gateOpen: () => true,
    interPrefectureAt: () => undefined,
    interPrefectureOpen: () => true,
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

  it('開いた関所は下の衝突タイルに止められず通れる', () => {
    expect(
      decide({
        gateAt: () => 'gate',
        gateOpen: () => true,
        blocked: () => true,
      }),
    ).toEqual({ kind: 'move', x: 2, y: 1 });
  });

  it('閉じた県境リンクは通常衝突より優先して、開いた後は衝突タイルを通れる', () => {
    const link = {
      interPrefectureAt: () => 'link',
      blocked: () => true,
    };
    expect(decide({ ...link, interPrefectureOpen: () => false })).toEqual({
      kind: 'lockedInterPrefecture',
      link: 'link',
    });
    expect(decide({ ...link, interPrefectureOpen: () => true })).toEqual({
      kind: 'move',
      x: 2,
      y: 1,
    });
  });

  it('開いた関所と重なっても県ボスと裏ボスを優先する', () => {
    const openGate = { gateAt: () => 'gate', gateOpen: () => true };
    expect(decide({ ...openGate, areaBossTile: 12 }).kind).toBe('areaBoss');
    expect(decide({ ...openGate, lastBossTile: 12 }).kind).toBe('lastBoss');
  });

  it('閉じた県境リンクと重なっても既存のボスと地域関所の優先順を保つ', () => {
    const closedLink = {
      interPrefectureAt: () => 'link',
      interPrefectureOpen: () => false,
    };
    expect(decide({ ...closedLink, midBossTile: 12 }).kind).toBe('midboss');
    expect(decide({ ...closedLink, regionBossAt: () => 'region' })).toEqual({
      kind: 'regionBoss',
      boss: 'region',
    });
    expect(decide({ ...closedLink, gateAt: () => 'gate', gateOpen: () => false })).toEqual({
      kind: 'lockedGate',
      gate: 'gate',
    });
    expect(decide({ ...closedLink, areaBossTile: 12 }).kind).toBe('areaBoss');
    expect(decide({ ...closedLink, lastBossTile: 12 }).kind).toBe('lastBoss');
  });
});
