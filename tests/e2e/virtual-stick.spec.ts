import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

test.use({ hasTouch: true, isMobile: true, viewport: { width: 844, height: 390 } });

test('横画面のタッチ端末では薄いスティックでフィールド移動できる', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page);
  const skip = page.getByRole('button', { name: 'スキップ' });
  if (await skip.isVisible()) await skip.click();

  const stick = page.getByRole('group', { name: 'いどうスティック' });
  await expect(stick).toBeVisible({ timeout: 40_000 });
  await expect(stick).toHaveCSS('opacity', '0.42');

  const box = await stick.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.85, box!.y + box!.height / 2, { steps: 4 });
  await expect(stick).toHaveClass(/is-active/);
  await expect(stick).toHaveCSS('opacity', '0.68');
  await expect
    .poll(() => page.locator('#game-root canvas').getAttribute('data-last-movement'))
    .not.toBeNull();
  await page.mouse.up();
  await expect(stick).not.toHaveClass(/is-active/);
});
