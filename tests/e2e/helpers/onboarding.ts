import { expect, type Page } from '@playwright/test';

export async function finishHeroIntroduction(page: Page, name = 'ハル'): Promise<void> {
  const dialogue = page.locator('.nq-dlg');
  const identity = page.getByRole('dialog', { name: 'ようせいとの であい' });
  await expect(dialogue.or(identity)).toBeVisible({ timeout: 30_000 });

  for (let step = 0; step < 20 && (await dialogue.isVisible()); step += 1) {
    await dialogue.click({ position: { x: 420, y: 410 }, force: true });
    await page.waitForTimeout(20);
  }

  await expect(identity).toBeVisible();
  await page.getByRole('textbox', { name: 'なまえ' }).fill(name);
  await page.getByRole('button', { name: 'これが わたし' }).click();

  for (let step = 0; step < 30 && (await dialogue.isVisible()); step += 1) {
    await dialogue.click({ position: { x: 420, y: 410 }, force: true });
    await page.waitForTimeout(20);
  }
  await expect(dialogue).toHaveCount(0);
}
