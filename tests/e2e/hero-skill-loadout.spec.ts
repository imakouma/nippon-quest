import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

test('5番目の技メニューで編成し、再読み込み後も保持する', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, 'テスト');
  await page.getByRole('button', { name: 'メニュー' }).click();
  const menu = page.getByRole('group', { name: 'メニュー' });
  await expect(menu.getByRole('button').nth(4)).toHaveText('わざ');
  const bagLabel = page.locator('.nq-menu-card-party .nq-menu-card-label');
  expect(await bagLabel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('five-menu-categories.png') });
  await menu.getByRole('button', { name: 'わざ', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'わざの へんせい' });
  const editor = dialog.getByRole('region', { name: 'わざの へんせい' });
  const normal = editor.getByRole('group', { name: /ふつうの わざ/ });
  const slots = normal.getByRole('combobox');
  await expect(slots).toHaveCount(4);
  await expect(editor.getByRole('group', { name: /チャージわざ/ }).getByRole('combobox')).toHaveCount(2);
  await slots.nth(3).selectOption('sk-kotoba-asobi');
  await expect(slots.nth(3)).toHaveValue('sk-kotoba-asobi');
  await page.screenshot({ path: testInfo.outputPath('hero-skill-loadout.png') });
  await dialog.getByRole('button', { name: /もどる/ }).click();
  await page
    .getByRole('group', { name: 'メニュー' })
    .getByRole('button', { name: 'わざ', exact: true })
    .click();
  await expect(
    page
      .getByRole('dialog', { name: 'わざの へんせい' })
      .getByRole('group', { name: /ふつうの わざ/ })
      .getByRole('combobox')
      .nth(3),
  ).toHaveValue('sk-kotoba-asobi');
  await page.reload();
  await page.getByRole('menuitem', { name: /つづきから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await page.getByRole('button', { name: 'メニュー' }).click();
  await page
    .getByRole('group', { name: 'メニュー' })
    .getByRole('button', { name: 'わざ', exact: true })
    .click();
  await expect(
    page
      .getByRole('dialog', { name: 'わざの へんせい' })
      .getByRole('group', { name: /ふつうの わざ/ })
      .getByRole('combobox')
      .nth(3),
  ).toHaveValue('sk-kotoba-asobi');
});
