import { expect, test } from '@playwright/test';

test('タイトル画面が立ち上がり、コンテンツが読み込まれる', async ({ page }) => {
  const errors: string[] = [];
  const contentRequests: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith('/content/')) contentRequests.push(path);
  });
  await page.goto('/');
  await expect(page.locator('#game-root canvas')).toBeVisible({ timeout: 15_000 });
  // Boot が終わるとローディングが消える
  await expect(page.locator('.nq-loading')).toHaveCount(0, { timeout: 15_000 });
  await expect(page.locator('.nq-error')).toHaveCount(0);
  expect(errors.filter((e) => !e.includes('favicon'))).toEqual([]);
  expect(contentRequests).toEqual(['/content/content-bundle.json']);
});

test('Playground で choice 問題を解くと QuestionResult が返る', async ({ page }) => {
  await page.goto('/playground.html');
  // 問題ファイルを選ぶ → 最初の問題が JSON 欄に入る
  await page.locator('select#pg-file').selectOption({ index: 1 });
  await expect(page.locator('textarea#pg-json')).not.toBeEmpty({ timeout: 10_000 });
  await page.click('button.pg-run');
  await expect(page.locator('.nq-q-choice')).toBeVisible({ timeout: 10_000 });
  await page.locator('.nq-choice').first().click();
  await expect(page.locator('.pg-result')).toContainText('"score"', { timeout: 10_000 });
});

test('問題データはタイトルでは取得せず、ゲーム開始時に一度だけ取得する', async ({ page }) => {
  test.setTimeout(60_000);
  const requests: string[] = [];
  await page.route('**/content/questions-bundle.json', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
  page.on('request', (request) => requests.push(new URL(request.url()).pathname));
  await page.goto('/');
  await expect(page.getByRole('menuitem', { name: /はじめから/ })).toBeVisible({ timeout: 20_000 });
  expect(requests).not.toContain('/content/questions-bundle.json');

  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await page.getByRole('button', { name: 'はじめる' }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.nq-loading')).toHaveCount(0);
  expect(requests.filter((path) => path === '/content/questions-bundle.json')).toHaveLength(1);
});

test('保護者メニューで概念別学習状態と診断欄を確認できる', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await page.getByRole('button', { name: 'はじめる' }).click();
  await page.getByRole('button', { name: 'メニュー' }).click({ timeout: 30_000 });
  await page.getByRole('button', { name: /ほごしゃ/ }).click();
  await page.getByLabel('こたえ').fill('12');
  await page.getByRole('button', { name: 'ひらく', exact: true }).click();

  await expect(page.getByRole('heading', { name: '知識・技能ごとの学習状態' })).toBeVisible();
  await expect(page.getByText('知識グラフに対応した問題にこたえると表示されます')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'つまずきの候補' })).toBeVisible();
  await expect(page.getByText('診断できる不正解はまだありません')).toBeVisible();

  await page.getByRole('button', { name: 'JSONを表示' }).click();
  const jsonBox = page.getByLabel('セーブデータJSON');
  const state = JSON.parse(await jsonBox.inputValue()) as {
    learning: {
      attempts: Record<string, unknown>[];
      conceptStates: Record<string, Record<string, unknown>>;
    };
  };
  const now = Date.now();
  state.learning.conceptStates['sansu.g1.addition.single-digit'] = {
    understanding: 0.6,
    retention: 0.5,
    confidence: 0.7,
    attempts: 4,
    independentSuccesses: 2,
    streak: 0,
    lastSeenAt: now,
    lastSuccessAt: now - 1000,
    lastFailureAt: now,
    dueAt: now - 1,
    intervalDays: 2,
  };
  state.learning.attempts.push({
    id: 'e2e-attempt',
    profileId: 'local',
    questionId: 'sansu.g1.tashizan.0002',
    presentedAt: now - 1000,
    answeredAt: now,
    firstAnswer: 'b',
    finalAnswer: 'b',
    score: 0,
    timeMs: 1000,
    attempts: 1,
    hintsUsed: 0,
    timedOut: false,
    reason: 'battle',
    appVersion: 'e2e',
  });
  await jsonBox.fill(JSON.stringify(state));
  await page.getByRole('button', { name: 'JSONを読みこむ' }).click();
  await page.getByRole('button', { name: 'メニュー' }).click({ timeout: 30_000 });
  await page.getByRole('button', { name: /ほごしゃ/ }).click();
  await page.getByLabel('こたえ').fill('12');
  await page.getByRole('button', { name: 'ひらく', exact: true }).click();

  await expect(page.getByText('一位数の加法').first()).toBeVisible();
  await expect(page.getByText(/理解 60%/)).toBeVisible();
  await expect(page.getByText('復習の時期です')).toBeVisible();
  await expect(page.getByText(/選んだ答え「b」/)).toBeVisible();
});
