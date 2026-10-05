import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadContent, type ContentIndex, type FileReader } from '../../src/core/content/loader';
import type { BattleDeps } from '../../src/core/battle/engine';

const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
export const read: FileReader = async (rel) => JSON.parse(readFileSync(CONTENT + rel, 'utf8'));

let cached: ContentIndex | null = null;
export async function content(): Promise<ContentIndex> {
  cached ??= await loadContent(read);
  return cached;
}

export async function deps(): Promise<BattleDeps> {
  const c = await content();
  return {
    settings: c.settings,
    elements: c.elements,
    skills: c.skills,
    items: c.items,
    monsters: c.monsters,
  };
}
