import { expect, test, type Page } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

async function putPlayerInIwateTown(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nihonquest');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('saves', 'readwrite');
      const store = transaction.objectStore('saves');
      const get = store.get('save:2');
      get.onerror = () => reject(get.error);
      get.onsuccess = () => {
        const state = get.result;
        state.progress.currentArea = 'iwate';
        state.progress.currentMap = 'iwate-town';
        state.progress.position = { x: 400, y: 560 };
        state.progress.counters['story.prologue'] = 1;
        state.party = {
          owned: [],
          activeUid: null,
          team: [],
          reserve: [],
          bagPlacements: { hero: { x: 0, y: 0, rotated: false } },
        };
        state.updatedAt = Date.now();
        store.put(state, 'save:2');
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  });
}

async function savedCompanion(page: Page): Promise<string | null> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nihonquest');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const state = await new Promise<
      { party?: { owned?: Array<{ monsterId?: string }> }; progress?: { eventsDone?: string[] } } | undefined
    >((resolve, reject) => {
      const request = database.transaction('saves').objectStore('saves').get('save:2');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    database.close();
    return state?.progress?.eventsDone?.includes('story.companion-chosen')
      ? (state.party?.owned?.[0]?.monsterId ?? null)
      : null;
  });
}

test('岩手の町へ初到着すると限定3体から選び、選んだ相棒が保存される', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 2/ }).click();
  await completeNewGameSetup(page);
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });

  // 稼働中のオートセーブを止めてから、青森を終えて岩手の町へ着いた状態を作る。
  await page.reload();
  await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeEnabled({ timeout: 30_000 });
  await putPlayerInIwateTown(page);
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await page.getByRole('button', { name: /スロット 2 Lv/ }).click();

  const arrival = page.locator('.nq-cutscene-arrival');
  await expect(arrival).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => arrival.evaluate((element) => getComputedStyle(element).userSelect)).toBe('none');
  await page.screenshot({ path: testInfo.outputPath('dialogue-no-selection.png'), fullPage: true });
  for (let step = 0; step < 10 && (await arrival.isVisible()); step += 1) {
    await page.locator('.nq-cutscene-advance').click();
    await page.waitForTimeout(120);
  }
  await expect(arrival).toHaveCount(0);

  // 入口のすぐ北にある、むすびの社の守り人へ自分で歩いて話しかける。
  await page.waitForTimeout(300);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(250);
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(250);
  await page.keyboard.press('z');
  const dialogue = page.locator('.nq-dlg');
  await expect(dialogue).toContainText(/むすびの.*やしろ/, { timeout: 10_000 });
  await expect(dialogue).toBeFocused();
  await expect(dialogue.locator('.nq-dlg-text')).toHaveAttribute('aria-live', 'polite');
  const kagurabi = page.getByRole('button', { name: /カグラビ/ });
  for (let step = 0; step < 24 && !(await kagurabi.isVisible()); step += 1) {
    if (await dialogue.isVisible()) await dialogue.click({ position: { x: 420, y: 410 } });
    await page.waitForTimeout(120);
  }

  await expect(kagurabi).toBeVisible();
  await expect(page.getByRole('button', { name: /イズミコ/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /コダマル/ })).toBeVisible();
  const companionChoice = page.getByRole('dialog', { name: /むすび/ });
  await expect(companionChoice.getByRole('group')).toBeVisible();
  await expect(companionChoice).toHaveAttribute('aria-modal', 'true');
  await expect(kagurabi).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath('musubi-tama-choice.png'), fullPage: true });
  await page.setViewportSize({ width: 480, height: 720 });
  await expect(kagurabi).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('musubi-tama-choice-narrow.png'), fullPage: true });
  await page.setViewportSize({ width: 960, height: 540 });
  await kagurabi.click();
  await expect(page.locator('.nq-musubi-detail')).toContainText(/かぐら.*火/);
  await page.getByRole('button', { name: /この 子.*むすぶ/ }).click();
  await expect(dialogue).toContainText('カグラビ');

  await expect.poll(() => savedCompanion(page), { timeout: 20_000 }).toBe('iwate-kagurabi');
  for (let step = 0; step < 40 && (await dialogue.isVisible()); step += 1) {
    await dialogue.click({ position: { x: 420, y: 410 } });
    await page.waitForTimeout(120);
  }
  await expect(dialogue).toHaveCount(0);
  await page.getByRole('button', { name: 'メニュー' }).click();
  await page
    .getByLabel('メニュー')
    .getByRole('button', { name: /もちもの・へんせい/ })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'もちもの・へんせい' }).getByRole('button', { name: 'カグラビ' }),
  ).toBeVisible();
});
