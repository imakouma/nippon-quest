import type Phaser from 'phaser';
import { terrainElevationFromObjects, type TerrainElevation } from '../../core/world/terrainElevation';
import { addOverworldViewLayer } from '../../rendering/overworld/viewLayer';
import type { MapKind } from './geography';
import { addTownDecor, addTownViewLayer } from './townPresentation';

type PresentedMap = [Phaser.Tilemaps.Tilemap, TerrainElevation, Phaser.Tilemaps.TilemapLayer | null];

export function createMapLayers(
  scene: Phaser.Scene,
  mapKey: string,
  kind: MapKind,
  tileSize: number,
): PresentedMap | null {
  const map = scene.make.tilemap({ key: mapKey });
  const elevation = terrainElevationFromObjects(
    map.width,
    map.height,
    tileSize,
    map.getObjectLayer('elevation')?.objects ?? [],
  );
  const tileset = map.addTilesetImage('overworld-tiles', 'overworld-tiles');
  if (!tileset) {
    console.error('[Overworld] タイルセットを読み込めません');
    return null;
  }

  const background = map.createLayer('background', tileset, 0, 0);
  if ((kind === 'field' || kind === 'enclave') && addOverworldViewLayer(scene, map, tileSize, elevation))
    background?.setVisible(false);
  if (kind === 'town') addTownViewLayer(scene, map, tileSize);
  if (map.getLayer('decor') && !(kind === 'town' && addTownDecor(scene, map, tileSize)))
    map.createLayer('decor', tileset, 0, 0);

  const collision = map.createLayer('collision', tileset, 0, 0);
  collision?.setVisible(map.getLayer('collision')?.visible ?? true);
  return [map, elevation, collision];
}
