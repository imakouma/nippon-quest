import Phaser from 'phaser';
import type { TerrainElevation } from '../../core/world/terrainElevation';
import { NQ } from '../palette';
import { addSheet } from '../sheet';
import { buildElevationView, type ElevationFace } from './elevationView';
import { buildEntranceIcons } from './entranceIcons';
import { overworldView } from './overworldView';
import { addTerrainMesh } from './terrainMesh';
import { buildViewTexture } from './viewTiles';

/** Tiledのbackgroundを保ったまま、フィールド用の見た目レイヤーをSceneへ重ねる。 */
const FACE_TEXTURE = {
  cliff: 'overworld-elevation-cliff',
  stairs: 'overworld-elevation-stairs',
} as const;

function faceColor(style: ElevationFace['style'], x: number, y: number, height: number): string {
  if (style === 'stairs') {
    if (y === 0) return NQ.cloud;
    if (y === height - 1) return NQ.gray;
    return NQ.silver;
  }
  if (y === 0) return NQ.bark;
  if (y === height - 1) return NQ.night;
  return (x + Math.floor(y / 3) * 5) % 7 === 0 ? NQ.brown : NQ.tan;
}

function buildFaceTexture(scene: Phaser.Scene, style: ElevationFace['style']): void {
  const key = FACE_TEXTURE[style];
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 16;
  const context = canvas.getContext('2d')!;
  for (let frame = 0; frame < 4; frame++) {
    const height = (frame + 1) * 4;
    const left = frame * 16;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < 16; x++) {
        context.fillStyle = faceColor(style, x, y, height);
        context.fillRect(left + x, y, 1, 1);
      }
    }
  }
  addSheet(scene.textures, key, canvas, 16, 16);
}

export function addOverworldViewLayer(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
  tileSize: number,
  elevation: TerrainElevation = {
    width: map.width,
    height: map.height,
    tiles: Array<number>(map.width * map.height).fill(0),
  },
): boolean {
  buildViewTexture(scene);
  buildEntranceIcons(scene);
  const background = map.getLayer('background');
  if (!background) return false;
  const ids = overworldView(
    background.data.flatMap((row) => row.map((tile) => tile.index)),
    map.width,
    map.height,
  );
  const blockedTiles =
    map.getLayer('collision')?.data.flatMap((row) => row.map((tile) => tile.index > 0)) ?? [];
  if (addTerrainMesh(scene, ids, elevation, tileSize, blockedTiles)) return true;
  buildFaceTexture(scene, 'cliff');
  buildFaceTexture(scene, 'stairs');
  const viewMap = scene.make.tilemap({
    tileWidth: tileSize,
    tileHeight: tileSize,
    width: map.width,
    height: map.height,
  });
  const tiles = viewMap.addTilesetImage('overworld-view', 'overworld-view', tileSize, tileSize, 0, 0, 0);
  if (!tiles) {
    viewMap.destroy();
    return false;
  }
  const view = buildElevationView(ids, elevation, tileSize);
  for (const band of view.bands) {
    const layer = viewMap.createBlankLayer(`view-${band.elevation}`, tiles, 0, band.offsetY);
    if (!layer) continue;
    const rows = Array.from({ length: map.height }, (_, y) =>
      band.tiles.slice(y * map.width, (y + 1) * map.width),
    );
    layer.putTilesAt(rows, 0, 0);
  }
  for (const face of view.faces)
    scene.add
      .image(face.x, face.y, FACE_TEXTURE[face.style], face.height / 4 - 1)
      .setOrigin(0, 0)
      .setDepth(0);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => viewMap.destroy());
  return true;
}
