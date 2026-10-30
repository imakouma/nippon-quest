import { expect, test } from '@playwright/test';

test('Playground は翻訳辞書の読込前に欠落警告を出さない', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });

  await page.goto('/playground.html');
  await expect(page.getByRole('link', { name: /ゲームにもどる/ })).toBeVisible({ timeout: 10_000 });

  expect(warnings.filter((message) => message.includes('[i18n] キーがありません'))).toEqual([]);
});

test('Playground の問題いちらん：全件数と先頭200問が出て、しぼりこめる', async ({ page }) => {
  await page.goto('/playground.html');
  const rows = page.locator('.pg-table tbody tr');
  await expect(rows.first()).toBeVisible({ timeout: 20_000 });
  const allQuestionCount = await rows.count();
  expect(allQuestionCount).toBe(200);
  await expect(page.locator('.pg-count')).toContainText('ぜんぶで 4829');
  await expect(page.locator('.pg-empty')).toContainText('先頭 200 問');
  await expect(page.locator('.pg-table tr.pg-bad')).toHaveCount(0);

  await page.locator('select#pg-f-type').selectOption('picture-word');
  await expect(rows.first()).toBeVisible();
  expect(await rows.locator('td:nth-child(5)').allTextContents()).toEqual(
    Array(await rows.count()).fill('picture-word'),
  );
  await page.locator('input#pg-f-text').fill('eigo.g3.sea.0006');
  await expect(rows).toHaveCount(1);
  await rows.first().click();
  await expect(page.locator('.nq-q-pw')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('textarea#pg-json')).toHaveValue(/eigo\.g3\.sea\.0006/);
  await expect(page.locator('select#pg-file')).toHaveValue('questions/eigo/g3/sea/set-001.json');
  await expect(page.locator('select#pg-question option:checked')).toContainText('eigo.g3.sea.0006');
  await expect(page).toHaveURL(/\?q=eigo\.g3\.sea\.0006/);
});

test('Playground の問題ファイル読込は8並列を超えない', async ({ page }) => {
  let active = 0;
  let maximum = 0;
  await page.route('**/content/questions/**/*.json', async (route) => {
    active += 1;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await route.continue();
    active -= 1;
  });

  await page.goto('/playground.html');
  await expect(page.locator('.pg-count')).toContainText('ぜんぶで 4829', { timeout: 30_000 });
  expect(maximum).toBeLessThanOrEqual(8);
});

test('Playground の問題ツリー：教科からセットを選び、キーボードで全件へ戻せる', async ({ page }) => {
  await page.goto('/playground.html');
  const rows = page.locator('.pg-table tbody tr');
  await expect(rows.first()).toBeVisible({ timeout: 20_000 });

  const tree = page.getByRole('navigation', { name: '問題フォルダ' });
  const all = tree.getByRole('button', { name: /すべて.*4829/ });
  await expect(all).toHaveAttribute('aria-pressed', 'true');

  const subject = tree.locator('details[data-subject="sansu"]');
  await expect(subject.locator(':scope > summary')).toContainText(/算数|さんすう/);
  await expect(subject.locator(':scope > summary')).toContainText('1733');
  await subject.locator(':scope > summary').click();

  const grade = subject.locator('details[data-grade="1"]');
  await expect(grade.locator(':scope > summary')).toContainText('小1');
  await expect(grade.locator(':scope > summary')).toContainText('186');
  await grade.locator(':scope > summary').click();

  const unit = grade.locator('details[data-unit="sansu.g1.kazu-100"]');
  await expect(unit.locator(':scope > summary')).toContainText('21');
  await unit.locator(':scope > summary').click();

  const set = unit.getByRole('button', { name: /set-001\.json.*21/ });
  await set.click();
  await expect(set).toHaveAttribute('aria-pressed', 'true');
  await expect(rows).toHaveCount(21);
  expect(await rows.evaluateAll((items) => items.map((item) => item.getAttribute('title')))).toEqual(
    Array(21).fill('questions/sansu/g1/kazu-100/set-001.json'),
  );

  await all.focus();
  await page.keyboard.press('Enter');
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  expect(await rows.count()).toBeGreaterThan(100);
});

test('Playground の問題ツリー：狭い画面では表の上に並ぶ', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/playground.html');

  const tree = page.getByRole('navigation', { name: '問題フォルダ' });
  const table = page.locator('.pg-table-wrap');
  await expect(tree).toBeVisible({ timeout: 20_000 });
  await expect(table).toBeVisible();

  const treeBox = await tree.boundingBox();
  const tableBox = await table.boundingBox();
  expect(treeBox).not.toBeNull();
  expect(tableBox).not.toBeNull();
  expect(tableBox!.y).toBeGreaterThanOrEqual(treeBox!.y + treeBox!.height);
  expect(await table.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('Playground は旧 manifest でも問題表を全幅で表示する', async ({ page }) => {
  await page.route('**/content/manifest.json', async (route) => {
    const response = await route.fetch();
    const manifest = (await response.json()) as Record<string, unknown>;
    delete manifest.questionCatalog;
    await route.fulfill({ response, json: manifest });
  });
  await page.goto('/playground.html');

  const table = page.locator('.pg-table-wrap');
  await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('navigation', { name: '問題フォルダ' })).toHaveCount(0);
  const widths = await page.locator('.pg-browser').evaluate((browser) => ({
    browser: browser.getBoundingClientRect().width,
    table: browser.querySelector('.pg-table-wrap')!.getBoundingClientRect().width,
  }));
  expect(widths.table).toBe(widths.browser);
});

test('Playground：?q=<問題 id> で ひらくと その問題が出る', async ({ page }) => {
  await page.goto('/playground.html?q=eigo.g1.alphabet.0002');
  await expect(page.locator('.nq-q-choice')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.pg-table tr.pg-sel')).toContainText('eigo.g1.alphabet.0002');
  await expect(page.locator('textarea#pg-json')).toHaveValue(/eigo\.g1\.alphabet\.0002/);
  await expect(page.locator('select#pg-question')).toHaveValue('1');
});
