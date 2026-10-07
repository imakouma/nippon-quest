import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  collectTohokuAcademicPopulation,
  validateTohokuAcademicLedger,
} from '../../scripts/audit-tohoku-academic';

const root = resolve('.');

describe('東北公開対象教材の監査', () => {
  it('県タグから18問・5ファイルの母集団を再現する', async () => {
    const audit = await collectTohokuAcademicPopulation(root);
    expect(audit.questions).toHaveLength(18);
    expect(audit.files.size).toBe(5);
    expect(new Set(audit.questions.flatMap((question) => question.prefectureTags))).toEqual(
      new Set([
        'prefecture:aomori',
        'prefecture:iwate',
        'prefecture:miyagi',
        'prefecture:akita',
        'prefecture:yamagata',
        'prefecture:fukushima',
      ]),
    );
  });

  it('全問題とファイルハッシュが台帳にあり、未承認のままになっている', async () => {
    await expect(validateTohokuAcademicLedger(root)).resolves.toEqual([]);
  });
});
