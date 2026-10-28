import { describe, expect, it } from 'vitest';
import type { QuestionBase } from '../../src/questions/contracts';
import {
  applyKokugoReviewRow,
  makeKokugoReviewRow,
  parseReviewCsv,
  reviewWarnings,
  toReviewCsv,
} from '../../src/questions/review/kokugoReview';

const grades = {
  '1': '一二三四五六七八九十学校文字人',
  '2': '読書話聞語',
};

function question(): QuestionBase {
  return {
    id: 'kokugo.g1.test.0001',
    type: 'choice',
    subject: 'kokugo',
    grade: 1,
    unit: 'kokugo.g1.test',
    payload: {
      prompt: 'つぎの文[ぶん]をよみましょう。',
      choices: [
        { id: 'a', text: 'いぬ' },
        { id: 'b', text: 'ねこ' },
      ],
      answer: 'a',
      shuffle: true,
    },
    explanation: '「いぬ」がこたえです。',
  };
}

describe('国語問題確認表', () => {
  it('管理IDと警告を保ってCSVを往復できる', () => {
    const row = makeKokugoReviewRow(question(), 'content/questions/kokugo/g1/test.json', 0, grades);
    row['ゼミ生メモ'] = '、と\n改行を含む"メモ"';
    expect(parseReviewCsv(toReviewCsv([row]))).toEqual([row]);
  });

  it('学年外漢字は修正せず警告だけ返す', () => {
    const value = question();
    (value.payload as { prompt: string }).prompt = '海の文[ぶん]をよみましょう。';
    expect(reviewWarnings(value, grades).join('\n')).toContain('海');
    expect((value.payload as { prompt: string }).prompt).toContain('海');
  });

  it('「反映可」の修正案はIDと正解を変えず適用できる', () => {
    const value = question();
    const row = makeKokugoReviewRow(value, 'content/questions/kokugo/g1/test.json', 0, grades);
    row['修正後（問題文）'] = 'つぎの ぶんを よもう。';
    row['修正後（選択肢）'] = 'a: いぬ\nb: ねこさん';
    applyKokugoReviewRow(value, row);
    expect(value.id).toBe('kokugo.g1.test.0001');
    expect(value.payload).toMatchObject({
      prompt: 'つぎの ぶんを よもう。',
      answer: 'a',
      choices: [
        { id: 'a', text: 'いぬ' },
        { id: 'b', text: 'ねこさん' },
      ],
    });
  });

  it('書き出し後に正解を含む元データが変わったら適用を拒否する', () => {
    const value = question();
    const row = makeKokugoReviewRow(value, 'content/questions/kokugo/g1/test.json', 0, grades);
    row['修正後（問題文）'] = 'つぎの ぶんを よもう。';
    (value.payload as { answer: string }).answer = 'b';

    expect(() => applyKokugoReviewRow(value, row)).toThrow(/元データが変わっています/);
  });
});
