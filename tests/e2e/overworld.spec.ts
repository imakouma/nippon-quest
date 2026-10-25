import { expect, test, type Page } from '@playwright/test';
import { finishHeroIntroduction } from './helpers/onboarding';

interface SavedFieldState {
  inventory: Record<string, number>;
  progress: {
    currentArea: string;
    currentMap: string;
    position: { x: number; y: number };
    counters: Record<string, number>;
    eventsDone: string[];
    chestsOpened: string[];
  };
}

async function startField(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('menuitem', { name: /はじめから/ })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await page.getByRole('button', { name: 'はじめる' }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
  await finishHeroIntroduction(page);
}

async function teleport(
  page: Page,
  tile: [number, number],
  destination: { area: string; map: string } = { area: 'aomori', map: 'aomori-field' },
): Promise<void> {
  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.getByRole('button', { name: /ほごしゃ/ }).click();
  await page.getByLabel('こたえ').fill('12');
  await page.getByRole('button', { name: 'ひらく', exact: true }).click();
  await page.getByRole('button', { name: 'JSONを表示' }).click();
  const jsonBox = page.getByLabel('セーブデータJSON');
  const state = JSON.parse(await jsonBox.inputValue()) as SavedFieldState;
  state.progress.currentArea = destination.area;
  state.progress.currentMap = destination.map;
  state.progress.position = { x: tile[0] * 16, y: tile[1] * 16 };
  state.progress.counters['story.prologue'] = 1;
  await jsonBox.fill(JSON.stringify(state));
  await page.getByRole('button', { name: 'JSONを読みこむ' }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(750);
}

async function interactByKeyAndTap(page: Page): Promise<void> {
  await page.locator('#game-root canvas').click({ position: { x: 480, y: 270 } });
  await page.keyboard.press('Enter');
}

async function finishDialogue(page: Page): Promise<void> {
  const dialogue = page.locator('.nq-dlg');
  for (let step = 0; step < 30 && (await dialogue.isVisible()); step += 1) {
    await dialogue.click({ position: { x: 420, y: 410 } });
    await page.waitForTimeout(60);
  }
  await expect(dialogue).toHaveCount(0);
}

async function reachChoices(page: Page): Promise<void> {
  const choices = page.locator('.nq-dlg-choices');
  for (let step = 0; step < 30 && !(await choices.isVisible()); step += 1) {
    await page.locator('.nq-dlg').click({ position: { x: 420, y: 410 } });
    await page.waitForTimeout(60);
  }
  await expect(choices).toBeVisible();
}

async function areaMapHeroPosition(page: Page): Promise<{ x: number; y: number }> {
  await page.getByRole('button', { name: 'ちずを ひらく（M）' }).click();
  const hero = page.locator('.nq-wmap-hero');
  await expect(hero).toBeVisible();
  const box = await hero.boundingBox();
  if (!box) throw new Error('県の地図で主人公の位置を取得できませんでした');
  await page.getByRole('button', { name: /とじる/ }).click();
  return { x: box.x, y: box.y };
}

async function savedState(page: Page): Promise<SavedFieldState> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nihonquest');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const state = await new Promise<SavedFieldState>((resolve, reject) => {
      const request = database.transaction('saves').objectStore('saves').get('save:1');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    database.close();
    return state;
  });
}

async function walkOneTile(page: Page, key: 'ArrowUp' | 'ArrowDown'): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(80);
  await page.keyboard.up(key);
  await page.waitForTimeout(220);
}

async function suppressFadeCompletionAndCountRestarts(page: Page): Promise<void> {
  await page.evaluate(() => {
    const browser = window as unknown as {
      Phaser: {
        Events: { EventEmitter: { prototype: { emit: (event: string, ...args: unknown[]) => boolean } } };
        Scenes: { ScenePlugin: { prototype: { restart: (...args: unknown[]) => unknown } } };
      };
      __mapTransitionRestarts?: number;
    };
    const emitter = browser.Phaser.Events.EventEmitter.prototype;
    const originalEmit = emitter.emit;
    emitter.emit = function (event: string, ...args: unknown[]) {
      if (event === 'camerafadeoutcomplete') return false;
      return originalEmit.call(this, event, ...args);
    };

    const scenePlugin = browser.Phaser.Scenes.ScenePlugin.prototype;
    const originalRestart = scenePlugin.restart;
    browser.__mapTransitionRestarts = 0;
    scenePlugin.restart = function (...args: unknown[]) {
      browser.__mapTransitionRestarts = (browser.__mapTransitionRestarts ?? 0) + 1;
      return originalRestart.apply(this, args);
    };
  });
}

test('フィールドと町を往復すると対応する入口へ配置されて操作が戻る', async ({ page }) => {
  test.setTimeout(90_000);
  await startField(page);

  await walkOneTile(page, 'ArrowUp');
  await walkOneTile(page, 'ArrowUp');
  await expect
    .poll(async () => (await savedState(page)).progress, { timeout: 10_000 })
    .toMatchObject({ currentMap: 'aomori-town', position: { x: 400, y: 560 } });

  await page.waitForTimeout(450);
  await walkOneTile(page, 'ArrowDown');
  await walkOneTile(page, 'ArrowDown');
  await walkOneTile(page, 'ArrowDown');
  await expect
    .poll(async () => (await savedState(page)).progress, { timeout: 10_000 })
    .toMatchObject({ currentMap: 'aomori-field', position: { x: 976, y: 1088 } });

  await page.waitForTimeout(450);
  await walkOneTile(page, 'ArrowUp');
  await expect
    .poll(async () => (await savedState(page)).progress, { timeout: 10_000 })
    .toMatchObject({ currentMap: 'aomori-town', position: { x: 400, y: 560 } });
});

test('フィールドとダンジョンを往復すると対応する入口へ配置される', async ({ page }) => {
  test.setTimeout(90_000);
  await startField(page);
  await teleport(page, [84, 24]);

  await walkOneTile(page, 'ArrowUp');
  await expect
    .poll(async () => (await savedState(page)).progress, { timeout: 10_000 })
    .toMatchObject({ currentMap: 'aomori-dungeon', position: { x: 400, y: 560 } });

  await page.waitForTimeout(450);
  await walkOneTile(page, 'ArrowDown');
  await walkOneTile(page, 'ArrowDown');
  await walkOneTile(page, 'ArrowDown');
  await expect
    .poll(async () => (await savedState(page)).progress, { timeout: 10_000 })
    .toMatchObject({ currentMap: 'aomori-field', position: { x: 1344, y: 384 } });
});

test('船頭に頼んで県フィールドから離島へ移動する', async ({ page }) => {
  test.setTimeout(90_000);
  await startField(page);
  await teleport(page, [35, 48], { area: 'kagoshima', map: 'kagoshima-field' });

  await walkOneTile(page, 'ArrowUp');
  await interactByKeyAndTap(page);
  await expect(page.locator('.nq-dlg')).toBeVisible();
  await reachChoices(page);
  await page.getByRole('menuitem', { name: 'はい' }).click();
  await finishDialogue(page);

  await expect
    .poll(async () => (await savedState(page)).progress, { timeout: 10_000 })
    .toMatchObject({ currentMap: 'kagoshima-enclave', position: { x: 128, y: 528 } });
});

test('敗北後はフィールドの出発地点へ戻って入力が復帰する', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?debug=battle&enemy=aomori-ringoron&lv=99');
  const attack = page.locator('.nq-cmd[data-cmd="attack"]:not([disabled])');
  const result = page.locator('.nq-result');
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline && !(await result.isVisible())) {
    if (await attack.isVisible()) await attack.click({ force: true });
    else if (await page.locator('.nq-box').isVisible()) await page.locator('.nq-box').click({ force: true });
    await page.waitForTimeout(200);
  }

  await expect(result).toHaveAttribute('aria-label', 'まけてしまった…');
  await page.locator('[data-result-close]').click();
  await expect(page.locator('.nq-battle')).toHaveCount(0, { timeout: 20_000 });
  await page.waitForTimeout(1_000);
  await page.getByRole('button', { name: 'メニュー' }).click();
  await expect(page.getByRole('region', { name: 'がくしゅうロードマップ' })).toBeVisible();
});

test('fade 完了がなく連打されても fallback で一度だけ町へ移動する', async ({ page }) => {
  test.setTimeout(90_000);
  await startField(page);
  await suppressFadeCompletionAndCountRestarts(page);

  await walkOneTile(page, 'ArrowUp');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(180);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowUp');

  await expect
    .poll(async () => (await savedState(page)).progress, { timeout: 10_000 })
    .toMatchObject({ currentMap: 'aomori-town', position: { x: 400, y: 560 } });
  expect(
    await page.evaluate(
      () => (window as unknown as { __mapTransitionRestarts?: number }).__mapTransitionRestarts,
    ),
  ).toBe(1);
});

test('にほんちずで移動した後に入力が戻る', async ({ page }) => {
  test.setTimeout(90_000);
  await startField(page);

  await page.getByRole('button', { name: 'ちずを ひらく（M）' }).click();
  await page.getByRole('button', { name: 'にほんちず' }).click();
  await page.getByRole('button', { name: 'ここへ いく' }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'メニュー' }).click();
  await expect(page.getByRole('region', { name: 'がくしゅうロードマップ' })).toBeVisible();
});

test('名所はキーとタップを重ねても一度だけ始まり、閉じた後に移動できる', async ({ page }) => {
  test.setTimeout(120_000);
  await startField(page);
  await teleport(page, [58, 66]);

  await interactByKeyAndTap(page);
  await expect(page.locator('.nq-cutin')).toHaveCount(1);
  await expect(page.locator('.nq-cutin')).toContainText('ねぶた');

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(350);
  await page.keyboard.up('ArrowRight');
  await page.locator('.nq-cutin').click();
  await expect(page.locator('.nq-dlg')).toBeVisible();
  await finishDialogue(page);

  const lockedPosition = await areaMapHeroPosition(page);
  await page.waitForTimeout(300);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(350);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(250);
  const releasedPosition = await areaMapHeroPosition(page);
  expect(releasedPosition.x).toBeGreaterThan(lockedPosition.x);
});

test('宝箱はキーとタップを重ねても報酬を一度だけ与え、完了後に再び調べられる', async ({ page }) => {
  test.setTimeout(120_000);
  await startField(page);
  await teleport(page, [63, 38]);

  await interactByKeyAndTap(page);
  await expect(page.locator('.nq-cutin')).toHaveCount(1);
  await page.locator('.nq-cutin').click();
  await expect(page.locator('.nq-dlg')).toBeVisible();
  await finishDialogue(page);

  await expect
    .poll(async () => {
      const state = await savedState(page);
      return {
        apples: state.inventory['aomori-ringo'] ?? 0,
        opened: state.progress.chestsOpened.filter((key) => key === 'aomori-field:chest_aomori_field').length,
      };
    })
    .toEqual({ apples: 1, opened: 1 });

  await page.waitForTimeout(300);
  await interactByKeyAndTap(page);
  await expect(page.locator('.nq-dlg')).toContainText('からっぽ');
  await finishDialogue(page);
  expect((await savedState(page)).inventory['aomori-ringo']).toBe(1);
});

test('通常イベントはキーとタップを重ねても選択肢を一度だけ出し、見送った後に再開できる', async ({ page }) => {
  test.setTimeout(120_000);
  await startField(page);
  await teleport(page, [41, 87]);

  await interactByKeyAndTap(page);
  await expect(page.locator('.nq-cutin')).toHaveCount(1);
  await page.locator('.nq-cutin').click();
  await reachChoices(page);
  await expect(page.locator('.nq-dlg-choices')).toHaveCount(1);
  await page.getByRole('menuitem', { name: 'いいえ' }).click();
  await finishDialogue(page);
  expect((await savedState(page)).progress.eventsDone).not.toContain('aomori.ringoen');

  await page.waitForTimeout(300);
  await interactByKeyAndTap(page);
  await expect(page.locator('.nq-cutin')).toHaveCount(0);
  await reachChoices(page);
  await expect(page.locator('.nq-dlg-choices')).toHaveCount(1);
});
