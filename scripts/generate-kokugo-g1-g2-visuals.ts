/** 文の意味を絵で支え、正しい表記・文法上の役割は学習者が選ぶ。 */
import { strict as assert } from 'node:assert';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { circle, group, path, rect, text, xml, ink, arrow, cloud, leaf } from './rika-visuals/drawing';
import { book, person } from './shakai-visuals/drawing';
interface Question {
  id: string;
  type: string;
  grade: number;
  unit: string;
  payload: {
    prompt?: string;
    template?: string;
    promptImage?: string;
    promptSpeech?: string;
    promptImageAlt?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
const sets = [1, 2].flatMap((grade) =>
  readdirSync(`content/questions/kokugo/g${grade}`, { recursive: true })
    .filter((f) => String(f).endsWith('.json'))
    .sort()
    .map((f) => {
      const file = `content/questions/kokugo/g${grade}/${f}`;
      return { file, questions: JSON.parse(readFileSync(file, 'utf8')) as Question[] };
    }),
);
const all = sets.flatMap((s) => s.questions);
const signature = () =>
  JSON.stringify(
    all.map((q) => [q.id, q.type, q.grade, q.unit, q.payload.answer, q.payload.answers, q.payload.choices]),
  );
const before = signature();
const changed = new Map<string, string>();
const dir = 'assets/questions/kokugo/visuals';
mkdirSync(dir, { recursive: true });
function draw(name: string, ids: string[], description: string, body: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="220" viewBox="0 0 480 220" role="img" aria-label="${xml(description)}"><title>${xml(description)}</title><rect width="480" height="220" rx="12" fill="#fff"/><g fill="${ink}" font-family="sans-serif">${body}</g></svg>\n`;
  assert(!svg.includes('undefined'));
  writeFileSync(`${dir}/${name}.svg`, svg);
  for (const id of ids) {
    const matches = all.filter((q) => q.id === id || q.id.endsWith(`.${id}`));
    assert.equal(matches.length, 1, id);
    const q = matches[0]!;
    assert.equal(q.type, 'choice');
    assert(!changed.has(q.id));
    assert(!q.payload.promptImage || q.payload.promptImage.startsWith('questions/kokugo/visuals/'));
    q.payload.promptImage = `questions/kokugo/visuals/${name}.svg`;
    // Describe only the pictured context, never the blank particle or the correct choice.
    q.payload.promptSpeech = `${q.payload.prompt} ${description}`;
    changed.set(q.id, description);
  }
}
const dog = () =>
  path(
    'M-65 0q30-30 80-10l20-27 28 9 10 30-24 17-23-6-13 23-23-2-10-25-22 2-20 24-17-2 16-34-23-18',
    '#dcae76',
  ) +
  path('M40-30l-5 25 20-15', '#aa754b') +
  circle(61, -16, 3, ink) +
  path('M-90-15h-25M-90 10h-40');
const bird = () =>
  path('M-40 10q-35-55 10-30q0-40 35-25q20 8 20 30l25 7-26 10q-25 40-60 12l-25 5z', '#e8c05a') +
  circle(8, -27, 3, ink) +
  path('M-15 40v15m10-15v15M-40 60h90') +
  path('M65-30q20 10 0 20m17-31q30 20 0 42');
const reader = () => group(0, -15, person(), 1.5) + group(0, 40, book(), 0.9);
const flower = () =>
  path('M0 70V0', 'none', '#517b47', 6) +
  leaf(0, 45) +
  group(0, 18, leaf(0, 0), -1) +
  [0, 1, 2, 3, 4, 5]
    .map(
      (i) =>
        `<ellipse cx="0" cy="-23" rx="15" ry="28" fill="#eea2a8" stroke="${ink}" stroke-width="3" transform="rotate(${i * 60})"/>`,
    )
    .join('') +
  circle(0, 0, 16, '#efd36d');
const rain = () =>
  group(240, 65, cloud(), 1.2) +
  [120, 165, 210, 255, 300, 345]
    .map((x, i) => path(`M${x} ${115 + (i % 2) * 22}l-10 27`, 'none', '#4f86ab', 5))
    .join('');
const school = () =>
  rect(295, 65, 145, 110, '#f0ddaa') +
  path('M285 65l85-42 80 42z', '#e4a18f') +
  rect(353, 125, 30, 50, '#bad9e4') +
  [310, 350, 390].map((x) => rect(x, 83, 24, 25, '#d5e9f1')).join('') +
  group(85, 100, person(), 1.3) +
  arrow(150, 130, 95);
const grid = () =>
  Array.from({ length: 4 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) => rect(80 + c * 40, 25 + r * 40, 40, 40, '#fff')).join(''),
  ).join('');
const pencil = () =>
  path('M-55 14L45-22l9 24-100 36-25-3z', '#edc45c') +
  path('M-55 14l9 24-25-3z', '#e8c4a1') +
  path('M45-22l15-5 9 24-15 5z', '#eaa3a0');
const pair = () =>
  group(145, 105, pencil(), 1.4) +
  group(345, 100, rect(-40, -22, 80, 45, '#b8d9e8') + rect(-40, -22, 30, 45, '#f2f4f5'), 1.3);
const smile = () =>
  circle(0, 0, 45, '#f1ceb0') +
  circle(-15, -8, 3, ink) +
  circle(15, -8, 3, ink) +
  path('M-18 12q18 22 36 0') +
  path('M-35 48q35-12 70 0v45h-70z', '#a9cedc');
draw(
  'g1-dog-running',
  ['kokugo.g1.bun-no-kimari.0007', 'd5d0c75c390d'],
  'いぬが、あしを のばして はしっている え。',
  group(245, 112, dog(), 1.55),
);
draw(
  'g2-dog-running',
  ['6473d5c47db0', 'b355ca0080a1', '5afdf8c25d98'],
  '犬が足をのばして走っている絵。',
  group(245, 112, dog(), 1.55),
);
draw(
  'g1-bird-singing',
  ['kokugo.g1.bun-no-kimari.0006', '25b9b1f6819e'],
  'えだに とまった ことりが、くちばしを あけている え。',
  group(240, 110, bird(), 1.35),
);
draw(
  'g2-bird-singing',
  ['f5a20c8839e3'],
  '枝にとまった小鳥が、くちばしを開けている絵。',
  group(240, 110, bird(), 1.35),
);
draw(
  'g1-book-reading',
  ['kokugo.g1.bun-no-kimari.0005', '6424c8642aa0', '72341077030e'],
  '人が、ひらいた ほんを もって よんでいる え。',
  group(240, 105, reader(), 1.2),
);
draw(
  'g2-book-reading',
  ['d7d8dda09598', '21cf840ff956'],
  '子どもが、開いた本を持って読んでいる絵。',
  group(240, 105, reader(), 1.2),
);
draw(
  'g1-school-direction',
  ['kokugo.g1.joshi.0001', '0448e0b20a5a', 'b95352c94f1c'],
  '子どもから がっこうの たてものに むかう やじるし。',
  school(),
);
draw(
  'g1-stationery',
  ['kokugo.g1.joshi.0004', '2be1bbbc1d7b'],
  'えんぴつと けしゴムが、よこに ならんでいる え。',
  pair(),
);
draw('g1-rain', ['kokugo.g1.joshi.0010', 'c0967e9a92f6'], 'くもの したに、あめが ふっている え。', rain());
draw(
  'g1-manuscript',
  ['kokugo.g1.bun-no-kimari.0010', 'e1e0a6a0dfc6'],
  'まだ 文字を かいていない、げんこうようしの マス目。かきはじめる ばしょは しめしていません。',
  grid(),
);
draw(
  'g2-flower',
  ['2b99f5ad3140', '966f5c485a13', 'c31a5c2ea75d'],
  '赤い花が咲いている絵。',
  group(240, 88, flower(), 1.1),
);
draw('g2-smile', ['7a923170dfa6'], '子どもが笑っている絵。', group(240, 86, smile(), 1.1));
const stamp =
  rect(170, 40, 140, 140, '#d8e9f0') + rect(185, 55, 110, 110, '#fff') + group(240, 98, flower(), 0.5);
draw(
  'g1-stamp',
  ['kokugo.g1.hiragana.0006', 'bc63af15bc99'],
  'ふうとうに はる、はなの もようの 小さな かみ。文字は かいていません。',
  stamp,
);
const shirt =
  path('M185 50l30-15q25 30 50 0l30 15 50 35-30 35-25-15v80H190v-80l-25 15-30-35z', '#a7cadf') +
  path('M215 35q25 55 50 0');
draw(
  'g1-shirt',
  ['kokugo.g1.katakana.0005'],
  'そでの ついた、うえに きる ふくの え。文字は かいていません。',
  shirt,
);
const bus =
  rect(90, 45, 300, 115, '#eec55b') +
  [110, 170, 230].map((x) => rect(x, 63, 45, 45, '#d8ebf2')).join('') +
  rect(300, 63, 60, 97, '#d8ebf2') +
  circle(150, 165, 25, '#536675') +
  circle(330, 165, 25, '#536675');
draw(
  'g1-bus',
  ['kokugo.g1.katakana.0001'],
  'まどが ならんだ、大きな のりものの え。文字は かいていません。',
  bus,
);
const apple =
  path('M0-25q-60-30-55 32q8 65 55 48q47 17 55-48q5-62-55-32z', '#e99984') +
  path('M0-25v-25m0 10q25-35 40-10q-20 20-40 10', '#8ab47a');
draw(
  'g1-shiritori-apple',
  ['kokugo.g1.kotoba-asobi.0001', '2bd89a2f8efe'],
  'りんごの えから、はてなの はこへ やじるしが のびています。つづく ことばは かいていません。',
  group(130, 90, apple, 0.85) +
    text('りんご', 130, 190, 30) +
    arrow(220, 110, 65) +
    rect(315, 60, 110, 105) +
    text('？', 370, 132, 45),
);
draw(
  'g1-shuffle-letters',
  ['kokugo.g1.kotoba-asobi.0002', '5a4ec9c6a6f8'],
  'い、か、す の 3まいの カード。ならべかえる まえの じゅんです。',
  ['い', 'か', 'す']
    .map((s, i) => rect(50 + i * 140, 65, 100, 100) + text(s, 100 + i * 140, 132, 45))
    .join(''),
);
// Reading questions keep their evidence in the passage; pictures must not supply its answer.
assert.equal(signature(), before);
for (const s of sets)
  if (s.questions.some((q) => changed.has(q.id)))
    writeFileSync(s.file, JSON.stringify(s.questions, null, 2) + '\n');
const review = all.map((q) => ({
  id: q.id,
  decision: changed.has(q.id) ? 'illustrated' : q.payload.promptImage ? 'existing-visual' : 'text-sufficient',
  reason:
    changed.get(q.id) ??
    (q.type === 'kanji-trace'
      ? '漢字の字形をなぞる表示そのものが観察対象。別の絵は不要。'
      : q.unit.includes('kanji') || /jpn-[12]-[12]$/.test(q.unit)
        ? '文字の読み・表記・字形を選ぶ問題。文字や例文の情報を保ち、答えの語を連想させる絵を追加しない。'
        : /dokkai|reading-sequence/.test(q.unit)
          ? '本文から場所・理由・順序を読み取る問題。答えを示す情景図を置くと読解を省略できるため本文を維持。'
          : /hanasu-kiku|speaking-listening|tsutaeru|observation-writing|jpn-2-4/.test(q.unit)
            ? '話し方・書き方・事実と感想などの言語表現の比較が学習対象。特定の選択肢を示す絵を避ける。'
            : '文の構造・表記・語の分類や音を判断する問題。必要な材料が本文と選択肢にあり、正答を図示しない。'),
}));
writeFileSync('scripts/data/kokugo-g1-g2-visual-review.json', JSON.stringify(review, null, 2) + '\n');
console.log(`${changed.size} illustrated / ${all.length} reviewed`);
