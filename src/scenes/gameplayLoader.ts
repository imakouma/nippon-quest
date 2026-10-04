import type Phaser from 'phaser';

/**
 * タイトル表示に不要な大きい Scene 群を、ゲーム開始時に一度だけ読み込む。
 *
 * 開発サーバーへ多数のモジュール要求が同時集中しないよう、Scene は直列に読む。
 * Promise は共有し、連打や複数の開始経路でも二重登録しない。
 */
let loading: Promise<void> | null = null;

export function ensureGameplayScenes(game: Phaser.Game): Promise<void> {
  if (game.scene.keys.Overworld && game.scene.keys.Battle) return Promise.resolve();
  if (loading) return loading;

  loading = (async () => {
    const overworld = await import('./Overworld');
    if (!game.scene.keys.Overworld) game.scene.add('Overworld', overworld.OverworldScene, false);

    const battle = await import('./Battle');
    if (!game.scene.keys.Battle) game.scene.add('Battle', battle.BattleScene, false);
  })().catch((error) => {
    loading = null;
    throw error;
  });

  return loading;
}
