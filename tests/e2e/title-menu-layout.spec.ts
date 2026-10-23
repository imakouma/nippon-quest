import { expect, test } from '@playwright/test';

test('タイトルの2項目メニューは内容に合う幅で上下の余白がそろう', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto('/?resetSaves=1');

  const menu = page.locator('.nq-title-menu');
  const options = menu.locator('.nq-title-opt');
  await expect(menu).toBeVisible();
  await expect(options).toHaveCount(2);
  await expect
    .poll(() =>
      menu.evaluate((node) => node.getAnimations().every((animation) => animation.playState === 'finished')),
    )
    .toBe(true);

  const menuBox = await menu.boundingBox();
  const firstOptionBox = await options.first().boundingBox();
  const lastOptionBox = await options.last().boundingBox();
  expect(menuBox).not.toBeNull();
  expect(firstOptionBox).not.toBeNull();
  expect(lastOptionBox).not.toBeNull();

  expect(menuBox!.width).toBeLessThanOrEqual(320);
  const topGap = firstOptionBox!.y - menuBox!.y;
  const bottomGap = menuBox!.y + menuBox!.height - (lastOptionBox!.y + lastOptionBox!.height);
  expect(Math.abs(topGap - bottomGap)).toBeLessThanOrEqual(2);
});

test('タイトルメニューは左寄せで、装飾枠とハートを表示しない', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto('/?resetSaves=1');

  const menu = page.locator('.nq-title-menu');
  await expect(menu).toBeVisible();
  await expect(menu).not.toHaveClass(/nq-win/);
  await expect(menu.locator('.nq-heart')).toHaveCount(0);
  await expect(menu.locator('.nq-title-opt').first()).toHaveCSS('outline-style', 'none');

  await expect(menu).toHaveCSS('left', '376px');
});
