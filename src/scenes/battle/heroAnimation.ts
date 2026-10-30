import type Phaser from 'phaser';
import { HERO_BATTLE_SEQUENCES, type HeroBattleAnimation } from '../../rendering/characters';

type BattleImage = Phaser.GameObjects.Image;

const HERO_TEXTURE_DATA = 'heroBattleTexture';
const FRAME_RATE: Record<HeroBattleAnimation, number> = {
  idle: 3,
  attack: 12,
  hurt: 8,
  knockout: 6,
  victory: 4,
};

export const heroBattleAnimationKey = (textureKey: string, state: HeroBattleAnimation): string =>
  `${textureKey}.anim.${state}`;

function registerHeroBattleAnimations(scene: Phaser.Scene, textureKey: string): void {
  for (const state of Object.keys(HERO_BATTLE_SEQUENCES) as HeroBattleAnimation[]) {
    const key = heroBattleAnimationKey(textureKey, state);
    if (scene.anims.exists(key)) continue;
    const loops = state === 'idle' || state === 'victory';
    scene.anims.create({
      key,
      frames: HERO_BATTLE_SEQUENCES[state].map((frame) => ({ key: textureKey, frame })),
      frameRate: FRAME_RATE[state],
      repeat: loops ? -1 : 0,
      repeatDelay: state === 'idle' ? 700 : 0,
    });
  }
}

export function createHeroBattleSprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
  textureKey: string,
): BattleImage {
  registerHeroBattleAnimations(scene, textureKey);
  const sprite = scene.add.sprite(x, y, textureKey, HERO_BATTLE_SEQUENCES.idle[0]);
  sprite.setData(HERO_TEXTURE_DATA, textureKey);
  sprite.play(heroBattleAnimationKey(textureKey, 'idle'), true);
  return sprite;
}

export function playHeroBattleAnimation(sprite: BattleImage, state: HeroBattleAnimation): boolean {
  const textureKey = sprite.getData(HERO_TEXTURE_DATA) as string | undefined;
  if (!textureKey || !('anims' in sprite)) return false;
  const animated = sprite as Phaser.GameObjects.Sprite;
  const key = heroBattleAnimationKey(textureKey, state);
  if (state === 'idle') animated.play(key, true);
  else animated.play(key);
  return true;
}
