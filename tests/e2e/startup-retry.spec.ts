import { expect, test } from '@playwright/test';

test('起動コンテンツの初回読込に失敗しても、画面から再試行できる', async ({ page }) => {
  let bundleAttempts = 0;
  await page.route('**/*', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/content/content-bundle.json')) {
      bundleAttempts += 1;
      if (bundleAttempts === 1) {
        await route.fulfill({ status: 503, contentType: 'text/plain', body: 'temporary failure' });
        return;
      }
    } else if (bundleAttempts === 1 && pathname.includes('/content/')) {
      await route.fulfill({ status: 503, contentType: 'text/plain', body: 'temporary failure' });
      return;
    }
    await route.continue();
  });

  await page.goto('/');
  const retry = page.getByRole('button', { name: 'もういちど' });
  await expect(retry).toBeVisible({ timeout: 20_000 });
  await retry.click();

  await expect(page.getByRole('menuitem', { name: /はじめから/ })).toBeVisible({ timeout: 20_000 });
  await expect(retry).toHaveCount(0);
});

test('ゲーム開始時にSceneの追加チャンクを要求しない', async ({ page }) => {
  let requestedSceneChunk = false;
  await page.route(/\/assets\/(?:Overworld|Battle)-.+\.js$/, async (route) => {
    requestedSceneChunk = true;
    await route.abort('failed');
  });

  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 2/ }).click();
  await page.getByRole('button', { name: 'はじめる' }).click();

  await expect(page.getByRole('button', { name: /ちずを ひらく/ })).toBeVisible({ timeout: 30_000 });
  expect(requestedSceneChunk).toBe(false);
});
