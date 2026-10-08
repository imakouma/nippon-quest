import type { ContentIndex } from '../core/content/loader';
import type { Monster } from '../core/content/schemas';
import { designedMonsterArt } from './monsters';
import { MONSTER_SIZE, monsterArt } from './battle/pixelArt';
import { existingAssetUrl } from './assetCatalog';

const monsterUrls = new Map<string, string>();

/** バトルと図鑑で共通のモンスターサイズ。 */
export function monsterDisplaySize(def: Monster, content: Pick<ContentIndex, 'areas' | 'world'>): number {
  if (!content.areas.has(def.area) && content.world.islands.some((island) => island.id === def.area))
    return MONSTER_SIZE.islandBoss;
  if ([...content.areas.values()].some((area) => area.midBoss === def.id)) return MONSTER_SIZE.midBoss;
  return def.isBoss ? MONSTER_SIZE.boss : MONSTER_SIZE.normal;
}

/** メニューで共有するモンスター画像。Boot と Overworld のどちらから呼んでも同じキャッシュを使う。 */
export function monsterMenuArtUrl(def: Monster): string {
  const asset = existingAssetUrl(`sprites/monsters/${def.id}.png`);
  if (asset) return asset;
  const hit = monsterUrls.get(def.id);
  if (hit) return hit;
  const canvas =
    designedMonsterArt(def.id) ??
    monsterArt(def.id, { element: def.element, size: MONSTER_SIZE.normal, boss: def.isBoss });
  const url = canvas.toDataURL();
  monsterUrls.set(def.id, url);
  return url;
}
