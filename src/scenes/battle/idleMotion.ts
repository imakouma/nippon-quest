import type Phaser from 'phaser';
import { playMonsterIdle, stopMonsterAnimation } from './monsterAnimation';

type BattleImage = Phaser.GameObjects.Image;

/** Sceneから待機モーションの状態管理を分離し、Spriteと従来Imageを同じ契約で扱う。 */
export class BattleIdleMotion {
  private readonly bobs = new Map<BattleImage, Phaser.Tweens.Tween>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly step: number,
  ) {}

  reset(): void {
    for (const tween of this.bobs.values()) tween.stop();
    this.bobs.clear();
  }

  destroy(sprite: BattleImage): void {
    this.bobs.get(sprite)?.stop();
    this.bobs.delete(sprite);
  }

  start(sprite: BattleImage, baseY: number): void {
    this.bobs.get(sprite)?.stop();
    sprite.y = baseY;
    if (sprite.alpha <= 0.35 || playMonsterIdle(sprite)) return;
    this.bobs.set(
      sprite,
      this.scene.tweens.add({
        targets: sprite,
        y: baseY - this.step,
        duration: 520,
        yoyo: true,
        repeat: -1,
        ease: 'Stepped',
        easeParams: [1],
      }),
    );
  }

  stop(sprite: BattleImage, baseY: number): void {
    stopMonsterAnimation(sprite);
    this.bobs.get(sprite)?.stop();
    this.bobs.delete(sprite);
    sprite.y = baseY;
  }
}
