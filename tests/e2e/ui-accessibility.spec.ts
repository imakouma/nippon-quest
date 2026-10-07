import { expect, test, type Page } from '@playwright/test';
import { finishHeroIntroduction } from './helpers/onboarding';

async function startGame(page: Page) {
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await page.getByRole('button', { name: 'はじめる' }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 40_000 });
  await finishHeroIntroduction(page);
}

for (const width of [640, 960]) {
  test(`主要UIは ${width}x540 に収まり、キーボードの現在位置が一致する`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 540 });
    await page.goto('/');

    const first = page.getByRole('menuitem').first();
    await expect(page.getByRole('menuitem')).toHaveCount(2);
    await expect(page.getByRole('menuitem', { name: /もんだいいちらん/ })).toHaveCount(0);
    await expect(first).toBeFocused();
    await expect(page.getByRole('menuitem').nth(1)).toBeDisabled();
    await page.keyboard.press('ArrowDown');
    await expect(first).toBeFocused();
    await expect(page.locator('.nq-title-menu')).toHaveCSS('opacity', '1', { timeout: 5_000 });

    const layer = page.locator('#ui-layer');
    const box = await layer.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(541);
    await page.screenshot({ path: `/tmp/nihonquest-title-${width}x540.png` });
  });
}

test('メニューと保護者画面はモーダルとしてフォーカスを管理する', async ({ page }) => {
  test.setTimeout(90_000);
  await startGame(page);
  const opener = page.getByRole('button', { name: 'メニュー' });
  await opener.focus();
  await opener.click();

  const menu = page.getByRole('dialog', { name: 'メニュー' });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('aria-modal', 'true');
  await expect(menu.getByRole('button', { name: 'がくしゅう' })).toBeFocused();
  await page.screenshot({ path: '/tmp/nihonquest-roadmap-960x540.png' });

  await page.getByRole('button', { name: /ほごしゃ/ }).click();
  const parent = page.getByRole('dialog', { name: /ほごしゃ/ });
  await expect(parent).toBeVisible();
  await expect(parent).toHaveAttribute('aria-modal', 'true');
  await expect(page.getByLabel('こたえ')).toBeFocused();
  await page.screenshot({ path: '/tmp/nihonquest-parent-960x540.png' });

  await page.setViewportSize({ width: 640, height: 540 });
  const parentBox = await parent.boundingBox();
  expect(parentBox).not.toBeNull();
  expect(parentBox!.x).toBeGreaterThanOrEqual(0);
  expect(parentBox!.x + parentBox!.width).toBeLessThanOrEqual(641);
  await page.screenshot({ path: '/tmp/nihonquest-parent-640x540.png' });

  await page.keyboard.press('Escape');
  await expect(parent).toHaveCount(0);
  await expect(menu).toBeVisible();
});

test('バトル画面は狭い表示でもステージ内に収まる', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 640, height: 540 });
  await page.goto('/?debug=battle&enemy=aomori-ringoron&lv=8');
  await expect(page.locator('.nq-battle')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.nq-box-text')).toContainText('リンゴロン', { timeout: 30_000 });
  const enemyWindow = page.locator('.nq-foe');
  await expect(enemyWindow.getByText('てき', { exact: true })).toHaveCount(0);
  await expect(enemyWindow.locator('.nq-foe-level')).toHaveText('Lv 8');
  expect(
    Number.parseFloat(await enemyWindow.locator('.nq-foe-level').evaluate((node) => getComputedStyle(node).fontSize)),
  ).toBeGreaterThanOrEqual(20);
  const battleBox = await page.locator('.nq-battle').boundingBox();
  expect(battleBox).not.toBeNull();
  expect(battleBox!.x).toBeGreaterThanOrEqual(0);
  expect(battleBox!.x + battleBox!.width).toBeLessThanOrEqual(641);
  await page.screenshot({ path: '/tmp/nihonquest-battle-640x540.png' });
});
