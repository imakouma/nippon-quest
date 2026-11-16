/** 小2の教材に具体物と図を追加する。正解や不足した問題条件は生成しない。 */
import { strict as assert } from 'node:assert';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { pictureSvg } from '../src/questions/renderers/shared/pictures';

const dir = 'assets/questions/sansu/g2/visuals';
mkdirSync(dir, { recursive: true });
const xml = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const line = 'stroke="#273449" stroke-width="2.5" stroke-linejoin="round"';
const text = (s: string, x: number, y: number, size = 26) =>
  `<text x="${x}" y="${y}" font-size="${size}">${xml(s)}</text>`;
const rect = (x: number, y: number, w: number, h: number, fill = '#eaf3f7') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" ${line}/>`;
const icons: Record<string, string> = {
  apple: `<g transform="scale(4)">${pictureSvg('apple')
    .replace(/^<svg[^>]*>/, '')
    .replace('</svg>', '')}</g>`,
};
for (const [key, file] of [
  ['person', 'family-bread'],
  ['candy', 'share-candy'],
] as const) {
  const svg = readFileSync(`assets/questions/sansu/g1/visuals/${file}.svg`, 'utf8');
  const match = svg.match(new RegExp(`<symbol id="${key}" viewBox="0 0 64 64">([\\s\\S]*?)</symbol>`));
  assert(match, key);
  icons[key] = match[1]!;
}
const use = (key: string, x: number, y: number, size = 42) => {
  assert(icons[key]);
  return `<use href="#${key}" x="${x}" y="${y}" width="${size}" height="${size}"/>`;
};
function asset(name: string, description: string, body: string, width = 800, height = 260) {
  const keys = [...new Set([...body.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]!))];
  const defs = keys.map((k) => `<symbol id="${k}" viewBox="0 0 64 64">${icons[k]}</symbol>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${xml(description)}"><title>${xml(description)}</title><defs>${defs}</defs><rect width="100%" height="100%" rx="12" fill="#fff"/><g fill="#172033" font-family="sans-serif">${body}</g></svg>\n`;
  assert(!svg.includes('undefined'));
  writeFileSync(`${dir}/${name}.svg`, svg);
  return `questions/sansu/g2/visuals/${name}.svg`;
}
interface Payload {
  prompt: string;
  promptImage?: string;
  promptImageAlt?: string;
  promptSpeech?: string;
  template?: string;
  answers?: string[];
  answer?: string;
  choices?: { id: string; text: string; image?: string }[];
}
interface Question {
  id: string;
  type: string;
  grade: number;
  unit: string;
  tags?: string[];
  explanation?: string;
  payload: Payload;
}
const sets = readdirSync('content/questions/sansu/g2')
  .sort()
  .map((d) => {
    const file = `content/questions/sansu/g2/${d}/set-001.json`;
    return { file, questions: JSON.parse(readFileSync(file, 'utf8')) as Question[] };
  });
const all = sets.flatMap((s) => s.questions);
assert.equal(all.length, 323, 'Review new/deleted questions before regenerating');
const signature = () =>
  JSON.stringify(
    all.map((q) => [
      q.id,
      q.type,
      q.grade,
      q.unit,
      q.tags,
      q.payload.answer,
      q.payload.answers,
      q.payload.choices?.map((c) => [c.id, c.text]),
    ]),
  );
const before = signature();
const changed = new Map<string, string>();
const get = (id: string) => {
  const q = all.find((q) => q.id === id);
  assert(q, id);
  return q;
};
const legacy = (n: number, hash: string) => `legacy.sansu.g2.math-2-${n}.${hash}`;
function attach(id: string, path: string, description: string) {
  const q = get(id);
  assert(!q.tags?.includes('runtime:quarantined-missing-context'));
  q.payload.promptImage = path;
  if (q.type === 'choice') q.payload.promptSpeech = `${q.payload.prompt} ${description}`;
  else q.payload.promptImageAlt = description;
  changed.set(id, description);
}
function draw(id: string, name: string, description: string, body: string, height = 260) {
  attach(id, asset(name, description, body, 800, height), description);
}
function choiceImage(id: string, choice: string, name: string, description: string, body: string) {
  const q = get(id),
    c = q.payload.choices?.find((c) => c.id === choice);
  assert(c);
  c.image = asset(name, description, body, 200, 160);
  changed.set(id, '選択肢に具体物の絵を追加');
}

// 既存の給食・外遊びグラフを読み取り、同じ投票数を「1人の絵」に置換する。
const meals = ['にくじゃが', 'ハンバーグ', 'やきそば', 'スパゲティ', 'カレー', 'からあげ'];
const mealCounts = [3, 4, 3, 4, 6, 5];
function survey(name: string, labels: string[], counts: number[], table?: string[]) {
  let body = text('え 1つが 1にん', 275, 26, 22);
  if (table) body += text('ひょう', 655, 26, 22);
  for (let row = 0; row < labels.length; row++) {
    const y = 35 + row * 35;
    body += `<g data-group-count="${counts[row]}">${rect(10, y, table ? 580 : 780, 33, row % 2 ? '#eaf3f7' : '#f4f1e8')}${text(labels[row]!, 22, y + 25, 22)}`;
    for (let i = 0; i < counts[row]!; i++) body += use('person', 205 + i * 55, y + 1, 30);
    body += '</g>';
    if (table) body += rect(620, y, 160, 33) + text(table[row]!, 687, y + 25, 24);
  }
  const description =
    labels.map((label, i) => `${label}は${counts[i]}にん`).join('、') +
    '。え1つが1にん。' +
    (table ? 'ひょうは上から3、4、ア、イ、6、ウ。' : '');
  return { path: asset(name, description, body), description };
}
const mealGraph = survey('meal-votes', meals, mealCounts);
const mealTable = survey('meal-votes-table', meals, mealCounts, ['3', '4', 'ア', 'イ', '6', 'ウ']);
const playGraph = survey(
  'play-votes',
  ['おにごっこ', 'かくれんぼ', 'なわとび', 'サッカー', 'ドッジボール'],
  [5, 4, 2, 3, 6],
);
const cards = [4, 2, 4, 3, 5, 5, 1, 2, 1, 1, 3, 5, 5, 3, 0, 4, 1, 4, 0, 4, 2, 5, 3, 4, 0];
assert.deepEqual(
  meals.map((_, i) => cards.filter((c) => c === i).length),
  mealCounts,
);
const cardDescription =
  '1まいが1にんの投票カード。上から1だんずつ、左から読むと、' + cards.map((c) => meals[c]).join('、') + '。';
const mealCards = asset(
  'meal-vote-cards',
  cardDescription,
  text('カード 1まいが 1にん', 260, 25, 22) +
    cards
      .map((c, i) => {
        const x = 12 + (i % 5) * 157,
          y = 35 + Math.floor(i / 5) * 43;
        return (
          rect(x, y, 149, 39, '#eaf3f7') +
          use('person', x + 3, y + 4, 29) +
          text(meals[c]!, x + 35, y + 25, 18)
        );
      })
      .join(''),
);
for (const q of all.filter((q) => q.unit.endsWith('math-2-1'))) {
  const hash = q.id.split('.').at(-1)!;
  const graph = ['03e76e3d3de4', '2b01dbbab681', '796aacaeb2c3'].includes(hash)
    ? mealTable
    : ['ac73faced8c7', 'c180e1dfdd4a', 'd3a784d0f3f1'].includes(hash)
      ? mealGraph
      : ['0efdcce0ec27', '5e2eccb90428', 'b38b4d2428a9'].includes(hash)
        ? playGraph
        : undefined;
  // 同じ本文だけだった3問は、既存解説に明記された問いを本文へ戻す。
  const intro = 'クラスの みんなが すきな そとあそびを、グラフに まとめました。';
  if (hash === '0efdcce0ec27') q.payload.prompt = intro + ' いちばん すくない あそびは どれ？';
  if (hash === '5e2eccb90428') q.payload.prompt = intro + ' いちばん おおい あそびは どれ？';
  if (hash === 'b38b4d2428a9') q.payload.prompt = intro + ' グラフから わかることを えらぼう。';
  if (graph) attach(q.id, graph.path, graph.description);
  else {
    assert(['0d0288b30c74', '14017faba940', 'e0d7170d99d8'].includes(hash));
    attach(q.id, mealCards, cardDescription);
  }
  if (q.explanation) q.explanation = q.explanation.replaceAll('○', '人[ひと]の え');
}

// 時間は時計と時刻の線で表す。求める時刻の針や経過時間は描かない。
function clock(h: number, m: number, x: number, y = 120, r = 88, emphasis: 'hour' | 'minute' = 'minute') {
  let body = `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" ${line}/>`;
  for (let i = 0; i < 60; i++) {
    const a = (i * Math.PI) / 30,
      major = i % 5 === 0;
    body += `<path d="M${x + Math.sin(a) * (r - 3)} ${y - Math.cos(a) * (r - 3)}L${x + Math.sin(a) * (r - (major ? 13 : 7))} ${y - Math.cos(a) * (r - (major ? 13 : 7))}" ${line}/>`;
  }
  for (let i = 1; i <= 12; i++) {
    const a = (i * Math.PI) / 6;
    body += text(String(i), x + Math.sin(a) * (r - 27) - 8, y - Math.cos(a) * (r - 27) + 7, 20);
  }
  for (const [a, length, key] of [
    [(((h % 12) + m / 60) * Math.PI) / 6, r * 0.44, 'hour'],
    [(m * Math.PI) / 30, r * 0.69, 'minute'],
  ] as const)
    body += `<path d="M${x} ${y}L${x + Math.sin(a) * length} ${y - Math.cos(a) * length}" stroke="${key === emphasis ? '#c2405a' : '#273449'}" stroke-width="${key === 'hour' ? 8 : 5}" stroke-linecap="round"/>`;
  return body + `<circle cx="${x}" cy="${y}" r="5" fill="#273449"/>`;
}
const arrow = (x: number, y: number, w: number) =>
  `<path d="M${x} ${y}h${w}m-12 -9l12 9-12 9" fill="none" ${line}/>`;
function dayBand(mode: 'day' | 'morning' | 'afternoon') {
  let b = text('よなか 0じ', 18, 42, 23) + text('おひる 12じ', 315, 42, 23) + text('よなか 0じ', 636, 42, 23);
  for (let i = 0; i < 24; i++)
    b += rect(
      40 + i * 30,
      85,
      30,
      65,
      (mode === 'morning' ? i < 12 : mode === 'afternoon' ? i >= 12 : true) ? '#ffd447' : '#eaf3f7',
    );
  b += text('ひとめもりは 1じかん', 230, 208, 25);
  return b;
}
const timeKinds = [
  [
    '0001',
    '174ef3720d17',
    'hour-turn',
    'ながい はりが 12から みぎまわりに 1しゅう。時計には 1ぷんごとの めもりがあります。',
    clock(12, 0, 240) +
      `<circle cx="240" cy="120" r="108" fill="none" stroke="#3d8ef0" stroke-width="3"/><path d="M338 113L358 113 348 131Z" fill="#3d8ef0"/>` +
      arrow(380, 130, 130) +
      text('1じかん', 530, 123) +
      text('なんぷん？', 530, 167),
  ],
  [
    '0002',
    '20b263830591',
    'short-hand-turn',
    'みじかい はりが 12から みぎまわりに 1しゅう。1から12の めもりを たどります。',
    clock(12, 0, 240, 120, 88, 'hour') +
      `<circle cx="240" cy="120" r="108" fill="none" stroke="#c2405a" stroke-width="3"/><path d="M338 113L358 113 348 131Z" fill="#c2405a"/>` +
      arrow(380, 130, 130) +
      text('みじかい はり', 520, 112) +
      text('1しゅう', 550, 153),
  ],
  [
    '0003',
    '4a71d5b0e8de',
    'seven-plus-hour',
    '7じの 時計から、1じかん あとへ すすみます。あとの 時こくは はてな。',
    clock(7, 0, 220) +
      arrow(350, 130, 140) +
      text('1じかん あと', 360, 65) +
      rect(545, 70, 160, 115) +
      text('？じ', 590, 142, 38),
  ],
  [
    '0004',
    '5a7abd71fe07',
    'one-day',
    'よなか0じから、おひる12じを とおり、つぎの よなか0じまで。ひとめもりは1じかん。',
    dayBand('day'),
  ],
  [
    '0005',
    '612e979848da',
    'morning',
    'よなか0じから おひる12じまでを 黄色の帯で示しています。',
    dayBand('morning'),
  ],
  [
    '0006',
    'c58ed39dd4eb',
    'afternoon',
    'おひる12じから つぎの よなか0じまでを 黄色の帯で示しています。',
    dayBand('afternoon'),
  ],
] as const;
for (const [id, hash, name, description, body] of timeKinds) {
  const path = asset(name, description, body);
  attach(`sansu.g2.jikan.legacy-${id}`, path, description);
  attach(legacy(5, hash), path, description);
}
for (const [hash, label] of [
  ['06349eb0f9b8', '2じかん あと'],
  ['23685fb07ce2', '45ふん あと'],
  ['c3b026af04b5', '1じかん30ぷん まえ'],
] as const)
  draw(
    legacy(5, hash),
    `time-${hash}`,
    `いまは3じ45ふん。${label}の 時こくを もとめます。`,
    clock(3, 45, 200) +
      arrow(340, 130, 130) +
      text(label, 333, 60, 24) +
      rect(525, 80, 230, 100) +
      text('？じ ？ふん', 548, 140, 30),
  );
for (const [hash, start, end, first, last] of [
  ['03cbdc1af393', 19 * 60 + 45, 21 * 60 + 30, 'ごご7じ45ふん', 'ごご9じ30ぷん'],
  ['b3ccde0d99f4', 6 * 60 + 15, 7 * 60 + 30, 'ごぜん6じ15ふん', 'ごぜん7じ30ぷん'],
  ['dc0838b681eb', 8 * 60, 14 * 60 + 15, 'ごぜん8じ', 'ごご2じ15ふん'],
] as const) {
  let body = text(first, 40, 45) + text(last, 535, 45) + `<path d="M80 130H720" ${line}/>`;
  for (let t = start; t <= end; t += 15) {
    const x = 80 + ((t - start) / (end - start)) * 640;
    body += `<path d="M${x} 115V145" ${line}/>`;
  }
  body += text('ひとめもりは 15ふん', 250, 202) + text('かかった じかんは ？', 250, 240, 24);
  draw(
    legacy(5, hash),
    `elapsed-${hash}`,
    `${first}から${last}まで。時こくの線の ひとめもりは15ふん。`,
    body,
  );
}

// かさの単位は実際の容器と区切りで示す。変換先の合計値は印字しない。
let capacity =
  text('ぜんぶで 1L', 60, 48) +
  text('たて 1れつで 1dL', 390, 75, 25) +
  text('ちいさな 1ますは 10mL', 390, 132, 25);
for (let row = 0; row < 10; row++)
  for (let col = 0; col < 10; col++)
    capacity += rect(70 + col * 25, 65 + row * 16, 25, 16, col === 0 ? '#80c6ff' : '#eaf3f7');
capacity += `<path d="M70 232v12h25v-12" fill="none" ${line}/>`;
const capacityDescription =
  '1Lの容器を たて10れつ、よこ10だんに 区切った図。たて1れつが1dL、小さな1ますが10mL。';
const capacityPath = asset('litre-grid', capacityDescription, capacity);
for (const id of [
  'sansu.g2.kasa.legacy-0001',
  'sansu.g2.kasa.legacy-0005',
  ...[
    '0785f6726328',
    '8f3a71f01a85',
    '3f861efa7bf3',
    '65e8475445ff',
    '71c82bb90ecb',
    '7450bd5585db',
    '7ad53f3a21f5',
    'd897207aa07b',
  ].map((h) => legacy(8, h)),
])
  attach(id, capacityPath, capacityDescription);
for (const id of ['sansu.g2.kasa.legacy-0004', legacy(8, '8bbb919d843b')]) {
  choiceImage(
    id,
    'c1',
    'milk-large',
    '大きな 牛乳パック',
    `<path d="M55 45L76 12H124L145 45V148H55Z" fill="#fff" ${line}/><path d="M55 45H145M76 12L98 45V148" fill="none" ${line}/>${rect(102, 60, 35, 60, '#80c6ff')}`,
  );
  choiceImage(
    id,
    'c2',
    'milk-school',
    'きゅうしょくの 小さな 牛乳パック',
    `<path d="M67 95L82 72H118L133 95V148H67Z" fill="#fff" ${line}/><path d="M67 95H133M82 72L97 95V148" fill="none" ${line}/>${rect(102, 107, 22, 27, '#80c6ff')}`,
  );
  choiceImage(
    id,
    'c3',
    'juice-can',
    'かんジュース',
    `${rect(67, 60, 66, 88, '#ffd447')}<ellipse cx="100" cy="60" rx="33" ry="9" fill="#d2d7e2" ${line}/><ellipse cx="100" cy="60" rx="12" ry="4" fill="#fff" ${line}/><circle cx="100" cy="110" r="17" fill="#f2a93b" ${line}/>`,
  );
  choiceImage(
    id,
    'c4',
    'small-bottle',
    '小さな ペットボトル',
    `<path d="M85 48V68L67 85V148H133V85L115 68V48Z" fill="#c8f4ff" ${line}/>${rect(85, 39, 30, 14, '#3d8ef0')}${rect(69, 100, 62, 28, '#fff')}`,
  );
}

// 長さは等間隔の目盛り。実物大ではなく、同じ図の中で比率をそろえる。
let ruler = text('1cm', 340, 45) + rect(50, 100, 700, 90, '#fff3a3');
for (let i = 0; i <= 10; i++)
  ruler += `<path d="M${50 + i * 70} 100v${i === 0 || i === 10 ? 55 : 30}" ${line}/>`;
ruler += text('0', 43, 225) + text('1cm', 698, 225) + `<path d="M50 75V60H750V75" fill="none" ${line}/>`;
const rulerPath = asset(
  'centimetre-ticks',
  '0から1cmまでを 10こに 区切った ものさし。いちばん小さい めもり1つぶんを くらべます。',
  ruler,
);
for (const hash of ['44ca21730e41', 'f6a41e8cca46'])
  attach(legacy(6, hash), rulerPath, '0から1cmまでを10こに区切ったものさし。');
let metre = text('1m の ものさし', 285, 45) + rect(50, 90, 700, 70, '#fff3a3');
for (let i = 0; i <= 10; i++)
  metre += `<path d="M${50 + i * 70} 90v${i === 0 || i === 10 ? 50 : 30}" ${line}/>`;
metre +=
  `<path d="M50 180v18h70v-18" fill="none" ${line}/>` +
  text('10cm', 48, 234) +
  text('おなじ ながさで 10こに わける', 235, 225, 24);
const metrePath = asset('metre-ticks', '1mのものさしを、10cmずつ10こに区切った図。', metre);
for (const q of all.filter((q) => q.unit.endsWith('math-2-15') && q.type === 'text-input'))
  attach(q.id, metrePath, '1mのものさしを、10cmずつ10こに区切った図。');

// 具体物を囲んで「1つ分」と「いくつ分」を区別する。
function groups(name: string, description: string, n: number, each: number, icon: string, label: string) {
  assert(n >= 1 && n <= 5 && each >= 1 && each <= 8);
  const w = 760 / n;
  let body = '';
  for (let i = 0; i < n; i++) {
    const x = 20 + i * w,
      size = each > 4 ? 34 : 42,
      cols = each > 4 ? 2 : Math.min(2, each);
    body += `<g data-group-count="${each}">${rect(x, 15, w - 10, 230)}${text(label, x + 10, 45, 23)}`;
    for (let j = 0; j < each; j++)
      body += use(icon, x + 12 + (j % cols) * (size + 8), 67 + Math.floor(j / cols) * (size + 7), size);
    body += '</g>';
  }
  return asset(name, description, body);
}
for (const [unit, hash, name, n, each, icon, label, description] of [
  [13, '19eeb2d42e58', 'two-four', 4, 2, 'apple', '2こずつ', '2こずつの りんごの まとまりが4つ。'],
  [13, '8ba0c806b648', 'four-five', 5, 4, 'apple', '4こずつ', '4こずつの りんごの まとまりが5つ。'],
  [
    13,
    '9cd2a04a370d',
    'apples-per-person',
    4,
    3,
    'apple',
    '1にんぶん',
    '1にんぶんの りんごが3こ。それが4にんぶん。',
  ],
  [
    19,
    '8ba020917a6a',
    'car-passengers',
    3,
    4,
    'person',
    '1だいぶん',
    '1だいに4にん のれる くるまが3だい。囲み1つが くるま1だいぶん。',
  ],
  [19, 'f23f64530705', 'five-candy-bags', 5, 8, 'candy', '1ふくろ', '1ふくろに あめが8こ。それが5ふくろ。'],
] as const)
  attach(legacy(unit, hash), groups(name, description, n, each, icon, label), description);
draw(
  legacy(13, '805f3df9f146'),
  'three-juice-bottles',
  '5dLずつの ジュースが3本。',
  Array.from({ length: 3 }, (_, i) => {
    const x = 100 + i * 240;
    return `<path d="M${x + 35} 30V60L${x + 10} 85V225H${x + 130}V85L${x + 105} 60V30Z" fill="#ffd447" ${line}/>${rect(x + 35, 20, 70, 20, '#3d8ef0')}${text('5dL', x + 40, 145, 30)}`;
  }).join(''),
);
const appleRow = (counts: number[], labels: string[]) =>
  counts
    .map(
      (n, row) =>
        `<g data-group-count="${n}">${text(labels[row]!, 25, 62 + row * 115, 24)}${Array.from({ length: n }, (_, i) => use('apple', 235 + i * 48, 25 + row * 115, 42)).join('')}</g>`,
    )
    .join('');
draw(
  legacy(11, '81937b0c4297'),
  'addition-order',
  '上は りんご2こと3こ、下は3こと2こ。たす じゅんばんを かえた図。',
  appleRow([5, 5], ['2こ ＋ 3こ', '3こ ＋ 2こ']) +
    `<path d="M327 20V80M375 135V195" stroke="#c2405a" stroke-width="3" stroke-dasharray="5 4"/>`,
);
function arrayBody(cols: number, rows: number, x: number, y: number) {
  return `<g data-group-count="${cols * rows}">${Array.from({ length: cols * rows }, (_, i) => use('apple', x + (i % cols) * 48, y + Math.floor(i / cols) * 48, 40)).join('')}</g>`;
}
draw(
  legacy(14, '2d37edbd04ed'),
  'multiply-turn',
  '左は 1だんに3こで2だん。右は1だんに2こで3だん。同じりんごの並べ方を変えた図。',
  text('3 × 2', 110, 42) +
    arrayBody(3, 2, 90, 76) +
    arrow(310, 130, 120) +
    text('2 × 3', 550, 42) +
    arrayBody(2, 3, 530, 65),
);
draw(
  legacy(14, '382d88aa9dd4'),
  'multiply-next-group',
  '1つぶんが3この まとまり。2つぶんから、3こ入りの まとまりをもう1つふやす例。',
  text('3こずつ 2つぶん', 40, 42) +
    arrayBody(3, 2, 80, 70) +
    arrow(300, 130, 100) +
    text('もう 1つぶん', 470, 42) +
    arrayBody(3, 3, 490, 65) +
    `<rect x="478" y="153" width="157" height="54" rx="6" fill="none" stroke="#c2405a" stroke-width="3" stroke-dasharray="7 5"/>`,
);

// 百・千のまとまりは位ごとに並べ、合計の数字は書かない。
function place(id: string, name: string, counts: number[]) {
  const values = [1000, 100, 10, 1],
    cell = 190;
  let body = '';
  for (let i = 0; i < 4; i++) {
    const x = 20 + i * cell;
    body += rect(x, 12, 180, 235) + text(`${values[i]}の まとまり`, x + 12, 43, 21);
    for (let j = 0; j < counts[i]!; j++)
      body +=
        rect(x + 12 + (j % 3) * 53, 60 + Math.floor(j / 3) * 53, 46, 43, i % 2 ? '#80c6ff' : '#ffd447') +
        text(
          String(values[i]),
          x + 16 + (j % 3) * 53,
          86 + Math.floor(j / 3) * 53,
          values[i] === 1000 ? 16 : 19,
        );
    if (!counts[i]) body += text('なし', x + 60, 140, 26);
  }
  const desc = values.map((v, i) => `${v}のまとまりが${counts[i]}こ`).join('、') + '。';
  draw(id, name, desc, body);
}
for (const [unit, hash, counts] of [
  [7, '0a42bf41f7f9', [0, 7, 0, 8]],
  [7, '6345fd84c6ff', [0, 3, 6, 5]],
  [7, '70ccf8f934e1', [0, 9, 1, 4]],
  [16, '58c5f0f7f9fb', [2, 8, 5, 1]],
  [16, '964d32b0ff14', [4, 3, 7, 9]],
  [16, 'b1b0796b5505', [3, 1, 0, 7]],
  [16, 'ea34d5d396f4', [8, 0, 0, 5]],
] as const)
  place(legacy(unit, hash), `place-${hash}`, [...counts]);
for (const [hash, n] of [
  ['1ffa9ec437be', 12],
  ['fa9c3380a02b', 30],
] as const) {
  const description = `100のまとまりが${n}こ。10こずつ枠に入っています。`;
  let body = '';
  for (let group = 0; group < Math.ceil(n / 10); group++) {
    const x = 18 + group * 260;
    body += rect(x, 15, 244, 230);
    for (let j = 0; j < Math.min(10, n - group * 10); j++)
      body +=
        rect(x + 12 + (j % 2) * 115, 26 + Math.floor(j / 2) * 42, 104, 34, '#80c6ff') +
        text('100', x + 42 + (j % 2) * 115, 51 + Math.floor(j / 2) * 42, 24);
  }
  draw(legacy(16, hash), `hundreds-${n}`, description, body);
}

// 形の名称は、実物・頂点・辺の位置と対応させる。
const shapeBase = `<path d="M70 200L175 48 290 200Z" fill="#fff3a3" ${line}/>${rect(440, 55, 260, 145, '#c8f4ff')}`;
draw(
  legacy(12, '43d4514f24ce'),
  'shape-vertices',
  '三角形と四角形の、かどの点を丸と矢印で示した図。',
  shapeBase +
    [
      [70, 200],
      [175, 48],
      [290, 200],
      [440, 55],
      [700, 55],
      [440, 200],
      [700, 200],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#c2405a" ${line}/>`)
      .join('') +
    arrow(310, 55, 103),
);
draw(
  legacy(12, 'a62de1e0a80e'),
  'shape-edges',
  '三角形と四角形の、まわりの直線の1本を太線と矢印で示した図。',
  shapeBase +
    `<path d="M70 200H290M440 200H700" stroke="#c2405a" stroke-width="8"/>` +
    text('この 直線', 300, 245, 24),
);
for (const [c, name, w, h, decor] of [
  ['c1', 'origami', 130, 130, ''],
  ['c2', 'postcard', 90, 130, rect(110, 30, 16, 22, '#e5484d')],
  ['c3', 'notebook', 105, 140, '<path d="M60 15V155" stroke="#3d8ef0" stroke-width="6"/>'],
  [
    'c4',
    'newspaper',
    145,
    112,
    '<path d="M40 60H160M40 80H160M40 100H160M40 120H160" stroke="#71869b" stroke-width="4"/>',
  ],
] as const)
  choiceImage(
    legacy(12, '3c28766a1c49'),
    c,
    name,
    get(legacy(12, '3c28766a1c49')).payload.choices!.find((x) => x.id === c)!.text,
    rect((200 - w) / 2, (160 - h) / 2, w, h, c === 'c1' ? '#ff8fb1' : '#fff3a3') + decor,
  );

// 分数の読み方も、等分した全体と1つ分を並べて確かめられるようにする。
function fraction(n: number, x: number, y: number, w = 280, h = 120) {
  return Array.from({ length: n }, (_, i) =>
    rect(x + (i * w) / n, y, w / n, h, i === 0 ? '#ffd447' : '#fff'),
  ).join('');
}
for (const [hash, n] of [
  ['6a31345deb9e', 4],
  ['bd5116ba0ddb', 2],
] as const)
  draw(
    legacy(17, hash),
    `fraction-read-${n}`,
    `同じ大きさに${n}つに分け、1つぶんに色をつけた図。`,
    fraction(n, 200, 60, 400, 140),
  );
draw(
  legacy(17, 'b8fb1fbdea33'),
  'fraction-examples',
  '左は2つに等分したうちの1つ、右は4つに等分したうちの1つに色をつけた図。',
  fraction(2, 55, 70) + fraction(4, 455, 70),
);

// 文章題の棒の長さは共通の縮尺。未知の量は「？」、既知の量だけに数値を付ける。
function bars(
  id: string,
  name: string,
  top: string,
  a: number,
  bottom: string,
  b: number,
  mode: 'more' | 'less' | 'difference',
  unit: string,
) {
  const low = mode === 'more' ? a + b : mode === 'less' ? a - b : b,
    scale = 475 / Math.max(a, low),
    x = 245;
  const description =
    mode === 'difference'
      ? `${top}が${a}${unit}、${bottom}が${b}${unit}。ちがいをもとめます。`
      : `${top}が${a}${unit}。${bottom}は${b}${unit}${mode === 'more' ? 'おおい' : 'すくない'}。${bottom}の量は はてな。`;
  draw(
    id,
    name,
    description,
    text(top.replaceAll('学校', 'がっこう'), 18, 73, 21) +
      rect(x, 40, a * scale, 48, '#80c6ff') +
      text(`${a}${unit}`, x + 12, 73, 24) +
      text(bottom.replaceAll('学校', 'がっこう'), 18, 169, 21) +
      rect(x, 136, low * scale, 48, '#ffd447') +
      text(mode === 'difference' ? `${b}${unit}` : '？', x + 12, 169, 24) +
      `<path d="M${x + Math.min(a, low) * scale} 101V118H${x + Math.max(a, low) * scale}V101" fill="none" ${line}/>` +
      text(
        mode === 'difference' ? 'ちがいは ？' : `${b}${unit} ${mode === 'more' ? 'おおい' : 'すくない'}`,
        x,
        233,
        24,
      ),
  );
}
for (const [hash, name, top, a, bottom, b, mode, unit] of [
  ['23b8993c1b39', 'bottle-comparison', 'かなさん', 500, 'ひかるくん', 100, 'more', 'mL'],
  ['3807e869ad38', 'school-comparison', 'あきさんの学校', 150, 'となりの学校', 20, 'more', 'にん'],
  ['9cdeb26c6ef4', 'height-growth', '2ねんせい', 110, '1ねんせい', 100, 'difference', 'cm'],
  ['d1488ab9023c', 'height-comparison', 'おかあさん', 160, 'まなさん', 53, 'less', 'cm'],
  ['dad5e5ef231f', 'ants-increase', 'つぎの ひ', 25, 'はじめの ひ', 16, 'difference', 'ひき'],
  ['dbee8038ebff', 'pen-price', 'かった おみせ', 200, 'となりの おみせ', 50, 'less', 'えん'],
] as const)
  bars(legacy(19, hash), name, top, a, bottom, b, mode, unit);
for (const [hash, name, start, events, end] of [
  ['3efcab6542a2', 'give-gummies', 'グミ 30こ', ['10こ あげる', '8こ あげる'], 'のこりは ？こ'],
  ['5a00d142127a', 'snow-changes', 'ゆき 15cm', ['6cm とける', '8cm つもる'], 'いまは ？cm'],
  ['6082693fbe5e', 'money-changes', '200えん', ['80えん つかう', '50えん もらう'], 'いまは ？えん'],
] as const) {
  draw(
    legacy(19, hash),
    name,
    `${start}から、${events.join('、')}。さいごの量をもとめる図。`,
    rect(20, 80, 200, 100, '#80c6ff') +
      text(start, 35, 140, 25) +
      arrow(225, 130, 130) +
      text(events[0], 235, 60, 22) +
      rect(365, 80, 70, 100) +
      text('？', 383, 143, 32) +
      arrow(440, 130, 130) +
      text(events[1], 450, 215, 22) +
      rect(580, 80, 200, 100, '#ffd447') +
      text(end, 590, 140, 23),
  );
}
for (const [hash, name, total, rest, unit, label] of [
  ['5b5e4894a82d', 'chocolate-given', 20, 6, 'こ', 'あげた かずは ？'],
  ['fdb899f8ad22', 'money-spent', 150, 60, 'えん', 'つかった おかねは ？'],
] as const) {
  const w = (640 * (total - rest)) / total;
  draw(
    legacy(19, hash),
    name,
    `はじめは${total}${unit}。そのうち のこりが${rest}${unit}。のこり以外の部分を はてなで示しています。`,
    text(`はじめは ${total}${unit}`, 260, 50) +
      rect(70, 90, w, 80, '#ffd447') +
      rect(70 + w, 90, 640 - w, 80, '#80c6ff') +
      text('？', 90, 142, 32) +
      text(`${rest}${unit}`, 85 + w, 142, 26) +
      text(label, 230, 225, 26),
  );
}
draw(
  legacy(19, 'a52da8f480a5'),
  'age-three-times',
  'いもうとの3さいを1つぶんとして、はやとさんは同じ大きさの3つぶん。',
  text('いもうと', 25, 75) +
    rect(230, 40, 160, 55, '#80c6ff') +
    text('3さい', 265, 77) +
    text('はやとさん', 25, 170) +
    Array.from({ length: 3 }, (_, i) => rect(230 + i * 160, 135, 160, 55, '#ffd447')).join('') +
    text('3つぶんで ？さい', 300, 238),
);

assert.equal(signature(), before, 'Do not change answers, learning targets or quarantine status');
for (const s of sets) writeFileSync(s.file, JSON.stringify(s.questions, null, 2) + '\n');
const review = all.map((q) => {
  const p = q.payload;
  const missing =
    q.tags?.includes('runtime:quarantined-missing-context') ||
    (!p.promptImage &&
      !p.template &&
      /^(つぎのけいさん|つぎの けい算|つぎのかけざん|ひっさんをかいて|九九|□に|次.*漢字|かん字|こたえを もとめる「しき」)/.test(
        p.prompt,
      ));
  const decision = changed.has(q.id)
    ? 'illustrated'
    : p.promptImage || p.choices?.some((c) => c.image)
      ? 'existing-visual'
      : missing
        ? 'missing-source-context'
        : 'symbol-practice';
  return {
    id: q.id,
    decision,
    reason:
      changed.get(q.id) ??
      (decision === 'existing-visual'
        ? '既存の図版を維持'
        : decision === 'missing-source-context'
          ? '元の式・図・条件が不足。原資料確認が必要なため推測で補完しない'
          : '記号・式・数の読み取り自体を学ぶ練習として維持'),
  };
});
writeFileSync('scripts/data/sansu-g2-visual-review.json', JSON.stringify(review, null, 2) + '\n');
console.log(`${changed.size} of ${all.length} questions illustrated`);
