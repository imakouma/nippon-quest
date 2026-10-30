import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { migrateQuestionLayout } from '../../scripts/migrate-question-layout';
import type { QuestionBase } from '../../src/questions/contracts';

function question(id: string, unit: string, override: Partial<QuestionBase> = {}): QuestionBase {
  const [subject, grade] = unit.split('.');
  return {
    id,
    type: 'choice',
    subject: subject as QuestionBase['subject'],
    grade: Number(grade!.slice(1)) as QuestionBase['grade'],
    unit,
    payload: { prompt: `${id}の問題`, choices: ['A', 'B'], answer: 0 },
    ...override,
  };
}

async function exists(path: string): Promise<boolean> {
  return stat(path)
    .then(() => true)
    .catch(() => false);
}

async function makeFixture(options: { withReview?: boolean } = {}): Promise<string> {
  const rootDir = await mkdtemp(join(tmpdir(), 'question-layout-'));
  const contentDir = join(rootDir, 'content');
  await mkdir(join(contentDir, 'questions/legacy'), { recursive: true });
  await mkdir(join(contentDir, 'questions/_samples'), { recursive: true });
  await mkdir(join(contentDir, 'quality'), { recursive: true });
  await mkdir(join(rootDir, 'imports'), { recursive: true });

  const firstFile = [
    question('sansu.g1.tashizan.0001', 'sansu.g1.tashizan'),
    question('kokugo.g2.kanji.0001', 'kokugo.g2.kanji'),
  ];
  const secondFile = Array.from({ length: 30 }, (_, index) =>
    question(`sansu.g1.tashizan.${String(index + 2).padStart(4, '0')}`, 'sansu.g1.tashizan'),
  );
  await writeFile(join(contentDir, 'questions/legacy/first.json'), JSON.stringify(firstFile, null, 2));
  await writeFile(join(contentDir, 'questions/legacy/second.json'), JSON.stringify(secondFile, null, 2));
  await writeFile(
    join(contentDir, 'questions/_samples/choice.json'),
    JSON.stringify([question('sansu.g1.sample.0001', 'sansu.g1.sample')], null, 2),
  );
  await writeFile(
    join(contentDir, 'quality/academic-reviews.json'),
    JSON.stringify({
      version: 1,
      policy: {
        owner: '教材レビュー担当',
        reviewIntervalMonths: 12,
        changingFactsRequireCurrentSource: true,
      },
      sources: [],
      reviews: options.withReview
        ? [
            {
              file: 'questions/legacy/first.json',
              status: 'approved',
              sha256: 'a'.repeat(64),
              reviewer: '確認者',
              reviewedAt: '2026-10-01',
              sourceIds: ['source'],
            },
          ]
        : [],
    }),
  );
  return rootDir;
}

describe('question layout migration', () => {
  it('dry-runではファイルを書き換えず移行予定を返す', async () => {
    const rootDir = await makeFixture();
    const oldFile = join(rootDir, 'content/questions/legacy/first.json');
    const before = await readFile(oldFile, 'utf8');

    const result = await migrateQuestionLayout({ rootDir, write: false });

    expect(result).toMatchObject({
      applied: false,
      questions: 32,
      units: 2,
      beforeFiles: 2,
      afterFiles: 3,
      parity: { ok: true },
    });
    expect(result.createdFiles).toEqual([
      'questions/kokugo/g2/kanji/set-001.json',
      'questions/sansu/g1/tashizan/set-001.json',
      'questions/sansu/g1/tashizan/set-002.json',
    ]);
    expect(result.removedFiles).toEqual(['questions/legacy/first.json', 'questions/legacy/second.json']);
    expect(await readFile(oldFile, 'utf8')).toBe(before);
    expect(await exists(join(rootDir, 'imports/question-layout-migration.json'))).toBe(false);
  });

  it('明示writeでだけ検証済みセットへ置換し、サンプルを保持する', async () => {
    const rootDir = await makeFixture();

    const result = await migrateQuestionLayout({ rootDir, write: true });

    expect(result.applied).toBe(true);
    expect(await exists(join(rootDir, 'content/questions/legacy/first.json'))).toBe(false);
    expect(await exists(join(rootDir, 'content/questions/sansu/g1/tashizan/set-001.json'))).toBe(true);
    expect(await exists(join(rootDir, 'content/questions/sansu/g1/tashizan/set-002.json'))).toBe(true);
    expect(await exists(join(rootDir, 'content/questions/kokugo/g2/kanji/set-001.json'))).toBe(true);
    expect(await exists(join(rootDir, 'content/questions/_samples/choice.json'))).toBe(true);
    const report = JSON.parse(
      await readFile(join(rootDir, 'imports/question-layout-migration.json'), 'utf8'),
    ) as { questions: number; parity: { ok: boolean } };
    expect(report).toMatchObject({ questions: 32, parity: { ok: true } });
  });

  it('正規化済み状態への再実行では追加差分を作らない', async () => {
    const rootDir = await makeFixture();
    await migrateQuestionLayout({ rootDir, write: true });

    const rerun = await migrateQuestionLayout({ rootDir, write: true });

    expect(rerun.applied).toBe(false);
    expect(rerun.createdFiles).toEqual([]);
    expect(rerun.removedFiles).toEqual([]);
    expect(rerun.parity.ok).toBe(true);
  });

  it('レビュー記録があればwrite前に停止し、元ファイルを保持する', async () => {
    const rootDir = await makeFixture({ withReview: true });

    await expect(migrateQuestionLayout({ rootDir, write: true })).rejects.toThrow(
      '学術レビュー記録が1件あるため移行できません',
    );

    expect(await exists(join(rootDir, 'content/questions/legacy/first.json'))).toBe(true);
    expect(await exists(join(rootDir, 'content/questions/sansu/g1/tashizan/set-001.json'))).toBe(false);
  });
});
