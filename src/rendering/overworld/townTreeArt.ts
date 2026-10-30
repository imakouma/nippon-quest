import type Phaser from 'phaser';
import { NQ } from '../palette';
import { addImage } from '../sheet';
import { TOWN_TREE_TEXTURES } from './townTrees';

export function buildTownTreeTexture(scene: Phaser.Scene): void {
  for (const [tile, key] of Object.entries(TOWN_TREE_TEXTURES)) {
    if (scene.textures.exists(key)) continue;
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 24;
    const ctx = canvas.getContext('2d')!;
    const rect = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    };
    const kind = Number(tile);
    if (kind === 73) {
      for (const x of [3, 7, 11]) {
        rect(x, 1, 2, 23, NQ.green);
        rect(x, 1, 1, 23, NQ.leaf);
        for (const y of [7, 14, 21]) rect(x, y, 2, 1, NQ.forest);
      }
      rect(1, 6, 5, 1, NQ.green);
      rect(9, 10, 5, 1, NQ.green);
    } else if (kind === 71) {
      rect(7, 8, 2, 16, NQ.brown);
      rect(8, 17, 2, 7, NQ.tan);
      rect(5, 2, 6, 3, NQ.leaf);
      rect(1, 5, 14, 2, NQ.green);
      rect(0, 7, 4, 2, NQ.leaf);
      rect(12, 7, 4, 2, NQ.leaf);
      rect(6, 7, 4, 2, NQ.bark);
    } else if (kind === 69 || kind === 70) {
      rect(7, 17, 2, 7, NQ.brown);
      for (const [top, half, height] of [
        [1, 3, 7],
        [6, 5, 8],
        [11, 7, 9],
      ]) {
        for (let row = 0; row < height!; row++) {
          const width = Math.max(1, Math.floor(((row + 1) * half!) / height!));
          rect(8 - width, top! + row, width * 2, 1, NQ.green);
          rect(8, top! + row, width, 1, NQ.forest);
          if (kind === 70 && row === 1) rect(8 - width, top! + row, width * 2, 1, NQ.white);
        }
      }
    } else {
      const sakura = kind === 72;
      rect(7, 16, 2, 8, NQ.brown);
      rect(3, 5, 10, 12, sakura ? NQ.berry : NQ.forest);
      rect(2, 7, 12, 8, sakura ? NQ.berry : NQ.forest);
      rect(3, 4, 10, 10, sakura ? NQ.blush : NQ.green);
      rect(2, 6, 12, 6, sakura ? NQ.blush : NQ.green);
      rect(4, 5, 4, 3, sakura ? NQ.white : NQ.leaf);
    }
    addImage(scene.textures, key, canvas);
  }
}
