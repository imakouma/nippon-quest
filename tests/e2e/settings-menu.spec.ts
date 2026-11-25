import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

test('設定の音量と移動キーは変更後も保存される', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, 'テスト');
  const openSettings = async () => {
    await page.getByRole('button', { name: 'メニュー', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'メニュー' })
      .getByRole('button', { name: /せってい/ })
      .click();
    await expect(page.getByRole('dialog', { name: 'せってい' })).toBeVisible();
  };
  await openSettings();
  const settings = page.getByRole('dialog', { name: 'せってい' });
  await settings.getByRole('slider', { name: /BGM/ }).fill('0.3');
  await settings.getByRole('slider', { name: /こうかおん/ }).fill('0.4');
  await settings.getByRole('combobox').selectOption('wasd');
  await settings.getByRole('button', { name: 'もどる' }).click();
  await page
    .getByRole('dialog', { name: 'メニュー' })
    .getByRole('button', { name: /とじる/ })
    .click();
  await page.waitForTimeout(1500);
  await page.goto('/');
  await page.getByRole('menuitem', { name: /つづきから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await expect(page.getByRole('button', { name: 'メニュー', exact: true })).toBeVisible({ timeout: 30_000 });
  await openSettings();
  await expect(settings.getByRole('slider', { name: /BGM/ })).toHaveValue('0.3');
  await expect(settings.getByRole('slider', { name: /こうかおん/ })).toHaveValue('0.4');
  await expect(settings.getByRole('combobox')).toHaveValue('wasd');
});
