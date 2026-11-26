import { expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import type { BattleState } from '../../src/core/battle/types';

type TestBattle = Phaser.Scene & {
  state: BattleState;
  syncViews(): void;
  showCommands(): void;
};

for (const skillId of ['sk-rika-g3-sound', 'sk-shakai-g3-safety']) {
  test(`${skillId} を戦闘で選び、対応する問題に答えられる`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/?debug=battle&grade=3&enemy=aomori-ringoron&lv=1');
    await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
    await page.locator('.nq-box').click();
    await expect(page.locator('[data-cmd="skill"]')).toBeVisible();
    await page.evaluate((id) => {
      const scene = window.__nq.scene.getScene('Battle') as TestBattle;
      scene.state.ally.hero.skills = [id];
      scene.syncViews();
      scene.showCommands();
    }, skillId);
    await page.locator('[data-cmd="skill"]').click();
    const skill = page.locator(`[data-skill="${skillId}"]`);
    await expect(skill).toBeVisible();
    await expect(skill).not.toHaveAttribute('aria-disabled', 'true');
    await skill.click();
    await expect(page.locator('.nq-choice').first()).toBeVisible({ timeout: 20_000 });
    await page.locator('.nq-choice').first().click();
    await expect
      .poll(
        () =>
          page.evaluate((id) => {
            const scene = window.__nq.scene.getScene('Battle') as TestBattle;
            return scene.state.log.some((event) => event.t === 'act' && event.skillId === id);
          }, skillId),
        { timeout: 30_000 },
      )
      .toBe(true);
  });
}
