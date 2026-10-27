import type Phaser from 'phaser';
import type { ContentIndex } from '../../core/content/loader';
import type { Element, Monster } from '../../core/content/schemas';
import { MONSTER_SIZE, monsterArt } from '../../rendering/battle/pixelArt';
import { monsterDisplaySize } from '../../rendering/menuArt';
import { designedMonsterArt } from '../../rendering/monsters';
import { BATTLE_SCALE, type BattleLayout } from './layout';

/** 地方ボス 56 / 中ボス 40 / 県ボス 48 / 通常 32。 */
export function monsterStageSize(def: Monster, content: ContentIndex, isBoss: boolean): number {
  const size = monsterDisplaySize(def, content);
  return size === MONSTER_SIZE.normal && isBoss ? MONSTER_SIZE.boss : size;
}

/** ボスだけ一回り大きくし、レイアウトの上限内へ収める。 */
export function monsterStageScale(size: number, isBoss: boolean, layout: BattleLayout): number {
  const base = Math.max(2, BATTLE_SCALE + layout.enemy.scaleStep);
  return isBoss && size * (base + 1) <= layout.bossMaxHeight ? base + 1 : base;
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
