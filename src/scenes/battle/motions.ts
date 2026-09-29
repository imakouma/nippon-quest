/**
 * バトルの 動き（エフェクト）。Battle シーンから よぶ。見た目だけで、ゲームの 計算には さわらない。
 *  - 必殺技は 属性ごとに ちがう 動き：ヒノ＝火の玉が 山なりに とぶ／ミズ＝水の しずくが 波のように／
 *    モリ＝葉っぱが うずを まいて あつまる／ツチ＝上から 岩が おちる／カゼ＝風の 刃が 何回も きる／
 *    ヒカリ＝光の 柱が おりる／ヤミ＝やみの 玉が まわりから あつまる。★ が 多いほど 数が ふえて はでに なる
 *  - 体の 動き：つっこむ（dash）・とびあがって ドシン（stomp）・山なりに とぶ（hopTo：仲間の たいあたり・主人公の ジャンプ切り）・その場で ジャンプ（hop）
 *  - 当たったとき：星・光の わ・属性の かけら（火の粉・あわ・葉・小石・風・きらめき・やみの ほのお）。会心は ×印
 *  - 敵の こうげきが 当たったとき：ひっかき・かみつき・たいあたり・地ひびき の しるし
 *  - 必殺技の ため（かけらが あつまる）、主人公の 斬撃（二連・つき・回転切り）、回復と まもりの 光の わ
 *  - 必殺技の ぶたい（stage）：画面が くらく なり、うつ 人の まわりに 属性の 色の 集中線、カメラが すこし よる。
 *    当たった ときの きめ（finisher）：属性の 色で 画面が 光り、大きく ゆれ、光の わが かさなって ひろがり、しょうげきはと かけらが とぶ
 * ドット絵は fxArt（×4 表示）。位置は 1 ドット（4px）に そろえて にじませない。
 */
import type Phaser from 'phaser';
import type { Element } from '../../core/content/schemas';
import { addImage } from '../art/sheet';
import { fxArt, type FxKind } from './fxArt';
import { BACKDROP_SCALE, ELEMENT_FX } from './pixelArt';

const S = BACKDROP_SCALE;
const snap = (v: number): number => Math.round(v / S) * S;

export interface Pt {
  x: number;
  y: number;
}

type Actor = Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;

/** 敵の こうげきの しかた（味方に 当たったときの しるしが かわる） */
export type EnemyStyle = 'claw' | 'bite' | 'bash' | 'quake' | 'skill';
/** 主人公の 「たたかう」の 斬撃（横切り・ジャンプ切りは Battle の 3 コマの 斬撃） */
export type SwingKind = 'cross' | 'thrust' | 'spin';

/** 属性ごとの 小さな かけら（当たると ちる・必殺技の ためで あつまる） */
const BITS: Record<Element, FxKind> = {
  hino: 'ember',
  mizu: 'bubble',
  mori: 'leafbit',
  tsuchi: 'pebble',
  kaze: 'gust',
  hikari: 'twinkle',
  yami: 'wisp',
  none: 'twinkle',
};
/** Battle の burst（パーティクル）を そのまま 使う */
type Burst = (x: number, y: number, tint: number, texture: string, count: number, gravityY?: number) => void;

export class Motions {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly burst: Burst,
  ) {}

  // ───────────────────────── 必殺技 ─────────────────────────

  /** 必殺技の 動き。stars は 技ゲージの 段（★1〜★3） */
  async skill(el: Element, from: Pt, to: Pt, stars = 1): Promise<void> {
    const n = 2 + Math.min(3, Math.max(1, stars));
    switch (el) {
      case 'hino':
        await this.fireballs(from, to, n);
        break;
      case 'mizu':
        await this.water(from, to, n + 2);
        break;
      case 'mori':
        await this.leaves(to, n + 3);
        break;
      case 'tsuchi':
        await this.rocks(to, n);
        break;
      case 'kaze':
        await this.winds(to, n);
        break;
      case 'hikari':
        await this.pillar(to, n);
        break;
      case 'yami':
        await this.orbs(to, n + 1);
        break;
      default:
        await this.sparkles(to, n);
    }
  }

  /**
   * 必殺技の ぶたい：画面を くらくして、うつ 人（actor）の まわりに 属性の 色の 集中線。カメラが すこし よる。
   * dim(a) で くらさを かえ（技が あいてに とぶ ときは あいても 見えるように うすく）、end() で もとに もどす
   */
  async stageIn(
    from: Pt,
    el: Element,
    actor: Actor,
  ): Promise<{ dim: (alpha: number) => Promise<void>; end: () => Promise<void> }> {
    const cam = this.scene.cameras.main;
    const tint = ELEMENT_FX[el];
    const { width: w, height: h } = this.scene.scale;
    const dark = this.scene.add
      .rectangle(-w * 0.2, -h * 0.2, w * 1.4, h * 1.4, 0x0b0a14, 1)
      .setOrigin(0)
      .setDepth(16)
      .setAlpha(0);
    const lines = this.scene.add.graphics().setDepth(16.5).setAlpha(0);
    const depth0 = actor.depth;
    actor.setDepth(17);
    let tick = 0;
    const draw = () => {
      lines.clear();
      const n = 32;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (tick % 2) * 0.05;
        const r0 = 34 * S + ((i * 37 + tick * 13) % 9) * 3 * S;
        const r1 = w;
        lines.lineStyle(i % 3 ? S : S * 2, i % 4 ? tint : 0xffffff, i % 3 ? 0.55 : 0.9);
        lines.lineBetween(
          from.x + Math.cos(a) * r0,
          from.y + Math.sin(a) * r0,
          from.x + Math.cos(a) * r1,
          from.y + Math.sin(a) * r1,
        );
      }
      tick++;
    };
    draw();
    const timer = this.scene.time.addEvent({ delay: 60, loop: true, callback: draw });
    cam.zoomTo(1.08, 240, 'Quad.easeOut');
    await Promise.all([
      this.tween({ targets: dark, alpha: 0.62, duration: 180 }),
      this.tween({ targets: lines, alpha: 1, duration: 180 }),
    ]);
    const dim = async (alpha: number) => {
      timer.remove();
      await Promise.all([
        this.tween({ targets: lines, alpha: 0, duration: 140 }),
        this.tween({ targets: dark, alpha, duration: 140 }),
      ]);
    };
    const end = async () => {
      timer.remove();
      cam.zoomTo(1, 220, 'Quad.easeOut');
      await Promise.all([
        this.tween({ targets: lines, alpha: 0, duration: 200 }),
        this.tween({ targets: dark, alpha: 0, duration: 220 }),
      ]);
      lines.destroy();
      dark.destroy();
      if (actor.active) actor.setDepth(depth0);
    };
    return { dim, end };
  }

  /**
   * 必殺技が 当たった ときの きめ：属性の 色で 画面が 光って 大きく ゆれ、大きな 星・かさなる 光の わ・
   * 足もとの しょうげきは・属性の かけらと 星が とびちる。★ が 多いほど 大きく、長く
   */
  async finisher(to: Pt, el: Element, stars: number): Promise<void> {
    const tint = ELEMENT_FX[el];
    const st = Math.min(3, Math.max(1, stars));
    const cam = this.scene.cameras.main;
    cam.flash(160 + st * 50, (tint >> 16) & 255, (tint >> 8) & 255, tint & 255);
    cam.shake(200 + st * 100, 0.008 + st * 0.005);
    const star = this.img('spark', to.x, to.y).setTint(0xffffff);
    void this.tween({
      targets: star,
      scale: S * (4 + st),
      alpha: 0,
      duration: 360,
      ease: 'Stepped',
      easeParams: [5],
    }).then(() => star.destroy());
    for (let k = 0; k < 2 + st; k++)
      void this.wait(k * 90).then(() => this.bigRing(to, k % 2 ? 0xffffff : tint, 3 + k * 1.5));
    const shock = this.img('shock', to.x, to.y + 16 * S).setTint(tint);
    void this.tween({
      targets: shock,
      scaleX: S * (3 + st),
      alpha: 0,
      duration: 420,
      ease: 'Stepped',
      easeParams: [5],
    }).then(() => shock.destroy());
    this.scatter(BITS[el], to, 10 + st * 6, (26 + st * 6) * S, 6 * S);
    this.burst(to.x, to.y, tint, 'bt.fx.star', 14 + st * 6, -160);
    this.burst(to.x, to.y, 0xffffff, 'bt.fx.px', 20 + st * 6);
    await this.wait(260 + st * 70);
  }

  /** 大きく ひろがる 光の わ（to 倍まで） */
  private async bigRing(at: Pt, tint: number, to: number): Promise<void> {
    const im = this.img('ring', at.x, at.y).setTint(tint);
    await this.tween({
      targets: im,
      scale: S * to,
      alpha: 0,
      duration: 380,
      ease: 'Stepped',
      easeParams: [5],
    });
    im.destroy();
  }

  private async fireballs(from: Pt, to: Pt, n: number): Promise<void> {
    await Promise.all(
      Array.from({ length: n }, (_, i) =>
        this.fly(
          'fireball',
          from,
          { x: to.x + (i - (n - 1) / 2) * 6 * S, y: to.y },
          380,
          (16 + (i % 2) * 8) * S,
          i * 100,
          0,
          { scale: 1.6, trail: 'ember' },
        ).then((p) => {
          this.burst(p.x, p.y, ELEMENT_FX.hino, 'bt.fx.px', 14);
          this.impact(p, ELEMENT_FX.hino, true);
        }),
      ),
    );
  }

  private async water(from: Pt, to: Pt, n: number): Promise<void> {
    await Promise.all(
      Array.from({ length: n }, (_, i) =>
        this.fly(
          'drop',
          from,
          { x: to.x, y: to.y + ((i % 3) - 1) * 8 * S },
          420,
          (6 + (i % 3) * 4) * S,
          i * 60,
          3 * S,
          { scale: 1.4, trail: 'bubble' },
        ),
      ),
    );
    // 大きな 水しぶきの 柱
    for (const dx of [-12, 0, 12])
      this.burst(to.x + dx * S, to.y + 8 * S, ELEMENT_FX.mizu, 'bt.fx.px', 14, 420);
    await Promise.all([this.ringPop(to, 0x80c6ff), this.bigRing(to, 0xc8f4ff, 4)]);
  }

  private async leaves(to: Pt, n: number): Promise<void> {
    await Promise.all(
      Array.from({ length: n }, (_, i) => {
        const a0 = (i / n) * Math.PI * 2;
        const im = this.img('leaf', to.x, to.y).setScale(S * 1.5);
        return this.counter(620, (t) => {
          const r = 36 * S * (1 - t);
          const a = a0 + t * Math.PI * 3;
          im.setPosition(snap(to.x + Math.cos(a) * r), snap(to.y + Math.sin(a) * r * 0.6));
        }).then(() => im.destroy());
      }),
    );
    this.burst(to.x, to.y, ELEMENT_FX.mori, 'bt.fx.px', 22);
    this.scatter('leafbit', to, 14, 30 * S, 10 * S);
  }

  private async rocks(to: Pt, n: number): Promise<void> {
    await Promise.all(
      Array.from({ length: n }, async (_, i) => {
        const x = snap(to.x + (i - (n - 1) / 2) * 8 * S);
        const im = this.img('rock', x, to.y - 70 * S)
          .setScale(S * 1.4)
          .setVisible(false);
        await this.wait(i * 120);
        im.setVisible(true);
        await this.tween({ targets: im, y: snap(to.y + 4 * S), duration: 260, ease: 'Quad.easeIn' });
        im.destroy();
        this.scene.cameras.main.shake(120, 0.01);
        this.dust(x, to.y + 6 * S);
        this.burst(x, to.y, ELEMENT_FX.tsuchi, 'bt.fx.px', 8);
      }),
    );
    // さいごに 大きな 岩が ドーン
    const big = this.img('rock', to.x, to.y - 90 * S).setScale(S * 3);
    await this.tween({ targets: big, y: snap(to.y), duration: 300, ease: 'Quad.easeIn' });
    big.destroy();
    this.scene.cameras.main.shake(260, 0.02);
    for (const dx of [-16, 0, 16]) this.dust(to.x + dx * S, to.y + 8 * S);
    this.scatter('pebble', to, 12, 30 * S, 12 * S);
  }

  private async winds(to: Pt, n: number): Promise<void> {
    for (let i = 0; i < n; i++) {
      const dy = (i - (n - 1) / 2) * 8 * S;
      const im = this.img('wind', to.x + 30 * S, to.y - 18 * S + dy);
      await this.tween({
        targets: im,
        x: to.x - 30 * S,
        y: to.y + 12 * S + dy,
        duration: 170,
        ease: 'Stepped',
        easeParams: [6],
      });
      im.destroy();
      this.burst(to.x, to.y + dy, ELEMENT_FX.kaze, 'bt.fx.px', 8);
    }
    // さいごに 大きな ×の 風の 刃
    await this.pop('diag', to, ELEMENT_FX.kaze, 2, 4, 160);
    await this.pop('diag', to, 0xffffff, 2, 4, 160, true);
    this.scatter('gust', to, 10, 30 * S);
  }

  private async pillar(to: Pt, n = 1): Promise<void> {
    // まわりに 小さな 光の 柱が 先に おりて、さいごに まん中へ 太い 柱
    const side = Math.max(0, n - 2);
    await Promise.all(
      Array.from({ length: side }, (_, i) => {
        const dx = (i % 2 ? 1 : -1) * (14 + Math.floor(i / 2) * 10) * S;
        const b = this.img('beam', to.x + dx, to.y + 10 * S).setOrigin(0.5, 1);
        b.setScale(S * 0.6, 0);
        return this.wait(i * 90)
          .then(() =>
            this.tween({
              targets: b,
              scaleY: (to.y + 10 * S) / 48,
              duration: 160,
              ease: 'Stepped',
              easeParams: [4],
            }),
          )
          .then(() => this.tween({ targets: b, alpha: 0, duration: 200 }))
          .then(() => b.destroy());
      }),
    );
    const im = this.img('beam', to.x, to.y + 10 * S).setOrigin(0.5, 1);
    im.setScale(S * 1.6, 0);
    await this.tween({
      targets: im,
      scaleY: (to.y + 10 * S) / 48,
      duration: 220,
      ease: 'Stepped',
      easeParams: [5],
    });
    this.scene.cameras.main.flash(120, 255, 243, 163);
    this.burst(to.x, to.y, ELEMENT_FX.hikari, 'bt.fx.star', 16, -120);
    await this.tween({
      targets: im,
      alpha: 0,
      scaleX: S * 3.5,
      duration: 300,
      ease: 'Stepped',
      easeParams: [4],
    });
    im.destroy();
  }

  private async orbs(to: Pt, n: number): Promise<void> {
    await Promise.all(
      Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + 0.4;
        const im = this.img('orb', to.x + Math.cos(a) * 40 * S, to.y + Math.sin(a) * 26 * S).setScale(
          S * 1.5,
        );
        return this.tween({
          targets: im,
          x: to.x,
          y: to.y,
          duration: 380,
          delay: i * 60,
          ease: 'Quad.easeIn',
        }).then(() => im.destroy());
      }),
    );
    // やみが ちぢんで（すいこむ わ）から はじける
    const hole = this.img('ring', to.x, to.y)
      .setTint(0x3a2672)
      .setScale(S * 5);
    await this.tween({ targets: hole, scale: S * 0.5, duration: 260, ease: 'Quad.easeIn' });
    hole.destroy();
    this.burst(to.x, to.y, ELEMENT_FX.yami, 'bt.fx.px', 30);
    this.scatter('wisp', to, 12, 30 * S, 8 * S);
    await Promise.all([this.ringPop(to, 0xa28be6), this.bigRing(to, 0x6e4fc4, 5)]);
  }

  private async sparkles(to: Pt, n: number): Promise<void> {
    for (let i = 0; i < n; i++) {
      this.impact({ x: to.x + (i % 2 ? 8 : -8) * S, y: to.y + (i - 1) * 6 * S }, 0xffffff, i === n - 1);
      await this.wait(90);
    }
  }

  // ───────────────────────── 体の 動き ─────────────────────────

  /** さっと つっこんで もどる（dx の 向きへ） */
  async dash(sp: Actor, dx: number): Promise<void> {
    const x0 = sp.x;
    await this.tween({ targets: sp, x: x0 + dx, duration: 130, ease: 'Quad.easeIn' });
    await this.tween({ targets: sp, x: x0, duration: 200, ease: 'Quad.easeOut' });
  }

  /** とびあがって ドシン（大きい ボス）。着地で 画面が ゆれて 土けむり */
  async stomp(sp: Actor, dx: number, baseY: number): Promise<void> {
    const x0 = sp.x;
    await this.tween({ targets: sp, y: baseY - 24 * S, x: x0 + dx / 2, duration: 240, ease: 'Quad.easeOut' });
    await this.tween({ targets: sp, y: baseY, x: x0 + dx, duration: 150, ease: 'Quad.easeIn' });
    this.scene.cameras.main.shake(220, 0.012);
    this.dust(x0 + dx - 10 * S, baseY);
    this.dust(x0 + dx + 10 * S, baseY);
    await this.tween({ targets: sp, x: x0, duration: 260, ease: 'Quad.easeOut' });
  }

  /** x へ 山なりに とぶ（高さ h）。着地は baseY */
  hopTo(sp: Actor, x: number, baseY: number, h: number, ms: number): Promise<void> {
    const x0 = sp.x;
    return this.counter(ms, (t) => {
      sp.x = snap(x0 + (x - x0) * t);
      sp.y = snap(baseY - Math.sin(Math.PI * t) * h);
    }).then(() => {
      sp.x = x;
      sp.y = baseY;
    });
  }

  /** その場で 小さく ジャンプ（必殺技を うつ前の ため） */
  hop(sp: Actor, baseY: number): Promise<void> {
    return this.hopTo(sp, sp.x, baseY, 6 * S, 180);
  }

  // ───────────────────────── 当たったとき・ため・斬撃 ─────────────────────────

  /** 味方の こうげきが 敵に 当たった：星・光の わ・属性の かけら。会心は 大きな ×印も */
  hit(at: Pt, el: Element, critical: boolean): void {
    const tint = ELEMENT_FX[el];
    this.impact(at, tint, critical);
    void this.ringPop(at, tint);
    this.scatter(BITS[el], at, critical ? 10 : 6, (critical ? 22 : 15) * S);
    if (critical) void this.pop('cross', at, 0xffffff, 1, 2, 260);
  }

  /** 敵の こうげきが 味方に 当たった：こうげきの しかたで ちがう しるし＋敵の 属性の かけら */
  enemyHit(at: Pt, style: EnemyStyle, el: Element): void {
    const tint = ELEMENT_FX[el];
    if (style === 'claw') void this.pop('claw', at, tint, 1, 1, 260);
    else if (style === 'bite') void this.bite(at, tint);
    else if (style === 'bash') {
      this.impact(at, tint, true);
      this.dust(at.x, at.y + 10 * S);
    } else if (style === 'quake') this.quake({ x: at.x, y: at.y + 14 * S }, tint);
    else void this.ringPop(at, tint);
    this.scatter(BITS[el], at, style === 'skill' ? 8 : 5, 12 * S);
  }

  /** 必殺技の ため：属性の かけらが まわりから あつまり、光の わが ちぢまって ぱっと 光る */
  async charge(at: Pt, el: Element, stars: number): Promise<void> {
    const tint = ELEMENT_FX[el];
    const n = 4 + stars * 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const im = this.img(BITS[el], at.x + Math.cos(a) * 20 * S, at.y + Math.sin(a) * 14 * S);
      void this.tween({
        targets: im,
        x: snap(at.x),
        y: snap(at.y),
        alpha: 0.3,
        duration: 260,
        delay: i * 18,
        ease: 'Stepped',
        easeParams: [4],
      }).then(() => im.destroy());
    }
    const ring = this.img('ring', at.x, at.y)
      .setTint(tint)
      .setScale(S * 3);
    await this.tween({
      targets: ring,
      scale: S,
      alpha: 0.4,
      duration: 300,
      ease: 'Stepped',
      easeParams: [5],
    });
    ring.destroy();
    this.impact(at, tint, false);
  }

  /** 主人公の 斬撃：二連（ななめ 2 本で ×）・つき（横に のびる 光）・回転切り（まわる 円） */
  async swing(kind: SwingKind, at: Pt, tint: number): Promise<void> {
    if (kind === 'cross') {
      await this.pop('diag', at, tint, 1, 2, 140);
      await this.pop('diag', at, tint, 1, 2, 140, true);
      void this.pop('cross', at, 0xffffff, 1, 2, 200);
    } else if (kind === 'thrust') {
      const im = this.img('thrust', at.x + 36 * S, at.y).setTint(tint);
      await this.tween({
        targets: im,
        x: snap(at.x - 6 * S),
        duration: 120,
        ease: 'Stepped',
        easeParams: [4],
      });
      await this.tween({
        targets: im,
        alpha: 0,
        scaleY: S * 2,
        duration: 140,
        ease: 'Stepped',
        easeParams: [3],
      });
      im.destroy();
      void this.ringPop(at, tint);
    } else {
      const im = this.img('spin', at.x, at.y).setTint(tint);
      for (let f = 0; f < 6; f++) {
        im.setFlipX(f % 2 === 1).setFlipY(f % 4 >= 2);
        await this.wait(55);
      }
      await this.tween({
        targets: im,
        alpha: 0,
        scale: S * 2,
        duration: 160,
        ease: 'Stepped',
        easeParams: [3],
      });
      im.destroy();
    }
  }

  // ───────────────────────── 光の わ・星 ─────────────────────────

  /** 回復：光の わが ひろがって きえる */
  healRing(at: Pt, tint: number): void {
    void this.ringPop({ x: at.x, y: at.y + 8 * S }, tint);
  }

  /** まもり：光の わが 2 回 光る */
  async guardRing(at: Pt, tint: number): Promise<void> {
    const im = this.img('ring', at.x, at.y)
      .setTint(tint)
      .setScale(S * 2);
    await this.tween({ targets: im, alpha: 0.2, duration: 120, yoyo: true, repeat: 1, ease: 'Stepped' });
    im.destroy();
  }

  /** ヒット：星が ぱっと 光る */
  impact(at: Pt, tint: number, big: boolean): void {
    const im = this.img('spark', at.x, at.y).setTint(tint);
    void this.tween({
      targets: im,
      scale: S * (big ? 3 : 2),
      alpha: 0,
      duration: big ? 260 : 180,
      ease: 'Stepped',
      easeParams: [4],
    }).then(() => im.destroy());
  }

  // ───────────────────────── 道具 ─────────────────────────

  /** その場で ぱっと 出して 消す（大きさは S の from 倍 → to 倍。flip で 左右反転） */
  private async pop(
    kind: FxKind,
    at: Pt,
    tint: number,
    from: number,
    to: number,
    ms: number,
    flip = false,
  ): Promise<void> {
    const im = this.img(kind, at.x, at.y)
      .setTint(tint)
      .setScale(S * from)
      .setFlipX(flip);
    await this.tween({
      targets: im,
      scale: S * to,
      alpha: 0,
      duration: ms,
      ease: 'Stepped',
      easeParams: [4],
    });
    im.destroy();
  }

  /** かみつき：上と 下の あごが とじて、星が 光る */
  private async bite(at: Pt, tint: number): Promise<void> {
    const im = this.img('bite', at.x, at.y)
      .setTint(tint)
      .setScale(S, S * 2);
    await this.tween({ targets: im, scaleY: S / 2, duration: 120, ease: 'Stepped', easeParams: [3] });
    this.impact(at, tint, false);
    await this.tween({ targets: im, alpha: 0, duration: 120 });
    im.destroy();
  }

  /** 地ひびき：足もとに たいらな 光の わが ひろがって、小石が はねる */
  private quake(at: Pt, tint: number): void {
    const im = this.img('shock', at.x, at.y).setTint(tint);
    void this.tween({
      targets: im,
      scaleX: S * 2,
      alpha: 0,
      duration: 320,
      ease: 'Stepped',
      easeParams: [4],
    }).then(() => im.destroy());
    this.scatter('pebble', at, 4, 10 * S, 8 * S);
  }

  /** かけらを まわりに ちらす（角度は 順に ずらす。乱数は つかわない） */
  private scatter(kind: FxKind, at: Pt, n: number, dist: number, rise = 0): void {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3;
      const d = dist * (0.6 + ((i * 7) % 5) * 0.1);
      const im = this.img(kind, at.x, at.y);
      void this.tween({
        targets: im,
        x: snap(at.x + Math.cos(a) * d),
        y: snap(at.y + Math.sin(a) * d * 0.7 - rise),
        alpha: 0,
        duration: 300 + (i % 3) * 60,
        ease: 'Stepped',
        easeParams: [5],
      }).then(() => im.destroy());
    }
  }

  private dust(x: number, y: number): void {
    const im = this.img('dust', x, y);
    void this.tween({
      targets: im,
      y: y - 6 * S,
      alpha: 0,
      duration: 360,
      ease: 'Stepped',
      easeParams: [4],
    }).then(() => im.destroy());
  }

  private async ringPop(at: Pt, tint: number): Promise<void> {
    const im = this.img('ring', at.x, at.y).setTint(tint);
    await this.tween({
      targets: im,
      scale: S * 3,
      alpha: 0,
      duration: 320,
      ease: 'Stepped',
      easeParams: [4],
    });
    im.destroy();
  }

  /** from から to へ とばす。arc は 山の 高さ、wave は 上下の ゆれ。着いた 場所を かえす */
  private fly(
    kind: FxKind,
    from: Pt,
    to: Pt,
    ms: number,
    arc: number,
    delay = 0,
    wave = 0,
    opt: { scale?: number; trail?: FxKind } = {},
  ): Promise<Pt> {
    const im = this.img(kind, from.x, from.y)
      .setScale(S * (opt.scale ?? 1))
      .setVisible(false);
    let last = -1;
    return this.wait(delay)
      .then(() => {
        im.setVisible(true);
        return this.counter(ms, (t) => {
          const x = from.x + (to.x - from.x) * t;
          const y =
            from.y + (to.y - from.y) * t - Math.sin(Math.PI * t) * arc + Math.sin(t * Math.PI * 4) * wave;
          im.setPosition(snap(x), snap(y));
          // とんだ あとに のこる かけら（火の粉・あわ）
          const step = Math.floor(t * 10);
          if (opt.trail && step !== last) {
            last = step;
            const tr = this.img(opt.trail, x, y);
            void this.tween({ targets: tr, alpha: 0, y: tr.y - 3 * S, duration: 260 }).then(() =>
              tr.destroy(),
            );
          }
        });
      })
      .then(() => {
        im.destroy();
        return to;
      });
  }

  private img(kind: FxKind, x: number, y: number): Phaser.GameObjects.Image {
    const key = `bt.fx.${kind}`;
    addImage(this.scene.textures, key, fxArt(kind));
    return this.scene.add.image(snap(x), snap(y), key).setScale(S).setDepth(24);
  }

  private counter(ms: number, onUpdate: (t: number) => void): Promise<void> {
    return new Promise((resolve) =>
      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: ms,
        onUpdate: (tw) => onUpdate(tw.getValue() ?? 0),
        onComplete: () => resolve(),
      }),
    );
  }

  private tween(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => this.scene.tweens.add({ ...cfg, onComplete: () => resolve() }));
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.scene.time.delayedCall(ms, () => resolve()));
  }
}
