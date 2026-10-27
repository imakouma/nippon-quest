import type Phaser from 'phaser';
import { existingAssetUrl } from '../../rendering/assetCatalog';
import { monsterAnimationSpec } from '../../rendering/monsterAnimation';

type BattleImage = Phaser.GameObjects.Image;

export function preloadMonsterAnimation(scene: Phaser.Scene, id: string): void {
  const spec = monsterAnimationSpec(id);
  const url = spec && existingAssetUrl(spec.path);
  if (spec && url && !scene.textures.exists(spec.key))
    scene.load.spritesheet(spec.key, url, {
      frameWidth: spec.frameWidth,
      frameHeight: spec.frameHeight,
    });
}

/** Imageと同じ描画面を持つSpriteへ、制作済みのキャラだけ切り替える。 */
export function createMonsterSprite(
  scene: Phaser.Scene,
  id: string,
  x: number,
  y: number,
  fallbackKey: string,
): BattleImage {
  const spec = monsterAnimationSpec(id);
  if (!spec || !scene.textures.exists(spec.key)) return scene.add.image(x, y, fallbackKey);
  const idle = `${spec.key}.idle`;
  const attack = `${spec.key}.attack`;
  if (!scene.anims.exists(idle)) {
    scene.anims.create({
      key: idle,
      frames: spec.idle.map((frame) => ({ key: spec.key, frame })),
      frameRate: 5,
      repeat: -1,
      repeatDelay: 1200,
    });
    scene.anims.create({
      key: attack,
      frames: spec.attack.map((frame) => ({ key: spec.key, frame })),
      frameRate: 10,
    });
  }
  const sprite = scene.add.sprite(x, y, spec.key, 0);
  sprite.setData('monsterIdle', idle);
  sprite.setData('monsterAttack', attack);
  sprite.on('animationcomplete', (animation: Phaser.Animations.Animation) => {
    if (animation.key === attack && sprite.active && sprite.alpha > 0.35) sprite.play(idle);
  });
  sprite.play(idle);
  return sprite;
}

export function playMonsterIdle(sprite: BattleImage): boolean {
  const key = sprite.getData('monsterIdle') as string | undefined;
  if (!key || !('anims' in sprite)) return false;
  (sprite as Phaser.GameObjects.Sprite).play(key, true);
  return true;
}

export function playMonsterAttack(sprite: BattleImage): void {
  const key = sprite.getData('monsterAttack') as string | undefined;
  if (key && 'anims' in sprite) (sprite as Phaser.GameObjects.Sprite).play(key);
}

export function stopMonsterAnimation(sprite: BattleImage): void {
  if ('anims' in sprite) (sprite as Phaser.GameObjects.Sprite).anims.stop();
}
