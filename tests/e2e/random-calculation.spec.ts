import { expect, test, type Page } from '@playwright/test';
import type { QuestionBase } from '../../src/questions/contracts';
import { inspectQuestion } from '../../src/tools/questionLayoutAudit';

const questionId = 'sansu.g1.tashizan.random.0001';
async function replay(page: Page) {
  const stop = page.getByRole('button', { name: '中断', exact: true });
  if (await stop.isEnabled()) await stop.click();
  await page.getByRole('button', { name: '再生', exact: true }).click();
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
  await expect(page.locator('.pg-result')).toContainText('"score": 1');
  await expect(page.locator('.pg-result')).toContainText('"expression": "1 + 3"');
  await setPair(page, 2, 5);
  await replay(page);
  await expect(equation).toContainText('2 ＋ 5');
  await page.locator('.nq-q-input input').fill('8');
  await page.locator('.nq-input-submit').click();
  await page.getByRole('button', { name: 'つぎへ', exact: true }).click();
  await expect(page.locator('.pg-result')).toContainText('"score": 0');
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
  await expect(page.locator('.pg-result')).toContainText('"score": 1');
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
  await expect(page.locator('.pg-result')).toContainText('"timedOut": true');
  await page.locator('#ed-question-time-limit').fill('30');
  await replay(page);
  await page.getByRole('button', { name: '中断', exact: true }).click();
  await expect(page.getByRole('button', { name: '再生', exact: true })).toBeEnabled();
  await replay(page);
  await expect(page.locator('.nq-input-template')).toBeVisible();
});
