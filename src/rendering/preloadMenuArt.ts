import type { ContentIndex } from '../core/content/loader';
import { itemIconUrl } from './itemIcons';
import { monsterMenuArtUrl } from './menuArt';

const YIELD_EVERY = 12;

/** 開発用の明示的なキャッシュ生成。通常起動からは呼ばない。 */
export async function preloadMenuArt(
  content: ContentIndex,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const jobs = [
    ...Array.from(content.monsters.values(), (monster) => () => monsterMenuArtUrl(monster)),
    ...Array.from(content.items.values(), (item) => () => itemIconUrl(item)),
  ];

  if (!jobs.length) {
    onProgress?.(1);
    return;
  }

  for (let index = 0; index < jobs.length; index += 1) {
    jobs[index]?.();
    onProgress?.((index + 1) / jobs.length);
    if ((index + 1) % YIELD_EVERY === 0)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}

interface DeferredMenuArtOptions {
  schedule?: (run: () => void) => void;
  onDone?: () => void;
  onError?: (error: unknown) => void;
}

/** 開発用に、明示的に指定されたときだけ非同期生成する。 */
export function deferMenuArtPreload(content: ContentIndex, options: DeferredMenuArtOptions = {}): void {
  const schedule = options.schedule ?? ((run: () => void) => setTimeout(run, 0));
  schedule(() => {
    void preloadMenuArt(content)
      .then(() => options.onDone?.())
      .catch((error: unknown) => options.onError?.(error));
  });
}
