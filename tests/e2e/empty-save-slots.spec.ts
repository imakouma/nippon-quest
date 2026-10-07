import { expect, test } from '@playwright/test';

test('ローカル確認URLで古いセーブを消し、3枠とも新規作成として表示する', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await expect(page.getByRole('menuitem', { name: /はじめから/ })).toBeVisible({ timeout: 30_000 });

  // 本当に既存データがあっても消えることを確認するため、壊れた旧データを3枠へ置く。
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nihonquest');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('saves', 'readwrite');
      const store = transaction.objectStore('saves');
      for (const slot of [1, 2, 3]) store.put({ old: true }, `save:${slot}`);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  });

  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  const slots = page.locator('.nq-save-slots > div > button');
  await expect(slots).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    await expect(slots.nth(index)).toContainText('あたらしく はじめる');
    await expect(slots.nth(index)).not.toContainText(/Lv|★|うわがき/);
  }
  await page.screenshot({ path: testInfo.outputPath('empty-save-slots.png'), fullPage: true });
});
