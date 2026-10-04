import { describe, expect, it } from 'vitest';
import { detectLegacyReviewFlags, normalizeLegacyDatabases } from '../../scripts/import-legacy-questions';
import { promoteReviewedQuestions } from '../../scripts/promote-legacy-questions';

describe('旧 autonomy-game 問題の安全な取り込み', () => {
  it('構造が正しい選択問題だけを現在版の choice 契約へ変換する', () => {
    const result = normalizeLegacyDatabases([
      {
        subject: 'sansu',
        database: {
          math_2_3: [
            {
              question: '3 × 4 は？',
              choices: ['7', '12', '14'],
              correctIndex: 1,
              explanation: '3を4回たすと12。',
            },
          ],
        },
      },
    ]);
    expect(result.rejected).toEqual([]);
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0]).toMatchObject({
      type: 'choice',
      subject: 'sansu',
      grade: 2,
      unit: 'sansu.g2.legacy-math-2-3',
      legacy: { source: 'autonomy-game', nodeId: 'math_2_3', reviewStatus: 'unreviewed' },
    });
    expect(result.accepted[0]!.payload).toMatchObject({ answer: 'c2', shuffle: true });
  });

  it('図や旧画像に依存する問題へレビュー用フラグを付ける', () => {
    expect(detectLegacyReviewFlags({ question: '下の図を見て答えよう' })).toContain(
      'external-visual-context',
    );
    expect(detectLegacyReviewFlags({ question: '文章だけの問題', imageUrl: '/old.png' })).toContain(
      'legacy-image-reference',
    );
  });

  it('単一入力と複数入力を専用形式へ変換する', () => {
    const result = normalizeLegacyDatabases([
      {
        subject: 'sansu',
        database: {
          math_5_1: [
            {
              question: '1000倍は？',
              choices: [],
              correctIndex: -1,
              answerMode: 'input',
              inputAnswer: '42195',
            },
            {
              question: '位を入れよう',
              choices: [],
              correctIndex: -1,
              answerMode: 'multi_input',
              inputAnswers: ['4', '2'],
              inputTemplate: '{{INPUT}}万{{INPUT}}千',
            },
          ],
        },
      },
    ]);
    expect(result.rejected).toEqual([]);
    expect(result.accepted.map((q) => q.type)).toEqual(['text-input', 'text-input']);
  });

  it('欠落した旧図の情報は既知の解説値だけで問題文へ復元する', () => {
    const result = normalizeLegacyDatabases([
      {
        subject: 'sansu',
        database: {
          math_6_3: [
            ...Array.from({ length: 16 }, () => ({ question: '仮', choices: ['1', '2'], correctIndex: 0 })),
            {
              question: '次の図形の面積を求めよう。',
              choices: [],
              correctIndex: -1,
              answerMode: 'input',
              inputAnswer: '4,21',
            },
          ],
        },
      },
    ]);
    const repaired = result.accepted.find((q) => q.legacy.sourceIndex === 16)!;
    expect((repaired.payload as { prompt: string }).prompt).toContain('6/7 cm');
    expect(repaired.legacy.reviewFlags).toEqual([]);
  });

  it('指紋・正解・出典確認が一致した問題だけ昇格する', () => {
    const staged = normalizeLegacyDatabases([
      {
        subject: 'sansu',
        database: { math_2_5: [{ question: '1時間は？', choices: ['60分', '30分'], correctIndex: 0 }] },
      },
    ]).accepted;
    const manifest = {
      source: 'autonomy-game' as const,
      reviewedAt: '2026-09-30',
      reviewer: 'content-review',
      provenanceConfirmed: true,
      unit: 'sansu.g2.jikan',
      output: 'content/questions/sansu/g2/jikan.json',
      entries: [
        {
          fingerprint: staged[0]!.legacy.fingerprint,
          id: 'sansu.g2.jikan.legacy-0001',
          expectedAnswer: '60分',
        },
      ],
    };
    expect(promoteReviewedQuestions(staged, manifest)[0]).not.toHaveProperty('legacy');
    expect(() =>
      promoteReviewedQuestions(staged, {
        ...manifest,
        entries: [{ ...manifest.entries[0]!, expectedAnswer: '30分' }],
      }),
    ).toThrow('正解がレビュー記録と不一致');
  });

  it('視覚情報に依存する問題は承認リストにあっても昇格させない', () => {
    const staged = normalizeLegacyDatabases([
      {
        subject: 'sansu',
        database: { math_1_1: [{ question: '下の図を見よう', choices: ['1', '2'], correctIndex: 0 }] },
      },
    ]).accepted;
    expect(() =>
      promoteReviewedQuestions(staged, {
        source: 'autonomy-game',
        reviewedAt: '2026-09-30',
        reviewer: 'content-review',
        provenanceConfirmed: true,
        unit: 'sansu.g1.kazu-100',
        output: 'content/questions/sansu/g1/x.json',
        entries: [{ fingerprint: staged[0]!.legacy.fingerprint, id: 'sansu.g1.x.1', expectedAnswer: '1' }],
      }),
    ).toThrow('要視覚レビュー');
  });

  it('正解範囲外・不正な入力・内容重複を除外し、重複肢は安全に畳む', () => {
    const valid = { question: '水は何度でこおる？', choices: ['0度', '10度'], correctIndex: 0 };
    const result = normalizeLegacyDatabases([
      {
        subject: 'rika',
        database: {
          science_4_1: [
            valid,
            valid,
            { question: '範囲外', choices: ['A', 'B'], correctIndex: 2 },
            { question: '重複肢', choices: ['同じ', ' 同じ '], correctIndex: 0 },
            { question: '入力式', choices: ['1', '2'], correctIndex: 0, answerMode: 'input' },
          ],
        },
      },
    ]);
    expect(result.accepted).toHaveLength(1);
    expect(result.duplicateCount).toBe(1);
    expect(result.rejected.map((row) => row.reason)).toEqual(
      expect.arrayContaining([
        '内容が同一の問題がすでにある',
        'correctIndex が選択肢の範囲外',
        '現在版の問題スキーマに適合しない',
        '入力式の正解が空または不正',
      ]),
    );
  });

  it('旧版の教科別ノードIDから学年を安全に復元する', () => {
    const row = { question: '問題', choices: ['正解', '不正解'], correctIndex: 0 };
    const result = normalizeLegacyDatabases([
      { subject: 'rika', database: { sci_5_2: [row], 'cur-1503-01': [row] } },
      { subject: 'shakai', database: { soc_6_1: [row], 'cur-1404-02': [row] } },
      { subject: 'seikatsu', database: { 'cur-1802-01': [row] } },
    ]);
    expect(result.rejected).toEqual([]);
    expect(result.accepted.map((question) => [question.subject, question.grade])).toEqual([
      ['rika', 3],
      ['rika', 5],
      ['seikatsu', 2],
      ['shakai', 4],
      ['shakai', 6],
    ]);
  });
});
