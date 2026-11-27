import { expect, test, type Page } from '@playwright/test';
import { createNewGame } from '../../src/core/state/newGame';

const questionId = 'kokugo.g1.bun-no-kimari.0001';

async function openNotebook(page: Page) {
  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.locator('.nq-menu-card-mistakes').click();
  await expect(page.locator('.nqn-hero')).toBeVisible();
}

test('まちがいノートで解き直して手押しの記録を見返せる', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).waitFor();
  const game = createNewGame({ name: 'ハル', grade: 1 });
  game.progress.counters['story.prologue'] = 1;
  game.learning.mistakes = [questionId];
  await page.evaluate(async (state) => {
    const open = (version?: number) =>
      new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('nihonquest', version);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('saves')) request.result.createObjectStore('saves');
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    let db = await open();
    if (!db.objectStoreNames.contains('saves')) {
      const version = db.version + 1;
      db.close();
      db = await open(version);
    }
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('saves', 'readwrite');
      transaction.objectStore('saves').put(state, 'save:1');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  }, game);
  const continueGame = async () => {
    await page.reload();
    await page.getByRole('menuitem', { name: /つづきから/ }).click();
    await page.getByRole('button', { name: /スロット 1/ }).click();
    await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
  };
  await continueGame();
  await openNotebook(page);
  await page.locator('.nqn footer button').nth(1).click();
  await page.locator('.nqn-subjects button').first().click();
  await expect(page.locator('.nqn-journal')).toBeVisible();
  await page.locator('.nqn-questions button').first().click();
  await page.getByRole('button', { name: /まる/ }).click();
  await expect(page.locator('.nqn-zoom')).toBeVisible();
  await page.locator('.nqn-zoom').click();
  await page.locator('.nqn-see-card').click();
  await expect(page.locator('.nqn-slots .nqn-ink')).toHaveCount(1);
  await page.locator('.nqn-slots button').first().click();
  await expect(page.locator('.nqn-panel')).toContainText('ふつうの');
  await page.locator('.nqn-panel button').click();
  await expect(page.getByRole('button', { name: /まる/ })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('nihonquest');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        try {
          return await new Promise<number>((resolve, reject) => {
            const request = db.transaction('saves').objectStore('saves').get('save:1');
            request.onsuccess = () => resolve(request.result?.learning.reviewStamps?.length ?? 0);
            request.onerror = () => reject(request.error);
          });
        } finally {
          db.close();
        }
      }),
    )
    .toBe(1);
  await continueGame();
  await openNotebook(page);
  await page.locator('.nqn footer button').last().click();
  await expect(page.locator('.nqn-slots .nqn-ink')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('review-stamp.png') });
});
