import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

test('商人の会話から売買を選び直す', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page);
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
  await page.evaluate(() => {
    const game = window.__nq;
    const state = game.registry.get('game');
    game.registry.set('game', { ...state, inventory: { ...state.inventory, 'aomori-ringo': 1 } });
    const field = game.scene.getScene('Overworld') as Phaser.Scene & {
      openShop(speaker: string): Promise<void>;
    };
    void field.openShop('おみせ');
  });
  await expect(page.getByRole('menuitem', { name: /かう/ })).toBeVisible();
  await page.getByRole('menuitem', { name: /かう/ }).click();
  const buy = page.getByRole('dialog', { name: 'かう' });
  await expect(buy).toBeVisible();
  await expect(buy.locator('.nq-town-list')).not.toContainText('うる');
  await buy.getByRole('button', { name: /とじる/ }).click();
  await page.getByRole('menuitem', { name: /うる/ }).click();
  const sell = page.getByRole('dialog', { name: 'うる' });
  await expect(sell).toBeVisible();
  await expect(sell.locator('.nq-town-list')).toContainText('りんご');
  await sell.getByRole('button', { name: /とじる/ }).click();
  await expect(page.getByRole('menuitem', { name: /やめる/ })).toBeVisible();
});
