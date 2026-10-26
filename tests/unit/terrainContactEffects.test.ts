import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { GROUNDS, type Ground } from '../../src/core/world/ground';
import { contactEffectFor } from '../../src/core/world/terrainContact';
import { NQ48 } from '../../src/rendering/palette';
import {
  attachPlayerContactEffects,
  CONTACT_EFFECTS,
  contactEffectGrid,
  MAX_CONTACT_EFFECTS,
} from '../../src/rendering/overworld/playerContactEffects';

class FakeImage {
  active = false;
  visible = false;
  x = 0;
  y = 0;
  texture = '';
  destroyed = false;

  setActive(active: boolean): this {
    this.active = active;
    return this;
  }

  setVisible(visible: boolean): this {
    this.visible = visible;
    return this;
  }

  setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  setTexture(texture: string): this {
    this.texture = texture;
    return this;
  }

  setOrigin(): this {
    return this;
  }

  setDepth(): this {
    return this;
  }

  setAlpha(): this {
    return this;
  }

  setScale(): this {
    return this;
  }

  destroy(): void {
    this.destroyed = true;
  }
}

function fakeScene() {
  const images: FakeImage[] = [];
  const tweens: Array<{ onComplete: () => void }> = [];
  let shutdown: () => void = () => undefined;
  const scene = {
    textures: { exists: () => true },
    add: {
      image: vi.fn(() => {
        const image = new FakeImage();
        images.push(image);
        return image;
      }),
    },
    tweens: {
      add: vi.fn((config: { onComplete: () => void }) => {
        tweens.push(config);
        return {};
      }),
      killTweensOf: vi.fn(),
    },
    events: {
      once: vi.fn((_event: string, callback: () => void) => {
        shutdown = callback;
      }),
    },
  } as unknown as Phaser.Scene;
  return { scene, images, tweens, shutdown: () => shutdown() };
}

describe('地形の接地エフェクト方針', () => {
  it.each([
    ['grass', 'grass-swish'],
    ['forest', 'grass-swish'],
    ['mountain', 'dust'],
    ['beach', 'footprint'],
    ['shore', 'water-ripple'],
    ['farm', 'grass-swish'],
  ] as const)('%s は %s を使う', (ground, effect) => {
    expect(contactEffectFor(ground)).toBe(effect);
  });

  it('全 Ground を明示的に扱い、null と未知の地形では何も出さない', () => {
    expect(GROUNDS.map(contactEffectFor)).toHaveLength(GROUNDS.length);
    expect(contactEffectFor(null)).toBeNull();
    expect(contactEffectFor('lava' as Ground)).toBeNull();
  });
});

describe('接地エフェクトの生成絵', () => {
  it('全種類が同じ小さなグリッドを持ち、NQ-48 の色だけを使う', () => {
    for (const effect of CONTACT_EFFECTS) {
      const grid = contactEffectGrid(effect);
      expect(grid).toHaveLength(8);
      expect(grid.every((row) => row.length === 16)).toBe(true);
      const colors = new Set(grid.flat().filter((color): color is string => color !== null));
      expect(colors.size, effect).toBeGreaterThan(0);
      for (const color of colors) expect(NQ48, `${effect}: ${color}`).toContain(color);
    }
  });
});

describe('接地エフェクトのプール', () => {
  it('設定値が大きくてもプールの絶対上限を超えない', () => {
    const fake = fakeScene();
    attachPlayerContactEffects(fake.scene, { maxActive: 999 });

    expect(fake.images).toHaveLength(MAX_CONTACT_EFFECTS);
  });

  it('1回の footPlanted で最大1個を整数座標に出し、対象外の地形では出さない', () => {
    const fake = fakeScene();
    const effects = attachPlayerContactEffects(fake.scene, { maxActive: 2 });

    expect(effects.present({ type: 'footPlanted', ground: 'shore', x: 12.4, y: 28.7 })).toBe(true);
    expect(fake.tweens).toHaveLength(1);
    expect(fake.images.filter((image) => image.active)).toHaveLength(1);
    expect(fake.images[0]).toMatchObject({ x: 12, y: 29, texture: 'fx.contact.water-ripple' });

    expect(effects.present({ type: 'footPlanted', ground: null, x: 0, y: 0 })).toBe(false);
    expect(fake.tweens).toHaveLength(1);
  });

  it('上限以上にオブジェクトを増やさず、期限切れをプールへ戻す', () => {
    const fake = fakeScene();
    const effects = attachPlayerContactEffects(fake.scene, { maxActive: 2 });

    for (let step = 0; step < 20; step += 1) {
      effects.present({ type: 'footPlanted', ground: 'grass', x: step, y: step });
    }

    expect(fake.images).toHaveLength(2);
    expect(effects.activeCount).toBe(2);
    fake.tweens.at(-1)!.onComplete();
    expect(effects.activeCount).toBe(1);
  });

  it('再利用前の完了通知で新しいエフェクトを誤って解放しない', () => {
    const fake = fakeScene();
    const effects = attachPlayerContactEffects(fake.scene, { maxActive: 1 });

    effects.present({ type: 'footPlanted', ground: 'mountain', x: 1, y: 1 });
    effects.present({ type: 'footPlanted', ground: 'beach', x: 2, y: 2 });
    fake.tweens[0]!.onComplete();
    expect(effects.activeCount).toBe(1);
    fake.tweens[1]!.onComplete();
    expect(effects.activeCount).toBe(0);
  });

  it('Scene shutdown でプールをすべて破棄する', () => {
    const fake = fakeScene();
    const effects = attachPlayerContactEffects(fake.scene, { maxActive: 3 });
    effects.present({ type: 'footPlanted', ground: 'farm', x: 1, y: 1 });

    fake.shutdown();

    expect(fake.images).toHaveLength(3);
    expect(fake.images.every((image) => image.destroyed)).toBe(true);
    expect(effects.activeCount).toBe(0);
  });
});
