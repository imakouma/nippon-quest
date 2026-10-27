import { expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import type { BattleEvent, BattleState } from '../../src/core/battle/types';

type Battle = Phaser.Scene & {
  enemySprite: Phaser.GameObjects.Sprite;
  state: BattleState;
  askSkill(): Promise<{ score: number; timeMs: number; attempts: number }>;
  animate(event: BattleEvent): Promise<void>;
};

const monsters = ['aichi-denkou-giku', 'aichi-midboss-tokoname-neko', 'akita-akitainu'] as const;

for (const viewport of [
  { width: 960, height: 540 },
  { width: 640, height: 360 },
]) {
  for (const monsterId of monsters) {
    test(`${monsterId} animates idle, attacks, recovers, and stops on KO at ${viewport.width}`, async ({
      page,
    }) => {
      test.setTimeout(120_000);
      await page.setViewportSize(viewport);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => {
        if (response.url().includes('/sprites/animations/') && !response.ok())
          errors.push(`${response.status()} ${response.url()}`);
      });

      await page.goto(`/?debug=battle&enemy=${monsterId}&lv=5`);
      await page.waitForFunction(() => window.__nq?.scene.isActive('Battle'), undefined, {
        timeout: 60_000,
      });
      const initial = await page.evaluate((id) => {
        const battle = window.__nq.scene.getScene('Battle') as Battle;
        const sprite = battle.enemySprite;
        const frames: string[] = [];
        const animations: string[] = [];
        sprite.on(
          'animationupdate',
          (_animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) =>
            frames.push(String(frame.textureFrame)),
        );
        sprite.on('animationstart', (animation: Phaser.Animations.Animation) =>
          animations.push(animation.key),
        );
        sprite.setData('observedFrames', frames);
        sprite.setData('observedAnimations', animations);
        sprite.play(sprite.getData('monsterIdle') as string, true);
        return {
          key: sprite.texture.key,
          expected: `mon.animation.${id}.v1`,
          width: sprite.displayWidth,
          height: sprite.displayHeight,
        };
      }, monsterId);
      expect(initial.key).toBe(initial.expected);
      // Mid-boss display scale is intentionally larger than ordinary monsters.
      expect(initial.width).toBeLessThanOrEqual(160);
      expect(initial.height).toBeLessThanOrEqual(160);

      const normalAttack = await page.evaluate(async () => {
        const battle = window.__nq.scene.getScene('Battle') as Battle;
        const sprite = battle.enemySprite;
        const count = () =>
          (sprite.getData('observedAnimations') as string[]).filter((key) => key.endsWith('.attack'))
            .length;
        const before = count();
        await battle.animate({
          t: 'act',
          side: 'enemy',
          actorId: battle.state.enemy.id,
          command: 'attack',
        });
        return { before, after: count() };
      });
      expect(normalAttack.after).toBeGreaterThan(normalAttack.before);
      await expect
        .poll(() =>
          page.evaluate(() => {
            const sprite = (window.__nq.scene.getScene('Battle') as Battle).enemySprite;
            return sprite.anims.currentAnim?.key;
          }),
        )
        .toBe(`mon.animation.${monsterId}.v1.idle`);
      await expect
        .poll(() =>
          page.evaluate(() => {
            const sprite = (window.__nq.scene.getScene('Battle') as Battle).enemySprite;
            return new Set(sprite.getData('observedFrames') as string[]).size;
          }),
        )
        .toBeGreaterThan(2);

      const skillAttacks = await page.evaluate(async () => {
        const battle = window.__nq.scene.getScene('Battle') as Battle;
        const sprite = battle.enemySprite;
        const count = () =>
          (sprite.getData('observedAnimations') as string[]).filter((key) => key.endsWith('.attack')).length;
        const before = count();
        await battle.animate({
          t: 'act',
          side: 'enemy',
          actorId: battle.state.enemy.id,
          command: 'skill',
          // A known damaging skill proves the attack-skill rendering path even for
          // monsters whose own current move list contains only support skills.
          skillId: 'sk-tashizan-giri',
        });
        return { before, after: count() };
      });
      expect(skillAttacks.after).toBeGreaterThan(skillAttacks.before);

      await page.evaluate(async () => {
        const battle = window.__nq.scene.getScene('Battle') as Battle;
        await battle.animate({ t: 'ko', side: 'enemy', targetId: battle.state.enemy.id });
      });
      expect(
        await page.evaluate(() => {
          const sprite = (window.__nq.scene.getScene('Battle') as Battle).enemySprite;
          return { playing: sprite.anims.isPlaying, alpha: sprite.alpha };
        }),
      ).toEqual({ playing: false, alpha: 0 });
      expect(errors).toEqual([]);
    });
  }
}
