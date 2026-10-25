import Phaser from 'phaser';
import { buildEntranceIcons } from './entranceIcons';
import { overworldView } from './overworldView';
import { buildViewTexture } from './viewTiles';

/** Tiledのbackgroundを保ったまま、フィールド用の見た目レイヤーをSceneへ重ねる。 */
export function addOverworldViewLayer(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
  tileSize: number,
): void {
  buildViewTexture(scene);
  buildEntranceIcons(scene);
  const background = map.getLayer('background');
  if (!background) return;
  const viewMap = scene.make.tilemap({
    tileWidth: tileSize,
    tileHeight: tileSize,
    width: map.width,
    height: map.height,
  });
  const tiles = viewMap.addTilesetImage('overworld-view', 'overworld-view', tileSize, tileSize, 0, 0, 0);
  const layer = tiles ? viewMap.createBlankLayer('view', tiles, 0, 0) : null;
  if (!layer) return;
  const ids = overworldView(
    background.data.flatMap((row) => row.map((tile) => tile.index)),
    map.width,
    map.height,
  );
  const rows = Array.from({ length: map.height }, (_, y) => ids.slice(y * map.width, (y + 1) * map.width));
  layer.putTilesAt(rows, 0, 0);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => viewMap.destroy());
}
