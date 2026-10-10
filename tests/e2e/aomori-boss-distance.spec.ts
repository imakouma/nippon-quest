import { expect, test, type Page } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

async function walk(
  page: Page,
  key: 'ArrowRight' | 'ArrowUp',
  tiles: number,
  expected: 'move' | 'regionBoss' = 'move',
): Promise<void> {
  for (let tile = 0; tile < tiles; tile += 1) {
    const player = page.locator('canvas[data-player-tile]');
    const before = await player.getAttribute('data-player-tile');
    let decision: string | null = null;
    for (let attempt = 0; attempt < 10 && decision !== expected; attempt += 1) {
      await player.evaluate((canvas) => delete (canvas as HTMLElement).dataset.lastMovement);
      await page.keyboard.down(key);
      await page.waitForTimeout(60);
      await page.keyboard.up(key);
      await page.waitForTimeout(120);
      decision = await player.getAttribute('data-last-movement');
    }
    expect(decision, `移動判定 ${expected}（${before} から ${key}）`).toBe(expected);
    if (expected === 'move')
      await expect.poll(() => player.getAttribute('data-player-tile')).not.toBe(before);
  }
}

async function markIntroductionDone(page: Page): Promise<void> {
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
        state.player.name = 'ハル';
        state.progress.counters['story.prologue'] = 1;
        state.progress.counters['story.hero-identity'] = 1;
        state.updatedAt = Date.now();
        store.put(state, 'save:1');
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });
}

test('青森の最初のぬしは開始地点から離れた奥地にいて、ボス影で待ち構える', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));

  await page.goto('/?dev');
  await expect(page.getByRole('menuitem', { name: /はじめから/ })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page);
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
  await page.reload();
  await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeEnabled({ timeout: 30_000 });
  await markIntroductionDone(page);
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });

  // 通常エンカウントだけを止め、開始地点から実際の道を歩く。ボスは開発者モードでも残る。
  await page.getByRole('button', { name: 'かいはつしゃ' }).click();
  await expect(page.locator('.nq-dlg')).toBeVisible();
  for (let step = 0; step < 3 && (await page.locator('.nq-dlg').isVisible()); step += 1) {
    await page.locator('.nq-dlg').click();
    await page.waitForTimeout(100);
  }
  await expect(page.locator('.nq-dlg')).toHaveCount(0);
  await expect(page.locator('canvas[data-player-tile]')).toHaveAttribute('data-input-ready', 'true');
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await walk(page, 'ArrowRight', 10);
  await walk(page, 'ArrowUp', 11);

  await page.screenshot({ path: 'test-results/aomori-remote-boss.png' });
  await walk(page, 'ArrowUp', 1, 'regionBoss');
  await expect(page.locator('.nq-dlg')).toContainText('ねぶたまつりエリアの ぬし');
  for (
    let step = 0;
    step < 3 && !(await page.getByRole('menuitem', { name: 'はい' }).isVisible());
    step += 1
  ) {
    await page.locator('.nq-dlg').click();
    await page.waitForTimeout(100);
  }
  await expect(page.getByRole('menuitem', { name: 'はい' })).toBeVisible();
  expect(errors).toEqual([]);
});
