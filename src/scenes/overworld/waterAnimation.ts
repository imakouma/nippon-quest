import type Phaser from 'phaser';
import { VIEW } from '../../rendering/overworld/overworldView';

const WATER_FRAMES = [VIEW.WATER, VIEW.WATER_FLOW_1, VIEW.WATER_FLOW_2] as const;
const WATER_TILES = new Set<number>([...WATER_FRAMES, VIEW.WATER_GLINT]);

/** 沖の水面に出す光。座標とフレームだけで決まり、セーブや乱数へ影響しない。 */
export const waterTileForFrame = (x: number, y: number, frame: number): number =>
  WATER_FRAMES[(x + y + frame) % WATER_FRAMES.length]!;

/** 海岸線は固定したまま、沖（陸に接していない水面）の波線をゆっくり流す。 */
export function startWaterAnimation(scene: Phaser.Scene, layer: Phaser.Tilemaps.TilemapLayer): void {
  const water = layer.layer.data.flatMap((row) => row.filter((tile) => WATER_TILES.has(tile.index)));
  if (!water.length) return;
  let frame = 0;
  const update = () => {
    frame = (frame + 1) % WATER_FRAMES.length;
    for (const tile of water) tile.index = waterTileForFrame(tile.x, tile.y, frame);
  };
  const timer = scene.time.addEvent({ delay: 420, loop: true, callback: update });
  scene.events.once('shutdown', () => timer.destroy());
}
