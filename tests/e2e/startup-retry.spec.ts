import { expect, test } from '@playwright/test';

test('ゲームシーンの初回読込に失敗しても、画面から再試行して開始できる', async ({ page }) => {
  let failedOnce = false;
  await page.route(/\/assets\/(?:Overworld|Battle)-.+\.js$/, async (route) => {
    if (!failedOnce) {
      failedOnce = true;
      await route.abort('failed');
      return;
    }
    await route.continue();
  });

  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 3/ }).click();
  await page.getByRole('button', { name: 'はじめる' }).click();

  const retry = page.getByRole('button', { name: 'もういちど' });
  await expect(retry).toBeVisible({ timeout: 20_000 });
  await retry.click();

  await expect(page.getByRole('button', { name: /ちずを ひらく/ })).toBeVisible({ timeout: 30_000 });
  await expect(retry).toHaveCount(0);
});
