import { expect, test, type Page } from '@playwright/test';
import type Phaser from 'phaser';
import type { BattleState } from '../../src/core/battle/types';

type StatusBattle = Phaser.Scene & {
  state: BattleState;
  syncViews(): void;
};

async function start(page: Page): Promise<void> {
  await page.goto('/?debug=battle&enemy=aomori-ringoron&lv=8');
  await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
  await page.locator('.nq-box').click();
  await expect(page.locator('[data-cmd="skill"]')).toBeVisible();
}

test('状態チップを表示し、戦いの記録は表示しない', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await start(page);

  await expect(page.locator('[data-battle-history]')).toHaveCount(0);
  await expect(page.locator('[data-event-timeline]')).toHaveCount(0);

  await page.evaluate(() => {
    const battle = window.__nq.scene.getScene('Battle') as StatusBattle;
    battle.state.enemy.buffs = {
      atk: { mult: 1.25, turns: 3 },
      def: { mult: 0.75, turns: 2 },
    };
    battle.state.enemy.skipTurns = 1;
    battle.state.ally.hero.buffs = { def: { mult: 1.25, turns: 2 } };
    battle.syncViews();
  });

  const enemyEffects = page.locator('.nq-foe [data-status-effect]');
  await expect(enemyEffects).toHaveCount(3);
  await expect(enemyEffects.filter({ hasText: 'こうげき▲3T' })).toBeVisible();
  await expect(enemyEffects.filter({ hasText: 'ぼうぎょ▼2T' })).toBeVisible();
  await expect(enemyEffects.filter({ hasText: 'うごけない×1T' })).toBeVisible();
  await expect(page.locator('.nq-foe [data-status-effect="defense"]')).toHaveAttribute(
    'aria-label',
    'ぼうぎょ さがっている のこり 2ターン',
  );
  await expect(page.locator('.nq-ally-hero [data-status-effect="defense"]')).toContainText('ぼうぎょ▲2T');

  for (const viewport of [
    { width: 960, height: 540 },
    { width: 640, height: 360 },
  ]) {
    await page.setViewportSize(viewport);
    expect(await page.locator('.nq-battle').evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(
      true,
    );
  }
  expect(errors).toEqual([]);
});
