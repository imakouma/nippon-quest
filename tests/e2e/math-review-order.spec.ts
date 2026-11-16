import { expect, test } from '@playwright/test';

test('小1算数の学ぶ順は単元を跨いで基礎をまとめ、保存フォルダを変更しない', async ({ page }) => {
  const actions: string[] = [];
  const assigned = 'sansu.g1.kazu-100.correspondence-0001';
  await page.route('**/__nq/folder-state', (route) => {
    actions.push(route.request().postDataJSON().action);
    return route.fulfill({
      json: {
        revision: 3,
        layout: {
          folders: [{ id: 'teacher', name: '担当の確認', subject: 'sansu', grade: 1, parent: null }],
          assignments: { [assigned]: 'teacher' },
          hidden: ['sansu:1::sansu.g1.kazu-100'],
        },
        snapshots: [],
      },
    });
  });
  await page.goto('/playground.html');
  const subject = page.locator('details[data-subject="sansu"]');
  await subject.locator(':scope > summary').click();
  const grade = subject.locator('details[data-grade="1"]');
  await grade.locator(':scope > summary').click();
  const groups = grade.locator('[data-math-scope]');
  await expect(groups).toHaveCount(22, { timeout: 20_000 });
  await expect(groups.first()).toHaveAttribute('data-math-scope', 'correspondence');
  await grade.locator('[data-math-scope="correspondence"]').click();
  await expect(grade.locator('.pg-question-row')).toHaveCount(3);
  await grade.locator('.pg-question-row').first().click();
  await expect(page.locator('#ed-question-id')).toHaveValue(assigned);
  await expect(page.locator('#ed-question-unit')).toHaveValue('sansu.g1.kazu-100');
  await expect(page.locator('.pg-folder-move')).toHaveCount(0);
  await grade.locator('[data-math-scope="count-five"]').click();
  await expect(grade.locator('.pg-question-row')).toHaveCount(4);
  await grade.locator('.pg-question-row').first().click();
  await expect(page.locator('#ed-question-id')).toHaveValue('legacy.sansu.g1.math-1-1.1fa82b870bfb');
  await grade.locator('.pg-original-math-folders > summary').click();
  await expect(grade.locator('.pg-custom-folder > summary').filter({ hasText: '担当の確認' })).toBeVisible();
  expect(actions).toEqual(['read']);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    ).toBeLessThanOrEqual(1);
  }
});

test('繰り上がりと修復待ちを分離し、欠落問題を形式OKと表示しない', async ({ page }) => {
  await page.goto('/playground.html');
  const subject = page.locator('details[data-subject="sansu"]');
  await subject.locator(':scope > summary').click();
  const grade = subject.locator('details[data-grade="1"]');
  await grade.locator(':scope > summary').click();
  await grade.locator('[data-math-scope="addition"]').click();
  await expect(grade.locator('.pg-question-row')).toHaveCount(17);
  await expect(grade.locator('.pg-question-row').filter({ hasText: '9 + 3' })).toHaveCount(0);
  await grade.locator('[data-math-scope="carry-addition"]').click();
  await expect(grade.locator('.pg-question-row').filter({ hasText: '9 + 3' })).toHaveCount(1);
  await grade.locator('[data-math-scope="repair"]').click();
  await expect(grade.locator('.pg-question-row')).toHaveCount(13);
  await expect(grade.locator('.pg-question-row.pg-bad')).toHaveCount(13);
  await expect(grade.locator('.pg-question-row').first()).toContainText('修復');
  await grade.locator('.pg-question-row').first().click();
  await page.getByRole('button', { name: '再生', exact: true }).click();
  await expect(page.locator('.pg-stage .nq-q')).toHaveCount(0);
  await expect(page.locator('.pg-preview')).toContainText('式や図が不足');
});
