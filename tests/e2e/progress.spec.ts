import { expect, test } from '@playwright/test';

test('新規ゲームから2Dロードマップを開き、セーブ後に同じスロットを続行できる', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 3/ }).click();
  await page.getByRole('textbox', { name: 'なまえ' }).fill('テスト');
  await page.getByRole('button', { name: 'はじめる' }).click();

  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'メニュー' }).click();
  const roadmap = page.getByRole('region', { name: 'がくしゅうロードマップ' });
  await expect(roadmap).toBeVisible();
  await expect(roadmap).toContainText('かなのきほん');
  await page.getByRole('button', { name: 'さんすう' }).click();
  await expect(roadmap).toContainText('10までのかず');
  await page.getByRole('button', { name: /とじる/ }).click();

  await page.reload();
  await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await expect(page.getByRole('button', { name: /スロット 3 テスト/ })).toBeVisible();
  await page.getByRole('button', { name: /スロット 3 テスト/ }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 20_000 });
});
