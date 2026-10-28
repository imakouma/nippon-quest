import { expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import type { BattleEvent, BattleState } from '../../src/core/battle/types';
import type { ContentIndex } from '../../src/core/content/loader';
import type { PixelBounds } from '../../src/rendering/monsterImageScale';

type Battle = Phaser.Scene & {
  enemySprite: Phaser.GameObjects.Sprite;
  state: BattleState;
  content: ContentIndex;
  askSkill(): Promise<{ score: number; timeMs: number; attempts: number }>;
  animate(event: BattleEvent): Promise<void>;
};

const monsters = ['aichi-arimatsu-zome', 'aichi-hatchon', 'aichi-miso-yagura'] as const;
const viewports = [
  { name: 'desktop', width: 960, height: 540 },
  { name: 'landscape-mobile', width: 640, height: 360 },
] as const;

for (const monsterId of monsters) {
  for (const viewport of viewports) {
    test(`${monsterId} の待機・通常攻撃・わざ・KOを再生する ${viewport.name}`, async ({ page }, info) => {
      test.setTimeout(300_000);
      await page.setViewportSize(viewport);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => {
        if (response.url().includes('/sprites/animations/batch-02/') && !response.ok())
          errors.push(`${response.status()} ${response.url()}`);
      });

      await page.goto(`/?debug=battle&enemy=${monsterId}&lv=5`);
      await expect(page.locator('.nq-box')).toBeVisible({ timeout: 180_000 });
      const initial = await page.evaluate((id) => {
        const battle = window.__nq.scene.getScene('Battle') as Battle;
        const sprite = battle.enemySprite;
        const frames: string[] = [];
        const animations: string[] = [];
        sprite.on('animationupdate', () => frames.push(sprite.frame.name));
        sprite.on('animationstart', (animation: Phaser.Animations.Animation) =>
          animations.push(animation.key),
        );
        sprite.setData('batch02ObservedFrames', frames);
        sprite.setData('batch02ObservedAnimations', animations);
        const bounds = sprite.getData('visibleBodyBounds') as PixelBounds;
        return {
          key: sprite.texture.key,
          width: sprite.displayWidth,
          height: sprite.displayHeight,
          bodyHeight: bounds.height * sprite.scaleY,
          targetBodyHeight: sprite.getData('targetBodyHeight') as number,
          animation: sprite.anims.currentAnim?.key,
          expected: `mon.animation.${id}.v1`,
        };
      }, monsterId);

      expect(initial.key).toBe(initial.expected);
      expect(initial.animation).toBe(`${initial.expected}.idle`);
      expect(initial.width).toBeGreaterThan(0);
      expect(initial.height).toBeGreaterThan(0);
      expect(initial.bodyHeight).toBeCloseTo(initial.targetBodyHeight, 3);
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const sprite = (window.__nq.scene.getScene('Battle') as Battle).enemySprite;
              return new Set(sprite.getData('batch02ObservedFrames') as string[]).size;
            }),
          { timeout: 30_000 },
        )
        .toBeGreaterThan(1);
      if (monsterId === 'aichi-arimatsu-zome') {
        await page.screenshot({ path: info.outputPath(`idle-${viewport.name}.png`) });
      }

      const messageBox = page.locator('.nq-box');
      await messageBox.click();
      if (await messageBox.isVisible()) await messageBox.click();
      await expect(page.locator('.nq-cmd[data-cmd="skill"]')).toBeVisible({ timeout: 30_000 });
      await page.evaluate(() => {
        const battle = window.__nq.scene.getScene('Battle') as Battle;
        battle.askSkill = async () => ({ score: 0.6, timeMs: 1000, attempts: 1 });
        battle.state.ally.hero.hp = 1000;
        battle.state.seed = 'animation-batch-02-78';
        battle.state.rngState = undefined;
        battle.state.enemy.skills = [];
      });
      await page.locator('.nq-cmd[data-cmd="skill"]').click();
      await page.locator('[data-skill]:not(.nq-opt-off)').first().click();

      const attackKey = `mon.animation.${monsterId}.v1.attack`;
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const sprite = (window.__nq.scene.getScene('Battle') as Battle).enemySprite;
              return sprite.getData('batch02ObservedAnimations') as string[];
            }),
          { timeout: 30_000 },
        )
        .toContain(attackKey);
      await expect
        .poll(() =>
          page.evaluate(
            () => (window.__nq.scene.getScene('Battle') as Battle).enemySprite.anims.currentAnim?.key,
          ),
        )
        .toBe(`mon.animation.${monsterId}.v1.idle`);

      const skillAttacks = await page.evaluate(async (id) => {
        const battle = window.__nq.scene.getScene('Battle') as Battle;
        const sprite = battle.enemySprite;
        const count = () =>
          (sprite.getData('batch02ObservedAnimations') as string[]).filter((key) => key.endsWith('.attack'))
            .length;
        const before = count();
        // 防御わざは攻撃アニメを再生しないため、各モンスターの攻撃わざを選ぶ。
        const skillId = battle.content.monsters.get(id)!.skills.at(-1)!;
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
      }, monsterId);
      expect(skillAttacks.after).toBeGreaterThan(skillAttacks.before);

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
}
