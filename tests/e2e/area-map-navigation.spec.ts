import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

test('歩行中も場所名とミニマップが残り、県マップを拡大してドラッグ移動できる', async ({ page }, testInfo) => {
  test.setTimeout(150_000);
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, 'ちず');

  const miniMap = page.getByRole('button', { name: 'ちずを ひらく', exact: true });
  await expect(miniMap).toBeVisible({ timeout: 40_000 });
  await expect(miniMap).toHaveAttribute('aria-keyshortcuts', 'M');
  await expect(page.getByRole('button', { name: 'メニュー' })).toHaveAttribute('aria-keyshortcuts', 'I');
  await expect(miniMap.locator('.nq-mini-open')).toHaveText('ちずを ひらく');
  await expect(page.getByRole('button', { name: 'かいはつしゃ' })).toBeVisible();
  const skip = page.getByRole('button', { name: 'スキップ', exact: true });
  if (await skip.isVisible()) await skip.click();
  for (let i = 0; i < 24 && (await page.locator('.nq-dlg').count()); i++) {
    await page.locator('.nq-dlg').click();
    await page.waitForTimeout(40);
  }
  await expect(page.locator('.nq-dlg')).toHaveCount(0);

  const place = page.locator('.nq-fhud-row');
  const player = page.locator('canvas[data-player-tile]');
  const tileBeforeWalking = await player.getAttribute('data-player-tile');
  await expect(place).toContainText(/青森/);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(80);
  await expect(place).toBeVisible();
  await expect(place).toHaveCSS('opacity', '1');
  await expect(place).toContainText(/青森/);
  await expect(miniMap).toBeVisible();
  await page.keyboard.up('ArrowRight');
  await expect.poll(() => player.getAttribute('data-player-tile')).not.toBe(tileBeforeWalking);
  const surroundingPixels = await page
    .locator('.nq-mini-map > canvas:not(.nq-mini-detail)')
    .evaluate((canvas) => {
      const context = (canvas as HTMLCanvasElement).getContext('2d');
      return context
        ? context
            .getImageData(0, 0, context.canvas.width, context.canvas.height)
            .data.some((v, i) => i % 4 === 3 && v > 0)
        : false;
    });
  expect(surroundingPixels).toBe(true);

  await miniMap.click();
  const mapView = page.locator('.nq-amap-view');
  const mapCanvas = page.locator('.nq-amap-view .nq-wmap-canvas');
  const areaMapDialog = page.getByRole('dialog');
  await expect(mapView).toBeVisible();
  await expect(areaMapDialog).toBeVisible();
  await expect(areaMapDialog.getByText(/まだ ワープできる ばしょが ない/)).toBeVisible();
  await expect(areaMapDialog.getByRole('button', { name: 'ワープ先を さがそう' })).toHaveCount(0);
  const unavailableWarp = areaMapDialog.locator('.nq-wmap-next');
  await expect(unavailableWarp).toContainText('ワープ先');
  await expect(unavailableWarp.locator('ruby')).toHaveCount(1);
  await expect(unavailableWarp).not.toContainText('[');
  await expect(areaMapDialog.getByRole('button', { name: 'にほんちず' })).toBeFocused();
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

  // 県のしるしがそろうまでは、地方ボスの存在・名前・城を先に見せない。
  await page.getByRole('button', { name: 'にほんちず' }).click();
  await expect(page.locator('.nq-wmap-island-boss')).toHaveCount(0);
  await expect(page.locator('.nq-wmap-castle')).toHaveCount(0);
  const selectedJapanRegion = page.locator('.nq-japan-region-list .nq-focus');
  await expect(selectedJapanRegion).toBeFocused();
  await expect(selectedJapanRegion).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.nq-japan-region-list .nq-focus')).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath('locked-island-boss-hidden.png'), fullPage: true });

  await page.getByRole('button', { name: /この ちほうを くわしく みる/ }).click();
  await expect(page.getByRole('button', { name: 'まえの ちほう' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'つぎの ちほう' })).toBeVisible();
  await page.getByRole('button', { name: /ぜんこく/ }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /とじる/ })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(miniMap).toBeFocused();
});

test('鳥取県の大きな地図で現在県だけを詳しく、周辺県を暗く表示する', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, 'ちず');
  await expect(page.getByRole('dialog', { name: 'ものがたりの シーン' })).toBeVisible({ timeout: 40_000 });
  await page.getByRole('button', { name: 'スキップ' }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeEnabled({ timeout: 30_000 });
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nihonquest');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('saves', 'readwrite');
      const store = transaction.objectStore('saves');
      const request = store.get('save:1');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const state = request.result;
        state.progress.currentArea = 'tottori';
        state.progress.currentMap = 'tottori-field';
        state.progress.position = { x: 1328, y: 224 };
        state.progress.counters['story.chapter.chugoku'] = 1;
        for (const area of ['shimane', 'okayama', 'hiroshima', 'yamaguchi']) {
          state.progress.counters[`visit:${area}-field`] = 1;
        }
        store.put(state, 'save:1');
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  });
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await page.getByRole('button', { name: /スロット 1 Lv/ }).click();

  const miniMap = page.getByRole('button', { name: 'ちずを ひらく', exact: true });
  await expect(miniMap).toBeVisible({ timeout: 40_000 });
  await miniMap.click();
  await expect(page.locator('.nq-amap-view')).toBeVisible();
  await expect(page.locator('.nq-amap-region-context')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('tottori-area-map.png'), fullPage: true });
});
