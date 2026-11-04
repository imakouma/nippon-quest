import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

test('保護者設定で練習を時間制限なしにしてロードマップから解く', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page);
  await page.getByRole('button', { name: 'メニュー', exact: true }).click();
  const menu = page.getByRole('dialog', { name: 'メニュー', exact: true });
  await menu.getByRole('button', { name: /ほごしゃ/ }).click();
  await page.getByLabel('こたえ').fill('12');
  await page.getByRole('button', { name: 'ひらく', exact: true }).click();
  const setting = page.getByRole('combobox', { name: /(?:練習|れんしゅう).*(?:制限時間|せいげんじかん)/ });
  await expect(setting).toHaveValue('limited');
  await setting.selectOption('unlimited');
  await expect(setting).toHaveValue('unlimited');
  await page.screenshot({ path: 'test-results/sansu-untimed-setting.png' });
  await page.keyboard.press('Escape');
  await menu.getByRole('button', { name: 'がくしゅう', exact: true }).click();
  await page.getByRole('button', { name: /^さんすう・いまは/ }).click();
  await page.locator('.nq-roadmap-practice').click();
  await expect(page.locator('.nq-bq-slot .nq-q')).toBeVisible();
  await expect(page.locator('.nq-bq-slot .nq-timer')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/sansu-untimed-practice.png' });
});
