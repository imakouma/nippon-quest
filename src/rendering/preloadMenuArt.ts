import type { ContentIndex } from '../core/content/loader';
import { itemIconUrl } from './itemIcons';
import { monsterMenuArtUrl } from './menuArt';

const YIELD_EVERY = 12;

/**
 * 図鑑を初めて開く瞬間にドット絵を一括生成しないよう、Boot 中に共有キャッシュを温める。
 * 数枚ごとに描画へ制御を返し、ロード画面の進捗表示も止めない。
 */
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
