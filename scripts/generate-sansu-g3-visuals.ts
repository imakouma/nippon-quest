/** 小3の教材に具体物と図を追加する。正解や不足した問題条件は生成しない。 */
import { strict as assert } from 'node:assert';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { pictureSvg } from '../src/questions/renderers/shared/pictures';

const dir = 'assets/questions/sansu/g3/visuals';
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
  ['bag', 'cat-chair-bag'],
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
  return `questions/sansu/g3/visuals/${name}.svg`;
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
const sets = readdirSync('content/questions/sansu/g3')
  .sort()
  .map((d) => {
    const file = `content/questions/sansu/g3/${d}/set-001.json`;
    return { file, questions: JSON.parse(readFileSync(file, 'utf8')) as Question[] };
  });
const all = sets.flatMap((s) => s.questions);
assert.equal(all.length, 345, 'Review new/deleted questions before regenerating');
// 旧データの「3,8」は現行採点では38になる。解説と一致する分子・分母の入力に直す。
for (const [hash, old, answers] of [
  ['08d029c598af', '3,8', ['3', '8']],
  ['1ed3374f6fe6', '4,10', ['4', '10']],
  ['455b0e61dc70', '3,5', ['3', '5']],
  ['b7adf66adfaa', '3,4', ['3', '4']],
  ['f75a7758496a', '3,5', ['3', '5']],
  ['7f541118ffea', '7,1', ['1']],
] as const) {
  const q = all.find((q) => q.id === `legacy.sansu.g3.math-3-14.${hash}`);
  assert(q);
  assert([JSON.stringify([old]), JSON.stringify(answers)].includes(JSON.stringify(q.payload.answers)));
  q.payload.answers = [...answers];
  q.payload.template = answers.length === 1 ? '{{INPUT}}' : '{{INPUT}} / {{INPUT}}';
}
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
const legacy = (n: number, hash: string) => `legacy.sansu.g3.math-3-${n}.${hash}`;
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

const objects = (key: string, count: number, x: number, y: number, cols = 5, size = 38) =>
  `<g data-group-count="${count}">${Array.from({ length: count }, (_, i) => use(key, x + (i % cols) * (size + 4), y + Math.floor(i / cols) * (size + 3), size)).join('')}</g>`;
const arrow = (x: number, y: number, w: number) =>
  `<path d="M${x} ${y}h${w}m-12 -9l12 9-12 9" fill="none" ${line}/>`;

// 式を選ぶ問題では、本文に明記された「1人ぶん」まで図示する。
for (const [hash, fruit, label, people, each] of [
  ['595d3afaa121', 'orange', 'みかん', 3, 5],
  ['da8db88f9dca', 'apple', 'りんご', 3, 4],
  ['fd7fcaa09be0', 'peach', 'もも', 2, 4],
] as const) {
  let body = text(`${label} ${people * each}こを ${people}にんで わける`, 130, 35);
  for (let i = 0; i < people; i++) {
    const x = 25 + i * (750 / people);
    body +=
      rect(x, 60, 730 / people, 135) +
      use('person', x + 95, 65, 44) +
      objects(fruit, each, x + 12, 118, 5, 40);
  }
  draw(
    legacy(2, hash),
    `share-${fruit}`,
    `${label}${people * each}こを${people}にんで分け、1人に${each}こずつ。`,
    body,
  );
}
for (const [count, hash, duplicate] of [
  [9, '1377a7de6c7b', '0001'],
  [10, '2d849d3416cb', '0002'],
] as const) {
  const description = `りんご${count}こ。3にんに同じ数ずつ分ける。1にんぶんはまだ空らん。`;
  const path = asset(
    `apples-${count}-share`,
    description,
    text(`りんご ${count}こ`, 75, 33) +
      objects('apple', count, 40, 62, 5, 48) +
      arrow(325, 130, 80) +
      [0, 1, 2]
        .map(
          (i) =>
            rect(430 + i * 120, 60, 108, 155) +
            use('person', 456 + i * 120, 70, 54) +
            text('？こ', 451 + i * 120, 180),
        )
        .join(''),
  );
  attach(legacy(10, hash), path, description);
  attach(`sansu.g3.warizan.legacy-${duplicate}`, path, description);
}
for (const [n, hash] of [
  [9, 'd13eab95ad13'],
  [10, 'bc0e41ccdf25'],
  [11, 'eb1294fb2b9b'],
] as const) {
  draw(
    legacy(10, hash),
    `divide-${n}-by-3`,
    `りんご${n}こ。3こずつのまとまりがいくつできるか考える図。`,
    text(`りんご ${n}こ`, 50, 35) +
      objects('apple', n, 30, 55, 6, 48) +
      arrow(350, 125, 80) +
      rect(460, 55, 300, 145) +
      text('1つの まとまり', 490, 90) +
      objects('apple', 3, 515, 115, 3, 46),
  );
}
for (const [hash, duplicate, size, groups, rest] of [
  ['734c949646ba', '0003', 9, 7, 6],
  ['a85b3fc8bcb4', '0004', 4, 5, 2],
  ['ca17fd9f6bd8', '0005', 3, 6, 1],
] as const) {
  let body = text(`${size}こずつの まとまりが ${groups}つ`, 50, 30);
  for (let i = 0; i < groups; i++)
    body += rect(10 + i * 105, 45, 98, 110) + objects('apple', size, 13 + i * 105, 49, 3, 28);
  body += text(`あまり ${rest}こ`, 25, 210) + objects('apple', rest, 225, 175, 6, 42);
  const description = `りんごが${size}こずつ${groups}組、あまり${rest}こ。問題のたしかめ方を考える図。`;
  const path = asset(`remainder-${size}-${groups}-${rest}`, description, body);
  attach(legacy(10, hash), path, description);
  attach(`sansu.g3.warizan.legacy-${duplicate}`, path, description);
}
for (const [hash, name, count, daily, key, label] of [
  ['952d52fd8a94', 'candy-days', 20, 3, 'candy', 'あめ'],
  ['d1d606b8be15', 'homework-days', 50, 6, 'page', 'ページ'],
  ['cb8a02e7b9ff', 'banana-bags', 30, 4, 'banana', 'バナナ'],
] as const) {
  icons.page = `<path d="M12 5H42L53 17V59H12Z" fill="#fff" ${line}/><path d="M42 5V17H53M20 27H45M20 37H45M20 47H40" fill="none" ${line}/>`;
  draw(
    legacy(10, hash),
    name,
    `${label}${count}。${key === 'banana' ? '1ふくろ4本ずつに入れる' : `1にちに${daily}ずつ使う`}。全部を図示し、答えは示していません。`,
    text(`${label} ${count}${key === 'page' ? '' : key === 'banana' ? 'ほん' : 'こ'}`, 40, 30) +
      objects(key, count, 25, 45, 10, 29) +
      rect(480, 35, 295, 205) +
      text(
        key === 'banana' ? '1ふくろ 4ほん' : `1にち ${daily}${key === 'page' ? 'ページ' : 'こ'}`,
        500,
        75,
      ) +
      objects(key, daily, 495, 95, 3, 44),
  );
}
get(legacy(10, 'cb8a02e7b9ff')).payload.prompt =
  'バナナが30本[ほん]あります。1ふくろに4本[ほん]ずつ入[い]れて売[う]ります。4本[ほん]入[い]りのふくろは、いくつ作[つく]れますか。';
get(legacy(10, 'cb8a02e7b9ff')).payload.promptSpeech =
  'バナナが30本あります。1ふくろに4本ずつ入れて売ります。4本入りのふくろは、いくつ作れますか。図はバナナ30本と、1ふくろ4本の見本です。';

// 同じ「1」の長さを保ち、数式で与えられた部分だけ着色する。
function strip(n: number, d: number, x: number, y: number, width = 520, height = 48) {
  assert(n >= 0 && n <= d && d > 0);
  return `<g data-parts="${d}" data-shaded="${n}">${Array.from({ length: d }, (_, i) => rect(x + (i * width) / d, y, width / d, height, i < n ? '#80c6ff' : '#fff')).join('')}</g>`;
}
for (const [unit, hash, a, b, denominator, left, right] of [
  [14, '28b9d4da9499', 4, 2, 5, '4/5', '2/5'],
  [14, 'a829d365b3ec', 10, 10, 10, '1', '10/10'],
  [14, 'dd43c2ed9692', 1, 2, 3, '1/3', '2/3'],
  [15, '2a571cfd6a21', 9, 9, 10, '0.9', '9/10'],
  [15, '840b3b31643b', 6, 3, 10, '0.6', '3/10'],
] as const) {
  draw(
    legacy(unit, hash),
    `compare-${hash}`,
    `同じ長さを1とした図。上は${left}、下は${right}。どちらも${denominator}等分。`,
    text('おなじ ながさが 1', 270, 30) +
      text(left, 50, 98) +
      strip(a, denominator, 210, 60) +
      text(right, 50, 188) +
      strip(b, denominator, 210, 150),
  );
}
for (const [hash, a, b, d, op] of [
  ['08d029c598af', 5, 2, 8, '−'],
  ['1ed3374f6fe6', 1, 3, 10, '＋'],
  ['455b0e61dc70', 5, 2, 5, '−'],
  ['b7adf66adfaa', 1, 2, 4, '＋'],
  ['f75a7758496a', 4, 1, 5, '−'],
  ['7f541118ffea', 4, 3, 7, '＋'],
] as const)
  draw(
    legacy(14, hash),
    `fraction-${hash}`,
    `同じ長さを1とした${a}/${d}と${b}/${d}の図。この2つを${op === '＋' ? '足す' : '引く'}。`,
    text('どちらも おなじ ながさが 1', 220, 35) +
      text(`${a}/${d}`, 145, 85) +
      strip(a, d, 30, 110, 320, 65) +
      text(op, 383, 155, 36) +
      text(`${b}/${d}`, 585, 85) +
      strip(b, d, 450, 110, 320, 65),
  );
for (const [i, n, d] of [
  [1, 5, 5],
  [2, 1, 2],
  [3, 3, 4],
  [4, 8, 9],
])
  choiceImage(
    legacy(14, 'a3f6a26fa12e'),
    `c${i}`,
    `fraction-choice-${i}`,
    `${d}等分したうち${n}つぶん。`,
    strip(n!, d!, 10, 50, 180, 70),
  );
draw(
  legacy(15, '5275bb220bbf'),
  'decimal-one-tenth',
  '1を10等分し、0.1の部分を着色した図。',
  text('ぜんぶで 1', 300, 45) + strip(1, 10, 65, 85, 670, 85) + text('いろの ぶぶんが 0.1', 245, 225),
);

// 実物に対応した目盛り。未知の単位換算結果は書かない。
for (const [hash, amount, label, maxCm] of [
  ['1c00bc7a70f5', 76, '7cm 6mm', 8],
  ['798b14152f91', 13, '1.3cm', 2],
  ['f3ca03da5428', 8, '0.8cm', 1],
] as const) {
  const scale = 700 / (maxCm * 10);
  let body =
    text(label, 315, 35) + rect(45, 60, amount * scale, 30, '#ffd447') + rect(45, 110, 700, 95, '#fff3a3');
  for (let i = 0; i <= maxCm * 10; i++) {
    const x = 45 + i * scale;
    body += `<path d="M${x} 110v${i % 10 === 0 ? 40 : i % 5 === 0 ? 28 : 18}" ${line}/>`;
    if (i % 10 === 0) body += text(String(i / 10), x - 8, 185, 22);
  }
  body += text('cm', 750, 185, 20) + text('ちいさい 1めもりは 1mm', 235, 245, 22);
  draw(
    legacy(15, hash),
    `ruler-${amount}mm`,
    `ものさしで${label}の長さを示す。大きな目盛りは1cm、小さな目盛りは1mm。`,
    body,
  );
}
for (const [hash, dl, label] of [
  ['2c7a41ca61a6', 25, '2L 5dL'],
  ['85810f2fd6dc', 8, '8dL'],
  ['fd20af90cf51', 15, '1.5L'],
] as const) {
  let body = text(label, 340, 28) + text('ひとめもり 1dL', 275, 252, 23);
  for (let i = 0; i < Math.ceil(dl / 10); i++) {
    const x = 120 + i * 210,
      fill = Math.min(10, dl - i * 10);
    body +=
      rect(x, 65, 150, 150, '#fff') +
      `<rect x="${x + 2}" y="${215 - fill * 15}" width="146" height="${fill * 15 - 2}" fill="#80c6ff"/>` +
      text('1L', x + 55, 55, 24);
    for (let j = 1; j < 10; j++) body += `<path d="M${x} ${65 + j * 15}h25" ${line}/>`;
  }
  draw(legacy(15, hash), `water-${dl}dl`, `${label}の水。容器1つは1Lで、小さな目盛りは1dL。`, body);
}

// km/gの換算では、10個の100単位を見比べられる共通の参照図を使う。
function unitGroups(name: string, whole: string, each: string, road = false) {
  let body = text(`ぜんぶで ${whole}`, 285, 45);
  for (let i = 0; i < 10; i++)
    body += rect(40 + i * 72, 90, 72, 75, i % 2 ? '#eaf3f7' : '#80c6ff') + text(each, 43 + i * 72, 137, 18);
  if (road)
    body += `<path d="M40 190H760" stroke="#6b6f80" stroke-width="16"/><path d="M40 190H760" stroke="#fff" stroke-width="2" stroke-dasharray="15 10"/>`;
  const description = `${whole}を同じ大きさの10部分に分け、1部分が${each}であることを示す図。`;
  return { path: asset(name, description, body), description };
}
const km = unitGroups('kilometre', '1km', '100m', true);
for (const q of all.filter((q) => q.unit.endsWith('math-3-9') && !q.id.endsWith('afc9e27b8d37')))
  attach(q.id, km.path, km.description);
for (const hash of ['696e153c4086', '992e0e833854']) {
  const p = get(legacy(9, hash)).payload;
  p.template = `${hash === '696e153c4086' ? 3200 : 1500}m = {{INPUT}}km {{INPUT}}m`;
  p.prompt = '次[つぎ]の長[なが]さを、kmとmを使[つか]ってあらわそう。';
}
const kg = unitGroups('kilogram', '1kg', '100g');
for (const q of all.filter(
  (q) => q.unit.endsWith('math-3-13') && q.type === 'text-input' && !q.id.endsWith('0ef197c09fa0'),
))
  attach(q.id, kg.path, kg.description);
attach(legacy(13, '27f3ea0bdba8'), kg.path, kg.description);
const tonne = unitGroups('tonne', '1t', '100kg');
attach(legacy(13, '0ef197c09fa0'), tonne.path, tonne.description);

icons.milk = `<path d="M14 16L25 4H44L53 16V60H14Z" fill="#fff" ${line}/><path d="M14 16H53M25 4V16M44 4V16" fill="none" ${line}/><path d="M15 28H52V48H15Z" fill="#80c6ff"/><text x="23" y="42" font-size="14">1L</text>`;
icons.gum = `<path d="M8 14H56V53H8Z" fill="#8fe36f" ${line}/><path d="M8 19H56M8 48H56" ${line}/><ellipse cx="32" cy="33" rx="15" ry="8" fill="#fff" ${line}/>`;
icons.eraser = `<path d="M8 22L21 8H57V43L44 57H8Z" fill="#fff" ${line}/><path d="M8 22H44V57H8Z" fill="#80c6ff" ${line}/><path d="M44 22L57 8M44 22V57" ${line}/>`;
icons.ice = `<path d="M17 28L32 61L47 28Z" fill="#f2a93b" ${line}/><path d="M11 29C6 12 22 3 32 9C45 -2 61 17 52 29Z" fill="#ff8fb1" ${line}/>`;
const coin = (amount: number, x: number, y: number, r: number) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${amount === 1 ? '#d2d7e2' : '#e8d591'}" ${line}/><circle cx="${x}" cy="${y}" r="${r - 7}" fill="none" ${line}/><text x="${x}" y="${y + 10}" text-anchor="middle" font-size="${r * 0.7}">${amount}</text>`;
for (const hash of ['a0803fed295f', '1a719426bdce']) {
  const id = legacy(13, hash);
  choiceImage(id, 'c1', 'coin-1', '1円玉の絵。', coin(1, 100, 80, 55));
  choiceImage(id, 'c2', 'coin-500', '500円玉の絵。', coin(500, 100, 80, 55));
  choiceImage(id, 'c3', 'milk', '1Lの牛にゅうパックの絵。', use('milk', 40, 15, 125));
  choiceImage(id, 'c4', 'pencil', 'えんぴつ1本の絵。', use('pencil', 40, 15, 125));
}
// 選択肢は同じ表示枠に収め、絵の大きさで重さの答えを誘導しない。
const animalQuestion = legacy(13, 'ed4745ebc930');
choiceImage(
  animalQuestion,
  'c1',
  'giraffe',
  'キリンの絵。',
  `<g fill="#ffd447" ${line}><path d="M60 98H120L118 34L143 20L163 28L157 44H141V108L127 143H118L122 108H79L75 143H65Z"/><path d="M134 24L132 10M146 22L149 9M61 97L46 84" fill="none"/></g><g fill="#b8741f"><circle cx="78" cy="101" r="7"/><circle cx="99" cy="100" r="7"/><circle cx="128" cy="85" r="5"/><circle cx="127" cy="62" r="5"/></g><circle cx="149" cy="30" r="3"/>`,
);
choiceImage(
  animalQuestion,
  'c2',
  'watermelon',
  'スイカの絵。',
  `<ellipse cx="100" cy="85" rx="65" ry="52" fill="#4cbf4c" ${line}/><path d="M72 37Q42 85 72 133M100 33Q78 85 100 137M128 37Q110 85 128 133" fill="none" stroke="#1f5a2e" stroke-width="9"/>`,
);
choiceImage(
  animalQuestion,
  'c3',
  'desk',
  '学校のつくえの絵。',
  `<path d="M43 64V140M155 64V140" stroke="#6b6f80" stroke-width="10"/>${rect(30, 40, 140, 28, '#c08a55')}${rect(43, 69, 113, 25, '#d2d7e2')}`,
);
choiceImage(
  animalQuestion,
  'c4',
  'penguin',
  'ペンギンの絵。',
  `<ellipse cx="100" cy="83" rx="45" ry="64" fill="#273449"/><ellipse cx="100" cy="95" rx="31" ry="44" fill="#fff"/><path d="M72 135L57 148H90M110 148H143L128 135M91 48L100 61L109 48" fill="#f2a93b" ${line}/><circle cx="85" cy="42" r="4" fill="#fff"/><circle cx="115" cy="42" r="4" fill="#fff"/>`,
);

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
for (const [hash, h1, m1, h2, m2, start, end, note] of [
  ['04ffc8e1c045', 7, 45, 8, 0, 'いえを でる', 'がっこうに つく', 'かかった じかんは ？'],
  ['2545c842cd80', 10, 35, 11, 30, 'いえを でる', 'がっこうに つく', 'かかった じかんは ？'],
  ['e9aad5dc918b', 7, 45, 8, 10, 'いえを でる', 'がっこうに つく', 'かかった じかんは ？'],
  ['0df57e0c1151', 22, 0, 7, 30, 'ごご10じに ねる', 'つぎのひ ごぜん7じ30ぷん', 'よなかの12じを こえる'],
  ['8b8544a0120f', 10, 0, 15, 30, 'ごぜん10じ', 'ごご3じ30ぷん', 'おひるの12じを こえる'],
  ['98489571fd39', 20, 45, 2, 0, 'ごご8じ45ふん', 'つぎのひ ごぜん2じ', 'よなかの12じを こえる'],
  ['b474f1ff513b', 9, 0, 16, 15, 'ごぜん9じ', 'ごご4じ15ふん', 'おひるの12じを こえる'],
] as const)
  draw(
    legacy(5, hash),
    `time-${hash}`,
    `${start}の時計は${h1 % 12 || 12}時${m1}分、${end}の時計は${h2 % 12 || 12}時${m2}分。${note}。`,
    text(start, 50, 30, 22) +
      clock(h1, m1, 170) +
      arrow(285, 120, 220) +
      text('？', 378, 100, 32) +
      text(end, 490, 30, 21) +
      clock(h2, m2, 620) +
      text(note, 230, 248, 22),
  );
for (const [hash, h, m, duration, backward, first, last] of [
  ['107217fdb310', 2, 10, 25, false, 'こうえんを でる', 'いえに つく'],
  ['627f58a63aaa', 5, 15, 35, false, 'こうえんを でる', 'いえに つく'],
  ['269206acfb8e', 8, 15, 30, true, 'いえを でる', 'がっこうに つく'],
  ['406dafbd4ccd', 2, 45, 50, true, 'ひるねを はじめる', 'おきる'],
  ['53aff7719e40', 4, 5, 10, true, 'いえを でる', 'としょかんに つく'],
] as const)
  draw(
    legacy(5, hash),
    `time-${hash}`,
    `${backward ? last : first}時刻は${h}時${m}分。間の時間は${duration}分。${backward ? first : last}時刻は空らん。`,
    text(first, 65, 30, 23) +
      text(last, 525, 30, 23) +
      clock(h, m, backward ? 620 : 170) +
      rect(backward ? 90 : 540, 60, 160, 145) +
      text('？じ ？ふん', backward ? 102 : 552, 140, 24) +
      arrow(290, 130, 210) +
      text(`${duration}ふん`, 350, 105),
  );
for (const [hash, unit, hand] of [
  ['3ffe6c69cd6b', 'びょう', 'びょうしん'],
  ['55fdb3828b3b', 'ふん', 'ながい はり'],
] as const) {
  draw(
    legacy(5, hash),
    `clock-turn-${unit}`,
    `${hand}が1周する図。小さな1目盛りが1${unit}。`,
    clock(12, 0, 200) +
      `<path d="M200 17A103 103 0 1 1 183 19M176 10L185 19L173 27" fill="none" stroke="#c2405a" stroke-width="4"/>` +
      text(`${hand}が 1しゅう`, 350, 95, 25) +
      text(`1めもりが 1${unit}`, 350, 145, 25) +
      text('いくつ あるかな？', 350, 195, 24),
  );
}
const thunder = get(legacy(5, '98489571fd39')).payload;
thunder.prompt =
  'かみなりがなったときの時計[とけい]は、一回目[いっかいめ]が午後[ごご]8時[じ]45分[ふん]、二回目[にかいめ]がつぎの日[ひ]の午前[ごぜん]2時[じ]でした。間[あいだ]は何時間何分[なんじかんなんぷん]ですか。';
thunder.template = '{{INPUT}}時間{{INPUT}}分';

for (const [hash, equal, angles] of [
  ['2da36170f284', true, false],
  ['2f5fcd2f6e37', false, false],
  ['93a68da9a516', true, true],
  ['a994d16f7056', false, true],
] as const) {
  const half = equal ? 100 : 140,
    height = equal ? Math.sqrt(3) * 100 : 165;
  const x1 = 400 - half,
    x2 = 400 + half,
    y = 215,
    top = y - height;
  let body = `<path d="M${x1} ${y}L400 ${top}L${x2} ${y}Z" fill="#eaf3f7" ${line}/>`;
  if (!angles) {
    body += `<path d="M${400 - half / 2 - 8} ${(y + top) / 2 - 5}l16 10M${400 + half / 2 - 8} ${(y + top) / 2 + 5}l16 -10${equal ? 'M400 205v20' : ''}" ${line}/>`;
    body += text('おなじ しるしの へんは おなじ ながさ', 145, 250, 23);
  } else {
    const angle = Math.atan2(height, half),
      r = 32;
    body += `<path d="M${x1 + r} ${y}A${r} ${r} 0 0 0 ${x1 + r * Math.cos(angle)} ${y - r * Math.sin(angle)}M${x2 - r} ${y}A${r} ${r} 0 0 1 ${x2 - r * Math.cos(angle)} ${y - r * Math.sin(angle)}M${400 - r * Math.cos(angle)} ${top + r * Math.sin(angle)}A${r} ${r} 0 0 0 ${400 + r * Math.cos(angle)} ${top + r * Math.sin(angle)}" fill="none" stroke="#c2405a" stroke-width="4"/>`;
    body += text('かどの ひらきかたを くらべよう', 210, 250, 23);
  }
  draw(
    legacy(16, hash),
    `triangle-${hash}`,
    `${equal ? '正三角形' : '二等辺三角形'}の図。${angles ? '3つの角に弧を描き、開き方を比較する。' : '同じ長さの辺に同じ印をつけている。'}`,
    body,
  );
}

// 文章題の既知の品物・価格・順序だけを図にする。
draw(
  legacy(19, '353853d4f524'),
  'shopping-change',
  '1こ30円のおかし5こ。500円玉でしはらう。おつりは空らん。',
  text('1こ 30えん', 50, 35) +
    objects('candy', 5, 20, 65, 5, 55) +
    coin(500, 440, 110, 55) +
    arrow(510, 110, 90) +
    text('おつり', 645, 60) +
    text('？えん', 635, 130, 32),
);
for (const [hash, n, chocolate, gum] of [
  ['35d29b862f83', 4, 50, 80],
  ['7236ef42df26', 3, 30, 50],
  ['79274016ec0d', 4, 50, 80],
] as const) {
  let body = text(`1こ ${chocolate}えん`, 15, 85, 22) + text(`1こ ${gum}えん`, 15, 180, 22);
  for (let i = 0; i < n; i++)
    body +=
      rect(185 + i * 145, 20, 130, 205) +
      objects('chocolate', 1, 215 + i * 145, 40, 1, 65) +
      objects('gum', 1, 215 + i * 145, 135, 1, 65);
  draw(
    legacy(19, hash),
    `paired-shopping-${n}-${chocolate}-${gum}`,
    `${chocolate}円のチョコと${gum}円のガムの組が${n}つ。`,
    body,
  );
}
draw(
  legacy(19, '41811b3a576b'),
  'buy-then-share',
  '300円から60円の消しゴムを買い、のこりを3人に同じ金がくずつ分ける。',
  text('300えん', 30, 55) +
    coin(100, 65, 120, 28) +
    coin(100, 125, 120, 28) +
    coin(100, 95, 180, 28) +
    arrow(165, 130, 115) +
    use('eraser', 190, 35, 60) +
    text('60えん', 180, 210, 23) +
    rect(300, 85, 140, 85) +
    text('？えん', 320, 138) +
    arrow(450, 130, 85) +
    [0, 1, 2]
      .map((i) => use('person', 560 + i * 75, 55, 60) + text('？えん', 553 + i * 75, 170, 22))
      .join(''),
);
draw(
  legacy(19, 'a42c149c34d7'),
  'share-then-buy',
  '800円を2人で同じ金がくずつ分ける。たかしくんが150円のアイスを買い、のこりを求める。',
  text('800えんを 2にんで わける', 25, 35, 24) +
    [0, 1]
      .map(
        (i) =>
          rect(25 + i * 150, 55, 140, 145) +
          use('person', 65 + i * 150, 65, 55) +
          text('？えん', 48 + i * 150, 170),
      )
      .join('') +
    arrow(335, 130, 130) +
    use('ice', 365, 35, 60) +
    text('150えん', 350, 220, 23) +
    text('たかしくんの のこり', 500, 65, 23) +
    text('？えん', 580, 150, 32),
);
let candyBody = text('1にんに 8こずつ', 25, 25, 22);
for (let i = 0; i < 6; i++) {
  const x = 10 + (i % 3) * 195,
    y = 35 + Math.floor(i / 3) * 110;
  candyBody += rect(x, y, 185, 103) + objects('candy', 8, x + 10, y + 6, 4, 37);
}
candyBody += text('あまり 5こ', 610, 45, 23) + objects('candy', 5, 625, 65, 2, 48);
draw(
  legacy(19, 'a6a8f3b0cb36'),
  'candy-total',
  '6にんのまとまりに あめが8こずつ。別にあまりが5こ。全部の数は空らん。',
  candyBody,
);
for (const [hash, total, unit, label, other, base] of [
  ['0cc801110e91', 25, 'm', 'あおいさん', 'いもうと', 5],
  ['cdd3d5549b93', 32, 'さい', 'おとうさん', 'いもうと', 4],
] as const)
  draw(
    legacy(19, hash),
    `times-${hash}`,
    `${label}は${total}${unit}、${other}は${base}${unit}。同じ長さが同じ量を表す図。`,
    text(label, 20, 70) +
      strip(total / base, total / base, 230, 35, 530, 55) +
      text(`${total}${unit}`, 450, 125) +
      text(other, 20, 190) +
      rect(230, 155, (530 * base) / total, 55, '#80c6ff') +
      text(`${base}${unit}`, 240, 245, 23),
  );
const swimming = get(legacy(19, '0cc801110e91')).payload;
swimming.prompt = swimming.prompt.replace(/ 倍\[ばい\]$/, '');
swimming.template = '{{INPUT}}倍';

const tenMillion = unitGroups('hundred-million', '？', '千万');
attach(legacy(6, '8f0e8a9c0673'), tenMillion.path, '千万のまとまりが10こ。全部の数を求める図。');

assert.equal(signature(), before, 'Do not change answers, learning targets or quarantine status');
for (const s of sets) writeFileSync(s.file, JSON.stringify(s.questions, null, 2) + '\n');
const review = all.map((q) => {
  const p = q.payload;
  const missing =
    q.tags?.includes('runtime:quarantined-missing-context') ||
    (!p.promptImage &&
      !p.template &&
      /^(つぎの.*けい算|つぎの.*けいさん|次.*計算|次.*文章題|筆算|ひっさん|□に|数字)/.test(p.prompt));
  const decision = changed.has(q.id)
    ? 'illustrated'
    : missing
      ? 'missing-source-context'
      : p.promptImage || p.choices?.some((c) => c.image)
        ? 'existing-visual'
        : 'symbol-practice';
  return {
    id: q.id,
    decision,
    reason:
      changed.get(q.id) ??
      (missing
        ? '元の式・図・条件が不足。推測で図や正解を作らず原資料確認に残す'
        : decision === 'existing-visual'
          ? '既存の図・表・数直線など学習対象の表現を維持'
          : '数式・位取り・記号の読み取り練習として維持'),
  };
});
writeFileSync('scripts/data/sansu-g3-visual-review.json', JSON.stringify(review, null, 2) + '\n');
console.log(`${changed.size} of ${all.length} questions illustrated`);
