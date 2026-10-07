import type { Monster } from '../core/content/schemas';
import { designedMonsterArt } from './monsters';
import { MONSTER_SIZE, monsterArt } from './battle/pixelArt';
import { existingAssetUrl } from './assetCatalog';

const monsterUrls = new Map<string, string>();

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
