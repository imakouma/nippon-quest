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
    await page
      .getByRole('dialog', { name: 'メニュー' })
      .getByRole('button', { name: /せってい/ })
      .click();
    await expect(page.getByRole('dialog', { name: 'せってい' })).toBeVisible();
  };
  await openSettings();
  const settings = page.getByRole('dialog', { name: 'せってい' });
  const openCard = (name: string) => settings.getByRole('button', { name, exact: true }).click();
  const back = () =>
    settings
      .getByRole('button', { name: /もどる/ })
      .first()
      .click();
  await openCard('おと');
  await settings.getByRole('slider', { name: /BGM/ }).fill('0.3');
  await settings.getByRole('slider', { name: /こうかおん/ }).fill('0.4');
  await back();
  await openCard('そうさ');
  await settings.getByRole('button', { name: 'じゅうじキー' }).click();
  const practice = settings.locator('.nq-settings-preview canvas');
  const bounds = await practice.boundingBox();
  expect(bounds!.width / bounds!.height).toBeCloseTo(16 / 9, 2);
  const frame = () => practice.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await settings.getByRole('button', { name: /ためす/ }).click();
  const down = settings.getByRole('button', { name: 'した', exact: true });
  await down.hover();
  const beforeWalking = await frame();
  await page.mouse.down();
  try {
    await expect.poll(frame).not.toBe(beforeWalking);
  } finally {
    await page.mouse.up();
  }
  await settings.getByRole('button', { name: /きめる/ }).click();
  const sliders = settings.getByRole('slider');
  await sliders.nth(0).fill('68');
  await sliders.nth(1).fill('70');
  await sliders.nth(2).fill('150');
  await sliders.nth(3).fill('2');
  await expect(settings.locator('.nq-direction-pad')).toHaveCSS('opacity', '0.02');
  await settings.getByRole('combobox').selectOption('wasd');
  await back();
  await settings.getByRole('button', { name: 'もどる' }).click();
  await page
    .getByRole('dialog', { name: 'メニュー' })
    .getByRole('button', { name: /とじる/ })
    .click();
  const fieldPad = page.locator('.nq-fhud .nq-direction-pad');
  await expect(fieldPad).toHaveCSS('opacity', '0.02');
  await expect(fieldPad).toBeVisible();
  await expect(fieldPad).toHaveCSS('width', '216px');
  await page.waitForTimeout(1500);
  await page.goto('/');
  await page.getByRole('menuitem', { name: /つづきから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await expect(page.getByRole('button', { name: 'メニュー', exact: true })).toBeVisible({ timeout: 30_000 });
  await openSettings();
  await openCard('おと');
  await expect(settings.getByRole('slider', { name: /BGM/ })).toHaveValue('0.3');
  await expect(settings.getByRole('slider', { name: /こうかおん/ })).toHaveValue('0.4');
  await back();
  await openCard('そうさ');
  await expect(settings.getByRole('button', { name: 'じゅうじキー' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(sliders.nth(0)).toHaveValue('68');
  await expect(sliders.nth(1)).toHaveValue('70');
  await expect(sliders.nth(2)).toHaveValue('150');
  await expect(sliders.nth(3)).toHaveValue('2');
  await expect(settings.getByRole('combobox')).toHaveValue('wasd');
});
