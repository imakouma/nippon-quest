import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

test('主人公の技を編成して再読み込み後も保持する', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, 'テスト');
  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.getByRole('button', { name: /もちもの・へんせい/ }).click();
  await page.getByRole('button', { name: 'テスト' }).click();
  await page.getByRole('button', { name: 'わざを へんせいする' }).click();
  const editor = page.getByRole('region', { name: 'わざの へんせい' });
  const normal = editor.getByRole('group', { name: /ふつうの わざ/ });
  const slots = normal.getByRole('combobox');
  await expect(slots).toHaveCount(4);
  await expect(editor.getByRole('group', { name: /チャージわざ/ }).getByRole('combobox')).toHaveCount(2);
  await slots.nth(3).selectOption('sk-kotoba-asobi');
  await expect(slots.nth(3)).toHaveValue('sk-kotoba-asobi');
  await expect(page.locator('.nq-party-skills')).toContainText('ことばあそび');
  await expect(page.locator('.nq-party-skills')).not.toContainText('ぶんのつばさ');
  await page.screenshot({ path: testInfo.outputPath('hero-skill-loadout.png') });
  await page.getByRole('button', { name: 'わざの へんせいを とじる' }).click();
  await page.getByRole('button', { name: 'わざを へんせいする' }).click();
  await expect(
    editor
      .getByRole('group', { name: /ふつうの わざ/ })
      .getByRole('combobox')
      .nth(3),
  ).toHaveValue('sk-kotoba-asobi');
  await page.reload();
  await page.getByRole('menuitem', { name: /つづきから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.getByRole('button', { name: /もちもの・へんせい/ }).click();
  await page.getByRole('button', { name: 'テスト' }).click();
  await page.getByRole('button', { name: 'わざを へんせいする' }).click();
  await expect(
    page
      .getByRole('region', { name: 'わざの へんせい' })
      .getByRole('group', { name: /ふつうの わざ/ })
      .getByRole('combobox')
      .nth(3),
  ).toHaveValue('sk-kotoba-asobi');
});
