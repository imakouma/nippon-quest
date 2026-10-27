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

const monsters = [
  'aomori-bunakko',
  'aomori-doguukun',
  'aomori-himemassu',
  'aomori-kokeppi',
  'aomori-magurodo',
  'aomori-nebutan',
  'iwate-kagurabi',
  'iwate-izumiko',
  'iwate-kodamaru',
] as const;

for (const viewport of [
  { width: 960, height: 540 },
  { width: 640, height: 360 },
]) {
  for (const monsterId of monsters) {
    test(`${monsterId} は待機・通常攻撃・わざ・KOを再生する ${viewport.width}`, async ({ page }, info) => {
      test.setTimeout(120_000);
      await page.setViewportSize(viewport);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => {
        if (response.url().includes('/sprites/animations/') && !response.ok())
          errors.push(`${response.status()} ${response.url()}`);
      });

      await page.goto(`/?debug=battle&enemy=${monsterId}&lv=5`);
      await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
      const initial = await page.evaluate((id) => {
        const battle = window.__nq.scene.getScene('Battle') as Battle;
        const sprite = battle.enemySprite;
        const source = sprite.texture.getSourceImage() as HTMLImageElement;
        const canvas = document.createElement('canvas');
        canvas.width = source.width;
        canvas.height = source.height;
        canvas.getContext('2d')!.drawImage(source, 0, 0);
        const frames: string[] = [];
        const animations: string[] = [];
        sprite.on('animationupdate', () => frames.push(sprite.frame.name));
        sprite.on('animationstart', (animation: Phaser.Animations.Animation) =>
          animations.push(animation.key),
        );
        sprite.setData('observedFrames', frames);
        sprite.setData('observedAnimations', animations);
        return {
          key: sprite.texture.key,
          width: sprite.displayWidth,
          height: sprite.displayHeight,
          alpha: canvas.getContext('2d')!.getImageData(0, 0, 1, 1).data[3],
          expectedKey: `mon.animation.${id}.v1`,
        };
      }, monsterId);
      expect(initial.key).toBe(initial.expectedKey);
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
      await page.screenshot({ path: info.outputPath(`${monsterId}-idle.png`) });

      await page.locator('.nq-box').click();
      await page.evaluate(() => {
        const battle = window.__nq.scene.getScene('Battle') as Battle;
        battle.askSkill = async () => ({ score: 0.6, timeMs: 1000, attempts: 1 });
        battle.state.ally.hero.hp = 1000;
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
        .toContain(`mon.animation.${monsterId}.v1.attack`);
      await expect
        .poll(() =>
          page.evaluate(() => {
            const sprite = (window.__nq.scene.getScene('Battle') as Battle).enemySprite;
            return sprite.anims.currentAnim?.key;
          }),
        )
        .toBe(`mon.animation.${monsterId}.v1.idle`);

      const skillAttacks = await page.evaluate(async (id) => {
        const battle = window.__nq.scene.getScene('Battle') as Battle;
        const sprite = battle.enemySprite;
        const count = () =>
          (sprite.getData('observedAnimations') as string[]).filter((key) => key.endsWith('.attack')).length;
        const before = count();
        const monster = battle.content.monsters.get(id)!;
        const skillId =
          monster.skills.find((candidate) => battle.content.skills.get(candidate)?.effect === 'damage') ??
          'sk-hinoko';
        await battle.animate({
          t: 'act',
          side: 'enemy',
          actorId: battle.state.enemy.id,
          command: 'skill',
          skillId,
        });
        return { before, after: count() };
      }, monsterId);
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
