import { expect, test } from '@playwright/test';
import { finishHeroIntroduction } from './helpers/onboarding';

interface SavedMvpState {
  progress: { currentIsland: string; currentArea: string; currentMap: string };
  learning: { grade: number };
  player: { skills: string[] };
  party: { owned: { monsterId: string }[] };
}

test('説明なしで甲信越・小2を選び、算数の冒険を新潟から開始できる', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));

  await page.goto('/');
  await expect(page.getByRole('menuitem', { name: /はじめから/ })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 2/ }).click();

  const regions = page.getByRole('region', { name: 'さいしょの きょうか' });
  await expect(regions).toContainText('こくご・せいかつ');
  await expect(regions).toContainText('さんすう');
  await expect(page.getByRole('textbox', { name: 'なまえ' })).toHaveCount(0);
  await expect(page.getByText('いっしょに たびする なかま')).toHaveCount(0);
  await expect(page.getByText('みため', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/mvp-region-setup.png' });
  await page.getByRole('button', { name: /こうしんえつ.*さんすう/ }).click();
  await page.getByLabel('がくねん').selectOption('2');
  await page.getByRole('button', { name: 'はじめる' }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
  await finishHeroIntroduction(page, 'ミライ');

  const saved = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nihonquest');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const state = await new Promise<SavedMvpState>((resolve, reject) => {
      const request = database.transaction('saves').objectStore('saves').get('save:2');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    database.close();
    return state;
  });
  expect(saved.progress).toMatchObject({
    currentIsland: 'koshinetsu',
    currentArea: 'niigata',
    currentMap: 'niigata-field',
  });
  expect(saved.learning.grade).toBe(2);
  expect(saved.player.skills).toContain('sk-kazoe-giri');
  expect(saved.party.owned).toEqual([]);
  expect(errors).toEqual([]);
});

test('横向きタッチ画面でも教科・学年・開始ボタンへ到達できる', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await expect(page.getByRole('button', { name: /とうほく.*こくご.*せいかつ/ })).toBeVisible();
  await expect(page.getByLabel('がくねん')).toBeVisible();
  await expect(page.getByRole('button', { name: /ネブタン/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'はじめる' })).toBeVisible();
  await page.screenshot({ path: 'test-results/mvp-mobile-setup.png', fullPage: true });
});
