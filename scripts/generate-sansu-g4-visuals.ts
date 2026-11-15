/** 小4の教材に具体物と図を追加する。正解や不足した問題条件は生成しない。 */
import { strict as assert } from 'node:assert';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { pictureSvg } from '../src/questions/renderers/shared/pictures';

const dir = 'assets/questions/sansu/g4/visuals';
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
  return `questions/sansu/g4/visuals/${name}.svg`;
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
const sets = readdirSync('content/questions/sansu/g4')
  .sort()
  .map((d) => {
    const file = `content/questions/sansu/g4/${d}/set-001.json`;
    return { file, questions: JSON.parse(readFileSync(file, 'utf8')) as Question[] };
  });
const all = sets.flatMap((s) => s.questions);
assert.equal(all.length, 362, 'Review new/deleted questions before regenerating');
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
const legacy = (n: number, hash: string) => `legacy.sansu.g4.math-4-${n}.${hash}`;
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

const arrow = (x: number, y: number, w: number) =>
  `<path d="M${x} ${y}h${w}m-12 -9l12 9-12 9" fill="none" ${line}/>`;
const objects = (key: string, n: number, x: number, y: number, cols: number, size = 36) =>
  `<g data-count="${n}">${Array.from({ length: n }, (_, i) => use(key, x + (i % cols) * (size + 4), y + Math.floor(i / cols) * (size + 4), size)).join('')}</g>`;

// 二次元の表を文章に平坦化せず、行・列と空欄を保つ。
const heatRows = [
  [3, 1, 2, 1, 7],
  [6, 0, 0, 1, 7],
  [3, 1, 0, 0, 4],
  [0, 1, 0, 1, 2],
  [12, 3, 2, 3, 20],
];
assert.deepEqual(
  heatRows.slice(0, 4).map((r) => r.slice(0, 4).reduce((a, b) => a + b, 0)),
  [7, 7, 4, 2],
);
assert.deepEqual(
  [0, 1, 2, 3].map((c) => heatRows.slice(0, 4).reduce((a, r) => a + r[c]!, 0)),
  [12, 3, 2, 3],
);
for (const [hash, blanks] of [
  ['67bb346e3fbb', true],
  ['c21995f5998d', false],
] as const) {
  const headings = ['ばしょ', 'じゅぎょう', 'やすみじかん', 'きゅうしょく', 'ほうかご', 'ごうけい'];
  const labels = ['きょうしつ', 'こうてい', 'たいいくかん', 'そのほか', 'ごうけい'];
  const missing: Record<string, string> = { '0,4': '①', '2,2': '②', '4,1': '③', '4,4': '④' };
  let body = text('ねっちゅうしょうに なった にんずう（にん）', 125, 25, 22);
  headings.forEach(
    (h, i) => (body += rect(10 + i * 130, 40, 130, 36, '#eaf3f7') + text(h, 17 + i * 130, 65, 17)),
  );
  heatRows.forEach((row, r) => {
    const y = 76 + r * 36;
    body += rect(10, y, 130, 36, '#eaf3f7') + text(labels[r]!, 17, y + 25, 17);
    row.forEach(
      (value, c) =>
        (body +=
          rect(140 + c * 130, y, 130, 36, '#fff') +
          text(blanks ? (missing[`${r},${c}`] ?? String(value)) : String(value), 195 + c * 130, y + 25, 22)),
    );
  });
  const description =
    '行は教室、校庭、体育館、その他、合計。列は授業中、休み時間、給食中、放課後、合計。' +
    heatRows
      .map(
        (row, r) =>
          `${labels[r]}：${row.map((v, c) => (blanks ? (missing[`${r},${c}`] ?? v) : v)).join('、')}`,
      )
      .join('。');
  draw(legacy(2, hash), `heat-table-${blanks ? 'blanks' : 'complete'}`, description, body, 270);
  if (blanks)
    get(legacy(2, hash)).payload.template = '① {{INPUT}}人　② {{INPUT}}人　③ {{INPUT}}人　④ {{INPUT}}人';
}
draw(
  legacy(2, 'ca71f3ca3730'),
  'line-change',
  '例：9時は18度、10時は20度、11時は26度、12時は27度。時間による変わり方を表す折れ線グラフ。',
  text('れい：じかんと きおんの かわりかた', 175, 30, 24) +
    [0, 1, 2, 3]
      .map(
        (i) =>
          `<path d="M120 ${200 - i * 50}H720" stroke="#a3aabb"/>` +
          text(String(15 + i * 5), 65, 207 - i * 50, 20),
      )
      .join('') +
    `<path d="M120 45V200H730" fill="none" ${line}/><polyline points="160,170 330,150 500,90 670,80" fill="none" stroke="#1f4fa3" stroke-width="6"/>` +
    [9, 10, 11, 12].map((h, i) => text(`${h}じ`, 140 + i * 170, 235, 22)).join('') +
    text('℃', 65, 35, 22),
);

// 面積の単位正方形を正確に並べる。未知の辺の長さは図から数えられないよう方眼を省く。
function areaDrawing(
  id: string,
  name: string,
  w: number,
  h: number,
  unit: string,
  kind = 'rectangle',
  knownArea?: number,
) {
  const scale = Math.min(470 / w, 155 / h),
    dw = w * scale,
    dh = h * scale,
    x = (800 - dw) / 2,
    y = 55;
  let body = rect(x, y, dw, dh, kind === 'field' ? '#e8f7a0' : kind === 'board' ? '#1f5a2e' : '#eaf3f7');
  if (!knownArea && unit === 'cm' && Number.isInteger(w) && Number.isInteger(h)) {
    for (let i = 1; i < w; i++)
      body += `<path d="M${x + i * scale} ${y}v${dh}" stroke="#6b6f80" stroke-width="1"/>`;
    for (let i = 1; i < h; i++)
      body += `<path d="M${x} ${y + i * scale}h${dw}" stroke="#6b6f80" stroke-width="1"/>`;
  }
  body +=
    text(knownArea ? '？cm' : `${w}${unit}`, x + dw / 2 - 30, y + dh + 35, 25) +
    text(`${h}${unit}`, Math.max(10, x - 85), y + dh / 2, 25);
  if (knownArea) body += text(`${knownArea}cm²`, x + dw / 2 - 60, y + dh / 2 + 8, 28);
  if (kind === 'field') body += text('たんぼ', 350, 30, 24);
  if (kind === 'room') body += text('きょうしつ', 335, 30, 24);
  if (kind === 'board') body += text('こくばん', 345, 30, 24);
  if (kind === 'table') body += text('テーブル', 345, 30, 24);
  const description = knownArea
    ? `面積${knownArea}平方cm、たて${h}cmの長方形。横の長さは空欄。`
    : `たて${h}${unit}、横${w}${unit}の${w === h ? '正方形' : '長方形'}。${unit === 'cm' ? '方眼1つの1辺は1cm。' : ''}`;
  draw(id, name, description, body, 270);
}
for (const [hash, w, h, unit, kind] of [
  ['1a320db1d80d', 2, 6, 'cm', 'rectangle'],
  ['78f738c85945', 4, 4, 'cm', 'rectangle'],
  ['912648290299', 15, 10, 'm', 'field'],
  ['94ab69ca5981', 8, 5, 'cm', 'rectangle'],
  ['cc8446383e1d', 10, 6, 'cm', 'rectangle'],
  ['ead9a402a91a', 9, 9, 'cm', 'rectangle'],
  ['ee8ac93c6894', 12, 12, 'm', 'room'],
  ['fafab2f4791d', 9, 4, 'cm', 'rectangle'],
] as const)
  areaDrawing(legacy(11, hash), `area-${hash}`, w, h, unit, kind);
areaDrawing(legacy(11, '53c680ff734b'), 'area-missing-60', 12, 5, 'cm', 'rectangle', 60);
areaDrawing(legacy(11, '5ea681f7e68c'), 'area-missing-24', 8, 3, 'cm', 'rectangle', 24);
for (const [hash, label, width, height, cm] of [
  ['c50eca8e3f2a', 'こくばん', 5, 0.8, 80],
  ['da719cf6095b', 'テーブル', 2, 0.6, 60],
] as const) {
  const dw = 530,
    dh = (dw * height) / width;
  draw(
    legacy(11, hash),
    `area-mixed-${hash}`,
    `${label}は横${width}m、たて${cm}cm。たてと横の単位をそろえて考える図。`,
    text(label, 340, 35) +
      rect(170, 65, dw, dh, label === 'こくばん' ? '#1f5a2e' : '#c08a55') +
      text(`${width}m`, 400, 65 + dh + 35) +
      text(`${cm}cm`, 30, 75 + dh / 2) +
      text('たんいを そろえて かんがえよう', 190, 255, 23),
    280,
  );
}
for (const [hash, title, side, unit] of [
  ['1f3170213999', '1a', 10, 'm'],
  ['38f46e71ac72', '1ha', 100, 'm'],
  ['2312d69102dc', '1km²', 1000, 'm'],
  ['c871318a6d0e', '1m²', 100, 'cm'],
] as const) {
  draw(
    legacy(11, hash),
    `area-unit-${hash}`,
    `${title}は1辺${side}${unit}の正方形の面積。`,
    text(title, 345, 32, 30) +
      rect(290, 45, 180, 180) +
      text(`${side}${unit}`, 330, 246, 24) +
      text(`${side}${unit}`, 145, 142, 24),
  );
}
for (const [hash, square] of [
  ['9c74f9f488de', false],
  ['d399834aaf20', true],
  ['7776587c13f9', false],
] as const) {
  draw(
    legacy(11, hash),
    `area-meaning-${hash}`,
    'たてと横の長さを持つ四角形。内側の広さに色を付けています。',
    rect(square ? 300 : 220, 50, square ? 180 : 370, square ? 180 : 150, '#80c6ff') +
      text(square ? '1ぺん' : 'よこ', 350, 245) +
      text(square ? '1ぺん' : 'たて', square ? 200 : 120, 140) +
      text('うちがわの ひろさ', 300, 145, 22),
  );
}
// 正方形・長方形の縦横比も示すため、単位面積の図は実際に正方形にする。

// 四角形の性質。矢印・印・補助線を使い、色だけに依存させない。
const parallelogram = '<path d="M180 200L280 50H620L520 200Z" fill="#eaf3f7" ' + line + '/>';
const diamond = '<path d="M180 130L400 40L620 130L400 220Z" fill="#eaf3f7" ' + line + '/>';
for (const hash of [
  '2222774a7ad4',
  '28ed170e81ea',
  '2c2e48fc0912',
  '2ec7ecb571bb',
  '3efa16b5add3',
  '9f08d2768ab4',
  'af563957f997',
  'f60e78cbfe7a',
]) {
  const rhombus = ['2ec7ecb571bb', '9f08d2768ab4'].includes(hash),
    trapezoid = hash === 'f60e78cbfe7a';
  let body = trapezoid
    ? '<path d="M200 210L300 55H500L650 210Z" fill="#eaf3f7" ' + line + '/>'
    : rhombus
      ? diamond
      : parallelogram;
  if (['2c2e48fc0912', '3efa16b5add3'].includes(hash))
    body += '<path d="M180 200L620 50M280 50L520 200" stroke="#c2405a" stroke-width="4"/>';
  if (hash === '9f08d2768ab4')
    body +=
      '<path d="M180 130H620M400 40V220M400 130h18v18h-18" fill="none" stroke="#c2405a" stroke-width="4"/>';
  if (['2222774a7ad4', 'f60e78cbfe7a'].includes(hash))
    body +=
      '<path d="M390 43l10 7-10 7M390 ' + (trapezoid ? 203 : 193) + 'l10 7-10 7" fill="none" ' + line + '/>';
  if (hash === '2222774a7ad4')
    body += '<path d="M220 122l10 3 2 12M560 122l10 3 2 12" fill="none" ' + line + '/>';
  if (hash === '28ed170e81ea')
    body += '<path d="M390 40v20M400 40v20M390 190v20M400 190v20M220 119l20 12M560 119l20 12" ' + line + '/>';
  if (hash === '2ec7ecb571bb')
    body += '<path d="M285 75l10 20M505 75l10 20M285 165l10 20M505 165l10 20" ' + line + '/>';
  body += text(
    ['2c2e48fc0912', '9f08d2768ab4', '3efa16b5add3'].includes(hash)
      ? 'むかいあう かどを むすんだ せん'
      : 'へんや かどを くらべよう',
    220,
    250,
    23,
  );
  draw(
    legacy(5, hash),
    `quadrilateral-${hash}`,
    `${rhombus ? 'ひし形' : trapezoid ? '台形' : '平行四辺形'}の図。${['2c2e48fc0912', '9f08d2768ab4', '3efa16b5add3'].includes(hash) ? '向かい合う頂点を結んだ2本の補助線。' : '辺と角の関係を比較する。'}`,
    body,
  );
}
draw(
  legacy(4, '7bfef0a27242'),
  'full-turn',
  '同じ向きから始めて、ひとまわりし、元の向きに戻る回転の図。',
  '<circle cx="400" cy="130" r="90" fill="#eaf3f7" ' +
    line +
    '/>' +
    '<path d="M400 130V40M400 30A100 100 0 1 1 382 32M372 20L383 32L367 39" fill="none" stroke="#1f4fa3" stroke-width="5"/>' +
    text('ここから ひとまわり', 490, 45, 23) +
    text('もとの むきに もどる', 285, 250, 23),
);
function ratio(
  id: string,
  name: string,
  labels: readonly [string, string],
  lengths: readonly [number, number],
  captions: readonly [string, string],
  note = '',
  person = false,
) {
  let body = '';
  const scale = 500 / Math.max(...lengths);
  for (let i = 0; i < 2; i++) {
    const y = 55 + i * 110;
    body +=
      text(labels[i]!, 15, y + 33, 24) +
      rect(235, y, lengths[i]! * scale, 45, i ? '#ffd447' : '#80c6ff') +
      text(captions[i]!, 235, y - 12, 23);
    if (person) body += use('person', 175, y - 5, 52);
  }
  body += text(note, 270, 255, 23);
  draw(
    id,
    name,
    `${labels[0]}は${captions[0]}、${labels[1]}は${captions[1]}。${note}。同じ長さが同じ量を表す図。`,
    body,
    275,
  );
}
for (const hash of ['0cd58ce46ac8', 'c25078776d73'])
  ratio(
    legacy(9, hash),
    `height-${hash}`,
    ['おとうさん', 'おとうと'],
    [180, 60],
    ['180cm', '60cm'],
    'なんばい あるかな？',
    true,
  );
for (const hash of ['c28b485ebd6e', 'f05ac9c64165'])
  ratio(
    legacy(9, hash),
    `height-${hash}`,
    ['さとしくん', 'おとうと'],
    [120, 60],
    ['？cm', '60cm'],
    'さとしくんは おとうとの 2ばい',
    true,
  );
ratio(legacy(9, '1b26a442cd2a'), 'town-distance', ['AからB', 'AからC'], [28, 4], ['28km', '4km']);
ratio(
  legacy(9, '1fcf1f50e9fa'),
  'running-distance',
  ['6ねんせい', '4ねんせい'],
  [6, 3],
  ['6km', '？km'],
  '6ねんせいは 4ねんせいの 2ばい',
);
for (const hash of ['3563a6ba44e8', 'bac3831335b9'])
  ratio(
    legacy(9, hash),
    `bus-fare-${hash}`,
    ['Aえき→Bえき', 'Cえき→Dえき'],
    [630, 210],
    ['630えん', '？えん'],
    'A→Bの りょうきんは C→Dの 3ばい',
  );
icons.tomato =
  '<path d="M32 57V10M32 29Q8 5 5 28Q19 42 32 29M32 44Q56 16 60 40Q49 54 32 44" fill="#4cbf4c" ' +
  line +
  '/><circle cx="43" cy="27" r="10" fill="#e5484d" ' +
  line +
  '/>';
draw(
  legacy(9, '4e5ae6b5545c'),
  'tomato-growth',
  'はじめのミニトマトは15cm。今はその4倍の高さ。今の高さは空欄。',
  text('はじめ', 85, 30) +
    use('tomato', 95, 172, 44) +
    text('15cm', 85, 245) +
    arrow(225, 130, 170) +
    text('4ばい', 270, 105) +
    `<g transform="translate(490 40) scale(1.2 2.75)">${icons.tomato}</g>` +
    text('いま', 625, 50) +
    text('？cm', 625, 140, 32),
);
for (const q of all.filter((q) => q.unit.endsWith('math-4-9') && q.type === 'text-input')) {
  const p = q.payload,
    unit = q.id.endsWith('1fcf1f50e9fa')
      ? 'km'
      : q.id.endsWith('bac3831335b9')
        ? '円'
        : ['c28b485ebd6e', '4e5ae6b5545c'].some((h) => q.id.endsWith(h))
          ? 'cm'
          : '倍';
  p.prompt = p.prompt.replace(/ (倍|cm|km|円)$/, '');
  p.template = `{{INPUT}}${unit}`;
}
ratio(
  legacy(13, '57268c97eaf3'),
  'height-relative',
  ['おとうさん', 'さとしくん'],
  [180, 144],
  ['180cm（もとにする1）', '144cm'],
  'さとしくんの わりあいは ？',
  true,
);
ratio(
  legacy(13, '794e52e304fd'),
  'height-times',
  ['おとうさん', 'さとしくん'],
  [180, 144],
  ['180cm', '144cm（もとにする1）'],
  'おとうさんは なんばい？',
  true,
);
ratio(
  legacy(13, '8995c27fc0c4'),
  'height-2-4-times',
  ['さとしくん', 'おとうと'],
  [144, 60],
  ['？cm', '60cm'],
  'さとしくんは おとうとの 2.4ばい',
  true,
);

const coin = (x: number, y: number) =>
  `<circle cx="${x}" cy="${y}" r="22" fill="#c08a55" ${line}/><text x="${x}" y="${y + 7}" text-anchor="middle" font-size="19">10</text>`;
for (const [hash, money] of [
  ['0df32a48cf81', 90],
  ['d03cf7b40130', 80],
] as const)
  draw(
    legacy(7, hash),
    `chocolate-${money}`,
    `10円玉が${money / 10}まいで${money}円。チョコは1こ30円。何こ買えるかを考える図。`,
    text(`${money}えん もっている`, 40, 30) +
      Array.from({ length: money / 10 }, (_, i) => coin(55 + (i % 5) * 57, 78 + Math.floor(i / 5) * 60)).join(
        '',
      ) +
      arrow(340, 120, 100) +
      use('chocolate', 525, 50, 110) +
      text('1こ 30えん', 510, 205),
  );
for (const [hash, n, d] of [
  ['84c70dd9f267', 120, 40],
  ['8c310a170fe5', 80, 20],
  ['afc13baed412', 70, 30],
] as const) {
  draw(
    legacy(7, hash),
    `tens-division-${hash}`,
    `10を1本の棒で表す。全部が${n}、1組が${d}。`,
    text('1ぽんが 10', 40, 30) +
      Array.from({ length: n / 10 }, (_, i) =>
        rect(25 + (i % 6) * 43, 55 + Math.floor(i / 6) * 75, 32, 65, '#80c6ff'),
      ).join('') +
      arrow(335, 135, 90) +
      rect(470, 55, 280, 150) +
      text(`1くみ ${d}`, 530, 90) +
      Array.from({ length: d / 10 }, (_, i) => rect(500 + i * 43, 110, 32, 65, '#80c6ff')).join(''),
  );
}

// 分配のきまりは長方形を分ける図で表す。部分の積は空欄。
for (const [hash, a, b, h, op] of [
  ['0ef637459533', 100, 2, 21, '−'],
  ['143a8f44a263', 100, 1, 25, '−'],
  ['7c3616ea37c7', 180, 100, 5, '＋'],
  ['80833d88165a', 100, 4, 8, '＋'],
] as const) {
  const total = op === '＋' ? a + b : a,
    scale = 560 / total;
  const boundary = op === '＋' ? a : a - b;
  draw(
    legacy(8, hash),
    `distribute-${hash}`,
    `${op === '＋' ? `${a}と${b}を合わせた` : a}長さと${h}の長方形。${op === '−' ? `${b}の部分を取り除く。` : ''}部分の積は空欄。`,
    rect(150, 65, boundary * scale, 135, '#80c6ff') +
      rect(150 + boundary * scale, 65, b * scale, 135, '#ffd447') +
      text(`${h}`, 70, 142) +
      text(op === '＋' ? `${a} ＋ ${b}` : `${a} から ${b}を ひく`, 265, 35) +
      text('？', 330, 145, 34) +
      text(op === '＋' ? '2つの ひろさを あわせる' : 'きいろの ぶぶんを とりのぞく', 230, 245, 24),
  );
}

// 小数の測定は大きな単位と細かい単位の関係を図で補う。
for (const [hash, large, small, note] of [
  ['47904d8843c4', '1cm', '1mm', '70.3cmを mmに'],
  ['4f9df88d0397', '1m', '1cm', '176cmを mに'],
  ['598b088b4ac6', '1km', '1m', '42.195kmを mに'],
] as const) {
  const divisions = large === '1cm' ? 10 : large === '1m' ? 100 : 1000;
  let body = text(note, 245, 35) + rect(70, 85, 660, 70, '#fff3a3');
  const visible = 10;
  for (let i = 0; i <= visible; i++) body += `<path d="M${70 + i * 66} 85v35" ${line}/>`;
  body +=
    text(`ぜんぶで ${large}`, 290, 200) + text(`おなじ ながさの ${small}が ${divisions}こ`, 190, 245, 24);
  if (divisions !== 10) body += text(`1くぎりに ${small}が ${divisions / 10}こ`, 225, 65, 22);
  draw(
    legacy(6, hash),
    `length-unit-${hash}`,
    `${note}直す。${large}は${small}が${divisions}こ。図の1区切りは${divisions / 10}${small.replace(/^1/, '')}。`,
    body,
  );
}
draw(
  legacy(6, 'd6b383b5325d'),
  'water-1259',
  '1259mLの水をLで表す。1Lの容器に1000mL、別の容器に259mL。',
  text('1259mLを Lで あらわす', 235, 30) +
    rect(180, 65, 150, 155, '#80c6ff') +
    text('1000mL', 195, 145, 25) +
    text('1L', 230, 55) +
    rect(470, 65, 150, 155, '#fff') +
    `<rect x="472" y="${220 - 155 * 0.259}" width="146" height="${155 * 0.259 - 2}" fill="#80c6ff"/>` +
    text('259mL', 485, 145, 25) +
    text('1L', 520, 55),
);

icons.shirt =
  '<path d="M18 8L6 16L12 30L20 26V57H47V26L54 30L60 16L48 8L42 4Q33 18 24 4Z" fill="#80c6ff" ' + line + '/>';
icons.shoe =
  '<path d="M8 20L24 23L28 13L38 29L55 35Q62 39 58 49H5V36Z" fill="#e5484d" ' +
  line +
  '/><path d="M5 43H59M29 23L38 23M32 29H43" fill="none" stroke="#fff" stroke-width="4"/>';
draw(
  legacy(10, '05d5e269a59c'),
  'shopping-estimate',
  'ランニングシューズ4835円とTシャツ1882円。値段を百の位までのおよその数に直して考える。',
  use('shoe', 125, 35, 150) +
    use('shirt', 515, 35, 150) +
    text('4835えん', 125, 225, 30) +
    text('1882えん', 515, 225, 30),
);
draw(
  legacy(10, '7697fb277917'),
  'trip-estimate',
  '遠足は4年生109人。1人390円。人の絵1つが109人という意味ではなく、参加する集団の見本。',
  rect(40, 40, 360, 170) +
    text('4ねんせい 109にん', 75, 75) +
    objects('person', 6, 90, 105, 6, 42) +
    arrow(430, 125, 100) +
    text('1にん', 585, 75) +
    text('390えん', 570, 150, 30),
);
draw(
  legacy(10, '8900919b5adf'),
  'protractor-estimate',
  '持っているお金は4246円。28人に分度器を1つずつ買う。分度器1つの値段を求める。',
  text('4246えん', 60, 55, 30) +
    rect(40, 85, 250, 105) +
    text('28にんぶん', 70, 145) +
    arrow(310, 130, 90) +
    '<path d="M460 190A130 130 0 0 1 720 190Z" fill="#fff3a3" ' +
    line +
    '/>' +
    Array.from({ length: 19 }, (_, i) => {
      const a = (i * Math.PI) / 18;
      return `<path d="M${590 + 125 * Math.cos(a)} ${190 - 125 * Math.sin(a)}L${590 + 105 * Math.cos(a)} ${190 - 105 * Math.sin(a)}" ${line}/>`;
    }).join('') +
    text('1つ ？えん', 510, 245),
);
ratio(
  legacy(10, 'ca82004ec288'),
  'population-estimate',
  ['ほっかいどう', 'おきなわけん'],
  [5383579, 1434138],
  ['5383579にん', '1434138にん'],
  'じょうい2けたの がいすうに する',
);
for (const [hash, a, b, unit, open] of [
  ['2b2ebb67f1e1', 120, 180, 'cm', false],
  ['5e58ca8feb75', 30, 70, 'kg', true],
] as const) {
  draw(
    legacy(10, hash),
    `range-${hash}`,
    `${a}${unit}以上、${b}${unit}${open ? '未満' : '以下'}。左端は含み、右端は${open ? '含まない' : '含む'}。`,
    `<path d="M65 125H745" ${line}/><path d="M180 125H620" stroke="#1f4fa3" stroke-width="12"/>` +
      `<circle cx="180" cy="125" r="12" fill="#1f4fa3" ${line}/><circle cx="620" cy="125" r="12" fill="${open ? '#fff' : '#1f4fa3'}" ${line}/>` +
      text(`${a}${unit}`, 140, 185) +
      text(`${b}${unit}`, 580, 185) +
      text('この かずを ふくむ', 75, 75, 23) +
      text(open ? 'この かずは ふくまない' : 'この かずを ふくむ', 495, 75, 23),
  );
}
for (const [hash, center, step] of [
  ['2172e4438493', 12000, 1000],
  ['a15d232ea7fe', 4500, 100],
] as const) {
  let body = text('どちらの かずに ちかいかな？', 215, 30) + `<path d="M90 145H710" ${line}/>`;
  for (let i = 0; i < 5; i++)
    body +=
      `<path d="M${90 + i * 155} 130v30" ${line}/>` +
      text(String(center - step + (i * step) / 2), 60 + i * 155, 200, 22);
  body += text(`がいすうが ${center}に なる はんい`, 165, 250, 24);
  draw(
    legacy(10, hash),
    `round-range-${hash}`,
    `${center - step}から${center + step}まで${step / 2}刻みの数直線。${center}に近い数の範囲を考える。`,
    body,
  );
}
function fractionStrip(n: number, d: number, x: number, y: number, wholeWidth = 140, height = 42) {
  assert(n >= 0 && d > 0);
  return Array.from(
    { length: Math.ceil(n / d) || 1 },
    (_, whole) =>
      `<g data-fraction-whole="${d}" data-filled="${Math.min(d, Math.max(0, n - whole * d))}">${Array.from({ length: d }, (_, i) => rect(x + whole * (wholeWidth + 12) + (i * wholeWidth) / d, y, wholeWidth / d, height, whole * d + i < n ? '#80c6ff' : '#fff')).join('')}</g>`,
  ).join('');
}
function fractionPair(
  hash: string,
  a: number,
  ad: number,
  b: number,
  bd: number,
  op: string,
  left: string,
  right: string,
) {
  const width = 150;
  const body =
    text('1つの わくの おおきさは どれも 1', 180, 28, 24) +
    text(left, 30, 85, 24) +
    fractionStrip(a, ad, 220, 50, width) +
    text(op, 105, 138, 28) +
    text(right, 30, 193, 24) +
    fractionStrip(b, bd, 220, 160, width);
  draw(
    legacy(14, hash),
    `fraction-${hash}`,
    `${left}と${right}を${op === '＋' ? '足す' : op === '−' ? '引く' : '比べる'}図。1つの枠は1で、上は${ad}等分、下は${bd}等分。答えは書いていません。`,
    body,
    230,
  );
}
function repairFraction(hash: string, prompt: string, old: string, answers: string[], denominator?: number) {
  const q = get(legacy(14, hash));
  assert([JSON.stringify([old]), JSON.stringify(answers)].includes(JSON.stringify(q.payload.answers)), hash);
  answerRepairs.set(q.id, [...q.payload.answers!]);
  q.payload.answers = answers;
  q.payload.prompt = prompt;
  q.payload.template = denominator
    ? answers.length === 2
      ? `{{INPUT}} と {{INPUT}} / ${denominator}`
      : `{{INPUT}} / ${denominator}`
    : '{{INPUT}}';
}
for (const [hash, a, b, d, left, op, old, answers, denom] of [
  ['235a7a59b326', 10, 3, 5, '2', '−', '1,2', ['1', '2'], 5],
  ['3310a91b7368', 6, 3, 4, '1 と 2/4', '−', '3', ['3'], 4],
  ['3fc704017d2d', 18, 6, 8, '2 と 2/8', '＋', '8,3', ['3'], 0],
  ['49fe9abad9aa', 5, 3, 3, '5/3', '−', '2', ['2'], 3],
  ['68561e8b48be', 5, 2, 3, '1 と 2/3', '＋', '4,2,1', ['2', '1'], 3],
  ['6cf01a246af7', 19, 5, 7, '19/7', '−', '14,2', ['2'], 0],
  ['8b14f0adbca7', 7, 4, 5, '1 と 2/5', '＋', '6,2,1', ['2', '1'], 5],
  ['95e83927566d', 10, 2, 6, '1 と 4/6', '＋', '1,6,2', ['2'], 0],
  ['a78485ffaa9a', 6, 1, 3, '2', '−', '1,2', ['1', '2'], 3],
  ['c0a010c16f09', 8, 6, 7, '1 と 1/7', '−', '2', ['2'], 7],
  ['d35715741676', 3, 2, 4, '3/4', '＋', '5,1,1', ['1', '1'], 4],
  ['d7d0333e6aa0', 7, 4, 5, '1 と 2/5', '−', '3', ['3'], 5],
  ['f47c5f82fff6', 10, 7, 8, '1 と 2/8', '−', '3', ['3'], 8],
  ['ff7d3a341dc8', 4, 6, 5, '4/5', '＋', '10,2', ['2'], 0],
] as const) {
  const displayLeft = left.includes(' と ')
    ? `${Math.floor(a / d)}\\dfrac{${a % d}}{${d}}`
    : left === '2'
      ? '2'
      : `\\dfrac{${a}}{${d}}`;
  repairFraction(
    hash,
    `次[つぎ]の計算[けいさん]をしましょう。 ${displayLeft} ${op} \\dfrac{${b}}{${d}} =`,
    old,
    [...answers],
    denom,
  );
  const value =
    answers.length === 2
      ? Number(answers[0]) + Number(answers[1]) / d
      : denom
        ? Number(answers[0]) / d
        : Number(answers[0]);
  assert(Math.abs(value - (op === '＋' ? (a + b) / d : (a - b) / d)) < 1e-10, hash);
  fractionPair(hash, a, d, b, d, op, left, `${b}/${d}`);
}
for (const [hash, n, d, whole, rest, old, mixed] of [
  ['0860a726afbb', 26, 9, 2, 8, '26', false],
  ['4e518741d9b2', 23, 7, 3, 2, '23', false],
  ['aa2f795f52cb', 4, 3, 1, 1, '4', false],
  ['aee5d2c4b87c', 11, 4, 2, 3, '11', false],
  ['ac518e6196db', 13, 6, 2, 1, '2,1', true],
  ['acb42b4e6766', 3, 2, 1, 1, '1,1', true],
  ['cf04e564b113', 8, 3, 2, 2, '2,2', true],
] as const) {
  const prompt = mixed
    ? `\\dfrac{${n}}{${d}}を 帯分数[たいぶんすう]にしましょう。`
    : `${whole}\\dfrac{${rest}}{${d}}を 仮分数[かぶんすう]にしましょう。`;
  repairFraction(hash, prompt, old, mixed ? [String(whole), String(rest)] : [String(n)], d);
  draw(
    legacy(14, hash),
    `fraction-${hash}`,
    `${mixed ? `${n}/${d}` : `${whole}と${rest}/${d}`}の図。1つの枠を${d}等分し、枠1つは1。`,
    text('1つの わくが 1', 285, 40, 25) + fractionStrip(n, d, 45, 100, 165, 75),
    240,
  );
}
draw(
  legacy(14, '86c7ddb4e9a8'),
  'fraction-ten-fifths',
  '5等分した枠の色の部分が全部で10こ。枠1つが1。',
  text('1つの わくが 1', 285, 40) + fractionStrip(10, 5, 120, 100, 255, 75),
  240,
);
for (const [hash, a, ad, b, bd] of [
  ['2cabcb73feff', 1, 3, 2, 3],
  ['d5e455751a6b', 2, 3, 2, 4],
] as const) {
  get(legacy(14, hash)).payload.prompt =
    `次[つぎ]の数[かず]をくらべて、□に入[はい]る きごうをえらぼう。 \\dfrac{${a}}{${ad}} □ \\dfrac{${b}}{${bd}}`;
  fractionPair(hash, a, ad, b, bd, '？', `${a}/${ad}`, `${b}/${bd}`);
}
draw(
  legacy(14, '17996dbc432c'),
  'fraction-17996dbc432c',
  '1を2等分したうちの1つ分。これと同じ割合の図を選ぶ。',
  text('ぜんぶで 1', 300, 40) + fractionStrip(1, 2, 140, 90, 520, 85) + text('いろの ぶぶんが 1/2', 260, 225),
  250,
);
for (const [choice, n, d] of [
  ['c1', 2, 4],
  ['c2', 1, 3],
  ['c3', 2, 3],
] as const)
  choiceImage(
    legacy(14, '17996dbc432c'),
    choice,
    `equivalent-${choice}`,
    `同じ大きさの1を${d}等分したうち${n}こぶん。`,
    fractionStrip(n, d, 10, 55, 180, 65),
  );
fractionPair('5661c2418960', 1, 2, 1, 3, '？', 'れい：1/2', 'れい：1/3');
draw(
  legacy(14, '5ccf819e2c29'),
  'mixed-number-meaning',
  '1と1/2を、1つ分の枠と半分の枠で表した図。',
  text('1 と 1/2', 310, 40, 30) + fractionStrip(3, 2, 135, 95, 250, 85),
  240,
);

// 小数点の位置を固定し、数字がどの位にあるかを見える形にする。
for (const [hash, value, multiply] of [
  ['3408e780b66c', '0.049', false],
  ['4871c609ca04', '0.15', false],
  ['784da3c5fb64', '0.15', true],
  ['cfef99982c64', '3', false],
  ['d744981eae2e', '3', true],
  ['e33026a3f514', '0.049', true],
] as const) {
  const labels = ['じゅう', 'いち', '1/10', '1/100', '1/1000', '1/10000'];
  const [whole, fraction = ''] = value.split('.');
  const digits = ['', whole!, ...fraction.padEnd(4, ' ').split('')];
  let body = text(`${value}を ${multiply ? '10ばい' : '10で わる'}`, 245, 30);
  labels.forEach(
    (label, i) =>
      (body +=
        rect(40 + i * 120, 55, 120, 40) +
        text(label, 48 + i * 120, 82, 20) +
        rect(40 + i * 120, 95, 120, 70, '#fff') +
        text(digits[i]!.trim(), 83 + i * 120, 142, 32)),
  );
  body += '<circle cx="280" cy="151" r="5" fill="#c2405a"/>';
  body += text(
    multiply ? 'すうじを ひとつ ひだりの くらいへ' : 'すうじを ひとつ みぎの くらいへ',
    170,
    225,
    24,
  );
  draw(
    legacy(6, hash),
    `decimal-place-${hash}`,
    `${value}を位ごとに並べた表。小数点を固定し、10${multiply ? '倍では左へ' : 'でわると右へ'}1つ位を移す。答えの数字は書いていません。`,
    body,
  );
}
for (const [hash, position] of [
  ['2518118feb30', 1],
  ['73c60670f5dd', 1],
  ['40cecff1bfbf', 2],
  ['bfcff36b65cc', 2],
] as const) {
  draw(
    legacy(6, hash),
    `decimal-name-${position}`,
    `例の小数2.345の、小数点から${position}つ後ろの数字を枠で囲んでいる。位の名前は空欄。`,
    text('れい', 165, 65) +
      ['2', '.', '3', '4', '5'].map((digit, i) => text(digit, 250 + i * 60, 125, 60)).join('') +
      rect(position === 1 ? 363 : 423, 63, 48, 80, 'none') +
      text('↑', position === 1 ? 385 : 445, 180, 30) +
      text('この くらいの なまえは ？', 240, 240, 25),
  );
}

assert.equal(signature(), before, 'Only documented fraction-input repairs may change answers');
for (const s of sets) writeFileSync(s.file, JSON.stringify(s.questions, null, 2) + '\n');
const review = all.map((q) => {
  const p = q.payload,
    sourceText = `${p.prompt} ${p.template ?? ''}`;
  const expression = p.prompt.match(/(?:。|^)\s*(\d+(?:\.\d+)?)\s*([+＋−\-×÷])\s*(\d+(?:\.\d+)?)\s*=\s*$/);
  let inconsistent = ['88cc9e4191cf', 'b9d4bf5d2ede'].some((hash) => q.id.endsWith(hash));
  if (expression && p.answers?.length === 1 && !changed.has(q.id)) {
    const a = Number(expression[1]),
      b = Number(expression[3]),
      op = expression[2];
    const result = op === '×' ? a * b : op === '÷' ? a / b : op === '-' || op === '−' ? a - b : a + b;
    inconsistent = Math.abs(result - Number(p.answers[0])) > 1e-8;
  }
  const missing =
    /けいさんしましょう \(/.test(p.prompt) ||
    (q.unit.endsWith('math-4-1') && !p.template && !/計算/.test(p.prompt)) ||
    q.id.endsWith('8c37d78e0ab8') ||
    q.tags?.includes('runtime:quarantined-missing-context') ||
    (!p.promptImage &&
      !p.template &&
      /^(次の(数|式|文|計算)|くふうして|四捨五入で、次|面積の単位の)/.test(p.prompt) &&
      !/[0-9]/.test(sourceText));
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
        ? '表示された式と正解が不一致。旧データの欠落や結合を原資料で確認する'
        : missing
          ? '元の数・式・条件が不足。推測で補わず原資料確認が必要'
          : decision === 'existing-visual'
            ? '既存の図・グラフ・展開図を学習表現として維持'
            : '数式・記号・筆算そのものの練習として維持'),
  };
});
writeFileSync('scripts/data/sansu-g4-visual-review.json', JSON.stringify(review, null, 2) + '\n');
console.log(`${changed.size} of ${all.length} questions illustrated`);
