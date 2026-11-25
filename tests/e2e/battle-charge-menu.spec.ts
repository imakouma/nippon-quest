import { expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import type { BattleState } from '../../src/core/battle/types';

type ChargeBattle = Phaser.Scene & {
  state: BattleState;
  syncViews(): void;
  showCommands(): void;
};

for (const width of [960, 640]) {
  test(`チャージ切替と発動、HPから独立したゲージ (${width}px)`, async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: (width * 9) / 16 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto('/?debug=battle');
    await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
    await page.locator('.nq-box').click();
    const toggle = page.locator('[data-charge-toggle]');
    await expect(toggle).toBeVisible();
    await expect(page.locator('.nq-party .nq-sgauge')).toHaveCount(0);
    await expect(page.locator('.nq-sgauge')).toHaveCount(0);
    await expect(page.locator('.nq-charge-frame')).toBeVisible();
    await expect(page.locator('[data-charge-subject]')).toHaveCount(2);
    await expect(page.locator('.nq-charge-hint')).toHaveCount(0);
    await expect(toggle).toContainText('チャージ');
    await expect(page.locator('[data-charge-subject="kokugo"]')).toHaveAttribute('stroke-dasharray', '0 100');
    await page.evaluate(() => {
      const battle = window.__nq.scene.getScene('Battle') as ChargeBattle;
      battle.state.player.subjectGauges.kokugo = 100;
      battle.state.player.subjectGauges.sansu = 50;
      battle.syncViews();
    });
    await expect(page.locator('[data-charge-subject="kokugo"]')).toHaveAttribute('stroke-dasharray', '50 50');
    await expect(page.locator('[data-charge-subject="kokugo"]')).toHaveAttribute('stroke-dashoffset', '0');
    await expect(page.locator('[data-charge-subject="sansu"]')).toHaveAttribute('stroke-dasharray', '25 75');
    await expect(page.locator('[data-charge-subject="sansu"]')).toHaveAttribute('stroke-dashoffset', '-50');
    await expect(toggle).toHaveAccessibleDescription(/こくご 100\/100、さんすう 50\/100/);
    await expect(toggle).toHaveClass(/nq-charge-ready/);
    await page.screenshot({ path: info.outputPath('split-charge-frame.png') });
    await page.evaluate(() => {
      const battle = window.__nq.scene.getScene('Battle') as ChargeBattle;
      battle.state.player.subjectGauges.kokugo = 0;
      battle.state.player.subjectGauges.sansu = 0;
      battle.syncViews();
    });
    const party = await page.locator('.nq-party').boundingBox();
    expect(party!.width).toBeCloseTo((252 * width) / 960, 0);
    expect(party!.height).toBeLessThanOrEqual((80 * width) / 960);
    await page.locator('[data-cmd="skill"]').click();
    await expect(page.locator('[data-skill]')).toHaveCount(4);
    await expect(page.locator('.nq-sgauge')).toHaveCount(0);
    await expect(page.locator('.nq-charge-hint')).toHaveCount(0);
    await expect(page.locator('.nq-opt-charge').first()).toHaveText('10〜40チャージ');
    await expect(page.locator('#nq-skill-details')).toHaveCount(0);
    await page.screenshot({ path: info.outputPath('normal-skills.png') });
    await page.keyboard.press('q');
    await expect(page.locator('#nq-skill-details')).toBeVisible();
    await expect(page.locator('.nq-skill-details-toggle')).toHaveAttribute('aria-expanded', 'true');
    expect(await page.locator('#nq-skill-details').evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(
      true,
    );
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-skill]').nth(1)).toBeFocused();
    await page.screenshot({ path: info.outputPath('skill-details.png') });
    await page.keyboard.press('Escape');
    await expect(page.locator('#nq-skill-details')).toHaveCount(0);
    await expect(page.locator('[data-skill]')).toHaveCount(4);
    await page.locator('.nq-skill-details-toggle').click();
    await expect(page.locator('#nq-skill-details')).toBeVisible();
    await page.keyboard.press('q');
    await expect(page.locator('#nq-skill-details')).toHaveCount(0);
    await toggle.click();
    await expect(page.locator('[data-skill]')).toHaveCount(2);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.nq-sgauge')).toHaveCount(0);
    await expect(page.locator('.nq-charge-hint')).toHaveCount(0);
    const charge = page.locator('[data-skill]').first();
    await expect(charge).toHaveAttribute('aria-disabled', 'true');
    await charge.press('Enter');
    await expect(page.locator('.nq-menu-skill')).toBeVisible();
    await toggle.press('Enter');
    await expect(page.locator('[data-skill]')).toHaveCount(4);
    await page.locator('[data-skill]').first().press('Escape');
    await page.evaluate(() => {
      const battle = window.__nq.scene.getScene('Battle') as ChargeBattle;
      for (const subject of Object.keys(battle.state.player.subjectGauges)) {
        battle.state.player.subjectGauges[subject as keyof BattleState['player']['subjectGauges']] = 100;
      }
      battle.syncViews();
      battle.showCommands();
    });
    await expect(toggle).toHaveClass(/nq-charge-ready/);
    await toggle.click();
    await expect(page.locator('[data-skill]')).toHaveCount(2);
    await expect(charge).toHaveAttribute('aria-disabled', 'false');
    const bounds = await toggle.boundingBox();
    const menu = await page.locator('.nq-menu-skill').boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThan(menu!.y);
    expect(
      await toggle.evaluate((el) => el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight),
    ).toBe(true);
    for (const size of [320, 768, 1024, 1440]) {
      await page.setViewportSize({ width: size, height: Math.ceil((size * 9) / 16) });
      await expect(toggle).toBeInViewport();
      await expect(charge).toBeInViewport();
    }
    await page.setViewportSize({ width, height: (width * 9) / 16 });
    await page.screenshot({ path: info.outputPath('charge-skills.png') });
    await charge.press('Enter');
    await expect(page.locator('.nq-menu-skill')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
