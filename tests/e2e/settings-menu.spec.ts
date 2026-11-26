import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

test('設定の音量と移動キーは変更後も保存される', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, 'テスト');
  const openSettings = async () => {
    await page.getByRole('button', { name: 'メニュー', exact: true }).click();
    const cards = page.getByRole('dialog', { name: 'メニュー' }).locator('.nq-menu-card');
    await expect(cards).toHaveCount(6);
    const boxes = await Promise.all((await cards.all()).map((card) => card.boundingBox()));
    expect(boxes.every(Boolean)).toBe(true);
    expect(Math.abs(boxes[0]!.y - boxes[2]!.y)).toBeLessThanOrEqual(2);
    expect(Math.abs(boxes[3]!.y - boxes[5]!.y)).toBeLessThanOrEqual(2);
    expect(boxes[3]!.y).toBeGreaterThan(boxes[0]!.y);
    expect(boxes[3]!.x).toBe(boxes[0]!.x);
    await cards.nth(3).hover();
    await expect(cards.nth(3)).toBeFocused();
    await expect(cards.filter({ hasText: 'がくしゅう' })).toHaveCSS('color', 'rgb(255, 255, 255)');
    // マウスをもちものに残したままキーで移動しても、選択中の1枚だけを強調する。
    await page.keyboard.press('ArrowUp');
    await expect(cards.nth(0)).toBeFocused();
    await expect(cards.nth(3)).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(cards.nth(3)).toHaveCSS('outline-style', 'none');
    await expect(page.locator('.nq-menu-card.nq-focus')).toHaveCount(1);
    await page.keyboard.press('ArrowDown');
    await expect(cards.nth(3)).toBeFocused();
    await page
      .getByRole('dialog', { name: 'メニュー' })
      .getByRole('button', { name: /せってい/ })
      .click();
    await expect(page.getByRole('dialog', { name: 'せってい' })).toBeVisible();
  };
  await openSettings();
  const settings = page.getByRole('dialog', { name: 'せってい' });
  await settings.getByRole('slider', { name: /BGM/ }).fill('0.3');
  await settings.getByRole('slider', { name: /こうかおん/ }).fill('0.4');
  await settings.getByRole('combobox').selectOption('wasd');
  await settings.getByRole('button', { name: 'もどる' }).click();
  await page
    .getByRole('dialog', { name: 'メニュー' })
    .getByRole('button', { name: /とじる/ })
    .click();
  await page.waitForTimeout(1500);
  await page.goto('/');
  await page.getByRole('menuitem', { name: /つづきから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await expect(page.getByRole('button', { name: 'メニュー', exact: true })).toBeVisible({ timeout: 30_000 });
  await openSettings();
  await expect(settings.getByRole('slider', { name: /BGM/ })).toHaveValue('0.3');
  await expect(settings.getByRole('slider', { name: /こうかおん/ })).toHaveValue('0.4');
  await expect(settings.getByRole('combobox')).toHaveValue('wasd');
});
