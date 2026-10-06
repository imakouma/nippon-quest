import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

test('歩行中もミニマップが残り、県マップを拡大してドラッグ移動できる', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, 'ちず');

  const miniMap = page.getByRole('button', { name: 'ちずを ひらく（M）' });
  await expect(miniMap).toBeVisible({ timeout: 40_000 });
  for (let i = 0; i < 24 && (await page.locator('.nq-dlg').count()); i++) {
    await page.locator('.nq-dlg').click();
    await page.waitForTimeout(40);
  }
  await expect(page.locator('.nq-dlg')).toHaveCount(0);

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(80);
  await expect(miniMap).toBeVisible();
  await page.keyboard.up('ArrowRight');

  await miniMap.click();
  const mapView = page.locator('.nq-amap-view');
  const mapCanvas = page.locator('.nq-amap-view .nq-wmap-canvas');
  await expect(mapView).toBeVisible();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();

  const box = await mapView.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -100);
  await page.keyboard.up('Control');
  await expect(page.getByText('150%', { exact: true })).toBeVisible();
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, 100);
  await page.keyboard.up('Control');
  await expect(page.getByText('100%', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'ちずを おおきくする' }).click();
  await expect(page.getByText('150%', { exact: true })).toBeVisible();
  await expect(mapCanvas).toHaveCSS('transform', /matrix\(1\.5, 0, 0, 1\.5,/);

  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 60, box!.y + box!.height / 2 + 40, { steps: 5 });
  await page.mouse.up();
  await expect(mapCanvas).not.toHaveCSS('transform', /matrix\(1\.5, 0, 0, 1\.5, 0, 0\)/);

  await page.getByRole('button', { name: 'もどす', exact: true }).click();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
  await expect(mapCanvas).toHaveCSS('transform', /matrix\(1, 0, 0, 1, 0, 0\)/);
});
