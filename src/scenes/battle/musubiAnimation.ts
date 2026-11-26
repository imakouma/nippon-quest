import type Phaser from 'phaser';
import { BACKDROP_SCALE as S } from '../../rendering/battle/pixelArt';

/** 玉が揺れた後、成功・失敗に応じた光を出す。 */
export async function playMusubiResult(
  scene: Phaser.Scene,
  at: { x: number; y: number },
  success: boolean,
  shakes: number,
  burst: (x: number, y: number, tint: number, texture: string, count: number, gravityY?: number) => void,
  onWobble: () => void,
): Promise<void> {
  const ball = scene.add.image(at.x, at.y, 'bt.item.musubi-dama').setScale(S).setDepth(25);
  const tween = (config: Phaser.Types.Tweens.TweenBuilderConfig) =>
    new Promise<void>((resolve) => scene.tweens.add({ ...config, onComplete: () => resolve() }));
  try {
    const wait = () => new Promise<void>((resolve) => scene.time.delayedCall(350, resolve));
    for (let i = 0; i < shakes; i++) {
      await wait();
      onWobble();
      await tween({ targets: ball, angle: -14, duration: 110, yoyo: true, ease: 'Sine.easeInOut' });
      await tween({ targets: ball, angle: 14, duration: 110, yoyo: true, ease: 'Sine.easeInOut' });
    }
    await wait();
    burst(at.x, at.y, success ? 0xffdd70 : 0xa9d8ff, 'bt.fx.star', success ? 18 : 10, -90);
    await tween({ targets: ball, scale: S * 1.4, alpha: 0, duration: 220 });
  } finally {
    ball.destroy();
  }
}
