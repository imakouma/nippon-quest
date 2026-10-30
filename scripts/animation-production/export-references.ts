import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { decodeRgbaPng } from './image-contract';

export interface ExportMonsterReferencesInput {
  baseUrl: string;
  ids: string[];
  outputDir: string;
}

export async function exportMonsterReferences(input: ExportMonsterReferencesInput): Promise<string[]> {
  const url = new URL(input.baseUrl);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname))
    throw new Error(`Reference export requires a local HTTP URL: ${input.baseUrl}`);
  for (const id of input.ids) if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`Invalid monster id: ${id}`);
  if (new Set(input.ids).size !== input.ids.length) throw new Error('Duplicate monster id');

  const outputDir = resolve(input.outputDir);
  mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch();
  const written: string[] = [];
  try {
    const page = await browser.newPage();
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    for (const id of input.ids) {
      const dataUrl = await page.evaluate(async (monsterId) => {
        const modulePath = '/src/rendering/monsters/index.ts';
        const monsters = (await import(/* @vite-ignore */ modulePath)) as {
          designedMonsterArt(id: string): HTMLCanvasElement | null;
        };
        return monsters.designedMonsterArt(monsterId)?.toDataURL('image/png') ?? null;
      }, id);
      if (!dataUrl) throw new Error(`${id}: MONSTER_DESIGNS entry is missing`);
      const prefix = 'data:image/png;base64,';
      if (!dataUrl.startsWith(prefix)) throw new Error(`${id}: browser returned an invalid PNG data URL`);
      const png = Buffer.from(dataUrl.slice(prefix.length), 'base64');
      const image = decodeRgbaPng(png);
      let visible = 0;
      let transparent = 0;
      for (let offset = 3; offset < image.pixels.length; offset += 4) {
        if ((image.pixels[offset] ?? 0) >= 16) visible += 1;
        else transparent += 1;
      }
      if (visible === 0 || transparent === 0)
        throw new Error(`${id}: reference must contain visible and transparent pixels`);
      const path = resolve(outputDir, `${id}-reference.png`);
      writeFileSync(path, png);
      written.push(path);
    }
  } finally {
    await browser.close();
  }
  return written;
}

function option(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  const written = await exportMonsterReferences({
    baseUrl: option('--base-url'),
    ids: option('--ids').split(','),
    outputDir: option('--output-dir'),
  });
  console.log(`monster references exported: ${written.length}`);
}
