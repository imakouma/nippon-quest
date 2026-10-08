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
  const bagDialog = page.getByRole('dialog', { name: /もちもの・へんせい/ });
  await expect(bagDialog).toHaveAttribute('aria-modal', 'true');
  await expect(bagDialog.getByRole('group', { name: /もちもの・へんせい/ })).toBeVisible();
  await expect(bagDialog.getByText(/バッグ \d+\/9マス/)).toBeVisible();
  const heroCell = page.getByRole('button', { name: 'テスト' });
  await expect(heroCell).toBeFocused();
  const openWidth = await bagWindow.evaluate((el) => el.getBoundingClientRect().width);

  await heroCell.click();
  await expect(page.locator('.nq-party-info')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /とじる/ })).toBeVisible();
  await expect.poll(() => bagWindow.evaluate((el) => el.getBoundingClientRect().width)).toBe(openWidth);
  await page.screenshot({ path: testInfo.outputPath('details-closed.png') });

  const storedWeapon = page.locator('.nq-bag-reserve-tile').filter({ hasText: 'れんしゅうの ぼう' });
  await expect(page.locator('.nq-bag-reserve-grid')).toBeVisible();
  await storedWeapon.click();
  await expect(storedWeapon).toBeFocused();
  await expect(page.locator('.nq-party-name')).toContainText('れんしゅうの ぼう');
  const weaponSlot = page.locator('.nq-bag-empty[data-drop-slot="weapon"]');
  await storedWeapon.dragTo(weaponSlot);
  const weapon = page.getByRole('button', { name: 'れんしゅうの ぼう' });
  await page.locator('.nq-bag-empty').first().click();
  await expect(weapon).toHaveCSS('grid-column-start', '1');
  await page.screenshot({ path: testInfo.outputPath('weapon-moved.png') });
});
