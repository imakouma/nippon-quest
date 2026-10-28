import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { decodeRgbaPng, inspectAnimationSheet } from './image-contract';

export interface NormalizeAnimationSheetInput {
  inputPath: string;
  outputPath: string;
  ffmpegPath?: string;
}

export function normalizeAnimationSheet(input: NormalizeAnimationSheetInput): void {
  const source = decodeRgbaPng(readFileSync(input.inputPath));
  if (source.width !== source.height * 2)
    throw new Error(
      `Generated source must already use the exact 2:1 sheet layout, received ${source.width}x${source.height}`,
    );

  mkdirSync(dirname(input.outputPath), { recursive: true });
  const filter = "scale=512:256:flags=neighbor,format=rgba,lut=a='if(lt(val\\,16)\\,0\\,val)'";
  const result = spawnSync(
    input.ffmpegPath ?? 'ffmpeg',
    ['-v', 'error', '-y', '-i', input.inputPath, '-vf', filter, '-frames:v', '1', input.outputPath],
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

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath)
  normalizeAnimationSheet({ inputPath: option('--input'), outputPath: option('--output') });
