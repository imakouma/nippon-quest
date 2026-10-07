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
  await expect(page.locator('.pg-result')).toContainText('"score": 1', { timeout: 10_000 });
});

test('picture-word：1 回まちがえてから 正解すると score 0.5', async ({ page }) => {
  await showPictureWord(page);
  await page.locator('.nq-pw-card', { hasText: 'grapes' }).click();
  await expect(page.locator('.nq-pw-card-miss')).toHaveCount(1);
  await page.locator('.nq-pw-card', { hasText: 'apple' }).click({ timeout: 5_000 });
  await expect(page.locator('.pg-result')).toContainText('"score": 0.5', { timeout: 10_000 });
});

test('旧版の文字入力問題：複数の答えを入力して採点できる', async ({ page }) => {
  await page.goto('/playground.html?q=legacy.rika.g5.sci-5-10.19d606f94ed5');
  await expect(page.locator('.nq-q-input')).toBeVisible({ timeout: 20_000 });
  const answers = page.getByRole('textbox', { name: /こたえ/ });
  await expect(answers).toHaveCount(3);
  await answers.nth(0).fill('1.2');
  await answers.nth(1).fill('１．２');
  await answers.nth(2).fill('1.2');
  await page.getByRole('button', { name: 'こたえる' }).click();
  await expect(page.locator('.pg-result')).toContainText('"score": 1', { timeout: 10_000 });
});

test('旧版の地図問題：正しい地点をクリックして採点できる', async ({ page }) => {
  await page.goto('/playground.html?q=legacy.shakai.g3.cur-1403-01.6d0e031ce36a');
  const map = page.locator('.nq-map-tap');
  await expect(map).toBeVisible({ timeout: 20_000 });
  const box = await map.boundingBox();
  expect(box).not.toBeNull();
  await map.click({ position: { x: box!.width * 0.45, y: box!.height * 0.7 } });
  await expect(page.locator('.pg-result')).toContainText('"score": 1', { timeout: 10_000 });
});
