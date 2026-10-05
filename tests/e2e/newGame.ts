import type { Page } from '@playwright/test';

/** 必須になった新規ゲーム設定を、E2Eで同じ手順にそろえる。 */
export async function completeNewGameSetup(page: Page, name = 'ハル'): Promise<void> {
  await page.getByRole('textbox', { name: 'なまえ' }).fill(name);
  await page.getByRole('combobox', { name: /がくねん/ }).selectOption('1');
  await page.getByRole('button', { name: /ネブタン/ }).click();
  await page.getByRole('button', { name: 'はじめる' }).click();
}
