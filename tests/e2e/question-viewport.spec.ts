import { expect, test } from '@playwright/test';
import { inspectQuestion } from '../../src/tools/questionLayoutAudit';

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
  test(`問題全体の比例縮小: ${id}`, async ({ page }) => {
    await page.goto(`/battle-question-audit.html?q=${id}`);
    await expect(page.locator('[data-audit-status]')).toHaveAttribute('data-audit-status', 'complete', {
      timeout: 20_000,
    });
    for (const [width, height] of [
      [960, 540],
      [720, 405],
      [390, 219],
      [844, 390],
    ]) {
      await page.locator('.nq-audit-stage').evaluate(
        (stage, size) => {
          stage.style.width = `${size[0]}px`;
          stage.style.height = `${size[1]}px`;
        },
        [width, height],
      );
      // Wait for the production ResizeObserver, without calling the fitting helper from the test.
      await expect
        .poll(() =>
          page.locator('.nq-question-viewport').evaluate((viewport) => {
            const canvas = viewport.querySelector<HTMLElement>('.nq-question-canvas')!;
            const expected = Math.min(
              viewport.clientWidth / 960,
              viewport.clientHeight / Math.max(540, canvas.scrollHeight),
            );
            return Math.abs(Number(viewport.dataset.scale) - expected) < 0.00001;
          }),
        )
        .toBe(true);
      expect(await page.locator('.nq-audit-stage').evaluate(inspectQuestion), `${width}x${height}`).toEqual(
        [],
      );
    }
  });
}

test('Playground の時計・文字・ボタンは画面リサイズ後も同じ倍率になる', async ({ page }) => {
  await page.goto('/playground.html?q=sansu.g1.tokei.0002');
  await expect(page.locator('.nq-q-prompt-img')).toBeVisible();
  for (const size of [
    { width: 960, height: 540 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
    const ratios = await page.locator('.nq-question-viewport').evaluate((viewport) => {
      return ['.nq-q-prompt-img', '.nq-q-prompt p', '.nq-choice'].map((selector) => {
        const element = viewport.querySelector<HTMLElement>(selector)!;
        return element.getBoundingClientRect().width / element.offsetWidth;
      });
    });
    expect(ratios[0]).toBeCloseTo(ratios[1]!, 2);
    expect(ratios[0]).toBeCloseTo(ratios[2]!, 2);
  }
});

test('縮小後も地図のクリック位置を正しく採点する', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/playground.html?q=legacy.shakai.g3.cur-1403-01.6d0e031ce36a');
  const map = page.locator('.nq-map-tap');
  await expect(map).toBeVisible();
  await map.scrollIntoViewIfNeeded();
  const box = (await map.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.45, box.y + box.height * 0.7);
  await expect(page.getByRole('region', { name: 'テスト結果' }).locator('dd').first()).toHaveText('100%');
});

test('縮小後も漢字をなぞる座標が描画位置と一致する', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/playground.html?q=sample.kanji-trace.0001');
  const canvas = page.locator('.nq-kt-canvas');
  await expect(canvas).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator('.nq-kt-submit')).toBeEnabled();
  expect(
    await canvas.evaluate((element: HTMLCanvasElement) => {
      const context = element.getContext('2d')!;
      const [r, g, b, a] = context.getImageData(element.width * 0.3, element.height * 0.5, 1, 1).data;
      return b! > r! && b! > g! && a! > 200;
    }),
  ).toBe(true);
});

test('レイアウト監査は非表示の問題と内部の文字切れを失敗にする', async ({ page }) => {
  await page.goto('/battle-question-audit.html?q=sansu.g1.tokei.0002');
  await expect(page.locator('[data-audit-status]')).toHaveAttribute('data-audit-status', 'complete');
  await expect(page.locator('.nq-timer-row')).toBeVisible();
  await page.locator('.nq-question-viewport').evaluate((viewport) => (viewport.style.height = '0px'));
  expect(await page.locator('.nq-audit-stage').evaluate(inspectQuestion)).toContain(
    '問題枠の表示サイズが0です',
  );
  await page.locator('.nq-question-viewport').evaluate((viewport) => (viewport.style.height = ''));
  await expect.poll(() => page.locator('.nq-audit-stage').evaluate(inspectQuestion)).toEqual([]);
  await page
    .locator('.nq-choice-content')
    .first()
    .evaluate((text) => {
      text.style.width = '10px';
      text.style.height = '5px';
      text.style.overflow = 'hidden';
    });
  expect(await page.locator('.nq-audit-stage').evaluate(inspectQuestion)).toContain(
    'nq-choice-content の内容が縦に隠れています',
  );
});

for (const [type, id, selector] of [
  ['choice', 'sample.choice.0001', '.nq-choice'],
  ['picture-word', 'sample.picture-word.0001', '.nq-pw-card'],
  ['kanji-trace', 'sample.kanji-trace.0003', '.nq-choice'],
  ['experiment', 'sample.experiment.water.0001', '.nq-exp-choices button'],
]) {
  test(`8個の選択肢が収まり8番目を選べる: ${type}`, async ({ page }) => {
    await page.route(`**/content/questions/_samples/${type}.json`, async (route) => {
      const response = await route.fetch();
      const questions = await response.json();
      const question = questions.find((q: { id: string }) => q.id === id);
      question.timeLimitSec = 300;
      const options = Array.from({ length: 8 }, (_, i) => ({ id: `c${i}`, text: `こたえ${i + 1}` }));
      const payload = question.payload;
      if (type === 'kanji-trace') {
        payload.choices = options.map((c) => c.text);
        payload.answer = 'こたえ8';
      } else if (type === 'experiment') {
        payload.predict.choices = options;
        payload.predict.answer = 'c7';
      } else {
        payload[type === 'picture-word' ? 'words' : 'choices'] = options;
        payload.answer = 'c7';
        payload.shuffle = false;
      }
      await route.fulfill({ json: questions });
    });
    await page.goto(`/playground.html?q=${id}`);
    const choices = page.locator(`.pg-stage ${selector}`);
    await expect(choices).toHaveCount(8);
    for (const [width, height] of [
      [320, 700],
      [768, 1024],
      [1024, 768],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width: width!, height: height! });
      await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
    }
    if (type === 'experiment') {
      await choices.last().click();
      await expect(choices.last()).toHaveAttribute('aria-pressed', 'true');
    } else if (type === 'kanji-trace') {
      // Reading choices are shuffled; activate the displayed correct answer by its number.
      const correct = choices.filter({ hasText: 'こたえ8' });
      const key = await correct.getAttribute('aria-keyshortcuts');
      await page.keyboard.press(key!);
      await expect(correct).toHaveClass(/nq-choice-correct/);
    } else {
      await page.keyboard.press('8');
      await expect(choices.last()).toHaveClass(/(?:nq-choice|nq-pw-card)-correct/);
    }
  });
}
