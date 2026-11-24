import Phaser from 'phaser';
import {
  ELEVATION_UNIT_PX,
  elevationAt,
  FIELD_ELEVATION_DATA_KEY,
  type TerrainElevation,
} from '../../core/world/terrainElevation';
import { NQ } from '../palette';
import { addImage, addSheet } from '../sheet';
import { createField3dCamera, projectField3dPoint, type Field3dPoint } from './field3dProjection';
import {
  buildTerrainGeometry,
  fieldPointForBillboard,
  shouldRenderTerrainProp,
  type TerrainBounds,
} from './terrainMeshGeometry';
import { VIEW } from './overworldView';
import { VIEW_COLS } from './viewTiles';

const FACE_TEXTURE = 'overworld-3d-stone-face';
const PROP_TEXTURE = 'overworld-3d-orchard-props';
const CAMERA_HORIZONTAL_MARGIN_TILES = 24;
const CAMERA_VERTICAL_MARGIN_TILES = 6;
const ORCHARD_TILES = new Set<number>([
  VIEW.ORCHARD,
  VIEW.ORCHARD_ALT,
  VIEW.ORCHARD_PEACH,
  VIEW.ORCHARD_PEACH_ALT,
]);

function buildStoneFaceTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(FACE_TEXTURE)) return;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d')!;
  context.fillStyle = NQ.white;
  context.fillRect(0, 0, 1, 1);
  addImage(scene.textures, FACE_TEXTURE, canvas);
}

function buildOrchardPropTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(PROP_TEXTURE)) return;
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 24;
  const context = canvas.getContext('2d')!;
  const draw = (offsetX: number, fruit: string, fruitShade: string) => {
    const pixel = (x: number, y: number, color: string, width = 1, height = 1) => {
      context.fillStyle = color;
      context.fillRect(offsetX + x, y, width, height);
    };
    pixel(5, 21, NQ.forest, 7, 2);
    pixel(7, 12, NQ.bark, 2, 10);
    pixel(8, 12, NQ.brown, 2, 9);
    pixel(3, 5, NQ.forest, 11, 9);
    pixel(5, 2, NQ.green, 7, 13);
    pixel(2, 7, NQ.green, 13, 5);
    pixel(5, 3, NQ.leaf, 5, 4);
    pixel(3, 6, NQ.leaf, 4, 3);
    for (const [x, y] of [
      [4, 9],
      [10, 6],
      [9, 11],
    ] as const) {
      pixel(x, y, fruit, 2, 2);
      pixel(x, y + 1, fruitShade, 2, 1);
    }
  };
  draw(0, NQ.red, NQ.brick);
  draw(16, NQ.blush, NQ.berry);
  addSheet(scene.textures, PROP_TEXTURE, canvas, 16, 24);
}

function visibleBounds(
  camera: Phaser.Cameras.Scene2D.Camera,
  tileSize: number,
  mapWidth: number,
  mapHeight: number,
): TerrainBounds {
  const width = camera.width / camera.zoom;
  const height = camera.height / camera.zoom;
  const left = camera.scrollX + (camera.width - width) / 2;
  const top = camera.scrollY + (camera.height - height) / 2;
  const x = Math.max(0, Math.floor(left / tileSize) - CAMERA_HORIZONTAL_MARGIN_TILES);
  const y = Math.max(0, Math.floor(top / tileSize) - CAMERA_VERTICAL_MARGIN_TILES);
  return {
    x,
    y,
    width: Math.min(mapWidth - x, Math.ceil(width / tileSize) + CAMERA_HORIZONTAL_MARGIN_TILES * 2 + 1),
    height: Math.min(mapHeight - y, Math.ceil(height / tileSize) + CAMERA_VERTICAL_MARGIN_TILES * 2 + 1),
  };
}

const boundsKey = (bounds: TerrainBounds): string =>
  `${bounds.x}:${bounds.y}:${bounds.width}:${bounds.height}`;

function topUvs(
  tileId: number,
  secondTriangle: boolean,
  textureWidth: number,
  textureHeight: number,
): number[] {
  const col = tileId % VIEW_COLS;
  const row = Math.floor(tileId / VIEW_COLS);
  const inset = 0.25;
  const u0 = (col * 16 + inset) / textureWidth;
  const u1 = ((col + 1) * 16 - inset) / textureWidth;
  const v0 = (row * 16 + inset) / textureHeight;
  const v1 = ((row + 1) * 16 - inset) / textureHeight;
  return secondTriangle ? [u1, v0, u0, v1, u1, v1] : [u0, v0, u0, v1, u1, v0];
}

function addMeshVertices(
  mesh: Phaser.GameObjects.Mesh,
  points: readonly Field3dPoint[],
  uvs: readonly number[],
  colors?: readonly number[],
): void {
  mesh.clear();
  mesh.addVertices(
    points.flatMap((point) => [point.x, point.height, point.z]),
    [...uvs],
    undefined,
    true,
    undefined,
    colors ? [...colors] : undefined,
  );
}

/** Real terrain polygons with a fixed pitched camera; the finished 2D frame is never warped. */
export function addTerrainMesh(
  scene: Phaser.Scene,
  tileIds: readonly number[],
  elevation: TerrainElevation,
  tileSize: number,
  blockedTiles: readonly boolean[] = [],
): boolean {
  if (scene.game.renderer.type !== Phaser.WEBGL) return false;
  buildStoneFaceTexture(scene);
  buildOrchardPropTexture(scene);
  const texture = scene.textures.get('overworld-view').getSourceImage() as CanvasImageSource & {
    width: number;
    height: number;
  };
  const topMesh = scene.add.mesh(0, 0, 'overworld-view').setDepth(-1000);
  const faceMesh = scene.add.mesh(0, 0, FACE_TEXTURE).setDepth(-999);
  const groundTiles = tileIds.map((tile) => (ORCHARD_TILES.has(tile) ? VIEW.GRASS : tile));
  for (const mesh of [topMesh, faceMesh]) {
    mesh.hideCCW = false;
    mesh.ignoreDirtyCache = true;
  }

  let currentBounds = '';
  let projectionSize = '';
  let topPoints: Field3dPoint[] = [];
  let facePoints: Field3dPoint[] = [];
  let props: Array<{ image: Phaser.GameObjects.Image; point: Field3dPoint }> = [];
  let projectedBillboards: Array<{
    object: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
  }> = [];

  const rebuild = (bounds: TerrainBounds) => {
    const geometry = buildTerrainGeometry(groundTiles, elevation, tileSize, bounds);
    topPoints = geometry.tops.flatMap((triangle) => triangle.vertices);
    const topUv = geometry.tops.flatMap((triangle, index) =>
      topUvs(triangle.tileId, index % 2 === 1, texture.width, texture.height),
    );
    addMeshVertices(topMesh, topPoints, topUv);

    facePoints = geometry.faces.flatMap((triangle) => triangle.vertices);
    const faceUv = geometry.faces.flatMap((_triangle, index) =>
      index % 2 === 1 ? [1, 0, 0, 1, 1, 1] : [0, 0, 0, 1, 1, 0],
    );
    const colors = geometry.faces.flatMap((triangle) => {
      const first = triangle.vertices[0];
      const course = Math.round(
        Math.min(...triangle.vertices.map((point) => point.height)) / ELEVATION_UNIT_PX,
      );
      const alternate = (Math.floor(first.x / tileSize) + Math.floor(first.z / tileSize) + course) % 2 === 0;
      const tint =
        triangle.side === 'south'
          ? alternate
            ? 0x6b6f80
            : 0x4a5063
          : triangle.side === 'east'
            ? 0x4a5063
            : 0x2e2a45;
      return Array<number>(3).fill(tint);
    });
    addMeshVertices(faceMesh, facePoints, faceUv, colors);

    for (const prop of props) prop.image.destroy();
    props = [];
    const endX = Math.min(elevation.width, bounds.x + bounds.width);
    const endY = Math.min(elevation.height, bounds.y + bounds.height);
    for (let y = bounds.y; y < endY; y++)
      for (let x = bounds.x; x < endX; x++) {
        const tile = tileIds[y * elevation.width + x] ?? -1;
        if (
          !ORCHARD_TILES.has(tile) ||
          !shouldRenderTerrainProp(x, y, blockedTiles[y * elevation.width + x] ?? false)
        )
          continue;
        const point = {
          x: x * tileSize + tileSize / 2,
          height: elevationAt(elevation, x, y) * ELEVATION_UNIT_PX,
          z: (y + 1) * tileSize,
        };
        const peach = tile === VIEW.ORCHARD_PEACH || tile === VIEW.ORCHARD_PEACH_ALT;
        const image = scene.add
          .image(point.x, point.z, PROP_TEXTURE, peach ? 1 : 0)
          .setOrigin(0.5, 1)
          .setDepth(point.z);
        props.push({ image, point });
      }
  };

  const update = () => {
    const camera = scene.cameras.main;
    const width = camera.width / camera.zoom;
    const height = camera.height / camera.zoom;
    const centerX = camera.scrollX + camera.width / 2;
    const centerZ = camera.scrollY + camera.height / 2;
    const bounds = visibleBounds(camera, tileSize, elevation.width, elevation.height);
    const key = boundsKey(bounds);
    if (key !== currentBounds) {
      currentBounds = key;
      rebuild(bounds);
    }
    const fieldCamera = createField3dCamera({ targetX: centerX, targetZ: centerZ, viewportHeight: height });
    for (const [mesh, points] of [
      [topMesh, topPoints],
      [faceMesh, facePoints],
    ] as const) {
      mesh.setPosition(centerX, centerZ);
      const size = `${width}:${height}`;
      if (size !== projectionSize) {
        mesh.setSize(width, height);
        mesh.setOrtho(width, height, -2000, 2000);
      }
      for (let index = 0; index < points.length; index++) {
        const projected = projectField3dPoint(points[index]!, fieldCamera);
        const vertex = mesh.vertices[index]!;
        vertex.x = projected.x;
        vertex.y = -projected.y;
        vertex.z = 0;
      }
    }
    projectionSize = `${width}:${height}`;
    for (const prop of props) {
      const projected = projectField3dPoint(prop.point, fieldCamera);
      prop.image
        .setPosition(centerX + projected.x, centerZ + projected.y)
        .setScale(projected.scale * 0.85)
        .setDepth(prop.point.z);
    }
  };

  const projectBillboards = () => {
    const camera = scene.cameras.main;
    const height = camera.height / camera.zoom;
    const centerX = camera.scrollX + camera.width / 2;
    const centerZ = camera.scrollY + camera.height / 2;
    const bounds = visibleBounds(camera, tileSize, elevation.width, elevation.height);
    const fieldCamera = createField3dCamera({ targetX: centerX, targetZ: centerZ, viewportHeight: height });
    const left = bounds.x * tileSize;
    const top = bounds.y * tileSize;
    const right = (bounds.x + bounds.width) * tileSize;
    const bottom = (bounds.y + bounds.height) * tileSize;
    projectedBillboards = [];
    for (const child of scene.children.list) {
      if (!(child instanceof Phaser.GameObjects.Image || child instanceof Phaser.GameObjects.Sprite))
        continue;
      if (
        !child.visible ||
        child.texture.key === PROP_TEXTURE ||
        child.scrollFactorX !== 1 ||
        child.scrollFactorY !== 1
      )
        continue;
      const storedElevation = child.getData(FIELD_ELEVATION_DATA_KEY);
      const point = fieldPointForBillboard(
        elevation,
        tileSize,
        child.x,
        child.y,
        typeof storedElevation === 'number' ? storedElevation : undefined,
      );
      if (point.x < left || point.x > right || point.z < top || point.z > bottom) continue;
      projectedBillboards.push({
        object: child,
        x: child.x,
        y: child.y,
        scaleX: child.scaleX,
        scaleY: child.scaleY,
      });
      const projected = projectField3dPoint(point, fieldCamera);
      child
        .setPosition(centerX + projected.x, centerZ + projected.y)
        .setScale(child.scaleX * projected.scale, child.scaleY * projected.scale);
    }
  };

  const restoreBillboards = () => {
    for (const billboard of projectedBillboards)
      billboard.object.setPosition(billboard.x, billboard.y).setScale(billboard.scaleX, billboard.scaleY);
    projectedBillboards = [];
  };

  const prepareRender = () => {
    update();
    projectBillboards();
  };

  scene.events.on(Phaser.Scenes.Events.PRE_RENDER, prepareRender);
  scene.events.on(Phaser.Scenes.Events.RENDER, restoreBillboards);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.PRE_RENDER, prepareRender);
    scene.events.off(Phaser.Scenes.Events.RENDER, restoreBillboards);
    restoreBillboards();
    topMesh.destroy();
    faceMesh.destroy();
    for (const prop of props) prop.image.destroy();
  });
  update();
  return true;
}
