import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

test.use({ hasTouch: true });

test('カードで変更した音量と移動操作の設定が保存される', async ({ page }) => {
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
    for (let i = 1; i < boxes.length; i += 1) {
      expect(boxes[i]!.x).toBe(boxes[0]!.x);
      expect(boxes[i]!.y).toBeGreaterThan(boxes[i - 1]!.y);
    }
    await cards.nth(3).hover();
    await expect(cards.nth(3)).toBeFocused();
    await expect(cards.filter({ hasText: 'がくしゅう' })).toHaveCSS('color', 'rgb(255, 255, 255)');
    // マウスをもちものに残したままキーで移動しても、選択中の1枚だけを強調する。
    await page.keyboard.press('ArrowUp');
    await expect(cards.nth(2)).toBeFocused();
    await expect(cards.nth(3)).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(cards.nth(3)).toHaveCSS('outline-style', 'none');
    await expect(page.locator('.nq-menu-card.nq-focus')).toHaveCount(1);
    await page.keyboard.press('ArrowDown');
    await expect(cards.nth(3)).toBeFocused();
