import { expect, test } from '@playwright/test';
import { inspectQuestion } from '../../src/tools/questionLayoutAudit';

test('スマホの幅変更後も問題名と操作ボタンが重ならず切れない', async ({ page }) => {
  await page.goto('/playground.html?q=sansu.g1.tokei.0002');
  await expect(page.locator('.nq-q')).toBeVisible();
  for (const size of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    await expect
      .poll(() =>
        page.locator('.pg-preview-head').evaluate((head) => {
          const heading = head.querySelector('h2')!;
          const controls = head.querySelector('.pg-test-controls')!;
          const titleBox = heading.getBoundingClientRect();
          const controlsBox = controls.getBoundingClientRect();
          const headBox = head.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(heading);
          return (
            [...range.getClientRects()].every(
              (rect) => rect.left >= titleBox.left - 1 && rect.right <= titleBox.right + 1,
            ) &&
            (titleBox.right <= controlsBox.left || titleBox.bottom <= controlsBox.top) &&
            controlsBox.right <= headBox.right &&
            document.documentElement.scrollWidth <= document.documentElement.clientWidth
          );
        }),
      )
      .toBe(true);
  }
});

test('スマホで問題フォルダを閉じると一覧の空白も縮む', async ({ page }) => {
  await page.goto('/playground.html?q=sansu.g1.tokei.0002');
  const folder = page.locator('.pg-tree-details');
  await expect(folder).toHaveAttribute('open', '');
  await folder.locator('summary').first().tap();
  await expect(folder).not.toHaveAttribute('open', '');
  expect((await page.locator('.pg-list').boundingBox())!.height).toBeLessThan(180);
});

const questions = [
  'sansu.g1.tokei.0002',
  'sample.experiment.water.0001',
  'sample.kanji-trace.0001',
  'sample.number-build.blocks.0001',
  'sample.pair-match.0003',
  'sample.picture-word.0001',
  'sample.sort-order.0001',
  'legacy.sansu.g3.math-3-7.54bfe42d11e7',
  'legacy.shakai.g3.cur-1403-01.6d0e031ce36a',
];
for (const id of questions) {
  test(`スマホの縦横回転で問題全体が追従する: ${id}`, async ({ page }) => {
    await page.goto(`/playground.html?q=${id}`);
    await expect(page.locator('.nq-q')).toBeVisible();
    for (const size of [
      { width: 390, height: 844 },
      { width: 844, height: 390 },
      { width: 320, height: 568 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(size);
      await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
      await expect
        .poll(() =>
          page.locator('.pg-stage').evaluate((stage) => {
            const r = stage.getBoundingClientRect();
            return r.width > 0 && r.left >= -1 && r.right <= document.documentElement.clientWidth + 1;
          }),
        )
        .toBe(true);
    }
  });
}

test('スマホで回転後に時計をタップして解説を開ける', async ({ page }, testInfo) => {
  await page.goto('/playground.html?q=sansu.g1.tokei.0002');
  await expect(page.locator('.nq-q')).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.nq-choice').filter({ hasText: '3じ 30ぷん' }).tap();
  await page.getByRole('button', { name: 'かんがえかたを みる' }).tap();
  await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
  await page.locator('.pg-preview').screenshot({ path: testInfo.outputPath('clock-review-mobile.png') });
  await page.getByRole('button', { name: 'つぎへ', exact: true }).tap();
  await expect(page.locator('.pg-result')).toContainText('"score": 1');
});

test('スマホで入力中に高さが変わっても答えられる', async ({ page }) => {
  await page.goto('/playground.html?q=legacy.sansu.g3.math-3-7.54bfe42d11e7');
  const input = page.getByRole('textbox', { name: /こたえ/ });
  await input.tap();
  await page.setViewportSize({ width: 390, height: 480 });
  await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
  await input.fill('9');
  await page.locator('.nq-input-submit').tap();
  await page.getByRole('button', { name: 'つぎへ', exact: true }).tap();
  await expect(page.locator('.pg-result')).toContainText('"score": 1');
});

test('画面全体は境界幅をまたいでも同じ割合で連続的に伸縮する', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto('/playground.html?q=sansu.g1.tokei.0002');
  await expect(page.locator('.nq-q-prompt-img')).toBeVisible();
  await page.locator('.pg-tree-details > summary').tap();
  const measure = () =>
    page.locator('.pg').evaluate((root) => {
      const width = root.getBoundingClientRect().width;
      const selectors = [
        '.pg-header h1',
        '.pg-question-heading h2',
        '.pg-run',
        '.pg-tree-details > summary',
        '.ed-group-title',
        '.ed-label',
        '.ed-input',
      ];
      return {
        fonts: selectors.map(
          (selector) => parseFloat(getComputedStyle(root.querySelector(selector)!).fontSize) / width,
        ),
        boxes: ['.pg-preview', '.pg-stage', '.nq-q-prompt-img', '.nq-choice', '.pg-run']
          .map((selector) => {
            const box = root.querySelector(selector)!.getBoundingClientRect();
            return [box.width / width, box.height / width];
          })
          .flat(),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
  const baseline = await measure();
  for (const width of [
    320, 339, 340, 341, 390, 519, 520, 521, 600, 601, 767, 768, 819, 820, 821, 959, 960, 961, 1099, 1100,
    1101, 1199, 1200, 1201, 1440,
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(
        async () => {
          const actual = await measure();
          // Native borders round to device pixels; stacked borders can differ by a few CSS pixels.
          const fontsMatch = actual.fonts.every((value, i) => Math.abs(value - baseline.fonts[i]!) < 0.00001);
          return fontsMatch
            ? Math.max(...actual.boxes.map((value, i) => Math.abs(value - baseline.boxes[i]!) * width))
            : Infinity;
        },
        { message: `${width}pxでも文字・時計・操作部の比率を維持` },
      )
      .toBeLessThan(5);
    expect((await measure()).overflow).toBeLessThanOrEqual(1);
    await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
  }
});

test('多数の検索結果も相対的な高さの一覧内でスクロールできる', async ({ page }) => {
  await page.goto('/playground.html?q=sansu.g1.tokei.0002');
  await page.locator('.pg-filter-details > summary').tap();
  await page.locator('#pg-f-text').fill('sansu');
  const results = page.locator('.pg-results .pg-question-list');
  await expect(results.locator('.pg-question-row')).toHaveCount(200);
  for (const width of [320, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const metrics = await results.evaluate((list) => ({
      height: list.getBoundingClientRect().height,
      contentHeight: list.scrollHeight,
      width: document.querySelector('.pg')!.getBoundingClientRect().width,
      overflow: getComputedStyle(list).overflowY,
    }));
    expect(metrics.height).toBeLessThanOrEqual(metrics.width + 1);
    expect(metrics.contentHeight).toBeGreaterThan(metrics.height);
    expect(metrics.overflow).toBe('auto');
  }
});
