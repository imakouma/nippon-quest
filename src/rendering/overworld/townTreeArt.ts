import type Phaser from 'phaser';
import { NQ } from '../palette';
import { addImage } from '../sheet';

export function buildTownTreeTexture(scene: Phaser.Scene): void {
  const key = 'town-tree-round';
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 24;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = NQ.brown;
  ctx.fillRect(7, 16, 2, 8);
  ctx.fillStyle = NQ.forest;
  ctx.fillRect(3, 5, 10, 12);
  ctx.fillRect(2, 7, 12, 8);
  ctx.fillStyle = NQ.green;
  ctx.fillRect(3, 4, 10, 10);
  ctx.fillRect(2, 6, 12, 6);
  ctx.fillStyle = NQ.leaf;
  ctx.fillRect(4, 5, 4, 3);
  addImage(scene.textures, key, canvas);
}
