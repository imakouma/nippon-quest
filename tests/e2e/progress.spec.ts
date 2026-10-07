import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

test('新規ゲームから2Dロードマップを開き、セーブ後に同じスロットを続行できる', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 3/ }).click();
  await completeNewGameSetup(page, 'テスト');

  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 40_000 });
  await page.getByRole('button', { name: 'メニュー' }).click();
  const menuHome = page.getByLabel('メニュー');
  await expect(menuHome).toBeVisible();
  for (const label of ['がくしゅう', 'まちがい', 'ずかん', 'もちもの・へんせい', 'みため']) {
    await expect(menuHome.getByRole('button', { name: new RegExp(label) })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: /セーブ/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /ほごしゃ/ })).toBeVisible();
  await page.getByRole('button', { name: /セーブ/ }).click();
  await expect(page.getByText('セーブしたよ')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('menu-home.png') });
  await menuHome.getByRole('button', { name: /がくしゅう/ }).click();
  const roadmap = page.getByRole('region', { name: 'がくしゅうロードマップ' });
  await expect(roadmap).toBeVisible();
  const allSubjects = page.getByRole('button', { name: 'ぜんきょうか' });
  const allSubjectsOverview = page.locator('.nq-roadmap-overview');
  await expect(allSubjects).toHaveAttribute('aria-pressed', 'true');
  await expect(allSubjectsOverview).toBeVisible();
  for (const label of ['こくご', 'さんすう', 'りか', 'しゃかい', 'せいかつ', 'えいご']) {
    await expect(page.getByRole('button', { name: new RegExp(`^${label} `) })).toBeVisible();
  }
  await expect(allSubjectsOverview).toContainText('つぎ：');
  await page.getByRole('button', { name: 'さんすう', exact: true }).click();
  await expect(roadmap).toContainText('10までのかず');
  await allSubjects.click();
  await expect(allSubjectsOverview).toBeVisible();
  await page.setViewportSize({ width: 640, height: 540 });
  await expect(allSubjects).toBeVisible();
  await expect(allSubjectsOverview).toBeVisible();
  await page.getByRole('button', { name: /もどる/ }).click();
  await expect(menuHome).toBeVisible();
  await menuHome.getByRole('button', { name: /ずかん/ }).click();
  await expect(page.getByRole('button', { name: 'マナビモノ' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'とくさん' })).toBeVisible();
  await page.getByRole('button', { name: 'とくさん' }).click();
  await expect(page.getByRole('button', { name: /もどる/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /とじる/ })).toBeVisible();
  await page.getByRole('button', { name: /もどる/ }).click();
  await expect(menuHome).toBeVisible();
  await menuHome.getByRole('button', { name: /もちもの・へんせい/ }).click();
  await expect(page.locator('.nq-bag-grid .nq-bag-cell')).toHaveCount(9);
  const heroCell = page.getByRole('listitem', { name: 'テスト' });
  const bagWindow = page.locator('.nq-wmap-box');
  const openWidth = await bagWindow.evaluate((el) => el.getBoundingClientRect().width);
  await expect(page.locator('.nq-party-info')).toBeVisible();
  await heroCell.click();
  await expect(page.locator('.nq-party-info')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /とじる/ })).toBeVisible();
  await expect.poll(() => bagWindow.evaluate((el) => el.getBoundingClientRect().width)).toBe(openWidth);
  await page.screenshot({ path: testInfo.outputPath('bag-details-closed.png') });
  await heroCell.click();
  await expect(page.locator('.nq-party-info')).toBeVisible();
  await page.locator('.nq-bag-outside .nq-opt').filter({ hasText: 'れんしゅうの ぼう' }).click();
  await page.getByRole('button', { name: 'いれる' }).click();
  const starterWeapon = page.getByRole('listitem', { name: 'れんしゅうの ぼう' });
  await expect(starterWeapon).toBeVisible();
  await page.locator('.nq-bag-empty').first().click();
  await expect(starterWeapon).toHaveCSS('grid-column-start', '1');
  await page.screenshot({ path: testInfo.outputPath('bag-moved.png') });
  await page.getByRole('button', { name: /とじる/ }).click();
  await expect(menuHome).toBeVisible();
  await page.getByRole('button', { name: /とじる/ }).click();

  await page.reload();
  await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await expect(page.getByRole('button', { name: /スロット 3 Lv/ })).toBeVisible();
  await page.getByRole('button', { name: /スロット 3 Lv/ }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 20_000 });
});
