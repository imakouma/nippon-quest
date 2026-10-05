import { describe, expect, it } from 'vitest';
import { QuestionBank } from '../../src/questions/engine/bank';
import { MasteryStore } from '../../src/questions/engine/mastery';
import { filterCandidates, pickQuestion } from '../../src/questions/engine/pick';
import { allRenderers, getRenderer, requireRenderer } from '../../src/questions/renderers/registry';
import { scoreBand } from '../../src/questions/contracts';
import { createRng } from '../../src/core/rng';
import type { QuestionBase, QuestionQuery } from '../../src/questions/contracts';
import { MAX_MISSES, pictureWordScore } from '../../src/questions/renderers/picture-word/schema';
import { PICTURES, PICTURE_KEYS, pictureSvg } from '../../src/questions/renderers/shared/pictures';
import { NQ48 } from '../../src/rendering/palette';
import { speechLang } from '../../src/ui/overlay';
import { read } from './helpers';

function q(id: string, over: Partial<QuestionBase> = {}): QuestionBase {
  return {
    id,
    type: 'choice',
    subject: 'sansu',
    grade: 1,
    unit: 'sansu.g1.tashizan',
    payload: {
      prompt: 'p',
      choices: [
        { id: 'a', text: '1' },
        { id: 'b', text: '2' },
      ],
      answer: 'a',
      shuffle: true,
    },
    ...over,
  } as QuestionBase;
}

function bankOf(items: QuestionBase[]): QuestionBank {
  const b = new QuestionBank();
  for (const x of items) b.add(x);
  return b;
}

const rng = () => createRng('pick-seed');
const baseQuery: QuestionQuery = { subject: 'sansu', gradeRange: [1, 2] };

describe('registry', () => {
  it('choice が登録されている', () => {
    expect(getRenderer('choice')?.type).toBe('choice');
    expect(allRenderers().length).toBeGreaterThan(0);
  });
  it('未登録タイプは明示的なエラー', () => {
    expect(() => requireRenderer('nope')).toThrow(/未登録/);
  });
  it('全レンダラーが schema を持つ', () => {
    for (const r of allRenderers()) expect(r.schema).toBeDefined();
  });
});

describe('QuestionBank', () => {
  it('実際の content/questions を読み込める', async () => {
    const manifest = (await read('manifest.json')) as { questions: string[] };
    const { bank, report } = await QuestionBank.load(manifest.questions, read);
    expect(bank.size).toBeGreaterThan(0);
    expect(report.skipped).toEqual([]);
  });

  it('_samples は既定で除外される', async () => {
    const manifest = (await read('manifest.json')) as { questions: string[] };
    const a = await QuestionBank.load(manifest.questions, read);
    const b = await QuestionBank.load(manifest.questions, read, { includeSamples: true });
    expect(b.bank.size).toBeGreaterThan(a.bank.size);
  });

  it('payload がスキーマに合わない問題は skip され、他は読み込まれる', async () => {
    const files = ['bad.json'];
    const fake = async () => [q('ok.0001'), { ...q('bad.0002'), payload: { prompt: 'x' } }];
    const { bank, report } = await QuestionBank.load(files, fake);
    expect(bank.size).toBe(1);
    expect(report.skipped).toHaveLength(1);
  });

  it('1ファイルの取得失敗は記録して、取得できた問題で続行する', async () => {
    const { bank, report } = await QuestionBank.load(['ok.json', 'offline.json'], async (file) => {
      if (file === 'offline.json') throw new Error('HTTP 503');
      return [q('ok.0001')];
    });
    expect(bank.size).toBe(1);
    expect(report.skipped).toEqual([{ file: 'offline.json', index: -1, reason: '読み込み失敗: HTTP 503' }]);
  });

  it('全ファイルを取得できない場合は空の問題バンクで開始しない', async () => {
    await expect(
      QuestionBank.load(['offline.json'], async () => {
        throw new Error('offline');
      }),
    ).rejects.toThrow('問題を1問も読み込めませんでした');
  });

  it('id 重複は例外', () => {
    const b = bankOf([q('dup.0001')]);
    expect(() => b.add(q('dup.0001'))).toThrow(/重複/);
  });
});

describe('MasteryStore', () => {
  it('正答で上がり、誤答で下がる', () => {
    const m = new MasteryStore();
    m.record('u', { score: 1 });
    const after1 = m.get('u');
    m.record('u', { score: 1 });
    expect(m.get('u')).toBeGreaterThanOrEqual(after1);
    m.record('u', { score: 0 });
    expect(m.get('u')).toBeLessThan(1);
  });
  it('0〜1 の範囲に収まる', () => {
    const m = new MasteryStore();
    for (let i = 0; i < 100; i++) m.record('u', { score: i % 2 });
    expect(m.get('u')).toBeGreaterThanOrEqual(0);
    expect(m.get('u')).toBeLessThanOrEqual(1);
  });
  it('weakUnits は弱い順', () => {
    const m = new MasteryStore();
    for (let i = 0; i < 10; i++) m.record('strong', { score: 1 });
    m.record('weak', { score: 0 });
    expect(m.weakUnits(['strong', 'weak'])).toEqual(['weak']);
  });
});

describe('pick（出題選択・GDD §5.4）', () => {
  it('学年帯の外は出ない', () => {
    const bank = bankOf([q('a.0001', { grade: 1 }), q('a.0002', { grade: 5, unit: 'sansu.g5.wariai' })]);
    const got = filterCandidates(bank, baseQuery);
    expect(got.map((x) => x.id)).toEqual(['a.0001']);
  });

  it('教科が違うものは出ない', () => {
    const bank = bankOf([q('a.0001'), q('b.0001', { subject: 'kokugo', unit: 'kokugo.g1.kanji' })]);
    expect(filterCandidates(bank, baseQuery).map((x) => x.id)).toEqual(['a.0001']);
  });

  it('excludeIds（直近出題）は除外される', () => {
    const bank = bankOf([q('a.0001'), q('a.0002')]);
    const got = filterCandidates(bank, { ...baseQuery, excludeIds: ['a.0001'] });
    expect(got.map((x) => x.id)).toEqual(['a.0002']);
  });

  it('タグ一致が優先される', () => {
    const bank = bankOf([q('a.0001'), q('a.0002', { tags: ['prefecture:aomori'] })]);
    const got = filterCandidates(bank, { ...baseQuery, tags: ['prefecture:aomori'] });
    expect(got.map((x) => x.id)).toEqual(['a.0002']);
  });

  it('タグに一致が無ければタグを無視して出題ゼロを避ける', () => {
    const bank = bankOf([q('a.0001')]);
    const got = filterCandidates(bank, { ...baseQuery, tags: ['prefecture:okinawa'] });
    expect(got).toHaveLength(1);
  });

  it('type 指定で絞れる', () => {
    const bank = bankOf([
      q('a.0001', { type: 'choice' }),
      q('a.0002', { type: 'number-build', payload: {} }),
    ]);
    expect(filterCandidates(bank, { ...baseQuery, type: 'number-build' }).map((x) => x.id)).toEqual([
      'a.0002',
    ]);
  });

  it('候補が全部除外されたら除外を外して必ず1問返す', () => {
    const bank = bankOf([q('a.0001')]);
    const got = pickQuestion(bank, { ...baseQuery, excludeIds: ['a.0001'] }, new MasteryStore(), rng());
    expect(got?.id).toBe('a.0001');
  });

  it('候補が無ければ null', () => {
    const got = pickQuestion(bankOf([]), baseQuery, new MasteryStore(), rng());
    expect(got).toBeNull();
  });

  it('同じシードなら同じ問題を選ぶ（決定論）', () => {
    const items = Array.from({ length: 20 }, (_, i) => q(`a.${String(i).padStart(4, '0')}`));
    const a = pickQuestion(bankOf(items), baseQuery, new MasteryStore(), createRng('same'));
    const b = pickQuestion(bankOf(items), baseQuery, new MasteryStore(), createRng('same'));
    expect(a?.id).toBe(b?.id);
  });

  it('弱い単元がだいたい 7割で選ばれる', () => {
    const items = [
      ...Array.from({ length: 10 }, (_, i) => q(`w.${i}`, { unit: 'sansu.g1.tashizan' })),
      ...Array.from({ length: 10 }, (_, i) => q(`s.${i}`, { unit: 'sansu.g1.hikizan', grade: 1 })),
    ];
    const bank = bankOf(items);
    const mastery = new MasteryStore();
    for (let i = 0; i < 20; i++) mastery.record('sansu.g1.hikizan', { score: 1 }); // こちらは習熟済み
    mastery.record('sansu.g1.tashizan', { score: 0 });
    const r = createRng('ratio');
    let weak = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) {
      const picked = pickQuestion(bank, baseQuery, mastery, r, { weakUnitRatio: 0.7 });
      if (picked?.unit === 'sansu.g1.tashizan') weak++;
    }
    expect(weak / N).toBeGreaterThan(0.6);
    expect(weak / N).toBeLessThan(0.8);
  });
});

describe('scoreBand', () => {
  it('GDD §4.3 の区切り', () => {
    expect(scoreBand(1)).toBe('perfect');
    expect(scoreBand(0.99)).toBe('good');
    expect(scoreBand(0.5)).toBe('good');
    expect(scoreBand(0.49)).toBe('weak');
    expect(scoreBand(0.01)).toBe('weak');
    expect(scoreBand(0)).toBe('miss');
  });
});

describe('choice レンダラーの schema', () => {
  const schema = requireRenderer('choice').schema;
  it('正しい payload を通す', () => {
    expect(
      schema.safeParse({
        prompt: 'p',
        choices: [
          { id: 'a', text: '1' },
          { id: 'b', text: '2' },
        ],
        answer: 'a',
      }).success,
    ).toBe(true);
  });
  it('選択肢1つは拒否', () => {
    expect(schema.safeParse({ prompt: 'p', choices: [{ id: 'a', text: '1' }], answer: 'a' }).success).toBe(
      false,
    );
  });
  it('選択肢6つまで許可し、7つは拒否', () => {
    const choices = Array.from({ length: 7 }, (_, i) => ({ id: String(i), text: String(i) }));
    expect(schema.safeParse({ prompt: 'p', choices: choices.slice(0, 6), answer: '0' }).success).toBe(true);
    expect(schema.safeParse({ prompt: 'p', choices, answer: '0' }).success).toBe(false);
  });
  it('text も image も無い選択肢は拒否', () => {
    expect(
      schema.safeParse({ prompt: 'p', choices: [{ id: 'a' }, { id: 'b', text: '2' }], answer: 'a' }).success,
    ).toBe(false);
  });
  it('存在しない正解IDは拒否', () => {
    expect(
      schema.safeParse({
        prompt: 'p',
        choices: [
          { id: 'a', text: '1' },
          { id: 'b', text: '2' },
        ],
        answer: 'missing',
      }).success,
    ).toBe(false);
  });
  it('重複した選択肢IDは拒否', () => {
    expect(
      schema.safeParse({
        prompt: 'p',
        choices: [
          { id: 'a', text: '1' },
          { id: 'a', text: '2' },
        ],
        answer: 'a',
      }).success,
    ).toBe(false);
  });
});

describe('picture-word レンダラー', () => {
  const schema = requireRenderer('picture-word').schema;
  const words = [
    { id: 'apple', text: 'apple' },
    { id: 'peach', text: 'peach' },
  ];
  it('正しい payload を通す（mode と shuffle は 省略できる）', () => {
    const p = schema.safeParse({ picture: 'apple', words, answer: 'apple' });
    expect(p.success && p.data).toMatchObject({ mode: 'image-to-word', shuffle: true });
  });
  it('本番の絵（image）だけでもよい', () => {
    expect(schema.safeParse({ image: 'questions/eigo/apple.png', words, answer: 'apple' }).success).toBe(
      true,
    );
  });
  it('絵が無い・answer が words に無い・知らない絵・カード 5 まい は拒否', () => {
    expect(schema.safeParse({ words, answer: 'apple' }).success).toBe(false);
    expect(schema.safeParse({ picture: 'apple', words, answer: 'banana' }).success).toBe(false);
    expect(schema.safeParse({ picture: 'unicorn', words, answer: 'apple' }).success).toBe(false);
    const five = ['a', 'b', 'c', 'd', 'e'].map((t) => ({ id: t, text: t }));
    expect(schema.safeParse({ picture: 'apple', words: five, answer: 'a' }).success).toBe(false);
  });
  it('点数は 1 回目で正解 1.0、2 回目 0.5、それより あとは 0（2 回まちがえたら おわり）', () => {
    expect([0, 1, 2].map(pictureWordScore)).toEqual([1, 0.5, 0]);
    expect(MAX_MISSES).toBe(2);
  });
});

describe('問題用の絵（renderers/shared/pictures）', () => {
  it('どの絵も 16×16 で、使っている文字には 色がある', () => {
    for (const key of PICTURE_KEYS) {
      const { rows, colors } = PICTURES[key];
      expect(rows, key).toHaveLength(16);
      for (const row of rows) {
        expect(row, key).toHaveLength(16);
        for (const ch of row) if (ch !== '.') expect(colors[ch], `${key} の '${ch}'`).toBeDefined();
      }
    }
  });
  it('色は NQ-48 パレットの中だけ', () => {
    const palette = new Set(NQ48);
    for (const key of PICTURE_KEYS)
      for (const c of Object.values(PICTURES[key].colors)) expect(palette.has(c), `${key}: ${c}`).toBe(true);
  });
  it('SVG になる', () => {
    const svg = pictureSvg('apple');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.match(/<rect /g)!.length).toBeGreaterThan(20);
  });
});

describe('英語の問題（content/questions/eigo）', () => {
  const load = async () => {
    const manifest = (await read('manifest.json')) as { questions: string[] };
    const files = manifest.questions.filter((f) => f.startsWith('questions/eigo/'));
    return (await Promise.all(files.map((f) => read(f)))).flat() as QuestionBase[];
  };
  it('アルファベットは 26 もじ ぜんぶ（じゅんばんは 24 もん）', async () => {
    const qs = await load();
    const count = (unit: string) => qs.filter((q) => q.unit === unit).length;
    expect(count('eigo.g1.alphabet')).toBe(26);
    expect(count('eigo.g2.alphabet-order')).toBe(24);
    expect(count('eigo.g3.alphabet-small')).toBe(26);
  });
  it('picture-word の正解は 絵と同じ単語で、カードは 英語だけ（日本語訳を書かない）', async () => {
    const pw = (await load()).filter((q) => q.type === 'picture-word');
    expect(pw.length).toBeGreaterThanOrEqual(20);
    for (const q of pw) {
      const p = q.payload as { picture?: string; answer: string; words: { id: string; text: string }[] };
      expect(p.words.find((w) => w.id === p.answer)?.text, q.id).toBe(p.picture);
      for (const w of p.words) expect(w.text, q.id).toMatch(/^[A-Za-z' -]+$/);
    }
  });
});

describe('読み上げの声', () => {
  it('英語だけの文は 英語の声、ひらがな・漢字が あれば 日本語の声', () => {
    expect(speechLang('apple')).toBe('en-US');
    expect(speechLang('A')).toBe('en-US');
    expect(speechLang('「A」の こもじは どれ？')).toBe('ja-JP');
    expect(speechLang('123')).toBe('ja-JP');
  });
});
