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
  for (const label of ['がくしゅう', 'まちがい', 'モンスター', 'とくさん', 'どうぐ', 'そうび', 'みため']) {
    await expect(menuHome.getByRole('button', { name: new RegExp(label) })).toBeVisible();
  }
  await page.screenshot({ path: testInfo.outputPath('menu-home.png') });
  await menuHome.getByRole('button', { name: /がくしゅう/ }).click();
  const roadmap = page.getByRole('region', { name: 'がくしゅうロードマップ' });
  await expect(roadmap).toBeVisible();
  const allSubjects = page.getByRole('button', { name: '全教科' });
  await expect(allSubjects).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('全教科の学習進捗')).toBeVisible();
  for (const label of ['こくご', 'さんすう', 'りか', 'しゃかい', 'せいかつ', 'えいご']) {
    await expect(page.getByRole('button', { name: new RegExp(`^${label} `) })).toBeVisible();
  }
  await expect(page.getByLabel('全教科の学習進捗')).toContainText('つぎ：');
  await page.getByRole('button', { name: 'さんすう', exact: true }).click();
  await expect(roadmap).toContainText('10までのかず');
  await allSubjects.click();
  await expect(page.getByLabel('全教科の学習進捗')).toBeVisible();
  await page.setViewportSize({ width: 640, height: 540 });
  await expect(allSubjects).toBeVisible();
  await expect(page.getByLabel('全教科の学習進捗')).toBeVisible();
  await page.getByRole('button', { name: /もどる/ }).click();
  await expect(menuHome).toBeVisible();
  await menuHome.getByRole('button', { name: /モンスター/ }).click();
  await expect(page.getByRole('button', { name: /もどる/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /とじる/ })).toBeVisible();
  await page.getByRole('button', { name: /もどる/ }).click();
  await expect(menuHome).toBeVisible();
  await page.getByRole('button', { name: /とじる/ }).click();

  await page.reload();
  await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await expect(page.getByRole('button', { name: /スロット 3 Lv/ })).toBeVisible();
  await page.getByRole('button', { name: /スロット 3 Lv/ }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 20_000 });
});
