import type Phaser from 'phaser';
import { DIRS, type Dir } from '../../rendering/characters';
import { createPhaserNpc } from './phaserNpc';
import type { WanderingNpc } from './npcWander';

const TILE = 16;
const WATER_TILE = 3;
const DELTA: Record<Dir, [number, number]> = {
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
};

interface CreatePhaserHarborInput {
  map: Phaser.Tilemaps.Tilemap;
  tile: readonly [number, number];
  target: string;
  spawn: string;
  place: string;
  back: boolean;
  ferryName: string;
  inside: (x: number, y: number) => boolean;
}

/** 港の向き・桟橋・船・船頭をまとめて生成する。 */
export function createPhaserHarbor(scene: Phaser.Scene, input: CreatePhaserHarborInput): WanderingNpc {
  const [tileX, tileY] = input.tile;
  const background = input.map.getLayer('background');
  const isWater = (x: number, y: number) =>
    input.inside(x, y) && background?.data[y]?.[x]?.index === WATER_TILE;
  let sea: Dir = 'down';
  let run = -1;
  for (const direction of DIRS) {
    let length = 0;
    const [dx, dy] = DELTA[direction];
    while (length < 4 && isWater(tileX + dx * (length + 1), tileY + dy * (length + 1))) length++;
    if (length > run) {
      run = length;
      sea = direction;
    }
  }

  const [dx, dy] = DELTA[sea];
  if (run > 0) {
    const pierLength = Math.min(2, run - 1);
    for (let step = 1; step <= pierLength; step++)
      scene.add
        .image(
          (tileX + dx * step) * TILE + TILE / 2,
          (tileY + dy * step) * TILE + TILE / 2,
          dx ? 'fld.pier.h' : 'fld.pier.v',
        )
        .setDepth(2);
    const shipX = (tileX + dx * (pierLength + 1)) * TILE + TILE / 2;
    const shipY = (tileY + dy * (pierLength + 1)) * TILE + TILE / 2;
    const ship = scene.add
      .image(shipX, shipY, 'fld.ship')
      .setFlipX(dx > 0)
      .setDepth(shipY + 12);
    scene.tweens.add({
      targets: ship,
      y: shipY - 1,
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Stepped',
      easeParams: [2],
    });
  }

  const land: Dir = sea === 'up' ? 'down' : sea === 'down' ? 'up' : sea === 'left' ? 'right' : 'left';
  return createPhaserNpc(scene, {
    key: `ferry_${input.target}`,
    tile: [tileX, tileY],
    mapWidth: input.map.width,
    facing: land,
    persistState: false,
    wanders: false,
    role: 'ferry',
    name: input.ferryName,
    lines: [],
    nextMoveAt: Number.POSITIVE_INFINITY,
    ferry: {
      map: input.target,
      spawn: input.spawn,
      place: input.place,
      back: input.back,
    },
  });
}
