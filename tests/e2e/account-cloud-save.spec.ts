import { expect, test, type BrowserContext } from '@playwright/test';
import { createNewGame } from '../../src/core/state/newGame';
import type { CloudSlot } from '../../src/core/state/cloudProtocol';

async function mockAccount(context: BrowserContext, account: { owner: string | null; slots: CloudSlot[] }) {
  await context.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/account/session')
      return route.fulfill({ json: { userId: account.owner, providers: ['google'] } });
    if (path === '/api/auth/sign-out') {
      account.owner = null;
      return route.fulfill({ json: { success: true } });
    }
    if (!account.owner || request.headers()['x-nq-owner'] !== account.owner)
      return route.fulfill({ status: 401, json: {} });
    if (path === '/api/account/slots') return route.fulfill({ json: account.slots });
    const slot = Number(path.split('/').at(-1));
    if (request.method() === 'PUT') {
      const input = request.postDataJSON();
      const current = account.slots.find((s) => s.slot === slot);
      if ((current?.revision ?? 0) !== input.revision) return route.fulfill({ status: 409, json: {} });
      const saved = { ...input, slot, revision: input.revision + 1 };
      account.slots = [...account.slots.filter((s) => s.slot !== slot), saved];
      return route.fulfill({ json: saved });
    }
    return route.fulfill({ status: 404, json: {} });
  });
}
test('未設定のログインを成功扱いにせず、ゲストプレイを維持する', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/account/session', (route) =>
    route.fulfill({ status: 503, json: { error: 'unconfigured' } }),
  );
  await page.goto('/?account=1');
  const dialog = page.getByRole('dialog', { name: 'アカウント' });
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  await expect(dialog.getByRole('button', { name: 'LINEでログイン' })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Googleでログイン' })).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath('account-unconfigured.png') });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menuitem', { name: 'はじめから' })).toBeEnabled();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.getByRole('menuitem', { name: 'アカウント', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'もどる' })).toBeInViewport();
  await expect(dialog.getByRole('button', { name: 'Googleでログイン' })).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('account-narrow.png') });
  expect(errors).toEqual([]);
});
test('ゲストの冒険を確認して引き継ぎ、別ブラウザで復元し、ログアウトでゲストへ戻る', async ({
  page,
  context,
  browser,
}, testInfo) => {
  test.setTimeout(90_000);
  const account = { owner: null as string | null, slots: [] as CloudSlot[] };
  await mockAccount(context, account);
  await page.goto('/');
  await expect(page.getByRole('menuitem', { name: 'はじめから' })).toBeEnabled({ timeout: 30_000 });
  const state = createNewGame({ name: 'ハル', grade: 3 });
  state.player.gold = 123;
  await page.evaluate(async (serialized) => {
    const state: unknown = JSON.parse(serialized);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('nihonquest');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('saves', 'readwrite');
      tx.objectStore('saves').put(state, 'save:1');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, JSON.stringify(state));
  account.owner = 'alice';
  await page.goto('/?account=1');
  const dialog = page.getByRole('dialog', { name: 'アカウント' });
  await expect(dialog).toBeVisible();
  const importButton = dialog.getByRole('button', { name: /この.*ぼうけん.*つぐ|この.*冒険.*継/ });
  await importButton.click();
  expect(account.slots).toHaveLength(0);
  await expect(dialog.getByRole('button', { name: 'やめる' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await expect(importButton).toBeFocused();
  expect(account.slots).toHaveLength(0);
  await importButton.click();
  await dialog.getByRole('button', { name: /はい/ }).click();
  await expect.poll(() => account.slots[0]?.state?.player.gold).toBe(123);
  await expect(dialog.locator('.nq-account-slot').first()).toContainText('ハル');
  await dialog.locator('.nq-account-body').evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({ path: testInfo.outputPath('account-linked-save.png') });
  const sameBrowser = await context.newPage();
  await sameBrowser.goto(new URL('/?account=1', page.url()).href);
  await expect(sameBrowser.getByRole('dialog')).toContainText('ほかの タブ', { timeout: 30_000 });
  await sameBrowser.getByRole('button', { name: 'もどる' }).click();
  await expect(sameBrowser.getByRole('menuitem', { name: 'はじめから' })).toBeDisabled();
  await expect(sameBrowser.getByRole('menuitem', { name: 'つづきから' })).toBeDisabled();
  await sameBrowser.close();
  const other = await browser.newContext({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
  await mockAccount(other, account);
  const otherPage = await other.newPage();
  await otherPage.goto(new URL('/?account=1', page.url()).href);
  await expect(otherPage.getByRole('dialog').locator('.nq-account-slot').first()).toContainText('ハル', {
    timeout: 30_000,
  });
  await other.close();
  await dialog
    .locator('summary')
    .filter({ hasText: /かんり|管理/ })
    .click();
  await dialog.getByRole('button', { name: 'ログアウト', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeEnabled();
  expect(account.owner).toBeNull();
});

test('起動リトライは遅い認証応答を待ち、ゲスト進行をアカウントへ混ぜない', async ({ page, context }) => {
  test.setTimeout(90_000);
  const cloud = createNewGame({ name: 'クラウド', grade: 3 });
  const account = {
    owner: 'alice',
    slots: [{ slot: 1 as const, revision: 1, mutation: crypto.randomUUID(), state: cloud }],
  };
  await mockAccount(context, account);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let waiting = false;
  await page.route('**/api/account/session', async (route) => {
    waiting = true;
    await gate;
    await route.fulfill({ json: { userId: 'alice', providers: ['google'] } });
  });
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'nq:retry-title-action',
      JSON.stringify({ type: 'continue', slot: 1, owner: 'alice' }),
    );
  });
  const writes: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'PUT' && request.url().includes('/api/account/slots/'))
      writes.push(request.postDataJSON().state?.player.name);
  });
  await page.goto('/');
  await expect.poll(() => waiting).toBe(true);
  await expect(page.getByRole('menuitem', { name: 'はじめから' })).toBeDisabled({ timeout: 30_000 });
  expect(writes).toEqual([]);
  release();
  await expect.poll(() => writes.length, { timeout: 60_000 }).toBeGreaterThan(0);
  expect(writes.every((name) => name === 'クラウド')).toBe(true);
});

test('Googleの接続失敗を説明して再試行でき、閉じた説明の中へTabが移らない', async ({ page, context }) => {
  await mockAccount(context, { owner: null, slots: [] });
  let attempts = 0;
  await page.route('**/api/auth/sign-in/social', async (route) => {
    attempts++;
    await route.fulfill({ status: 503, json: {} });
  });
  await page.goto('/?account=1');
  const dialog = page.getByRole('dialog');
  const login = dialog.getByRole('button', { name: 'Googleでログイン' });
  await login.click();
  await expect(dialog.getByRole('alert')).toContainText('Google');
  await expect(login).toBeEnabled();
  await login.click();
  await expect.poll(() => attempts).toBe(2);
  const disclosure = dialog.locator('summary');
  await disclosure.focus();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'もどる' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(disclosure).toBeFocused();
});

test('競合の上書きと未送信のログアウトを確認し、キャンセルでは冒険を変えない', async ({
  page,
  context,
}, testInfo) => {
  test.setTimeout(90_000);
  const local = createNewGame({ name: 'ハル', grade: 3 });
  const cloud = createNewGame({ name: 'ソラ', grade: 3 });
  const account = {
    owner: 'alice' as string | null,
    slots: [{ slot: 1 as const, revision: 2, mutation: crypto.randomUUID(), state: cloud }],
  };
  await mockAccount(context, account);
  await page.route('**/api/account/slots/2', (route) => route.fulfill({ status: 503, json: {} }));
  await page.goto('/?account=1');
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 30_000 });
  await page.evaluate(async (serialized) => {
    const state: unknown = JSON.parse(serialized);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('nihonquest');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('accounts', 'readwrite');
      for (const slot of [1, 2])
        tx.objectStore('accounts').put(
          {
            revision: slot === 1 ? 1 : 0,
            mutation: crypto.randomUUID(),
            dirty: true,
            state,
            backup: null,
          },
          `account:alice:slot:${slot}`,
        );
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, JSON.stringify(local));
  account.owner = 'alice';
  await page.goto('/?account=1');
  const dialog = page.getByRole('dialog');
  const conflict = dialog.locator('.nq-account-slot-conflict');
  await expect(conflict).toContainText('ハル');
  await expect(conflict).toContainText('ソラ');
  await expect(dialog.locator('.nq-account-slot-pending')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('account-conflict.png') });
  const useCloud = dialog.getByRole('button', { name: /サーバーの.*データを/ });
  await useCloud.click();
  await expect(dialog.getByRole('button', { name: 'やめる' })).toBeFocused();
  await expect(dialog.locator('.nq-account-confirm')).toContainText('ソラ');
  await expect(dialog.locator('.nq-account-confirm')).toContainText('ハル');
  await page.keyboard.press('Escape');
  await expect(useCloud).toBeFocused();
  await expect(conflict).toBeVisible();
  await dialog.locator('summary').click();
  const logout = dialog.getByRole('button', { name: 'ログアウト', exact: true });
  await logout.click();
  await expect(dialog.getByRole('button', { name: 'やめる' })).toBeFocused();
  expect(account.owner).toBe('alice');
  await page.keyboard.press('Escape');
  await expect(logout).toBeFocused();
  await useCloud.click();
  await dialog.getByRole('button', { name: /はい/ }).click();
  await expect(conflict).toHaveCount(0);
  await expect(dialog.locator('.nq-account-slot').first()).toContainText('ソラ');
  await expect(dialog.locator('.nq-account-slot-pending')).toHaveCount(1);
  await expect(dialog.getByRole('status')).toContainText(/切|き/);
  await page.setViewportSize({ width: 844, height: 390 });
  await dialog.getByRole('button', { name: /同期|どうき/ }).click();
  await expect(dialog.getByRole('button', { name: 'もどる' })).toBeInViewport();
  await expect(dialog.locator('.nq-account-slot-pending')).toHaveCount(1);
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('account-saves-narrow.png') });
  await dialog.getByRole('button', { name: /アカウントを.*さくじょ|アカウントを.*削除/ }).click();
  await dialog.getByRole('button', { name: /はい/ }).click();
  await expect(dialog.getByRole('alert')).toContainText('Google');
  expect(account.owner).toBe('alice');
});
