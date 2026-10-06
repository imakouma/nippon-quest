import type Phaser from 'phaser';
import { VIEW } from './overworldView';

const WATER_FRAMES = 9;

/** 沖の水面に出す光。座標とフレームだけで決まり、セーブや乱数へ影響しない。 */
export const waterTileForFrame = (x: number, y: number, frame: number): number =>
  (x * 2 + y * 5 + frame) % WATER_FRAMES === 0 ? VIEW.WATER_GLINT : VIEW.WATER;

/** 海岸線は固定したまま、沖（陸に接していない水面）のきらめきだけをゆっくり流す。 */
export function startWaterAnimation(scene: Phaser.Scene, layer: Phaser.Tilemaps.TilemapLayer): void {
  const water = layer.layer.data.flatMap((row) =>
    row.filter((tile) => tile.index === VIEW.WATER || tile.index === VIEW.WATER_GLINT),
  );
  if (!water.length) return;
  let frame = 0;
  const update = () => {
    frame = (frame + 1) % WATER_FRAMES;
    for (const tile of water) tile.index = waterTileForFrame(tile.x, tile.y, frame);
  };
  const timer = scene.time.addEvent({ delay: 420, loop: true, callback: update });
  scene.events.once('shutdown', () => timer.destroy());
}
