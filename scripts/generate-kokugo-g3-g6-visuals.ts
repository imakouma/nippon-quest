/** 問題文にある場面だけを図示し、品詞名・読み方・正答は描かない。 */
import { strict as assert } from 'node:assert';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { circle, cloud, fish, group, ink, path, rect, text, xml } from './rika-visuals/drawing';
import { book, person } from './shakai-visuals/drawing';
interface Question {
  id: string;
  type: string;
  grade: number;
  unit: string;
  explanation?: string;
  payload: {
    prompt?: string;
    template?: string;
    promptImage?: string;
    promptSpeech?: string;
    promptImageAlt?: string;
    answer?: unknown;
    answers?: unknown;
    choices?: unknown;
  };
}
const sets = readdirSync('content/questions/kokugo', { recursive: true })
  .filter((f) => /^g[3-6]\/.+\.json$/.test(String(f)))
  .sort()
  .map((file) => ({
    file: `content/questions/kokugo/${file}`,
    questions: JSON.parse(readFileSync(`content/questions/kokugo/${file}`, 'utf8')) as Question[],
  }));
const all = sets.flatMap((s) => s.questions);
// 補う根拠が同じ問題セットにある欠落文と、複数正答になる条件だけを明記する。
const clarificationReasons: Record<string, string> = {
  '0cc07d0d5f15':
    '「絵をかいた人」を説明する条件を補い、形の説明「小さな」と区別できる設問に修正。絵で正答を示さない。',
  '374a54969b35':
    'すぐ後に名詞を続ける条件を補い、「そう」と区別できる設問に修正。文字のつながりを比較する課題として維持。',
  '6739f15cc737':
    '「保健」に場所を表す漢字を加える条件を補い、「共通語」と区別できる設問に修正。熟語の文字構成を比較する。',
};
const clarifiedExplanations: Record<string, string> = {
  '0cc07d0d5f15':
    '「兄のかいた」を入れると、絵をかいた人が兄だと分かります。「小さな」は絵の大きさを説明します。',
  '374a54969b35':
    '「こんな」は「こんな様子」「こんな服」のように、すぐ後に名詞を続けて様子や状態を表します。「そう」は「そうする」のように使います。',
  '6739f15cc737':
    '「保健」に、部屋や場所を表す「室」を加えると「保健室」になります。「共通語」も三字熟語ですが、この条件には合いません。',
};
const promptRepairs: Record<string, string> = {
  '0cc07d0d5f15':
    '「（　）絵がほめられた。」の空欄に、絵をかいた人が分かるように修飾語を入れます。どれが当てはまりますか。',
  '374a54969b35': 'すぐ後に名詞を続けて、様子や状態を表すこそあど言葉はどれですか。',
  '6739f15cc737': '「保健」に、場所を表す漢字一字を加えた三字熟語はどれですか。',
  '021e66a343fb':
    '「白い雲が青い空にゆっくりと広がる。」という文で、「青い空に」という言葉は、どの言葉を修飾（説明）していますか。',
  ec309ca0d71a:
    '「白い雲が青い空にゆっくりと広がる。」という文で、「ゆっくりと」という言葉は、どの言葉を修飾していますか。',
  c4d48e6fc1be: '「見る」を、特別な言い方の尊敬語に直したものはどれですか。◆先生が 本を（見る）。',
};
for (const [suffix, prompt] of Object.entries(promptRepairs)) {
  const matches = all.filter((q) => q.id.endsWith(suffix));
  assert.equal(matches.length, 1, suffix);
  matches[0]!.payload.prompt = prompt;
  matches[0]!.payload.promptSpeech = prompt;
  if (clarifiedExplanations[suffix]) matches[0]!.explanation = clarifiedExplanations[suffix];
}
const signature = () =>
  JSON.stringify(
    all.map((q) => [q.id, q.type, q.grade, q.unit, q.payload.answer, q.payload.answers, q.payload.choices]),
  );
const before = signature();
const changed = new Map<string, string>();
const dir = 'assets/questions/kokugo/visuals';
mkdirSync(dir, { recursive: true });
const draw = (name: string, ids: string[], description: string, body: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240" role="img" aria-label="${xml(description)}"><title>${xml(description)}</title><rect width="480" height="240" rx="12" fill="#fff"/><g fill="${ink}" font-family="sans-serif">${body}</g></svg>\n`;
  assert(!svg.includes('undefined'));
  writeFileSync(`${dir}/${name}.svg`, svg);
  for (const id of ids) {
    const matches = all.filter((q) => q.id.endsWith(id));
    assert.equal(matches.length, 1, id);
    const q = matches[0]!;
    assert(!changed.has(q.id));
    assert(!q.payload.promptImage || q.payload.promptImage === `questions/kokugo/visuals/${name}.svg`, q.id);
    q.payload.promptImage = `questions/kokugo/visuals/${name}.svg`;
    if (q.type === 'choice')
      q.payload.promptSpeech = `${(q.payload.promptSpeech ?? q.payload.prompt ?? '').split('\n図の説明：')[0]}\n図の説明：${description}`;
    else q.payload.promptImageAlt = description;
    changed.set(q.id, description);
  }
};
const caption = (s: string) => text(s, 240, 218, 26);
const rain = () =>
  group(0, -15, cloud()) + [-35, 0, 35].map((x) => path(`M${x} 15l-10 35`, 'none', '#5496ba', 5)).join('');
const umbrella = () =>
  path('M-65 0Q0-95 65 0Q32-15 0 0Q-32-15-65 0', '#dfad68') +
  path('M0 0v70q-22 20-22-5', 'none', '#4d5e70', 5);
const running = () =>
  circle(0, -43, 13, '#e9c6a0') +
  path('M0-28l-13 35 30 18m-30-18l-24 30m31-55l30 7m-30-7l-25-12', 'none', '#416b83', 8);
const flower = () =>
  path('M0 50V0', 'none', '#569365', 5) +
  [
    [-12, 0],
    [12, 0],
    [0, -12],
    [0, 12],
  ]
    .map(([x, y]) => circle(x!, y!, 13, '#eb9384'))
    .join('') +
  circle(0, 0, 7, '#f0cf71');
draw(
  'g3-fish-tank',
  ['1ee2d9d477c9'],
  '水そうの中に魚がいる場面。',
  rect(110, 25, 260, 155, '#e6f3fa') +
    path('M120 55q30-12 60 0t60 0t60 0t60 0', 'none', '#6b9db9') +
    group(240, 112, fish(), 1.3) +
    caption('水そうの 中に 魚が いる。'),
);
draw(
  'g3-many-books',
  ['271e104c89c9'],
  '本が何冊も並んでいる場面。',
  [0, 1, 2, 3, 4, 5]
    .map((i) =>
      rect(78 + i * 52, 48 + (i % 2) * 12, 40, 110 - (i % 2) * 12, ['#d4e5ef', '#e8c590', '#aed0b3'][i % 3]),
    )
    .join('') + caption('たくさんの 本が ある。'),
);
draw(
  'g3-red-ball',
  ['7df06ee97fc8'],
  '赤い大きな玉が転がった場面。',
  circle(270, 105, 62, '#e79787') +
    path('M120 90h45m-65 30h60m-25 30h45', 'none', '#7893a6', 5) +
    caption('赤い 大きな 玉が 転がった。'),
);
draw(
  'g3-dog-running',
  ['693328e51033'],
  '犬が走っている場面。',
  path(
    'M160 105q50-50 110-10l40-15 20 40-40 10-15-10-20 5-10 45h-12l5-50-35 0-25 45h-12l15-55-25-5-20-30',
    '#d8b88a',
  ) +
    circle(310, 103, 4, ink) +
    path('M105 110h35m-50 25h45') +
    caption('犬が 元気に 走る。'),
);
draw(
  'g3-water-flow',
  ['6d9b415d4756'],
  '水が静かに流れている場面。',
  path('M70 65q75 40 150 0t190 0v85q-90-35-190 0t-150 0z', '#b8dce9') +
    path('M110 90q55 20 90 0m50 25q55-20 100 0', 'none', '#598ca7') +
    caption('水が しずかに 流れる。'),
);
draw(
  'g3-reading',
  ['14ca2ec84d2e'],
  '弟が本を読んでいる場面。',
  group(240, 90, person(), 1.5) + group(240, 118, book(), 0.7) + caption('弟が 本を 読む。'),
);
draw(
  'g3-running',
  ['b75eb9f7aa8c'],
  '妹が走っている場面。',
  group(250, 100, running(), 1.2) + caption('妹が 走る。'),
);
draw('g3-red-flower', ['438b4fa86d44'], '赤い花の図。', group(240, 95, flower(), 1.5) + caption('赤い 花'));
draw(
  'g4-cloud-sentence',
  ['021e66a343fb', '0b27c7ebfee3', 'ec309ca0d71a'],
  '青い空に白い雲が広がっている場面。',
  rect(40, 25, 400, 135, '#c9e4f1') +
    group(165, 88, cloud(), 0.9) +
    group(315, 100, cloud(), 0.7) +
    text('白い雲が 青い空に', 240, 195, 27) +
    text('ゆっくりと 広がる。', 240, 228, 27),
);
draw(
  'g4-rain-umbrella',
  ['f1bd103fc101', 'e690139d9e6c'],
  '左は雨が降った場面。右は傘をさした場面。間のつなぎ言葉は空欄。',
  group(115, 80, rain()) +
    group(370, 85, umbrella(), 0.8) +
    rect(213, 85, 54, 44) +
    text('？', 240, 117, 30) +
    text('雨が降った。', 115, 211, 25) +
    text('傘をさした。', 365, 211, 25),
);
draw(
  'g4-study-test',
  ['38d981486998'],
  '左は勉強した場面。右は点数が悪かったテスト。二つの文の間は空欄。',
  group(110, 95, book()) +
    rect(305, 35, 115, 125) +
    text('テスト', 362, 70, 24) +
    text('低い点', 362, 115, 25) +
    rect(213, 85, 54, 44) +
    text('？', 240, 117, 30) +
    text('勉強した。', 110, 210, 25) +
    text('点数は悪かった。', 365, 210, 24),
);
draw(
  'g5-rain-river',
  ['bd342e3bb926'],
  '左は大雨が降った場面。右は川の水が岸をこえてあふれた場面。',
  group(115, 80, rain(), 1.1) +
    path('M285 95h155v55H285z', '#d6c69c') +
    path('M300 60q55 30 120 0v75q-55-20-120 0z', '#a4d5e8') +
    path('M280 105q25-20 45 0t50 0t65 0', 'none', '#478bad', 6) +
    text('大雨が降った。', 115, 210, 25) +
    text('川の水があふれた。', 360, 210, 24),
);
const teacher = () =>
  group(315, 100, person(), 1.3) +
  text('先生', 315, 200, 27) +
  group(115, 125, person(), 0.85) +
  text('わたし', 115, 200, 27);
draw(
  'g5-teacher-coming',
  ['0c14b683b09b'],
  '先生がこちらへ来る場面。',
  teacher() + path('M250 120h-45m12-10l-12 10 12 10', 'none', '#7898ac', 4),
);
draw(
  'g5-teacher-speaking',
  ['b34c5b5d2063'],
  '先生が話し、わたしが聞いている場面。',
  teacher() + rect(225, 22, 95, 45, '#eef4f8') + text('…', 270, 53, 30) + path('M290 67l20 15-5-15'),
);
draw(
  'g6-teacher-coming',
  ['966b69f6f2ac'],
  '先生がこちらへ来る場面。',
  teacher() + path('M250 120h-45m12-10l-12 10 12 10', 'none', '#7898ac', 4),
);
draw(
  'g6-teacher-reading',
  ['c4d48e6fc1be'],
  '先生が本を見ている場面。',
  teacher() + group(315, 135, book(), 0.55),
);
draw(
  'g6-self-reading',
  ['b31934b6165d'],
  'わたしが本を見ている場面。',
  teacher() + group(115, 145, book(), 0.5),
);
draw(
  'g6-panel-discussion',
  ['68ef1a89a601'],
  '二人がそれぞれの意見を述べ、中央の人が話し合いを進めている場面。中央の役割名は空欄。',
  group(80, 105, person()) +
    group(240, 105, person()) +
    group(400, 105, person()) +
    rect(25, 20, 115, 40) +
    text('意見 A', 82, 48, 25) +
    rect(340, 20, 115, 40) +
    text('意見 B', 397, 48, 25) +
    rect(180, 172, 120, 45) +
    text('？', 240, 204, 30) +
    path('M115 100h70m110 0h70', 'none', '#7b99ac', 4),
);
assert.equal(signature(), before);
assert(changed.size >= 20);
for (const s of sets)
  if (
    s.questions.some(
      (q) => changed.has(q.id) || Object.keys(promptRepairs).some((suffix) => q.id.endsWith(suffix)),
    )
  )
    writeFileSync(s.file, JSON.stringify(s.questions, null, 2) + '\n');
const deferred = new Map<string, { decision: string; reason: string }>();
const defer = (ids: string[], decision: string, reason: string) => {
  for (const suffix of ids) {
    const matches = all.filter((q) => q.id.endsWith(suffix));
    assert.equal(matches.length, 1, suffix);
    deferred.set(matches[0]!.id, { decision, reason });
  }
};
for (const [suffix, reason] of Object.entries(clarificationReasons))
  defer([suffix], 'clarified-text', reason);
defer(
  ['c4499447c517', 'e392172ca672'],
  'needs-source',
  '物語「りんごどろぼう」の本文が未提示で、情景や心情の根拠を確認できない。出典本文の確認後に補う。',
);
defer(
  ['2f10f53b2af5', '79f54db33e7d', '848362467da6'],
  'needs-source',
  'じんざと男の子の物語本文が未提示。短い引用のみでは心情の理由が決まらず、本文の確認が必要。',
);
defer(
  ['1bc2578e027c', '6c6faa38d290', '72fbcbc2c72f', 'd2c8f30eef1d'],
  'needs-source',
  'かっちゃんとさむらいの物語本文が未提示。行動や心情の原因を図で創作せず、本文の確認を待つ。',
);
defer(
  ['b7adfb821ddb', 'c7c16f373027'],
  'needs-source',
  'ぎ手・ぎ足の説明文で指示語の指す前後の本文が未提示。指示対象を確定できる本文が必要。',
);
defer(
  ['51a081fff200', '530cc8361ed8', '98feb53edf80'],
  'needs-source',
  '冬眠の説明文の該当段落が未提示。本文の構成や比較内容を確認してから補う。',
);
defer(
  ['6b30823de3da', '70d7c5b1832e'],
  'needs-source',
  '都会とアブラコウモリの説明文が未提示。一般知識で本文の内容を代用せず、出典本文を確認する。',
);
defer(
  ['a94e12e7a508'],
  'needs-source',
  '複数の短歌を参照する設問だが全文が未提示。対象の歌と読解条件を確認してから補う。',
);
defer(
  ['6d99d371877a'],
  'needs-source',
  '物語「牛のリオと陸」の本文が未提示。心情変化の根拠を確認できず、絵で答えを創作しない。',
);
defer(
  ['8a4784d5eb93'],
  'needs-source',
  '説明文「奈良公園とコガネムシ」の本文が未提示。一般知識の図で本文読解を代用しない。',
);
const review = all.map((q) => ({
  id: q.id,
  decision:
    deferred.get(q.id)?.decision ??
    (changed.has(q.id) ? 'illustrated' : q.payload.promptImage ? 'existing-visual' : 'text-sufficient'),
  reason:
    deferred.get(q.id)?.reason ??
    (changed.has(q.id)
      ? '本文の場面を図で補い、文法の分類名や正答は示さない。' + changed.get(q.id)
      : q.payload.promptImage
        ? '既存の図版を維持。'
        : q.type === 'kanji-trace'
          ? '字形・筆順の練習であり、文字の描画が観察対象。'
          : /kanji|読み|漢字|ローマ字/.test(
                q.id +
                  ' ' +
                  (q.payload.prompt ?? q.payload.template ?? '').replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1'),
              )
            ? '読み・字形・表記を判断する課題。正答を別表記や絵で示さず、提示された文字を維持。'
            : '文や選択肢そのものを比較して意味・表現を判断する課題。問題文にない情景や意味の解釈を図で追加しない。'),
}));
writeFileSync('scripts/data/kokugo-g3-g6-visual-review.json', JSON.stringify(review, null, 2) + '\n');
console.log(`${changed.size} / ${all.length} upper-grade questions illustrated`);
