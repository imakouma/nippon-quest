import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

test('装備の詳細を閉じても崩れず、武器をドラッグして装備・移動できる', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, 'テスト');
  await page
    .getByRole('dialog', { name: 'ものがたりの シーン' })
    .getByRole('button', { name: 'スキップ' })
    .click();
  const battleTutorial = page.locator('.nq-dlg');
  await expect(battleTutorial).toBeVisible();
  for (let step = 0; step < 12 && (await battleTutorial.isVisible()); step += 1) {
    await battleTutorial.click();
  }
  await expect(battleTutorial).toHaveCount(0);

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

  const reserve = page.locator('.nq-bag-reserve-grid');
  const storedWeapon = page.locator('.nq-bag-reserve-tile').filter({ hasText: 'れんしゅうの ぼう' });
  for (const [width, height] of [
    [960, 540],
    [640, 540],
    [320, 568],
    [768, 1024],
    [1024, 768],
    [1440, 900],
  ] as const) {
    await page.setViewportSize({ width, height });
    const [bagBox, reserveBox, tileBox] = await Promise.all([
      page.locator('.nq-bag-grid').boundingBox(),
      reserve.boundingBox(),
      storedWeapon.boundingBox(),
    ]);
    expect(bagBox).not.toBeNull();
    expect(reserveBox).not.toBeNull();
    expect(tileBox).not.toBeNull();
    expect(reserveBox!.x).toBeGreaterThanOrEqual(bagBox!.x + bagBox!.width);
    expect(reserveBox!.height).toBeGreaterThan(bagBox!.height);
    expect(tileBox!.y).toBeGreaterThanOrEqual(reserveBox!.y);
    expect(tileBox!.y + tileBox!.height).toBeLessThanOrEqual(reserveBox!.y + reserveBox!.height);
    await expect(page.locator('.nq-party-info')).toHaveCount(0);
  }
  await page.setViewportSize({ width: 960, height: 540 });
  await page.screenshot({ path: testInfo.outputPath('reserve-right.png') });
  await heroCell.press('Enter');
  await expect(page.locator('.nq-party-info')).toBeVisible();
  await heroCell.press('Space');
  await expect(page.locator('.nq-party-info')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /とじる/ })).toBeVisible();
  await expect.poll(() => bagWindow.evaluate((el) => el.getBoundingClientRect().width)).toBe(openWidth);
  await page.screenshot({ path: testInfo.outputPath('details-closed.png') });

  await expect(reserve).toBeVisible();
  await storedWeapon.click();
  await expect(storedWeapon).toBeFocused();
  await expect(page.locator('.nq-party-name')).toContainText('れんしゅうの ぼう');
  await storedWeapon.click();
  await expect(page.locator('.nq-party-info')).toHaveCount(0);
  await storedWeapon.click();
  await expect(page.locator('.nq-party-info')).toBeVisible();
  const [reserveBox, detailBox] = await Promise.all([
    reserve.boundingBox(),
    page.locator('.nq-party-info').boundingBox(),
  ]);
  expect(reserveBox!.y + reserveBox!.height).toBeLessThanOrEqual(detailBox!.y);
  const weaponSlot = page.locator('.nq-bag-empty[data-drop-slot="weapon"]');
  await storedWeapon.dragTo(weaponSlot);
  const weapon = page.getByRole('button', { name: 'れんしゅうの ぼう' });
  await page.locator('.nq-bag-empty').first().click();
  await expect(weapon).toHaveCSS('grid-column-start', '1');
  await expect(reserve).toContainText('ひかえや もちものは ないよ');
  await page.screenshot({ path: testInfo.outputPath('weapon-moved.png') });
});
