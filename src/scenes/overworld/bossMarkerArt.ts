import type Phaser from 'phaser';

export function createBossMarkerArt(scene: Phaser.Scene, x: number, y: number) {
  const aura = scene.add
    .ellipse(x, y + 5, 40, 14, 0x6e4fc4, 0.45)
    .setStrokeStyle(2, 0xa28be6, 0.8)
    .setDepth(2);
  const glow = scene.add.ellipse(x, y - 1, 30, 30, 0x6e4fc4, 0.45).setDepth(y - 2);
  const halo = scene.add
    .ellipse(x, y - 1, 36, 36, 0x6e4fc4, 0.08)
    .setStrokeStyle(2, 0xa28be6, 0.8)
    .setDepth(y - 1);
  const mark = scene.add.container(x, y - 5, [
    scene.add.triangle(0, -8, -11, 1, -5, -12, -2, 2, 0x6e4fc4),
    scene.add.triangle(0, -8, 11, 1, 5, -12, 2, 2, 0x6e4fc4),
    scene.add.rectangle(0, 1, 22, 17, 0x2e2a45),
    scene.add.rectangle(-5, 0, 3, 2, 0xe5484d),
    scene.add.rectangle(5, 0, 3, 2, 0xe5484d),
    scene.add.rectangle(-6, -10, 3, 4, 0xffd23f),
    scene.add.rectangle(0, -11, 3, 5, 0xffd23f),
    scene.add.rectangle(6, -10, 3, 4, 0xffd23f),
    scene.add.rectangle(0, -8, 15, 3, 0xffd23f),
  ]);
  mark.setDepth(y);
  return { aura, glow, halo, mark };
}

export function createBossSpark(scene: Phaser.Scene, x: number, y: number) {
  return scene.add.rectangle(x, y, 3, 3, 0xffffff);
}
