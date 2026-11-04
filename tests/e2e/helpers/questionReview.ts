import { expect, type Page } from '@playwright/test';

export async function advanceQuestionFeedback(page: Page): Promise<void> {
  await expect(page.locator('.nq-feedback')).toBeVisible();
  const next = page.locator('.nq-review-next');
  if (await next.isVisible()) await next.click();
}
