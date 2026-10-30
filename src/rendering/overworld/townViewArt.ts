import type Phaser from 'phaser';
import { NQ } from '../palette';
import { addImage } from '../sheet';

export const TOWN_VIEW_TEXTURE = 'town-view';

/** The first 16 tiles encode connected stone edges; the last three are grass. */
export function buildTownViewTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TOWN_VIEW_TEXTURE)) return;
  const canvas = document.createElement('canvas');
  canvas.width = 8 * 16;
  canvas.height = 3 * 16;
  const ctx = canvas.getContext('2d')!;
  for (let tile = 0; tile < 19; tile++) {
    const x = (tile % 8) * 16;
    const y = Math.floor(tile / 8) * 16;
    ctx.fillStyle = tile < 16 ? NQ.beige : NQ.lime;
    ctx.fillRect(x, y, 16, 16);
    ctx.fillStyle = tile < 16 ? NQ.sand : NQ.leaf;
    if (tile < 16) {
      if (!(tile & 1)) ctx.fillRect(x, y, 16, 1);
      if (!(tile & 2)) ctx.fillRect(x + 15, y, 1, 16);
      if (!(tile & 4)) ctx.fillRect(x, y + 15, 16, 1);
      if (!(tile & 8)) ctx.fillRect(x, y, 1, 16);
    } else {
      ctx.fillRect(x + 3 + (tile - 16) * 4, y + 5 + (tile - 16) * 3, 2, 1);
    }
  }
  addImage(scene.textures, TOWN_VIEW_TEXTURE, canvas);
}
