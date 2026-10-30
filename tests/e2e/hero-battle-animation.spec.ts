import { expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import type { BattleEvent, BattleState } from '../../src/core/battle/types';

type Battle = Phaser.Scene & {
  heroSprite: Phaser.GameObjects.Sprite;
  state: BattleState;
  animate(event: BattleEvent): Promise<void>;
  victoryPose(): Promise<void>;
};

for (const viewport of [
  { width: 960, height: 540 },
  { width: 844, height: 390 },
]) {
  test(`主人公は全バトル状態でドット絵を切り替える ${viewport.width}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/?debug=battle&enemy=aomori-ringoron&lv=5&resetSaves=1');
    await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
    const initial = await page.evaluate(() => {
      const battle = window.__nq.scene.getScene('Battle') as Battle;
      const sprite = battle.heroSprite;
      const frames = [sprite.frame.name];
      const animations: string[] = [];
      sprite.on('animationupdate', () => frames.push(sprite.frame.name));
      sprite.on('animationstart', (animation: Phaser.Animations.Animation) => animations.push(animation.key));
      sprite.setData('observedHeroFrames', frames);
      sprite.setData('observedHeroAnimations', animations);
      const bounds = sprite.getBounds();
      return {
        animation: sprite.anims.currentAnim?.key,
        texture: sprite.texture.key,
        bounds: { left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom },
        game: { width: battle.scale.width, height: battle.scale.height },
      };
    });

    expect(initial.animation).toBe(`${initial.texture}.anim.idle`);
    expect(initial.bounds.left).toBeGreaterThanOrEqual(0);
    expect(initial.bounds.top).toBeGreaterThanOrEqual(0);
    expect(initial.bounds.right).toBeLessThanOrEqual(initial.game.width);
    expect(initial.bounds.bottom).toBeLessThanOrEqual(initial.game.height);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const sprite = (window.__nq.scene.getScene('Battle') as Battle).heroSprite;
          return new Set(sprite.getData('observedHeroFrames') as string[]).size;
        }),
      )
      .toBeGreaterThan(1);
    await page.screenshot({ path: testInfo.outputPath('hero-idle.png') });

    await page.evaluate(async () => {
      const battle = window.__nq.scene.getScene('Battle') as Battle;
      const actionId = 'turn:1:action:0' as const;
      await battle.animate({
        t: 'act',
        actionId,
        side: 'ally',
        actorId: battle.state.ally.hero.id,
        targetIds: [battle.state.enemy.id],
        command: 'attack',
      });
    });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const sprite = (window.__nq.scene.getScene('Battle') as Battle).heroSprite;
          return sprite.anims.currentAnim?.key;
        }),
      )
      .toBe(initial.animation);

    await page.evaluate(async () => {
      const battle = window.__nq.scene.getScene('Battle') as Battle;
      await battle.victoryPose();
    });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const sprite = (window.__nq.scene.getScene('Battle') as Battle).heroSprite;
          return sprite.anims.currentAnim?.key.endsWith('.anim.victory');
        }),
      )
      .toBe(true);
    await page.screenshot({ path: testInfo.outputPath('hero-victory.png') });

    await page.evaluate(async () => {
      const battle = window.__nq.scene.getScene('Battle') as Battle;
      await battle.animate({
        t: 'damage',
        actionId: 'turn:1:action:1',
        side: 'ally',
        targetId: battle.state.ally.hero.id,
        amount: 1,
        critical: false,
        elementMult: 1,
        weakness: false,
        scoreBand: null,
        comboMult: 1,
      });
      await battle.animate({
        t: 'ko',
        actionId: 'turn:1:action:1',
        side: 'ally',
        targetId: battle.state.ally.hero.id,
      });
    });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const sprite = (window.__nq.scene.getScene('Battle') as Battle).heroSprite;
          return sprite.anims.isPlaying;
        }),
      )
      .toBe(false);
    const final = await page.evaluate(() => {
      const sprite = (window.__nq.scene.getScene('Battle') as Battle).heroSprite;
      return {
        animations: sprite.getData('observedHeroAnimations') as string[],
        current: sprite.anims.currentAnim?.key,
        playing: sprite.anims.isPlaying,
      };
    });
    expect(final.animations.some((key) => key.endsWith('.anim.attack'))).toBe(true);
    expect(final.animations.some((key) => key.endsWith('.anim.hurt'))).toBe(true);
    expect(final.animations.some((key) => key.endsWith('.anim.knockout'))).toBe(true);
    expect(final.current).toBe(`${initial.texture}.anim.knockout`);
    expect(final.playing).toBe(false);
    expect(errors).toEqual([]);
  });
}
