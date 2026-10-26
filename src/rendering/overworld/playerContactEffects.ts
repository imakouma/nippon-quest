import type Phaser from 'phaser';
import type { Ground } from '../../core/world/ground';
import { contactEffectFor, type ContactEffect } from '../../core/world/terrainContact';
import { makeGrid, paint, toCanvas, type Grid } from '../grid';
import { NQ } from '../palette';
import { addImage } from '../sheet';

export const CONTACT_EFFECTS = [
  'grass-swish',
  'water-ripple',
  'dust',
  'footprint',
] as const satisfies readonly Exclude<ContactEffect, null>[];

type VisibleContactEffect = (typeof CONTACT_EFFECTS)[number];
type ContactEffectsScene = Pick<Phaser.Scene, 'add' | 'events' | 'textures' | 'tweens'>;

export interface PlayerFootPlantContact {
  type: 'footPlanted';
  ground: Ground | null;
  x: number;
  y: number;
}

export interface PlayerContactEffectOptions {
  maxActive?: number;
}

const TEXTURE_PREFIX = 'fx.contact.';
export const MAX_CONTACT_EFFECTS = 12;
const LIFETIME_MS: Readonly<Record<VisibleContactEffect, number>> = {
  'grass-swish': 240,
  'water-ripple': 320,
  dust: 280,
  footprint: 480,
};

const EFFECT_ART: Readonly<Record<VisibleContactEffect, readonly string[]>> = {
  'grass-swish': [
    '................',
    '................',
    '...L......L.....',
    '..LG..L..LG.L...',
    '...G.LG...G.....',
    '....G..G.G......',
    '................',
    '................',
  ],
  'water-ripple': [
    '................',
    '................',
    '.....IIII.......',
    '..SS......SS....',
    '.A..........A...',
    '..SS......SS....',
    '.....IIII.......',
    '................',
  ],
  dust: [
    '................',
    '................',
    '.....B..B.......',
    '...S......S.....',
    '..B..S..S..B....',
    '....B....B......',
    '................',
    '................',
  ],
  footprint: [
    '................',
    '................',
    '......BB........',
    '.....BBBB.......',
    '......BB........',
    '.......B........',
    '................',
    '................',
  ],
};

export function contactEffectGrid(effect: VisibleContactEffect): Grid {
  const grid = makeGrid(16, 8);
  paint(grid, EFFECT_ART[effect], {
    A: NQ.azure,
    B: effect === 'footprint' ? NQ.brown : NQ.beige,
    G: NQ.green,
    I: NQ.ice,
    L: NQ.lime,
    S: effect === 'dust' ? NQ.sand : NQ.sky,
  });
  return grid;
}

export function buildContactEffectTextures(scene: Pick<Phaser.Scene, 'textures'>): void {
  for (const effect of CONTACT_EFFECTS) {
    const key = `${TEXTURE_PREFIX}${effect}`;
    if (!scene.textures.exists(key)) addImage(scene.textures, key, toCanvas(contactEffectGrid(effect)));
  }
}

interface PoolSlot {
  image: Phaser.GameObjects.Image;
  generation: number;
  startedAt: number;
}

export class PlayerContactEffects {
  private readonly slots: PoolSlot[];
  private sequence = 0;
  private destroyed = false;

  constructor(
    private readonly scene: ContactEffectsScene,
    options: PlayerContactEffectOptions = {},
  ) {
    buildContactEffectTextures(scene);
    const requestedMax = options.maxActive ?? MAX_CONTACT_EFFECTS;
    const maxActive = Number.isFinite(requestedMax)
      ? Math.min(MAX_CONTACT_EFFECTS, Math.max(1, Math.floor(requestedMax)))
      : MAX_CONTACT_EFFECTS;
    this.slots = Array.from({ length: maxActive }, () => ({
      image: scene.add
        .image(0, 0, `${TEXTURE_PREFIX}${CONTACT_EFFECTS[0]}`)
        .setOrigin(0.5, 1)
        .setVisible(false)
        .setActive(false),
      generation: 0,
      startedAt: 0,
    }));
  }

  get activeCount(): number {
    return this.slots.filter((slot) => slot.image.active).length;
  }

  present(contact: PlayerFootPlantContact): boolean {
    const effect = contactEffectFor(contact.ground);
    if (this.destroyed || effect === null) return false;

    const slot = this.nextSlot();
    const generation = ++slot.generation;
    slot.startedAt = ++this.sequence;
    this.scene.tweens.killTweensOf(slot.image);
    slot.image
      .setTexture(`${TEXTURE_PREFIX}${effect}`)
      .setPosition(Math.round(contact.x), Math.round(contact.y))
      .setDepth(Math.round(contact.y) - 1)
      .setScale(1)
      .setAlpha(1)
      .setVisible(true)
      .setActive(true);
    this.scene.tweens.add({
      targets: slot.image,
      alpha: 0,
      duration: LIFETIME_MS[effect],
      ease: 'Stepped',
      easeParams: [4],
      onComplete: () => {
        if (slot.generation === generation) this.release(slot);
      },
    });
    return true;
  }

  reset(): void {
    for (const slot of this.slots) {
      slot.generation += 1;
      this.scene.tweens.killTweensOf(slot.image);
      this.release(slot);
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.reset();
    for (const slot of this.slots) slot.image.destroy();
    this.slots.length = 0;
  }

  private nextSlot(): PoolSlot {
    return (
      this.slots.find((slot) => !slot.image.active) ??
      this.slots.reduce((oldest, slot) => (slot.startedAt < oldest.startedAt ? slot : oldest))
    );
  }

  private release(slot: PoolSlot): void {
    slot.image.setActive(false).setVisible(false);
  }
}

export function attachPlayerContactEffects(
  scene: ContactEffectsScene,
  options?: PlayerContactEffectOptions,
): PlayerContactEffects {
  const effects = new PlayerContactEffects(scene, options);
  scene.events.once('shutdown', () => effects.destroy());
  return effects;
}
