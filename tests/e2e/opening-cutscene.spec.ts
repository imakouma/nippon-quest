import { expect, test } from '@playwright/test';

test('新規ゲームのオープニングが自動進行し、停止・手動送り・スキップ後に操作へ戻る', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));

  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await expect(page.getByRole('textbox', { name: 'なまえ' })).toHaveCount(0);
  const lookRows = page.locator('.nq-look-controls > div');
  await expect(lookRows).toHaveCount(3);
  for (const row of await lookRows.all()) {
    const labelRight = await row.locator(':scope > span').evaluate((el) => el.getBoundingClientRect().right);
    const pickerLeft = await row.locator('.nq-look-picker').evaluate((el) => el.getBoundingClientRect().left);
    expect(labelRight).toBeLessThanOrEqual(pickerLeft);
  }
  await page.screenshot({ path: testInfo.outputPath('journey-setup.png'), fullPage: true });
  await page.getByRole('combobox', { name: /がくねん/ }).selectOption('1');
  await page.getByRole('button', { name: 'はじめる' }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1_000);
  await page.keyboard.up('ArrowRight');
  const scene = page.getByRole('region', { name: 'ものがたりの シーン' });
  await expect(scene).toBeVisible({ timeout: 30_000 });
  await expect(scene).toContainText(/かぜ|風/);
  await scene.getByRole('button', { name: 'スキップ' }).click();
  const namePrompt = page.getByRole('region', { name: /ものがたり.*名前/ });
  await namePrompt.getByRole('textbox', { name: 'なまえ' }).fill('ハル');
  await namePrompt.getByRole('button', { name: 'これで けってい' }).click();

  await expect(scene).toBeVisible();
  await expect(scene).toHaveAttribute('data-cutscene-kind', 'opening');
  await expect(scene.locator('.nq-cutscene-hero-sprite')).toBeVisible();
  await expect(scene.locator('.nq-cutscene-fairy img')).toHaveAttribute('src', /^data:image\/png/);
  await expect(scene.locator('.nq-cutscene-character-label')).toHaveCount(0);

  const firstIndex = Number(await scene.getAttribute('data-scene-index'));
  await expect
    .poll(async () => Number(await scene.getAttribute('data-scene-index')), { timeout: 20_000 })
    .toBeGreaterThan(firstIndex);

  await page.getByRole('button', { name: 'オート ON' }).click();
  await expect(page.getByRole('button', { name: 'オート OFF' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('opening-desktop.png'), fullPage: true });

  const pausedIndex = await scene.getAttribute('data-scene-index');
  await page.waitForTimeout(2_400);
  await expect(scene).toHaveAttribute('data-scene-index', pausedIndex ?? '0');

  await page.getByRole('button', { name: 'つぎの せりふへ' }).click();
  await page.getByRole('button', { name: 'つぎの せりふへ' }).click();
  await expect(scene).not.toHaveAttribute('data-scene-index', pausedIndex ?? '0');

  await page.setViewportSize({ width: 480, height: 720 });
  await expect(scene).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('opening-narrow.png'), fullPage: true });
  await page.setViewportSize({ width: 960, height: 540 });

  await page.getByRole('button', { name: 'スキップ' }).click();
  await expect(scene).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible();
  expect(errors.filter((error) => !error.includes('favicon'))).toEqual([]);
});
