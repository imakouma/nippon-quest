import type Phaser from 'phaser';
import type { ContentIndex } from '../../core/content/loader';
import type { Element, Monster } from '../../core/content/schemas';
import { MONSTER_SIZE, monsterArt } from '../../rendering/battle/pixelArt';
import { monsterDisplaySize } from '../../rendering/menuArt';
import { visiblePixelBounds, type PixelBounds } from '../../rendering/monsterImageScale';
import { designedMonsterArt } from '../../rendering/monsters';
import type { BattleLayout } from './layout';

/** 地方ボス 56 / 中ボス 40 / 県ボス 48 / 通常 32。 */
export function monsterStageSize(def: Monster, content: ContentIndex, isBoss: boolean): number {
  const size = monsterDisplaySize(def, content);
  return size === MONSTER_SIZE.normal && isBoss ? MONSTER_SIZE.boss : size;
}

const BODY_HEIGHT_COMPRESSION_EXPONENT = 0.55;

/** 100cmを従来の通常敵相当とし、大型ほど少し強く反映しながら安全領域へ収める。 */
export function monsterBodyTargetHeight(heightCm: number, layout: BattleLayout): number {
  const compressed = layout.enemy.referenceBodyHeight * (heightCm / 100) ** BODY_HEIGHT_COMPRESSION_EXPONENT;
  return Math.max(layout.enemy.minBodyHeight, Math.min(layout.enemy.maxBodyHeight, compressed));
}

/** 大型の敵だけ足元を下げ、身体上端がHUDの安全ラインを越えないようにする。 */
export function monsterBodyGroundY(targetBodyHeight: number, layout: BattleLayout): number {
  return Math.max(layout.enemy.y, layout.enemy.minBodyTop + targetBodyHeight);
}

const boundsCache = new WeakMap<Phaser.Textures.TextureManager, Map<string, PixelBounds>>();

/** ニュートラルフレームを一度だけ走査し、透明余白を除いた身体領域を返す。 */
export function monsterFrameVisibleBounds(
  textures: Phaser.Textures.TextureManager,
  key: string,
  frame: string | number,
  width: number,
  height: number,
): PixelBounds {
  let cache = boundsCache.get(textures);
  if (!cache) {
    cache = new Map();
    boundsCache.set(textures, cache);
  }
  const cacheKey = `${key}:${String(frame)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const bounds = visiblePixelBounds(width, height, (x, y) => textures.getPixelAlpha(x, y, key, frame));
  cache.set(cacheKey, bounds);
  return bounds;
}

/** 完成 PNG が無いときだけ、既存の手描き絵または属性絵を登録する。 */
export function ensureMonsterTexture(
  textures: Phaser.Textures.TextureManager,
  def: Monster,
  element: Element,
  size: number,
  boss: boolean,
  suffix = '',
): string {
  const key = `${def.spriteKey}${suffix}`;
  if (!textures.exists(key))
    textures.addCanvas(
      key,
      designedMonsterArt(def.id, suffix) ?? monsterArt(`${def.id}${suffix}`, { element, size, boss }),
    );
  return key;
}
