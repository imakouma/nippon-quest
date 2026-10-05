/**
 * バトル画面（GDD §4・§8 / docs/02 Step 6）。サイドビュー：敵が左、主人公と相棒が右（SFC 風 RPG）。
 * ターン制バトル：
 *  - 1 ターンに 主人公 → オトモ（前に 立つ 仲間）→ てき が 1 回ずつ 動く。時間では すすまない
 *  - 主人公が コマンドを えらぶ → core の act() が 1 ターンぶんを 解決 → 返ってきた BattleEvent[] を 順に 再生
 *  - コマンドが 成立しない とき（教科ゲージが たりない など）は ターンが すすまず、えらび直せる
 *  - 主人公が たおれて いる ターンは えらべないので、wait で オトモ → てき だけ すすめる
 *  - 絵と演出（背景・スプライト・揺れ・パーティクル・カメラ）は Phaser、文字・コマンド・問題は DOM オーバーレイ（BattleHud）
 *  - 計算は src/core/battle の act() に任せる（シーンは 演出だけ）
 *  - わざ → ask() → QuestionResult.score だけを Command に渡す（問題タイプは知らない。かかった 時間は シーンが はかる）
 * 1 ドット = 4px（背景 240×135 と同じ倍率）。人物 16×24、モンスター 32 / 40 / 48 / 56（docs/06）。
 * Overworld から `scene.launch('Battle', data)` で重ねて起動し、終わると 'battle:end' を投げて自分を止める。
 */
import Phaser from 'phaser';
import { h, render } from 'preact';
import type { ContentIndex } from '../core/content/loader';
import type { Element, Monster, Skill } from '../core/content/schemas';
import { comboBonus } from '../core/battle/damage';
import {
  act,
  battleSkills,
  createBattle,
  isHeroReady,
  type BattleDeps,
  type BattleSkill,
} from '../core/battle/engine';
import { makeMonster } from '../core/battle/factory';
import { partyFromGameState } from '../core/battle/setup';
import type { ActionResult, BattleEvent, BattleState, Command } from '../core/battle/types';
import { applyBattleResult, type AppliedBattle } from '../core/progression/battleResult';
import { evolutionStage } from '../core/progression/bag';
import { settleBattleBag } from '../core/progression/battleSettlement';
import { specialtyIndex, withSpecialtyDrops } from '../core/progression/specialty';
import { createRng, freshSeed } from '../core/rng';
import type { GameState } from '../core/state/schema';
import { scoreBand, type QuestionQuery } from '../questions/contracts';
import { filterCandidates, MasteryStore, type QuestionBank } from '../questions/engine';
import { BattleHud } from '../ui/battle/BattleHud';
import {
  HudStore,
  type AllyView,
  type BannerKind,
  type CommandOption,
  type EnemyView,
  type ItemOption,
  type PopupView,
  type SkillOption,
  type StripPopView,
  type SubjectGaugeView,
  type SwapOption,
  type UiAction,
} from '../ui/battle/store';
import { t, tOpt } from '../ui/i18n';
import { createSpeaker } from '../ui/overlay';
import { displayText } from '../ui/ruby';
import { isSfxMuted, playSfx, setSfxMuted, setSfxVolume } from '../ui/sfx';
import { BATTLE_POSE, battleSheet, HERO_H, HERO_W, heroKey, heroLook } from '../rendering/characters';
import { itemIconGrid, itemIconUrl } from '../rendering/itemIcons';
import { designedMonsterArt } from '../rendering/monsters';
import { addImage, addSheet } from '../rendering/sheet';
import { Motions, type EnemyStyle, type MotifFx, type SwingKind } from './battle/motions';
import { toCanvas } from '../rendering/grid';
import { motifArtGrid } from '../rendering/motifArt';
import { skillLook } from '../rendering/battle/skillLook';
import { narrate, normalizeEvents, type NarrateCtx } from './battle/narrate';
import {
  BACKDROP_SCALE,
  ELEMENT_FX,
  MONSTER_SIZE,
  backdropArt,
  monsterArt,
  particleArt,
  shadowArt,
  slashSheet,
  type BackdropKind,
} from '../rendering/battle/pixelArt';
import {
  buildAllyViews,
  buildCommandOptions,
  buildEnemyView,
  buildGaugeViews,
  buildItemOptions,
  buildSkillOptions,
  buildSwapOptions,
} from './battle/hudViews';
import type { BattleEndPayload, BattleSceneData } from './battle/contracts';
import { battleSummary, defeatResultView, victoryResultView } from './battle/resultView';
import { questionQueryForSkill, recruitQuestionQuery } from './battle/questionQueries';
import { runBattleQuestion } from './battle/questionFlow';

export type { BattleEndPayload, BattleSceneData } from './battle/contracts';

type Intent =
  | { kind: 'attack' }
  | { kind: 'flee' }
  | { kind: 'recruit' }
  | { kind: 'skill'; entry: BattleSkill }
  | { kind: 'item'; itemId: string }
  | { kind: 'swap'; index: number };

/** intro = 登場 / command = コマンドを えらぶ（時間が すすむ）/ question = 問題を とく（時間が すすむ）/ over = 決着 */
type Phase = 'intro' | 'command' | 'question' | 'over';

type MenuAction = Extract<UiAction, { t: 'command' | 'skill' | 'item' | 'swap' | 'back' }>;

type Sprite = Phaser.GameObjects.Image;

const S = BACKDROP_SCALE;
/** 足もとの位置（画面 px）。背景の道の帯（ドット 82〜97 → 328〜388px）の上に立つ */
const ENEMY_X = 250;
const ENEMY_Y = 380;
/** ボスの絵の高さの上限（足もと ENEMY_Y から上の窓の下 140px まで） */
const BOSS_MAX_H = ENEMY_Y - 140;
const HERO_X = 690;
const HERO_Y = 388;
const PAL_X = 820;
const PAL_Y = 356;
/** 動けるとき（コマンドゲージが たまって いる）、一歩前に出る */
const READY_STEP = 24;
/** 画面の外（味方が右から歩いて入ってくる／にげる） */
const OFF_RIGHT = 1080;

const BAND_TEXT = {
  perfect: 'battle.bandPerfect',
  good: 'battle.bandGood',
  weak: 'battle.bandWeak',
  miss: 'battle.bandMiss',
} as const;

/** セリフを先に出してから動く（「ハルの こうげき！」→ 走って斬る）イベント */
const TALK_FIRST = new Set<BattleEvent['t']>(['act', 'swap', 'recruitAttempt']);
/** たたかいの ようすの 文を 読む 時間 */
const LOG_BASE_MS = 350;
const LOG_CHAR_MS = 30;
const LOG_MAX_MS = 1300;

export class BattleScene extends Phaser.Scene {
  private content!: ContentIndex;
  private bank!: QuestionBank;
  private gs!: GameState;
  private deps!: BattleDeps;
  private state!: BattleState;
  private opts!: BattleSceneData;
  private mastery!: MasteryStore;
  private readonly speak = createSpeaker();
  private readonly qRng = createRng(freshSeed());

  // ↓ シーンのインスタンスは使い回されるので、1 戦ごとに init() で作り直す
  private hud = new HudStore();
  private hudRoot: HTMLDivElement | null = null;
  private msgId = 0;
  private bannerId = 0;
  private popupId = 0;
  private stripId = 0;
  private gainId = 0;
  private msgWaiters = new Map<number, () => void>();
  private actionWaiter: ((a: UiAction) => void) | null = null;
  private enemySprite!: Sprite;
  private heroSprite!: Sprite;
  private palSprite: Sprite | null = null;
  private enemySize: number = MONSTER_SIZE.normal;
  /** 敵の絵の倍率。ボス戦だけ一回り大きく（scaleOf） */
  private enemyScale: number = S;
  private enemyDef!: Monster;
  private shadows = new Map<Sprite, Phaser.GameObjects.Image>();
  private bobs = new Map<Sprite, Phaser.Tweens.Tween>();
  private perfectBySubject: Record<string, number> = {};
  private lastElement: Element = 'none';
  /** いまの 行動の モンスターの モチーフ（主人公の 行動は null）。ふつうの こうげきが 当たった ときに アイコンが とぶ */
  private lastMotif: MotifFx | null = null;
  /** 攻撃・必殺技などの 動き（battle/motions.ts） */
  private fx!: Motions;
  /** 動きを かわりばんこに するための 回数 */
  private swings = 0;
  private enemyAttacks = 0;
  /** 敵の さいごの こうげきの しかた（味方に 当たったときの しるしが かわる） */
  private lastEnemyStyle: EnemyStyle = 'claw';
  private victory: Extract<BattleEvent, { t: 'victory' }> | null = null;

  // ── ターンの 進行 ──
  private phase: Phase = 'intro';
  /** 再生を 待って いる・再生中の 演出の 数 */
  private playing = 0;
  private chain: Promise<void> = Promise.resolve();
  /** 主人公の 行動（問題・演出）を 実行中 */
  private busy = false;
  private overResolve: (() => void) | null = null;
  /** 問題を とじる（全滅したとき） */
  private abort: AbortController | null = null;
  /** 主人公が 一歩 前に 出て いるか（えらべる） */
  private stepped = false;
  private cmdCursor = 0;
  /** シーンが おわった あと（もう さわらない） */
  private stopped = false;
  /** 例外後の終了処理を一度だけ行う。 */
  private recovering = false;

  constructor() {
    super('Battle');
  }

  init(data: BattleSceneData): void {
    this.opts = data;
    this.hud = new HudStore();
    this.hudRoot = null;
    this.msgId = 0;
    this.bannerId = 0;
    this.popupId = 0;
    this.stripId = 0;
    this.gainId = 0;
    this.msgWaiters = new Map();
    this.actionWaiter = null;
    this.palSprite = null;
    this.shadows = new Map();
    this.bobs = new Map();
    this.perfectBySubject = {};
    this.lastElement = 'none';
    this.swings = 0;
    this.enemyAttacks = 0;
    this.lastEnemyStyle = 'claw';
    this.victory = null;
    this.phase = 'intro';
    this.playing = 0;
    this.chain = Promise.resolve();
    this.busy = false;
    this.overResolve = null;
    this.abort = null;
    this.stepped = false;
    this.cmdCursor = 0;
    this.stopped = false;
    this.recovering = false;
  }

  create(): void {
    this.content = this.registry.get('content') as ContentIndex;
    this.bank = this.registry.get('bank') as QuestionBank;
    this.gs = this.registry.get('game') as GameState;
    const def = this.content?.monsters.get(this.opts.enemyId);
    if (!def || !this.gs) {
      console.error('[battle] 敵かセーブデータが見つかりません', this.opts);
      this.scene.stop();
      this.game.events.emit('battle:end', { outcome: 'fled', goldLost: 0 } satisfies BattleEndPayload);
      return;
    }
    this.enemyDef = def;
    const c = this.content;
    this.deps = {
      settings: c.settings,
      elements: c.elements,
      skills: c.skills,
      items: c.items,
      // モンスターは その県の特産品も落とす（合わせて settings.specialtyDropRate の確率）
      monsters: withSpecialtyDrops(c.monsters, c.areas, c.items, c.settings.specialtyDropRate),
    };
    this.mastery = new MasteryStore(this.gs.learning.mastery);
    setSfxVolume(this.gs.settings.seVolume);

    const isBoss = this.opts.isBoss ?? def.isBoss;
    this.state = createBattle(
      {
        ally: partyFromGameState(this.gs, c),
        enemy: makeMonster(def, this.opts.level, 'enemy'),
        seed: freshSeed(),
        isBossBattle: isBoss,
        // 開発者モードの ときだけ ボス戦でも にげられる
        canFleeBoss: this.opts.devMode ?? false,
      },
      this.deps,
    );

    this.cameras.main.setBackgroundColor('#000000');
    this.fx = new Motions(this, (x, y, tint, texture, count, gravityY) =>
      this.burst(x, y, tint, texture, count, gravityY),
    );
    this.buildStage(isBoss);
    this.mountHud();
    // タブを ほかに して いる あいだは Phaser の フェードや タイマーが とまるので、もどったら 立て直す
    document.addEventListener('visibilitychange', this.onVisible);
    window.addEventListener('focus', this.onVisible);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
    void this.run().catch((e: unknown) => {
      void this.recoverFromError('進行中', e);
    });
  }

  override update(): void {
    // 足もとのかげは、走ったり跳んだりしても地面にとどまる
    for (const [sp, sh] of this.shadows) {
      sh.x = sp.x;
      sh.setVisible(sp.active && sp.alpha > 0.05);
    }
  }

  // ───────────────────────── 舞台づくり ─────────────────────────

  private buildStage(isBoss: boolean): void {
    const ground = this.opts.ground;
    const kind: BackdropKind = isBoss
      ? 'boss'
      : this.opts.zone === 'dungeon'
        ? 'dungeon'
        : ground && ground !== 'grass'
          ? ground
          : 'field';
    const bgKey = `bt.bg.${kind}`;
    addImage(this.textures, bgKey, backdropArt(kind));
    this.add.image(0, 0, bgKey).setOrigin(0).setScale(S).setDepth(0);
    for (const p of ['px', 'star', 'heart'] as const) addImage(this.textures, `bt.fx.${p}`, particleArt(p));
    addSheet(this.textures, 'bt.fx.slash', slashSheet(), 32, 32);

    const def = this.enemyDef;
    this.enemySize = this.sizeOf(def, isBoss);
    this.enemyScale = this.scaleOf(this.enemySize, isBoss);
    const eKey = this.monsterTexture(def, this.state.enemy.element, this.enemySize, isBoss);
    this.enemySprite = this.add
      .image(ENEMY_X, ENEMY_Y, eKey)
      .setOrigin(0.5, 1)
      .setScale(this.enemyScale)
      .setDepth(10);
    this.addShadow(this.enemySprite, ENEMY_Y, Math.round((this.enemySize * 0.7 * this.enemyScale) / S));

    const ap = this.gs.player.appearance;
    const eq = this.gs.player.equipment;
    const hk = heroKey(ap, eq, true);
    addSheet(this.textures, hk, battleSheet(heroLook(ap, eq)), HERO_W, HERO_H);
    this.heroSprite = this.add
      .image(HERO_X, HERO_Y, hk, BATTLE_POSE.idle)
      .setOrigin(0.5, 1)
      .setScale(S)
      .setDepth(12);
    this.addShadow(this.heroSprite, HERO_Y, 12);
    this.palSprite = this.makePartnerSprite(PAL_X);
  }

  /**
   * モンスターの絵の大きさ：地方ボス 56 / 中ボス 40 / 県ボス 48 / 通常 32。
   * 地方ボスは area が「県には無い 地方の id」の モンスター（北海道のように 県 id と 地方 id が
   * 同じ ところが あるので、県に ある id は 県あつかい）
   */
  private sizeOf(def: Monster, isBoss: boolean): number {
    if (!this.content.areas.has(def.area) && this.content.world.islands.some((i) => i.id === def.area))
      return MONSTER_SIZE.islandBoss;
    if ([...this.content.areas.values()].some((a) => a.midBoss === def.id)) return MONSTER_SIZE.midBoss;
    return isBoss ? MONSTER_SIZE.boss : MONSTER_SIZE.normal;
  }

  /**
   * 敵の絵の倍率。ボス戦だけ一回り大きく（×4 → ×5。1 ドット = 5px の整数倍なのでにじまない）。
   * 上の「てき」「なかま」の窓にかからないよう、高さ BOSS_MAX_H をこえるなら ×4 のまま（地方ボス 56 は ×4 で 224px）
   */
  private scaleOf(size: number, isBoss: boolean): number {
    return isBoss && size * (S + 1) <= BOSS_MAX_H ? S + 1 : S;
  }

  /**
   * 本番の PNG が同じキー（mon.<id>）で読み込まれていればそれを使い、無ければ仮のドット絵を作る
   * （手描きの絵 art/monsters があればそれ、無ければ属性の形で自動生成）。ボスの第 2 形態などは `<key>.p<番号>`。
   */
  private monsterTexture(def: Monster, element: Element, size: number, boss: boolean, suffix = ''): string {
    const key = `${def.spriteKey}${suffix}`;
    if (!this.textures.exists(key))
      this.textures.addCanvas(
        key,
        designedMonsterArt(def.id, suffix) ?? monsterArt(`${def.id}${suffix}`, { element, size, boss }),
      );
    return key;
  }

  private makePartnerSprite(x: number): Sprite | null {
    const m = this.state.ally.monsters[this.state.ally.activeMonsterIndex];
    const def = m && this.content.monsters.get(m.refId);
    if (!m || !def) return null;
    const sp = this.add
      .image(x, PAL_Y, this.monsterTexture(def, def.element, MONSTER_SIZE.normal, false))
      .setOrigin(0.5, 1)
      .setScale(S)
      .setDepth(11)
      .setAlpha(m.hp > 0 ? 1 : 0.35);
    this.addShadow(sp, PAL_Y, 22);
    return sp;
  }

  private addShadow(sp: Sprite, y: number, w: number): void {
    const key = `bt.shadow.${w}`;
    addImage(this.textures, key, shadowArt(w));
    this.shadows.set(sp, this.add.image(sp.x, y, key).setScale(S).setAlpha(0.3).setDepth(5));
  }

  private destroySprite(sp: Sprite): void {
    this.bobs.get(sp)?.stop();
    this.bobs.delete(sp);
    this.shadows.get(sp)?.destroy();
    this.shadows.delete(sp);
    sp.destroy();
  }

  private startIdle(): void {
    this.tweens.add({
      targets: this.enemySprite,
      scaleY: this.enemyScale * 0.95,
      duration: 460,
      yoyo: true,
      repeat: -1,
      ease: 'Stepped',
      easeParams: [1],
    });
    this.idleBob(this.heroSprite, HERO_Y);
    if (this.palSprite) this.idleBob(this.palSprite, PAL_Y);
  }

  /** 待機中は 1 ドットだけ上下（コマ送り） */
  private idleBob(sp: Sprite, baseY: number): void {
    this.bobs.get(sp)?.stop();
    sp.y = baseY;
    this.bobs.set(
      sp,
      this.tweens.add({
        targets: sp,
        y: baseY - S,
        duration: 520,
        yoyo: true,
        repeat: -1,
        ease: 'Stepped',
        easeParams: [1],
      }),
    );
  }

  private stopBob(sp: Sprite, baseY: number): void {
    this.bobs.get(sp)?.stop();
    this.bobs.delete(sp);
    sp.y = baseY;
  }

  // ───────────────────────── HUD ─────────────────────────

  private mountHud(): void {
    const layer = document.getElementById('ui-layer');
    if (!layer) return;
    this.hudRoot = document.createElement('div');
    this.hudRoot.className = 'nq-battle-root';
    layer.appendChild(this.hudRoot);
    this.hud.set({ muted: isSfxMuted() });
    this.hud.onAction = (a) => this.onUi(a);
    render(h(BattleHud, { store: this.hud }), this.hudRoot);
  }

  private teardown(): void {
    this.stopped = true;
    document.removeEventListener('visibilitychange', this.onVisible);
    window.removeEventListener('focus', this.onVisible);
    this.abort?.abort();
    this.hud.onAction = null;
    this.msgWaiters.clear();
    this.actionWaiter = null;
    this.overResolve = null;
    if (this.hudRoot) {
      render(null, this.hudRoot);
      this.hudRoot.remove();
      this.hudRoot = null;
    }
  }

  private onUi(a: UiAction): void {
    if (a.t === 'advance') {
      const done = this.msgWaiters.get(a.messageId);
      if (done) {
        this.msgWaiters.delete(a.messageId);
        done();
      }
      return;
    }
    if (a.t === 'toggleSound') {
      setSfxMuted(!isSfxMuted());
      this.hud.set({ muted: isSfxMuted() });
      return;
    }
    if (a.t === 'command' || a.t === 'skill' || a.t === 'item' || a.t === 'swap' || a.t === 'back') {
      if (this.phase === 'command' && !this.busy) this.onMenu(a);
      return;
    }
    this.actionWaiter?.(a);
  }

  private waitFor(pred: (a: UiAction) => boolean): Promise<UiAction> {
    return new Promise((resolve) => {
      this.actionWaiter = (a) => {
        if (!pred(a)) return;
        this.actionWaiter = null;
        resolve(a);
      };
    });
  }

  private say(text: string, mode: 'auto' | 'wait' = 'auto'): Promise<void> {
    const id = ++this.msgId;
    this.hud.set({ message: { id, text, mode }, menu: 'none' });
    return new Promise((resolve) => this.msgWaiters.set(id, resolve));
  }

  /** たたかいの ようす（待たない。次の 文が きたら 入れかわる） */
  private log(text: string): void {
    this.hud.set({ message: { id: ++this.msgId, text, mode: 'log' } });
  }

  private async showBanner(
    kind: BannerKind,
    text: string,
    sub?: string,
    subject?: string,
    ms = 1000,
  ): Promise<void> {
    const id = ++this.bannerId;
    this.hud.set({ banner: { id, kind, text, sub, subject } });
    await this.wait(ms);
    if (this.hud.get().banner?.id === id) this.hud.set({ banner: null });
  }

  private popup(x: number, y: number, text: string, kind: PopupView['kind']): void {
    const id = ++this.popupId;
    this.hud.set((s) => ({ popups: [...s.popups, { id, x, y, text, kind }] }));
    this.time.delayedCall(1300, () => this.hud.set((s) => ({ popups: s.popups.filter((p) => p.id !== id) })));
  }

  /** 問題の 枠の 見出しの 帯に「-12」など */
  private stripPop(text: string, kind: StripPopView['kind']): void {
    const id = ++this.stripId;
    this.hud.set((s) => ({ stripPops: [...s.stripPops.slice(-2), { id, text, kind }] }));
    this.time.delayedCall(1200, () =>
      this.hud.set((s) => ({ stripPops: s.stripPops.filter((p) => p.id !== id) })),
    );
  }

  // ───────────────────────── 表示用の状態 ─────────────────────────

  private enemyView(hp = this.state.enemy.hp): EnemyView {
    return buildEnemyView(this.state, hp);
  }

  private allyViews(): AllyView[] {
    return buildAllyViews(this.state, this.gs, this.content);
  }

  /** 教科ゲージ：主人公・オトモの わざに ある 教科の ぶん */
  private gaugeViews(): SubjectGaugeView[] {
    return buildGaugeViews(this.state, this.deps, this.content, this.hud.get().gauges);
  }

  /** 演出に あわせて 教科ゲージの 1 本を 書きかえる（gain = 「+n」を 出す） */
  private patchGauge(subject: string, value: number, gain?: number): void {
    this.hud.set((s) => ({
      gauges: s.gauges.map((g) =>
        g.subject === subject
          ? { ...g, value, gain: gain ? { id: ++this.gainId, amount: gain } : g.gain }
          : g,
      ),
    }));
  }

  private syncViews(): void {
    const s = this.state;
    const c = s.player.comboCount;
    this.hud.set({
      enemy: this.enemyView(),
      turn: s.outcome === 'ongoing' ? s.turn : null,
      allies: this.allyViews(),
      gauges: this.gaugeViews(),
      combo: { count: c, percent: Math.round((comboBonus(c, this.content.settings) - 1) * 100) },
    });
  }

  private patchAllyHp(id: string, delta: number): void {
    this.hud.set((s) => ({
      allies: s.allies.map((a) =>
        a.id === id ? { ...a, hp: Math.max(0, Math.min(a.maxHp, a.hp + delta)) } : a,
      ),
    }));
  }

  private patchEnemy(patch: Partial<EnemyView>): void {
    this.hud.set((s) => ({ enemy: s.enemy ? { ...s.enemy, ...patch } : s.enemy }));
  }

  /** 問題の 問い合わせ。教科の 固有スキルは プレイヤーの 学年（と ひとつ下）から。無ければ だんだん ひろげる */
  private queryFor(sk: Skill): QuestionQuery {
    return questionQueryForSkill({
      skill: sk,
      grade: this.gs.learning.grade,
      uniqueSkillIds: Object.values(this.content.settings.subjectGauge.uniqueSkills),
      hasCandidate: (query) => filterCandidates(this.bank, query).length > 0,
    });
  }

  private hasQuestion(sk: Skill): boolean {
    return filterCandidates(this.bank, this.queryFor(sk)).length > 0;
  }

  private canRecruit(): boolean {
    const s = this.state;
    return (
      !s.isBossBattle &&
      this.enemyDef.recruitRate > 0 &&
      s.enemy.hp > 0 &&
      s.enemy.hp / s.enemy.stats.hp <= this.content.settings.recruitHpThreshold
    );
  }

  private itemOptions(): ItemOption[] {
    return buildItemOptions(this.state, this.content);
  }

  private swapOptions(): SwapOption[] {
    return buildSwapOptions(this.state, this.deps);
  }

  /** 必殺技の一覧（主人公・オトモの わざ・教科の 固有スキル）。教科ゲージが たりない 必殺技は 打てない */
  private skillOptions(): SkillOption[] {
    return buildSkillOptions({
      state: this.state,
      deps: this.deps,
      queryFor: (skill) => this.queryFor(skill),
      hasQuestion: (skill) => this.hasQuestion(skill),
      nameOf: (id) => this.nameOf(id),
      preparingLabel: t('battle.preparing'),
    });
  }

  private commandOptions(): CommandOption[] {
    return buildCommandOptions({
      state: this.state,
      deps: this.deps,
      hasQuestion: (skill) => this.hasQuestion(skill),
      itemCount: this.itemOptions().length,
      canRecruit: this.canRecruit(),
    });
  }

  private nameOf(id: string): string {
    const s = this.state;
    if (id === s.ally.hero.id) return s.ally.hero.name;
    if (id === s.enemy.id) return s.enemy.name;
    return s.ally.monsters.find((m) => m.id === id)?.name ?? id;
  }

  private narrateCtx(): NarrateCtx {
    const s = this.state;
    return {
      nameOf: (id) => this.nameOf(id),
      skillName: (id) => this.content.skills.get(id)?.name ?? id,
      itemName: (id) => this.content.items.get(id)?.name ?? id,
      elementName: (el) => t(`elements.${el}`),
      subjectName: (sub) => t(`subjects.${sub}`),
      enemyName: s.enemy.name,
      isBossBattle: s.isBossBattle,
    };
  }

  // ───────────────────────── 進行 ─────────────────────────

  private async run(): Promise<void> {
    await this.intro();
    if (this.state.outcome === 'ongoing') {
      this.phase = 'command';
      this.syncViews();
      this.showCommands();
      await new Promise<void>((resolve) => {
        this.overResolve = resolve;
        this.checkOver();
      });
    }
    this.phase = 'over';
    this.setStep(false);
    this.hud.set({ turn: null, menu: 'none', actorId: null });
    await this.finish();
  }

  /** 暗転からあける → 敵がちらちら光って現れ、味方は右から歩いて入ってくる */
  private async intro(): Promise<void> {
    // まえの フェードが のこって いる ことが ある（タブを ほかに して いた とき）ので、まず 消す
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(350, 0, 0, 0);
    const allies: [Sprite, number][] = [[this.heroSprite, HERO_X]];
    if (this.palSprite) allies.push([this.palSprite, PAL_X]);
    allies.forEach(([sp], i) => (sp.x = OFF_RIGHT + i * 120));
    this.enemySprite.setAlpha(0);
    await this.wait(250);
    const shimmer = async () => {
      this.enemySprite.setAlpha(1);
      for (let i = 0; i < 3; i++) {
        this.enemySprite.setTintFill(0xffffff);
        await this.wait(70);
        this.enemySprite.clearTint();
        await this.wait(70);
      }
    };
    await Promise.all([shimmer(), ...allies.map(([sp, x], i) => this.walk(sp, x, 650 + i * 150))]);
    this.startIdle();
    this.syncViews();
    const name = this.state.enemy.name;
    await this.say(t(this.state.isBossBattle ? 'battle.appearBoss' : 'battle.appear', { name }), 'wait');
  }

  /** 演出を じゅんばんに 再生する */
  private enqueue(events: BattleEvent[]): Promise<void> {
    this.playing++;
    const run = this.chain.then(() => this.play(normalizeEvents(events)));
    this.chain = run
      .catch((e: unknown) => console.error('[battle] 演出で エラー', e))
      .then(() => {
        this.playing--;
        this.afterPlay();
      });
    return this.chain;
  }

  private afterPlay(): void {
    if (this.playing > 0 || this.phase === 'over') return;
    this.syncViews();
    if (this.state.outcome !== 'ongoing') {
      this.checkOver();
      return;
    }
    if (this.phase === 'command' && !this.busy) {
      if (this.hud.get().menu === 'none') this.showCommands();
      else {
        this.refreshMenu();
        this.refreshPrompt();
      }
    }
  }

  /** ひらいて いる 窓の 中身を 今の 状態に（オトモが 入れかわった・さそえるように なった など） */
  private refreshMenu(): void {
    const cur = this.hud.get();
    const clampCursor = (n: number) => Math.max(0, Math.min(cur.cursor, n - 1));
    if (cur.menu === 'skills') {
      const skills = this.skillOptions();
      this.hud.set({ skills, cursor: clampCursor(skills.length) });
    } else if (cur.menu === 'items') {
      const items = this.itemOptions();
      this.hud.set({ items, cursor: clampCursor(items.length) });
    } else if (cur.menu === 'swap') {
      const swaps = this.swapOptions();
      this.hud.set({ swaps, cursor: clampCursor(swaps.length) });
    }
  }

  private checkOver(): void {
    if (this.state.outcome === 'ongoing' || this.playing > 0 || this.busy || this.phase === 'question')
      return;
    const resolve = this.overResolve;
    this.overResolve = null;
    resolve?.();
  }

  private canActNow(): boolean {
    return isHeroReady(this.state) && this.playing === 0 && !this.busy && this.phase === 'command';
  }

  /** コマンドの 窓を 出す（主人公の 行動の あと・もどる） */
  private showCommands(): void {
    if (this.state.outcome !== 'ongoing' || this.phase !== 'command') return;
    // 主人公が たおれて いる ターンは えらべないので、オトモ → てき だけ すすめる
    if (this.state.ally.hero.hp <= 0) {
      void this.waitTurn();
      return;
    }
    this.hud.set({ menu: 'commands', cursor: this.cmdCursor, commands: this.commandOptions() });
    this.refreshPrompt();
  }

  /** 主人公が たおれて いる ターン：コマンドを 出さずに ターンだけ すすめる */
  private async waitTurn(): Promise<void> {
    if (this.busy || this.playing > 0 || this.phase !== 'command') return;
    this.busy = true;
    this.hud.set({ menu: 'none', actorId: null });
    try {
      const { state, events } = act(this.state, { kind: 'wait' }, this.deps);
      this.state = state;
      await this.enqueue(events);
    } catch (e) {
      await this.recoverFromError('ターンの すすめかた', e);
    } finally {
      this.busy = false;
      this.showCommands();
      this.checkOver();
    }
  }

  /** 「〇〇は どうする？」（行動を 待たせて いる ときは「じゅんびちゅう…」）。演出中は ようすの 文を のこす */
  private refreshPrompt(): void {
    const s = this.state;
    if (s.outcome !== 'ongoing' || this.phase !== 'command' || this.busy) return;
    const hero = s.ally.hero;
    const ready = isHeroReady(s) && this.playing === 0;
    this.setStep(ready);
    this.hud.set({ actorId: ready ? hero.id : null, commands: this.commandOptions() });
    if (this.playing > 0) return;
    const text = ready
      ? t('battle.whatWillDo', { name: hero.name }) +
        (this.canRecruit() ? `\n${t('battle.recruitHint')}` : '')
      : null;
    const cur = this.hud.get().message;
    if (text && !(cur?.mode === 'prompt' && cur.text === text))
      this.hud.set({ message: { id: ++this.msgId, text, mode: 'prompt' } });
  }

  /** 動ける ときは 主人公が 一歩 前に 出る（SFC の RPG のように） */
  private setStep(on: boolean): void {
    if (on === this.stepped) return;
    this.stepped = on;
    const sp = this.heroSprite;
    if (!sp?.active) return;
    this.tweens.add({
      targets: sp,
      x: on ? HERO_X - READY_STEP : HERO_X,
      duration: 120,
      ease: 'Stepped',
      easeParams: [3],
    });
  }

  private onMenu(a: MenuAction): void {
    switch (a.t) {
      case 'command':
        this.cmdCursor = this.hud.get().cursor;
        if (a.kind === 'skill') this.hud.set({ menu: 'skills', cursor: 0, skills: this.skillOptions() });
        else if (a.kind === 'item') this.hud.set({ menu: 'items', cursor: 0, items: this.itemOptions() });
        else if (a.kind === 'swap') this.hud.set({ menu: 'swap', cursor: 0, swaps: this.swapOptions() });
        else void this.runIntent({ kind: a.kind });
        return;
      case 'skill': {
        const entry = battleSkills(this.state, this.deps).find((b) => `${b.actorId}:${b.skill.id}` === a.key);
        if (entry) void this.runIntent({ kind: 'skill', entry });
        return;
      }
      case 'item':
        void this.runIntent({ kind: 'item', itemId: a.id });
        return;
      case 'swap':
        void this.runIntent({ kind: 'swap', index: a.index });
        return;
      case 'back':
        this.showCommands();
        return;
    }
  }

  /** 行動を 出す（ターン制：主人公の ばんなので すぐ 動く。そのあと オトモ → てき が 1 回ずつ） */
  private async runIntent(intent: Intent): Promise<void> {
    if (this.busy || this.phase !== 'command' || !this.canActNow()) return;
    this.busy = true;
    try {
      await this.execute(intent);
    } catch (e) {
      await this.recoverFromError('行動中', e);
    } finally {
      this.busy = false;
      this.showCommands();
      this.checkOver();
    }
  }

  private async execute(intent: Intent): Promise<void> {
    // 「◯◯は どうする？」を消してから行動に移る
    this.hud.set({ menu: 'none', message: null, actorId: null });
    this.setStep(false);
    await this.wait(130);
    let cmd: Command;
    switch (intent.kind) {
      case 'attack':
        cmd = { kind: 'attack' };
        break;
      case 'flee':
        cmd = { kind: 'flee' };
        break;
      case 'item':
        cmd = { kind: 'item', itemId: intent.itemId };
        break;
      case 'swap':
        cmd = { kind: 'swap', monsterIndex: intent.index };
        break;
      case 'recruit': {
        const result = await this.askRecruit();
        if (this.state.outcome !== 'ongoing') return;
        cmd = { kind: 'recruit', result };
        break;
      }
      case 'skill': {
        const { skill: sk, actorId } = intent.entry;
        await this.showBanner('skill', sk.name, t('battle.questionLead'), sk.subject, 900);
        const result = await this.askSkill(sk);
        // 問題の あいだに 決着（オトモが たおした・全滅）したら、そのまま 決着の 演出へ
        if (this.state.outcome !== 'ongoing') return;
        // 問題の あいだに オトモが たおれて いたら、その オトモの 必殺技は もう 使えない
        if (!this.stillUsable(intent.entry)) {
          this.log(t('battle.skillGone'));
          await this.wait(900);
          return;
        }
        const band = scoreBand(result.score);
        playSfx(band === 'perfect' ? 'combo' : band === 'miss' ? 'miss' : 'select');
        const m = this.content.settings.scoreMultipliers[band].toFixed(1);
        await this.showBanner(
          band,
          t(BAND_TEXT[band]),
          t(band === 'miss' ? 'battle.bandSubMiss' : 'battle.bandSub', { m }),
          undefined,
          900,
        );
        cmd = { kind: 'skill', skillId: sk.id, result, actorId };
        break;
      }
    }
    const { state, events } = act(this.state, cmd, this.deps);
    this.state = state;
    await this.enqueue(events);
  }

  private stillUsable(entry: BattleSkill): boolean {
    return battleSkills(this.state, this.deps).some(
      (b) => b.actorId === entry.actorId && b.skill.id === entry.skill.id,
    );
  }

  private async play(events: BattleEvent[]): Promise<void> {
    const ctx = this.narrateCtx();
    for (let i = 0; i < events.length; i++) {
      const e = events[i]!;
      const lines = narrate(e, ctx, events[i - 1]);
      const talk = async () => {
        if (!lines.length) return;
        // 決着・ボスの セリフは 読んでから すすむ
        if (e.t === 'defeat' || e.t === 'bossPhase') {
          for (const line of lines)
            await this.say(line, e.t === 'defeat' || line.startsWith('「') ? 'wait' : 'auto');
          return;
        }
        // ほかは ようすの 文（待たない。2 行ずつ、少しだけ 読む 時間を とる）
        for (let j = 0; j < lines.length; j += 2) {
          const text = lines.slice(j, j + 2).join('\n');
          this.log(text);
          await this.wait(Math.min(LOG_MAX_MS, LOG_BASE_MS + displayText(text).length * LOG_CHAR_MS));
        }
      };
      // 次の イベント（ダメージ・回復・まもり）を わたして、必殺技の 動きを ほんとうの あいてに 向ける
      const next = events[i + 1];
      if (TALK_FIRST.has(e.t)) await Promise.all([talk(), this.animate(e, next)]);
      else {
        await this.animate(e, next);
        await talk();
      }
    }
  }

  // ───────────────────────── 問題 ─────────────────────────

  /**
   * 問題を出して 成績を返す。ロジックに 使うのは score だけ（docs/01 §3.3）。かかった 時間は シーンが はかる。
   * 出せる問題が無ければ score 0（行動は必ず成立する）。問題の あいだも 時間は すすむ
   */
  private async runQuestion(
    query: QuestionQuery,
    title: string,
    subject: string,
    hint: string,
  ): Promise<ActionResult> {
    this.phase = 'question';
    try {
      return await runBattleQuestion({
        query,
        title,
        subject,
        hint,
        game: this.gs,
        content: this.content,
        bank: this.bank,
        mastery: this.mastery,
        rng: this.qRng,
        speak: this.speak,
        now: () => this.time.now,
        port: {
          show: ({ host, skillName, subject: questionSubject, hint: questionHint, abort }) => {
            this.abort = abort;
            this.hud.set({
              menu: 'none',
              message: null,
              stripPops: [],
              shake: 0,
              question: { host, skillName, subject: questionSubject, hint: questionHint },
            });
          },
          hide: () => {
            this.abort = null;
            this.hud.set({ question: null, stripPops: [] });
          },
        },
      });
    } finally {
      this.phase = 'command';
      this.syncViews();
    }
  }

  private async askSkill(sk: Skill): Promise<ActionResult> {
    const hint = t(sk.effect === 'scan' ? 'battle.scanHint' : 'battle.powerUpHint');
    const result = await this.runQuestion(this.queryFor(sk), sk.name, sk.subject, hint);
    if (result.score >= 1) this.perfectBySubject[sk.subject] = (this.perfectBySubject[sk.subject] ?? 0) + 1;
    return result;
  }

  /** なかまにさそう：主人公の わざ の教科で、敵の県にちなんだ問題を 1 問 */
  private async askRecruit(): Promise<ActionResult> {
    const sk = this.state.ally.hero.skills
      .map((id) => this.content.skills.get(id))
      .find((x): x is Skill => !!x && this.hasQuestion(x));
    if (!sk) return { score: 0, timeMs: 0, attempts: 0 };
    return this.runQuestion(
      recruitQuestionQuery(sk, this.enemyDef.area),
      t('cmd.recruit'),
      sk.subject,
      t('battle.recruitQuestionHint'),
    );
  }

  // ───────────────────────── 演出 ─────────────────────────

  private spriteOf(id: string): Sprite | null {
    const s = this.state;
    if (id === s.enemy.id) return this.enemySprite;
    if (id === s.ally.hero.id) return this.heroSprite;
    return this.palSprite;
  }

  private anchorOf(id: string): { x: number; y: number } {
    const sp = this.spriteOf(id) ?? this.heroSprite;
    return { x: sp.x, y: sp.y - sp.displayHeight * 0.6 };
  }

  private async animate(e: BattleEvent, next?: BattleEvent): Promise<void> {
    const s = this.state;
    switch (e.t) {
      case 'act': {
        // この 行動を うける キャラクター（act の あとに つづく ダメージ・回復・まもりの あいて）
        const targetId =
          next && (next.t === 'damage' || next.t === 'heal' || next.t === 'buff') ? next.targetId : undefined;
        const sp = this.spriteOf(e.actorId);
        const sk = e.skillId ? this.content.skills.get(e.skillId) : undefined;
        const actorEl = e.side === 'enemy' ? s.enemy.element : this.allyElement(e.actorId);
        this.lastElement = sk?.element ?? actorEl;
        // 主人公の ターン（auto で ない 味方の 行動）は、オトモの わざを えらんでも 主人公から うつ
        const heroTurn = e.side === 'ally' && !e.auto;
        const def = heroTurn ? undefined : this.monsterDefOf(e.actorId);
        this.lastMotif = def ? this.motifFx(def) : null;
        if (!sp) return;
        if (e.command === 'defend') {
          playSfx('buff');
          void this.fx.guardRing(this.anchorOf(e.actorId), 0x80c6ff);
          await this.flash(sp, 0x80c6ff, 2);
        } else if (e.command === 'skill') {
          await this.skillMotion(
            heroTurn ? s.ally.hero.id : e.actorId,
            e.side === 'enemy',
            heroTurn ? this.heroSprite : sp,
            sk?.gauge ?? 1,
            targetId,
            sk,
            this.tierOf(def),
            this.lastMotif,
          );
        } else if (e.command === 'scan') {
          playSfx('scan');
          const a = this.anchorOf(s.enemy.id);
          this.burst(a.x, a.y, 0xc8f4ff, 'bt.fx.star', 10, 0);
          await this.wait(350);
        } else if (e.command === 'attack') {
          if (e.side === 'enemy') await this.enemyAttack(sp);
          else if (sp === this.heroSprite) await this.heroAttack();
          else await this.partnerTackle(sp);
        }
        return;
      }
      case 'damage': {
        // かいしん・クリティカル（問題が かんぺき）は 大きく
        const big = e.critical || e.scoreBand === 'perfect';
        const target = e.side === 'enemy' ? this.enemySprite : this.spriteOf(e.targetId);
        const a = e.side === 'enemy' ? this.anchorOf(s.enemy.id) : this.anchorOf(e.targetId);
        if (e.side === 'enemy') {
          playSfx(big ? 'crit' : 'hit');
          this.burst(a.x, a.y, ELEMENT_FX[this.lastElement], big ? 'bt.fx.star' : 'bt.fx.px', big ? 18 : 14);
          this.fx.hit(a, this.lastElement, big);
          if (this.lastMotif) this.fx.motifPop(a, this.lastMotif);
          // かいしんは ふつうの こうげきより すこし だけ はでに（小さく ゆれる）
          if (big) this.cameras.main.shake(120, 0.006);
          this.popup(a.x, a.y, String(e.amount), big ? 'crit' : 'damage');
          this.patchEnemy({ hp: Math.max(0, (this.hud.get().enemy?.hp ?? 0) - e.amount) });
          await Promise.all([
            this.flash(this.enemySprite, 0xffffff, 2),
            this.shake(this.enemySprite, big ? 16 : 10),
          ]);
        } else {
          playSfx('hurt');
          this.cameras.main.shake(180, 0.008);
          this.fx.enemyHit(a, this.lastEnemyStyle, s.enemy.element);
          if (this.lastMotif) this.fx.motifPop(a, this.lastMotif);
          this.popup(a.x, a.y, String(e.amount), 'hurt');
          this.patchAllyHp(e.targetId, -e.amount);
          if (target) {
            const hero = target === this.heroSprite;
            if (hero) target.setFrame(BATTLE_POSE.hurt);
            await Promise.all([this.blink(target), this.knock(target, 12)]);
            if (hero && s.ally.hero.hp > 0) target.setFrame(BATTLE_POSE.idle);
          }
        }
        await this.wait(big ? 300 : 220);
        return;
      }
      case 'heal': {
        playSfx('heal');
        const a = this.anchorOf(e.targetId);
        this.burst(a.x, a.y + 30, 0x8fe36f, 'bt.fx.star', 12, -160);
        this.fx.healRing(a, 0x8fe36f);
        this.popup(a.x, a.y, `+${e.amount}`, 'heal');
        if (e.side === 'enemy')
          this.patchEnemy({ hp: Math.min(s.enemy.stats.hp, (this.hud.get().enemy?.hp ?? 0) + e.amount) });
        else this.patchAllyHp(e.targetId, e.amount);
        await this.wait(500);
        return;
      }
      case 'buff': {
        playSfx(e.mult >= 1 ? 'buff' : 'miss');
        const sp = e.side === 'enemy' ? this.enemySprite : this.spriteOf(e.targetId);
        const a = e.side === 'enemy' ? this.anchorOf(s.enemy.id) : this.anchorOf(e.targetId);
        this.burst(a.x, a.y, e.mult >= 1 ? 0x80c6ff : 0xa28be6, 'bt.fx.px', 10, e.mult >= 1 ? -200 : 200);
        if (e.mult >= 1) void this.fx.guardRing(a, 0x80c6ff);
        if (e.side === 'enemy') this.patchEnemy({ defMult: e.mult });
        if (sp) await this.flash(sp, e.mult >= 1 ? 0x80c6ff : 0xa28be6, 1);
        return;
      }
      case 'status': {
        // 敵の うごきが おそく なった：青い 光の わと きらめき
        playSfx('scan');
        const a = this.anchorOf(s.enemy.id);
        this.burst(a.x, a.y, 0x80c6ff, 'bt.fx.star', 12, 60);
        void this.fx.guardRing(a, 0x80c6ff);
        await this.flash(this.enemySprite, 0x80c6ff, 2);
        return;
      }
      case 'weaknessRevealed': {
        playSfx('scan');
        this.patchEnemy({ weaknessRevealed: true, weakness: e.element });
        await this.flash(this.enemySprite, ELEMENT_FX[e.element], 3);
        return;
      }
      case 'scanFailed':
      case 'gaugeShort':
        playSfx('miss');
        await this.wait(200);
        return;
      case 'turnStart':
        this.hud.set({ turn: e.turn });
        return;
      case 'skipTurn': {
        // 休んで いて 動けない：ちいさく ゆれて 青く 光る
        playSfx('miss');
        void this.fx.guardRing(this.anchorOf(e.targetId), 0x80c6ff);
        await this.shake(this.enemySprite, 6);
        return;
      }
      case 'combo':
        playSfx('combo');
        await this.showBanner(
          'combo',
          t('battle.comboBanner', { n: e.count }),
          t('battle.comboPower', { p: Math.round((e.bonus - 1) * 100) }),
          undefined,
          800,
        );
        return;
      case 'gaugeCharge':
        playSfx(e.unlocked.length > 0 || e.value >= e.max ? 'combo' : 'select');
        this.patchGauge(e.subject, e.value, e.amount);
        await this.wait(150);
        return;
      case 'gaugeUse':
        playSfx('buff');
        this.patchGauge(e.subject, e.value);
        return;
      case 'itemUsed':
        playSfx('select');
        return;
      case 'swap': {
        // 今の相棒は右へさがり、次の相棒が右から出てくる
        const old = this.palSprite;
        if (old) {
          await this.walk(old, OFF_RIGHT, 300);
          this.destroySprite(old);
        }
        this.palSprite = this.makePartnerSprite(OFF_RIGHT);
        this.syncViews();
        if (this.palSprite) {
          await this.walk(this.palSprite, PAL_X, 360);
          this.idleBob(this.palSprite, PAL_Y);
        }
        return;
      }
      case 'recruitAttempt': {
        const a = this.anchorOf(s.enemy.id);
        this.burst(a.x, a.y, 0xff8fb1, 'bt.fx.heart', 10, -80);
        playSfx(e.success ? 'recruit' : 'miss');
        if (!e.success) await this.shake(this.enemySprite, 8);
        await this.wait(400);
        return;
      }
      case 'recruited': {
        const a = this.anchorOf(s.enemy.id);
        this.burst(a.x, a.y, 0xff8fb1, 'bt.fx.heart', 18, -120);
        await this.tweenP({
          targets: this.enemySprite,
          y: ENEMY_Y - 26,
          duration: 160,
          yoyo: true,
          repeat: 1,
        });
        return;
      }
      case 'fleeAttempt': {
        if (!e.success) {
          playSfx('miss');
          await this.shake(this.heroSprite, 6);
          return;
        }
        // うしろを向いて、右へ走ってにげる
        playSfx('run');
        this.heroSprite.setFlipX(true);
        const out = [this.heroSprite, this.palSprite].filter((x): x is Sprite => !!x);
        await Promise.all(out.map((sp) => this.walk(sp, sp.x + 420, 450)));
        return;
      }
      case 'ko': {
        playSfx('ko');
        if (e.side === 'enemy') {
          // 白くなって、ちりになって消える
          const sp = this.enemySprite;
          this.tweens.killTweensOf(sp);
          sp.setTintFill(0xffffff);
          const a = this.anchorOf(s.enemy.id);
          this.burst(a.x, a.y + 20, 0xd2d7e2, 'bt.fx.px', 36, -140);
          await this.tweenP({
            targets: sp,
            scaleY: 0,
            alpha: 0,
            duration: 700,
            ease: 'Stepped',
            easeParams: [7],
          });
        } else {
          const sp = this.spriteOf(e.targetId);
          if (!sp) return;
          const hero = sp === this.heroSprite;
          this.stopBob(sp, hero ? HERO_Y : PAL_Y);
          if (hero) sp.setFrame(BATTLE_POSE.hurt);
          sp.setTint(0x6b6f80);
          await this.tweenP({ targets: sp, alpha: hero ? 0.7 : 0.3, y: sp.y + 2 * S, duration: 320 });
        }
        return;
      }
      case 'bossPhase': {
        playSfx('crit');
        this.cameras.main.flash(420, 229, 72, 77);
        this.cameras.main.shake(420, 0.014);
        await this.shake(this.enemySprite, 14);
        const key = this.monsterTexture(
          this.enemyDef,
          s.enemy.element,
          this.enemySize,
          true,
          `.p${e.phaseIndex}`,
        );
        this.enemySprite.setTexture(key);
        this.patchEnemy({ element: s.enemy.element });
        await this.flash(this.enemySprite, 0xffffff, 2);
        return;
      }
      case 'victory':
        this.victory = e;
        return;
      case 'defeat':
        playSfx('defeat');
        this.cameras.main.fadeOut(900, 0, 0, 0);
        await this.wait(900);
        return;
      case 'fled':
        return;
    }
  }

  /** 主人公の「たたかう」：敵の前まで走って斬り、元の位置へとびのく */
  private async heroSlash(): Promise<void> {
    const sp = this.heroSprite;
    await this.walk(sp, ENEMY_X + 136, 260);
    sp.setFrame(BATTLE_POSE.attack);
    playSfx('slash');
    const fx = this.add
      .sprite(ENEMY_X, ENEMY_Y - (this.enemySize * this.enemyScale) / 2, 'bt.fx.slash', 0)
      .setScale(S)
      .setDepth(25)
      .setTint(ELEMENT_FX[this.lastElement]);
    for (let f = 0; f < 3; f++) {
      fx.setFrame(f);
      await this.wait(60);
    }
    fx.destroy();
    // もどるのはダメージの演出と同時（待たない）
    void this.walk(sp, HERO_X, 260).then(() => {
      if (sp.active && this.state.ally.hero.hp > 0) this.idleBob(sp, HERO_Y);
    });
  }

  /** 主人公の「たたかう」（2 回に 1 回）：敵の 前で 高く とびあがって、上から 切りおろす */
  private async heroJumpSlash(): Promise<void> {
    const sp = this.heroSprite;
    await this.walk(sp, ENEMY_X + 190, 220);
    sp.setFrame(BATTLE_POSE.attack);
    await this.fx.hopTo(sp, ENEMY_X + 128, HERO_Y, 22 * S, 260);
    playSfx('slash');
    const fx = this.add
      .sprite(ENEMY_X, ENEMY_Y - (this.enemySize * this.enemyScale) / 2, 'bt.fx.slash', 0)
      .setScale(S)
      .setDepth(25)
      .setFlipY(true)
      .setTint(ELEMENT_FX[this.lastElement]);
    for (let f = 0; f < 3; f++) {
      fx.setFrame(f);
      await this.wait(60);
    }
    fx.destroy();
    void this.walk(sp, HERO_X, 300).then(() => {
      if (sp.active && this.state.ally.hero.hp > 0) this.idleBob(sp, HERO_Y);
    });
  }

  /** 主人公の「たたかう」：5 しゅるいを じゅんばんに（横切り → ジャンプ切り → 二連切り → つき → 回転切り） */
  private heroAttack(): Promise<void> {
    const k = this.swings++ % 5;
    if (k === 0) return this.heroSlash();
    if (k === 1) return this.heroJumpSlash();
    return this.heroSwing(k === 2 ? 'cross' : k === 3 ? 'thrust' : 'spin');
  }

  /** 主人公の 二連切り・つき・回転切り：敵の 前まで 走って（つきは ふみこんで）斬る。もどるのは ダメージの演出と同時 */
  private async heroSwing(kind: SwingKind): Promise<void> {
    const sp = this.heroSprite;
    await this.walk(sp, ENEMY_X + (kind === 'thrust' ? 200 : 136), kind === 'thrust' ? 200 : 260);
    sp.setFrame(BATTLE_POSE.attack);
    if (kind === 'thrust') await this.fx.hopTo(sp, ENEMY_X + 150, HERO_Y, 2 * S, 100);
    playSfx('slash');
    if (kind === 'cross') this.time.delayedCall(150, () => playSfx('slash'));
    const at = { x: ENEMY_X, y: ENEMY_Y - (this.enemySize * this.enemyScale) / 2 };
    await this.fx.swing(kind, at, ELEMENT_FX[this.lastElement]);
    void this.walk(sp, HERO_X, 280).then(() => {
      if (sp.active && this.state.ally.hero.hp > 0) this.idleBob(sp, HERO_Y);
    });
  }

  /** 味方の 属性（仲間モンスターなら その属性、主人公は むぞくせい）。エフェクトの 色と かけらに 使う */
  private allyElement(id: string): Element {
    return this.state.ally.monsters.find((m) => m.id === id)?.element ?? 'none';
  }

  /** 仲間の「たたかう」：ぴょんと はねて 敵へ たいあたり。もどるのは ダメージの演出と同時 */
  private async partnerTackle(sp: Sprite): Promise<void> {
    this.stopBob(sp, PAL_Y);
    await this.fx.hopTo(sp, ENEMY_X + 200, PAL_Y, 16 * S, 260);
    void this.fx.hopTo(sp, PAL_X, PAL_Y, 8 * S, 260).then(() => {
      if (sp.active) this.idleBob(sp, PAL_Y);
    });
  }

  /**
   * 敵の「こうげき」：白く 2 回光ってから、とびかかって ひっかく → つっこんで たいあたり → とびかかって かみつく を じゅんばんに。
   * ボスは 2 回に 1 回、とびあがって ドシン（画面が ゆれて 地ひびき）。味方に 当たったときの しるしも これで かわる
   */
  private async enemyAttack(sp: Sprite): Promise<void> {
    await this.flash(sp, 0xffffff, 2);
    const k = this.enemyAttacks++;
    if (this.state.isBossBattle && k % 2 === 1) {
      this.lastEnemyStyle = 'quake';
      await this.fx.stomp(sp, 40 * S, ENEMY_Y);
    } else if (k % 3 === 1) {
      this.lastEnemyStyle = 'bash';
      await this.fx.dash(sp, 30 * S);
    } else {
      this.lastEnemyStyle = k % 3 === 2 ? 'bite' : 'claw';
      await this.lunge(sp, 1);
    }
  }

  /** 行動した モンスターの データ（敵・仲間。主人公は undefined） */
  private monsterDefOf(actorId: string): Monster | undefined {
    if (actorId === this.state.enemy.id) return this.enemyDef;
    const m = this.state.ally.monsters.find((x) => x.id === actorId);
    return m ? this.content.monsters.get(m.refId) : undefined;
  }

  /**
   * 演出の はでさ：主人公・ボス＝3。モンスターは しんか前＝1、とちゅう＝2、さいごの すがた（しんかした あと もう しんかしない）＝3。
   * しんかしない モンスターは 1（のら モンスター）
   */
  private tierOf(def: Monster | undefined): number {
    if (!def || def.isBoss) return 3;
    const stage = evolutionStage(def.id, this.content.monsters);
    if (stage >= 2 && !def.evolution) return 3;
    return Math.min(3, stage);
  }

  /** モンスターの モチーフの 絵：名産の どうぐの アイコン（16）と 名所の 絵（32）。どちらかが あれば つかう */
  private motifFx(def: Monster): MotifFx | null {
    const motif = this.content.areas.get(def.area)?.motifs.find((m) => m.id === def.motifId);
    if (!motif) return null;
    const tag = `${def.area}-${def.motifId}`;
    const item = this.content.items.get(tag);
    const iconKey = `bt.motif.icon.${tag}`;
    const bigKey = `bt.motif.big.${tag}`;
    if (item) addImage(this.textures, iconKey, toCanvas(itemIconGrid(item)));
    const scene = motifArtGrid(def.area, motif);
    if (scene) addImage(this.textures, bigKey, toCanvas(scene));
    const icon = item ? iconKey : scene ? bigKey : null;
    const big = scene ? bigKey : icon;
    if (!icon || !big) return null;
    return { icon, big, iconScale: item ? 1 : 0.5, bigScale: scene ? 1 : 2 };
  }

  /**
   * 必殺技：光って ためる（味方は その場で ジャンプ、敵は とびかかる）→ 属性ごとの 動きが あいて（targetId）へ。
   * 自分への 回復・まもり（targetId が 自分）は あいてへ とばさず、自分に 光を あつめるだけ
   * ※ 以前は あいてを 陣営で きめつけていたので、敵の 回復が 主人公に とび、主人公の 回復が 敵に とび、
   *   仲間を ねらった 敵の 必殺技も 主人公に 当たって 見えていた
   */
  private async skillMotion(
    actorId: string,
    enemySide: boolean,
    sp: Sprite,
    stars: number,
    targetId?: string,
    sk?: Skill,
    tier = 3,
    motif: MotifFx | null = null,
  ): Promise<void> {
    const hero = sp === this.heroSprite;
    // 技の タイプ・教科・単元の 見た目（とぶ 字・きめ）。こうげき・よわらせる だけ 画面を くらくして あいてへ とばす
    const look = sk ? skillLook(sk, tOpt) : null;
    const attack = !look || look.kind === 'attack' || look.kind === 'weaken';
    // はでさ：しんか前の モンスター（tier 1）は ぶたい なし・字の 演出 なし、1 かい しんか（tier 2）は うすい ぶたい
    const mid = tier >= 2;
    const full = tier >= 3;
    const baseY = hero ? HERO_Y : PAL_Y;
    const from = this.anchorOf(actorId);
    const toId = targetId ?? (enemySide ? this.state.ally.hero.id : this.state.enemy.id);
    const self = toId === actorId || !attack;
    const to = this.anchorOf(toId);
    const tint = ELEMENT_FX[this.lastElement];
    if (hero) sp.setFrame(BATTLE_POSE.attack);
    if (enemySide) this.lastEnemyStyle = 'skill';
    // 必殺技の ぶたい：画面が くらく なって 集中線（自分への 回復・まもりは しない）
    const stage = self || !mid ? null : await this.fx.stageIn(from, this.lastElement, sp, !full);
    this.burst(from.x, from.y, tint, 'bt.fx.star', (mid ? 8 : 4) + Math.min(stars, tier) * 4, -120);
    // ため：属性の かけらが あつまって 光る
    const charge = Promise.all([
      this.fx.charge(from, this.lastElement, Math.min(stars, tier)),
      look && mid ? this.fx.subjectCharge(from, look) : undefined,
    ]);
    if (enemySide) {
      await Promise.all([this.flash(sp, tint, 2), charge]);
      if (!self) await this.lunge(sp, 1);
    } else {
      this.stopBob(sp, baseY);
      await Promise.all([this.flash(sp, tint, 2), this.fx.hop(sp, baseY), charge]);
    }
    if (self)
      // まもり・かいふく・しらべる：あいて（自分・仲間・敵）に 光の わと 字の 演出
      await Promise.all([
        this.fx.guardRing(to, tint),
        look && mid ? this.fx.subjectStream(from, to, look) : undefined,
      ]);
    else {
      // 技が とぶ ときは あいても 見えるように くらさを うすく → 当たったら きめ（属性 ＋ 教科）
      await stage?.dim(0.3);
      await Promise.all([
        this.fx.skill(this.lastElement, from, to, stars, tier),
        look && mid ? this.fx.subjectStream(from, to, look) : undefined,
        // モンスターの モチーフ（ねぶたなら ねぶたの 山車）が とんで いく
        motif ? this.fx.motifStrike(from, to, motif, tier) : undefined,
      ]);
      await Promise.all([
        this.fx.finisher(to, this.lastElement, stars, tier),
        look && full ? this.fx.subjectFinish(to, look) : undefined,
      ]);
      await stage?.end();
    }
    if (hero) sp.setFrame(BATTLE_POSE.idle);
    if (!enemySide && sp.active && (!hero || this.state.ally.hero.hp > 0)) this.idleBob(sp, baseY);
  }

  /** 歩く（主人公は右足・左足のコマ、モンスターはぴょこぴょこ跳ねる） */
  private async walk(sp: Sprite, x: number, ms: number): Promise<void> {
    const hero = sp === this.heroSprite;
    const baseY = hero ? HERO_Y : PAL_Y;
    this.stopBob(sp, baseY);
    let k = 0;
    const timer = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        k++;
        if (hero) sp.setFrame(k % 2 ? BATTLE_POSE.stepA : BATTLE_POSE.stepB);
        else sp.y = baseY - (k % 2) * 2 * S;
      },
    });
    await this.tweenP({ targets: sp, x, duration: ms });
    timer.remove();
    if (hero) sp.setFrame(BATTLE_POSE.idle);
    sp.y = baseY;
  }

  /** とびかかる（dir = 1 右へ / -1 左へ） */
  private lunge(sp: Sprite, dir: 1 | -1): Promise<void> {
    return this.tweenP({
      targets: sp,
      x: sp.x + 48 * dir,
      y: sp.y - 12,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  /** ダメージで少し後ろへはじかれる（味方は右へ） */
  private knock(sp: Sprite, dx: number): Promise<void> {
    return this.tweenP({
      targets: sp,
      x: sp.x + dx,
      duration: 70,
      yoyo: true,
      ease: 'Stepped',
      easeParams: [2],
    });
  }

  private async flash(sp: Sprite, color: number, times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
      sp.setTintFill(color);
      await this.wait(60);
      sp.clearTint();
      await this.wait(60);
    }
  }

  /** 左右に揺れて、だんだん小さく */
  private async shake(sp: Sprite, amp: number): Promise<void> {
    const x0 = sp.x;
    for (const k of [1, -1, 0.7, -0.7, 0.4, -0.4, 0]) {
      sp.x = x0 + amp * k;
      await this.wait(42);
    }
  }

  private async blink(sp: Sprite): Promise<void> {
    for (let i = 0; i < 4; i++) {
      sp.setAlpha(0.2);
      await this.wait(55);
      sp.setAlpha(1);
      await this.wait(55);
    }
  }

  private burst(x: number, y: number, tint: number, texture: string, count: number, gravityY = 220): void {
    const em = this.add
      .particles(x, y, texture, {
        speed: { min: 70, max: 240 },
        angle: { min: 0, max: 360 },
        scale: { start: 3, end: 0.6 },
        lifespan: 600,
        tint,
        gravityY,
        emitting: false,
      })
      .setDepth(20);
    em.explode(count);
    this.time.delayedCall(1000, () => em.destroy());
  }

  private tweenP(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => this.tweens.add({ ...cfg, onComplete: () => resolve() }));
  }

  /**
   * ミリ秒 まつ。タブを ほかに して いる あいだは Scene の タイマーが とまるので、
   * もどって きても とまったままの ときのために window の タイマーでも 見はる（黒い まま 進まなく ならないように）。
   * 見えて いない あいだは 先に すすめない（もどったら つづきから）
   */
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      let done = false;
      let guard = 0;
      const finish = () => {
        if (done || this.stopped) return;
        done = true;
        window.clearTimeout(guard);
        ev.remove();
        resolve();
      };
      const arm = () => {
        guard = window.setTimeout(
          () => (document.visibilityState === 'visible' ? finish() : arm()),
          ms + 400,
        );
      };
      const ev = this.time.delayedCall(ms, finish);
      arm();
    });
  }

  /** タブに もどった とき：とちゅうで とまった フェードイン（黒い まく）だけを 消す（わざとの 暗転は のこす） */
  private readonly onVisible = (): void => {
    if (this.stopped || document.visibilityState !== 'visible') return;
    const cam = this.cameras?.main;
    const fade = cam?.fadeEffect;
    if (fade?.isRunning && !fade.direction) cam.resetFX();
  };

  /** 勝ったとき：主人公はばんざいして 2 回ジャンプ、相棒もぴょんぴょん */
  private async victoryPose(): Promise<void> {
    const hero = this.heroSprite;
    this.stopBob(hero, HERO_Y);
    hero.setFrame(BATTLE_POSE.victory);
    const pal = this.palSprite?.active && this.palSprite.alpha > 0.5 ? this.palSprite : null;
    if (pal) this.stopBob(pal, PAL_Y);
    for (let i = 0; i < 2; i++)
      await Promise.all([
        this.tweenP({ targets: hero, y: HERO_Y - 6 * S, duration: 140, yoyo: true, ease: 'Quad.easeOut' }),
        pal
          ? this.tweenP({ targets: pal, y: PAL_Y - 4 * S, duration: 140, yoyo: true, ease: 'Quad.easeOut' })
          : Promise.resolve(),
      ]);
  }

  // ───────────────────────── 終了 ─────────────────────────

  /** 途中まで進んだ状態で操作へ戻さず、安全にフィールドへ退避する。 */
  private async recoverFromError(context: string, error: unknown): Promise<void> {
    console.error(`[battle] ${context}で エラー`, error);
    if (this.recovering || this.stopped) return;
    this.recovering = true;
    this.phase = 'over';
    this.busy = true;
    this.abort?.abort();
    this.hud.set({ result: null, message: null, menu: 'none', question: null, turn: null });
    try {
      await this.leave('fled', 0);
    } catch (leaveError) {
      console.error('[battle] エラーから戻れませんでした', leaveError);
      if (!this.stopped) {
        this.scene.stop();
        this.game.events.emit('battle:end', { outcome: 'fled', goldLost: 0 } satisfies BattleEndPayload);
      }
    }
  }

  private async finish(): Promise<void> {
    const s = this.state;
    const v = this.victory;
    const summary = battleSummary(s, v, this.perfectBySubject);
    const outcome = summary.outcome;

    if (outcome === 'victory') {
      playSfx('victory');
      await this.victoryPose();
      // 特産品を落としたら、名前の帯 → 「とくさんひん『〇〇』を てに いれた！」→ 特産品の説明（宝箱の特産品と同じ説明）
      const specialties = specialtyIndex(this.content.areas, this.content.items);
      for (const id of new Set(summary.drops)) {
        const sp = specialties.get(id);
        if (!sp) continue;
        playSfx('discover');
        await this.showBanner('skill', sp.item.name, t('field.specialtyFound'), undefined, 1300);
        await this.say(t('battle.specialtyGet', { item: sp.item.name }), 'wait');
        await this.say(sp.motif.blurb, 'wait');
      }
      this.hud.set({
        menu: 'none',
        message: null,
        cursor: 0,
        result: victoryResultView(summary, v, s.enemy.name, this.gs, this.content, itemIconUrl),
      });
      if (v?.recruitOffer) {
        const a = await this.waitFor((x) => x.t === 'recruitAnswer');
        summary.recruitAccepted = a.t === 'recruitAnswer' && a.yes;
        if (summary.recruitAccepted) {
          playSfx('recruit');
          this.hud.set({ result: null });
          await this.say(t('battle.recruitSuccess', { name: s.enemy.name }), 'wait');
        }
      } else await this.waitFor((x) => x.t === 'resultClose');
    } else if (outcome === 'defeat') {
      const { goldLost } = applyBattleResult(this.gs, summary, this.content.settings);
      this.hud.set({
        menu: 'none',
        message: null,
        result: defeatResultView(goldLost),
      });
      await this.waitFor((x) => x.t === 'resultClose');
    }

    const applied = applyBattleResult(this.gs, summary, this.content.settings);
    this.registry.set('game', await this.settleBag(applied));
    await this.leave(outcome, applied.goldLost);
  }

  /**
   * バトルの あとの バッグ：レベルが 上がった・マスが ふえた を しらせる。
   * 仲間に なった モンスターは マスが あいていれば バッグへ、たりなければ あずけて しらせる
   */
  private async settleBag(applied: AppliedBattle) {
    const settled = settleBattleBag(this.gs, applied, this.content);
    const say = async (text: string) => {
      this.hud.set({ result: null });
      await this.say(text, 'wait');
    };
    if (settled.level.after > settled.level.before) {
      playSfx('discover');
      await say(t('battle.levelUp', { name: settled.state.player.name, lv: settled.level.after }));
      if (settled.level.bagGrew) await say(t('battle.bagGrew', { n: settled.level.bagCapacity }));
    }
    if (settled.recruitStored) await say(t('battle.recruitStored', { name: this.state.enemy.name }));
    return settled.state;
  }

  private async leave(outcome: BattleEndPayload['outcome'], goldLost: number): Promise<void> {
    this.hud.set({ result: null, message: null, menu: 'none', question: null, turn: null });
    this.cameras.main.fadeOut(280, 0, 0, 0);
    await this.wait(300);
    this.scene.stop();
    this.game.events.emit('battle:end', { outcome, goldLost } satisfies BattleEndPayload);
  }
}
