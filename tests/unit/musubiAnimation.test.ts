import { describe, expect, it, vi } from 'vitest';
import { BattleEventAnimator, type BattleEventAnimationPort } from '../../src/scenes/battle/eventAnimator';
import type { BattleEvent } from '../../src/core/battle/types';

describe('むすび玉の捕獲演出', () => {
  for (const success of [true, false]) {
    it(`${success ? '成功時は姿を隠してハートを出す' : '失敗時は姿を戻しハートを出さない'}`, async () => {
      const enemy = { x: 50, y: 80, scaleX: 2, scaleY: 3 };
      const throwBall = vi.fn().mockResolvedValue(undefined);
      const resolveBall = vi.fn().mockResolvedValue(undefined);
      const tween = vi.fn().mockResolvedValue(undefined);
      const burst = vi.fn();
      const port = {
        state: () => ({ enemy: { id: 'enemy' }, ally: { hero: { id: 'hero' } } }),
        layout: () => ({}),
        sprites: {
          enemy: () => enemy,
          hero: () => ({}),
          anchor: () => ({ x: 50, y: 50 }),
          tween,
          shake: vi.fn(),
        },
        motion: { effects: () => ({ throwMusubiDama: throwBall, resolveMusubiDama: resolveBall }) },
        effects: { burst },
        audio: { play: vi.fn() },
        clock: { wait: vi.fn() },
      } as unknown as BattleEventAnimationPort;
      const animator = new BattleEventAnimator(port);
      await animator.play({
        t: 'itemUsed',
        itemId: 'common-musubi-dama',
        targetId: 'enemy',
        side: 'enemy',
      } as BattleEvent);
      await animator.play({ t: 'recruitAttempt', targetId: 'enemy', success, chance: 0.5 } as BattleEvent);
      expect(throwBall).toHaveBeenCalledOnce();
      expect(resolveBall).toHaveBeenCalledWith(expect.any(Object), success, 0, expect.any(Function));
      const restores = tween.mock.calls.filter(([config]) => config.targets === enemy && config.alpha === 1);
      expect(restores).toHaveLength(success ? 0 : 1);
      expect(burst.mock.calls.some((args) => args[3] === 'bt.fx.heart')).toBe(success);
      await animator.play({ t: 'recruitAttempt', targetId: 'enemy', success, chance: 0.5 } as BattleEvent);
      expect(resolveBall).toHaveBeenCalledOnce();
    });
  }
});
