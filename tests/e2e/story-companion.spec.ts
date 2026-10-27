import { expect, test, type Page } from '@playwright/test';
import type Phaser from 'phaser';
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

async function moveOneTileUp(page: Page): Promise<void> {
  const canvas = page.locator('canvas[data-player-tile]');
  await expect(canvas).toHaveAttribute('data-player-tile', '25,35');
  await expect(canvas).toHaveAttribute('data-input-ready', 'true');
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await page.evaluate(async () => {
      const field = window.__nq.scene.getScene('Overworld') as Phaser.Scene & {
        fieldInput: { setTouchDirection(direction: 'up' | null): void };
      };
      field.fieldInput.setTouchDirection('up');
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      field.fieldInput.setTouchDirection(null);
    });
    await page.waitForTimeout(300);
    if ((await canvas.getAttribute('data-player-tile')) === '25,34') return;
  }
  await expect(canvas).toHaveAttribute('data-player-tile', '25,34');
}

test('岩手の町へ初到着すると限定3体から選び、選んだ相棒が保存される', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
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
  await moveOneTileUp(page);
  // フィールドが停止して会話対象を解決できた合図を待ち、同じ操作経路から話しかける。
  const talkAction = page.getByRole('button', { name: /はなす|話す/ });
  await expect(talkAction).toBeVisible({ timeout: 10_000 });
  await talkAction.click();
  const dialogue = page.locator('.nq-dlg');
  await expect(dialogue).toContainText(/むすびの.*やしろ/, { timeout: 10_000 });
  await expect(dialogue).toBeFocused();
  if ((await dialogue.locator('.nq-dlg-text').getAttribute('aria-live')) === 'off') await dialogue.click();
  await expect(dialogue.locator('.nq-dlg-text')).toHaveAttribute('aria-live', 'polite', { timeout: 20_000 });
  const kagurabi = page.getByRole('button', { name: /カグラビ/ });
  for (let step = 0; step < 24 && !(await kagurabi.isVisible()); step += 1) {
    if (await dialogue.isVisible()) await dialogue.click({ position: { x: 420, y: 410 } });
    await page.waitForTimeout(120);
  }

  await expect(kagurabi).toBeVisible();
  const starterImages = page.locator('.nq-musubi-card img');
  for (const [index, id] of ['iwate-kagurabi', 'iwate-izumiko', 'iwate-kodamaru'].entries()) {
    await expect(starterImages.nth(index)).toHaveAttribute('src', `/assets/sprites/monsters/${id}.png`);
    await expect
      .poll(() => starterImages.nth(index).evaluate((img) => (img as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(32);
  }
  await expect(page.getByRole('button', { name: /イズミコ/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /コダマル/ })).toBeVisible();
  const companionChoice = page.getByRole('dialog', { name: /むすび/ });
  await expect(companionChoice.getByRole('group')).toBeVisible();
  await expect(companionChoice).toHaveAttribute('aria-modal', 'true');
  await expect(companionChoice.locator('ruby')).not.toHaveCount(0);
  await expect(companionChoice).not.toContainText('[');
  await expect(kagurabi).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath('musubi-tama-choice.png'), fullPage: true });
  await page.setViewportSize({ width: 844, height: 390 });
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
  await expect(
    page
      .getByRole('dialog', { name: 'もちもの・へんせい' })
      .locator('img[src="/assets/sprites/monsters/iwate-kagurabi.png"]')
      .first(),
  ).toBeVisible();

  // 加入済みの同じセーブ状態を戦闘へ渡し、味方側も完成PNGで描画されることを確認。
  await page
    .getByRole('dialog', { name: 'もちもの・へんせい' })
    .getByRole('button', { name: /とじる/ })
    .click();
  await page
    .getByRole('dialog', { name: 'メニュー' })
    .getByRole('button', { name: /とじる/ })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const field = window.__nq.scene.getScene('Overworld') as Phaser.Scene & {
          fieldFlow: { isRunning: boolean };
        };
        return field.fieldFlow.isRunning;
      }),
    )
    .toBe(false);
  await page.evaluate(() => {
    const game = (window as unknown as { __nq: Phaser.Game }).__nq;
    const field = game.scene.getScene('Overworld') as unknown as {
      startBattle: (data: { enemyId: string; level: number; zone: 'field'; presentation: 'depth' }) => void;
    };
    field.startBattle({ enemyId: 'aomori-ringoron', level: 3, zone: 'field', presentation: 'depth' });
  });
  await expect
    .poll(() =>
      page.evaluate(() => ({
        battleActive: window.__nq.scene.isActive('Battle'),
        overworldPaused: window.__nq.scene.isPaused('Overworld'),
      })),
    )
    .toEqual({ battleActive: true, overworldPaused: true });
  await expect(page.locator('.nq-box-text')).toBeVisible({ timeout: 30_000 });
  const partner = await page.evaluate(() => {
    const game = (window as unknown as { __nq: Phaser.Game }).__nq;
    const battle = game.scene.getScene('Battle');
    const sprite = battle.children.list.find(
      (child) =>
        'texture' in child && (child as Phaser.GameObjects.Image).texture.key === 'mon.iwate-kagurabi',
    ) as Phaser.GameObjects.Image;
    return {
      width: sprite.displayWidth,
      height: sprite.displayHeight,
      sourceWidth: (sprite.texture.getSourceImage() as HTMLImageElement).naturalWidth,
    };
  });
  expect(partner.sourceWidth).toBeGreaterThan(32);
  expect(Math.max(partner.width, partner.height)).toBeCloseTo(160);
  await page.screenshot({ path: testInfo.outputPath('starter-partner-battle.png') });
});
