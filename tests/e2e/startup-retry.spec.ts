import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

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

test('再ビルドで古いゲームSceneが消えても、続きからを保って自動復帰できる', async ({ page }) => {
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 2/ }).click();
  await completeNewGameSetup(page, 'リトライ');
  await expect(page.getByRole('button', { name: /ちずを ひらく/ })).toBeVisible({ timeout: 30_000 });

  let failedOnce = false;
  await page.route(/\/assets\/(?:overworld|battle)-.+\.js$/i, async (route) => {
    if (!failedOnce) {
      failedOnce = true;
      await route.abort('failed');
      return;
    }
    await route.continue();
  });
  await page.reload();
  await page.getByRole('menuitem', { name: /つづきから/ }).click();
  await page.getByRole('button', { name: /スロット 2 Lv/ }).click();

  const retry = page.getByRole('button', { name: 'もういちど' });
  await expect(page.getByRole('button', { name: /ちずを ひらく/ })).toBeVisible({ timeout: 30_000 });
  await expect(retry).toHaveCount(0);
});
