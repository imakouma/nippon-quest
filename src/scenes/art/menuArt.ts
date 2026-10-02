import type { ContentIndex } from '../../core/content/loader';
import type { Monster } from '../../core/content/schemas';
import { itemIconUrl } from './itemIcons';
import { designedMonsterArt } from './monsters';
import { MONSTER_SIZE, monsterArt } from '../battle/pixelArt';

const monsterUrls = new Map<string, string>();

/** メニューで共有するモンスター画像。Boot と Overworld のどちらから呼んでも同じキャッシュを使う。 */
export function monsterMenuArtUrl(def: Monster): string {
  const hit = monsterUrls.get(def.id);
  if (hit) return hit;
  const canvas =
    designedMonsterArt(def.id) ??
    monsterArt(def.id, { element: def.element, size: MONSTER_SIZE.normal, boss: def.isBoss });
  const url = canvas.toDataURL();
  monsterUrls.set(def.id, url);
  return url;
}

/** 初回メニュー操作で止まらないよう、ロード画面中に画像を小分けで準備する。 */
export async function warmMenuArt(
  content: ContentIndex,
  onProgress?: (ratio: number) => void,
): Promise<void> {
  const monsters = [...content.monsters.values()];
  const specialtyItems = [...content.areas.values()].flatMap((area) =>
    area.motifs
      .filter((motif) => motif.kind === 'food' || motif.kind === 'craft')
      .flatMap((motif) => content.items.get(`${area.id}-${motif.id}`) ?? []),
  );
  const jobs = [
    ...monsters.map((monster) => () => monsterMenuArtUrl(monster)),
    ...specialtyItems.map((item) => () => itemIconUrl(item)),
  ];
  const batchSize = 8;
  for (let start = 0; start < jobs.length; start += batchSize) {
    for (const job of jobs.slice(start, start + batchSize)) job();
    onProgress?.(Math.min(1, (start + batchSize) / jobs.length));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  onProgress?.(1);
}
