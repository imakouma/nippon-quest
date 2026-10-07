import { describe, expect, it } from 'vitest';
import { michiruGuideKey, type MichiruGuideInput } from '../../src/scenes/overworld/michiruGuide';

const base: MichiruGuideInput = {
  prologueDone: true,
  kind: 'field',
  islandBossReady: false,
  areaBossDone: false,
  midBossDone: false,
  lastBossDone: false,
};

describe('michiruGuideKey', () => {
  it('導入前はミチルとの最初の会話を優先する', () => {
    expect(michiruGuideKey({ ...base, prologueDone: false, islandBossReady: true })).toBe('wake');
  });

  it('県のしるしがそろったら地方ボスを案内する', () => {
    expect(michiruGuideKey({ ...base, islandBossReady: true })).toBe('islandBoss');
  });

  it('場所と進行に応じて次の一歩を切り替える', () => {
    expect(michiruGuideKey({ ...base, kind: 'town' })).toBe('town');
    expect(michiruGuideKey({ ...base, kind: 'dungeon' })).toBe('dungeon');
    expect(michiruGuideKey({ ...base, kind: 'secret' })).toBe('secret');
    expect(michiruGuideKey({ ...base, kind: 'secret', lastBossDone: true })).toBe('secretDone');
    expect(michiruGuideKey({ ...base, midBossDone: true })).toBe('warp');
    expect(michiruGuideKey(base)).toBe('explore');
  });
});
