import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

test('production build reaches the title without startup errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');

  await expect(page.locator('#game-root canvas')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('menuitem', { name: /はじめから/ })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator('.nq-loading')).toHaveCount(0);
  await expect(page.locator('.nq-error')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a new player reaches an input-ready field', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();

  await completeNewGameSetup(page, 'テスト');

  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('canvas[data-player-tile]')).toHaveAttribute('data-input-ready', 'true');
});

test('a debug battle reaches the first command selection', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/?debug=battle&enemy=aomori-ringoron&lv=5');

  await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 30_000 });
  await page.locator('.nq-box').click();
  await expect(page.locator('[data-cmd="skill"]')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('meter', { name: /リンゴロン HP/ })).toBeVisible();
});
