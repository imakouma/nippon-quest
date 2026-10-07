import Phaser from 'phaser';
import { loadContent, bundledFetchReader, fetchReader, type ContentIndex } from '../core/content/loader';
import { PIXEL_FONT_NAME } from '../ui/fonts';
import type { GameState } from '../core/state/schema';
import { setDictionary, type I18nDict } from '../ui/i18n';
import { kanjiGradeTable, setKanjiLevel, type KanjiGradeTable } from '../ui/ruby';
import { setAssetCatalog, type AssetCatalog } from '../rendering/assetCatalog';
import { preloadMenuArt } from '../rendering/preloadMenuArt';

/** ドットフォント（PixelMplus12）を先に読んでおく。Canvas の文字が代替フォントで描かれないように */
async function waitForFont(): Promise<void> {
  const fonts = document.fonts;
  if (!fonts) return;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timeoutId = setTimeout(resolve, 3000);
  });
  const load = Promise.all(
    ['12px', '24px'].map((size) => fonts.load(`${size} "${PIXEL_FONT_NAME}"`, 'ニホンクエスト あア漢')),
  );
  try {
    await Promise.race([load, timeout]);
  } catch {
    // フォント非対応・読み込み失敗時はブラウザの代替フォントで続行する。
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

/** アセット・コンテンツの読み込み。進捗は DOM 側に出す */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    // 画像はまだプレースホルダ。Step 4 以降で本物のアトラス／タイルセットを読み込む
    this.load.on('progress', (v: number) => this.game.events.emit('boot:progress', v));
    this.load.setBaseURL(base);
  }

  async create(): Promise<void> {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    // Dev keeps reading the source JSON files so edits appear after a reload.
    // Production uses the generated bundle to avoid roughly 1,000 HTTP requests.
    const read = import.meta.env.DEV ? fetchReader(`${base}/content`) : bundledFetchReader(`${base}/content`);
    try {
      const [content, dict, grades, proper, assets]: [ContentIndex, unknown, unknown, unknown, AssetCatalog] =
        await Promise.all([
          loadContent(read),
          read('i18n/ja.json'),
          read('i18n/kanji-grades.json'),
          read('i18n/proper-nouns.json'),
          fetch(`${base}/assets/catalog.json`, { cache: 'no-cache' })
            .then(async (response) => (response.ok ? ((await response.json()) as AssetCatalog) : {}))
            .catch(() => ({})),
        ]);
      setAssetCatalog(assets, base);
      setDictionary(dict as I18nDict);
      this.watchKanjiLevel(
        kanjiGradeTable((grades as { byGrade: Record<string, string> }).byGrade),
        new Set((proper as { names: string[] }).names),
      );
      this.registry.set('content', content);
      this.registry.set('questionFiles', content.questionFiles);
      this.game.events.emit('boot:stage', 'ずかんを よみこんでいるよ…');
      await preloadMenuArt(content, (progress) =>
        this.game.events.emit('boot:progress', 0.88 + progress * 0.1),
      );
      this.game.events.emit('boot:stage', 'もうすぐ はじまるよ…');
      await waitForFont();
      this.game.events.emit('boot:progress', 1);
      this.game.events.emit('boot:done', { areas: content.areas.size });
      this.scene.start('Title');
    } catch (e) {
      this.game.events.emit('boot:error', e);
    }
  }

  /**
   * 漢字表示レベル（GameState の learning.kanjiLevel）に合わせて、まだ習っていない漢字の ことばを
   * ひらがなで出す（src/ui/ruby.ts）。GameState が入れかわるたびに合わせなおす
   */
  private watchKanjiLevel(table: KanjiGradeTable, names: ReadonlySet<string>): void {
    const apply = () => {
      const gs = this.registry.get('game') as GameState | undefined;
      setKanjiLevel(gs ? { grade: gs.learning.kanjiLevel, table, names } : null);
    };
    apply();
    this.registry.events.on('setdata', apply);
    this.registry.events.on('changedata-game', apply);
  }
}
