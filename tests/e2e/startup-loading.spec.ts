import { expect, test } from '@playwright/test';

test('ゲーム本体の読込中も起動状態を表示し、起動後に消える', async ({ page }) => {
  test.setTimeout(120_000);
  let releaseModule!: () => void;
  const gate = new Promise<void>((resolve) => {
    releaseModule = resolve;
  });
  await page.route('**/src/main.ts', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'commit' });
  try {
    await expect(page.getByRole('status', { name: 'ゲームを じゅんびしているよ' })).toBeVisible({
      timeout: 15_000,
    });
  } finally {
    releaseModule();
  }
  await expect(page.getByRole('status', { name: 'ゲームを じゅんびしているよ' })).toHaveCount(0, {
    timeout: 60_000,
  });
  await expect(page.getByRole('menuitem', { name: /はじめから/ })).toBeVisible({ timeout: 60_000 });
});
