import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type Question = {
  id: string;
  tags?: string[];
  explanation: string;
  payload: {
    prompt: string;
    answer: string;
    choices: Array<{ id: string; text: string }>;
    promptImage?: string;
    promptSpeech?: unknown;
  };
};
function readQuestions(directory: string): Question[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return readQuestions(path);
    if (!entry.name.endsWith('.json')) return [];
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Question[] | { questions?: Question[] };
    return Array.isArray(parsed) ? parsed : (parsed.questions ?? []);
  });
}
const questions = new Map(
  ['kokugo', 'seikatsu']
    .flatMap((subject) => readQuestions(join(process.cwd(), 'content/questions', subject)))
    .map((q) => [q.id, q]),
);
function question(id: string): Question {
  const q = questions.get(id);
  if (!q) throw new Error(`Missing repair target: ${id}`);
  return q;
}
function answer(q: Question): string | undefined {
  return q.payload.choices.find((choice) => choice.id === q.payload.answer)?.text;
}
const readings = [
  ['legacy.kokugo.g6.jpn-6-1.c3e0b8f55dde', '灰色', '灰', 'はい'],
  ['legacy.kokugo.g6.jpn-6-1.c5357f8cda0d', '筋肉', '筋', 'きん'],
  ['legacy.kokugo.g6.jpn-6-1.cb882d8586fe', '沿岸', '沿', 'えん'],
  ['legacy.kokugo.g6.jpn-6-1.d1a30eede454', '異常', '異', 'い'],
  ['legacy.kokugo.g6.jpn-6-1.d558b9be82f6', '系統', '系', 'けい'],
  ['legacy.kokugo.g6.jpn-6-1.d91aeb9831df', '恩人', '恩', 'おん'],
  ['legacy.kokugo.g6.jpn-6-1.e36f69dc4537', '株主', '株', 'かぶ'],
  ['legacy.kokugo.g6.jpn-6-1.f9a07246bb14', '勤務', '勤', 'きん'],
  ['legacy.kokugo.g6.jpn-6-1.09dd1ee86d54', '疑問', '疑', 'ぎ'],
  ['legacy.kokugo.g6.jpn-6-1.0ac5990000a7', '拡大', '拡', 'かく'],
  ['legacy.kokugo.g6.jpn-6-1.0d4ed48fef4b', '延長', '延', 'えん'],
  ['legacy.kokugo.g6.jpn-6-1.1258d6306d4c', '提供', '供', 'きょう'],
  ['legacy.kokugo.g6.jpn-6-1.1685f4e9b6b1', '干満', '干', 'かん'],
  ['legacy.kokugo.g6.jpn-6-1.16a63209d908', '巻末', '巻', 'かん'],
  ['legacy.kokugo.g6.jpn-6-1.1f449bd6dc2b', '机の上', '机', 'つくえ'],
  ['legacy.kokugo.g6.jpn-6-1.2b1105dcc1ef', '危険', '危', 'き'],
  ['legacy.kokugo.g6.jpn-6-1.35b6b1d8d6ec', '貴重', '貴', 'き'],
  ['legacy.kokugo.g6.jpn-6-1.4c4e47cbc1f2', '映画', '映', 'えい'],
  ['legacy.kokugo.g6.jpn-6-1.5355340f4ac9', '内閣', '閣', 'かく'],
  ['legacy.kokugo.g6.jpn-6-1.8012190b4a38', '遺産', '遺', 'い'],
  ['legacy.kokugo.g6.jpn-6-1.838d1c91fd45', '自我', '我', 'が'],
  ['legacy.kokugo.g6.jpn-6-1.86127763eaa1', '看板', '看', 'かん'],
  ['legacy.kokugo.g6.jpn-6-1.88def481123a', '改革', '革', 'かく'],
  ['legacy.kokugo.g6.jpn-6-1.9972c6a028dc', '宇宙', '宇', 'う'],
  ['legacy.kokugo.g6.jpn-6-1.9b3476946edb', '胃腸', '胃', 'い'],
  ['legacy.kokugo.g6.jpn-6-1.a99a24efa5f5', '指揮', '揮', 'き'],
  ['legacy.kokugo.g6.jpn-6-1.a9ba5dfd410d', '胸囲', '胸', 'きょう'],
  ['legacy.kokugo.g6.jpn-6-1.ac0c19344e5f', '劇場', '劇', 'げき'],
  ['legacy.kokugo.g6.jpn-6-1.ad55729127ed', '郷土', '郷', 'きょう'],
  ['legacy.kokugo.g6.jpn-6-1.afefc184a584', '吸収', '吸', 'きゅう'],
  ['legacy.kokugo.g5.jpn-5-1.bc9cff397782', '眼科', '眼', 'がん'],
  ['legacy.kokugo.g5.jpn-5-1.c50eadc8ce61', '技術', '技', 'ぎ'],
  ['legacy.kokugo.g5.jpn-5-1.d9e8b49b01d8', '移動', '移', 'い'],
  ['legacy.kokugo.g5.jpn-5-1.df5a76b8f9e6', '可能', '可', 'か'],
  ['legacy.kokugo.g5.jpn-5-1.e4d851deae2a', '応援', '応', 'おう'],
  ['legacy.kokugo.g5.jpn-5-1.e64ccdbd2d13', '世紀', '紀', 'き'],
  ['legacy.kokugo.g5.jpn-5-1.e7375b743b5b', '過去', '過', 'か'],
  ['legacy.kokugo.g5.jpn-5-1.f0340df0df0c', '快晴', '快', 'かい'],
  ['legacy.kokugo.g5.jpn-5-1.f3f40353a86e', '圧力', '圧', 'あつ'],
  ['legacy.kokugo.g5.jpn-5-1.072f103e43e5', '寄付', '寄', 'き'],
  ['legacy.kokugo.g5.jpn-5-1.0c504afc91c3', '桜の花', '桜', 'さくら'],
  ['legacy.kokugo.g5.jpn-5-1.1cdd59ecfce6', '週刊', '刊', 'かん'],
  ['legacy.kokugo.g5.jpn-5-1.21b39397d760', '性格', '格', 'かく'],
  ['legacy.kokugo.g5.jpn-5-1.3d8b735b6a2a', '往復', '往', 'おう'],
  ['legacy.kokugo.g5.jpn-5-1.3e6d2d03f3d6', '永遠', '永', 'えい'],
  ['legacy.kokugo.g5.jpn-5-1.438cb256678a', '解答', '解', 'かい'],
  ['legacy.kokugo.g5.jpn-5-1.51850fe1ce9c', '利益', '益', 'えき'],
  ['legacy.kokugo.g5.jpn-5-1.544fde2415e3', '仮説', '仮', 'か'],
  ['legacy.kokugo.g5.jpn-5-1.6314721c5266', '営業', '営', 'えい'],
  ['legacy.kokugo.g5.jpn-5-1.72d6a7d1c271', '河川', '河', 'か'],
  ['legacy.kokugo.g5.jpn-5-1.7399f8013b08', '喜劇', '喜', 'き'],
  ['legacy.kokugo.g5.jpn-5-1.834c7035799b', '価格', '価', 'か'],
  ['legacy.kokugo.g5.jpn-5-1.891d894c917a', '幹部', '幹', 'かん'],
  ['legacy.kokugo.g5.jpn-5-1.91ca43173c0c', '金額', '額', 'がく'],
  ['legacy.kokugo.g5.jpn-5-1.a2f5c52ab548', '演技', '演', 'えん'],
  ['legacy.kokugo.g5.jpn-5-1.a8dfa134bbf6', '周囲', '囲', 'い'],
  ['legacy.kokugo.g5.jpn-5-1.aaae262ba798', '習慣', '慣', 'かん'],
  ['legacy.kokugo.g5.jpn-5-1.ae05bf76a0a4', '規則', '規', 'き'],
  ['legacy.kokugo.g5.jpn-5-1.b87f2f9d3a66', '原因', '因', 'いん'],
  ['legacy.kokugo.g5.jpn-5-1.ba81ea6e3d85', '衛生', '衛', 'えい'],
  ['legacy.kokugo.g4.jpn-4-1.b7dacc0f6a8e', '課題', '課', 'か'],
  ['legacy.kokugo.g4.jpn-4-1.c9ec03beb0d8', '被害', '害', 'がい'],
  ['legacy.kokugo.g4.jpn-4-1.cf7d86bd3181', '警官', '官', 'かん'],
  ['legacy.kokugo.g4.jpn-4-1.e0f557145ded', '願書', '願', 'がん'],
  ['legacy.kokugo.g4.jpn-4-1.e10f9166fe9b', '一億', '億', 'おく'],
  ['legacy.kokugo.g4.jpn-4-1.ef54d1e58659', '街道', '街', 'かい'],
  ['legacy.kokugo.g4.jpn-4-1.f5fed2a3899b', '愛情', '愛', 'あい'],
  ['legacy.kokugo.g4.jpn-4-1.fd191c3136ed', '印刷', '印', 'いん'],
  ['legacy.kokugo.g4.jpn-4-1.0a9170d4f677', '年賀', '賀', 'が'],
  ['legacy.kokugo.g4.jpn-4-1.0c617c232741', '完成', '完', 'かん'],
  ['legacy.kokugo.g4.jpn-4-1.0f0af36b310b', '機械', '械', 'かい'],
  ['legacy.kokugo.g4.jpn-4-1.1e186d1ca1a0', '衣服', '衣', 'い'],
  ['legacy.kokugo.g4.jpn-4-1.25bdcacf66fe', '新潟', '潟', 'がた'],
  ['legacy.kokugo.g4.jpn-4-1.2bd735940db0', '果実', '果', 'か'],
  ['legacy.kokugo.g4.jpn-4-1.2d5fa0610fd5', '以上', '以', 'い'],
  ['legacy.kokugo.g4.jpn-4-1.3133feae1ef0', '岐阜', '岐', 'ぎ'],
  ['legacy.kokugo.g4.jpn-4-1.31ab760aa273', '各地', '各', 'かく'],
  ['legacy.kokugo.g4.jpn-4-1.34ae1c916ed5', '食塩', '塩', 'えん'],
  ['legacy.kokugo.g4.jpn-4-1.3b3c846419b9', '季節', '季', 'き'],
  ['legacy.kokugo.g4.jpn-4-1.42edb848e40c', '愛媛', '媛', 'ひめ'],
  ['legacy.kokugo.g4.jpn-4-1.4caf103ee214', '案内', '案', 'あん'],
  ['legacy.kokugo.g4.jpn-4-1.58772fa94bdb', '希望', '希', 'き'],
  ['legacy.kokugo.g4.jpn-4-1.6177c26c69d7', '岡山', '岡', 'おか'],
  ['legacy.kokugo.g4.jpn-4-1.648dd84422c9', '改善', '改', 'かい'],
  ['legacy.kokugo.g4.jpn-4-1.673581cb7b89', '栄養', '栄', 'えい'],
  ['legacy.kokugo.g4.jpn-4-1.7969b7a84296', '感覚', '覚', 'かく'],
  ['legacy.kokugo.g4.jpn-4-1.86d2bbc63788', '茨城', '茨', 'いばら'],
  ['legacy.kokugo.g4.jpn-4-1.9d782c260d7e', '貨物', '貨', 'か'],
  ['legacy.kokugo.g4.jpn-4-1.a53d2723e955', '観察', '観', 'かん'],
] as const;
const specificRepairs = [
  ['legacy.kokugo.g3.jpn-3-18.a6e33c544702', '赤らむ', 'あからむ'],
  ['legacy.kokugo.g3.jpn-3-2.c57805e78947', 'みず', '部首[ぶしゅ]'],
  ['legacy.kokugo.g3.jpn-3-22.38be63f6d51d', '行い', 'おこない'],
  ['legacy.kokugo.g3.jpn-3-22.edc0a5fcff68', 'およぐ', '泳ぐ'],
  ['legacy.kokugo.g3.jpn-3-9.acc6593c1eb9', '委員会', 'いいんかい'],
  ['legacy.kokugo.g4.jpn-4-27.593c2e21ef07', '① 店 / ② 天', '頭[とう]'],
  ['legacy.kokugo.g4.jpn-4-28.14fb9e6116f2', 'とちぎけん', '栃木県'],
  ['legacy.kokugo.g4.jpn-4-29.090bb8d834b4', 'えがく', '3もじ'],
  ['legacy.kokugo.g5.jpn-5-3.34bbced5c0f3', 'わたる', '渡る'],
  ['source.kokugo.g5.jpn-5-kanji-6.c30b9d9519fc', 'ぞん', '存'],
  ['source.kokugo.g6.jpn-6-kanji-2.a1eb77708d53', 'てんのう', '天皇'],
  ['source.kokugo.g6.jpn-6-kanji-9.18bef0f9b620', 'さつ', '冊'],
] as const;
const lifeRepairs = [
  ['legacy.seikatsu.g1.cur-1801-01.f7ea232fc6e3', 'いっしょにあそび、はなしをきく', 'ともだち'],
  [
    'legacy.seikatsu.g2.cur-1802-05.f49a2215a673',
    '1年生[ねんせい]のころの自分[じぶん]の絵[え]や作文[さくぶん]',
    'できる',
  ],
  ['legacy.seikatsu.g2.cur-1802-04.4b414e220ad7', 'おしらせをけいじする', 'おしらせ'],
  ['legacy.seikatsu.g2.cur-1802-01.a0c113aa2a34', '病院[びょういん]', '病気[びょうき]'],
  ['legacy.seikatsu.g2.cur-1802-01.df1a73a22eaf', 'パン屋[や]', 'パン'],
] as const;

describe('audited kanji and life content repairs', () => {
  it('limits 利益 to company profit so えき is the unique contextual reading', () => {
    const q = question('legacy.kokugo.g5.jpn-5-1.51850fe1ce9c');
    expect(q.payload.prompt).toContain('会社[かいしゃ]のもうけ');
    expect(answer(q)).toBe('えき');
    expect(q.payload.choices.some((choice) => choice.text === 'やく')).toBe(true);
    expect(q.explanation).toContain('もうけ');
  });

  it.each(readings)('%s asks a contextual reading and accepts kana', (id, word, character, reading) => {
    const q = question(id);
    expect(q.payload.prompt).toContain(`「${word}」`);
    expect(q.payload.prompt).toContain(`「${character}」`);
    expect(answer(q)).toBe(reading);
    expect(q.payload.choices.every((c) => /^[ぁ-ゖー]+$/u.test(c.text))).toBe(true);
    expect(q.explanation).toContain(`「${reading}」`);
    // Reading questions must not reveal the tested sound through TTS.
    expect(q.tags).toContain('speech:disabled');
    expect(q.payload.promptSpeech).toBeUndefined();
  });
  it.each(specificRepairs)('%s fixes the audited semantic mismatch', (id, expected, context) => {
    const q = question(id);
    expect(answer(q)).toBe(expected);
    expect(q.payload.prompt).toContain(context);
    expect(q.payload.promptSpeech).toBeUndefined();
  });
  it('replaces complete parenthesized expressions without duplicated suffixes', () => {
    const cases = [
      ['legacy.kokugo.g3.jpn-3-18.a6e33c544702', 'あからむ', '赤らむ'],
      ['legacy.kokugo.g3.jpn-3-22.38be63f6d51d', 'おこない', '行い'],
      ['legacy.kokugo.g3.jpn-3-9.acc6593c1eb9', 'いいんかい', '委員会'],
    ] as const;
    for (const [id, kana, written] of cases) {
      const q = question(id);
      expect(q.payload.prompt).toContain(`（${kana}）`);
      const completed = q.payload.prompt.replace(`（${kana}）`, answer(q) ?? '');
      expect(completed).toContain(written);
      expect(completed).not.toMatch(/赤らむらむ|行いい|委員会会/);
    }
  });
  it('does not teach that かく is an invalid reading of 描く', () => {
    const q = question('legacy.kokugo.g4.jpn-4-29.090bb8d834b4');
    expect(q.payload.prompt).toContain('3もじ');
    expect(q.explanation).toContain('「かく」');
    expect(q.explanation).toContain('「えがく」');
  });
  it.each(lifeRepairs)(
    '%s is answerable from text without an unrelated photograph',
    (id, expected, context) => {
      const q = question(id);
      expect(answer(q)).toBe(expected);
      expect(q.payload.prompt).toContain(context);
      expect(q.payload.promptImage).toBeUndefined();
      expect(q.payload.prompt).not.toMatch(/写真|しゃしん/);
      expect(q.explanation).not.toMatch(/写真|しゃしん/);
    },
  );
  it('keeps one uniquely identified correct option for every repaired question', () => {
    const ids = [...readings, ...specificRepairs, ...lifeRepairs].map(([id]) => id);
    expect(new Set(ids).size).toBe(106);
    for (const id of ids) {
      const q = question(id);
      expect(q.payload.choices.filter((c) => c.id === q.payload.answer)).toHaveLength(1);
      expect(new Set(q.payload.choices.map((c) => c.text)).size).toBe(q.payload.choices.length);
    }
  });
});
