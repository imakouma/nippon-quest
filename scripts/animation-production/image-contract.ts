import { inflateSync } from 'node:zlib';

export interface DecodedRgbaImage {
  width: number;
  height: number;
  pixels: Uint8Array;
}

export interface AnimationFrameAudit {
  frame: number;
  visiblePixels: number;
  transparentPixels: number;
  touchesMargin: boolean;
  normalizedMask: string;
}

export interface AnimationSheetAudit {
  issues: string[];
  warnings: string[];
  frames: AnimationFrameAudit[];
}

export interface AnimationSheetAuditOptions {
  allowLegacyMargins?: boolean;
}

function paeth(left: number, up: number, upperLeft: number): number {
  const prediction = left + up - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const upDistance = Math.abs(prediction - up);
  const upperLeftDistance = Math.abs(prediction - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  return upDistance <= upperLeftDistance ? up : upperLeft;
}

export function decodeRgbaPng(png: Buffer): DecodedRgbaImage {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!png.subarray(0, 8).equals(signature)) throw new Error('Invalid PNG signature');

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const compressed: Buffer[] = [];

  for (let offset = 8; offset + 12 <= png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const start = offset + 8;
    const end = start + length;
    if (end + 4 > png.length) throw new Error(`Truncated PNG chunk: ${type}`);
    if (type === 'IHDR') {
      width = png.readUInt32BE(start);
      height = png.readUInt32BE(start + 4);
      bitDepth = png[start + 8] ?? 0;
      colorType = png[start + 9] ?? 0;
      interlace = png[start + 12] ?? 0;
    } else if (type === 'IDAT') {
      compressed.push(png.subarray(start, end));
    } else if (type === 'IEND') {
      break;
    }
    offset = end + 4;
  }

  if (!width || !height || compressed.length === 0) throw new Error('PNG data is incomplete');
  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0)
    throw new Error(
      `Expected non-interlaced 8-bit RGBA PNG, received depth=${bitDepth} type=${colorType} interlace=${interlace}`,
    );

  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(compressed));
  if (inflated.length !== (stride + 1) * height)
    throw new Error(`Unexpected PNG data length: ${inflated.length}`);

  const pixels = new Uint8Array(stride * height);
  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset] ?? 0;
    sourceOffset += 1;
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[sourceOffset + x] ?? 0;
      const target = y * stride + x;
      const left = x >= bytesPerPixel ? (pixels[target - bytesPerPixel] ?? 0) : 0;
      const up = y > 0 ? (pixels[target - stride] ?? 0) : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel ? (pixels[target - stride - bytesPerPixel] ?? 0) : 0;
      let reconstructed: number;
      switch (filter) {
        case 0:
          reconstructed = raw;
          break;
        case 1:
          reconstructed = raw + left;
          break;
        case 2:
          reconstructed = raw + up;
          break;
        case 3:
          reconstructed = raw + Math.floor((left + up) / 2);
          break;
        case 4:
          reconstructed = raw + paeth(left, up, upperLeft);
          break;
        default:
          throw new Error(`Unsupported PNG filter: ${filter}`);
      }
      pixels[target] = reconstructed & 0xff;
    }
    sourceOffset += stride;
  }

  return { width, height, pixels };
}

function inspectFrame(image: DecodedRgbaImage, frame: number): AnimationFrameAudit {
  const originX = (frame % 4) * 128;
  const originY = Math.floor(frame / 4) * 128;
  let visiblePixels = 0;
  let transparentPixels = 0;
  let marginPixels = 0;
  let minX = 128;
  let minY = 128;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < 128; y += 1) {
    for (let x = 0; x < 128; x += 1) {
      const alpha = image.pixels[((originY + y) * image.width + originX + x) * 4 + 3] ?? 0;
      if (alpha < 16) {
        transparentPixels += 1;
        continue;
      }
      visiblePixels += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      if (x === 0 || x === 127 || y === 0 || y === 127) marginPixels += 1;
    }
  }

  const samples: string[] = [];
  if (maxX >= minX && maxY >= minY) {
    const boxWidth = maxX - minX + 1;
    const boxHeight = maxY - minY + 1;
    for (let sampleY = 0; sampleY < 32; sampleY += 1) {
      let row = '';
      const y = minY + Math.min(boxHeight - 1, Math.floor(((sampleY + 0.5) * boxHeight) / 32));
      for (let sampleX = 0; sampleX < 32; sampleX += 1) {
        const x = minX + Math.min(boxWidth - 1, Math.floor(((sampleX + 0.5) * boxWidth) / 32));
        const alpha = image.pixels[((originY + y) * image.width + originX + x) * 4 + 3] ?? 0;
        row += alpha >= 16 ? '1' : '0';
      }
      samples.push(row);
    }
  }

  return {
    frame,
    visiblePixels,
    transparentPixels,
    touchesMargin: marginPixels > 0,
    normalizedMask: samples.join(''),
  };
}

function maskDifference(left: string, right: string): number {
  if (left.length === 0 || left.length !== right.length) return 1;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) if (left[index] !== right[index]) difference += 1;
  return difference / left.length;
}

export function inspectAnimationSheet(
  image: DecodedRgbaImage,
  options: AnimationSheetAuditOptions = {},
): AnimationSheetAudit {
  if (image.width !== 512 || image.height !== 256 || image.pixels.length !== 512 * 256 * 4)
    return { issues: ['sheet-size'], warnings: [], frames: [] };

  const frames = Array.from({ length: 8 }, (_, frame) => inspectFrame(image, frame));
  const issues: string[] = [];
  const warnings: string[] = [];
  for (const frame of frames) {
    if (frame.visiblePixels < 64 || frame.transparentPixels < 64)
      issues.push(`frame-occupancy:${frame.frame}`);
    if (frame.touchesMargin) {
      const finding = `frame-margin:${frame.frame}`;
      if (options.allowLegacyMargins) warnings.push(finding);
      else issues.push(finding);
    }
  }

  const idleShapes = new Set(frames.slice(0, 4).map((frame) => frame.normalizedMask));
  if (idleShapes.size < 3) issues.push('idle-motion');
  if (maskDifference(frames[0]!.normalizedMask, frames[6]!.normalizedMask) < 0.02)
    issues.push('attack-transform-only');

  return { issues, warnings, frames };
}
