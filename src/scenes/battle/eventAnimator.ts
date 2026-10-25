import type Phaser from 'phaser';
import type { Element, Monster, Skill } from '../../core/content/schemas';
import type { BattleEvent, BattleState } from '../../core/battle/types';
import type { EnemyView, PopupView } from '../../ui/battle/store';
import type { SfxName } from '../../ui/sfx';
import { BATTLE_POSE } from '../../rendering/characters';
import { ELEMENT_FX } from '../../rendering/battle/pixelArt';
import { BATTLE_SCALE as S, OFF_RIGHT, type BattleLayout } from './layout';
import type { EnemyStyle, MotifFx, Motions } from './motions';

type Sprite = Phaser.GameObjects.Image;
type VictoryEvent = Extract<BattleEvent, { t: 'victory' }>;

/** Phaser-backed operations used by BattleEvent presentation. */
export interface BattleEventAnimationPort {
  state(): BattleState;
  layout(): BattleLayout;
  enemyDefinition(): Monster;
  skill(id: string): Skill | undefined;
  allyElement(id: string): Element;
  monsterDefinition(id: string): Monster | undefined;
  tier(definition: Monster | undefined): number;
  motif(definition: Monster): MotifFx | null;
  lastEnemyStyle(): EnemyStyle;
  setLastElement(element: Element): void;
  lastElement(): Element;
  setLastMotif(motif: MotifFx | null): void;
  lastMotif(): MotifFx | null;
  sprites: {
    enemy(): Sprite;
    hero(): Sprite;
    partner(): Sprite | null;
    setPartner(sprite: Sprite | null): void;
    of(id: string): Sprite | null;
    anchor(id: string): { x: number; y: number };
    makePartner(x: number): Sprite | null;
    destroy(sprite: Sprite): void;
    walk(sprite: Sprite, x: number, ms: number): Promise<void>;
    stopBob(sprite: Sprite, baseY: number): void;
    idleBob(sprite: Sprite, baseY: number): void;
    flash(sprite: Sprite, color: number, times: number): Promise<void>;
    shake(sprite: Sprite, amount: number): Promise<void>;
    blink(sprite: Sprite): Promise<void>;
    knock(sprite: Sprite, dx: number): Promise<void>;
    tween(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void>;
    killTweens(sprite: Sprite): void;
    monsterTexture(definition: Monster, boss: boolean, suffix: string): string;
  };
  motion: {
    effects(): Motions;
    heroAttack(): Promise<void>;
    partnerAttack(sprite: Sprite): Promise<void>;
    enemyAttack(sprite: Sprite): Promise<void>;
    skill(
      actorId: string,
      enemySide: boolean,
      sprite: Sprite,
      stars: number,
      targetId: string | undefined,
      skill: Skill | undefined,
      tier: number,
      motif: MotifFx | null,
    ): Promise<void>;
  };
  hud: {
    popup(x: number, y: number, text: string, kind: PopupView['kind']): void;
    currentEnemyHp(): number;
    patchEnemy(patch: Partial<EnemyView>): void;
    patchAllyHp(id: string, delta: number): void;
    patchGauge(subject: string, value: number, gain?: number): void;
    setTurn(turn: number): void;
    showCombo(count: number, powerPercent: number): Promise<void>;
    sync(): void;
  };
  effects: {
    burst(x: number, y: number, tint: number, texture: string, count: number, gravityY?: number): void;
  };
  camera: {
    shake(duration: number, intensity: number): void;
    flash(duration: number, red: number, green: number, blue: number): void;
    fadeOut(duration: number, red: number, green: number, blue: number): void;
  };
  audio: {
    play(name: SfxName): void;
    finish(outcome: string): void;
  };
  clock: {
    wait(ms: number): Promise<void>;
  };
  setVictory(event: VictoryEvent): void;
}

/** BattleEvent-specific visual adapter; battle rules never enter this module. */
export class BattleEventAnimator {
  constructor(private readonly port: BattleEventAnimationPort) {}

  async play(event: BattleEvent, next?: BattleEvent): Promise<void> {
    const p = this.port;
    const state = p.state();
    const enemy = p.sprites.enemy();
    const hero = p.sprites.hero();
    const layout = p.layout();
    const fx = p.motion.effects();

    switch (event.t) {
      case 'act': {
        const targetId =
          next && (next.t === 'damage' || next.t === 'heal' || next.t === 'buff') ? next.targetId : undefined;
        const sprite = p.sprites.of(event.actorId);
        const skill = event.skillId ? p.skill(event.skillId) : undefined;
        const actorElement = event.side === 'enemy' ? state.enemy.element : p.allyElement(event.actorId);
        p.setLastElement(skill?.element ?? actorElement);
        const heroTurn = event.side === 'ally' && !event.auto;
        const definition = heroTurn ? undefined : p.monsterDefinition(event.actorId);
        p.setLastMotif(definition ? p.motif(definition) : null);
        if (!sprite) return;
        if (event.command === 'defend') {
          p.audio.play('buff');
          void fx.guardRing(p.sprites.anchor(event.actorId), 0x80c6ff);
          await p.sprites.flash(sprite, 0x80c6ff, 2);
        } else if (event.command === 'skill') {
          await p.motion.skill(
            heroTurn ? state.ally.hero.id : event.actorId,
            event.side === 'enemy',
            heroTurn ? hero : sprite,
            skill?.gauge ?? 1,
            targetId,
            skill,
            p.tier(definition),
            p.lastMotif(),
          );
        } else if (event.command === 'scan') {
          p.audio.play('scan');
          const anchor = p.sprites.anchor(state.enemy.id);
          p.effects.burst(anchor.x, anchor.y, 0xc8f4ff, 'bt.fx.star', 10, 0);
          await p.clock.wait(350);
        } else if (event.command === 'attack') {
          if (event.side === 'enemy') await p.motion.enemyAttack(sprite);
          else if (sprite === hero) await p.motion.heroAttack();
          else await p.motion.partnerAttack(sprite);
        }
        return;
      }
      case 'damage': {
        const big = event.critical || event.scoreBand === 'perfect';
        const target = event.side === 'enemy' ? enemy : p.sprites.of(event.targetId);
        const anchor =
          event.side === 'enemy' ? p.sprites.anchor(state.enemy.id) : p.sprites.anchor(event.targetId);
        if (event.side === 'enemy') {
          p.audio.play(big ? 'crit' : 'hit');
          p.effects.burst(
            anchor.x,
            anchor.y,
            ELEMENT_FX[p.lastElement()],
            big ? 'bt.fx.star' : 'bt.fx.px',
            big ? 18 : 14,
          );
          fx.hit(anchor, p.lastElement(), big);
          if (p.lastMotif()) fx.motifPop(anchor, p.lastMotif()!);
          if (big) p.camera.shake(120, 0.006);
          p.hud.popup(anchor.x, anchor.y, String(event.amount), big ? 'crit' : 'damage');
          p.hud.patchEnemy({ hp: Math.max(0, p.hud.currentEnemyHp() - event.amount) });
          await Promise.all([p.sprites.flash(enemy, 0xffffff, 2), p.sprites.shake(enemy, big ? 16 : 10)]);
        } else {
          p.audio.play('hurt');
          p.camera.shake(180, 0.008);
          fx.enemyHit(anchor, p.lastEnemyStyle(), state.enemy.element);
          if (p.lastMotif()) fx.motifPop(anchor, p.lastMotif()!);
          p.hud.popup(anchor.x, anchor.y, String(event.amount), 'hurt');
          p.hud.patchAllyHp(event.targetId, -event.amount);
          if (target) {
            const isHero = target === hero;
            if (isHero) target.setFrame(BATTLE_POSE.hurt);
            await Promise.all([p.sprites.blink(target), p.sprites.knock(target, 12)]);
            if (isHero && state.ally.hero.hp > 0) target.setFrame(BATTLE_POSE.idle);
          }
        }
        await p.clock.wait(big ? 300 : 220);
        return;
      }
      case 'heal': {
        p.audio.play('heal');
        const anchor = p.sprites.anchor(event.targetId);
        p.effects.burst(anchor.x, anchor.y + 30, 0x8fe36f, 'bt.fx.star', 12, -160);
        fx.healRing(anchor, 0x8fe36f);
        p.hud.popup(anchor.x, anchor.y, `+${event.amount}`, 'heal');
        if (event.side === 'enemy')
          p.hud.patchEnemy({ hp: Math.min(state.enemy.stats.hp, p.hud.currentEnemyHp() + event.amount) });
        else p.hud.patchAllyHp(event.targetId, event.amount);
        await p.clock.wait(500);
        return;
      }
      case 'buff': {
        p.audio.play(event.mult >= 1 ? 'buff' : 'miss');
        const sprite = event.side === 'enemy' ? enemy : p.sprites.of(event.targetId);
        const anchor =
          event.side === 'enemy' ? p.sprites.anchor(state.enemy.id) : p.sprites.anchor(event.targetId);
        p.effects.burst(
          anchor.x,
          anchor.y,
          event.mult >= 1 ? 0x80c6ff : 0xa28be6,
          'bt.fx.px',
          10,
          event.mult >= 1 ? -200 : 200,
        );
        if (event.mult >= 1) void fx.guardRing(anchor, 0x80c6ff);
        if (event.side === 'enemy') p.hud.patchEnemy({ defMult: event.mult });
        if (sprite) await p.sprites.flash(sprite, event.mult >= 1 ? 0x80c6ff : 0xa28be6, 1);
        return;
      }
      case 'status': {
        p.audio.play('scan');
        const anchor = p.sprites.anchor(state.enemy.id);
        p.effects.burst(anchor.x, anchor.y, 0x80c6ff, 'bt.fx.star', 12, 60);
        void fx.guardRing(anchor, 0x80c6ff);
        await p.sprites.flash(enemy, 0x80c6ff, 2);
        return;
      }
      case 'weaknessRevealed':
        p.audio.play('scan');
        p.hud.patchEnemy({ weaknessRevealed: true, weakness: event.element });
        await p.sprites.flash(enemy, ELEMENT_FX[event.element], 3);
        return;
      case 'scanFailed':
      case 'gaugeShort':
        p.audio.play('miss');
        await p.clock.wait(200);
        return;
      case 'turnStart':
        p.hud.setTurn(event.turn);
        return;
      case 'skipTurn':
        p.audio.play('miss');
        void fx.guardRing(p.sprites.anchor(event.targetId), 0x80c6ff);
        await p.sprites.shake(enemy, 6);
        return;
      case 'combo':
        p.audio.play('combo');
        await p.hud.showCombo(event.count, Math.round((event.bonus - 1) * 100));
        return;
      case 'gaugeCharge':
        p.audio.play(event.unlocked.length > 0 || event.value >= event.max ? 'combo' : 'select');
        p.hud.patchGauge(event.subject, event.value, event.amount);
        await p.clock.wait(150);
        return;
      case 'gaugeUse':
        p.audio.play('buff');
        p.hud.patchGauge(event.subject, event.value);
        return;
      case 'itemUsed':
      case 'recruitGift':
        p.audio.play('select');
        return;
      case 'swap': {
        const old = p.sprites.partner();
        if (old) {
          await p.sprites.walk(old, OFF_RIGHT, 300);
          p.sprites.destroy(old);
        }
        p.sprites.setPartner(p.sprites.makePartner(OFF_RIGHT));
        p.hud.sync();
        const partner = p.sprites.partner();
        if (partner) {
          await p.sprites.walk(partner, layout.partner.x, 360);
          p.sprites.idleBob(partner, layout.partner.y);
        }
        return;
      }
      case 'recruitAttempt': {
        const anchor = p.sprites.anchor(state.enemy.id);
        p.effects.burst(anchor.x, anchor.y, 0xff8fb1, 'bt.fx.heart', 10, -80);
        p.audio.play(event.success ? 'recruit' : 'miss');
        if (!event.success) await p.sprites.shake(enemy, 8);
        await p.clock.wait(400);
        return;
      }
      case 'recruited': {
        const anchor = p.sprites.anchor(state.enemy.id);
        p.effects.burst(anchor.x, anchor.y, 0xff8fb1, 'bt.fx.heart', 18, -120);
        await p.sprites.tween({
          targets: enemy,
          y: layout.enemy.y - 26,
          duration: 160,
          yoyo: true,
          repeat: 1,
        });
        return;
      }
      case 'fleeAttempt':
        if (!event.success) {
          p.audio.play('miss');
          await p.sprites.shake(hero, 6);
          return;
        }
        p.audio.play('run');
        hero.setFlipX(true);
        await Promise.all(
          [hero, p.sprites.partner()]
            .filter((sprite): sprite is Sprite => !!sprite)
            .map((sprite) => p.sprites.walk(sprite, sprite.x + 420, 450)),
        );
        return;
      case 'ko': {
        p.audio.play('ko');
        if (event.side === 'enemy') {
          p.sprites.killTweens(enemy);
          enemy.setTintFill(0xffffff);
          const anchor = p.sprites.anchor(state.enemy.id);
          p.effects.burst(anchor.x, anchor.y + 20, 0xd2d7e2, 'bt.fx.px', 36, -140);
          await p.sprites.tween({
            targets: enemy,
            scaleY: 0,
            alpha: 0,
            duration: 700,
            ease: 'Stepped',
            easeParams: [7],
          });
        } else {
          const sprite = p.sprites.of(event.targetId);
          if (!sprite) return;
          const isHero = sprite === hero;
          p.sprites.stopBob(sprite, isHero ? layout.hero.y : layout.partner.y);
          if (isHero) sprite.setFrame(BATTLE_POSE.hurt);
          sprite.setTint(0x6b6f80);
          await p.sprites.tween({
            targets: sprite,
            alpha: isHero ? 0.7 : 0.3,
            y: sprite.y + 2 * S,
            duration: 320,
          });
        }
        return;
      }
      case 'bossPhase': {
        p.audio.play('crit');
        p.camera.flash(420, 229, 72, 77);
        p.camera.shake(420, 0.014);
        await p.sprites.shake(enemy, 14);
        enemy.setTexture(p.sprites.monsterTexture(p.enemyDefinition(), true, `.p${event.phaseIndex}`));
        p.hud.patchEnemy({ element: state.enemy.element });
        await p.sprites.flash(enemy, 0xffffff, 2);
        return;
      }
      case 'victory':
        p.setVictory(event);
        return;
      case 'defeat':
        p.audio.finish('defeat');
        p.camera.fadeOut(900, 0, 0, 0);
        await p.clock.wait(900);
        return;
      case 'fled':
        return;
    }
  }
}
