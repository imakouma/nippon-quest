/**
 * タイトル画面（RPG のタイトルらしく）。
 *  - 背景：夜明けの海に、地方ごとに分かれた島々と富士山。手前のがけで主人公（うしろ姿）が海を見ている
 *  - 星がまたたき、雲が流れ、桜の花びらが舞う。ロゴは上から落ちてきて光る
 *  - メニューは DOM の黒い窓（はじめから／つづきから）。♥ カーソル
 * 絵は 1 ドット = 4px（背景 240×135 を ×4）、ロゴは 1 ドット = 8px。文字は PixelMplus12（12 の倍数の大きさ）。
 */
import Phaser from 'phaser';
import { h, render } from 'preact';
import { createRng } from '../core/rng';
import { SLOTS, summaries, type SlotId, type SlotSummary } from '../core/state/save';
import type { GameState } from '../core/state/schema';
import { PIXEL_FONT, PIXEL_FONT_NAME } from '../ui/fonts';
import { t } from '../ui/i18n';
import { STAGE_W } from '../ui/overlay';
import { TitleMenu } from '../ui/title/TitleMenu';
import { NewGameSetup } from '../ui/title/NewGameSetup';
import { SaveSlotSelect } from '../ui/title/SaveSlotSelect';
import type { NewGameOptions } from '../core/state/newGame';
import { HERO_H, HERO_W, heroKey, heroLook, walkFrame, walkSheet } from '../rendering/characters';
import { NQ } from '../rendering/palette';
import { addImage, addSheet } from '../rendering/sheet';
import {
  CLIFF_TOP,
  HERO_SPOT,
  HORIZON,
  SAKURA,
  SUN_X,
  cloudArt,
  ornamentArt,
  pixelsArt,
  textLogo,
  titleBackdrop,
} from '../rendering/title/titleArt';

const S = 4;
const LOGO_SCALE = 8;
const LOGO_Y = 124;

export class TitleScene extends Phaser.Scene {
  private menuRoot: HTMLDivElement | null = null;
  private starting = false;
  private saveChecked = false;
  private hasSave = false;
  private slots: SlotSummary[] = SLOTS.map((slot) => ({ slot, exists: false }));
  private selectedSlot: SlotId = 1;
  private menuView: 'main' | 'slots' | 'setup' = 'main';

  constructor() {
    super('Title');
  }

  create(): void {
    this.starting = false;
    addImage(this.textures, 'title.bg', titleBackdrop());
    this.add.image(0, 0, 'title.bg').setOrigin(0).setScale(S).setDepth(0);
    this.addStars();
    this.addClouds();
    this.addSparkles();
    this.addHero();
    this.addPetals();
    this.addLogo();
    this.mountMenu();
    void this.checkSave();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unmountMenu());
    this.cameras.main.fadeIn(700, 0, 0, 0);

    // ?debug=battle のときはタイトルを飛ばす（main.ts 参照）
    if (new URLSearchParams(location.search).get('debug') === 'battle')
      this.time.delayedCall(50, () => this.game.events.emit('title:start'));
  }

  /** 夜空の星（1 ドットと十字の 2 種類）。ゆっくり またたく */
  private addStars(): void {
    addImage(this.textures, 'title.star', pixelsArt(['#'], NQ.white));
    addImage(this.textures, 'title.star2', pixelsArt(['.#.', '###', '.#.'], NQ.cream));
    const rng = createRng('title-stars');
    for (let i = 0; i < 30; i++) {
      const big = i % 6 === 0;
      const star = this.add
        .image(rng.int(2, 237) * S, rng.int(2, 30) * S, big ? 'title.star2' : 'title.star')
        .setScale(S)
        .setDepth(1)
        .setAlpha(0.5 + rng.next() * 0.5);
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: 500 + rng.int(0, 900),
        delay: rng.int(0, 1600),
        yoyo: true,
        repeat: -1,
        ease: 'Stepped',
        easeParams: [2],
      });
    }
  }

  /** 夜明けの雲が、右から左へゆっくり流れる */
  private addClouds(): void {
    const defs: [number, number, number][] = [
      [60, 16, 90_000],
      [40, 26, 70_000],
      [28, 46, 55_000],
    ];
    defs.forEach(([w, y, ms], i) => {
      const key = `title.cloud.${w}`;
      addImage(this.textures, key, cloudArt(w));
      const half = (w * S) / 2;
      const img = this.add
        .image(STAGE_W + half, y * S, key)
        .setScale(S)
        .setDepth(2);
      const tw = this.tweens.add({ targets: img, x: -half, duration: ms, repeat: -1 });
      tw.seek(ms * (0.25 + i * 0.3));
    });
  }

  /** 海にうつる朝日のきらめき */
  private addSparkles(): void {
    addImage(this.textures, 'title.spark', pixelsArt(['###'], NQ.cream));
    const rng = createRng('title-sparks');
    for (let i = 0; i < 16; i++) {
      const nearSun = i < 10;
      const x = nearSun ? SUN_X + rng.int(-9, 9) : rng.int(100, 236);
      const sp = this.add
        .image(x * S, rng.int(HORIZON + 3, 130) * S, 'title.spark')
        .setScale(S)
        .setDepth(1)
        .setAlpha(0);
      this.tweens.add({
        targets: sp,
        alpha: nearSun ? 1 : 0.6,
        duration: 300 + rng.int(0, 500),
        delay: rng.int(0, 2000),
        yoyo: true,
        repeat: -1,
        repeatDelay: rng.int(200, 1400),
        ease: 'Stepped',
        easeParams: [2],
      });
    }
  }

  /** がけの上で海を見ている主人公（うしろ姿） */
  private addHero(): void {
    const player = (this.registry.get('game') as GameState | undefined)?.player;
    const ap = player?.appearance ?? { hair: 0, skin: 0, cloth: 0 };
    const eq = player?.equipment ?? {};
    const key = heroKey(ap, eq);
    addSheet(this.textures, key, walkSheet(heroLook(ap, eq), true), HERO_W, HERO_H);
    const y = CLIFF_TOP * S + S;
    const hero = this.add
      .image(HERO_SPOT * S, y, key, walkFrame('up', 1))
      .setOrigin(0.5, 1)
      .setScale(S)
      .setDepth(5);
    this.tweens.add({
      targets: hero,
      y: y - S,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Stepped',
      easeParams: [1],
    });
  }

  /** 桜の花びらが、海の方へ舞っていく */
  private addPetals(): void {
    addImage(this.textures, 'title.petal', pixelsArt(['##'], NQ.white));
    this.add
      .particles(0, 0, 'title.petal', {
        x: { min: SAKURA.x0 * S, max: SAKURA.x1 * S },
        y: { min: SAKURA.y0 * S, max: SAKURA.y1 * S },
        speedX: { min: 14, max: 42 },
        speedY: { min: 6, max: 22 },
        gravityY: 3,
        lifespan: 9000,
        frequency: 260,
        scale: S,
        alpha: { start: 1, end: 0.2 },
        tint: [0xff8fb1, 0xff8fb1, 0xffffff],
      })
      .setDepth(6);
  }

  /** ロゴ：上から落ちてきて、ぴかっと光ってから ふわふわ */
  private addLogo(): void {
    addImage(
      this.textures,
      'title.logo',
      textLogo(t('title'), PIXEL_FONT_NAME, [NQ.cream, NQ.gold, NQ.orange], NQ.brick),
    );
    addImage(
      this.textures,
      'title.logo.en',
      textLogo('NIHON QUEST', PIXEL_FONT_NAME, [NQ.white, NQ.cloud], NQ.indigo),
    );
    addImage(this.textures, 'title.orn', ornamentArt());
    const cx = STAGE_W / 2;
    const en = this.add.image(cx, 40, 'title.logo.en').setScale(S).setDepth(20).setAlpha(0);
    const logo = this.add.image(cx, -90, 'title.logo').setScale(LOGO_SCALE).setDepth(21);
    const orn = this.add.image(cx, 196, 'title.orn').setScale(S).setDepth(20).setAlpha(0);
    const tag = this.add
      .text(cx, 232, t('ui.tagline'), {
        fontFamily: PIXEL_FONT,
        fontSize: '24px',
        color: NQ.cream,
        stroke: NQ.ink,
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setAlpha(0);
    this.tweens.add({
      targets: logo,
      y: LOGO_Y,
      duration: 900,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        logo.setTintFill(0xffffff);
        this.time.delayedCall(90, () => logo.clearTint());
        this.tweens.add({
          targets: logo,
          y: LOGO_Y - S,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Stepped',
          easeParams: [1],
        });
      },
    });
    this.tweens.add({
      targets: [en, orn, tag],
      alpha: 1,
      delay: 700,
      duration: 400,
      ease: 'Stepped',
      easeParams: [4],
    });
  }

  private mountMenu(): void {
    this.menuView = 'main';
    const layer = document.getElementById('ui-layer');
    if (!layer) return;
    if (!this.menuRoot) {
      this.menuRoot = document.createElement('div');
      this.menuRoot.className = 'nq-root-title';
      layer.appendChild(this.menuRoot);
    }
    render(
      h(TitleMenu, {
        items: [{ label: t('ui.newGame') }, { label: t('ui.continue'), disabled: !this.hasSave }],
        hint: t('ui.titleHint'),
        disabledNote: t(this.saveChecked ? 'ui.noSave' : 'ui.saveChecking'),
        credit: t('ui.credits'),
        onSelect: (index: number) => {
          if (index === 0) this.mountSlotPicker('new');
          if (index === 1 && this.hasSave) this.mountSlotPicker('continue');
        },
      }),
      this.menuRoot,
    );
  }

  private async checkSave(): Promise<void> {
    try {
      this.slots = await summaries();
      this.hasSave = this.slots.some((slot) => slot.exists);
    } catch (error) {
      console.error('[title] セーブデータを確認できません', error);
      this.hasSave = false;
    }
    this.saveChecked = true;
    // セーブ確認が遅れて完了しても、ユーザーが開いたスロット選択や設定画面を上書きしない。
    if (this.scene.isActive() && !this.starting && this.menuView === 'main') this.mountMenu();
  }

  private continueGame(slot: SlotId): void {
    // UI 側の disabled だけに任せず、セーブのないスロットからは続行しない。
    // 非同期のセーブ確認中や、古い UI イベントが残った場合にも新規ゲーム扱いで
    // 読み込み処理へ進ませないための最後のガード。
    if (this.starting || !this.slots.some((summary) => summary.slot === slot && summary.exists)) return;
    this.starting = true;
    this.game.events.emit('title:continue', slot);
  }

  private mountSlotPicker(mode: 'new' | 'continue'): void {
    if (!this.menuRoot) return;
    if (mode === 'continue' && !this.hasSave) {
      this.mountMenu();
      return;
    }
    this.menuView = 'slots';
    render(
      h(SaveSlotSelect, {
        mode,
        slots: this.slots,
        onCancel: () => this.mountMenu(),
        onPick: (slot: SlotId) => {
          this.selectedSlot = slot;
          if (mode === 'new') this.mountSetup();
          else this.continueGame(slot);
        },
      }),
      this.menuRoot,
    );
  }

  private mountSetup(): void {
    if (!this.menuRoot) return;
    this.menuView = 'setup';
    render(
      h(NewGameSetup, {
        onCancel: () => this.mountMenu(),
        onStart: (options: NewGameOptions) => this.start(options),
      }),
      this.menuRoot,
    );
  }

  private unmountMenu(): void {
    if (!this.menuRoot) return;
    render(null, this.menuRoot);
    this.menuRoot.remove();
    this.menuRoot = null;
  }

  /** はじめから：白く光って暗転してから、フィールドへ */
  private start(options?: NewGameOptions): void {
    if (this.starting) return;
    this.starting = true;
    const cam = this.cameras.main;
    this.time.delayedCall(350, () => cam.flash(200, 255, 255, 255));
    this.time.delayedCall(550, () => cam.fadeOut(450, 0, 0, 0));
    // タブが うしろに あると Phaser の タイマーが 止まり、いつまでも はじまらない。
    // window の タイマー（タブが うしろでも 動く）でも すすめる
    let started = false;
    const go = () => {
      if (started) return;
      started = true;
      this.game.events.emit('title:start', options, this.selectedSlot);
    };
    this.time.delayedCall(1050, go);
    window.setTimeout(go, 1400);
  }
}
