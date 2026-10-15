import { expect, test, type Page } from '@playwright/test';
import type Phaser from 'phaser';
import type { ActionResult, BattleState } from '../../src/core/battle/types';
import type { ContentIndex } from '../../src/core/content/loader';

type MusubiBattle = Phaser.Scene & {
  state: BattleState;
  content: ContentIndex;
  syncViews(): void;
  showCommands(): void;
  runQuestion(): Promise<ActionResult>;
};

async function start(page: Page): Promise<void> {
  await page.goto('/?debug=battle');
  await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
  await page.locator('.nq-box').click();
  await expect(page.locator('[data-cmd="item"]')).toBeVisible();
}

test('むすび玉は道具メニューから問題に答えて使える', async ({ page }) => {
  test.setTimeout(90_000);
  await start(page);
  await page.evaluate(() => {
    const battle = window.__nq.scene.getScene('Battle') as MusubiBattle;
    battle.state.isBossBattle = false;
    battle.state.enemy.isBoss = false;
    battle.state.enemy.hp = 1;
    battle.state.ally.items = { 'common-musubi-dama': 2 };
    battle.runQuestion = async () => {
      window.__musubiQuestionShown = true;
      return { score: 1, timeMs: 100, attempts: 1 };
    };
    battle.syncViews();
    battle.showCommands();
  });

  await page.locator('[data-cmd="item"]').click();
  const item = page.locator('[data-item="common-musubi-dama"]');
  await expect(item).toBeVisible();
  await expect(item).toHaveAttribute('aria-disabled', 'false');
  await item.click();

  await expect.poll(() => page.evaluate(() => window.__musubiQuestionShown)).toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const battle = window.__nq.scene.getScene('Battle') as MusubiBattle;
        return battle.state.ally.items['common-musubi-dama'];
      }),
    )
    .toBe(1);
});

declare global {
  interface Window {
    __musubiQuestionShown?: boolean;
  }
}
