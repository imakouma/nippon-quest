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

const firstSlice = ['aichi-denkikun', 'aichi-lastboss-oda-nobunaga', 'aichi-tebasakky'] as const;

for (const id of firstSlice) {
  test(`${id} のシートを読み込み待機コマを再生する`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(`/?debug=battle&enemy=${id}&lv=5`, { waitUntil: 'networkidle' });
    await expect(page.locator('[role="meter"]').first()).toBeVisible({ timeout: 60_000 });
    const initial = await page.evaluate(() => {
      const sprite = (window.__nq.scene.getScene('Battle') as Battle).enemySprite;
      const frames: string[] = [];
      sprite.on('animationupdate', () => frames.push(sprite.frame.name));
      sprite.setData('batch04Frames', frames);
      return { key: sprite.texture.key, width: sprite.displayWidth, height: sprite.displayHeight };
    });
    expect(initial.key).toBe(`mon.animation.${id}.v1`);
    expect(initial.width).toBeLessThanOrEqual(192);
    expect(initial.height).toBeLessThanOrEqual(192);
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const sprite = (window.__nq.scene.getScene('Battle') as Battle).enemySprite;
            return new Set(sprite.getData('batch04Frames') as string[]).size;
          }),
        { timeout: 30_000 },
      )
      .toBeGreaterThan(2);
  });
}

for (const viewport of [
  { width: 960, height: 540 },
  { width: 640, height: 360 },
]) {
  test(`batch-04 攻撃・わざ・復帰・KO ${viewport.width}`, async ({ page }, info) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/?debug=battle&enemy=aichi-denkikun&lv=5', { waitUntil: 'networkidle' });
    await expect(page.locator('[role="meter"]').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.nq-box')).toBeVisible({ timeout: 60_000 });
    await page.evaluate(() => {
      const battle = window.__nq.scene.getScene('Battle') as Battle;
      const animations: string[] = [];
      battle.enemySprite.on('animationstart', (animation: Phaser.Animations.Animation) =>
        animations.push(animation.key),
      );
      battle.enemySprite.setData('batch04Animations', animations);
    });
    await page.locator('.nq-box').click();
    await page.evaluate(() => {
      const battle = window.__nq.scene.getScene('Battle') as Battle;
      battle.askSkill = async () => ({ score: 0.6, timeMs: 1000, attempts: 1 });
      battle.state.ally.hero.hp = 1000;
      battle.state.seed = 'batch-04-animation-78';
      battle.state.rngState = undefined;
      battle.state.enemy.skills = [];
    });
    await page.locator('.nq-cmd[data-cmd="skill"]').click();
    await page.locator('[data-skill]:not(.nq-opt-off)').first().click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window.__nq.scene.getScene('Battle') as Battle).enemySprite.getData('batch04Animations'),
        ),
      )
      .toContain('mon.animation.aichi-denkikun.v1.attack');
    await expect
      .poll(
        () =>
          page.evaluate(
            () => (window.__nq.scene.getScene('Battle') as Battle).enemySprite.anims.currentAnim?.key,
          ),
        { timeout: 30_000 },
      )
      .toBe('mon.animation.aichi-denkikun.v1.idle');
    const attacks = await page.evaluate(async () => {
      const battle = window.__nq.scene.getScene('Battle') as Battle;
      const animations = battle.enemySprite.getData('batch04Animations') as string[];
      const before = animations.filter((key) => key.endsWith('.attack')).length;
      const skillId = battle.content.monsters
        .get('aichi-denkikun')!
        .skills.find((id) => battle.content.skills.get(id)?.effect === 'damage')!;
      await battle.animate({
        t: 'act',
        side: 'enemy',
        actorId: battle.state.enemy.id,
        command: 'skill',
        skillId,
      });
      return { before, after: animations.filter((key) => key.endsWith('.attack')).length };
    });
    expect(attacks.after).toBeGreaterThan(attacks.before);
    await page.screenshot({ path: info.outputPath('attack-recovered.png') });
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
