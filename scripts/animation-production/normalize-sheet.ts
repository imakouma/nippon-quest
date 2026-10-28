import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { decodeRgbaPng, inspectAnimationSheet } from './image-contract';

export interface NormalizeAnimationSheetInput {
  inputPath: string;
  outputPath: string;
  ffmpegPath?: string;
  cellInset?: number;
}

function insetFilter(cellInset: number): string {
  const size = 128 - cellInset * 2;
  const splits = Array.from({ length: 8 }, (_, frame) => `[source${frame}]`).join('');
  const cells = Array.from({ length: 8 }, (_, frame) => {
    const column = frame % 4;
    const row = Math.floor(frame / 4);
    return `[source${frame}]crop=iw/4:ih/2:${column}*iw/4:${row}*ih/2,scale=${size}:${size}:flags=neighbor,pad=128:128:${cellInset}:${cellInset}:color=0x00000000[frame${frame}]`;
  });
  return [
    `[0:v]split=8${splits}`,
    ...cells,
    '[frame0][frame1][frame2][frame3]hstack=inputs=4[top]',
    '[frame4][frame5][frame6][frame7]hstack=inputs=4[bottom]',
    "[top][bottom]vstack=inputs=2,format=rgba,lut=a='if(lt(val\\,16)\\,0\\,val)'[output]",
  ].join(';');
}

export function normalizeAnimationSheet(input: NormalizeAnimationSheetInput): void {
  const source = decodeRgbaPng(readFileSync(input.inputPath));
  if (source.width !== source.height * 2)
    throw new Error(
      `Generated source must already use the exact 2:1 sheet layout, received ${source.width}x${source.height}`,
    );

  const cellInset = input.cellInset ?? 0;
  if (!Number.isInteger(cellInset) || cellInset < 0 || cellInset > 16)
    throw new Error(`cellInset must be an integer from 0 to 16, received ${cellInset}`);

  mkdirSync(dirname(input.outputPath), { recursive: true });
  const filter = "scale=512:256:flags=neighbor,format=rgba,lut=a='if(lt(val\\,16)\\,0\\,val)'";
  const filterArgs =
    cellInset === 0 ? ['-vf', filter] : ['-filter_complex', insetFilter(cellInset), '-map', '[output]'];
  const result = spawnSync(
    input.ffmpegPath ?? 'ffmpeg',
    ['-v', 'error', '-y', '-i', input.inputPath, ...filterArgs, '-frames:v', '1', input.outputPath],
    { encoding: 'utf8' },
  );
  if (result.error) {
    rmSync(input.outputPath, { force: true });
    throw result.error;
  }
  if (result.status !== 0) {
    rmSync(input.outputPath, { force: true });
    throw new Error(`ffmpeg failed for ${input.inputPath}: ${result.stderr.trim()}`);
  }

  const audit = inspectAnimationSheet(decodeRgbaPng(readFileSync(input.outputPath)));
  if (audit.issues.length > 0) {
    rmSync(input.outputPath, { force: true });
    throw new Error(`${input.outputPath}: ${audit.issues.join(', ')}`);
  }
}

function option(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function optionalInteger(name: string): number | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  const value = Number(process.argv[index + 1]);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
  return value;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath)
  normalizeAnimationSheet({
    inputPath: option('--input'),
    outputPath: option('--output'),
    cellInset: optionalInteger('--cell-inset'),
  });
