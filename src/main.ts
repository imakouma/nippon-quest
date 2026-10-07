import Phaser from 'phaser';
import './questions/renderers/shared/questions.css';
import { BootScene } from './scenes/entries/boot';
import { TitleScene } from './scenes/entries/title';
import { ensureGameplayScenes } from './scenes/gameplayLoader';
import { attachOverlay, STAGE_H, STAGE_W } from './ui/overlay';
import { createNewGame, type NewGameOptions } from './core/state/newGame';
import {
  clearStaleChunkReloadChance,
  load,
  save,
  storeStartupRetryAction,
  takeStaleChunkReloadChance,
  takeStartupRetryAction,
  type SlotId,
} from './core/state/save';
import { AutosaveCoordinator } from './core/state/autosave';
import { GROUNDS } from './core/world/ground';
import { setSfxVolume } from './ui/sfx';
import { bundledFetchReader } from './core/content/loader';
import { QuestionBank } from './questions/engine/bank';

/** デバッグ起動で初期設定画面を通らない場合の既定値。 */
const DEV_NEW_GAME = { name: 'ハル', grade: 1 } as const;
const PLAY_DATE_FORMATTER = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

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
type RetryAction =
  { type: 'start'; options?: NewGameOptions; slot: SlotId } | { type: 'continue'; slot: SlotId };

function reloadForRetry(action: RetryAction): void {
  storeStartupRetryAction(action);
  location.reload();
}

/** 再ビルドで古いハッシュ付き JS が消えた場合だけ、一度だけ最新版へ自動更新する。 */
function reloadStaleChunkOnce(error: unknown, retry: () => void): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const staleChunk =
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /ChunkLoadError/i.test(message);
  if (!staleChunk) return false;
  if (!takeStaleChunkReloadChance()) return false;
  retry();
  return true;
}

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

let errorBox: HTMLElement | null = null;

function clearError(): void {
  errorBox?.remove();
  errorBox = null;
}

function showError(error: unknown, retry: () => void): void {
  hideLoading();
  clearError();
  const box = document.createElement('section');
  box.className = 'nq-error';
  const message = document.createElement('p');
  message.textContent = `よみこみに しっぱいしました。\n\n${error instanceof Error ? error.message : String(error)}\n\nつうしんを たしかめて、もういちど おしてね。`;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nq-btn nq-error-retry';
  button.textContent = 'もういちど';
  button.addEventListener('click', () => {
    clearError();
    retry();
  });
  box.append(message, button);
  errorBox = box;
  uiLayer.append(box);
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
game.events.on('boot:done', () => {
  hideLoading();
  try {
    const action = takeStartupRetryAction() as RetryAction | undefined;
    if (!action) return;
    // BootScene がこのイベントの直後に TitleScene を開始するため、次のタスクで再開する。
    setTimeout(() => {
      if (action.type === 'start') game.events.emit('title:start', action.options, action.slot);
      else if (action.type === 'continue') game.events.emit('title:continue', action.slot);
    });
  } catch (error) {
    console.warn('[startup] 再試行情報を復元できませんでした', error);
  }
});
game.events.on('boot:error', (e: unknown) => {
  showError(e, () => location.reload());
});
let activeSlot: SlotId = 1;
const autosave = new AutosaveCoordinator(save);
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
    if (report.omitted)
      console.warn(`[questions] 表示材料が足りない旧問題を ${report.omitted} 件 除外しました`);
    game.registry.set('bank', bank);
    return bank;
  })().catch((error) => {
    bankPromise = undefined;
    throw error;
  });
  return bankPromise;
}

let titleAction: Promise<void> | null = null;

function runTitleAction(label: string, action: () => Promise<void>, retry: () => void): void {
  if (titleAction) return;
  clearError();
  showLoading(label);
  titleAction = action()
    .then(clearStaleChunkReloadChance)
    .catch((error) => {
      if (!reloadStaleChunkOnce(error, retry)) showError(error, retry);
    })
    .finally(() => {
      titleAction = null;
    });
}

game.events.on('title:start', async (options?: NewGameOptions, slot: SlotId = 1) => {
  const retry = () => reloadForRetry({ type: 'start', options, slot });
  runTitleAction(
    'もんだいを よみこんでいるよ…',
    async () => {
      await Promise.all([ensureGameplayScenes(game), ensureQuestionBank()]);
      activeSlot = slot;
      const next = createNewGame(options ?? { ...DEV_NEW_GAME, grade });
      setSfxVolume(next.settings.seVolume);
      game.registry.set('game', next);
      void autosave
        .request(activeSlot, next)
        .catch((error) => console.error('[save] はじめのセーブに失敗しました', error));
      hideLoading();
      game.scene.stop('Title');
      game.scene.start('Overworld', {
        mapKey: next.progress.currentMap,
        spawnName: 'spawn',
        debugBattle,
      });
    },
    retry,
  );
});

game.events.on('title:continue', async (slot: SlotId = 1) => {
  const retry = () => reloadForRetry({ type: 'continue', slot });
  runTitleAction(
    'セーブと もんだいを よみこんでいるよ…',
    async () => {
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
    },
    retry,
  );
});

// GameState が更新されるたび、選択中のスロットへ自動保存する。
game.registry.events.on('changedata-game', (_parent: unknown, value: unknown) => {
  const state = value as Parameters<typeof save>[1];
  setSfxVolume(state.settings.seVolume);
  void autosave
    .request(activeSlot, state)
    .catch((error) => console.error('[save] オートセーブに失敗しました', error));
});

// 問題への解答は戦闘・イベントの完了を待たず、その場で保存する。
// タブ終了や例外が直後に起きても、学習履歴を失わないための専用経路。
window.addEventListener('nq:learning-changed', (event) => {
  const state = (event as CustomEvent<Parameters<typeof save>[1]>).detail;
  void autosave
    .request(activeSlot, state)
    .catch((error) => console.error('[save] 学習履歴の保存に失敗しました', error));
});

// 表示中のプレイ時間を1分単位で日別に記録する。
setInterval(() => {
  if (document.visibilityState !== 'visible') return;
  const current = game.registry.get('game') as Parameters<typeof save>[1] | undefined;
  if (!current) return;
  const date = PLAY_DATE_FORMATTER.format(new Date());
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
