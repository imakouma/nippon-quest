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
  const slots = normal.getByRole('button');
  await expect(slots).toHaveCount(4);
  await expect(editor.getByRole('group', { name: /チャージわざ/ }).getByRole('button')).toHaveCount(2);
  for (const width of [960, 600]) {
    await page.setViewportSize({ width, height: 540 });
    await expect
      .poll(() => editor.evaluate((el) => el.scrollHeight - el.clientHeight))
      .toBeLessThanOrEqual(1);
  }
  await page.setViewportSize({ width: 960, height: 540 });
  const sortModes = editor.getByRole('group', { name: /並べ替え|ならべかえ/ });
  for (const label of ['いりょく', 'めいちゅう']) {
    await sortModes.getByRole('button', { name: label }).click();
    await expect(
      sortModes.getByRole('button', { name: new RegExp(label + '.*(?:高|たか)') }),
    ).toHaveAttribute('aria-pressed', 'true');
    await sortModes.getByRole('button', { name: new RegExp(label + '.*(?:高|たか)') }).click();
    await expect(
      sortModes.getByRole('button', { name: new RegExp(label + '.*(?:低|ひく)') }),
    ).toHaveAttribute('aria-pressed', 'true');
  }
  expect(
    await sortModes
      .getByRole('button')
      .evaluateAll((buttons) => buttons.every((button) => button.scrollWidth <= button.clientWidth + 1)),
  ).toBe(true);
  await slots.nth(3).click();
  await editor
    .locator('.nq-hero-skill-list')
    .getByRole('button', { name: /ことばあそび/ })
    .click();
  await expect(editor.locator('aside')).toContainText('ことばあそび');
  await editor.getByRole('button', { name: /この.*(?:枠|わく).*セット/ }).click();
  await expect(slots.nth(3)).toContainText('ことばあそび');
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
      .getByRole('button')
      .nth(3),
  ).toContainText('ことばあそび');
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
      .getByRole('button')
      .nth(3),
  ).toContainText('ことばあそび');
});
