import Phaser from 'phaser';
import { townView } from '../../rendering/overworld/townView';
import { buildTownViewTexture, TOWN_VIEW_TEXTURE } from '../../rendering/overworld/townViewArt';

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
