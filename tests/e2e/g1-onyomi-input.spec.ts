import { expect, test } from '@playwright/test';

for (const width of [320, 768, 1024, 1440]) {
  test(`1年の音読みをひらがなで入力できる（${width}px）`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/playground.html?q=kokugo.g1.kanji-onyomi.0001');
    const stage = page.locator('.pg-stage');
    await expect(stage.getByText('一ばんおいしいパン', { exact: true })).toBeVisible();
    await expect(stage.locator('ruby')).toHaveCount(0);
    await expect(stage.locator('.nq-q-choice')).toHaveCount(0);
    await expect(stage).not.toContainText('Enter');
    await expect(stage.locator('.nq-input-key-hint')).toHaveCount(0);
    const answer = stage.getByRole('textbox', { name: 'こたえ 1', exact: true });
    await expect(answer).toHaveAttribute('inputmode', 'text');
    await answer.fill('いち');
    await answer.press('Enter');
    await expect(stage.locator('.nq-feedback-correct')).toBeVisible();
    await page.reload();
    await stage.getByRole('textbox', { name: 'こたえ 1', exact: true }).fill('ひと');
    await stage.locator('.nq-input-submit').click();
    await expect(stage.getByRole('status')).toContainText('おしい');
    await page.reload();
    await expect(stage.getByText('一ばんおいしいパン', { exact: true })).toBeVisible();
    await stage.screenshot({ path: `test-results/g1-onyomi-${width}.png` });
  });
}
