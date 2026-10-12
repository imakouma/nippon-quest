import { expect, test } from '@playwright/test';

test('ゲームUIはスマホのタップ色と長押しテキスト選択を表示しない', async ({ page }) => {
  await page.goto('/');

  const uiLayer = page.locator('#ui-layer');
  const menuItem = page.getByRole('menuitem').first();
  await expect(menuItem).toBeVisible();

  const selection = await uiLayer.evaluate((node) => getComputedStyle(node).userSelect);
  const tapColor = await menuItem.evaluate((node) =>
    getComputedStyle(node).getPropertyValue('-webkit-tap-highlight-color'),
  );

  expect(selection).toBe('none');
  expect(tapColor).toBe('rgba(0, 0, 0, 0)');
});
