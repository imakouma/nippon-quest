import { beforeEach, describe, expect, it, vi } from 'vitest';
import { footstepSound, playEntranceSound, playFieldFootstep } from '../../src/scenes/overworld/sounds';
import { playSfx } from '../../src/ui/sfx';

vi.mock('../../src/ui/sfx', () => ({ playSfx: vi.fn(), setSfxVolume: vi.fn(), preloadFieldSfx: vi.fn() }));

describe('探索の効果音', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ['field', 'grass', 'step-grass'],
    ['field', 'forest', 'step-grass'],
    ['field', 'farm', 'step-grass'],
    ['field', 'beach', 'step-sand'],
    ['field', 'shore', 'step-water'],
    ['field', 'mountain', 'step-stone'],
    ['town', null, 'step-stone'],
    ['dungeon', null, 'step-stone'],
    ['secret', null, 'step-stone'],
    ['enclave', 'beach', 'step-sand'],
  ] as const)('%s / %sでは%sを選ぶ', (kind, ground, sound) => {
    expect(footstepSound(kind, ground)).toBe(sound);
  });

  it('実際に着いたタイルの地面で一回再生する', () => {
    playFieldFootstep('aomori-field', 147);
    expect(playSfx).toHaveBeenCalledTimes(1);
    expect(playSfx).toHaveBeenCalledWith('step-sand');
  });

  it('町・洞窟・裏ステージの入口/出口だけで扉音を鳴らす', () => {
    playEntranceSound('aomori-field', 'aomori-town');
    playEntranceSound('aomori-dungeon', 'aomori-field');
    playEntranceSound('aomori-field', 'aomori-secret');
    expect(playSfx).toHaveBeenCalledTimes(3);
    expect(playSfx).toHaveBeenLastCalledWith('door');
    playEntranceSound('aomori-field', 'iwate-field');
    playEntranceSound('aomori-field', 'aomori-enclave');
    expect(playSfx).toHaveBeenCalledTimes(3);
  });
});
