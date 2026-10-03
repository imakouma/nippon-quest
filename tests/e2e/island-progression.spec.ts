import { expect, test, type Page } from '@playwright/test';

const TOHOKU_SIGNS = ['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima'];

async function clickThroughDialogue(page: Page, stopWhen?: () => Promise<boolean>): Promise<void> {
  for (let step = 0; step < 80; step += 1) {
    if (stopWhen && (await stopWhen())) return;
    const dialogue = page.locator('.nq-dlg');
    if (!(await dialogue.isVisible())) return;
    await dialogue.click({ position: { x: 420, y: 410 } });
    await page.waitForTimeout(80);
  }
  throw new Error('会話をタップだけで最後まで進められませんでした');
}

async function seedTohokuBossReady(page: Page): Promise<void> {
  await seedTohokuSigns(page, TOHOKU_SIGNS);
}

async function seedTohokuSigns(page: Page, signs: string[]): Promise<void> {
  await page.evaluate(async (signs) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nihonquest');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('saves', 'readwrite');
      const store = transaction.objectStore('saves');
      const get = store.get('save:3');
      get.onerror = () => reject(get.error);
      get.onsuccess = () => {
        const state = get.result;
        state.player.baseStats = { hp: 9_999, mp: 999, atk: 9_999, def: 9_999, spd: 9_999, wis: 9_999 };
        state.player.hp = 9_999;
        state.player.mp = 999;
        state.progress.areaSigns = signs;
        state.progress.islandsCleared = [];
        state.progress.counters['story.prologue'] = 1;
        state.updatedAt = Date.now();
        store.put(state, 'save:3');
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  }, signs);
}

test('東北6県のしるしが1つでも欠けると地方ボスへ挑戦できない', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await expect(page.getByRole('menuitem', { name: /はじめから/ })).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(500);
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 3/ }).click();
  await page.getByRole('button', { name: 'はじめる' }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
  await clickThroughDialogue(page);

  await page.reload();
  await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeEnabled({ timeout: 30_000 });
  await seedTohokuSigns(
    page,
    TOHOKU_SIGNS.filter((area) => area !== 'fukushima'),
  );
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await page.getByRole('button', { name: /スロット 3 ハル/ }).click();
  await page.getByRole('button', { name: 'ちずを ひらく（M）' }).click({ timeout: 30_000 });
  await page.getByRole('button', { name: 'にほんちず' }).click();

  await expect(page.locator('.nq-wmap-island-boss')).toContainText('5/6');
  await expect(page.getByRole('button', { name: /地方.*ボスに いどむ/ })).toHaveCount(0);
});

async function savedTohokuClear(page: Page): Promise<boolean> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nihonquest');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const state = await new Promise<{ progress?: { islandsCleared?: string[] } } | undefined>(
      (resolve, reject) => {
        const request = database.transaction('saves').objectStore('saves').get('save:3');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      },
    );
    database.close();
    return state?.progress?.islandsCleared?.includes('tohoku') ?? false;
  });
}

test('タップだけで東北地方ボスを倒し、再読込後もバッグ拡張と北海道の結界が残る', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));

  await page.goto('/');
  await expect(page.getByRole('menuitem', { name: /はじめから/ })).toBeVisible({ timeout: 30_000 });
  // 起動直後のセーブ確認によるタイトル再描画を待ってからタップする。
  await page.waitForTimeout(500);
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await expect(page.locator('.nq-save-slots')).toBeVisible();
  await page.getByRole('button', { name: /スロット 3/ }).click();
  await page.getByRole('button', { name: 'はじめる' }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
  await clickThroughDialogue(page);

  // ゲーム画面を終了してオートセーブの発生源を止めてから、E2E用の進行状態を直接注入する。
  // プレイ中に注入すると、先に作られた古いスナップショットが後着して上書きし得る。
  await page.reload();
  await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeEnabled({ timeout: 30_000 });
  await seedTohokuBossReady(page);
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await page.getByRole('button', { name: /スロット 3 ハル/ }).click();
  await expect(page.getByRole('button', { name: 'ちずを ひらく（M）' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'ちずを ひらく（M）' }).click();
  await page.getByRole('button', { name: 'にほんちず' }).click();

  await expect(page.locator('.nq-wmap-island-boss')).toContainText('お城');
  await expect(page.locator('.nq-wmap-island-boss')).toContainText('ひらいた');
  const challenge = page.getByRole('button', { name: /地方.*ボスに いどむ/ });
  await expect(challenge).toBeVisible();
  await challenge.click();

  const yes = page.getByRole('menuitem', { name: 'はい' });
  await clickThroughDialogue(page, () => yes.isVisible());
  await yes.click();

  await expect(page.locator('.nq-box')).toBeVisible({ timeout: 30_000 });
  // 文字送り中の戦闘開始文を1回目のタップで即時表示する。
  await page.locator('.nq-box').click();
  await expect(page.locator('.nq-box-text')).toContainText('ロクフユノオウ');
  await expect(page.locator('.nq-box-next')).toBeVisible();
  await page.locator('.nq-box').click();
  const attack = page.locator('.nq-cmd[data-cmd="attack"]:not([disabled])');
  const battleDeadline = Date.now() + 60_000;
  while (Date.now() < battleDeadline && !(await page.locator('.nq-result').isVisible())) {
    if (await attack.isVisible()) await attack.click().catch(() => undefined);
    else if (await page.locator('.nq-box-next').isVisible())
      await page
        .locator('.nq-box')
        .click()
        .catch(() => undefined);
    await page.waitForTimeout(150);
  }
  await expect(page.locator('.nq-result')).toContainText(/しょうり|勝利/);
  await page.locator('[data-result-close]').click();
  // 勝利後のレベルアップ等の戦闘メッセージもタップで送る。
  for (let step = 0; step < 40 && (await page.locator('.nq-battle').isVisible()); step += 1) {
    const message = page.locator('.nq-box');
    if (await message.isVisible()) await message.click();
    await page.waitForTimeout(100);
  }
  await expect(page.locator('.nq-battle')).toHaveCount(0, { timeout: 20_000 });

  await expect(page.locator('.nq-dlg')).toBeVisible({ timeout: 20_000 });
  await page.locator('.nq-dlg').click({ position: { x: 420, y: 410 } });
  await expect(page.locator('.nq-dlg')).toContainText('なぜ おまえが');
  await clickThroughDialogue(page);
  await page.getByRole('button', { name: 'バッグ' }).click();
  await expect(page.locator('.nq-bag-grid')).toHaveCSS('grid-template-columns', '76px 76px 76px');
  await expect(page.locator('.nq-bag-grid')).toHaveCSS('grid-template-rows', '76px 76px');
  await page.getByRole('button', { name: /とじる/ }).click();
  await expect.poll(() => savedTohokuClear(page), { timeout: 20_000 }).toBe(true);

  await page.reload();
  await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeEnabled({ timeout: 30_000 });
  await page.waitForTimeout(500);
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await page.getByRole('button', { name: /スロット 3 ハル/ }).click();
  await expect(page.getByRole('button', { name: 'ちずを ひらく（M）' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'ちずを ひらく（M）' }).click();
  await page.getByRole('button', { name: 'にほんちず' }).click();
  await expect(page.getByRole('button', { name: /浄化.*ずみ/ })).toBeDisabled();
  await page.locator('.nq-wmap-arrow').filter({ hasText: '▶' }).click();
  await expect(page.locator('.nq-wmap-barrier')).toContainText('結界');
  await expect(page.locator('.nq-wmap-barrier')).toContainText('上陸');
  await expect(page.getByRole('button', { name: /いく/ })).toBeDisabled();
  expect(errors).toEqual([]);
});
