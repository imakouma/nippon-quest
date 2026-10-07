import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

test('装備の詳細を閉じても崩れず、武器をドラッグして装備・移動できる', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, 'テスト');
  const storySkip = page.getByRole('button', { name: 'スキップ' });
  if (await storySkip.isVisible()) await storySkip.click();

  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.getByRole('button', { name: /もちもの・へんせい/ }).click();
  const bagWindow = page.locator('.nq-wmap-box');
  const heroCell = page.getByRole('listitem', { name: 'テスト' });
  const openWidth = await bagWindow.evaluate((el) => el.getBoundingClientRect().width);

  await heroCell.click();
  await expect(page.locator('.nq-party-info')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /とじる/ })).toBeVisible();
  await expect.poll(() => bagWindow.evaluate((el) => el.getBoundingClientRect().width)).toBe(openWidth);
  await page.screenshot({ path: testInfo.outputPath('details-closed.png') });

  const storedWeapon = page.locator('.nq-bag-outside .nq-opt').filter({ hasText: 'れんしゅうの ぼう' });
  const weaponSlot = page.locator('.nq-bag-empty[data-drop-slot="weapon"]');
  await storedWeapon.dragTo(weaponSlot);
  const weapon = page.getByRole('listitem', { name: 'れんしゅうの ぼう' });
  await page.locator('.nq-bag-empty').first().click();
  await expect(weapon).toHaveCSS('grid-column-start', '1');
  await page.screenshot({ path: testInfo.outputPath('weapon-moved.png') });
});
