import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

test('タイトル画面で問題バンクを先読みしない', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(new URL(request.url()).pathname));
  await page.goto('/?resetSaves=1');
  await expect(page.getByRole('menuitem', { name: /はじめから/ })).toBeVisible({ timeout: 20_000 });
  expect(requests.filter((path) => /questions-(?:g\d-)?bundle\.json$/.test(path))).toEqual([]);
});

test('ゲームコンテンツの読込に失敗しても、開始操作から再試行できる', async ({ page }) => {
  test.setTimeout(90_000);
  let bundleAttempts = 0;
  let failContent = true;
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('**/content/content-bundle.json', async (route) => {
    bundleAttempts += 1;
    if (failContent) {
      await route.fulfill({ status: 503, contentType: 'text/plain', body: 'temporary failure' });
      return;
    }
    await route.continue();
  });
  await page.route('**/content/manifest.json', async (route) => {
    if (failContent) {
      await route.fulfill({ status: 503, contentType: 'text/plain', body: 'temporary failure' });
      return;
    }
    await route.continue();
  });

  await page.goto('/');
  await expect(page.getByRole('menuitem', { name: /はじめから/ })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await page.getByRole('combobox', { name: /がくねん/ }).selectOption('1');
  await page.getByRole('button', { name: 'はじめる' }).click();
  expect(pageErrors).toEqual([]);
  const retry = page.getByRole('button', { name: 'もういちど' });
  await expect(retry).toBeVisible({ timeout: 60_000 });
  expect(bundleAttempts).toBeGreaterThan(0);
  await expect(page.locator('.nq-error')).toContainText('よみこみに しっぱいしました');
  await expect(page.locator('.nq-error')).not.toContainText('503');
  await expect(page.locator('.nq-error')).not.toContainText('temporary failure');
  failContent = false;
  await retry.click();

  await expect(page.getByRole('dialog', { name: 'ものがたりの シーン' })).toBeVisible({ timeout: 30_000 });
  await expect(retry).toHaveCount(0);
});

test('再ビルドで古いゲームSceneが消えても、続きからを保って自動復帰できる', async ({ page }) => {
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 2/ }).click();
  await completeNewGameSetup(page, 'リトライ');
  await expect(page.getByRole('button', { name: /の ちずを ひらく/ })).toBeVisible({ timeout: 30_000 });

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
  await expect(page.getByRole('button', { name: /の ちずを ひらく/ })).toBeVisible({ timeout: 30_000 });
  await expect(retry).toHaveCount(0);
});
