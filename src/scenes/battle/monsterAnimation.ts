import type Phaser from 'phaser';
import { existingAssetUrl } from '../../rendering/assetCatalog';
import { monsterAnimationSpec } from '../../rendering/monsterAnimation';

type BattleImage = Phaser.GameObjects.Image;
type ReadableImage = CanvasImageSource & { width: number; height: number };

const footOrigins = new WeakMap<object, number>();

/** 透明余白ではなく、全アニメフレームの最下端を地面へ合わせる。 */
export function setMonsterFootOrigin(sprite: BattleImage): BattleImage {
  const source = sprite.texture.getSourceImage() as ReadableImage;
  let originY = footOrigins.get(source as object);
  if (originY === undefined) {
    originY = 1;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = source.width;
      canvas.height = source.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context?.drawImage(source, 0, 0);
      const pixels = context?.getImageData(0, 0, canvas.width, canvas.height).data;
      if (pixels) {
        for (let y = canvas.height - 1; y >= 0; y -= 1) {
          let opaque = false;
          for (let x = 0; x < canvas.width; x += 1) {
            if (pixels[(y * canvas.width + x) * 4 + 3]! > 0) {
              opaque = true;
              break;
            }
          }
          if (opaque) {
            originY = (y + 1) / sprite.height;
            break;
          }
        }
      }
    } catch {
      // 読み戻せない外部画像では従来どおり画像下端を使う。
    }
    footOrigins.set(source as object, originY);
  }
  return sprite.setOrigin(0.5, originY);
}

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

export function startMonsterIdle(scene: Phaser.Scene, sprite: BattleImage): void {
  if (playMonsterIdle(sprite)) return;
  scene.tweens.add({
    targets: sprite,
    scaleY: sprite.scaleY * 0.95,
    duration: 460,
    yoyo: true,
    repeat: -1,
    ease: 'Stepped',
    easeParams: [1],
  });
}

export function playMonsterAttack(sprite: BattleImage): void {
  const key = sprite.getData('monsterAttack') as string | undefined;
  if (key && 'anims' in sprite) (sprite as Phaser.GameObjects.Sprite).play(key);
}

export function stopMonsterAnimation(sprite: BattleImage): void {
  if ('anims' in sprite) (sprite as Phaser.GameObjects.Sprite).anims.stop();
}
