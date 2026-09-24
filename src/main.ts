import Phaser from 'phaser';
import './questions/renderers/shared/questions.css';
import { BootScene } from './scenes/Boot';
import { TitleScene } from './scenes/Title';
import { OverworldScene } from './scenes/Overworld';
import { BattleScene } from './scenes/Battle';
import { attachOverlay, STAGE_H, STAGE_W } from './ui/overlay';
import { createNewGame } from './core/state/newGame';
import { GROUNDS } from './core/world/ground';

/**
 * 名前入力・スターター選択（Step 7〜9）ができるまでの仮の「はじめから」。
 * スターター（ヒノ／ミズ／モリ）が content に入ったら差し替える。
 */
const DEV_NEW_GAME = { name: 'ハル', starterMonsterId: 'aomori-nebutan', grade: 1 } as const;

/**
 * ?debug=battle[&enemy=<monsterId>][&lv=<n>][&zone=dungeon][&ground=beach] でタイトルを飛ばしてすぐバトル（確認・E2E 用）。
 * ground は フィールドの 地面（src/core/world/ground.ts）ごとの 背景を 見る ため
 */
const params = new URLSearchParams(location.search);
/**
 * ?grade=<1〜6> で「はじめから」の学年（出題の学年と漢字表示レベル）を決める。学年の設定画面ができるまでの確認用。
 * 漢字表示レベルより上の学年の漢字は、ルビではなく ひらがなで出る（src/ui/ruby.ts）
 */
const grade = Math.min(6, Math.max(1, Math.round(Number(params.get('grade')) || 1))) as Parameters<
  typeof createNewGame
>[0]['grade'];
const debugBattle =
  params.get('debug') === 'battle'
    ? {
        enemyId: params.get('enemy') ?? 'aomori-ringoron',
        level: Math.max(1, Number(params.get('lv')) || 1),
        zone: params.get('zone') === 'dungeon' ? ('dungeon' as const) : undefined,
        ground: GROUNDS.find((g) => g === params.get('ground')),
      }
    : null;

const gameRoot = document.getElementById('game-root')!;
const uiLayer = document.getElementById('ui-layer')!;

const loading = document.createElement('div');
loading.className = 'nq-loading';
loading.innerHTML = '<div>よみこみちゅう…</div><div class="nq-loading-bar"><div></div></div>';
uiLayer.append(loading);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: gameRoot,
  width: STAGE_W,
  height: STAGE_H,
  backgroundColor: '#0b0d16',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
  scene: [BootScene, TitleScene, OverworldScene, BattleScene],
});

attachOverlay(gameRoot, uiLayer);

game.events.on('boot:progress', (v: number) => {
  const bar = loading.querySelector<HTMLDivElement>('.nq-loading-bar > div');
  if (bar) bar.style.width = `${Math.round(v * 100)}%`;
});
game.events.on('boot:done', () => loading.remove());
game.events.on('boot:error', (e: unknown) => {
  loading.remove();
  const box = document.createElement('div');
  box.className = 'nq-error';
  box.textContent = `コンテンツの よみこみに しっぱいしました。\n\n${e instanceof Error ? e.message : String(e)}\n\n・pnpm gen:manifest を実行しましたか？\n・content/ の JSON に エラーは ありませんか？（pnpm validate:content）`;
  uiLayer.append(box);
});
game.events.on('title:start', () => {
  // セーブ／ロード（Step 9）ができるまでは、はじめる たびに新しい GameState をメモリ上に作る
  if (!game.registry.get('game')) game.registry.set('game', createNewGame({ ...DEV_NEW_GAME, grade }));
  game.scene.stop('Title');
  game.scene.start('Overworld', { mapKey: 'aomori-field', spawnName: 'spawn', debugBattle });
});

// 開発中だけ、ブラウザのコンソールや E2E からゲームの中を見られるようにする（本番ビルドには入らない）
if (import.meta.env.DEV) (window as unknown as { __nq?: Phaser.Game }).__nq = game;

export { game };
