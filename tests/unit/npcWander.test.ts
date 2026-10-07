import { describe, expect, it } from 'vitest';
import { npcWanderCandidates, npcWanderTile } from '../../src/scenes/overworld/npcWander';

describe('町の人の歩行候補', () => {
  it('上下左右の隣のマスを候補にする', () => {
    expect(npcWanderCandidates([5, 5], [5, 5])).toEqual([
      { x: 5, y: 6, dir: 'down' },
      { x: 4, y: 5, dir: 'left' },
      { x: 6, y: 5, dir: 'right' },
      { x: 5, y: 4, dir: 'up' },
    ]);
  });

  it('初期位置から2マスより遠くへは進まない', () => {
    expect(npcWanderCandidates([5, 5], [7, 5])).not.toContainEqual({ x: 8, y: 5, dir: 'right' });
  });

  it('見た目が半分を越えるまでは元のマス、それから移動先をふさぐ', () => {
    expect(npcWanderTile(10, 11, 0)).toBe(10);
    expect(npcWanderTile(10, 11, 0.49)).toBe(10);
    expect(npcWanderTile(10, 11, 0.5)).toBe(11);
    expect(npcWanderTile(10, 11, 1)).toBe(11);
  });
});
