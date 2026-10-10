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
  type StartupRetryAction,
} from './core/state/save';
import { AutosaveCoordinator } from './core/state/autosave';
import { GROUNDS } from './core/world/ground';
import { setSfxVolume } from './ui/sfx';
import { bundledFetchReader } from './core/content/loader';
import { QuestionBank } from './questions/engine/bank';
import { isLocalDevelopmentUrl } from './core/localDevelopment';
import { setDictionary, t } from './ui/i18n';
import { recordPlayDuration } from './core/state/playTime';
import bootstrapJapanese from '../content/i18n/bootstrap-ja.json';

// 通常辞書を読み込めない起動失敗でも、再試行画面だけは日本語で表示する。
setDictionary(bootstrapJapanese);

/** デバッグ起動で初期設定画面を通らない場合の既定値。 */
const DEV_NEW_GAME = { name: 'ハル', grade: 1 } as const;
const TILE_SIZE = 16;
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
        forceRecruitOffer: params.get('recruit') === '1',
      }
    : null;

const gameRoot = document.getElementById('game-root')!;
const uiLayer = document.getElementById('ui-layer')!;
function reloadForRetry(action: StartupRetryAction): void {
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

function showOrientationNotice(): void {
  const notice = document.createElement('aside');
  notice.id = 'nq-orientation-notice';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-label', t('ui.turnScreen'));

  const icon = document.createElement('span');
  icon.className = 'nq-orientation-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '↻ ▭';

  const message = document.createElement('p');
  message.textContent = t('ui.turnScreen');
  notice.append(icon, message);
  document.body.append(notice);
}

let errorBox: HTMLElement | null = null;

function clearError(): void {
  errorBox?.remove();
  errorBox = null;
}

function showError(messageText: string, retry: () => void): void {
  hideLoading();
  clearError();
  const box = document.createElement('section');
  box.className = 'nq-error';
  const message = document.createElement('p');
  message.textContent = messageText;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nq-btn nq-error-retry';
  button.textContent = t('ui.retry');
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
  showOrientationNotice();
  try {
    const action = takeStartupRetryAction();
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
  console.error('[boot] よみこみに失敗しました', e);
  showError(t('ui.loadError'), () => location.reload());
});
let activeSlot: SlotId = 1;
const autosave = new AutosaveCoordinator(save);
function reportSaveFailure(
  context: string,
  error: unknown,
  slot: SlotId,
  state: Parameters<typeof save>[1],
): void {
  console.error(`[save] ${context}に失敗しました`, error);
  showError(t('ui.saveError'), () => {
    void autosave
      .request(slot, state)
      .catch((nextError) => reportSaveFailure(context, nextError, slot, state));
  });
}
let bankPromise: { grade: NewGameOptions['grade']; promise: Promise<QuestionBank> } | undefined;
function ensureQuestionBank(grade: NewGameOptions['grade']): Promise<QuestionBank> {
  const loadedGrade = game.registry.get('bankGrade') as NewGameOptions['grade'] | undefined;
  if (loadedGrade === grade && game.registry.get('bank'))
    return Promise.resolve(game.registry.get('bank') as QuestionBank);
  if (bankPromise?.grade === grade) return bankPromise.promise;
  const promise = (async () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const read = bundledFetchReader(`${base}/content`, `questions-g${grade}-bundle.json`);
    const filesByGrade = game.registry.get('questionFilesByGrade') as Record<string, string[]>;
    const files = filesByGrade[String(grade)] ?? [];
    const { bank, report } = await QuestionBank.load(files, read);
    if (report.skipped.length) console.warn('[questions] 読み込めなかった問題:', report.skipped);
    if (report.omitted)
      console.warn(`[questions] 表示材料が足りない旧問題を ${report.omitted} 件 除外しました`);
    game.registry.set('bank', bank);
    game.registry.set('bankGrade', grade);
    return bank;
  })();
  bankPromise = { grade, promise };
  return promise.catch((error) => {
    if (bankPromise?.promise === promise) bankPromise = undefined;
    throw error;
  });
}

let titleAction: Promise<void> | null = null;

function runTitleAction(label: string, action: () => Promise<void>, retry: () => void): void {
  if (titleAction) return;
  clearError();
  showLoading(label);
  titleAction = action()
    .then(clearStaleChunkReloadChance)
    .catch((error) => {
      if (!reloadStaleChunkOnce(error, retry)) {
        console.error(`[startup] ${label}で失敗しました`, error);
        showError(t('ui.loadError'), retry);
      }
    })
    .finally(() => {
      titleAction = null;
    });
}

game.events.on('title:start', async (options?: NewGameOptions, slot: SlotId = 1) => {
  const selectedOptions = options ?? { ...DEV_NEW_GAME, grade };
  const retry = () => reloadForRetry({ type: 'start', options: selectedOptions, slot });
  runTitleAction(
    'もんだいを よみこんでいるよ…',
    async () => {
      await Promise.all([ensureGameplayScenes(game), ensureQuestionBank(selectedOptions.grade)]);
      activeSlot = slot;
      const next = createNewGame(selectedOptions);
      setSfxVolume(next.settings.seVolume);
      game.registry.set('game', next);
      void autosave
        .request(activeSlot, next)
        .catch((error) => reportSaveFailure('はじめのセーブ', error, activeSlot, next));
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
      const saved = await load(slot);
      if (!saved) {
        hideLoading();
        return;
      }
      await Promise.all([ensureGameplayScenes(game), ensureQuestionBank(saved.learning.grade)]);
      activeSlot = slot;
      setSfxVolume(saved.settings.seVolume);
      game.registry.set('game', saved);
      hideLoading();
      game.scene.stop('Title');
      game.scene.start('Overworld', {
        mapKey: saved.progress.currentMap,
        spawnName: 'spawn',
        spawnTile: [
          Math.floor(saved.progress.position.x / TILE_SIZE),
          Math.floor(saved.progress.position.y / TILE_SIZE),
        ],
        exactSpawn: true,
      });
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
    .catch((error) => reportSaveFailure('オートセーブ', error, activeSlot, state));
});

// 問題への解答は戦闘・イベントの完了を待たず、その場で保存する。
// タブ終了や例外が直後に起きても、学習履歴を失わないための専用経路。
window.addEventListener('nq:learning-changed', (event) => {
  const state = (event as CustomEvent<Parameters<typeof save>[1]>).detail;
  void autosave
    .request(activeSlot, state)
    .catch((error) => reportSaveFailure('学習履歴の保存', error, activeSlot, state));
});

// 実際に表示していた時間を日別に記録する。非表示中の時間は数えない。
let visiblePlayStartedAt: number | null = null;
game.registry.events.on('setdata', (_parent: unknown, key: string) => {
  if (key === 'game' && document.visibilityState === 'visible') visiblePlayStartedAt ??= Date.now();
});
const flushVisiblePlayTime = () => {
  if (visiblePlayStartedAt === null) return;
  const now = Date.now();
  const seconds = Math.floor((now - visiblePlayStartedAt) / 1_000);
  if (seconds <= 0) return;
  visiblePlayStartedAt += seconds * 1_000;
  const current = game.registry.get('game') as Parameters<typeof save>[1] | undefined;
  if (!current) return;
  const date = PLAY_DATE_FORMATTER.format(new Date(now));
  game.registry.set('game', recordPlayDuration(current, date, seconds, now));
};
setInterval(flushVisiblePlayTime, 60_000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') visiblePlayStartedAt = Date.now();
  else {
    flushVisiblePlayTime();
    visiblePlayStartedAt = null;
  }
});

// 開発サーバーとローカル preview だけ、コンソールや E2E からゲーム内部を確認できるようにする。
// 公開サイトでは本番ビルドかどうかにかかわらず露出させない。
if (isLocalDevelopmentUrl(new URL(location.href), import.meta.env.DEV)) {
  (window as unknown as { __nq?: Phaser.Game }).__nq = game;
}

export { game };
