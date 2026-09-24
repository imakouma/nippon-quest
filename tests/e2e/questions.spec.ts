import { expect, test, type Page } from '@playwright/test';

/** Playground で picture-word のサンプル（1 問目：りんごの絵）を出す */
async function showPictureWord(page: Page) {
  await page.goto('/playground.html');
  await page.locator('select#pg-file').selectOption('questions/_samples/picture-word.json');
  await expect(page.locator('textarea#pg-json')).toHaveValue(/sample\.picture-word\.0001/, {
    timeout: 10_000,
  });
  await page.click('button.pg-run');
  await expect(page.locator('.nq-q-pw')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.nq-pw-picture')).toBeVisible();
}

test('picture-word：絵を見て 正しい英単語を 1 回で えらぶと score 1', async ({ page }) => {
  await showPictureWord(page);
  await page.locator('.nq-pw-card', { hasText: 'apple' }).click();
  await expect(page.locator('.nq-pw-slot-correct')).toHaveText('apple');
  await expect(page.locator('.pg-result')).toContainText('"score": 1', { timeout: 10_000 });
});

test('picture-word：1 回まちがえてから 正解すると score 0.5', async ({ page }) => {
  await showPictureWord(page);
  await page.locator('.nq-pw-card', { hasText: 'grapes' }).click();
  await expect(page.locator('.nq-pw-card-miss')).toHaveCount(1);
  await page.locator('.nq-pw-card', { hasText: 'apple' }).click({ timeout: 5_000 });
  await expect(page.locator('.pg-result')).toContainText('"score": 0.5', { timeout: 10_000 });
});
