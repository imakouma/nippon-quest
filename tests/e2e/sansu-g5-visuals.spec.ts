import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const review = JSON.parse(readFileSync('scripts/data/sansu-g5-visual-review.json', 'utf8')) as {
  id: string;
  decision: string;
}[];

for (const { id } of review.filter((r) => r.decision === 'illustrated')) {
  test(`小5の教材画像を4サイズで表示: ${id}`, async ({ page }) => {
    await page.goto(`/battle-question-audit.html?q=${id}&matrix`);
    await expect(page.locator('[data-audit-status]')).toHaveAttribute('data-audit-status', 'complete', {
      timeout: 20_000,
    });
    await expect(page.locator('[data-audit-failure-count]')).toHaveAttribute('data-audit-failure-count', '0');
  });
}
