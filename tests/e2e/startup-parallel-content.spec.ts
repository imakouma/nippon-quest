import { expect, test } from '@playwright/test';

test('ゲーム開始時にコンテンツと問題を並行して取得する', async ({ page }) => {
  test.setTimeout(120_000);
  let releaseContent!: () => void;
  const gate = new Promise<void>((resolve) => {
    releaseContent = resolve;
  });
  await page.route('**/content/content-bundle.json', async (route) => {
    await gate;
    await route.continue();
  });
  const questions = page.waitForRequest('**/content/questions-g1-bundle.json', { timeout: 60_000 });
  const content = page.waitForResponse('**/content/content-bundle.json', { timeout: 60_000 });
  try {
    await page.goto('/?debug=battle', { waitUntil: 'domcontentloaded' });
    await questions;
  } finally {
    releaseContent();
  }
  expect((await content).ok()).toBe(true);
});
