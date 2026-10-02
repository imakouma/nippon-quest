import { expect, test } from '@playwright/test';

test('タイトル画面が立ち上がり、コンテンツが読み込まれる', async ({ page }) => {
  const errors: string[] = [];
  const contentRequests: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith('/content/')) contentRequests.push(path);
  });
  await page.goto('/');
  await expect(page.locator('#game-root canvas')).toBeVisible({ timeout: 15_000 });
  // Boot が終わるとローディングが消える
  await expect(page.locator('.nq-loading')).toHaveCount(0, { timeout: 15_000 });
  await expect(page.locator('.nq-error')).toHaveCount(0);
  expect(errors.filter((e) => !e.includes('favicon'))).toEqual([]);
  expect(contentRequests).toEqual(['/content/content-bundle.json']);
});

test('Playground で choice 問題を解くと QuestionResult が返る', async ({ page }) => {
  await page.goto('/playground.html');
  // 問題ファイルを選ぶ → 最初の問題が JSON 欄に入る
  await page.locator('select#pg-file').selectOption({ index: 1 });
  await expect(page.locator('textarea#pg-json')).not.toBeEmpty({ timeout: 10_000 });
  await page.click('button.pg-run');
  await expect(page.locator('.nq-q-choice')).toBeVisible({ timeout: 10_000 });
  await page.locator('.nq-choice').first().click();
  await expect(page.locator('.pg-result')).toContainText('"score"', { timeout: 10_000 });
});
