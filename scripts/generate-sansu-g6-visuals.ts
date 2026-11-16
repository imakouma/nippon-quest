/** 小6の教材に具体物と図を追加する。正解や不足した問題条件は生成しない。 */
import { strict as assert } from 'node:assert';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { pictureSvg } from '../src/questions/renderers/shared/pictures';

const dir = 'assets/questions/sansu/g6/visuals';
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
for (const key of ['orange', 'peach', 'banana'] as const)
  icons[key] = `<g transform="scale(4)">${pictureSvg(key)
    .replace(/^<svg[^>]*>/, '')
    .replace('</svg>', '')}</g>`;
for (const [key, file] of [
  ['person', 'family-bread'],
  ['candy', 'share-candy'],
  ['chocolate', 'children-chocolate'],
  ['pencil', 'count-pencils-5'],
  ['car', 'cars-8-leave-5'],
] as const) {
  const svg = readFileSync(`assets/questions/sansu/g1/visuals/${file}.svg`, 'utf8');
  const match = svg.match(new RegExp(`<symbol id="${key}" viewBox="0 0 64 64">([\\s\\S]*?)</symbol>`));
  assert(match, key);
  icons[key] = match[1]!;
}
icons.rice =
  '<path d="M14 6h36l-5 12q18 32 5 40H14Q1 50 19 18z" fill="#efd1a7" stroke="#273449" stroke-width="2"/><path d="M20 19h24M32 28v22m0-15l-8-6m8 13l10-7" stroke="#7a5230" stroke-width="3" fill="none"/>';
icons.shirt =
  '<path d="M20 8l12 6 12-6 18 15-10 12-8-5v28H20V30l-8 5L2 23z" fill="#80c6ff" stroke="#273449" stroke-width="2"/>';
icons.bag =
  '<rect x="10" y="20" width="44" height="40" rx="4" fill="#efd1a7" stroke="#273449" stroke-width="2"/><path d="M22 24V12q10-15 20 0v12" fill="none" stroke="#273449" stroke-width="3"/>';
icons.juice =
  '<path d="M15 8h34l-4 50H20z" fill="#ffb64c" stroke="#273449" stroke-width="2"/><path d="M33 40V3h20" fill="none" stroke="#273449" stroke-width="3"/>';
icons.fish =
  '<path d="M5 30q22-34 45 0-23 34-45 0m45 0l12-15v30z" fill="#80c6ff" stroke="#273449" stroke-width="2"/><circle cx="18" cy="25" r="3"/>';
icons.lettuce =
  '<path d="M32 58Q2 58 7 30Q1 12 22 9Q35-7 46 10Q65 8 58 30Q68 55 32 58" fill="#8fe36f" stroke="#273449" stroke-width="2"/><path d="M32 55V15m0 30L16 24m16 14l16-16" fill="none" stroke="#2a7a36" stroke-width="3"/>';
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
  return `questions/sansu/g6/visuals/${name}.svg`;
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
const sets = readdirSync('content/questions/sansu/g6')
  .sort()
  .map((d) => {
    const file = `content/questions/sansu/g6/${d}/set-001.json`;
    return { file, questions: JSON.parse(readFileSync(file, 'utf8')) as Question[] };
  });
const all = sets.flatMap((s) => s.questions);
assert.equal(all.length, 193, 'Review new/deleted questions before regenerating');
const answerRepairs = new Map<string, string[]>();
const choiceRepairs = new Map<string, { id: string; text: string }[]>();
const signature = () =>
  JSON.stringify(
    all.map((q) => [
      q.id,
      q.type,
      q.grade,
      q.unit,
      q.tags,
      q.payload.answer,
      answerRepairs.get(q.id) ?? q.payload.answers,
      (choiceRepairs.get(q.id) ?? q.payload.choices)?.map((c) => [c.id, c.text]),
    ]),
  );
const before = signature();
const changed = new Map<string, string>();
const get = (id: string) => {
  const q = all.find((q) => q.id === id);
  assert(q, id);
  return q;
};
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
const arrow = (x: number, y: number, w: number) =>
  `<path d="M${x} ${y}h${w}m-12 -9l12 9-12 9" fill="none" ${line}/>`;
const objects = (key: string, n: number, x: number, y: number, cols: number, size = 35) =>
  `<g data-count="${n}">${Array.from({ length: n }, (_, i) => use(key, x + (i % cols) * (size + 4), y + Math.floor(i / cols) * (size + 4), size)).join('')}</g>`;
const polygon = (points: string, fill = '#c8f4ff') => `<polygon points="${points}" fill="${fill}" ${line}/>`;
const byHash = (hash: string) => {
  const q = all.find((q) => q.id.endsWith(hash));
  assert(q, hash);
  return q;
};
function drawHash(hash: string, name: string, description: string, body: string, height = 260) {
  draw(byHash(hash).id, name, description, body, height);
}
function cube(labels: string[]) {
  return (
    polygon('260,95 330,55 480,55 410,95', '#eaf3f7') +
    polygon('410,95 480,55 480,205 410,245', '#80c6ff') +
    rect(260, 95, 150, 150, '#c8f4ff') +
    text(labels[0]!, 290, 275, 24) +
    text(labels[1]!, 495, 160, 24) +
    text(labels[2]!, 220, 48, 24)
  );
}

for (const hash of ['146ac196a443', '628778091ecb'])
  drawHash(
    hash,
    `symmetry-line-${hash}`,
    '左右が折り重なる図形。中央の縦の直線を赤い破線で示す。',
    polygon('400,40 490,110 460,210 340,210 310,110') +
      `<path d="M400 20V240" stroke="#c2405a" stroke-width="4" stroke-dasharray="8 6"/><path d="M320 75Q400-5 480 75m-15-6l15 6-4-16" fill="none" ${line}/>` +
      text('折り重ねる', 515, 115),
  );
for (const hash of ['5de930abf5df', '7b43764bb9a2'])
  drawHash(
    hash,
    `symmetry-point-${hash}`,
    '平行四辺形を中心の点のまわりに180度回すと重なる。中心を赤い点で示す。',
    polygon('290,70 530,70 470,210 230,210') +
      `<circle cx="380" cy="140" r="6" fill="#c2405a"/><path d="M260 35Q560-20 560 205m-10-12l10 12 8-13" fill="none" ${line}/>` +
      text('180° 回す', 570, 100, 28),
  );

for (const hash of ['1b47a5379c91', '76886e123974'])
  drawHash(
    hash,
    `variable-square-${hash}`,
    '4辺が等しい正方形。1辺をx cmとする。',
    rect(300, 40, 170, 170, '#c8f4ff') + text('x cm', 350, 242) + text('x cm', 500, 135),
  );
drawHash(
  '07e97bce5691',
  'apple-profit',
  'りんご1こを50円で仕入れ、70円で売る。個数はx、利益はy円。',
  use('apple', 75, 70, 85) +
    rect(215, 55, 200, 125) +
    text('仕入れ 50円', 235, 105, 25) +
    arrow(430, 115, 90) +
    rect(540, 55, 215, 125, '#ffe0a6') +
    text('売値 70円', 565, 105, 25) +
    text('りんご x こ　　利益 y 円', 225, 235),
);
drawHash(
  '8a233ebb05dc',
  'apple-variable',
  'りんごは1こ80円。xこ買ったときの代金はy円。',
  use('apple', 150, 55, 110) +
    text('1こ80円', 145, 205) +
    arrow(300, 115, 190) +
    text('x こ買う', 335, 75) +
    rect(530, 65, 200, 110) +
    text('代金 y 円', 550, 130),
);
drawHash(
  '28b68745535e',
  'money-variable',
  '持っていた1000円を、使ったx円と残ったy円に分ける図。各部分の長さは一例。',
  text('はじめのお金 1000円', 230, 45) +
    rect(100, 80, 250, 90, '#ffe0a6') +
    rect(350, 80, 350, 90, '#c8f4ff') +
    text('使う x 円', 155, 135) +
    text('残り y 円', 440, 135),
);
drawHash(
  '504739e422c6',
  'candy-variable',
  'あめ24こ。x人で等しく分け、1人分をyことする。人数や分配結果の答えは示していない。',
  objects('candy', 24, 40, 35, 8, 40) +
    arrow(405, 125, 95) +
    use('person', 550, 60, 80) +
    text('x 人で 分ける', 500, 185) +
    text('1人分 y こ', 510, 225),
);
drawHash(
  'dc9abb303caf',
  'shirt-discount',
  '服の元の値段x円を10等分した帯。そのうち2つ分を値引きし、残りが売値y円。',
  use('shirt', 25, 65, 95) +
    text('元の値段 x 円', 300, 35) +
    Array.from({ length: 10 }, (_, i) => rect(160 + i * 56, 70, 56, 60, i < 8 ? '#80c6ff' : '#ffd1b8')).join(
      '',
    ) +
    text('売値 y 円', 290, 185) +
    text('2割引き', 610, 185, 24),
);

// 等分の図は常に同じ1の大きさを使う。積や商の答えは塗り分けない。
function strips(values: [number, number][], caption: string) {
  const wholes = Math.max(...values.map(([n, d]) => Math.ceil(n / d))),
    width = 530 / wholes;
  let body = text(caption, 135, 25, 22);
  values.forEach(([n, d], r) => {
    const y = 50 + r * 65;
    body += text(`${n}/${d}`, 35, y + 30, 25);
    for (let j = 0; j < Math.ceil(n / d); j++)
      body +=
        `<g data-denominator="${d}" data-whole-width="${width}">` +
        Array.from({ length: d }, (_, i) =>
          rect(145 + j * (width + 5) + (i * width) / d, y, width / d, 38, j * d + i < n ? '#80c6ff' : '#fff'),
        ).join('') +
        '</g>';
  });
  return body;
}
const arithmeticHashes = [
  '1e40bc4dec54',
  '2911de821182',
  '4b0aeb8bd013',
  '4f3f00f1f4e1',
  '6a29ee48837e',
  '6d8e2bb16cb0',
  '8db0971fa074',
  '93498e7e14df',
  '9e50035c8b6d',
  'a676bbefc5aa',
  'd88bef6ff10c',
  'e26c0a21801b',
  '05cb6d155eb3',
  '16f378313dac',
  '1e510081ff3f',
  '60aaa7d61cf6',
  '763c0aa897df',
  '9683fdb57e2f',
  '9d3dd713ec78',
  'b1f05e9a9a83',
  'd7653c3482cc',
];
const asFraction = (s: string): [number, number] =>
  s.includes('/')
    ? (s.split('/').map(Number) as [number, number])
    : s.includes('.')
      ? [Number(s.replace('.', '')), 10 ** s.split('.')[1]!.length]
      : [Number(s), 1];
function separate(q: Question, expected: number, suffix = '') {
  const p = q.payload,
    answers = p.answers!.length === 1 ? p.answers![0]!.split(',') : p.answers!;
  assert.equal(answers.length, 2);
  assert(Math.abs(Number(answers[0]) / Number(answers[1]) - expected) < 1e-9, q.id);
  answerRepairs.set(q.id, p.answers!);
  p.answers = answers;
  p.template = `分子 {{INPUT}} ／ 分母 {{INPUT}}${suffix}`;
}
for (const hash of arithmeticHashes) {
  const q = byHash(hash),
    expr = q.payload.prompt.match(/。\s*([\d./×÷]+)\s*=/)![1]!;
  const terms = expr.split(/[×÷]/),
    ops = expr.match(/[×÷]/g)!;
  const values = terms.map(asFraction);
  const value = values.reduce(
    (v, [n, d], i) => (i === 0 ? n / d : ops[i - 1] === '×' ? (v * n) / d : v / (n / d)),
    0,
  );
  separate(q, value);
  // 整数倍・整数での分割は元の量だけを図示する。3項の式は各値を並べる。
  const shown = values.filter(([, d], i) => i === 0 || d !== 1);
  draw(
    q.id,
    `fraction-${hash}`,
    `計算に使う量${shown.map(([n, d]) => `${n}/${d}`).join('、')}を示す。枠1つの大きさは共通。${expr}の答えは示していない。`,
    strips(shown, '計算する量を 同じ大きさの1で 表した図') +
      (shown.length < values.length
        ? text(`${values[1]![0]} ${ops[0] === '×' ? 'こ分を考える' : '等分した1つ分を考える'}`, 230, 205, 26)
        : ''),
  );
}
for (const [hash, value, body, suffix, description] of [
  [
    '22ce312d446f',
    2 / 15,
    polygon('300,50 450,50 400,230 250,230') +
      `<path d="M450 50v180h-50" fill="none" stroke="#c2405a" stroke-width="2" stroke-dasharray="6 4"/><path d="M436 230v-14h14" fill="none" ${line}/>` +
      text('底辺 1/3 cm', 240, 255, 24) +
      text('高さ 2/5 cm', 465, 150, 24),
    ' cm²',
    '底辺1/3cm、高さ2/5cmの平行四辺形。高さは底辺に垂直な線。',
  ],
  [
    '34776e601258',
    4 / 21,
    rect(320, 30, 56, 216, '#c8f4ff') + text('横 2/9 cm', 275, 280, 24) + text('縦 6/7 cm', 420, 145, 24),
    ' cm²',
    '縦6/7cm、横2/9cmの長方形。',
  ],
  [
    '59343703e0ea',
    3 / 10,
    cube(['9/25 cm', '5/16 cm', '8/3 cm']) + text('辺の長さは模式図', 540, 250, 19),
    ' cm³',
    '縦8/3cm、横9/25cm、高さ5/16cmの直方体の模式図。',
  ],
  ['9b34c0cc97ee', 8 / 27, cube(['2/3 cm', '2/3 cm', '2/3 cm']), ' cm³', '1辺2/3cmの立方体。'],
] as const) {
  const q = byHash(hash);
  separate(q, value, suffix);
  draw(q.id, `fraction-shape-${hash}`, description, body, 300);
}
for (const [hash, n, d, unit, to] of [
  ['1d72e231155c', 1, 4, '分', '秒'],
  ['2b4dd3693c57', 2, 3, '時間', '分'],
  ['a67f18d54eb4', 1, 2, '時間', '分'],
] as const) {
  drawHash(
    hash,
    `time-${hash}`,
    `1${unit}を${d}等分し、${n}つ分が青。1${unit}は60${to}。`,
    strips([[n, d]], `1${unit} ＝ 60${to}`) +
      text(`青い部分 ${n}/${d} ${unit}`, 200, 160, 28) +
      text(`何${to}に なるかな？`, 230, 220, 28),
  );
}

// 比の1つ分は同じ幅。小分けの個数は空欄のまま。
function ratioParts(a: number, b: number, aLabel: string, bLabel: string, total: string) {
  const width = 600 / (a + b);
  return (
    text(total, 240, 35, 28) +
    Array.from(
      { length: a + b },
      (_, i) =>
        `<g data-ratio-part="${i < a ? 'takuma' : 'brother'}">${rect(100 + i * width, 65, width, 65, i < a ? '#c8f4ff' : '#ffe0a6')}</g>`,
    ).join('') +
    text(`${aLabel}（${a}）`, 120, 175, 25) +
    text(`${bLabel}（${b}）`, 110 + a * width, 220, 25)
  );
}
drawHash(
  '6a2c98a49876',
  'ratio-chocolate',
  'チョコレート42こ。たくま4、弟3の比で分けるため、同じ大きさのまとまり7つを下に示す。各まとまりの個数は空欄。',
  objects('chocolate', 42, 30, 15, 21, 30) +
    `<g transform="translate(0 95)">${ratioParts(4, 3, 'たくま', '弟', '全部で42こ')}</g>`,
  340,
);
drawHash(
  'a464db537a47',
  'ratio-money',
  '全部で600円。たくと2、弟1の比。帯を同じ幅の3つに分ける。',
  ratioParts(2, 1, 'たくと', '弟', '全部で600円'),
);
function bottles(left: string, right: string, caption: string) {
  return (
    text(caption, 190, 30, 25) +
    [0, 1]
      .map(
        (i) =>
          `<path d="M${200 + i * 350} 65v145h100V65" fill="#fff" ${line}/>` +
          rect(200 + i * 350, 140 - i * 17.5, 100, 70 + i * 17.5, i ? '#ffe0a6' : '#c8f4ff') +
          text(i ? 'サラダ油' : 'す', 195 + i * 350, 55, 23) +
          text(i ? right : left, 195 + i * 350, 245, 27),
      )
      .join('')
  );
}
drawHash(
  '769fbfa86ead',
  'dressing-amounts',
  'す40mL、サラダ油50mLを、容器の絵と量のラベルで示す。',
  bottles('40mL', '50mL', '2つの量を くらべよう'),
);
drawHash(
  'fcb5c51f270e',
  'dressing-ratio',
  'すとサラダ油は4対5。サラダ油300mLに対するすの量を求める。',
  bottles('？mL', '300mL', 'す：サラダ油 ＝ 4：5'),
);
drawHash(
  'fe2efb3616ea',
  'football-ratio',
  'サッカーコートは縦4、横3の比。縦100m、横は未知。',
  rect(300, 30, 150, 200, '#d8efc7') +
    `<path d="M300 130H450" ${line}/><circle cx="375" cy="130" r="25" fill="none" ${line}/>` +
    text('縦 100m（4）', 470, 135, 24) +
    text('横 ？m（3）', 280, 260, 24),
  280,
);
for (const [hash, a, b, left, right] of [
  ['1578daec4d1a', 5, 6, '25', '？'],
  ['1858b4ff752a', 3, 11, '？', '44'],
  ['4335f38bf005', 9, 27, '1', '？'],
  ['53b644ac1706', 14, 49, '？', '7'],
  ['cf985ceaff5c', 7, 3, '91', '？'],
] as const) {
  const w = 510 / Math.max(a, b);
  drawHash(
    hash,
    `equivalent-ratio-${hash}`,
    `もとの比${a}対${b}の2本の帯。それぞれが${left}と${right}に対応する。`,
    text('同じ割合で 大きさを変える', 200, 30, 25) +
      rect(90, 60, a * w, 55, '#c8f4ff') +
      text(String(a), 105, 98, 28) +
      text(`→ ${left}`, 640, 98, 28) +
      rect(90, 160, b * w, 55, '#ffe0a6') +
      text(String(b), 105, 198, 28) +
      text(`→ ${right}`, 640, 198, 28),
  );
}
for (const [hash, cm] of [
  ['049176cc2663', '0.5'],
  ['45ef7b9abd0f', '0.5'],
  ['b21487bbe77b', '2'],
  ['ee904343473d', '1'],
] as const) {
  drawHash(
    hash,
    `map-scale-${hash}`,
    `2万5千分の1に縮めた地図。地図の${cm}cmと実際の長さが対応する。${hash === 'ee904343473d' ? 'この割合の名前を問う。' : '実際の長さは空欄。'}`,
    rect(35, 30, 250, 180, '#edf5e5') +
      `<path d="M55 180l80-70 115 70" fill="none" stroke="#79ae64" stroke-width="12"/><path d="M85 150h140" stroke="#c2405a" stroke-width="4"/>` +
      text(`地図 ${cm}cm`, 65, 245, 25) +
      arrow(325, 130, 120) +
      text('1：25000', 320, 70, 26) +
      rect(500, 55, 245, 135, '#eaf3f7') +
      text('実際の長さ', 535, 100) +
      text(hash === 'ee904343473d' ? '25000cm' : '？m', 550, 155, 32),
  );
}
for (const [hash, r] of [
  ['04668d8907ed', '2cm'],
  ['a2e929d32d94', '5cm'],
  ['5a221514122d', '半径'],
] as const)
  drawHash(
    hash,
    `circle-area-${hash}`,
    `円の半径を赤い線で示す。${r}。青い部分の面積を考える。`,
    `<circle cx="350" cy="130" r="95" fill="#c8f4ff" ${line}/><path d="M350 130h95" stroke="#c2405a" stroke-width="4"/><circle cx="350" cy="130" r="4"/>` +
      text(r, 370, 110, 26) +
      text('青い部分の 面積', 490, 200, 25),
  );
drawHash(
  '35928a01856e',
  'semicircle-area',
  '直径6cmの半円。直径の中心を点で示す。',
  `<path d="M220 185a140 140 0 0 1 280 0z" fill="#c8f4ff" ${line}/><circle cx="360" cy="185" r="4"/>` +
    text('直径 6cm', 300, 230, 28),
);
drawHash(
  '02b939b26c8c',
  'hexagonal-volume',
  '六角柱。底面積20平方センチメートル、高さ8cm。',
  polygon('260,70 310,40 410,40 460,70 410,100 310,100', '#ffe0a6') +
    polygon('260,70 310,100 310,230 260,200') +
    rect(310, 100, 100, 130, '#80c6ff') +
    polygon('410,100 460,70 460,200 410,230') +
    text('底面積 20cm²', 240, 28, 24) +
    `<path d="M500 55v175m-8-175h16m-16 175h16" ${line}/>` +
    text('高さ 8cm', 525, 155, 25),
);

// 資料の例は全員の記録を示し、代表値の答えを強調しない。
for (const hash of ['1c29829accf2', '9197a4c0b137', '90d63d386b4a'])
  drawHash(
    hash,
    `data-example-${hash}`,
    '例として5人の記録2、4、4、6、9を小さい順に並べる。特定の値を強調していない。',
    text('れい：5人の 記録を 小さい順に', 170, 35, 26) +
      [2, 4, 4, 6, 9]
        .map(
          (n, i) =>
            rect(70 + i * 140, 65, 120, 140) +
            use('person', 95 + i * 140, 80, 65) +
            text(String(n), 115 + i * 140, 185, 30),
        )
        .join(''),
  );
for (const [hash, hist] of [
  ['594e99c92c46', true],
  ['70bdd7a4898d', false],
] as const) {
  const counts = [1, 3, 4, 2, 1];
  let body = text('れい：記録の ちらばり', 235, 30, 25) + `<path d="M125 55v155h550" fill="none" ${line}/>`;
  counts.forEach((n, i) => {
    body += hist
      ? rect(145 + i * 100, 210 - n * 35, 100, n * 35, '#80c6ff')
      : Array.from(
          { length: n },
          (_, j) => `<circle cx="${195 + i * 100}" cy="${190 - j * 33}" r="10" fill="#1f4fa3"/>`,
        ).join('');
    body += text(hist ? `${i * 5}〜` : String(i * 5), 165 + i * 100, 240, 22);
  });
  drawHash(
    hash,
    `data-distribution-${hash}`,
    hist
      ? '例の柱状グラフ。記録を5ずつの区間に分け、区間ごとの人数を高さで示す。'
      : '例のドットプロット。丸1つが1人分の記録で、同じ値を縦に積む。',
    body,
  );
}
drawHash(
  'fd06ef0bbff8',
  'number-interval',
  '10以上15未満の範囲。10の端は塗った丸、15の端は白い丸。',
  `<path d="M80 130H730" ${line}/><path d="M150 130H650" stroke="#3d8ef0" stroke-width="12"/>` +
    Array.from(
      { length: 6 },
      (_, i) => `<path d="M${150 + i * 100} 110v40" ${line}/>` + text(String(10 + i), 135 + i * 100, 190, 28),
    ).join('') +
    `<circle cx="150" cy="130" r="11" fill="#1f4fa3"/><circle cx="650" cy="130" r="11" fill="#fff" stroke="#1f4fa3" stroke-width="4"/>` +
    text('以上', 125, 70) +
    text('未満', 625, 70),
);

function relationTable(top: string, bottom: string, values: string[], illustration: string) {
  const width = 600 / values.length;
  let body = illustration;
  [top, bottom].forEach((label, r) => {
    body += rect(15, 145 + r * 45, 170, 45) + text(label, 23, 174 + r * 45, 18);
    values.forEach(
      (v, c) =>
        (body +=
          rect(185 + c * width, 145 + r * 45, width, 45, '#fff') +
          text(r === 0 ? String(c + 1) : v, 200 + c * width, 175 + r * 45, 24)),
    );
  });
  return body;
}
const tank = rect(50, 35, 120, 90, '#c8f4ff') + text('5L / 1分', 220, 90, 27);
const car = use('car', 50, 30, 100) + text('40km / 1時間', 210, 90, 27);
const rectangle = rect(80, 25, 130, 95, '#c8f4ff') + text('横 3cm', 250, 80, 28);
for (const [hash, top, bottom, values, body] of [
  [
    '0dea44d82c7a',
    '長さ（m）',
    '重さ（kg）',
    ['①', '4', '②', '③', '10'],
    rect(70, 40, 240, 35, '#a3aabb') + text('1m の重さ 2kg', 390, 90, 26),
  ],
  ['762f8811fff0', '時間（分）', '水の量（L）', ['5', '①', '15', '②', '③'], tank],
  ['784e2613eb27', '時間（時間）', '道のり（km）', ['①', '80', '120', '②', '③'], car],
  ['9dfc941fa652', '縦（cm）', '面積（cm²）', ['①', '②', '③', '12', '15'], rectangle],
  [
    'a3176b883657',
    '縦（cm）',
    '横（cm）',
    ['①', '6', '4', '3', '②', '③'],
    rect(70, 20, 180, 105, '#c8f4ff') + text('面積は いつも12cm²', 330, 80, 25),
  ],
  [
    'd6897dce29e9',
    '人数（人）',
    '1人分（L）',
    ['24', '①', '8', '6', '②', '③'],
    use('juice', 100, 20, 85) + text('24Lを 等しく 分ける', 280, 85, 28),
  ],
] as const) {
  const q = byHash(hash);
  q.payload.template = '① {{INPUT}}　② {{INPUT}}　③ {{INPUT}}';
  if (hash === 'a3176b883657')
    q.payload.prompt =
      '面積[めんせき]が12cm²の長方形[ちょうほうけい]です。表[ひょう]の①〜③にあてはまる横の長さを求めよう。';
  draw(
    q.id,
    `table-${hash}`,
    `${top}の1から${values.length}に対応する${bottom}を表に整理。下段は${values.join('、')}。①〜③は答える空欄。`,
    relationTable(top, bottom, [...values], body),
  );
}
for (const [hash, body, desc] of [
  [
    '60f7b24a85f0',
    car + arrow(80, 175, 600) + text('時間 x 時間　→　道のり y km', 200, 235),
    '車は1時間で40km進む。時間xと道のりyの対応。',
  ],
  [
    'c9c02fee9e72',
    tank + arrow(80, 175, 600) + text('時間 x 分　→　水の量 y L', 200, 235),
    '1分に5Lずつ水を入れる。時間xと水の量yの対応。',
  ],
  [
    '69eb5eda5b64',
    objects('candy', 20, 45, 20, 10, 37) + text('x 人で 等しく 分ける → 1人分 y こ', 140, 220),
    'あめ20こをx人で等しく分け、1人分をyことする。',
  ],
] as const)
  drawHash(hash, `relation-${hash}`, desc, body);
for (const [hash, inverse] of [
  ['1a613dba29a9', true],
  ['35508423c21f', false],
] as const) {
  drawHash(
    hash,
    `relation-change-${hash}`,
    inverse
      ? '上段の量が1倍、2倍、3倍に増えると、下段は1倍、2分の1倍、3分の1倍になる例。'
      : '上段の量が1倍、2倍、3倍に増えると、下段も1倍、2倍、3倍になる例。',
    [1, 2, 3]
      .map(
        (n, i) =>
          text(`${n}倍`, 70 + i * 245, 35, 23) +
          rect(60 + i * 245, 55, n * 65, 40, '#c8f4ff') +
          rect(60 + i * 245, 150, inverse ? 195 / n : n * 65, 40, '#ffe0a6') +
          text(inverse ? (n === 1 ? '1倍' : `1/${n}倍`) : `${n}倍`, 70 + i * 245, 230, 25),
      )
      .join(''),
  );
}
for (const [hash, inverse] of [
  ['337d7e0826ac', false],
  ['cea54380c2ee', true],
] as const) {
  const pts = inverse
    ? Array.from({ length: 101 }, (_, i) => {
        const x = 1 + i * 0.05;
        return `${140 + x * 75},${225 - 150 / x}`;
      }).join(' ')
    : '140,225 650,55';
  drawHash(
    hash,
    `graph-${hash}`,
    inverse
      ? '反比例の例のグラフ。xが1から6へ増える間の曲線を示す。'
      : '比例の例のグラフ。原点を通る右上がりの直線を示す。',
    `<path d="M140 35v190h550" fill="none" ${line}/><polyline points="${pts}" fill="none" stroke="#1f4fa3" stroke-width="5"/>` +
      text('0', 115, 248, 22) +
      text('x', 710, 230, 24) +
      text('y', 115, 35, 24),
  );
}
// 関係を選ぶ問題では、正解だけでなく全選択肢の状況を並べる。
for (const hash of [
  '1679f1da7f39',
  '5d4e0868232a',
  'a664393671f4',
  'c6fd59d350a3',
  'e0bc64e5a688',
  'ff23e6f3babf',
]) {
  const q = byHash(hash);
  let body = '';
  for (const [i, c] of q.payload.choices!.entries()) {
    const x = 15 + i * 260;
    const t = c.text;
    let sketch = '',
      label = '';
    if (t.includes('5L')) {
      label = '毎分5Lの水';
      sketch = rect(x + 55, 80, 130, 100, '#c8f4ff');
    } else if (t.includes('500mL')) {
      label = 'ジュース500mL';
      sketch = use('juice', x + 90, 80, 85);
    } else if (t.includes('あめ')) {
      label = 'あめ20こを分ける';
      sketch = objects('candy', 20, x + 30, 75, 5, 32);
    } else if (t.includes('横3cm')) {
      label = '横3cmの長方形';
      sketch = rect(x + 65, 85, 130, 95, '#c8f4ff');
    } else if (t.includes('20L')) {
      label = '水そうを満たす';
      sketch = rect(x + 55, 80, 130, 100, '#c8f4ff') + text('20L', x + 95, 140, 25);
    } else if (t.includes('500円')) {
      label = '買い物のおつり';
      sketch = use('bag', x + 90, 80, 85) + text('商品500円', x + 65, 205, 20);
    } else if (t.includes('40km')) {
      label = '時速40kmの車';
      sketch = use('car', x + 75, 90, 100);
    } else if (t.includes('30km')) {
      label = '道のり30km';
      sketch = use('person', x + 80, 80, 75) + arrow(x + 40, 190, 170);
    } else if (t.includes('クラス')) {
      label = 'クラス全員30人';
      sketch = use('person', x + 70, 85, 60) + use('person', x + 135, 85, 60);
    } else if (t.includes('平行四辺形')) {
      label = '面積20cm²';
      sketch = polygon(`${x + 80},80 ${x + 220},80 ${x + 170},180 ${x + 30},180`);
    } else {
      assert(t.includes('三角形'));
      label = '面積20cm²';
      sketch = polygon(`${x + 125},75 ${x + 210},185 ${x + 40},185`);
    }
    body += rect(x, 15, 250, 230, '#f5f9fc') + text(label, x + 18, 50, 20) + sketch;
  }
  draw(
    q.id,
    `relation-options-${hash}`,
    'すべての選択肢にある状況を並べた絵。正しい関係は強調していない。',
    body,
  );
}

for (const [hash, digits, slots] of [
  ['279fa37becfc', [0, 1, 2], 3],
  ['4b5863b0b571', [0, 1, 2], 2],
  ['65033030f83c', [0, 1, 2, 3], 3],
  ['69d6b8bdb13a', [1, 2, 3], 2],
  ['8fdd4aae9d85', [1, 2, 3], 3],
] as const) {
  drawHash(
    hash,
    `cards-${hash}`,
    `数字カード${digits.join('、')}から${slots}枚を選んで並べる。答えの並べ方は示していない。`,
    digits
      .map(
        (n, i) =>
          rect(60 + i * 155, 25, 110, 100, '#ffe0a6') +
          `<text x="${100 + i * 155}" y="95" font-size="48" data-digit="${n}">${n}</text>`,
      )
      .join('') +
      Array.from(
        { length: slots },
        (_, i) => rect(190 + i * 145, 160, 120, 75, '#fff') + text('？', 230 + i * 145, 210, 30),
      ).join(''),
  );
}
for (const [hash, n, k, roles] of [
  ['15d68311fec9', 3, 2, ['団長', '副団長']],
  ['ccbe613d231c', 4, 3, ['図書', '放送', '体育']],
  ['d168cfd846b3', 4, 2, ['班長', '副班長']],
  ['2eae84cc0e0e', 5, 3, []],
  ['50e7977387d5', 6, 2, []],
  ['d5b48ad1615a', 4, 3, []],
] as const) {
  const names = ['まさし', 'さおり', 'みく', 'ゆうた'];
  drawHash(
    hash,
    `people-selection-${hash}`,
    `${n}人から${k}人を選ぶ。${roles.length ? `役割は${roles.join('、')}。` : '同じ役割なので選ぶ順番は区別しない。'}選び方の結果は描いていない。`,
    Array.from(
      { length: n },
      (_, i) =>
        use('person', 50 + i * 115, 25, 75) +
        text(roles.length ? names[i]! : String(i + 1), 50 + i * 115, 125, 22),
    ).join('') +
      Array.from(
        { length: k },
        (_, i) => rect(160 + i * 170, 160, 145, 75, '#fff') + text(roles[i] ?? '？', 180 + i * 170, 208, 25),
      ).join(''),
  );
}

// 旧データのqtext_templateを原資料の問題番号で照合した20問だけを復元する。
const sourceCorrections = JSON.parse(readFileSync('scripts/data/sansu-g6-source-repairs.json', 'utf8')) as {
  id: string;
  source: { contentId: string; subSectionOrder: string; questionNumber: string; questionId: string };
  finding: string;
  prompt?: string;
  choices?: string[];
  fractionAnswer?: [number, number];
  suffix?: string;
  explanation?: string;
}[];
assert.equal(sourceCorrections.length, 21);
const sourceReviewed = new Map(sourceCorrections.map((r) => [r.id, r]));
for (const r of sourceCorrections) {
  const q = get(r.id);
  if (r.prompt) q.payload.prompt = r.prompt;
  if (r.explanation) q.explanation = r.explanation;
  if (r.fractionAnswer) separate(q, r.fractionAnswer[0] / r.fractionAnswer[1], r.suffix);
  if (r.choices) {
    const choices = q.payload.choices!;
    const correctIndex = choices.findIndex((c) => c.id === q.payload.answer);
    assert.equal(choices[correctIndex]!.text, r.choices[correctIndex]);
    assert.equal(r.choices.length, choices.length);
    choiceRepairs.set(q.id, choices);
    q.payload.choices = choices.map((c, i) => ({ ...c, text: r.choices![i]! }));
  }
}

drawHash(
  '064f0be02d26',
  'symmetry-line-properties',
  '線対称な台形。中央の軸と、対応する点AとBを結ぶ線を示す。交点はM。',
  polygon('280,60 520,60 590,200 210,200') +
    `<path d="M400 25V230" stroke="#c2405a" stroke-width="4" stroke-dasharray="8 6"/><path d="M245 130H555" fill="none" ${line}/>` +
    [245, 400, 555].map((x) => `<circle cx="${x}" cy="130" r="5"/>`).join('') +
    text('A', 215, 125) +
    text('M', 410, 120) +
    text('B', 565, 125) +
    text('対称の軸', 435, 35, 22),
);
drawHash(
  '5c7bc62997cc',
  'symmetry-point-properties',
  '点対称な平行四辺形。対応する頂点AとBを結ぶ線と、その間にある点Oを示す。',
  polygon('250,80 600,80 550,200 200,200') +
    `<path d="M250 80L550 200" fill="none" ${line}/><circle cx="400" cy="140" r="6" fill="#c2405a"/>` +
    text('A', 225, 66) +
    text('B', 555, 225) +
    text('O', 408, 132),
);

for (const [hash, values] of [
  [
    '350742bfbbc4',
    [
      [5, 2],
      [7, 4],
    ],
  ],
  [
    '3f37cc35e0f6',
    [
      [15, 8],
      [25, 7],
      [7, 16],
    ],
  ],
  [
    'ba6d3d429270',
    [
      [7, 5],
      [21, 10],
    ],
  ],
] as [string, [number, number][]][]) {
  drawHash(
    hash,
    `restored-mixed-${hash}`,
    `帯分数を仮分数に直した量${values.map(([n, d]) => `${n}/${d}`).join('、')}。枠1つが1で、答えは示していない。`,
    strips(values, '枠1つが1。色つきの部分が計算する量'),
  );
}
for (const [hash, minutes] of [
  ['7af63ede6c3e', 15],
  ['b46ba27c2b46', 10],
  ['c7e70d5bef36', 24],
] as const) {
  drawHash(
    hash,
    `time-${minutes}-minutes`,
    `1時間を60個の1分に等分した帯。そのうち${minutes}分を青く示す。分数の答えは示していない。`,
    text('全体：1時間 = 60分', 250, 45, 28) +
      Array.from(
        { length: 60 },
        (_, i) =>
          `<rect data-minute="${i + 1}" x="${90 + i * 10}" y="85" width="10" height="60" fill="${i < minutes ? '#80c6ff' : '#fff'}" stroke="#273449"/>`,
      ).join('') +
      text('0分', 75, 180, 22) +
      text('60分', 660, 180, 22) +
      text(`色つき：${minutes}分`, 280, 225),
  );
}
for (const [hash, a, b, labelA, labelB] of [
  ['0003f834b146', 0.3, 6, '0.3', '6'],
  ['0475b7014f1e', 40, 10, '40', '10'],
  ['2c2ebe308727', 1 / 3, 1 / 9, '1/3', '1/9'],
  ['6b550af8178d', 15, 21, '15', '21'],
  ['84d190bf58bf', 68, 17, '68', '17'],
  ['97ac545842e7', 40, 50, '40', '50'],
  ['c610a527fcd1', 4, 10, '4', '10'],
] as const) {
  const scale = 500 / Math.max(a, b);
  drawHash(
    hash,
    `restored-ratio-${hash}`,
    `${labelA}と${labelB}を同じ尺度の帯で比較する図。比の値や等しい比の答えは示していない。`,
    text('同じ尺度で2つの量を比べよう', 180, 35, 24) +
      [a, b]
        .map(
          (v, i) =>
            text(i === 0 ? labelA : labelB, 55, 100 + i * 90, 28) +
            `<rect data-ratio-value="${v}" x="175" y="${65 + i * 90}" width="${v * scale}" height="55" fill="${i === 0 ? '#80c6ff' : '#ffe0a6'}" ${line}/>`,
        )
        .join(''),
  );
}
drawHash(
  'e5da9f91183c',
  'prism-volume-properties',
  '同じ面積の層が積み重なった角柱。青い底の面を①、積み重ねた方向の長さを②で示す。',
  rect(250, 70, 200, 140) +
    polygon('250,70 300,40 500,40 450,70', '#eaf3f7') +
    polygon('450,70 500,40 500,180 450,210', '#ffe0a6') +
    Array.from(
      { length: 4 },
      (_, i) => `<path d="M250 ${98 + i * 28}H450l50 -30" fill="none" ${line}/>`,
    ).join('') +
    polygon('250,210 450,210 500,180 300,180', '#80c6ff') +
    `<path d="M535 70h20m-10 0v140m-10 0h20" fill="none" ${line}/>` +
    text('①', 345, 248, 30) +
    text('②', 565, 135, 30),
);
drawHash(
  '5b5250351724',
  'relation-metal-rod',
  '1mあたり2kgの金属のぼう。ぼう全体の長さをx m、重さをy kgとした模式図。',
  text('1mあたり 2kg', 290, 45, 28) +
    rect(180, 95, 440, 55, '#bcc8d8') +
    `<path d="M180 175v15h440v-15" fill="none" ${line}/>` +
    text('長さ x m', 330, 225) +
    text('重さ y kg', 330, 85, 24),
);
drawHash(
  'a7a24237e6f2',
  'relation-rectangle-area',
  '横3cm、縦x cmの長方形。中に面積y cm²と書かれた模式図。',
  rect(260, 60, 260, 125, '#c8f4ff') +
    text('3cm', 350, 225) +
    text('x cm', 550, 130) +
    text('面積 y cm²', 310, 135),
);
drawHash(
  'aa7dcca63249',
  'relation-rectangle-fixed-area',
  '面積12cm²の長方形。縦x cm、横y cmとした模式図。',
  rect(260, 60, 260, 125, '#c8f4ff') +
    text('y cm', 350, 225) +
    text('x cm', 550, 130) +
    text('面積 12cm²', 310, 135),
);
drawHash(
  'd4f604baf9f3',
  'relation-fixed-distance',
  '出発点から到着点まで30kmの道のり。速さを時速x km、かかる時間をy時間とした図。',
  text('道のり 30km', 300, 40) +
    arrow(130, 160, 540) +
    use('car', 155, 55, 95) +
    text('時速 x km', 280, 100) +
    text('時間 y 時間', 280, 140, 22) +
    text('出発', 100, 210, 24) +
    text('到着', 640, 210, 24),
);

assert.equal(signature(), before, 'Only source-verified answer representations and distractors may change');
for (const s of sets) writeFileSync(s.file, JSON.stringify(s.questions, null, 2) + '\n');
const review = all.map((q) => {
  const p = q.payload;
  const source = sourceReviewed.get(q.id);
  const missing =
    !source &&
    (q.tags?.includes('runtime:quarantined-missing-context') ||
      (!p.promptImage && !p.template && /次の|下の文/.test(p.prompt) && !/[0-9]/.test(p.prompt)));
  const decision = changed.has(q.id)
    ? 'illustrated'
    : p.promptImage
      ? 'existing-visual'
      : missing
        ? 'missing-source-context'
        : 'symbol-practice';
  return {
    id: q.id,
    decision,
    reason:
      changed.get(q.id) ??
      (source
        ? `${source.finding}（元問題 ${source.source.questionId}）`
        : missing
          ? '元の条件・数・本文が不足しているため、推測で補わない'
          : decision === 'existing-visual'
            ? '既存の図やグラフを学習表現として維持'
            : '数式や語句そのものの理解を問う練習として維持'),
  };
});
writeFileSync('scripts/data/sansu-g6-visual-review.json', JSON.stringify(review, null, 2) + '\n');
console.log(`${changed.size} of ${all.length} questions illustrated`);
