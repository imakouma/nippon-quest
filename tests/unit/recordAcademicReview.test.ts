import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { recordAcademicReview } from '../../scripts/record-academic-review';

const questionFile = 'questions/sansu/g1/sample.json';
const questions = [
  {
    id: 'sansu.g1.sample.0001',
    type: 'choice',
    subject: 'sansu',
    grade: 1,
    unit: 'sansu.g1.sample',
    payload: { prompt: '1+1は？', choices: ['1', '2'], answer: 1 },
  },
];
const now = new Date('2026-10-22T00:00:00Z');

async function makeFixture(): Promise<string> {
  const rootDir = await mkdtemp(join(tmpdir(), 'academic-review-'));
  await mkdir(join(rootDir, 'content/quality'), { recursive: true });
  await mkdir(join(rootDir, 'content/questions/sansu/g1'), { recursive: true });
  await writeFile(
    join(rootDir, 'content/quality/academic-reviews.json'),
    JSON.stringify({
      version: 1,
      policy: {
        owner: '教材レビュー担当',
        reviewIntervalMonths: 12,
        changingFactsRequireCurrentSource: true,
      },
      sources: [
        {
          id: 'mext',
          title: '学習指導要領',
          authority: '文部科学省',
          url: 'https://example.test/mext',
          subjects: ['sansu'],
          checkedAt: '2026-10-01',
        },
        {
          id: 'kokugo-source',
          title: '国語資料',
          authority: '文部科学省',
          url: 'https://example.test/kokugo',
          subjects: ['kokugo'],
          checkedAt: '2026-10-01',
        },
      ],
      reviews: [],
    }),
  );
  await writeFile(
    join(rootDir, 'content/manifest.json'),
    JSON.stringify({ questions: [questionFile, 'questions/_samples/sample.json'] }),
  );
  await writeFile(join(rootDir, 'content', questionFile), JSON.stringify(questions));
  return rootDir;
}

describe('学術レビュー記録', () => {
  it('プレビューでは台帳を書き換えず、現行ファイルのハッシュを返す', async () => {
    const rootDir = await makeFixture();
    const result = await recordAcademicReview({
      rootDir,
      file: questionFile,
      reviewer: '確認者',
      reviewedAt: '2026-10-22',
      sourceIds: ['mext'],
      apply: false,
      now,
    });

    expect(result.applied).toBe(false);
    expect(result.review.sha256).toBe(createHash('sha256').update(JSON.stringify(questions)).digest('hex'));
    const ledger = JSON.parse(
      await readFile(join(rootDir, 'content/quality/academic-reviews.json'), 'utf8'),
    ) as { reviews: unknown[] };
    expect(ledger.reviews).toEqual([]);
  });

  it('--apply 相当の明示指定でだけ承認記録を追加する', async () => {
    const rootDir = await makeFixture();
    await recordAcademicReview({
      rootDir,
      file: `content/${questionFile}`,
      reviewer: '確認者',
      reviewedAt: '2026-10-22',
      sourceIds: ['mext', 'mext'],
      note: '設問と解説を確認',
      apply: true,
      now,
    });

    const ledger = JSON.parse(
      await readFile(join(rootDir, 'content/quality/academic-reviews.json'), 'utf8'),
    ) as { reviews: Array<Record<string, unknown>> };
    expect(ledger.reviews).toHaveLength(1);
    expect(ledger.reviews[0]).toMatchObject({
      file: questionFile,
      reviewer: '確認者',
      reviewedAt: '2026-10-22',
      sourceIds: ['mext'],
      note: '設問と解説を確認',
    });
  });

  it.each([
    ['未知の出典', { sourceIds: ['unknown'] }, '台帳にない出典'],
    ['不正な日付', { reviewedAt: '2026/10/22' }, 'Invalid'],
    ['未来日', { reviewedAt: '2999-10-22' }, '未来の日付'],
    ['期限切れの日付', { reviewedAt: '2000-10-22' }, '有効期限内'],
    ['対象外教科の出典', { sourceIds: ['kokugo-source'] }, '対象教科を扱っていません'],
    ['サンプル問題', { file: 'questions/_samples/sample.json' }, 'サンプル問題'],
    ['一覧外ファイル', { file: 'questions/sansu/g1/other.json' }, '問題一覧にありません'],
  ])('%sを台帳更新前に拒否する', async (_name, override, message) => {
    const rootDir = await makeFixture();
    await expect(
      recordAcademicReview({
        rootDir,
        file: questionFile,
        reviewer: '確認者',
        reviewedAt: '2026-10-22',
        sourceIds: ['mext'],
        apply: true,
        now,
        ...override,
      }),
    ).rejects.toThrow(message);
  });

  it('同じファイルの重複承認を拒否する', async () => {
    const rootDir = await makeFixture();
    const input = {
      rootDir,
      file: questionFile,
      reviewer: '確認者',
      reviewedAt: '2026-10-22',
      sourceIds: ['mext'],
      apply: true,
      now,
    };
    await recordAcademicReview(input);
    await expect(recordAcademicReview(input)).rejects.toThrow('承認済みです');
  });

  it('再レビューは明示的な置換指定で既存記録を1件だけ更新する', async () => {
    const rootDir = await makeFixture();
    await recordAcademicReview({
      rootDir,
      file: questionFile,
      reviewer: '最初の確認者',
      reviewedAt: '2026-10-01',
      sourceIds: ['mext'],
      apply: true,
      now,
    });
    await recordAcademicReview({
      rootDir,
      file: questionFile,
      reviewer: '再確認者',
      reviewedAt: '2026-10-22',
      sourceIds: ['mext'],
      replace: true,
      apply: true,
      now,
    });

    const ledger = JSON.parse(
      await readFile(join(rootDir, 'content/quality/academic-reviews.json'), 'utf8'),
    ) as { reviews: Array<{ reviewer: string }> };
    expect(ledger.reviews).toEqual([expect.objectContaining({ reviewer: '再確認者' })]);
  });
});
