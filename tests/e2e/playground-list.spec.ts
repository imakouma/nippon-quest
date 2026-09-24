import { expect, test } from '@playwright/test';

test('Playground の問題いちらん：ぜんぶ出て、しぼりこめて、行を おすと その問題が出る', async ({ page }) => {
  await page.goto('/playground.html');
  const rows = page.locator('.pg-table tbody tr');
  await expect(rows.first()).toBeVisible({ timeout: 10_000 });
  expect(await rows.count()).toBeGreaterThan(100);
  await expect(page.locator('.pg-table tr.pg-bad')).toHaveCount(0);

  await page.locator('select#pg-f-type').selectOption('picture-word');
  await expect(rows).toHaveCount(23);
  await page.locator('input#pg-f-text').fill('eigo.g3.sea.0006');
  await expect(rows).toHaveCount(1);
  await rows.first().click();
  await expect(page.locator('.nq-q-pw')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('textarea#pg-json')).toHaveValue(/eigo\.g3\.sea\.0006/);
  await expect(page).toHaveURL(/\?q=eigo\.g3\.sea\.0006/);
});

test('Playground：?q=<問題 id> で ひらくと その問題が出る', async ({ page }) => {
  await page.goto('/playground.html?q=eigo.g1.alphabet.0002');
  await expect(page.locator('.nq-q-choice')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.pg-table tr.pg-sel')).toContainText('eigo.g1.alphabet.0002');
});
