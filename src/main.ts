import Phaser from 'phaser';
import './questions/renderers/shared/questions.css';
import { BootScene } from './scenes/Boot';
import { TitleScene } from './scenes/Title';
import { ensureGameplayScenes } from './scenes/gameplayLoader';
import { attachOverlay, STAGE_H, STAGE_W } from './ui/overlay';
import { createNewGame, type NewGameOptions } from './core/state/newGame';
import { load, save, type SlotId } from './core/state/save';
import { GROUNDS } from './core/world/ground';
import { setSfxVolume } from './ui/sfx';
import { bundledFetchReader } from './core/content/loader';
import { QuestionBank } from './questions/engine/bank';

/** デバッグ起動で初期設定画面を通らない場合の既定値。 */
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
loading.innerHTML =
  '<div class="nq-loading-label">よみこみちゅう…</div><div class="nq-loading-bar"><div></div></div>';
uiLayer.append(loading);

function showLoading(label: string): void {
  const text = loading.querySelector<HTMLDivElement>('.nq-loading-label');
  const bar = loading.querySelector<HTMLDivElement>('.nq-loading-bar > div');
  if (text) text.textContent = label;
  if (bar) bar.style.width = '100%';
  if (!loading.isConnected) uiLayer.append(loading);
}

function hideLoading(): void {
  loading.remove();
}

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
  // Overworld/Battle はタイトル表示には不要なので、開始操作のときに動的登録する。
  scene: [BootScene, TitleScene],
});

attachOverlay(gameRoot, uiLayer);

game.events.on('boot:progress', (v: number) => {
  const bar = loading.querySelector<HTMLDivElement>('.nq-loading-bar > div');
  if (bar) bar.style.width = `${Math.round(v * 100)}%`;
});
game.events.on('boot:stage', (text: string) => {
  const label = loading.querySelector<HTMLDivElement>('.nq-loading-label');
  if (label) label.textContent = text;
});
game.events.on('boot:done', hideLoading);
game.events.on('boot:error', (e: unknown) => {
  hideLoading();
  const box = document.createElement('div');
  box.className = 'nq-error';
  box.textContent = `コンテンツの よみこみに しっぱいしました。\n\n${e instanceof Error ? e.message : String(e)}\n\n・pnpm gen:manifest を実行しましたか？\n・content/ の JSON に エラーは ありませんか？（pnpm validate:content）`;
  uiLayer.append(box);
});
let activeSlot: SlotId = 1;
let bankPromise: Promise<QuestionBank> | undefined;
function ensureQuestionBank(): Promise<QuestionBank> {
  if (game.registry.get('bank')) return Promise.resolve(game.registry.get('bank') as QuestionBank);
  bankPromise ??= (async () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    // 問題は開発中も生成済み bundle から一括取得する。48 ファイルを同時に
    // fetch すると、内蔵ブラウザなど接続数が限られる環境で最後の 1 件が
    // 待ち続け、ゲーム開始画面から進めなくなることがある。
    const read = bundledFetchReader(`${base}/content`, 'questions-bundle.json');
    const files = game.registry.get('questionFiles') as string[];
    const { bank, report } = await QuestionBank.load(files, read);
    if (report.skipped.length) console.warn('[questions] 読み込めなかった問題:', report.skipped);
    game.registry.set('bank', bank);
    return bank;
  })().catch((error) => {
    bankPromise = undefined;
    throw error;
  });
  return bankPromise;
}

game.events.on('title:start', async (options?: NewGameOptions, slot: SlotId = 1) => {
  try {
    showLoading('もんだいを よみこんでいるよ…');
    await Promise.all([ensureGameplayScenes(game), ensureQuestionBank()]);
    activeSlot = slot;
    const next = createNewGame(options ?? { ...DEV_NEW_GAME, grade });
    setSfxVolume(next.settings.seVolume);
    game.registry.set('game', next);
    void save(activeSlot, next).catch((error) => console.error('[save] はじめのセーブに失敗しました', error));
    hideLoading();
    game.scene.stop('Title');
    game.scene.start('Overworld', { mapKey: 'aomori-field', spawnName: 'spawn', debugBattle });
  } catch (error) {
    game.events.emit('boot:error', error);
  }
});

game.events.on('title:continue', async (slot: SlotId = 1) => {
  try {
    showLoading('セーブと もんだいを よみこんでいるよ…');
    const [saved] = await Promise.all([load(slot), ensureGameplayScenes(game), ensureQuestionBank()]);
    if (!saved) {
      hideLoading();
      return;
    }
    activeSlot = slot;
    setSfxVolume(saved.settings.seVolume);
    game.registry.set('game', saved);
    hideLoading();
    game.scene.stop('Title');
    game.scene.start('Overworld', { mapKey: saved.progress.currentMap, spawnName: 'spawn' });
  } catch (error) {
    console.error('[save] ロードに失敗しました', error);
    game.events.emit('boot:error', error);
  }
});

// GameState が更新されるたび、選択中のスロットへ自動保存する。
game.registry.events.on('changedata-game', (_parent: unknown, value: unknown) => {
  const state = value as Parameters<typeof save>[1];
  setSfxVolume(state.settings.seVolume);
  void save(activeSlot, state).catch((error) => console.error('[save] オートセーブに失敗しました', error));
});

// 問題への解答は戦闘・イベントの完了を待たず、その場で保存する。
// タブ終了や例外が直後に起きても、学習履歴を失わないための専用経路。
window.addEventListener('nq:learning-changed', (event) => {
  const state = (event as CustomEvent<Parameters<typeof save>[1]>).detail;
  void save(activeSlot, state).catch((error) => console.error('[save] 学習履歴の保存に失敗しました', error));
});

// 表示中のプレイ時間を1分単位で日別に記録する。
setInterval(() => {
  if (document.visibilityState !== 'visible') return;
  const current = game.registry.get('game') as Parameters<typeof save>[1] | undefined;
  if (!current) return;
  const date = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  game.registry.set('game', {
    ...current,
    learning: {
      ...current.learning,
      playSecondsByDate: {
        ...current.learning.playSecondsByDate,
        [date]: (current.learning.playSecondsByDate[date] ?? 0) + 60,
      },
    },
  });
}, 60_000);

// 開発中だけ、ブラウザのコンソールや E2E からゲームの中を見られるようにする（本番ビルドには入らない）
if (import.meta.env.DEV) (window as unknown as { __nq?: Phaser.Game }).__nq = game;

export { game };
