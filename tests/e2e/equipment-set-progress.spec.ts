import { expect, test, type Page } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

async function equipAomoriSet(page: Page): Promise<void> {
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
        state.player.equipment = {
          weapon: 'aomori-maguro-zutsuki',
          head: 'aomori-nebuta-no-kabuto',
          chest: 'aomori-ringo-no-yoroi',
          legs: 'aomori-hiba-no-koshiate',
          feet: 'aomori-tsugaru-nuri-boots',
        };
        state.progress.islandsCleared = ['tohoku'];
        state.party.bagPlacements = {
          ...state.party.bagPlacements,
          'eq:head': { x: 1, y: 0, rotated: false },
          'eq:weapon': { x: 2, y: 1, rotated: false },
          'eq:chest': { x: 0, y: 1, rotated: false },
          'eq:legs': { x: 0, y: 2, rotated: false },
          'eq:feet': { x: 2, y: 2, rotated: false },
        };
        state.updatedAt = Date.now();
        store.put(state, 'save:1');
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  });
}

test('完成した装備セットの名前と効果をバッグ詳細に表示する', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, 'セット確認');
  const storySkip = page.getByRole('button', { name: 'スキップ' });
  if (await storySkip.isVisible()) await storySkip.click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });

  await page.reload();
  await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeEnabled({ timeout: 30_000 });
  await equipAomoriSet(page);
  await page.reload();
  await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeEnabled({ timeout: 30_000 });
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await page.getByRole('button', { name: /スロット 1 Lv/ }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'メニュー' }).click();
  await page
    .getByRole('dialog', { name: 'メニュー' })
    .getByRole('button', { name: /もちもの・へんせい/ })
    .click();
  const bag = page.getByRole('dialog', { name: /もちもの・へんせい/ });
  await bag.getByRole('button', { name: 'マグロずつき' }).click();
  const detail = bag.locator('.nq-party-info');
  await expect(detail).toContainText('セットが そろった！');
  await expect(detail).toContainText('ミズ・モリの わざ +20%');
  await detail.locator('.nq-bag-line').filter({ hasText: 'セット' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('aomori-set-complete.png'), fullPage: true });
});
