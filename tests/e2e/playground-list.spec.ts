import { expect, test } from '@playwright/test';

test('単元の直下に問題を表示し、検索時だけ検索結果欄を表示する', async ({ page }) => {
  await page.goto('/playground.html');
  await expect(page.locator('.pg-results')).toHaveCount(0);
  await page.locator('details[data-subject="kokugo"] > summary').click();
  await page.locator('details[data-subject="kokugo"] details[data-grade="2"] > summary').click();
  const unit = page.locator('button[data-unit="kokugo.g2.bun-no-kimari"]');
  await unit.click();
  await expect(unit.locator('..').locator('.pg-question-row')).toHaveCount(4);
  await expect(page.locator('.pg-results')).toHaveCount(0);
  await page.locator('details.pg-filter-details > summary').click();
  await page.locator('#pg-f-text').fill('source.kokugo');
  await expect(page.locator('.pg-results')).toBeVisible();
  await expect(page.locator('.pg-results .pg-question-row').first()).toBeVisible();
  await page.locator('#pg-f-text').clear();
  await expect(page.locator('.pg-results')).toHaveCount(0);
  await expect(unit.locator('..').locator('.pg-question-row')).toHaveCount(4);
  await unit.click();
  await expect(page.locator('.pg-question-row')).toHaveCount(0);
  await page.locator('#pg-f-text').fill('eigo.g3.sea.0006');
  await expect(page.locator('.pg-results .pg-question-row')).toHaveCount(1);
});

test('Playground は翻訳辞書の読込前に欠落警告を出さない', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });

  await page.goto('/playground.html');
  await expect(page.getByRole('link', { name: /ゲームにもどる/ })).toBeVisible({ timeout: 10_000 });

  expect(warnings.filter((message) => message.includes('[i18n] キーがありません'))).toEqual([]);
});

test('フォルダ未選択では問題を表示せず、選択すると表示する', async ({ page }) => {
  await page.goto('/playground.html?q=eigo.g1.alphabet.0002');
  const tree = page.getByRole('region', { name: '問題フォルダ' });
  const all = tree.getByRole('button', { name: /すべて/ });
  await expect(all).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.pg-question-row')).toHaveCount(0);
  await expect(page.locator('.pg-results')).toHaveCount(0);
  await expect(page.locator('.nq-q-choice')).toBeVisible();
  await all.click();
  await expect(page.locator('.pg-question-row').first()).toBeVisible();
  await all.click();
  await expect(all).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.pg-question-row')).toHaveCount(0);
  await all.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.pg-question-row').first()).toBeVisible();
});

test('Playground は問題を探して試すレビュー画面として表示する', async ({ page }) => {
  await page.goto('/playground.html?q=eigo.g1.alphabet.0002');

  await expect(page.getByRole('heading', { name: '問題レビュー' })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('navigation', { name: '問題を探す' })).toBeVisible();
  const filters = page.locator('details.pg-filter-details');
  await expect(filters).not.toHaveAttribute('open', '');
  await expect(page.locator('input#pg-f-text')).toBeHidden();
  await expect(page.getByRole('region', { name: '問題フォルダ' })).toBeVisible();
  await filters.locator('summary').click();
  await expect(page.locator('input#pg-f-text')).toBeVisible();
  await expect(page.getByRole('button', { name: /再読込/ })).toBeVisible();
  await expect(page.getByRole('region', { name: '問題プレビュー' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'テスト結果' })).toContainText(
    /まだ結果はありません|回答中です/,
  );

  const technical = page.locator('details.pg-technical');
  await expect(technical).toBeHidden();
  await expect(page.locator('select#pg-file')).toBeHidden();
  await expect(page.locator('textarea#pg-json')).toHaveCount(0);
});

test('Playground は選択中の実問題を同じ画面でフォーム編集できる', async ({ page }) => {
  await page.goto('/playground.html?q=eigo.g1.alphabet.0002');
  await expect(page.locator('.nq-q-choice')).toBeVisible({ timeout: 20_000 });

  await expect(page.getByRole('region', { name: '問題を編集' })).toBeVisible();
  await expect(page.getByLabel('問題 ID', { exact: true })).toHaveValue('eigo.g1.alphabet.0002');
  await expect(page.getByLabel('問題 ID', { exact: true })).toHaveAttribute('readonly', '');
  await expect(page.getByLabel('単元コード', { exact: true })).toHaveAttribute('readonly', '');
  await expect(page.getByRole('button', { name: /問題を編集する|問題を確認する/ })).toHaveCount(0);
  await expect(page.locator('textarea#pg-json')).toHaveCount(0);

  const prompt = page.getByLabel('問題文', { exact: true });
  await prompt.fill('へんしゅうした もんだい');
  await expect(page.getByRole('heading', { name: 'へんしゅうした もんだい' })).toBeVisible();
  await expect(prompt).toHaveValue('へんしゅうした もんだい');
});

test('選択式と記述式を変更して元に戻せる', async ({ page }) => {
  await page.goto('/playground.html?q=eigo.g1.alphabet.0002');
  const type = page.getByLabel('問題タイプ', { exact: true });
  await expect(type).toHaveValue('choice');
  page.once('dialog', (dialog) => dialog.dismiss());
  await type.selectOption('text-input');
  await expect(type).toHaveValue('choice');
  page.once('dialog', (dialog) => dialog.accept());
  await type.selectOption('text-input');
  await expect(type).toHaveValue('text-input');
  await expect(page.locator('#ed-payload-answers-0')).not.toHaveValue('');
  await expect(page.getByRole('button', { name: '保存', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '一つもどる' }).click();
  await expect(type).toHaveValue('choice');
  for (const name of ['再生', '中断', '一つもどる', '保存']) {
    await expect(page.getByRole('button', { name, exact: true }).locator('svg')).toHaveCount(1);
  }
});

test('選択肢をドラッグで並べ替えても正解を保持し、一つもどせる', async ({ page }) => {
  await page.goto('/playground.html?q=eigo.g1.alphabet.0002');
  const first = page.getByLabel('選択肢 1', { exact: true });
  const second = page.getByLabel('選択肢 2', { exact: true });
  await expect(first).toBeVisible();
  const firstValue = await first.inputValue();
  const secondValue = await second.inputValue();
  const correctValue = await page
    .locator('.ed-choice-row')
    .filter({ has: page.locator('input[type="radio"]:checked') })
    .locator('.ed-input')
    .inputValue();
  const handle = page.getByLabel('選択肢 1をドラッグして並べ替え');
  const target = page.locator('.ed-choice-row').nth(1);
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await handle.dispatchEvent('dragstart', { dataTransfer });
  await target.dispatchEvent('dragover', { dataTransfer });
  await expect(target).toHaveClass(/ed-choice-drop-target/);
  await handle.dispatchEvent('dragend', { dataTransfer });
  await expect(target).not.toHaveClass(/ed-choice-drop-target/);
  await handle.dragTo(target);
  await expect(first).toHaveValue(secondValue);
  await expect(second).toHaveValue(firstValue);
  await expect(
    page
      .locator('.ed-choice-row')
      .filter({ has: page.locator('input[type="radio"]:checked') })
      .locator('.ed-input'),
  ).toHaveValue(correctValue);
  await page.getByRole('button', { name: '一つもどる' }).click();
  await expect(first).toHaveValue(firstValue);
  await expect(second).toHaveValue(secondValue);
});

test('選択肢をキーボードで移動し、その順番を保存できる', async ({ page }) => {
  let savedChoices: string[] = [];
  await page.route('**/__nq/save-question', async (route) => {
    const body = route.request().postDataJSON();
    savedChoices = body.question.payload.choices.map((choice: { text: string }) => choice.text);
    await route.fulfill({
      json: { questions: body.expected.map((q: { id: string }) => (q.id === body.id ? body.question : q)) },
    });
  });
  await page.goto('/playground.html?q=eigo.g1.alphabet.0002');
  const first = page.getByLabel('選択肢 1', { exact: true });
  await expect(first).toBeVisible();
  const value = await first.inputValue();
  await expect(page.getByRole('button', { name: /選択肢 .*を(上|下)に移動/ })).toHaveCount(0);
  await page.getByLabel('選択肢 1をドラッグして並べ替え').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByLabel('選択肢 2', { exact: true })).toHaveValue(value);
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('保存しました');
  expect(savedChoices[1]).toBe(value);
});

test('記述式から選択式に変更すると問題文と正解を引き継ぐ', async ({ page }) => {
  await page.goto('/playground.html?q=legacy.sansu.g3.math-3-1.01e66a4560e3');
  const type = page.getByLabel('問題タイプ', { exact: true });
  await expect(type).toHaveValue('text-input');
  const original = await page.locator('#ed-payload-answers-0').inputValue();
  page.once('dialog', (dialog) => dialog.accept());
  await type.selectOption('choice');
  await expect(page.getByLabel('選択肢 1', { exact: true })).toHaveValue(original);
  await expect(page.getByLabel('選択肢 2', { exact: true })).toHaveValue('');
});

test('Playground は編集を一つもどせ、問題を切り替えると履歴が消える', async ({ page }) => {
  await page.goto('/playground.html?q=eigo.g1.alphabet.0002');
  const prompt = page.getByLabel('問題文', { exact: true });
  await expect(prompt).toBeVisible({ timeout: 20_000 });
  const original = await prompt.inputValue();
  const undo = page.getByRole('button', { name: '一つもどる' });
  await expect(undo).toBeDisabled();
  await prompt.fill('変更した問題文');
  await expect(undo).toBeEnabled();
  await undo.click();
  await expect(prompt).toHaveValue(original);
  await expect(undo).toBeDisabled();
  await prompt.fill('別の変更');
  await page
    .getByRole('region', { name: '問題フォルダ' })
    .getByRole('button', { name: /すべて/ })
    .click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('.pg-question-row').first().click();
  await expect(undo).toBeDisabled();
});

test('Playground は保存操作で編集内容を送信し、成功を表示する', async ({ page }) => {
  await page.route('**/__nq/save-question', async (route) => {
    const body = route.request().postDataJSON() as {
      expected: { id: string }[];
      id: string;
      question: unknown;
    };
    const questions = body.expected.map((question) => (question.id === body.id ? body.question : question));
    await route.fulfill({ json: { questions } });
  });
  await page.goto('/playground.html?q=eigo.g1.alphabet.0002');
  const prompt = page.getByLabel('問題文', { exact: true });
  await expect(prompt).toBeVisible({ timeout: 20_000 });
  await prompt.fill('保存する問題文');
  await page.getByRole('button', { name: '保存', exact: true }).scrollIntoViewIfNeeded();
  const before = await page.locator('.pg-stage-shell').boundingBox();
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('保存しました');
  await expect(page.locator('.pg-save-toast')).toHaveCSS('position', 'fixed');
  const after = await page.locator('.pg-stage-shell').boundingBox();
  expect(after!.y).toBe(before!.y);
  await expect(page.getByRole('button', { name: '保存', exact: true })).toBeDisabled();
  await expect(page.locator('.pg-save-toast')).toHaveCount(0, { timeout: 6000 });
});

test('保存失敗の通知を表示し、下書きを保持する', async ({ page }) => {
  await page.route('**/__nq/save-question', (route) =>
    route.fulfill({ status: 400, json: { error: '競合しました' } }),
  );
  await page.goto('/playground.html?q=eigo.g1.alphabet.0002');
  const prompt = page.getByLabel('問題文', { exact: true });
  await prompt.fill('未保存の変更');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('.pg-save-toast[role="alert"]')).toContainText('競合しました');
  await expect(prompt).toHaveValue('未保存の変更');
  await expect(page.getByRole('button', { name: '保存', exact: true })).toBeEnabled();
});

test('Playground は編集欄の学年と制限時間で問題を試す', async ({ page }) => {
  await page.goto('/playground.html?q=eigo.g1.alphabet.0002');
  await expect(page.locator('.nq-q-choice')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#pg-grade, #pg-time-limit')).toHaveCount(0);
  await page.getByLabel('学年', { exact: true }).selectOption('2');
  await page.getByLabel('制限時間・秒', { exact: true }).fill('3');
  await page.getByRole('button', { name: '中断', exact: true }).click();
  await page.getByRole('button', { name: '再生', exact: true }).click();
  await expect(page.getByLabel('学年', { exact: true })).toHaveValue('2');
  await expect(page.getByRole('region', { name: 'テスト結果' })).toContainText('時間切れ', {
    timeout: 8_000,
  });
});

test('Playground は choice 以外も JSON を使わず項目ごとに編集できる', async ({ page }) => {
  await page.goto('/playground.html?q=eigo.g3.sea.0006');

  const word = page.locator('#ed-payload-words-0-text');
  await expect(word).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.nq-q-pw')).toBeVisible();
  const original = await word.inputValue();
  await word.fill(`${original}-edited`);
  await expect(word).toHaveValue(`${original}-edited`);
  await expect(page.locator('textarea#pg-json')).toHaveCount(0);
});

test('Playground の問題いちらん：全件数と先頭200問が出て、しぼりこめる', async ({ page }) => {
  await page.goto('/playground.html');
  const rows = page.locator('.pg-question-row');
  await page
    .getByRole('region', { name: '問題フォルダ' })
    .getByRole('button', { name: /すべて/ })
    .click();
  await expect(rows.first()).toBeVisible({ timeout: 20_000 });
  const allQuestionCount = await rows.count();
  expect(allQuestionCount).toBe(200);
  await expect(page.locator('.pg-results')).toHaveCount(0);
  await expect(page.locator('.pg-empty')).toContainText('先頭 200 問');
  await expect(page.locator('.pg-question-row.pg-bad')).toHaveCount(0);

  await page.locator('details.pg-filter-details > summary').click();
  await page.locator('select#pg-f-type').selectOption('picture-word');
  await expect(rows.first()).toBeVisible();
  expect(
    await rows.evaluateAll((items) => items.map((item) => item.getAttribute('data-question-type'))),
  ).toEqual(Array(await rows.count()).fill('picture-word'));
  await page.locator('input#pg-f-text').fill('eigo.g3.sea.0006');
  await expect(rows).toHaveCount(1);
  await rows.first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.nq-q-pw')).toBeVisible({ timeout: 10_000 });
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
  await page
    .getByRole('region', { name: '問題フォルダ' })
    .getByRole('button', { name: /すべて/ })
    .click();
  await expect(page.locator('.pg-question-row')).toHaveCount(200, { timeout: 30_000 });
  expect(maximum).toBeLessThanOrEqual(8);
});

test('Playground の問題ツリー：単元から直接問題を選び、キーボードで全件へ戻せる', async ({ page }) => {
  await page.goto('/playground.html');
  const rows = page.locator('.pg-question-row');

  const treeDetails = page.locator('details.pg-tree-details');
  const tree = page.getByRole('region', { name: '問題フォルダ' });
  await expect(treeDetails).toHaveAttribute('open', '');
  expect((await tree.boundingBox())!.height).toBeGreaterThanOrEqual(420);
  await treeDetails.locator(':scope > summary').click();
  await expect(tree).toBeHidden();
  await treeDetails.locator(':scope > summary').click();
  await expect(tree).toBeVisible();

  const all = tree.getByRole('button', { name: /すべて.*4832/ });
  await expect(all).toHaveAttribute('aria-pressed', 'false');

  const subject = tree.locator('details[data-subject="sansu"]');
  await expect(subject.locator(':scope > summary')).toContainText(/算数|さんすう/);
  await expect(subject.locator(':scope > summary')).toContainText('1733');
  await subject.locator(':scope > summary').click();

  const grade = subject.locator('details[data-grade="1"]');
  await expect(grade.locator(':scope > summary')).toContainText('小1');
  await expect(grade.locator(':scope > summary')).toContainText('186');
  await grade.locator(':scope > summary').click();

  const unit = grade.locator('button[data-unit="sansu.g1.kazu-100"]');
  await expect(unit).toContainText('21');
  await unit.click();
  await expect(unit).toHaveAttribute('aria-pressed', 'true');
  await expect(tree.getByText('set-001.json')).toHaveCount(0);
  await expect(rows).toHaveCount(21);
  await expect(rows.first().locator('strong')).not.toBeEmpty();
  await expect(rows.first().locator('.pg-question-options')).toBeVisible();
  await expect(rows.first().locator('.pg-question-facts, .pg-id')).toHaveCount(0);
  await expect(page.locator('.pg-question-explanation')).toHaveCount(0);
  expect(await rows.evaluateAll((items) => items.map((item) => item.getAttribute('title')))).toEqual(
    Array(21).fill('questions/sansu/g1/kazu-100/set-001.json'),
  );

  await grade.locator(':scope > summary').click();
  await expect(rows).toHaveCount(0);

  await all.focus();
  await page.keyboard.press('Enter');
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  expect(await rows.count()).toBeGreaterThan(100);
});

test('Playground の問題ツリー：教科と学年はそれぞれ一つずつ開く', async ({ page }) => {
  await page.goto('/playground.html');
  const tree = page.getByRole('region', { name: '問題フォルダ' });
  const kokugo = tree.locator('details[data-subject="kokugo"]');
  const sansu = tree.locator('details[data-subject="sansu"]');
  await kokugo.locator(':scope > summary').click();
  const grade1 = kokugo.locator('details[data-grade="1"]');
  const grade2 = kokugo.locator('details[data-grade="2"]');
  await grade1.locator(':scope > summary').click();
  await grade2.locator(':scope > summary').click();
  await expect(grade1).not.toHaveAttribute('open', '');
  await expect(grade2).toHaveAttribute('open', '');
  await sansu.locator(':scope > summary').click();
  await expect(kokugo).not.toHaveAttribute('open', '');
  await expect(sansu).toHaveAttribute('open', '');
  const sansuGrade = sansu.locator('details[data-grade="1"]');
  await sansuGrade.locator(':scope > summary').click();
  await expect(grade2).not.toHaveAttribute('open', '');
  await expect(sansuGrade).toHaveAttribute('open', '');
});

test('複数ファイルに分かれた単元もまとめて表示する', async ({ page }) => {
  await page.goto('/playground.html');
  await page.locator('details[data-subject="kokugo"] > summary').click();
  await page.locator('details[data-subject="kokugo"] details[data-grade="1"] > summary').click();
  await page.locator('button[data-unit="kokugo.g1.legacy-jpn-1-1"]').click();
  await expect(page.locator('.pg-question-row').first()).toBeVisible();
  const files = await page
    .locator('.pg-question-row')
    .evaluateAll((rows) => rows.map((row) => row.getAttribute('title')));
  expect(files).toContain('questions/kokugo/g1/legacy-jpn-1-1/set-001.json');
  expect(files).toContain('questions/kokugo/g1/legacy-jpn-1-1/set-002.json');
});

test('漢字の単元を国語から分けて表示する', async ({ page }) => {
  await page.goto('/playground.html');
  const kokugo = page.locator('details[data-subject="kokugo"]');
  const kanji = page.locator('details[data-subject="kanji"]');
  await expect(kanji.locator(':scope > summary')).toContainText('漢字');
  await kokugo.locator(':scope > summary').click();
  await kokugo.locator('details[data-grade="2"] > summary').click();
  await expect(kokugo.locator('button[data-unit="kokugo.g2.kanji"]')).toHaveCount(0);
  await expect(kokugo.locator('button[data-unit="kokugo.g2.bun-no-kimari"]')).toBeVisible();
  await kanji.locator(':scope > summary').click();
  await kanji.locator('details[data-grade="2"] > summary').click();
  const secondGrade = kanji.locator('details[data-grade="2"]');
  const reading = secondGrade.locator('details[data-kanji-category="reading"]');
  const writing = secondGrade.locator('details[data-kanji-category="writing"]');
  await reading.locator(':scope > summary').click();
  await expect(reading.locator('button[data-unit="kokugo.g2.legacy-jpn-2-2"]')).toBeVisible();
  await reading.locator('button[data-unit="kokugo.g2.kanji"]').click();
  await expect(page.locator('.pg-question-row')).toHaveCount(7);
  await writing.locator(':scope > summary').click();
  await expect(reading).not.toHaveAttribute('open', '');
  await writing.locator('button[data-unit="kokugo.g2.kanji"]').click();
  await expect(page.locator('.pg-question-row')).toHaveCount(8);
});

test('小1の漢字の読みを一つにまとめて両単元の問題を表示する', async ({ page }) => {
  await page.goto('/playground.html');
  const kanji = page.locator('details[data-subject="kanji"]');
  await kanji.locator(':scope > summary').click();
  await kanji.locator('details[data-grade="1"] > summary').click();
  const reading = kanji.locator('details[data-grade="1"] details[data-kanji-category="reading"]');
  await reading.locator(':scope > summary').click();
  const merged = reading.locator('button[data-unit="kokugo.g1.kanji"]');
  await expect(merged).toBeVisible();
  await expect(reading.locator('button[data-unit="kokugo.g1.legacy-jpn-1-2"]')).toHaveCount(0);
  await merged.click();
  const rows = reading.locator('.pg-question-row');
  await expect(rows.first()).toBeVisible();
  const files = await rows.evaluateAll((elements) => elements.map((row) => row.getAttribute('title')));
  expect(files).toContain('questions/kokugo/g1/kanji/set-001.json');
  expect(files).toContain('questions/kokugo/g1/legacy-jpn-1-2/set-001.json');
  const count = Number((await merged.locator('.pg-tree-count').textContent())?.replace(/\D/g, ''));
  expect(files).toHaveLength(count);
  await merged.click();
  await expect(rows).toHaveCount(0);
});

test('学年の下にフォルダを作り、削除した構成を復元できる', async ({ page }) => {
  let state = { revision: 0, layout: { folders: [], assignments: {}, hidden: [] }, snapshots: [] };
  await page.route('**/__nq/folder-state', async (route) => {
    const request = route.request().postDataJSON();
    if (request.action === 'write') state = { ...request.state, revision: state.revision + 1 };
    await route.fulfill({ json: state });
  });
  await page.goto('/playground.html');
  const english = page.locator('details[data-subject="eigo"]');
  await english.locator(':scope > summary').click();
  const grade = english.locator('details[data-grade="1"]');
  await grade.locator(':scope > summary').click();
  page.once('dialog', (dialog) => dialog.accept('練習'));
  await grade.getByRole('button', { name: 'フォルダを追加', exact: true }).click();
  const folder = grade.locator('details.pg-custom-folder').filter({ hasText: '練習' });
  await expect(folder).toBeVisible();
  await grade.locator('button[data-unit="eigo.g1.alphabet"]').click();
  const first = grade.locator('.pg-question-row').first();
  await first.click();
  await grade.getByLabel(/^移動先:/).selectOption({ label: '練習' });
  await folder.locator(':scope > summary').click();
  await folder.getByRole('button', { name: '問題を表示' }).click();
  await expect(folder.locator('.pg-question-row')).toHaveCount(1);
  await page.getByRole('button', { name: '構成を保存' }).click();
  await expect(page.getByLabel('保存した構成に戻す').locator('option')).toHaveCount(2);
  page.once('dialog', (dialog) => dialog.accept());
  await folder.getByRole('button', { name: '削除', exact: true }).click();
  await expect(folder).toHaveCount(0);
  await expect(grade.getByRole('button', { name: /未整理/ })).toBeVisible();
  await page.reload();
  await english.locator(':scope > summary').click();
  await grade.locator(':scope > summary').click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByLabel('保存した構成に戻す').selectOption({ index: 1 });
  await expect(folder).toBeVisible();
});

test('既存の単元を削除しても問題は未整理に残り、元に戻せる', async ({ page }) => {
  let state = { revision: 0, layout: { folders: [], assignments: {}, hidden: [] }, snapshots: [] };
  await page.route('**/__nq/folder-state', async (route) => {
    const request = route.request().postDataJSON();
    if (request.action === 'write') state = { ...request.state, revision: state.revision + 1 };
    await route.fulfill({ json: state });
  });
  await page.goto('/playground.html');
  const kanji = page.locator('details[data-subject="kanji"]');
  await kanji.locator(':scope > summary').click();
  const grade = kanji.locator('details[data-grade="1"]');
  await grade.locator(':scope > summary').click();
  const reading = grade.locator('details[data-kanji-category="reading"]');
  await reading.locator(':scope > summary').click();
  page.once('dialog', (dialog) => dialog.accept());
  await reading.getByRole('button', { name: '1年の漢字 削除' }).click();
  await expect(reading.locator('button[data-unit="kokugo.g1.kanji"]')).toHaveCount(0);
  await grade.getByRole('button', { name: /未整理/ }).click();
  await expect(grade.locator('.pg-question-row')).toHaveCount(47);
  await page.getByRole('button', { name: 'フォルダを元に戻す' }).click();
  await expect(reading.locator('button[data-unit="kokugo.g1.kanji"]')).toBeVisible();
});

test('問題フォルダの教科名を漢字で表示する', async ({ page }) => {
  await page.goto('/playground.html');
  for (const [subject, label] of Object.entries({
    kokugo: '国語',
    kanji: '漢字',
    sansu: '算数',
    rika: '理科',
    shakai: '社会',
    seikatsu: '生活科',
    eigo: '英語',
  })) {
    await expect(page.locator(`details[data-subject="${subject}"] > summary`)).toContainText(label);
  }
});

test('親フォルダを閉じると子フォルダの開閉状態をリセットする', async ({ page }) => {
  await page.goto('/playground.html');
  const subject = page.locator('details[data-subject="kokugo"]');
  const grade = subject.locator('details[data-grade="2"]');
  const unit = grade.locator('button[data-unit="kokugo.g2.bun-no-kimari"]');
  await subject.locator(':scope > summary').click();
  await grade.locator(':scope > summary').click();
  await unit.click();
  await expect(page.locator('.pg-question-row')).toHaveCount(4);
  await grade.locator(':scope > summary').click();
  await expect(page.locator('.pg-question-row')).toHaveCount(0);
  await grade.locator(':scope > summary').click();
  await expect(unit).toHaveAttribute('aria-pressed', 'false');
  await unit.click();
  await subject.locator(':scope > summary').click();
  await subject.locator(':scope > summary').click();
  await expect(grade).not.toHaveAttribute('open', '');
  await expect(unit).toHaveAttribute('aria-pressed', 'false');
});

test('Playground の問題ツリー：狭い画面では表の上に並ぶ', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/playground.html');

  const tree = page.getByRole('region', { name: '問題フォルダ' });
  await page.locator('details.pg-filter-details > summary').click();
  await page.locator('#pg-f-text').fill('kokugo');
  const results = page.locator('.pg-results');
  await expect(tree).toBeVisible({ timeout: 20_000 });
  await expect(results).toBeVisible();

  const treeBox = await tree.boundingBox();
  const resultsBox = await results.boundingBox();
  expect(treeBox).not.toBeNull();
  expect(resultsBox).not.toBeNull();
  expect(resultsBox!.y).toBeGreaterThanOrEqual(treeBox!.y + treeBox!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('Playground は中幅の画面でも問題一覧とレビューを横に並べる', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto('/playground.html?q=eigo.g1.alphabet.0001');

  const list = page.locator('.pg-list');
  const review = page.locator('.pg-review');
  await expect(list).toBeVisible({ timeout: 20_000 });
  await expect(review).toBeVisible();
  const heading = await page.locator('.pg-question-heading').boundingBox();
  const play = await page.getByRole('button', { name: '再生', exact: true }).boundingBox();
  expect(heading).not.toBeNull();
  expect(play).not.toBeNull();
  expect(play!.x).toBeGreaterThanOrEqual(heading!.x + heading!.width);

  const listBox = await list.boundingBox();
  const reviewBox = await review.boundingBox();
  expect(listBox).not.toBeNull();
  expect(reviewBox).not.toBeNull();
  expect(reviewBox!.x).toBeGreaterThanOrEqual(listBox!.x + listBox!.width);
  expect(Math.abs(listBox!.height - reviewBox!.height)).toBeLessThan(2);
  expect(reviewBox!.x - (listBox!.x + listBox!.width)).toBeLessThanOrEqual(10);
  expect(reviewBox!.width / listBox!.width).toBeGreaterThanOrEqual(1.79);
  await page.locator('details[data-subject="sansu"] > summary').click();
  await expect(page.locator('details[data-subject="sansu"] details[data-grade="1"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(960);
});

test('Playground は広い画面でプレビューを編集の上に表示し、基本情報を横に並べる', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/playground.html?q=eigo.g1.alphabet.0001');

  const list = page.locator('.pg-list');
  const editor = page.locator('.pg-editor');
  const preview = page.locator('.pg-preview');
  await expect(editor).toBeVisible({ timeout: 20_000 });
  await expect(preview).toBeVisible();

  const listBox = await list.boundingBox();
  const editorBox = await editor.boundingBox();
  const previewBox = await preview.boundingBox();
  expect(listBox).not.toBeNull();
  expect(editorBox).not.toBeNull();
  expect(previewBox).not.toBeNull();
  expect(previewBox!.x).toBeGreaterThanOrEqual(listBox!.x + listBox!.width);
  expect(editorBox!.y).toBeGreaterThanOrEqual(previewBox!.y + previewBox!.height);
  const fields = await page
    .locator('.ed-metadata-row .ed-field')
    .evaluateAll((items) =>
      items.map((item) => ({ x: item.getBoundingClientRect().x, y: item.getBoundingClientRect().y })),
    );
  expect(fields).toHaveLength(4);
  expect(new Set(fields.map((field) => field.y)).size).toBe(1);
  expect(fields[3]!.x).toBeGreaterThan(fields[0]!.x);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1600);
});

test('Playground は旧 manifest でも問題表を全幅で表示する', async ({ page }) => {
  await page.route('**/content/manifest.json', async (route) => {
    const response = await route.fetch();
    const manifest = (await response.json()) as Record<string, unknown>;
    delete manifest.questionCatalog;
    await route.fulfill({ response, json: manifest });
  });
  await page.goto('/playground.html');

  const results = page.locator('.pg-results');
  await expect(results.locator('.pg-question-row').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('region', { name: '問題フォルダ' })).toHaveCount(0);
  const widths = await page.locator('.pg-browser').evaluate((browser) => ({
    browser: browser.getBoundingClientRect().width,
    results: browser.querySelector('.pg-results')!.getBoundingClientRect().width,
  }));
  expect(widths.results).toBe(widths.browser);
});

test('Playground：?q=<問題 id> で ひらくと その問題が出る', async ({ page }) => {
  await page.goto('/playground.html?q=eigo.g1.alphabet.0002');
  await expect(page.locator('.nq-q-choice')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.pg-question-row')).toHaveCount(0);
  await expect(page.locator('select#pg-question')).toHaveValue('1');
});
