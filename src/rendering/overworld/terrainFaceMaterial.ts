import { NQ } from '../palette';
import type { TerrainFaceTriangle } from './terrainMeshGeometry';

export const CLIFF_FACE_WIDTH = 16;
export const CLIFF_FACE_HEIGHT = 4;

const SIDES: readonly TerrainFaceTriangle['side'][] = ['south', 'east', 'west'];
const BANDS: readonly TerrainFaceTriangle['band'][] = ['single', 'top', 'middle', 'bottom'];

const fillRow = (pixels: string[], y: number, color: string): void => {
  pixels.fill(color, y * CLIFF_FACE_WIDTH, (y + 1) * CLIFF_FACE_WIDTH);
};

const drawRun = (pixels: string[], x: number, y: number, width: number, color: string): void => {
  pixels.fill(color, y * CLIFF_FACE_WIDTH + x, y * CLIFF_FACE_WIDTH + x + width);
};

/** A four-pixel cliff course: grass lip, broken rock face, and contact shadow stay distinct. */
export function cliffFacePixels(
  side: TerrainFaceTriangle['side'],
  band: TerrainFaceTriangle['band'],
): string[] {
  const base = side === 'south' ? NQ.tan : side === 'east' ? NQ.brown : NQ.bark;
  const highlight = side === 'south' ? NQ.sand : side === 'east' ? NQ.tan : NQ.brown;
  const stone = side === 'south' ? NQ.silver : side === 'east' ? NQ.gray : NQ.slate;
  const shade = side === 'south' ? NQ.brown : side === 'east' ? NQ.bark : NQ.ink;
  const contactShadow = side === 'south' ? NQ.bark : NQ.ink;
  const pixels = Array<string>(CLIFF_FACE_WIDTH * CLIFF_FACE_HEIGHT).fill(base);

  // Sparse, staggered chips read as natural rock/soil without turning each course into brickwork.
  drawRun(pixels, 2, 1, 2, highlight);
  drawRun(pixels, 13, 1, 1, stone);
  drawRun(pixels, 0, 2, 1, shade);
  drawRun(pixels, 7, 2, 2, stone);
  drawRun(pixels, 15, 2, 1, highlight);
  drawRun(pixels, 4, 3, 1, stone);
  drawRun(pixels, 11, 3, 2, shade);

  if (band === 'single' || band === 'top') {
    const grass = side === 'south' ? NQ.leaf : side === 'east' ? NQ.green : NQ.forest;
    const grassShade = side === 'south' ? NQ.green : NQ.forest;
    fillRow(pixels, 0, grass);
    drawRun(pixels, 0, 0, 2, grassShade);
    drawRun(pixels, 7, 0, 3, grassShade);
    drawRun(pixels, 14, 0, 2, grassShade);
  } else {
    drawRun(pixels, 5, 0, 2, highlight);
    drawRun(pixels, 13, 0, 1, stone);
  }

  if (band === 'single' || band === 'bottom') {
    fillRow(pixels, 3, contactShadow);
    drawRun(pixels, 2, 3, 2, base);
    drawRun(pixels, 9, 3, 1, stone);
  }

  return pixels;
}

export const cliffFaceTextureWidth = (): number => SIDES.length * BANDS.length * CLIFF_FACE_WIDTH;

export function cliffFaceUvs(
  face: Pick<TerrainFaceTriangle, 'side' | 'band'>,
  secondTriangle: boolean,
): number[] {
  const frame = SIDES.indexOf(face.side) * BANDS.length + BANDS.indexOf(face.band);
  const textureWidth = cliffFaceTextureWidth();
  const inset = 0.01;
  const u0 = (frame * CLIFF_FACE_WIDTH + inset) / textureWidth;
  const u1 = ((frame + 1) * CLIFF_FACE_WIDTH - inset) / textureWidth;
  return secondTriangle ? [u1, 0, u0, 1, u1, 1] : [u0, 0, u0, 1, u1, 0];
}

export const CLIFF_FACE_SIDES = SIDES;
export const CLIFF_FACE_BANDS = BANDS;
