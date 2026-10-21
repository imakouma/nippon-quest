import { expect, test, type Page } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

async function pulseDirection(page: Page, key: 'ArrowRight' | 'ArrowUp'): Promise<void> {
  await page.evaluate(async (arrow) => {
    const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-player-tile]');
    if (!canvas) throw new Error('フィールドの canvas が見つかりません');
    const before = canvas.dataset.playerTile;
    const direction = arrow === 'ArrowRight' ? 'right' : 'up';
    const field = window.__nq.scene.getScene('Overworld') as unknown as {
      fieldInput: { setTouchDirection(direction: 'right' | 'up' | null): void };
    };
    await new Promise<void>((resolve) => {
      let timeout = 0;
      const finish = () => {
        observer.disconnect();
        window.clearTimeout(timeout);
        field.fieldInput.setTouchDirection(null);
        resolve();
      };
      const observer = new MutationObserver(() => {
        const decision = canvas.dataset.lastMovement;
        if (canvas.dataset.playerTile !== before || (decision && decision !== 'move')) finish();
      });
      observer.observe(canvas, {
        attributes: true,
        attributeFilter: ['data-last-movement', 'data-player-tile'],
      });
      timeout = window.setTimeout(finish, 1_000);
      field.fieldInput.setTouchDirection(direction);
    });
  }, key);
}

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
    let moved = false;
    let sawExpected = false;
    for (let attempt = 0; attempt < 10 && !(sawExpected && (expected !== 'move' || moved)); attempt += 1) {
      await player.evaluate((canvas) => delete (canvas as HTMLElement).dataset.lastMovement);
      await pulseDirection(page, key);
      decision = await player.getAttribute('data-last-movement');
      sawExpected ||= decision === expected;
      moved = (await player.getAttribute('data-player-tile')) !== before;
    }
    expect(sawExpected, `移動判定 ${expected}（${before} から ${key}）`).toBe(true);
    if (expected === 'move') expect(moved, `${before} から ${key} で実際に移動する`).toBe(true);
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
        delete state.progress.counters['tutorial.battle-basics.pending'];
        if (!state.progress.eventsDone.includes('tutorial.battle-basics'))
          state.progress.eventsDone.push('tutorial.battle-basics');
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

  // 通常状態のボス配置を確認するため、説明を閉じてランダム戦闘の乱数判定だけを止める。
  const dialogue = page.locator('.nq-dlg');
  for (let step = 0; step < 12 && (await dialogue.isVisible()); step += 1) {
    await dialogue.click();
    await page.waitForTimeout(100);
  }
  await expect(dialogue).toHaveCount(0);
  await page.evaluate(() => {
    const game = (
      window as unknown as {
        __nq: { scene: { getScene(key: string): unknown } };
      }
    ).__nq;
    const field = game.scene.getScene('Overworld') as { rng: { chance: () => boolean } };
    field.rng.chance = () => false;
  });
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const game = (
            window as unknown as {
              __nq: { scene: { getScene(key: string): unknown } };
            }
          ).__nq;
          return (game.scene.getScene('Overworld') as { busy: boolean }).busy;
        }),
      { timeout: 10_000 },
    )
    .toBe(false);
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
