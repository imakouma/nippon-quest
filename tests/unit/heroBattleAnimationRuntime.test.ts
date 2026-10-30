import { describe, expect, it, vi } from 'vitest';
import { HERO_BATTLE_SEQUENCES } from '../../src/rendering/characters';
import {
  createHeroBattleSprite,
  heroBattleAnimationKey,
  playHeroBattleAnimation,
} from '../../src/scenes/battle/heroAnimation';

describe('主人公のバトルアニメーション再生', () => {
  it('見た目別テクスチャに全状態を登録し、待機を開始する', () => {
    const created: Record<string, unknown>[] = [];
    const keys = new Set<string>();
    const sprite = {
      anims: {},
      data: new Map<string, unknown>(),
      play: vi.fn(),
      setData(key: string, value: unknown) {
        this.data.set(key, value);
        return this;
      },
      getData(key: string) {
        return this.data.get(key);
      },
    };
    const scene = {
      anims: {
        exists: (key: string) => keys.has(key),
        create: (config: Record<string, unknown>) => {
          created.push(config);
          keys.add(config.key as string);
        },
      },
      add: { sprite: vi.fn(() => sprite) },
    };

    const result = createHeroBattleSprite(scene as never, 10, 20, 'char.hero.test.battle');

    expect(result).toBe(sprite);
    expect(scene.add.sprite).toHaveBeenCalledWith(10, 20, 'char.hero.test.battle', 0);
    expect(created.map((config) => config.key)).toEqual(
      (Object.keys(HERO_BATTLE_SEQUENCES) as (keyof typeof HERO_BATTLE_SEQUENCES)[]).map((state) =>
        heroBattleAnimationKey('char.hero.test.battle', state),
      ),
    );
    expect(created.map((config) => (config.frames as { frame: number }[]).map(({ frame }) => frame))).toEqual(
      Object.values(HERO_BATTLE_SEQUENCES),
    );
    expect(sprite.play).toHaveBeenLastCalledWith(
      heroBattleAnimationKey('char.hero.test.battle', 'idle'),
      true,
    );

    playHeroBattleAnimation(result, 'attack');
    expect(sprite.play).toHaveBeenLastCalledWith(heroBattleAnimationKey('char.hero.test.battle', 'attack'));
  });

  it('同じ見た目のアニメーションは重複登録しない', () => {
    const create = vi.fn();
    const sprite = { setData: vi.fn().mockReturnThis(), play: vi.fn() };
    const scene = {
      anims: { exists: () => true, create },
      add: { sprite: () => sprite },
    };

    createHeroBattleSprite(scene as never, 0, 0, 'char.hero.test.battle');

    expect(create).not.toHaveBeenCalled();
  });
});
