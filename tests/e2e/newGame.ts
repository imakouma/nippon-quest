import type { Page } from '@playwright/test';

/** タイトルでは学年と最初の教科だけを決める。名前と見た目は物語内で設定する。 */
export async function completeNewGameSetup(page: Page, _name?: string): Promise<void> {
  await page.getByRole('combobox', { name: /がくねん/ }).selectOption('1');
  await page.getByRole('button', { name: 'はじめる' }).click();
}
