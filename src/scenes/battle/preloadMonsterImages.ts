import type Phaser from 'phaser';
import type { ContentIndex } from '../../core/content/loader';
import type { GameState } from '../../core/state/schema';
import { existingAssetUrl } from '../../rendering/assetCatalog';
import { preloadMonsterAnimation } from './monsterAnimation';

/** メニューと同じ完成PNGを、今回の敵・仲間に必要なぶんだけ先読みする。 */
export function preloadMonsterImages(scene: Phaser.Scene, enemyId: string): void {
  const content = scene.registry.get('content') as ContentIndex | undefined;
  const game = scene.registry.get('game') as GameState | undefined;
  const ids = new Set([enemyId, ...(game?.party.owned.map((monster) => monster.monsterId) ?? [])]);
  for (const id of ids) {
    preloadMonsterAnimation(scene, id);
    const monster = content?.monsters.get(id);
    const url = existingAssetUrl(`sprites/monsters/${id}.png`);
    if (monster && url && !scene.textures.exists(monster.spriteKey)) scene.load.image(monster.spriteKey, url);
  }
}
