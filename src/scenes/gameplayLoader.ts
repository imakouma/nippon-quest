import type Phaser from 'phaser';

/**
 * タイトル表示に不要な大きい Scene 群を、ゲーム開始時に一度だけ読み込む。
 *
 * import() の Promise を共有することで、連打や複数の開始経路があっても
 * 同じ Scene を二重登録しない。Scene の追加順もここで一元管理する。
 */
let loading: Promise<void> | null = null;

export function ensureGameplayScenes(game: Phaser.Game): Promise<void> {
  if (game.scene.keys.Overworld && game.scene.keys.Battle) return Promise.resolve();
  if (loading) return loading;

  loading = Promise.all([import('./Overworld'), import('./Battle')])
    .then(([overworld, battle]) => {
      if (!game.scene.keys.Overworld) game.scene.add('Overworld', overworld.OverworldScene, false);
      if (!game.scene.keys.Battle) game.scene.add('Battle', battle.BattleScene, false);
    })
    .catch((error) => {
      // 一時的なネットワーク障害なら、次の操作で再試行できるようにする。
      loading = null;
      throw error;
    });

  return loading;
}
