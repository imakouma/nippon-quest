import { expect, test } from '@playwright/test';
import { inspectQuestion } from '../../src/tools/questionLayoutAudit';

const examples = [
  ['katachi.0004', 'あ と い', 'いろや おおきさが ちがっても'],
  ['katachi.0005', 'まる', 'まわりを なぞると'],
  ['katachi.0006', 'しかく', 'そとを みましょう'],
  ['katachi.0007', '3ぼん', 'ひとつに 1ぽんずつ'],
  ['katachi.0008', 'さんかく', 'どちらも さんかく'],
  ['katachi.0009', 'しかく', 'うしろは みぎ'],
  ['kurabekata.0004', 'あ', 'ひだりの はしが そろっています'],
  ['kurabekata.0005', 'いの つくえ', 'もってきて くらべられます'],
  ['kurabekata.0006', 'おなじ ながさの つみきで はかる', 'かずだけでは'],
  ['kurabekata.0007', 'あ', 'いっぱいにしても のこります'],
  ['kurabekata.0008', 'あ', 'ぜんぶ おさまります'],
  ['kurabekata.0009', 'あ', '6マスぶん'],
  ['data.0004', '2まい', 'さんかくだけを'],
  ['data.0005', 'い', 'しるしが 4こ'],
  ['data.0006', 'まる と さんかく', 'あまりが ない'],
  ['data.0007', '0まい', '1まいも ない'],
  ['data.0008', '1まい', 'まるが 1まい あまります'],
  ['data.0009', 'しかく', 'ならびの ながさでは'],
] as const;

for (const width of [390, 1280]) {
  for (const [id, answer, reason] of examples) {
    test(`${width}px 図・正答・理由を確認 ${id}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/playground.html?q=sansu.g1.${id}`);
      await expect(page.locator('.nq-choice')).toHaveCount(3);
      await expect
        .poll(() =>
          page
            .locator('.pg-stage img')
            .evaluateAll(
              (images) =>
                images.length > 0 &&
                images.every(
                  (image) =>
                    (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
                ),
            ),
        )
        .toBe(true);
      await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
      if (width === 1280)
        await page.locator('.pg-stage').screenshot({ path: `.cache/sansu-domains/${id}.png` });
      await page
        .locator('.nq-choice')
        .filter({ has: page.getByText(answer, { exact: true }) })
        .click();
      await expect(page.locator('.nq-feedback-correct')).toBeVisible();
      await page.getByRole('button', { name: 'かいせつ', exact: true }).click();
      await expect(page.locator('.nq-review p')).toContainText(reason);
      await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}
