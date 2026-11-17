import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';

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
  await grade.locator('[data-math-scope="three-numbers"]').click();
  await expect(grade.locator('.pg-question-row')).toHaveCount(4);
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

test('繰り上がりを分離し、復元した計算を基本加減へ戻す', async ({ page }) => {
  await page.goto('/playground.html');
  const subject = page.locator('details[data-subject="sansu"]');
  await subject.locator(':scope > summary').click();
  const grade = subject.locator('details[data-grade="1"]');
  await grade.locator(':scope > summary').click();
  await grade.locator('[data-math-scope="addition"]').click();
  await expect(grade.locator('.pg-question-row')).toHaveCount(28);
  await expect(grade.locator('.pg-question-row').filter({ hasText: '9 + 3' })).toHaveCount(0);
  await grade.locator('[data-math-scope="carry-addition"]').click();
  await expect(grade.locator('.pg-question-row').filter({ hasText: '9 + 3' })).toHaveCount(1);
  await expect(grade.locator('[data-math-scope="repair"]')).toHaveCount(0);
  await grade.locator('[data-math-scope="subtraction"]').click();
  await expect(grade.locator('.pg-question-row')).toHaveCount(22);
  await expect(grade.locator('.pg-question-row.pg-bad')).toHaveCount(0);
});

const mathReviewGroupsByGrade = Object.fromEntries(
  readdirSync('content/review')
    .filter((file) => /^sansu-g[1-6]-order\.json$/.test(file))
    .map(
      (file) =>
        [
          file.match(/g([1-6])/)![1]!,
          (
            JSON.parse(readFileSync(`content/review/${file}`, 'utf8')) as {
              groups: { id: string; questionIds: string[] }[];
            }
          ).groups,
        ] as const,
    ),
);

for (const [gradeNumber, groups] of Object.entries(mathReviewGroupsByGrade)) {
  test(`小${gradeNumber}の学ぶ順の全グループで先頭・末尾の問題を開き、学年間で表示IDを重複させない`, async ({
    page,
  }) => {
    await page.goto('/playground.html');
    const subject = page.locator('details[data-subject="sansu"]');
    await subject.locator(':scope > summary').click();
    const grade = subject.locator(`details[data-grade="${gradeNumber}"]`);
    await grade.locator(':scope > summary').click();
    await expect(grade.locator('[data-math-scope]')).toHaveCount(groups.length, { timeout: 20_000 });
    test.setTimeout(120_000);
    for (const group of groups) {
      const button = grade.locator(`[data-math-scope="${group.id}"]`);
      await button.click();
      await expect(grade.locator('.pg-question-row')).toHaveCount(Math.min(200, group.questionIds.length));
      await grade.locator('.pg-question-row').first().click();
      await expect(page.locator('#ed-question-id')).toHaveValue(group.questionIds[0]!);
      await grade.locator('.pg-question-row').last().click();
      await expect(page.locator('#ed-question-id')).toHaveValue(group.questionIds.at(-1)!);
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(grade.locator('.pg-question-row')).toHaveCount(Math.min(200, group.questionIds.length));
    }
    const duplicates = await page.locator('[id^="pg-math-count-"]').evaluateAll((nodes) => {
      const ids = nodes.map((node) => node.id);
      return ids.length - new Set(ids).size;
    });
    expect(duplicates).toBe(0);
  });
}
