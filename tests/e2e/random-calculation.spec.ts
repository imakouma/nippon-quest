import { expect, test, type Page } from '@playwright/test';
import type { QuestionBase } from '../../src/questions/contracts';
import { inspectQuestion } from '../../src/tools/questionLayoutAudit';

const questionId = 'sansu.g1.tashizan.random.0001';
async function replay(page: Page) {
  const stop = page.getByRole('button', { name: '中断', exact: true });
  if (await stop.isEnabled()) await stop.click();
  await page.getByRole('button', { name: '再生', exact: true }).click();
}
async function expectScore(page: Page, score: string) {
  const result = page.getByRole('region', { name: 'テスト結果' });
  await expect(result).toBeVisible();
  await expect(result.locator('dd').first()).toHaveText(score);
}
async function setPair(page: Page, left: number, right: number) {
  for (const [key, n] of [
    ['leftMin', left],
    ['leftMax', left],
    ['rightMin', right],
    ['rightMax', right],
  ] as const) {
    await page.locator(`#ed-random-${key}`).fill(String(n));
  }
}

test('ランダム計算の条件を保存・再読込し、式を固定して記入・採点・解説できる', async ({ page }) => {
  let saved: QuestionBase[] | undefined;
  await page.route('**/content/questions/sansu/g1/tashizan/set-002.json', async (route) => {
    if (saved) await route.fulfill({ json: saved });
    else await route.continue();
  });
  await page.route('**/__nq/save-question', async (route) => {
    const body = route.request().postDataJSON() as {
      expected: QuestionBase[];
      id: string;
      question: QuestionBase;
    };
    saved = body.expected.map((q) => (q.id === body.id ? body.question : q));
    await route.fulfill({ json: { questions: saved } });
  });
  await page.goto(`/playground.html?q=${questionId}`);
  await expect(page.locator('#ed-question-type')).toHaveValue('random-calculation');
  await setPair(page, 1, 3);
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('保存しました');
  expect(saved?.[0]?.payload).toMatchObject({ leftMin: 1, leftMax: 1, rightMin: 3, rightMax: 3 });
  await page.reload();
  await expect(page.locator('#ed-random-leftMin')).toHaveValue('1');
  await expect(page.locator('#ed-random-rightMax')).toHaveValue('3');
  const equation = page.locator('.nq-input-template');
  await expect(equation).toContainText('1 ＋ 3');
  for (const width of [390, 960]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
    await expect(equation).toContainText('1 ＋ 3');
  }
  await page.locator('.nq-q-input input').fill('4');
  await page.locator('.nq-input-submit').click();
  await page.getByRole('button', { name: 'かんがえかたを みる' }).click();
  await expect(page.locator('.pg-stage')).toContainText('1 ＋ 3 ＝ 4');
  await page.getByRole('button', { name: 'つぎへ', exact: true }).click();
  await expectScore(page, '100%');
  await setPair(page, 2, 5);
  await replay(page);
  await expect(equation).toContainText('2 ＋ 5');
  await page.locator('.nq-q-input input').fill('8');
  await page.locator('.nq-input-submit').click();
  await page.getByRole('button', { name: 'つぎへ', exact: true }).click();
  await expectScore(page, '0%');
});

test('繰り上がりありの4択は正解が1個で、範囲不正を保存・出題しない', async ({ page }) => {
  let saves = 0;
  await page.route('**/__nq/save-question', async (route) => {
    saves++;
    await route.fulfill({ status: 500, json: {} });
  });
  await page.goto(`/playground.html?q=${questionId}`);
  await setPair(page, 8, 7);
  await page.locator('#ed-random-carry').selectOption('true');
  await page.locator('#ed-random-response').selectOption('choice');
  await replay(page);
  await expect(page.locator('#nq-question-prompt')).toContainText('8 ＋ 7');
  const choices = page.locator('.nq-choice');
  await expect(choices).toHaveCount(4);
  const values = await choices.locator('.nq-choice-content').allTextContents();
  expect(new Set(values).size).toBe(4);
  await choices.filter({ hasText: /15/ }).click();
  await page.getByRole('button', { name: 'つぎへ', exact: true }).click();
  await expectScore(page, '100%');
  await page.locator('#ed-random-carry').selectOption('false');
  await expect(page.locator('.pg-editor').getByRole('alert')).toContainText('組み合わせ');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('.pg-save-toast[role="alert"]')).toContainText('保存できませんでした');
  expect(saves).toBe(0);
  await replay(page);
  await expect(page.locator('.pg-warn')).toContainText('invalid_addition_range');
  await expect(page.getByRole('button', { name: '再生', exact: true })).toBeEnabled();
});

test('算数をランダム計算へ切替・取消・元へ戻せ、他教科には追加しない', async ({ page }) => {
  await page.goto('/playground.html?q=sansu.g1.tashizan.0001');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.locator('#ed-question-type').selectOption('random-calculation');
  await expect(page.locator('#ed-question-type')).toHaveValue('choice');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#ed-question-type').selectOption('random-calculation');
  await expect(page.locator('#ed-random-response')).toHaveValue('text-input');
  await expect(page.locator('#ed-question-explanation')).toHaveAttribute('readonly', '');
  await setPair(page, 2, 5);
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#ed-question-type').selectOption('text-input');
  await expect(page.locator('#ed-question-type')).toHaveValue('text-input');
  await expect(page.locator('#ed-payload-answers-0')).toHaveValue('7');
  await replay(page);
  await expect(page.locator('.nq-input-template')).toContainText('2 ＋ 5');
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/playground.html?q=kokugo.g1.bun-no-kimari.0001');
  await expect(page.locator('#ed-question-type option[value="random-calculation"]')).toHaveCount(0);
});

test('ランダム計算も時間切れ・中断後に再生できる', async ({ page }) => {
  await page.goto(`/playground.html?q=${questionId}`);
  await page.locator('#ed-question-time-limit').fill('1');
  await replay(page);
  await page.getByRole('button', { name: 'つぎへ', exact: true }).click();
  await expect(page.getByRole('region', { name: 'テスト結果' }).locator('.pg-result-state')).toHaveText(
    '時間切れ',
  );
  await page.locator('#ed-question-time-limit').fill('30');
  await replay(page);
  await page.getByRole('button', { name: '中断', exact: true }).click();
  await expect(page.getByRole('button', { name: '再生', exact: true })).toBeEnabled();
  await replay(page);
  await expect(page.locator('.nq-input-template')).toBeVisible();
});

for (const [id, left, right, carry, remainder, answers, symbol] of [
  ['sansu.g1.random-subtract.0001', 13, 5, true, false, ['8'], '−'],
  ['sansu.g2.random-multiply.0001', 6, 7, false, false, ['42'], '×'],
  ['sansu.g3.random-divide.0001', 56, 7, false, false, ['8'], '÷'],
  ['sansu.g3.random-divide.0002', 17, 5, false, true, ['3', '2'], '÷'],
] as const) {
  test(`学年別計算を入力し解説まで確認: ${id}`, async ({ page }) => {
    await page.goto(`/playground.html?q=${id}`);
    await setPair(page, left, right);
    if (carry) await page.locator('#ed-random-carry').selectOption('true');
    await replay(page);
    await expect(page.locator('.nq-input-template')).toContainText(`${left} ${symbol} ${right}`);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
    const inputs = page.locator('.nq-q-input input');
    await expect(inputs).toHaveCount(answers.length);
    for (let i = 0; i < answers.length; i++) await inputs.nth(i).fill(answers[i]!);
    await page.locator('.nq-input-submit').click();
    await page.getByRole('button', { name: 'かんがえかたを みる' }).click();
    await expect(page.locator('.pg-stage')).toContainText(`${left} ${symbol} ${right} ＝ ${answers[0]}`);
    if (remainder) await expect(page.locator('.pg-stage')).toContainText('5 × 3 ＋ 2 ＝ 17');
    await page.getByRole('button', { name: 'つぎへ', exact: true }).click();
    await expectScore(page, '100%');
  });
}

test('学年に合う演算・段階だけを選べ、余り付き4択を保存・再読込できる', async ({ page }) => {
  for (const [grade, operations] of [
    [1, ['add', 'subtract']],
    [2, ['add', 'subtract', 'multiply']],
    [3, ['add', 'subtract', 'multiply', 'divide']],
  ] as const) {
    await page.goto(`/playground.html?q=sansu.g${grade}.random-add.0001`);
    await expect(page.locator('#ed-random-operation option')).toHaveCount(operations.length);
    expect(
      await page
        .locator('#ed-random-operation option')
        .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value)),
    ).toEqual(operations);
    if (grade < 3) await expect(page.locator('#ed-random-stage option[value="fourDigits"]')).toHaveCount(0);
  }
  let saved: QuestionBase[] | undefined;
  await page.route('**/content/questions/sansu/g3/random-calculation/set-001.json', async (route) =>
    saved ? route.fulfill({ json: saved }) : route.continue(),
  );
  await page.route('**/__nq/save-question', async (route) => {
    const body = route.request().postDataJSON();
    saved = body.expected.map((q: QuestionBase) => (q.id === body.id ? body.question : q));
    await route.fulfill({ json: { questions: saved } });
  });
  await page.goto('/playground.html?q=sansu.g3.random-divide.0002');
  await setPair(page, 17, 5);
  await page.locator('#ed-random-response').selectOption('choice');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('保存しました');
  await page.reload();
  await expect(page.locator('#ed-random-remainder')).toHaveValue('true');
  const choices = page.locator('.nq-choice');
  await expect(choices).toHaveCount(4);
  expect(new Set(await choices.locator('.nq-choice-content').allTextContents()).size).toBe(4);
  await page.setViewportSize({ width: 320, height: 700 });
  await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
  await choices.filter({ hasText: '3 あまり 2' }).click();
  await page.getByRole('button', { name: 'つぎへ', exact: true }).click();
  await expectScore(page, '100%');
});

test('4桁の計算も縮小後に答えられる', async ({ page }) => {
  await page.goto('/playground.html?q=sansu.g3.random-subtract.0001');
  await page.locator('#ed-random-stage').selectOption('fourDigits');
  await setPair(page, 1000, 1);
  await page.locator('#ed-random-carry').selectOption('true');
  await replay(page);
  await page.setViewportSize({ width: 320, height: 568 });
  await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
  await page.locator('.nq-q-input input').fill('999');
  await page.locator('.nq-input-submit').click();
  await page.getByRole('button', { name: 'つぎへ', exact: true }).click();
  await expectScore(page, '100%');
});
