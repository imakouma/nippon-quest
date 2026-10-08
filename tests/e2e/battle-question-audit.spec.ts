import { expect, test } from '@playwright/test';

test('テンプレート型の文字入力問題は問題文を二重に表示しない', async ({ page }) => {
  await page.goto('/battle-question-audit.html?q=legacy.sansu.g1.math-1-9.3e2f1449e1d8');
  await expect(page.locator('.nq-q-input')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.nq-q-input .nq-q-prompt')).toHaveCount(0);
  await expect(page.locator('.nq-q-input .nq-input-suffix')).toHaveCount(0);
  await expect(page.locator('.nq-q-input input')).toHaveAttribute('aria-describedby', 'nq-question-template');
  await expect(page.locator('[data-audit-status="complete"]')).toBeVisible();
  await expect(page.locator('[data-audit-failure-count]')).toHaveAttribute('data-audit-failure-count', '0');
});

test('画像英単語問題はバトル問題枠に収まる', async ({ page }) => {
  await page.goto('/battle-question-audit.html?q=sample.picture-word.0001');
  await expect(page.locator('.nq-q-pw')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-audit-status="complete"]')).toBeVisible();
  await expect(page.locator('[data-audit-failure-count]')).toHaveAttribute('data-audit-failure-count', '0');
});

test('全問題をバトル問題枠で描画してレイアウトを検査する', async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto('/battle-question-audit.html');
  await expect(page.locator('[data-audit-status="complete"]')).toBeVisible({ timeout: 280_000 });
  await expect(page.locator('[data-audit-failure-count]')).toHaveAttribute('data-audit-failure-count', '0');
});
