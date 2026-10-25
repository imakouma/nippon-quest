import { expect, type Page } from '@playwright/test';

/** 必須になった新規ゲーム設定を、E2Eで同じ手順にそろえる。 */
export async function completeNewGameSetup(page: Page, name = 'ハル'): Promise<void> {
  await page.getByRole('combobox', { name: /がくねん/ }).selectOption('1');
  await page.getByRole('button', { name: 'はじめる' }).click();
  const opening = page.getByRole('dialog', { name: 'ものがたりの シーン' });
  const retry = page.getByRole('button', { name: 'もういちど' });
  await expect
    .poll(async () => (await opening.isVisible()) || (await retry.isVisible()), { timeout: 30_000 })
    .toBe(true);
  if (await retry.isVisible()) {
    await retry.click();
    await expect(opening).toBeVisible({ timeout: 30_000 });
  }
  await opening.getByRole('button', { name: 'スキップ' }).click();
  await page.getByRole('textbox', { name: 'なまえ' }).fill(name);
  await page.getByRole('button', { name: 'これで けってい' }).click();

  // Most E2E scenarios start after onboarding. Finish the battle tutorial via
  // the same visible interaction a player uses instead of clicking through its
  // modal backdrop or adding sleeps to every scenario.
  const storySkip = page.getByRole('button', { name: 'スキップ' });
  const tutorial = page.getByRole('dialog', { name: 'かいわ' });
  await expect
    .poll(async () => (await storySkip.isVisible()) || (await tutorial.isVisible()), { timeout: 30_000 })
    .toBe(true);
  if (await storySkip.isVisible()) await storySkip.click();
  await expect(tutorial).toBeVisible({ timeout: 30_000 });
  for (let step = 0; step < 16 && (await tutorial.isVisible()); step += 1) await tutorial.click();
  await expect(tutorial).toHaveCount(0);
  await expect(page.locator('#game-root canvas')).toHaveAttribute('data-input-ready', 'true', {
    timeout: 10_000,
  });
}
