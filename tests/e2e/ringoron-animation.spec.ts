import { expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import type { BattleEvent, BattleState } from '../../src/core/battle/types';
import type { ContentIndex } from '../../src/core/content/loader';

type Battle = Phaser.Scene & {
  enemySprite: Phaser.GameObjects.Sprite;
  state: BattleState;
  content: ContentIndex;
  askSkill(): Promise<{ score: number; timeMs: number; attempts: number }>;
  animate(event: BattleEvent): Promise<void>;
};

for (const viewport of [
  { width: 960, height: 540 },
  { width: 640, height: 360 },
]) {
  test(`リンゴロンの待機と実際の攻撃がコマ再生される ${viewport.width}`, async ({ page }, info) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.url().includes('/sprites/animations/') && !response.ok())
        errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto('/?debug=battle&enemy=aomori-ringoron&lv=5');
    await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
    const initial = await page.evaluate(() => {
      const battle = window.__nq.scene.getScene('Battle') as Battle;
      const sprite = battle.enemySprite;
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(sprite.texture.getSourceImage() as HTMLImageElement, 0, 0);
      const frames: string[] = [];
      const animations: string[] = [];
      sprite.on('animationupdate', () => frames.push(sprite.frame.name));
      sprite.on('animationstart', (animation: Phaser.Animations.Animation) => animations.push(animation.key));
      sprite.setData('observedFrames', frames);
      sprite.setData('observedAnimations', animations);
      return {
        key: sprite.texture.key,
        width: sprite.displayWidth,
        height: sprite.displayHeight,
        alpha: ctx.getImageData(0, 0, 1, 1).data[3],
      };
    });
    expect(initial.key).toBe('mon.animation.aomori-ringoron.v1');
    expect(initial.alpha).toBe(0);
    expect(initial.width).toBeLessThanOrEqual(96);
    expect(initial.height).toBeLessThanOrEqual(96);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const sprite = (window.__nq.scene.getScene('Battle') as Battle).enemySprite;
          return new Set(sprite.getData('observedFrames') as string[]).size;
        }),
      )
      .toBeGreaterThan(2);
    await page.screenshot({ path: info.outputPath('idle.png') });
    await page.locator('.nq-box').click();
    // 出題内容には依存せず、UIから選んだ実際のターンを進める。
    await page.evaluate(() => {
      const battle = window.__nq.scene.getScene('Battle') as Battle;
      battle.askSkill = async () => ({ score: 0.6, timeMs: 1000, attempts: 1 });
      battle.state.ally.hero.hp = 1000;
      // このシードでは序盤30抽選が0.9未満。敵の防御分岐を除き通常攻撃を確実に検証する。
      battle.state.seed = 'ringoron-animation-78';
      battle.state.rngState = undefined;
      battle.state.enemy.skills = [];
    });
    await page.locator('.nq-cmd[data-cmd="skill"]').click();
    await page.locator('[data-skill]:not(.nq-opt-off)').first().click();
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const sprite = (window.__nq.scene.getScene('Battle') as Battle).enemySprite;
            return sprite.getData('observedAnimations') as string[];
          }),
        { timeout: 30_000 },
      )
      .toContain('mon.animation.aomori-ringoron.v1.attack');
    await expect
      .poll(() =>
        page.evaluate(() => {
          const sprite = (window.__nq.scene.getScene('Battle') as Battle).enemySprite;
          return sprite.anims.currentAnim?.key;
        }),
      )
      .toBe('mon.animation.aomori-ringoron.v1.idle');
    await page.screenshot({ path: info.outputPath('after-attack.png') });
    // 通常攻撃だけでなく、実際のわざ演出経路でも差分を再生する。
    const attacks = await page.evaluate(async () => {
      const battle = window.__nq.scene.getScene('Battle') as Battle;
      const sprite = battle.enemySprite;
      const count = () =>
        (sprite.getData('observedAnimations') as string[]).filter((key) => key.endsWith('.attack')).length;
      const before = count();
      const skillId = battle.content.monsters.get('aomori-ringoron')!.skills[0]!;
      await battle.animate({
        t: 'act',
        actionId: 'turn:1:action:0',
        side: 'enemy',
        actorId: battle.state.enemy.id,
        targetIds: [battle.state.ally.hero.id],
        command: 'skill',
        skillId,
      });
      return { before, after: count() };
    });
    expect(attacks.after).toBeGreaterThan(attacks.before);
    await page.evaluate(async () => {
      const battle = window.__nq.scene.getScene('Battle') as Battle;
      await battle.animate({
        t: 'ko',
        actionId: 'turn:1:action:0',
        side: 'enemy',
        targetId: battle.state.enemy.id,
      });
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

test('シートの読み込み失敗でもリンゴロンの静止画で戦闘を続けられる', async ({ page }) => {
  await page.route('**/sprites/animations/aomori-ringoron-v1.png', (route) => route.abort());
  await page.goto('/?debug=battle&enemy=aomori-ringoron&lv=1');
  await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
  expect(
    await page.evaluate(() => (window.__nq.scene.getScene('Battle') as Battle).enemySprite.texture.key),
  ).toBe('mon.aomori-ringoron');
  await page.locator('.nq-box').click();
  await expect(page.locator('.nq-cmd[data-cmd="skill"]')).toBeVisible();
});
