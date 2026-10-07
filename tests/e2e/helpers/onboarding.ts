import { expect, type Page } from '@playwright/test';

export async function finishHeroIntroduction(page: Page, name = 'ハル'): Promise<void> {
  const dialogue = page.locator('.nq-dlg');
  const identity = page.getByRole('form', { name: 'ようせいとの であい' });
  await expect(dialogue).toBeVisible({ timeout: 15_000 });

  for (let step = 0; step < 20 && !(await identity.isVisible()); step += 1) {
    await dialogue.click();
    await page.waitForTimeout(80);
  }

  await expect(identity).toBeVisible();
  await page.getByRole('textbox', { name: 'なまえ' }).fill(name);
  await page.getByRole('button', { name: 'これが わたし' }).click();

  for (let step = 0; step < 30 && (await dialogue.isVisible()); step += 1) {
    await dialogue.click();
    await page.waitForTimeout(80);
  }
  await expect(dialogue).toHaveCount(0);
}
