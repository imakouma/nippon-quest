import { useEffect, useRef } from 'preact/hooks';
import town from '../../../maps/aomori-town.json';
import {
  HERO_FEET_ORIGIN_Y,
  HERO_H,
  HERO_W,
  heroLook,
  walkFrame,
  walkSheet,
  type Dir,
  type HeroAppearance,
} from '../../rendering/characters';
import { overworldTilesetCanvas } from '../../rendering/overworld/fieldArt';
import { STAGE_H, STAGE_W } from '../overlay';

const width = STAGE_W / 4;
const height = STAGE_H / 4;
const origin = { x: 280, y: 493 };
const spawn = { x: 120, y: 67 };
const movement: Record<Dir, readonly [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
const collision = town.layers.find((layer) => layer.name === 'collision')?.data;

export function SettingsPracticeField({
  appearance,
  direction,
}: {
  appearance: HeroAppearance;
  direction: { current: Dir | null };
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const background = document.createElement('canvas');
    background.width = width;
    background.height = height;
    const scenery = background.getContext('2d')!;
    const tiles = overworldTilesetCanvas();
    const tileSize = town.tilewidth;
    const columns = town.tilesets[0]?.columns ?? 8;
    for (const layer of town.layers) {
      if (layer.name !== 'background' && layer.name !== 'decor') continue;
      layer.data?.forEach((gid, index) => {
        if (!gid) return;
        const x = (index % town.width) * tileSize - origin.x;
        const y = Math.floor(index / town.width) * tileSize - origin.y;
        if (x <= -tileSize || y <= -tileSize || x >= width || y >= height) return;
        const tile = gid - 1;
        scenery.drawImage(
          tiles,
          (tile % columns) * tileSize,
          Math.floor(tile / columns) * tileSize,
          tileSize,
          tileSize,
          x,
          y,
          tileSize,
          tileSize,
        );
      });
    }

    const hero = walkSheet(heroLook(appearance), true);
    let { x, y } = spawn;
    let facing: Dir = 'down';
    let previous = performance.now();
    let stride = 0;
    let frame = 0;
    const paint = (now: number) => {
      const step = Math.min(now - previous, 32) * 0.065;
      previous = now;
      const input = direction.current;
      if (input) {
        facing = input;
        const [dx, dy] = movement[input];
        const nextX = Math.min(width - 8, Math.max(8, x + dx * step));
        const nextY = Math.min(height - 6, Math.max(20, y + dy * step));
        const tile =
          Math.floor((nextY + origin.y) / tileSize) * town.width + Math.floor((nextX + origin.x) / tileSize);
        if (!collision?.[tile]) {
          x = nextX;
          y = nextY;
          stride += step;
        }
      }
      const pose = input ? (([0, 1, 2, 1] as const)[Math.floor(stride / 6) % 4] ?? 1) : 1;
      const sprite = walkFrame(facing, pose);
      ctx.drawImage(background, 0, 0);
      ctx.drawImage(
        hero,
        (sprite % 3) * HERO_W,
        Math.floor(sprite / 3) * HERO_H,
        HERO_W,
        HERO_H,
        Math.round(x - HERO_W / 2),
        Math.round(y - HERO_H * HERO_FEET_ORIGIN_Y),
        HERO_W,
        HERO_H,
      );
      frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [appearance, direction]);
  return <canvas ref={canvas} width={width} height={height} aria-hidden="true" />;
}
