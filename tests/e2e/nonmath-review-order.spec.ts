import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';

type Group = { unit: string; grade: number; basic: string[]; standard: string[]; applied: string[] };
const orders = readdirSync('content/review')
  .filter((name) => /^(kokugo|kanji|rika|shakai|seikatsu|eigo)-order\.json$/.test(name))
  .map(
    (name) =>
      JSON.parse(readFileSync(`content/review/${name}`, 'utf8')) as {
        subject: string;
        groups: Group[];
      },
  );

for (const order of orders) {
  for (const grade of [...new Set(order.groups.map((group) => group.grade))]) {
    test(`${order.subject}小${grade}は全単元の学習順で先頭・末尾を開ける`, async ({ page }) => {
      test.setTimeout(180_000);
      const groups = order.groups.filter((group) => group.grade === grade);
      await page.goto('/playground.html');
      await expect(page.getByRole('heading', { name: '問題レビュー', exact: true })).toBeVisible();
      await page.locator('.pg-filter-details > summary').click();
      const unit = page.locator('#pg-f-unit');
      await unit
        .locator(`option[value="${groups[0]!.unit}"]`)
        .waitFor({ state: 'attached', timeout: 60_000 });
      for (const group of groups) {
        const ids = [...group.basic, ...group.standard, ...group.applied];
        await unit.selectOption(group.unit);
        const rows = page.locator('.pg-results .pg-question-row');
        await expect(rows).toHaveCount(Math.min(200, ids.length));
        await rows.first().click();
        await expect(page.locator('#ed-question-id')).toHaveValue(ids[0]!);
        await rows.last().click();
        await expect(page.locator('#ed-question-id')).toHaveValue(ids[Math.min(200, ids.length) - 1]!);
        // 既存の200件上限を超える単元でも、末尾の問題を検索して開ける。
        if (ids.length > 200) {
          await page.locator('#pg-f-text').fill(ids.at(-1)!);
          await expect(rows).toHaveCount(1);
          await rows.first().click();
          await expect(page.locator('#ed-question-id')).toHaveValue(ids.at(-1)!);
          await page.locator('#pg-f-text').fill('');
        }
      }
    });
  }
}

test('単元フォルダと漢字の書きフォルダにも順序を適用する', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/playground.html');
  const english = page.locator('details[data-subject="eigo"]');
  await english.locator(':scope > summary').click();
  await english.locator('details[data-grade="4"] > summary').click();
  await english.locator('[data-unit="eigo.g4.directions-requests"]').click();
  await expect(page.locator('.pg-question-row')).toHaveCount(15, { timeout: 60_000 });
  await page.locator('.pg-question-row').first().click();
  await expect(page.locator('#ed-question-id')).toHaveValue('eigo.g4.directions-requests.0013');
  await expect(page.locator('.pg-results')).toHaveCount(0);

  const kanji = page.locator('details[data-subject="kanji"]');
  await kanji.locator(':scope > summary').click();
  const grade = kanji.locator('details[data-grade="1"]');
  await grade.locator(':scope > summary').click();
  await grade.locator('[data-kanji-category="writing"] > summary').click();
  await expect(grade.locator('.pg-question-row')).toHaveCount(80);
  await grade.locator('.pg-question-row').first().click();
  await expect(page.locator('#ed-question-id')).toHaveValue('kokugo.g1.kanji-writing.0001');
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    ).toBeLessThanOrEqual(1);
  }
});
