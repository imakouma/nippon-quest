/** 小5の教材に具体物と図を追加する。正解や不足した問題条件は生成しない。 */
import { strict as assert } from 'node:assert';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { pictureSvg } from '../src/questions/renderers/shared/pictures';

const dir = 'assets/questions/sansu/g5/visuals';
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
  return `questions/sansu/g5/visuals/${name}.svg`;
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
const sets = readdirSync('content/questions/sansu/g5')
  .sort()
  .map((d) => {
    const file = `content/questions/sansu/g5/${d}/set-001.json`;
    return { file, questions: JSON.parse(readFileSync(file, 'utf8')) as Question[] };
  });
const all = sets.flatMap((s) => s.questions);
assert.equal(all.length, 333, 'Review new/deleted questions before regenerating');
const answerRepairs = new Map<string, string[]>();
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
const legacy = (n: number, hash: string) => `legacy.sansu.g5.math-5-${n}.${hash}`;
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
const objects = (key: string, n: number, x: number, y: number, cols: number, size = 40) =>
  `<g data-count="${n}">${Array.from({ length: n }, (_, i) => use(key, x + (i % cols) * (size + 5), y + Math.floor(i / cols) * (size + 5), size)).join('')}</g>`;
const polygon = (points: string, fill = '#c8f4ff') => `<polygon points="${points}" fill="${fill}" ${line}/>`;
const plain = (s: string) => s.replace(/\[[^\]]+\]/g, '');
const hashOf = (q: Question) => q.id.split('.').at(-1)!;
function cube(x: number, y: number, w: number, h: number, d: number, labels: string[]) {
  return (
    polygon(`${x},${y} ${x + d},${y - d * 0.55} ${x + w + d},${y - d * 0.55} ${x + w},${y}`, '#e2f5ff') +
    polygon(
      `${x + w},${y} ${x + w + d},${y - d * 0.55} ${x + w + d},${y + h - d * 0.55} ${x + w},${y + h}`,
      '#80c6ff',
    ) +
    rect(x, y, w, h, '#c8f4ff') +
    text(labels[0]!, x + w / 2 - 30, y + h + 35, 24) +
    text(labels[1]!, x + w + d + 12, y + h / 2, 24) +
    text(labels[2]!, x + d / 2 - 55, y - d * 0.55 - 12, 24)
  );
}
// 桁の表は値だけを置く。移動回数や倍率の答えは書かない。
for (const q of all.filter(
  (q) => q.unit.endsWith('math-5-1') && !/けいさんしましょう/.test(q.payload.prompt),
)) {
  const p = q.payload,
    values = p.prompt.match(/\d+(?:\.\d+)?/g);
  const decomposition = !!p.template;
  const nums = decomposition
    ? [p.template!.startsWith('42195') ? '42195' : '42.195']
    : values!.filter((v) => v !== '1' && v !== '1000');
  const numbers = q.id.endsWith('5f869fdc7c24') ? ['42.195'] : nums;
  const positions = ['万', '千', '百', '十', '一', '0.1', '0.01', '0.001'];
  let body = positions.map((v, i) => rect(50 + i * 88, 30, 88, 40) + text(v, 70 + i * 88, 58, 22)).join('');
  numbers.slice(0, 2).forEach((v, row) => {
    const [integer, fraction = ''] = v.split('.');
    const digits = integer!.padStart(5, ' ').split('').concat(fraction.padEnd(3, ' ').split(''));
    body += digits
      .map(
        (d, i) =>
          rect(50 + i * 88, 70 + row * 65, 88, 65, '#fff') + text(d.trim(), 82 + i * 88, 112 + row * 65, 30),
      )
      .join('');
    body += `<circle cx="490" cy="${120 + row * 65}" r="4" fill="#c2405a"/>`;
  });
  body += text(
    decomposition ? 'それぞれの くらいに いくつ あるかな？' : 'すうじの くらいを くらべよう',
    160,
    235,
    24,
  );
  draw(q.id, `place-${hashOf(q)}`, `${numbers.join('と')}を位ごとに並べた表。小数点の位置は固定。`, body);
}
for (const [hash, a, b, c] of [
  ['3fd4a3c9fc5a', '10cm', '10cm', '10cm'],
  ['5967becf37cd', '8cm', '5cm', '4cm'],
  ['970746c6bc4b', '1cm', '3cm', '？cm'],
  ['1389029cd58b', '一辺', '一辺', '一辺'],
  ['d4e6b9a796a3', '横', '高さ', 'たて'],
  ['ee9fbea1dec4', '1cm', '1cm', '1cm'],
  ['178ec61603dc', '1m', '1m', '1m'],
  ['026c09169a4e', '1cm', '1cm', '1cm'],
] as const) {
  draw(
    legacy(2, hash),
    `volume-${hash}`,
    `直方体の横${a}、高さ${b}、たて${c}を示す図。${hash === '970746c6bc4b' ? '体積は27立方センチメートル。' : ''}`,
    cube(
      230,
      95,
      a === b && b === c ? 140 : hash === '970746c6bc4b' ? 50 : 210,
      a === b && b === c ? 140 : hash === '970746c6bc4b' ? 150 : hash === '5967becf37cd' ? 131.25 : 110,
      a === b && b === c ? 70 : 90,
      [a, b, c],
    ) + (hash === '970746c6bc4b' ? text('たいせき 27cm³', 540, 210, 23) : ''),
    280,
  );
}
draw(
  legacy(4, '94e505462287'),
  'decimal-cube',
  '一辺2.2cmの立方体。',
  cube(230, 80, 135, 135, 67.5, ['2.2cm', '2.2cm', '2.2cm']),
);
draw(
  legacy(4, '6e7ce6ef3350'),
  'decimal-area',
  '横7.2cm、たて4.8cmの長方形。辺の比は実際の長さと一致。',
  rect(250, 40, 270, 180, '#c8f4ff') + text('7.2cm', 335, 250) + text('4.8cm', 540, 140),
);

// 表の上下関係を保ち、答えの欄には番号だけを置く。
function table(top: string, bottom: string, values: string[], y = 150) {
  return [top, bottom]
    .map(
      (label, r) =>
        rect(15, y + r * 45, 170, 45) +
        text(label, 24, y + r * 45 + 29, 18) +
        values
          .map(
            (v, c) =>
              rect(185 + c * 99, y + r * 45, 99, 45, '#fff') +
              text(r === 0 ? String(c + 1) : v, 218 + c * 99, y + r * 45 + 30, 24),
          )
          .join(''),
    )
    .join('');
}
const blanks = ['①', '②', '③', '④', '⑤', '⑥'];
for (const q of all.filter((q) => q.unit.endsWith('math-5-3'))) {
  const h = hashOf(q);
  let body = '',
    desc = '';
  if (/りんご/.test(q.payload.prompt)) {
    body =
      use('apple', 110, 30, 70) +
      text('1こ 80円', 190, 65) +
      rect(430, 15, 120, 90, '#efd1a7') +
      text('はこ 200円', 565, 65);
    desc = 'りんごは1こ80円、箱は1つ200円。';
  } else if (/えんぴつ/.test(q.payload.prompt)) {
    body = use('pencil', 160, 20, 85) + text('1本 60円', 300, 75);
    desc = 'えんぴつは1本60円。';
  } else if (/おもり/.test(q.payload.prompt)) {
    body =
      `<path d="M200 100l15-65h65l15 65z" fill="#80c6ff" ${line}/><circle cx="248" cy="25" r="14" fill="none" ${line}/>` +
      text('1こ 1.2kg', 340, 75);
    desc = 'おもりは1こ1.2kg。';
  } else if (/面積/.test(q.payload.prompt)) {
    body =
      rect(210, 20, 230, 100, '#c8f4ff') +
      text('24cm²', 280, 80) +
      text('たて', 135, 75) +
      text('横 ？cm', 480, 75);
    desc = '面積24平方センチメートルの長方形。たてに応じて横が変わる。図は一例。';
  } else {
    body =
      [1, 2, 3]
        .map(
          (n, i) =>
            Array.from({ length: n }, (_, j) => rect(150 + i * 210, 110 - j * 30, 65, 30, '#80c6ff')).join(
              '',
            ) + text(`${n}こ`, 160 + i * 210, 175),
        )
        .join('') + text('1この 高さ 4cm', 280, 30, 23);
    desc = '高さ4cmの積み木を1こ、2こ、3こと積み重ねた図。';
  }
  if (q.payload.answers) {
    const labels =
      h === '14344ddb86e8'
        ? ['たて（cm）', '横（cm）']
        : h === '0fb4f544efc4'
          ? ['つみ木（こ）', '高さ（cm）']
          : h === '70bf1a8451fa'
            ? ['おもり（こ）', '重さ（kg）']
            : ['数（こ・本）', '代金（円）'];
    if (h === '0fb4f544efc4')
      body = cube(170, 40, 60, 60, 35, ['4cm', '', '']) + text('1この 高さ 4cm', 350, 80);
    body += table(labels[0]!, labels[1]!, blanks);
    q.payload.template = blanks.map((b) => `${b} {{INPUT}}`).join('　');
    desc += '表の上段は1から6。下段①から⑥の空欄に答える。';
  }
  draw(q.id, `relationship-${h}`, desc, body);
}

for (const [hash, n] of [
  ['04898192d0fb', 6],
  ['524c39995cb1', 7],
  ['5dcbce6cda0e', 4],
  ['83ab4f5e9b88', 3],
  ['c74bdd367c6b', 3],
] as const) {
  const pts = Array.from({ length: n }, (_, i) => [
    400 + 105 * Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / n),
    130 + 105 * Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / n),
  ]);
  const body =
    polygon(pts.map((p) => p.join(',')).join(' ')) +
    pts
      .slice(2, -1)
      .map(
        (p) =>
          `<path d="M${pts[0]!.join(' ')}L${p.join(' ')}" fill="none" stroke="#6b6f80" stroke-width="2" stroke-dasharray="6 5"/>`,
      )
      .join('');
  draw(
    legacy(6, hash),
    `angles-${hash}`,
    `${n}角形。${n > 3 ? '1つの頂点から対角線を引き、三角形に分けた図。' : '3つの角の数値は空欄。'}`,
    body,
  );
}
draw(
  legacy(6, '8869b0ba4284'),
  'triangle-types',
  '左は正三角形、右は二等辺三角形。辺の長さに対応する形。',
  polygon('180,200 380,200 280,26.795') +
    text('正三角形', 215, 240) +
    polygon('500,200 640,200 570,35') +
    text('二等辺三角形', 480, 240),
);

// 式が完全で、解説・正解と一致する分数だけを図示する。
const fractionHashes = [
  '1017a8c9d218',
  '1dac15f6e8d7',
  '371c1b00d1d1',
  '443bea2dbd1c',
  '5a643e829ba8',
  '6463f2e7fd7b',
  '6f72f9be4857',
  '81ea94966799',
  'a590fbd0011d',
  'a914e1f7fec4',
  'cb5bb00c2add',
  'd67ff00c4f69',
];
for (const hash of fractionHashes) {
  const q = get(legacy(8, hash)),
    p = q.payload;
  const m = p.prompt.match(/(\d+)\/(\d+)\s*([+-])\s*(\d+)\/(\d+)/)!;
  assert(m);
  const a = Number(m[1]),
    b = Number(m[2]),
    c = Number(m[4]),
    d = Number(m[5]);
  const answers = p.answers!.length === 1 ? p.answers![0]!.split(',') : p.answers!;
  const result =
    answers.length === 3
      ? Number(answers[0]) + Number(answers[1]) / Number(answers[2])
      : Number(answers[0]) / Number(answers[1]);
  assert(Math.abs(result - (a / b + ((m[3] === '+' ? 1 : -1) * c) / d)) < 1e-9, hash);
  answerRepairs.set(q.id, p.answers!);
  p.answers = answers;
  p.template = (answers.length === 3 ? '整数 {{INPUT}} と ' : '') + '分子 {{INPUT}} ／ 分母 {{INPUT}}';
  const maxWholes = Math.max(Math.ceil(a / b), Math.ceil(c / d));
  const whole = 540 / maxWholes;
  let body = text('同じ 大きさの 1 を 等しく 分けた図', 180, 30, 24);
  [
    [a, b],
    [c, d],
  ].forEach(([num, den], r) => {
    body += text(`${num}/${den}`, 30, 95 + r * 100, 28);
    for (let j = 0; j < Math.ceil(num! / den!); j++)
      body +=
        `<g data-denominator="${den}" data-whole-width="${whole}">` +
        Array.from({ length: den! }, (_, i) =>
          rect(
            150 + j * (whole + 5) + (i * whole) / den!,
            60 + r * 100,
            whole / den!,
            45,
            j * den! + i < num! ? '#80c6ff' : '#fff',
          ),
        ).join('') +
        '</g>';
  });
  draw(
    q.id,
    `fraction-${hash}`,
    `${a}/${b}と${c}/${d}。どの枠も1を表し、それぞれの分母で等分。上の青い部分が${a}/${b}、下が${c}/${d}。`,
    body,
  );
}
// 平均は元の記録を横に並べる。高さの棒はゼロを基点にする。
const averages: [string, string[], string, string][] = [
  ['01b9128edae0', ['9.9', '9.6', '10.2'], '秒', '回目'],
  ['4b88b8786d56', ['10.4', '9.4', '10.2'], '秒', '回目'],
  ['28713cbd69aa', ['6', '10', '8', '9', '5'], '人', '日目'],
  ['3257fb02b85b', ['10', '6', '8', '5', '？'], '点', '人目'],
  ['3dc127a69d39', ['67', '89', '90', '72'], '点', '人目'],
  ['3ee1f47ddd77', ['6', '8', '9', '12', '3', '10'], '点', '試合目'],
  ['5636bcd951d8', ['36.2', '36', '35.8', '36.6', '36.5'], '℃', '日目'],
  ['5963dffdc599', ['300', '286', '311'], 'g', 'こ目'],
  ['ab51f5e19a6d', ['12.2', '15.3', '16.4', '11.7'], '℃', '日目'],
  ['dcb0fd7fc6d3', ['34.2', '19.4', '42.1'], 'kg', '人目'],
  ['1e46e57ee8fb', ['140.5', '152.2', '？'], 'cm', '人目'],
];
for (const [hash, values, unit, label] of averages) {
  const q = get(legacy(11, hash)),
    w = 720 / values.length;
  let body = '';
  values.forEach((v, i) => {
    const x = 40 + i * w;
    body +=
      rect(x, 25, w - 12, 180, '#f2f7fb') +
      text(`${i + 1}${label}`, x + 15, 60, 23) +
      (hash === '5963dffdc599'
        ? use('apple', x + (w - 70) / 2, 68, 70)
        : hash === 'dcb0fd7fc6d3' || hash === '1e46e57ee8fb'
          ? use('person', x + (w - 65) / 2, 65, 65)
          : rect(x + 22, 87, w - 56, 34, '#80c6ff')) +
      text(`${v}${unit}`, x + 15, 175, values.length > 4 ? 23 : 30);
  });
  const known =
    hash === '3257fb02b85b'
      ? '5人の 平均 7.2点'
      : hash === '1e46e57ee8fb'
        ? '3人の 平均 136.5cm'
        : 'ならして 同じにすると ？';
  body += text(known, 230, 245, 25);
  if (['01b9128edae0', '4b88b8786d56'].includes(hash)) q.payload.promptSpeech = plain(q.payload.prompt);
  if (hash === '1e46e57ee8fb') q.payload.template = '弟の身長 {{INPUT}}cm';
  draw(
    q.id,
    `average-${hash}`,
    `${values.map((v, i) => `${i + 1}${label}は${v}${unit}`).join('。')}。${known}`,
    body,
  );
}
// 1あたりへの対応を上下の線でそろえる。線の途中は省略記号で示す。
function perUnit(
  hash: string,
  left: string,
  right: string,
  whole: string,
  total: string,
  one: string,
  icon = 'person',
) {
  draw(
    legacy(11, hash),
    `per-unit-${hash}`,
    `${left}は${whole}、${right}は${total}。${one}あたりの${right}を求める。`,
    use(icon, 30, 80, 80) +
      text(left, 135, 65, 23) +
      text(right, 135, 170, 23) +
      [75, 180]
        .map(
          (y) => `<path d="M290 ${y}H730" ${line}/><path d="M290 ${y - 12}v24m110-24v24m330-24v24" ${line}/>`,
        )
        .join('') +
      text('0', 280, 115, 20) +
      text(one, 355, 55, 23) +
      text(whole, 645, 55, 23) +
      text('？', 380, 225, 28) +
      text(total, 630, 225, 25) +
      text('…', 530, 120, 36),
  );
}
for (const [hash, kg, yen] of [
  ['0f63319e0db4', 10, 3200],
  ['f925619621d0', 15, 4500],
] as const)
  perUnit(hash, 'お米の重さ', '代金', `${kg}kg`, `${yen}円`, '1kg', 'rice');
for (const [hash, l, km] of [
  ['18c7efbfdac7', 30, 600],
  ['75295c63d9e5', 50, 900],
] as const)
  perUnit(hash, 'ガソリン', '道のり', `${l}L`, `${km}km`, '1L', 'car');
for (const [hash, km, time] of [
  ['60a6917a5737', 20, '1時間28分'],
  ['9ba227355c61', 30, '2時間18分'],
] as const)
  perUnit(hash, '道のり', '時間', `${km}km`, time, '1km');
for (const [hash, area, people] of [
  ['516c975a519f', 2400, 910],
  ['9142178ced51', 1900, 880],
] as const)
  perUnit(hash, '面積', '人口', `${area}km²`, `${people}万人`, '1km²');

const speeds: [string, string, string, string, string][] = [
  ['00fde638b75f', '自動車', '分速500m', '10km', '？分'],
  ['03694d1112ee', '走る人', '分速80m', '2000m', '？分'],
  ['090d121c656a', '自転車', '秒速3m', '？m', '20分'],
  ['1e3460269a9e', '歩く人', '分速？m', '800m', '16分'],
  ['307c89d215d6', 'チーター', '秒速30m', '180m', '？秒'],
  ['389689b9e7d2', '新幹線', '時速250km', '500km', '？時間'],
  ['4270fca150a2', '走る人', '時速12km', '？km', '2時間半'],
  ['55d4cd7c91c3', 'ライオン', '秒速？m', '40m', '2秒'],
  ['6bbadf969e98', 'チーター', '秒速？m', '90m', '3秒'],
  ['728fca9b42e4', 'シマウマ', '秒速？m', '90m', '6秒'],
  ['8347e761af0b', '歩く人', '時速？km', '12km', '3時間'],
  ['86dc0303b91d', '自動車', '時速？km', '300km', '4時間'],
  ['8f0eb195f17f', '進む人', '時速80km', '？km', '3時間'],
  ['933dd92cebe7', '電車', '分速0.8km', '？km', '30分'],
  ['d064a287ad71', '自動車', '時速35km', '175km', '？時間'],
  ['f3eaa21b17b3', 'ライオン', '秒速20m', '？m', '20秒'],
  ['f77a8c408835', '歩く人', '分速60m', '900m', '？分'],
];
for (const [hash, who, speed, distance, time] of speeds) {
  const vehicle = /自動車/.test(who)
    ? use('car', 100, 65, 105)
    : /人/.test(who)
      ? use('person', 115, 65, 85)
      : /電車|新幹線/.test(who)
        ? rect(95, 75, 120, 65, '#80c6ff') +
          rect(110, 85, 30, 25, '#fff') +
          rect(160, 85, 30, 25, '#fff') +
          `<circle cx="120" cy="145" r="12"/><circle cx="190" cy="145" r="12"/>`
        : /自転車/.test(who)
          ? `<g fill="none" ${line}><circle cx="115" cy="125" r="25"/><circle cx="190" cy="125" r="25"/><path d="M115 125l25-45 25 45h-50m25-45h35l15 45m-20-55h20"/></g>`
          : `<g ${line} fill="${who === 'シマウマ' ? '#fff' : '#f2a93b'}"><ellipse cx="148" cy="105" rx="45" ry="25"/><circle cx="195" cy="80" r="22"/><path d="M120 120l-10 35m45-30l15 30m-65-60l-25-15" fill="none"/><circle cx="201" cy="76" r="3" fill="#172033"/>${who === 'チーター' ? '<circle cx="130" cy="100" r="3"/><circle cx="155" cy="110" r="3"/>' : who === 'シマウマ' ? '<path d="M130 85v35m20-40v45m20-40v35"/>' : '<circle cx="195" cy="80" r="28" fill="none"/>'}</g>`;
  draw(
    legacy(12, hash),
    `speed-${hash}`,
    `${who}。速さ${speed}、道のり${distance}、時間${time}。スタートからゴールへ進む図。`,
    text(who, 90, 35, 24) +
      vehicle +
      text(speed, 320, 80, 32) +
      arrow(260, 125, 450) +
      text('スタート', 60, 200, 22) +
      text('ゴール', 665, 200, 22) +
      text(`道のり ${distance}`, 295, 165, 28) +
      text(`時間 ${time}`, 295, 230, 28),
  );
}
for (const [hash, from, to] of [
  ['02b3abac2908', '1分で120m', '1秒で？m'],
  ['2104d392d4da', '1分で50m', '1時間で？km'],
  ['2c7d165887b1', '1時間で90km', '1分で？km'],
  ['e3a833dcf832', '1秒で30m', '1分で？m'],
] as const) {
  draw(
    legacy(12, hash),
    `speed-unit-${hash}`,
    `${from}を${to}に直す。時計は1分が60秒、1時間が60分のまとまりを示す。`,
    `<circle cx="125" cy="110" r="65" fill="#fff" ${line}/><path d="M125 55v55l40 20" fill="none" ${line}/>` +
      text(from, 260, 80, 32) +
      arrow(300, 125, 240) +
      text(to, 260, 185, 32) +
      text('1分 ＝ 60秒　　1時間 ＝ 60分', 200, 245, 24),
  );
}
for (const hash of ['67c1405ffb3a', '99ceaa50e373', 'd0b8f12d6701'])
  draw(
    legacy(12, hash),
    `speed-formula-${hash}`,
    '一定の速さで進む図。1時間ずつ同じ道のりを進み、全体の道のりと時間の関係を考える。',
    use('person', 35, 65, 75) +
      [0, 1, 2].map((i) => arrow(180 + i * 180, 110, 170) + text('1時間', 205 + i * 180, 155, 24)).join('') +
      text('一定の 速さ', 315, 55, 26) +
      text('全体の 道のり', 300, 225, 28),
  );
// 帯の長さを共通の尺度で描き、基準と比較する量を区別する。
function comparison(
  id: string,
  name: string,
  aLabel: string,
  aValue: string,
  bLabel: string,
  bValue: string,
  ratio: number,
  caption: string,
  icon = 'person',
) {
  const max = Math.max(1, ratio),
    w = 470 / max;
  draw(
    id,
    name,
    `${aLabel}は${aValue}、${bLabel}は${bValue}。${caption}。同じ尺度の帯で数量を比べる。`,
    use(icon, 30, 90, 75) +
      text(aLabel, 135, 50, 23) +
      rect(275, 65, w, 48, '#c8f4ff') +
      text(aValue, 285, 98, 24) +
      text(bLabel, 135, 170, 23) +
      rect(275, 180, w * ratio, 48, '#ffe0a6') +
      text(bValue, 285, 212, 24) +
      text(caption, 285, 150, 21),
  );
}
for (const [hash, a, av, b, bv, r, caption, icon] of [
  ['329fceb01942', '定員', '200人', '希望者', '？人', 0.95, '定員の0.95倍', 'person'],
  ['332dc9ecf4e1', '駅まで', '6km', '学校まで', '2.4km', 0.4, '学校までは 駅までの ？倍', 'person'],
  ['362318fb18b8', '去年', '180円', '今年', '252円', 1.4, '今年は 去年の ？倍', ''],
  ['4712d83d0dd6', 'いつも', '？円', '半額', '1480円', 0.5, 'いつもの0.5倍', 'shirt'],
  ['479976e6acb0', '去年', '？万人', '今年', '1050万人', 1.5, '去年の1.5倍', 'person'],
  ['4aadd29bfe30', '私', '150円', '弟', '60円', 0.4, '弟は 私の ？倍', 'person'],
  ['7377bc97226a', 'さとし', '4560歩', 'お父さん', '？歩', 2, 'さとしの2倍', 'person'],
  ['c92a6edc8675', '宮崎県', '？万人', '大阪府', '880万人', 8, '宮崎県の 約8倍', 'person'],
  ['e82459fd4e2d', '土曜日', '400人', '日曜日', '320人', 0.8, '日曜日は 土曜日の ？倍', 'person'],
  ['ff64e7fab1d2', 'もとの量', '650mL', '増量後', '？mL', 1.2, 'もとの量の1.2倍', 'juice'],
] as const)
  comparison(legacy(13, hash), `ratio-${hash}`, a, av, b, bv, r, caption, icon || 'lettuce');
for (const hash of ['21982a371d8b', '768dc2c0e922', 'b0a6a8e98e73'])
  comparison(
    legacy(13, hash),
    `ratio-formula-${hash}`,
    'もとにする量',
    '基準の大きさ',
    'くらべる量',
    '比べたい大きさ',
    1.5,
    '基準を1とした ときの 大きさ',
  );

for (const [hash, a, av, b, bv, r, caption, icon] of [
  ['0393683429b5', '定価', '？円', '売値', '1400円', 0.7, '定価の70%', 'shirt'],
  ['3a054be937fb', '定価', '1500円', '売値', '？円', 0.75, '定価の7割5分', 'bag'],
  ['4815d9c1d5c5', '定価', '？円', '売値', '1260円', 0.7, '定価の7割', 'bag'],
  ['62c1baeca9a6', '本体価格', '1200円', '消費税', '？円', 0.1, '本体価格の10%', 'bag'],
  ['82d6401da9d4', '定価', '3000円', '売値', '？円', 0.8, '定価の80%', 'bag'],
  ['a3cfc0738c8f', '定価', '300円', '売値', '？円', 0.9, '定価から10%引き', 'fish'],
  ['d31de89b9461', 'もとの量', '50g', '増量後', '？g', 1.2, 'もとの量から2割増量', 'candy'],
] as const)
  comparison(legacy(14, hash), `percent-${hash}`, a, av, b, bv, r, caption, icon);
draw(
  legacy(14, 'f2d756162508'),
  'class-volunteers',
  '25人を1人ずつの絵で示す。参加する15人には青い背景と参加の見出し、残り10人には白い背景と不参加の見出し。',
  rect(30, 45, 430, 195, '#c8f4ff') +
    text('参加する 15人', 100, 32, 25) +
    `<g data-participates="yes">${objects('person', 15, 85, 60, 5, 50)}</g>` +
    rect(485, 45, 285, 195, '#fff') +
    text('不参加 10人', 540, 32, 25) +
    `<g data-participates="no">${objects('person', 10, 495, 85, 5, 50)}</g>`,
);
for (const [hash, n, caption] of [
  ['b24db5b6b72f', 9, '0.09'],
  ['c2d777edea13', 20, '0.2'],
  ['e69af55bcfbc', 75, '0.75'],
] as const) {
  draw(
    legacy(14, hash),
    `percent-grid-${hash}`,
    `全体を100等分した図。青い部分は${caption}。全体の割合は1。`,
    Array.from({ length: 100 }, (_, i) =>
      rect(65 + (i % 10) * 21, 20 + Math.floor(i / 10) * 21, 21, 21, i < n ? '#80c6ff' : '#fff'),
    ).join('') +
      text(`青い部分 ${caption}`, 350, 100, 36) +
      text('全体を 1 とする', 350, 165, 26),
  );
}

// 具体物と変数の意味を結びつける。既知の表は保持し、未知の代金を埋めない。
for (const q of all.filter((q) => q.unit.endsWith('math-5-16'))) {
  const apple = /りんご/.test(q.payload.prompt),
    p = q.payload,
    h = hashOf(q);
  let body = '';
  if (apple) {
    const count = h === '6620188ba713' ? 2 : h === '83684515e4e8' ? 8 : h === 'd63278dca668' ? 10 : 1;
    body =
      objects('apple', count, 35, 30, 10, 48) +
      text('りんご 1こ150円', 50, 120, 25) +
      rect(620, 20, 110, 70, '#efd1a7') +
      text('箱 80円', 620, 120, 24);
  } else
    body =
      objects('pencil', 12, 90, 25, 12, 46) + text('はじめは12本　　使った数 ○本　　残り △本', 85, 130, 25);
  const filling = p.answers?.length === 6;
  if (
    ['1a39e3e1e03b', '56bfabb620fb', '83684515e4e8', 'a4f716eef839', 'd63278dca668', 'e95e8416b48d'].includes(
      h,
    )
  ) {
    body += table(
      apple ? 'りんご ○（こ）' : '使った ○（本）',
      apple ? '代金 △（円）' : '残り △（本）',
      filling
        ? blanks
        : apple
          ? ['230', '380', '530', '680', '830', '980']
          : ['11', '10', '9', '8', '7', '6'],
    );
    p.template = filling
      ? blanks.map((b) => `${b} {{INPUT}}`).join('　')
      : `{{INPUT}} ${apple ? '円' : '本'}`;
  }
  draw(
    q.id,
    `changing-${h}`,
    apple
      ? 'りんごの絵と箱。りんご1こ150円、箱80円。表がある場合は個数と代金を上下に対応させている。'
      : 'えんぴつ12本の絵。使った本数は○、残りは△。表がある場合は使った本数と残りを上下に対応させている。',
    body,
  );
}

for (const [hash, label, radius, unknown] of [
  ['731b48de0083', '3cm', false, false],
  ['868404b850cc', '4m', true, false],
  ['8f1a0dc8059a', '2cm', false, false],
  ['8f3bb21ecab8', '14cm', false, true],
  ['903b7a4a0c14', '20cm', false, true],
] as const) {
  const q = get(legacy(17, hash));
  draw(
    q.id,
    `circle-${hash}`,
    `円の${unknown ? '円周' : radius ? '半径' : '直径'}は${label}。${unknown ? '直径' : '円周'}を求める。`,
    `<circle cx="365" cy="130" r="95" fill="#f2f7fb" stroke="#1f4fa3" stroke-width="5"/><circle cx="365" cy="130" r="4"/><path d="M${radius ? 365 : 270} 130H460" stroke="#c2405a" stroke-width="4"/>` +
      text(unknown ? '直径 ？' : `${radius ? '半径' : '直径'} ${label}`, 285, 115, 26) +
      text(`円周 ${unknown ? label : '？'}`, 500, 210, 28),
  );
  q.payload.template = `${unknown ? '約 ' : ''}{{INPUT}}${radius ? 'm' : 'cm'}`;
}
// 隠れた辺は破線。側面数の問題では底面の全辺を見て数えられるようにする。
function prism(n: number) {
  const points = Array.from({ length: n }, (_, i) => [
    360 + 105 * Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / n),
    70 + 40 * Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / n),
  ]);
  let body = '';
  let hidden = '';
  for (let i = 0; i < n; i++) {
    const a = points[i]!,
      b = points[(i + 1) % n]!;
    if ((a[1]! + b[1]!) / 2 >= 70)
      body += polygon(
        `${a.join(',')} ${b.join(',')} ${b[0]},${b[1]! + 125} ${a[0]},${a[1]! + 125}`,
        i % 2 ? '#c8f4ff' : '#80c6ff',
      );
    else
      hidden += `<path d="M${a[0]} ${a[1]! + 125}L${b[0]} ${b[1]! + 125}" fill="none" stroke="#273449" stroke-width="2" stroke-dasharray="6 5"/>`;
  }
  body += hidden;
  for (const p of points.filter((p) => p[1]! < 70))
    body += `<path d="M${p.join(' ')}v125" fill="none" stroke="#273449" stroke-width="2" stroke-dasharray="6 5"/>`;
  body += polygon(points.map((p) => p.join(',')).join(' '), '#ffe0a6');
  return body;
}
for (const [hash, n] of [
  ['05a8c666af07', 5],
  ['2babbc1ae591', 5],
  ['3b9134453b9c', 5],
  ['8276aea9a99f', 3],
  ['93367f6c9b57', 3],
  ['bdc709e440ee', 3],
  ['5b9c6aa965d9', 4],
] as const)
  draw(
    legacy(18, hash),
    `prism-${hash}`,
    `${n}角柱。上の底面を黄色、側面を青で区別する。隠れた辺は破線。`,
    prism(n),
  );
draw(
  legacy(18, 'a14546e77879'),
  'cylinder-cut',
  '円柱。側面をたてに切る位置を赤い破線で示す。切り開いた形は示していない。',
  `<path d="M280 65v130a100 30 0 0 0 200 0V65" fill="#c8f4ff" ${line}/><ellipse cx="380" cy="65" rx="100" ry="30" fill="#ffe0a6" ${line}/><path d="M380 95v130" stroke="#c2405a" stroke-width="5" stroke-dasharray="8 5"/>` +
    text('ここを 切る', 520, 160, 26),
);

assert.equal(signature(), before, 'Only separated fraction input fields may change answers');
for (const s of sets) writeFileSync(s.file, JSON.stringify(s.questions, null, 2) + '\n');
const review = all.map((q) => {
  const p = q.payload;
  const expr = p.prompt.match(/(?:。|^)\s*(\d+(?:\.\d+)?)\s*([+＋−\-×÷])\s*(\d+(?:\.\d+)?)\s*=\s*$/);
  let inconsistent = ['87b322595f48', 'd143c05b3d36'].some((h) => q.id.endsWith(h));
  if (expr && p.answers?.length === 1 && !/四捨五入/.test(p.prompt)) {
    const a = Number(expr[1]),
      b = Number(expr[3]);
    const value =
      expr[2] === '×' ? a * b : expr[2] === '÷' ? a / b : expr[2] === '-' || expr[2] === '−' ? a - b : a + b;
    inconsistent = Math.abs(value - Number(p.answers[0])) > 1e-8;
  }
  const missing =
    /けいさんしましょう \(/.test(p.prompt) ||
    q.tags?.includes('runtime:quarantined-missing-context') ||
    (!p.promptImage &&
      !p.template &&
      /^(次の|百分率で表された次|歩合で表された次|割合.*かっこ)/.test(p.prompt) &&
      !/[0-9]/.test(p.prompt));
  const decision = changed.has(q.id)
    ? 'illustrated'
    : inconsistent
      ? 'source-expression-review'
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
      (inconsistent
        ? '表示された式と正解が不一致。旧データの欠落・結合を原資料で確認する'
        : missing
          ? '元の数・式・本文が不足。推測で補わず原資料確認が必要'
          : decision === 'existing-visual'
            ? '既存の図やグラフを維持'
            : '数式や記号そのものの練習として維持'),
  };
});
writeFileSync('scripts/data/sansu-g5-visual-review.json', JSON.stringify(review, null, 2) + '\n');
console.log(`${changed.size} of ${all.length} questions illustrated`);
