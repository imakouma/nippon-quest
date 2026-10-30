import Phaser from 'phaser';
import { townView } from '../../rendering/overworld/townView';
import { buildTownViewTexture, TOWN_VIEW_TEXTURE } from '../../rendering/overworld/townViewArt';
import { townTrees } from '../../rendering/overworld/townTrees';
import { buildTownTreeTexture } from '../../rendering/overworld/townTreeArt';

/** Add the visual layer after background and before decor, for town maps only. */
export function addTownViewLayer(scene: Phaser.Scene, map: Phaser.Tilemaps.Tilemap, tileSize: number): void {
  const background = map.getLayer('background');
  if (!background) return;
  buildTownViewTexture(scene);
  const viewMap = scene.make.tilemap({
    tileWidth: tileSize,
    tileHeight: tileSize,
    width: map.width,
    height: map.height,
  });
  const tiles = viewMap.addTilesetImage(TOWN_VIEW_TEXTURE, TOWN_VIEW_TEXTURE, tileSize, tileSize, 0, 0, 0);
  const layer = tiles ? viewMap.createBlankLayer('town-view', tiles, 0, 0) : null;
  if (!layer) {
    viewMap.destroy();
    return;
  }
  const ids = townView(
    background.data.flatMap((row) => row.map((tile) => tile.index)),
    map.width,
    map.height,
  );
  layer.putTilesAt(
    Array.from({ length: map.height }, (_, y) => ids.slice(y * map.width, (y + 1) * map.width)),
    0,
    0,
  );
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => viewMap.destroy());
}

/** Draw a decor copy with depth-sorted trees; false lets the caller retain original decor. */
export function addTownDecor(scene: Phaser.Scene, map: Phaser.Tilemaps.Tilemap, tileSize: number): boolean {
  const decor = map.getLayer('decor');
  if (!decor) return false;
  const ids = decor.data.flatMap((row) => row.map((tile) => tile.index));
  const trees = townTrees(ids, map.width);
  const copy = scene.make.tilemap({
    tileWidth: tileSize,
    tileHeight: tileSize,
    width: map.width,
    height: map.height,
  });
  const tiles = copy.addTilesetImage('overworld-tiles', 'overworld-tiles', tileSize, tileSize, 0, 0, 1);
  const layer = tiles ? copy.createBlankLayer('town-decor', tiles, 0, 0) : null;
  if (!layer) {
    copy.destroy();
    return false;
  }
  for (const tree of trees) ids[tree.index] = -1;
  layer.putTilesAt(
    Array.from({ length: map.height }, (_, y) => ids.slice(y * map.width, (y + 1) * map.width)),
    0,
    0,
  );
  buildTownTreeTexture(scene);
  const shadows = scene.add.graphics().setDepth(1).fillStyle(0x1f5a2e, 0.3);
  const images = trees.map((tree) => {
    shadows.fillEllipse(tree.x, tree.y, 8, 2);
    return scene.add.image(tree.x, tree.y, tree.texture).setOrigin(0.5, 1).setDepth(tree.depth);
  });
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    copy.destroy();
    shadows.destroy();
    for (const image of images) image.destroy();
  });
  return true;
}
