import type Phaser from 'phaser';
import { VIEW } from './overworldView';

const PHASES = 8;
const FRAMES = 16;
const TILE = 16;
const oceanImageUrl = new URL('../../../assets/tilesets/ocean-wave.png', import.meta.url).href;

export const oceanFrameForPhase = (frame: number, phase: number): number => (frame + phase) % FRAMES;
export const oceanPhaseAt = (x: number, y: number): number =>
  (((Math.floor(x / 3) + Math.floor(y / 3)) % PHASES) + PHASES) % PHASES;
export const isOceanTile = (tile: number): boolean =>
  (tile >= VIEW.WATER && tile <= VIEW.WATER_GLINT) ||
  tile === VIEW.WATER_FLOW_1 ||
  tile === VIEW.WATER_FLOW_2;
export const oceanTextureTile = (tile: number, x: number, y: number): number =>
  isOceanTile(tile) ? oceanPhaseAt(x, y) : tile;

/** Replaces the shared water atlas cells, not every visible map tile. */
export function startOceanMotion(scene: Phaser.Scene): void {
  const source = scene.textures.get('overworld-view').source[0];
  if (!source || !(source.image instanceof HTMLCanvasElement)) return;
  const context = source.image.getContext('2d');
  if (!context) return;
  const image = new Image();
  let disposed = false;
  let timer: Phaser.Time.TimerEvent | undefined;
  image.onload = () => {
    if (disposed) return;
    let frame = 0;
    const update = () => {
      context.imageSmoothingEnabled = false;
      for (let phase = 0; phase < PHASES; phase++) {
        context.drawImage(
          image,
          oceanFrameForPhase(frame, phase) * TILE,
          0,
          TILE,
          TILE,
          phase * TILE,
          0,
          TILE,
          TILE,
        );
      }
      source.update();
      frame = (frame + 1) % FRAMES;
    };
    update();
    timer = scene.time.addEvent({ delay: 120, loop: true, callback: update });
  };
  image.src = oceanImageUrl;
  scene.events.once('shutdown', () => {
    disposed = true;
    image.onload = null;
    timer?.destroy();
  });
}
