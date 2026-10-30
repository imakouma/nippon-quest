import type Phaser from 'phaser';
import { NQ } from '../palette';
import { addImage } from '../sheet';
import { TOWN_GROUND_COUNT, TOWN_ROOFS, TOWN_ROOF_START } from './townView';

export const TOWN_VIEW_TEXTURE = 'town-view';

/** The first 16 tiles encode connected stone edges; the last three are grass. */
export function buildTownViewTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TOWN_VIEW_TEXTURE)) return;
  const canvas = document.createElement('canvas');
  canvas.width = 8 * 16;
  canvas.height = Math.ceil((TOWN_ROOF_START + TOWN_GROUND_COUNT * TOWN_ROOFS.length * 16) / 8) * 16;
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
  const roofs = [
    [NQ.vermilion, NQ.brick, NQ.apricot],
    [NQ.azure, NQ.blue, NQ.sky],
    [NQ.leaf, NQ.green, NQ.lime],
    [NQ.tan, NQ.brown, NQ.sand],
    [NQ.slate, NQ.night, NQ.gray],
    [NQ.vermilion, NQ.brick, NQ.apricot],
    [NQ.white, NQ.cloud, NQ.paper],
    [NQ.ochre, NQ.brown, NQ.cream],
  ] as const;
  for (let ground = 0; ground < TOWN_GROUND_COUNT; ground++) {
    for (let roof = 0; roof < roofs.length; roof++) {
      for (let mask = 0; mask < 16; mask++) {
        const tile = TOWN_ROOF_START + (ground * roofs.length + roof) * 16 + mask;
        const x = (tile % 8) * 16;
        const y = Math.floor(tile / 8) * 16;
        const [base, dark, light] = roofs[roof]!;
        ctx.fillStyle = base;
        ctx.fillRect(x, y, 16, 16);
        ctx.fillStyle = light;
        if (!(mask & 1)) ctx.fillRect(x, y, 16, 1);
        ctx.fillStyle = dark;
        if (roof === 5) {
          for (const rx of [3, 8, 13]) ctx.fillRect(x + rx, y + 2, 1, 11);
        } else if (roof === 6) {
          ctx.fillRect(x + 2, y + 9, 3, 1);
          ctx.fillRect(x + 10, y + 6, 3, 1);
        } else if (roof === 7) {
          for (const ry of [3, 7, 11]) ctx.fillRect(x + (ry % 2 ? 2 : 5), y + ry, 3, 1);
        }
        if (!(mask & 4)) {
          if (roof === 6) ctx.fillStyle = NQ.brown;
          ctx.fillRect(x, y + 14, 16, 2);
          ctx.fillStyle = dark;
        }
        if (!(mask & 8)) ctx.fillRect(x, y + 2, 1, 12);
        if (!(mask & 2)) ctx.fillRect(x + 15, y + 2, 1, 12);
        ctx.fillStyle = [NQ.lime, NQ.white, NQ.sand, NQ.beige, NQ.silver, NQ.slate][ground]!;
        if (!(mask & 1) && !(mask & 8)) ctx.fillRect(x, y, 2, 2);
        if (!(mask & 1) && !(mask & 2)) ctx.fillRect(x + 14, y, 2, 2);
      }
    }
  }
  addImage(scene.textures, TOWN_VIEW_TEXTURE, canvas);
}
