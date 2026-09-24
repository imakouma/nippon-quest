import Phaser from 'phaser';
import { loadContent, fetchReader, type ContentIndex } from '../core/content/loader';
import { QuestionBank } from '../questions/engine/bank';
import { PIXEL_FONT_NAME } from '../ui/fonts';
import type { GameState } from '../core/state/schema';
import { setDictionary, type I18nDict } from '../ui/i18n';
import { kanjiGradeTable, setKanjiLevel, type KanjiGradeTable } from '../ui/ruby';

/** ドットフォント（PixelMplus12）を先に読んでおく。Canvas の文字が代替フォントで描かれないように */
async function waitForFont(): Promise<void> {
  const fonts = document.fonts;
  if (!fonts) return;
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3000));
  const load = Promise.all(
    ['12px', '24px'].map((size) => fonts.load(`${size} "${PIXEL_FONT_NAME}"`, 'ニホンクエスト あア漢')),
  );
  await Promise.race([load, timeout]).catch(() => undefined);
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
    const read = fetchReader(`${base}/content`);
    try {
      const [content, dict, grades, proper]: [ContentIndex, unknown, unknown, unknown] = await Promise.all([
        loadContent(read),
        read('i18n/ja.json'),
        read('i18n/kanji-grades.json'),
        read('i18n/proper-nouns.json'),
      ]);
      setDictionary(dict as I18nDict);
      this.watchKanjiLevel(
        kanjiGradeTable((grades as { byGrade: Record<string, string> }).byGrade),
        new Set((proper as { names: string[] }).names),
      );
      const { bank, report } = await QuestionBank.load(content.questionFiles, read);
      if (report.skipped.length) console.warn('[questions] 読み込めなかった問題:', report.skipped);
      this.registry.set('content', content);
      this.registry.set('bank', bank);
      await waitForFont();
      this.game.events.emit('boot:done', { areas: content.areas.size, questions: bank.size });
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
