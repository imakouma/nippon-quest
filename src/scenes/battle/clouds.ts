import type Phaser from 'phaser';
import { battleCloudArt, battleWindArt, type BackdropKind } from '../../rendering/battle/pixelArt';
import { addImage } from '../../rendering/sheet';
import { BATTLE_SCALE } from './layout';

/** 雲は画面を横切るのに約80秒。端でだけ戻すので、画面内で急に現れない。 */
const CLOUD_SPEED = 0.012;
const WIND_SPEED = 0.028;

export function createBattleClouds(scene: Phaser.Scene, kind: BackdropKind): Phaser.GameObjects.Image[] {
  if (kind === 'dungeon' || kind === 'boss') return [];
  const cloudKey = 'bt.cloud';
  addImage(scene.textures, cloudKey, battleCloudArt());
  return (
    [
      [26, 12, 0.8],
      [120, 22, 1],
      [196, 8, 0.65],
      [72, 16, 0.55],
    ] as const
  ).map(([x, y, scale]) =>
    scene.add
      .image(x * BATTLE_SCALE, y * BATTLE_SCALE, cloudKey)
      .setOrigin(0)
      .setScale(BATTLE_SCALE * scale)
      .setDepth(1),
  );
}

export function moveBattleClouds(
  clouds: readonly Phaser.GameObjects.Image[],
  sceneWidth: number,
  delta: number,
): void {
  for (const cloud of clouds) {
    cloud.x += CLOUD_SPEED * delta;
    if (cloud.x > sceneWidth + cloud.displayWidth) cloud.x = -cloud.displayWidth;
  }
}

/** 草原だけに、間隔をずらした微かな風を置く。背景のため雲よりも下の深度に保つ。 */
export function createBattleWinds(scene: Phaser.Scene, kind: BackdropKind): Phaser.GameObjects.Image[] {
  if (kind !== 'field' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return [];
  const windKey = 'bt.wind';
  addImage(scene.textures, windKey, battleWindArt());
  return (
    [
      [-34, 57, 0.55],
      [58, 69, 0.42],
      [156, 50, 0.48],
    ] as const
  ).map(([x, y, alpha]) =>
    scene.add
      .image(x * BATTLE_SCALE, y * BATTLE_SCALE, windKey)
      .setOrigin(0)
      .setScale(BATTLE_SCALE)
      .setAlpha(alpha)
      .setDepth(0.5),
  );
}

export function moveBattleWinds(
  winds: readonly Phaser.GameObjects.Image[],
  sceneWidth: number,
  delta: number,
): void {
  for (const wind of winds) {
    wind.x += WIND_SPEED * delta;
    if (wind.x > sceneWidth + wind.displayWidth) wind.x = -wind.displayWidth;
  }
}
