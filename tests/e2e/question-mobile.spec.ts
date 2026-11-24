import { readFileSync, readdirSync } from 'node:fs';
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
  'sansu.g1.random-subtract.0001',
  'sansu.g2.random-multiply.0001',
  'sansu.g3.random-divide.0002',
  'sample.random-calculation.0001',
  'sample.random-calculation.0002',
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
  await page.getByRole('button', { name: 'かいせつ' }).tap();
  await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
  await page.locator('.pg-preview').screenshot({ path: testInfo.outputPath('clock-review-mobile.png') });
  await page.getByRole('button', { name: 'つぎへ', exact: true }).tap();
  await expect(page.getByRole('region', { name: 'テスト結果' }).locator('dd').first()).toHaveText('100%');
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
  await expect(page.getByRole('region', { name: 'テスト結果' }).locator('dd').first()).toHaveText('100%');
});

test('広い画面でも一覧幅と周辺UIの文字を画面に比例して拡大しない', async ({ page }) => {
  await page.goto('/playground.html?q=sansu.g1.tokei.0002');
  await expect(page.locator('.nq-q-prompt-img')).toBeVisible();
  for (const width of [1280, 1600, 1920, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const metrics = await page.locator('.pg-list').evaluate((list) => ({
      width: list.getBoundingClientRect().width,
      inputFont: parseFloat(getComputedStyle(document.querySelector('.ed-input')!).fontSize),
      buttonFont: parseFloat(getComputedStyle(document.querySelector('.pg-run')!).fontSize),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    expect(metrics.width).toBe(440);
    expect(metrics.inputFont).toBe(16);
    expect(metrics.buttonFont).toBe(16);
    expect(metrics.overflow).toBeLessThanOrEqual(1);
    await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
  }
});

test('多数の検索結果も高さを制限した一覧内でスクロールできる', async ({ page }) => {
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
      overflow: getComputedStyle(list).overflowY,
    }));
    expect(metrics.height).toBeLessThanOrEqual(520);
    expect(metrics.contentHeight).toBeGreaterThan(metrics.height);
    expect(metrics.overflow).toBe('auto');
  }
});

test('820px以下は1列、広い画面は2列になる', async ({ page }) => {
  await page.goto('/playground.html?q=sansu.g1.tokei.0002');
  await expect(page.locator('.nq-q')).toBeVisible();
  for (const [width, height] of [
    [390, 844],
    [844, 390],
    [819, 900],
    [820, 900],
    [821, 900],
    [960, 900],
    [390, 844],
  ]) {
    await page.setViewportSize({ width: width!, height: height! });
    await expect
      .poll(() =>
        page.locator('.pg-workspace').evaluate((workspace) => {
          const list = workspace.querySelector('.pg-list')!.getBoundingClientRect();
          const review = workspace.querySelector('.pg-review')!.getBoundingClientRect();
          return review.left >= list.right ? 2 : 1;
        }),
      )
      .toBe(width! <= 820 ? 1 : 2);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    ).toBe(true);
  }
});

for (const id of [
  'sansu.g1.data.0001',
  'legacy.sansu.g6.math-6-4.7af63ede6c3e',
  'legacy.rika.g3.cur-1503-08.e9416fa6bbec',
  'legacy.rika.g4.cur-1504-05.600963ece2ca',
  'legacy.rika.g5.sci-5-8.a3fd7dd5cc5b',
  'legacy.rika.g6.sci-6-10.7120e72536af',
  'legacy.shakai.g3.cur-1403-04.0547e5f3c29a',
  'legacy.shakai.g4.cur-1404-02.b7b25c6bf36e',
  'legacy.shakai.g5.soc-5-6.27a4c2358cd2',
  'legacy.shakai.g5.soc-5-6.a8c96b1c1aa6',
  'legacy.shakai.g5.soc-5-6.b059945f3dcc',
  'legacy.shakai.g6.soc-6-2.38e654ff9d87',
]) {
  test(`縦画面の教材の本文と回答ボタンが小さくなりすぎない: ${id}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/playground.html?q=${id}`);
    await expect(page.locator('.nq-q')).toBeVisible();
    await page
      .locator('.nq-q img')
      .evaluateAll((images: HTMLImageElement[]) => Promise.all(images.map((image) => image.decode())));
    // 画像読み込み後のResizeObserverによる倍率更新まで、全条件を一緒に待つ。
    await expect(async () => {
      const metrics = await page.locator('.nq-q').evaluate((question) => {
        const scale = question.getBoundingClientRect().width / (question as HTMLElement).offsetWidth;
        const prompt = question.querySelector('.nq-q-prompt')!;
        const buttons = [
          ...question.querySelectorAll<HTMLElement>('.nq-choice, .nq-input-number-pad .nq-btn'),
        ];
        return {
          font: parseFloat(getComputedStyle(prompt).fontSize) * scale,
          targets: buttons.map((b) => b.getBoundingClientRect().height),
          image: question.querySelector('img')!.getBoundingClientRect().width,
        };
      });
      expect(metrics.font).toBeGreaterThanOrEqual(18);
      expect(Math.min(...metrics.targets)).toBeGreaterThanOrEqual(40);
      expect(metrics.image).toBeGreaterThanOrEqual(280);
      expect(await page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
    }).toPass({ timeout: 10_000 });
  });
}

for (const [hash, x, y] of [
  ['6d0e031ce36a', 45, 70],
  ['ac17d998e6b9', 28, 35],
  ['c1db6b8cc38e', 68, 25],
  ['ffeb4560d45d', 75, 75],
  ['e2f89bc12f06', 70.8333, 34.6154],
  ['e2f89bc12f06', 83.3333, 34.6154],
  ['e2f89bc12f06', 58.3333, 34.6154],
  ['e2f89bc12f06', 70.8333, 25],
  ['e2f89bc12f06', 70.8333, 44.2308],
] as const) {
  test(`社会の図中の正しい位置をタップして回答できる: ${hash} (${x}, ${y})`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/playground.html?q=legacy.shakai.g3.cur-1403-01.${hash}`);
    const map = page.locator('.nq-map-tap');
    await expect(map).toBeVisible();
    await map.locator('img').evaluate((img: HTMLImageElement) => img.decode());
    await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
    const box = (await map.boundingBox())!;
    await map.tap({ position: { x: (box.width * x) / 100, y: (box.height * y) / 100 } });
    await expect(page.getByRole('region', { name: 'テスト結果' }).locator('dd').first()).toHaveText('100%');
  });
}

test('社会で更新した全図版の本文がスマホ縦画面で読める', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const rows = JSON.parse(readFileSync('scripts/data/shakai-visual-review.json', 'utf8')) as {
    id: string;
    decision: string;
  }[];
  const issues: { id: string; font: number; image: number }[] = [];
  await page.setViewportSize({ width: 390, height: 844 });
  for (const { id } of rows.filter((r) => r.decision === 'illustrated')) {
    await page.goto(`/playground.html?q=${id}`);
    await expect(page.locator('.nq-q')).toBeVisible();
    await page
      .locator('.nq-q img')
      .evaluateAll((images: HTMLImageElement[]) => Promise.all(images.map((i) => i.decode())));
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    const metrics = await page.locator('.nq-q').evaluate((q) => {
      const scale = q.getBoundingClientRect().width / (q as HTMLElement).offsetWidth;
      return {
        font: parseFloat(getComputedStyle(q.querySelector('.nq-q-prompt')!).fontSize) * scale,
        image: q.querySelector('img')!.getBoundingClientRect().width,
      };
    });
    if (metrics.font < 18 || metrics.image < 280) issues.push({ id, ...metrics });
  }
  await testInfo.attach('social-studies-mobile-readability', {
    body: JSON.stringify(issues, null, 2),
    contentType: 'application/json',
  });
  expect(issues).toEqual([]);
});

test('国語で更新した全図版の本文がスマホ縦画面で読める', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const rows = ['g1-g2', 'g3-g6'].flatMap(
    (grades) =>
      JSON.parse(readFileSync(`scripts/data/kokugo-${grades}-visual-review.json`, 'utf8')) as {
        id: string;
        decision: string;
      }[],
  );
  const issues: { id: string; font: number; image: number }[] = [];
  await page.setViewportSize({ width: 390, height: 844 });
  for (const { id } of rows.filter((row) => row.decision === 'illustrated')) {
    await page.goto(`/playground.html?q=${id}`);
    await expect(page.locator('.nq-q')).toBeVisible();
    await page
      .locator('.nq-q img')
      .evaluateAll((images: HTMLImageElement[]) => Promise.all(images.map((image) => image.decode())));
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    const metrics = await page.locator('.nq-q').evaluate((q) => {
      const scale = q.getBoundingClientRect().width / (q as HTMLElement).offsetWidth;
      return {
        font: parseFloat(getComputedStyle(q.querySelector('.nq-q-prompt')!).fontSize) * scale,
        image: q.querySelector('img')!.getBoundingClientRect().width,
      };
    });
    if (metrics.font < 18 || metrics.image < 280) issues.push({ id, ...metrics });
    expect(await page.locator('.pg-stage').evaluate(inspectQuestion), id).toEqual([]);
  }
  await testInfo.attach('japanese-mobile-readability', {
    body: JSON.stringify(issues, null, 2),
    contentType: 'application/json',
  });
  expect(issues).toEqual([]);
});

for (const [id, answer] of [
  ['kokugo.g1.joshi.0001', 'へ'],
  ['source.kokugo.g6.jpn-6-1.68ef1a89a601', '司会者'],
] as const) {
  test(`国語の図付き問題を回転後にタップして回答できる: ${id}`, async ({ page }) => {
    await page.goto(`/playground.html?q=${id}`);
    await expect(page.locator('.nq-q img')).toBeVisible();
    for (const [width, height] of [
      [390, 844],
      [844, 390],
      [390, 844],
    ]) {
      await page.setViewportSize({ width: width!, height: height! });
      await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
    }
    await page.locator('.nq-choice').filter({ hasText: answer }).tap();
    await expect(page.getByRole('region', { name: 'テスト結果' }).locator('dd').first()).toHaveText('100%');
  });
}

test('復元した国語12問の要約をスマホで読んで正答できる', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const restored = (
    JSON.parse(readFileSync('scripts/data/kokugo-passage-review.json', 'utf8')) as {
      id: string;
      status: string;
    }[]
  ).filter((row) => row.status === 'restored');
  const content = readdirSync('content/questions/kokugo', { recursive: true })
    .filter((file) => String(file).endsWith('.json'))
    .flatMap((file) => JSON.parse(readFileSync(`content/questions/kokugo/${file}`, 'utf8')));
  expect(restored).toHaveLength(12);
  const representative = new Set(['1bc2578e027c', '51a081fff200']);
  const metrics = [];
  for (const { id } of restored) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/playground.html?q=${id}`);
    await expect(page.locator('.nq-q')).toBeVisible();
    await expect(page.locator('.nq-q-prompt')).toContainText('要約');
    await expect(page.locator('.nq-q-prompt')).not.toContainText(/原文|本文引用/);
    const sizes = [...representative].some((suffix) => id.endsWith(suffix))
      ? [
          [390, 844],
          [320, 568],
          [844, 390],
          [390, 844],
        ]
      : [[390, 844]];
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width: width!, height: height! });
      await expect
        .poll(() => page.locator('.pg-stage').evaluate(inspectQuestion), { message: id })
        .toEqual([]);
      const measured = await page.locator('.nq-q').evaluate((q) => {
        const scale = q.getBoundingClientRect().width / (q as HTMLElement).offsetWidth;
        return {
          font: parseFloat(getComputedStyle(q.querySelector('.nq-q-prompt')!).fontSize) * scale,
          buttons: [...q.querySelectorAll('.nq-choice')].map(
            (button) => button.getBoundingClientRect().height,
          ),
        };
      });
      expect(measured.font, id).toBeGreaterThanOrEqual(18);
      expect(measured.buttons.length, id).toBeGreaterThan(0);
      for (const height of measured.buttons) expect(height, id).toBeGreaterThanOrEqual(40);
      metrics.push({ id, width, height, ...measured });
    }
    if ([...representative].some((suffix) => id.endsWith(suffix)))
      await page.locator('.pg-preview').screenshot({ path: testInfo.outputPath(`${id}-summary-mobile.png`) });
    const question = content.find((question) => question.id === id);
    const correct = question.payload.choices.find(
      (choice: { id: string; text: string }) => choice.id === question.payload.answer,
    ).text;
    await page.locator('.nq-choice').filter({ hasText: correct }).tap();
    await expect(page.getByRole('region', { name: 'テスト結果' }).locator('dd').first()).toHaveText('100%');
  }
  await testInfo.attach('restored-passage-mobile-metrics', {
    body: JSON.stringify(metrics, null, 2),
    contentType: 'application/json',
  });
});
