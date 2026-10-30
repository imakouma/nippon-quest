import { expect, test } from '@playwright/test';

test('長い選択肢の文字は番号と重ならず、枠からはみ出さない', async ({ page }) => {
  await page.goto('/battle-question-audit.html?q=legacy.rika.g5.sci-5-5.abadeb364b15');
  const choices = page.locator('.nq-q-choice .nq-choice');
  await expect(choices.first()).toBeVisible({ timeout: 20_000 });
  for (const choice of await choices.all()) {
    const content = choice.locator('.nq-choice-content');
    await expect(content).toBeVisible();
    const bounds = await choice.evaluate((button) => {
      const box = button.getBoundingClientRect();
      const key = button.querySelector('.nq-choice-key')!.getBoundingClientRect();
      const text = button.querySelector('.nq-choice-content')!.getBoundingClientRect();
      return {
        box: { left: box.left, right: box.right, top: box.top, bottom: box.bottom },
        key: { right: key.right },
        text: { left: text.left, right: text.right, top: text.top, bottom: text.bottom },
        scroll: button.scrollWidth,
        width: button.clientWidth,
      };
    });
    expect(bounds.text.left).toBeGreaterThanOrEqual(bounds.key.right);
    expect(bounds.text.right).toBeLessThanOrEqual(bounds.box.right);
    expect(bounds.text.top).toBeGreaterThanOrEqual(bounds.box.top);
    expect(bounds.text.bottom).toBeLessThanOrEqual(bounds.box.bottom);
    expect(bounds.scroll).toBeLessThanOrEqual(bounds.width + 1);
  }
});

test('テンプレート型の文字入力問題は問題文を二重に表示しない', async ({ page }) => {
  await page.goto('/battle-question-audit.html?q=legacy.sansu.g1.math-1-9.3e2f1449e1d8');
  await expect(page.locator('.nq-q-input')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.nq-q-input .nq-q-prompt')).toHaveCount(0);
  await expect(page.locator('.nq-q-input .nq-input-suffix')).toHaveCount(0);
  await expect(page.locator('.nq-q-input input')).toHaveAttribute('aria-describedby', 'nq-question-template');
  await expect(page.locator('[data-audit-status="complete"]')).toBeVisible();
  await expect(page.locator('[data-audit-failure-count]')).toHaveAttribute('data-audit-failure-count', '0');
});

test('画像英単語問題はバトル問題枠に収まる', async ({ page }) => {
  await page.goto('/battle-question-audit.html?q=sample.picture-word.0001');
  await expect(page.locator('.nq-q-pw')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-audit-status="complete"]')).toBeVisible();
  await expect(page.locator('[data-audit-failure-count]')).toHaveAttribute('data-audit-failure-count', '0');
});

test('長い選択肢と縦並びカードはスクロールして問題枠内で操作できる', async ({ page }) => {
  const questionIds = [
    'kokugo.g2.observation-writing.0003',
    'kokugo.g2.reading-sequence.0002',
    'kokugo.g2.speaking-listening.0005',
    'legacy.rika.g5.sci-5-5.abadeb364b15',
    'legacy.rika.g6.sci-6-5.efb8a53ef841',
    'legacy.rika.g6.sci-6-9.ab5f3a055d8d',
    'seikatsu.g1.next-grade.0005',
  ];
  for (const questionId of questionIds) {
    await page.goto(`/battle-question-audit.html?q=${questionId}`);
    await expect(page.locator('.nq-q')).toHaveCSS('overflow-y', 'auto');
    await expect(page.locator('[data-audit-status="complete"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-audit-failure-count]')).toHaveAttribute('data-audit-failure-count', '0');
  }
});

test('全問題をバトル問題枠で描画してレイアウトを検査する', async ({ page }) => {
  test.setTimeout(420_000);
  await page.goto('/battle-question-audit.html');
  const audit = page.locator('[data-audit-status]');
  await expect(audit).toHaveAttribute('data-audit-status', /^(?:complete|failed)$/, { timeout: 400_000 });
  await expect(audit).toHaveAttribute('data-audit-status', 'complete');
  await expect(page.locator('[data-audit-failure-count]')).toHaveAttribute('data-audit-failure-count', '0');
});
