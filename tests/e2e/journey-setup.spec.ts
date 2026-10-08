import { expect, test } from '@playwright/test';

test('旅の準備は見た目が重ならず、名前は物語の中で決める', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();

  await expect(page.getByRole('textbox', { name: 'なまえ' })).toHaveCount(0);
  const decorationWidth = await page
    .locator('.nq-new-game-look h3')
    .evaluate((heading) => Number.parseFloat(getComputedStyle(heading, '::before').width));
  expect(decorationWidth).toBe(12);
  for (const row of await page
    .locator('.nq-look-controls > div:not(.nq-look-shapes), .nq-look-shapes > div')
    .all()) {
    const labelRight = await row.locator(':scope > span').evaluate((el) => el.getBoundingClientRect().right);
    const pickerLeft = await row.locator('.nq-look-picker').evaluate((el) => el.getBoundingClientRect().left);
    expect(labelRight).toBeLessThanOrEqual(pickerLeft);
  }
  await page.screenshot({ path: testInfo.outputPath('journey-setup.png') });

  await page.getByRole('combobox', { name: /がくねん/ }).selectOption('1');
  await page.getByRole('button', { name: 'はじめる' }).click();
  const prelude = page.getByRole('dialog', { name: 'ものがたりの シーン' });
  await expect(prelude).toBeVisible({ timeout: 30_000 });
  await expect(prelude).toContainText(/かぜ|風/);
  await prelude.getByRole('button', { name: 'スキップ' }).click();
  const namePrompt = page.getByRole('dialog', { name: /ものがたり.*名前/ });
  await expect(namePrompt).toHaveAttribute('aria-modal', 'true');
  await expect(namePrompt.getByRole('textbox', { name: 'なまえ' })).toBeFocused();
  await expect(namePrompt).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: testInfo.outputPath('story-name.png') });
  await namePrompt.getByRole('textbox', { name: 'なまえ' }).fill('ハル');
  await namePrompt.getByRole('button', { name: 'これで けってい' }).click();

  const scene = page.getByRole('dialog', { name: 'ものがたりの シーン' });
  await expect(scene).toBeVisible();
  await expect(scene).toContainText('ハル');
});
