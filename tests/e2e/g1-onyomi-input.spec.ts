import { expect, test } from '@playwright/test';
import { inspectQuestion } from '../../src/tools/questionLayoutAudit';

test('2〜4年の長い読み例文も問題枠に収まる', async ({ page }) => {
  for (const id of [
    'kokugo.g2.kanji-onyomi.0158',
    'kokugo.g2.kanji-kunyomi.0054',
    'kokugo.g3.kanji-onyomi.0075',
    'kokugo.g3.kanji-kunyomi.0091',
    'kokugo.g4.kanji-onyomi.0009',
    'kokugo.g4.kanji-kunyomi.0116',
  ]) {
    await page.goto(`/playground.html?q=${id}`);
    const stage = page.locator('.pg-stage');
    await expect(stage.getByRole('textbox', { name: 'こたえ 1', exact: true })).toBeVisible();
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => stage.evaluate(inspectQuestion)).toEqual([]);
    }
  }
});

for (const { grade, category, id, prompt, character, answer, ending } of [
  {
    grade: 5,
    category: 'onyomi',
    id: '0001',
    prompt: 'たいじゅうで 圧りょくを かける',
    character: '圧',
    answer: 'あつ',
    ending: '',
  },
  {
    grade: 5,
    category: 'kunyomi',
    id: '0001',
    prompt: 'みんなで つくえを 囲む',
    character: '囲',
    answer: 'かこ',
    ending: 'む',
  },
  {
    grade: 6,
    category: 'onyomi',
    id: '0001',
    prompt: '胃の はたらきを しらべる',
    character: '胃',
    answer: 'い',
    ending: '',
  },
  {
    grade: 6,
    category: 'kunyomi',
    id: '0004',
    prompt: 'かわに 沿う みちを あるく',
    character: '沿',
    answer: 'そ',
    ending: 'う',
  },

  {
    grade: 2,
    category: 'onyomi',
    id: '0001',
    prompt: 'じてんの さく引で しらべる',
    character: '引',
    answer: 'いん',
    ending: '',
  },
  {
    grade: 2,
    category: 'kunyomi',
    id: '0001',
    prompt: 'ひもを 引く',
    character: '引',
    answer: 'ひ',
    ending: 'く',
  },
  {
    grade: 3,
    category: 'onyomi',
    id: '0001',
    prompt: '悪にんが つかまる',
    character: '悪',
    answer: 'あく',
    ending: '',
  },
  {
    grade: 3,
    category: 'kunyomi',
    id: '0001',
    prompt: 'きょうは てんきが 悪い',
    character: '悪',
    answer: 'わる',
    ending: 'い',
  },
  {
    grade: 4,
    category: 'onyomi',
    id: '0001',
    prompt: 'いきものに 愛じょうを そそぐ',
    character: '愛',
    answer: 'あい',
    ending: '',
  },
  {
    grade: 4,
    category: 'kunyomi',
    id: '0008',
    prompt: 'スープに しおを 加える',
    character: '加',
    answer: 'くわ',
    ending: 'える',
  },
]) {
  for (const width of [320, 1440]) {
    test(`${grade}年${category}の例文を入力して採点する（${width}px）`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/playground.html?q=kokugo.g${grade}.kanji-${category}.${id}`);
      await expect(page.getByRole('heading', { name: '問題レビュー', exact: true })).toBeVisible();
      const stage = page.locator('.pg-stage');
      await expect(stage.getByText(prompt, { exact: true })).toBeVisible();
      await expect(stage.locator('mark')).toHaveText(character);
      await expect(stage.locator('.nq-input-template')).toHaveText(`よみかた：${ending}`);
      await expect(stage).not.toContainText('Enter');
      await expect(stage).not.toContainText('ひらがなで');
      await expect(stage.locator('.nq-q-choice')).toHaveCount(0);
      await expect.poll(() => stage.evaluate(inspectQuestion)).toEqual([]);
      const input = stage.getByRole('textbox', { name: 'こたえ 1', exact: true });
      await input.fill('abc');
      await expect(stage.getByRole('alert')).toHaveText('ひらがなで こたえよう');
      await stage.locator('.nq-input-submit').click();
      await expect(input).toBeEnabled();
      await input.fill(answer);
      await expect(stage).not.toContainText('ひらがなで');
      await input.press('Enter');
      await expect(stage.locator('.nq-feedback-correct')).toBeVisible();
      await page.reload();
      await expect(stage.getByText(prompt, { exact: true })).toBeVisible();
      await stage.screenshot({ path: `test-results/g${grade}-${category}-${width}.png` });
    });
  }
}

test('訓読みの長い例文と送り仮名つき入力が狭い画面でも収まる', async ({ page }) => {
  for (const id of ['0027', '0012']) {
    await page.goto(`/playground.html?q=kokugo.g1.kanji-kunyomi.${id}`);
    const stage = page.locator('.pg-stage');
    await expect(stage.getByRole('textbox', { name: 'こたえ 1', exact: true })).toBeVisible();
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => stage.evaluate(inspectQuestion)).toEqual([]);
    }
  }
});

test('訓読みの送り仮名を見ながら漢字の部分だけ入力する', async ({ page }) => {
  await page.goto('/playground.html?q=kokugo.g1.kanji-kunyomi.0012');
  const stage = page.locator('.pg-stage');
  await expect(stage.getByText('きの かげで 休む', { exact: true })).toBeVisible();
  await expect(stage.locator('mark')).toHaveText('休');
  await expect(stage.locator('.nq-input-template')).toHaveText('よみかた：む');
  await stage.getByRole('textbox', { name: 'こたえ 1', exact: true }).fill('やす');
  await stage.screenshot({ path: 'test-results/g1-kunyomi-okurigana.png' });
  await stage.locator('.nq-input-submit').click();
  await expect(stage.locator('.nq-feedback-correct')).toBeVisible();
});

for (const { category, label, prompt, correct, wrong } of [
  { category: 'onyomi', label: '音読み', prompt: '一ばんおいしいパン', correct: 'いち', wrong: 'ひと' },
  { category: 'kunyomi', label: '訓読み', prompt: '一つの りんご', correct: 'ひと', wrong: 'いち' },
]) {
  for (const width of [320, 768, 1024, 1440]) {
    test(`1年の${label}をひらがなで入力できる（${width}px）`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/playground.html?q=kokugo.g1.kanji-${category}.0001`);
      const stage = page.locator('.pg-stage');
      await expect(stage.getByText(prompt, { exact: true })).toBeVisible();
      await expect(stage.locator('ruby')).toHaveCount(0);
      await expect(stage.locator('.nq-q-choice')).toHaveCount(0);
      await expect(stage).not.toContainText('Enter');
      await expect(stage.locator('.nq-input-key-hint')).toHaveCount(0);
      await expect(stage).not.toContainText('ひらがなで');
      await expect(stage.locator('mark')).toHaveText('一');
      const answer = stage.getByRole('textbox', { name: 'こたえ 1', exact: true });
      await expect(answer).toHaveAttribute('inputmode', 'text');
      const submit = stage.locator('.nq-input-submit');
      const initialButton = await submit.boundingBox();
      await answer.fill('イチ');
      await expect(stage.getByRole('alert')).toHaveText('ひらがなで こたえよう');
      await expect(answer).toHaveAttribute('aria-invalid', 'true');
      await submit.click();
      await expect(answer).toBeEnabled();
      expect(await submit.boundingBox()).toEqual(initialButton);
      await answer.fill(correct);
      await expect(stage).not.toContainText('ひらがなで');
      await answer.press('Enter');
      await expect(stage.locator('.nq-feedback-correct')).toBeVisible();
      await page.reload();
      await stage.getByRole('textbox', { name: 'こたえ 1', exact: true }).fill(wrong);
      await stage.locator('.nq-input-submit').click();
      await expect(stage.getByRole('status')).toContainText('おしい');
      await page.reload();
      await expect(stage.getByText(prompt, { exact: true })).toBeVisible();
      await stage.screenshot({ path: `test-results/g1-${category}-${width}.png` });
    });
  }
}

test('読み入力のIME変換を終えてから案内し、長い例文も枠に収める', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/playground.html?q=kokugo.g1.kanji-onyomi.0001');
  const stage = page.locator('.pg-stage');
  const answer = stage.getByRole('textbox', { name: 'こたえ 1', exact: true });
  await answer.dispatchEvent('compositionstart');
  await answer.fill('ichi');
  await expect(stage).not.toContainText('ひらがなで');
  await answer.dispatchEvent('compositionend');
  await expect(stage.getByRole('alert')).toHaveText('ひらがなで こたえよう');
  await stage.screenshot({ path: 'test-results/g1-onyomi-invalid.png' });
  await page.goto('/playground.html?q=kokugo.g1.kanji-onyomi.0028');
  await expect(stage.getByText('せい糸こうじょうで いとを つくる', { exact: true })).toBeVisible();
  const promptBox = (await stage.locator('.nq-q-prompt').boundingBox())!;
  const answerBox = (await stage.getByRole('textbox', { name: 'こたえ 1', exact: true }).boundingBox())!;
  const submitBox = (await stage.locator('.nq-input-submit').boundingBox())!;
  const stageBox = (await stage.boundingBox())!;
  expect(promptBox.y + promptBox.height).toBeLessThan(answerBox.y);
  expect(answerBox.y + answerBox.height).toBeLessThan(submitBox.y);
  expect(submitBox.y + submitBox.height).toBeLessThanOrEqual(stageBox.y + stageBox.height);
  await stage.screenshot({ path: 'test-results/g1-onyomi-long.png' });
});

for (const { grade, id, answer } of [
  { grade: 5, id: '0068', answer: 'まつりごと' },
  { grade: 5, id: '0142', answer: 'え' },
  { grade: 5, id: '0019', answer: 'まなこ' },
  { grade: 6, id: '0098', answer: 'はら' },
  { grade: 6, id: '0054', answer: 'うけたまわ' },
  { grade: 6, id: '0014', answer: 'たっと' },
  { grade: 6, id: '0076', answer: 'たっと' },
  { grade: 6, id: '0042', answer: 'わたくし' },
]) {
  test(`高学年の長い読み・別の読みも入力して正解になる: ${grade}-${id} ${answer}`, async ({ page }) => {
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/playground.html?q=kokugo.g${grade}.kanji-kunyomi.${id}`);
      const stage = page.locator('.pg-stage');
      const input = stage.getByRole('textbox', { name: 'こたえ 1', exact: true });
      await input.fill(answer);
      await expect.poll(() => input.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      await expect.poll(() => stage.evaluate(inspectQuestion)).toEqual([]);
      await stage.screenshot({ path: `test-results/g${grade}-reading-${id}-${width}.png` });
      await input.press('Enter');
      await expect(stage.locator('.nq-feedback-correct')).toBeVisible();
    }
  });
}

test('5・6年の長い例文も問題枠に収まる', async ({ page }) => {
  for (const id of [
    'kokugo.g5.kanji-onyomi.0132',
    'kokugo.g5.kanji-kunyomi.0140',
    'kokugo.g6.kanji-onyomi.0035',
    'kokugo.g6.kanji-kunyomi.0064',
  ]) {
    await page.goto(`/playground.html?q=${id}`);
    const stage = page.locator('.pg-stage');
    await expect(stage.getByRole('textbox', { name: 'こたえ 1', exact: true })).toBeVisible();
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => stage.evaluate(inspectQuestion)).toEqual([]);
    }
  }
});

test('縦長画面の漢字読みは読み上げなしで例文を表示して解答できる', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/playground.html?q=kokugo.g1.kanji-kunyomi.0001');
  const stage = page.locator('.pg-stage');
  const input = stage.getByRole('textbox', { name: 'こたえ 1', exact: true });
  await expect(input).toBeVisible();
  await expect(stage.getByRole('button', { name: 'よみあげ', exact: true })).toHaveCount(0);
  await expect(stage.locator('.nq-q-prompt')).toContainText('りんご');
  await expect.poll(() => stage.evaluate(inspectQuestion)).toEqual([]);
  await input.fill('ひと');
  await input.press('Enter');
  await expect(stage.locator('.nq-feedback-correct')).toBeVisible();
});

test('例文に合う別読みを入力しても文字が欠けず正解になる', async ({ page }) => {
  for (const [id, answer] of [
    ['kokugo.g2.kanji-kunyomi.0008', 'うち'],
    ['kokugo.g3.kanji-kunyomi.0159', 'ひら'],
    ['kokugo.g4.kanji-kunyomi.0097', 'ともしび'],
  ]) {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(`/playground.html?q=${id}`);
    const stage = page.locator('.pg-stage');
    const input = stage.getByRole('textbox', { name: 'こたえ 1', exact: true });
    await input.fill(answer!);
    await expect.poll(() => stage.evaluate(inspectQuestion)).toEqual([]);
    expect(await input.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await input.press('Enter');
    await expect(stage.locator('.nq-feedback-correct')).toBeVisible();
  }
});
