import { expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import type { HudStore } from '../../src/ui/battle/store';

for (const viewport of [
  { width: 960, height: 540 },
  { width: 640, height: 360 },
]) {
  for (const dropCount of [3, 12]) {
    test(`勝利結果は報酬${dropCount}件でも画面内に収まる (${viewport.width}px)`, async ({ page }, info) => {
      test.setTimeout(90_000);
      await page.setViewportSize(viewport);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('/?debug=battle&enemy=aomori-ringoron&lv=1');
      await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
      await page.locator('.nq-box').click();
      // 戦闘の乱数と切り離し、実際のHUDへ複数報酬の表示モデルを渡す。
      await page.evaluate((dropCount) => {
        const game = (window as unknown as { __nq: Phaser.Game }).__nq;
        const battle = game.scene.getScene('Battle') as Phaser.Scene & { hud: HudStore };
        battle.hud.set({
          menu: 'none',
          message: null,
          result: {
            kind: 'victory',
            xp: 12,
            gold: 8,
            level: 2,
            levelXp: 10,
            levelXpNeeded: 61,
            xpFrom: 0,
            xpTo: 10 / 61,
            needNext: 51,
            goldLost: 0,
            bonus: 1.1,
            maxCombo: 2,
            drops: [
              { name: 'りんご', count: 1 },
              { name: 'りんごのよろい', count: 1 },
              { name: '大間[おおま]のマグロ', count: 1 },
              ...Array.from({ length: dropCount - 3 }, (_, index) => ({
                name: `どうぐ${index + 4}`,
                count: index + 1,
              })),
            ],
          },
        });
      }, dropCount);
      const result = page.locator('.nq-result-victory');
      await expect(result).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await result.evaluate(async (node) => {
        await Promise.all(node.getAnimations().map((animation) => animation.finished));
      });
      await expect(result).not.toContainText('いまの レベル');
      await expect(result.locator('.nq-result-level')).toHaveText('Lv.2');
      await expect(result.getByRole('meter')).toContainText('10/61');
      await expect(result).not.toContainText('ボーナス');
      const armor = result.locator('.nq-result-drop').filter({ hasText: 'りんごのよろい' });
      const armorName = (await armor.locator('.nq-result-drop-name').boundingBox())!;
      const armorCount = (await armor.locator('.nq-result-drop-count').boundingBox())!;
      expect(armorName.height).toBeCloseTo(armorCount.height, 0);
      expect(armorName.x + armorName.width).toBeLessThan(armorCount.x);
      expect(armorName.y + armorName.height / 2).toBeCloseTo(armorCount.y + armorCount.height / 2, 0);
      const level = (await result.locator('.nq-result-level').boundingBox())!;
      const xpBar = (await result.getByRole('meter').boundingBox())!;
      expect(level.x + level.width).toBeLessThan(xpBar.x);
      expect(level.y + level.height / 2).toBeCloseTo(xpBar.y + xpBar.height / 2, 0);
      const box = (await result.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      await expect(result.getByRole('button')).toBeInViewport({ ratio: 1 });
      if (dropCount > 3) {
        const items = result.getByRole('region', { name: 'てに いれた もの' });
        await expect(result.locator('.nq-result-drop')).toHaveCount(dropCount);
        expect(await items.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
        await result.getByRole('button').press('Shift+Tab');
        await expect(items).toBeFocused();
        await items.press('ArrowDown');
        await expect.poll(() => items.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
        await items.press('End');
        await expect(result.locator('.nq-result-drop').last()).toBeInViewport({ ratio: 0.999 });
        await items.press('Space');
        await expect(result).toBeVisible();
        await items.press('Tab');
        await expect(result.getByRole('button')).toBeFocused();
      }
      await page.screenshot({ path: info.outputPath('multiple-rewards.png') });
      expect(errors).toEqual([]);
    });
  }
}
