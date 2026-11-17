/** 小1の具体物・比較・位置の図版を再生成し、既存の問題へ接続する。 */
import { strict as assert } from 'node:assert';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { pictureSvg, type PictureKey } from '../src/questions/renderers/shared/pictures';

const out = 'assets/questions/sansu/g1/visuals';
const relative = 'questions/sansu/g1/visuals';
mkdirSync(out, { recursive: true });
const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const icons: Record<string, string> = {};
for (const key of ['apple', 'orange', 'banana', 'cat', 'dog', 'rabbit', 'bird'] as PictureKey[])
  icons[key] = `<g transform="scale(4)">${pictureSvg(key)
    .replace(/^<svg[^>]*>/, '')
    .replace('</svg>', '')}</g>`;
const outline = 'stroke="#273449" stroke-width="2.5" stroke-linejoin="round"';
icons.pencil = `<path d="M8 14H49L60 32 49 50H8Z" fill="#ffd447" ${outline}/><path d="M49 14L60 32 49 50Z" fill="#e7bb8b" ${outline}/><path d="M56 26L60 32 56 38Z" fill="#273449"/><path d="M8 24H49M8 40H49" stroke="#c79a1a" stroke-width="3"/>`;
icons.acorn = `<path d="M14 26Q10 52 32 60Q54 52 50 26" fill="#c08a55" ${outline}/><path d="M9 29Q9 10 32 10Q55 10 55 29Z" fill="#7a5230" ${outline}/><path d="M32 12V3" ${outline}/>`;
icons.person = `<circle cx="32" cy="13" r="10" fill="#ffd7b2" ${outline}/><path d="M19 28L10 44M45 28L54 44M24 43L20 61M40 43L44 61" fill="none" ${outline}/><path d="M19 25H45V45H19Z" fill="#80c6ff" ${outline}/><path d="M28 15Q32 19 36 15" fill="none" stroke="#273449" stroke-width="2"/>`;
icons.chair = `<path d="M14 5H50V32H14Z" fill="#c08a55" ${outline}/><path d="M10 32H54V42H10Z" fill="#e7bb8b" ${outline}/><path d="M15 42V62M49 42V62" ${outline}/>`;
icons.cup = `<path d="M14 12H50L46 57H18Z" fill="#c8f4ff" ${outline}/><ellipse cx="32" cy="12" rx="18" ry="5" fill="#fff" ${outline}/>`;
icons.straw = `<path d="M25 59V17L44 6" fill="none" stroke="#e5484d" stroke-width="6"/>`;
icons.plate = `<ellipse cx="32" cy="34" rx="29" ry="18" fill="#eaf3f7" ${outline}/><ellipse cx="32" cy="34" rx="20" ry="11" fill="#fff" ${outline}/>`;
icons.bread = `<path d="M13 23C0 7 19 1 32 8C45 1 64 7 51 23V58H13Z" fill="#e8ad58" ${outline}/><path d="M20 24Q12 14 30 17Q50 12 44 24V51H20Z" fill="#fff3a3"/>`;
icons.chocolate = `<rect x="9" y="7" width="46" height="50" rx="4" fill="#7a5230" ${outline}/><path d="M32 7V57M9 24H55M9 40H55" stroke="#d79a68" stroke-width="3"/>`;
icons.candy = `<path d="M19 24L3 14V50L19 40M45 24L61 14V50L45 40" fill="#80c6ff" ${outline}/><circle cx="32" cy="32" r="18" fill="#ff8fb1" ${outline}/><path d="M23 19L41 45M18 29L31 48" stroke="#fff" stroke-width="4"/>`;
icons.bag = `<path d="M22 20V12Q32 1 42 12V20" fill="none" ${outline}/><rect x="10" y="19" width="44" height="40" rx="7" fill="#f2a93b" ${outline}/><path d="M10 30H54M23 38H41V51H23Z" fill="none" ${outline}/>`;
icons.car = `<path d="M4 29H15L24 13H44L53 29H60V50H4Z" fill="#e5484d" ${outline}/><path d="M25 17H41L48 29H18Z" fill="#c8f4ff" ${outline}/><circle cx="16" cy="51" r="8" fill="#273449"/><circle cx="49" cy="51" r="8" fill="#273449"/>`;
icons.block = `<rect x="6" y="6" width="52" height="52" rx="3" fill="#ffd447" ${outline}/><path d="M6 18H58M18 6V58" stroke="#c79a1a" stroke-width="2"/>`;
for (const [key, color] of [
  ['red-flower', '#e5484d'],
  ['white-flower', '#ffffff'],
])
  icons[key!] =
    `<path d="M32 28V62M32 50Q10 29 15 48L32 55M32 46Q54 28 49 47L32 54" fill="#4cbf4c" stroke="#2a7a36" stroke-width="3"/><g fill="${color}" ${outline}><circle cx="32" cy="12" r="10"/><circle cx="45" cy="22" r="10"/><circle cx="40" cy="36" r="10"/><circle cx="24" cy="36" r="10"/><circle cx="19" cy="22" r="10"/></g><circle cx="32" cy="24" r="9" fill="#ffd447" ${outline}/>`;
for (const [key, color] of [
  ['red-balloon', '#e5484d'],
  ['blue-balloon', '#3d8ef0'],
])
  icons[key!] =
    `<ellipse cx="32" cy="24" rx="20" ry="23" fill="${color}" ${outline}/><path d="M29 47L35 47L32 52Q18 58 33 63" fill="none" ${outline}/><path d="M22 12Q17 16 18 23" fill="none" stroke="#fff" stroke-width="4"/>`;

const use = (icon: string, x: number, y: number, size = 48) => {
  assert(icons[icon], `unknown icon: ${icon}`);
  return `<use href="#${icon}" x="${x}" y="${y}" width="${size}" height="${size}"/>`;
};
const text = (label: string, x: number, y: number, size = 26) =>
  `<text x="${x}" y="${y}" font-size="${size}">${escapeXml(label)}</text>`;
function asset(name: string, description: string, body: string, width = 800, height = 260): string {
  const keys = [...new Set([...body.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]!))];
  const defs = keys.map((key) => `<symbol id="${key}" viewBox="0 0 64 64">${icons[key]}</symbol>`).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(description)}">\n<title>${escapeXml(description)}</title>\n<defs>${defs}</defs>\n<rect width="100%" height="100%" rx="12" fill="#fff"/>\n<g fill="#172033" font-family="sans-serif">${body}</g>\n</svg>\n`;
  assert(!svg.includes('undefined'));
  writeFileSync(`${out}/${name}.svg`, svg);
  return `${relative}/${name}.svg`;
}
interface Row {
  label: string;
  icon: string;
  count: number;
  removed?: number;
}
function rows(name: string, description: string, entries: Row[]) {
  const body = entries
    .map((row, index) => {
      assert(Number.isInteger(row.count) && row.count >= 0 && row.count <= 20);
      assert((row.removed ?? 0) <= row.count);
      const y = 12 + index * 116;
      const size = row.count > 10 ? 36 : 52;
      return (
        `<rect x="8" y="${y}" width="784" height="108" rx="8" fill="${index % 2 ? '#eaf3f7' : '#f4f1e8'}"/>${text(row.label, 22, y + 61, 23)}<g data-icon="${row.icon}" data-count="${row.count}" data-removed="${row.removed ?? 0}">` +
        Array.from({ length: row.count }, (_, i) => {
          const x = 218 + (i % 10) * 55;
          const top = y + (row.count > 10 ? 10 + Math.floor(i / 10) * 45 : 28);
          const crossed = i >= row.count - (row.removed ?? 0);
          return `<g${crossed ? ' opacity="0.55"' : ''}>${use(row.icon, x, top, size)}</g>${crossed ? `<path d="M${x} ${top}l${size} ${size}m0 -${size}l-${size} ${size}" stroke="#273449" stroke-width="3"/>` : ''}`;
        }).join('') +
        '</g>'
      );
    })
    .join('\n');
  return asset(name, description, body, 800, entries.length * 116 + 24);
}
function counters(name: string, n: number, description: string, icon = 'apple') {
  assert(n <= 100 && n > 0);
  const tens = Math.floor(n / 10),
    ones = n % 10;
  const body = Array.from({ length: tens }, (_, group) => {
    const x = 18 + (group % 3) * 260,
      y = 14 + Math.floor(group / 3) * 108;
    return `<g data-ten="10"><rect x="${x}" y="${y}" width="244" height="98" rx="8" fill="#eaf3f7" stroke="#71869b" stroke-width="2"/>${Array.from({ length: 10 }, (_, i) => use(icon, x + 10 + (i % 5) * 46, y + 6 + Math.floor(i / 5) * 44, 40)).join('')}</g>`;
  }).join('');
  const y = tens ? Math.ceil(tens / 3) * 108 + 20 : 24;
  return asset(
    name,
    description,
    body +
      `<g data-ones="${ones}">${Array.from({ length: ones }, (_, i) => use(icon, 18 + i * 78, y, 52)).join('')}</g>`,
    800,
    y + 82,
  );
}

interface Question {
  id: string;
  type: string;
  subject: string;
  grade: number;
  unit: string;
  payload: Record<string, unknown>;
  explanation?: string;
}
const files = readdirSync('content/questions/sansu/g1')
  .sort()
  .map((dir) => `content/questions/sansu/g1/${dir}/set-001.json`);
const sets = files.map((file) => ({ file, questions: JSON.parse(readFileSync(file, 'utf8')) as Question[] }));
const all = sets.flatMap((set) => set.questions);
assert.equal(all.length, 188, 'Review new/deleted questions before regenerating');
const changed = new Map<string, string>();
const answers = (q: Question) => {
  const p = q.payload;
  if (q.type === 'choice')
    return (p.choices as { id: string; text: string }[]).find((c) => c.id === p.answer)!.text;
  return p.answers ?? [String(p.answer)];
};
const before = JSON.stringify(all.map((q) => [q.id, q.grade, q.unit, answers(q)]));
const get = (id: string) => {
  const q = all.find((q) => q.id === id);
  assert(q, id);
  return q;
};
function attach(id: string, path: string, description: string) {
  const q = get(id);
  assert(q.type === 'choice' || q.type === 'text-input');
  q.payload.promptImage = path;
  if (q.type === 'choice')
    q.payload.promptSpeech = `${q.payload.prompt}${/[。？！?!]$/.test(q.payload.prompt) ? ' ' : '。'}${description}`;
  else q.payload.promptImageAlt = description;
  changed.set(id, description);
}
const g1 = (s: string) => `sansu.g1.${s}`;
const legacy = (unit: number, hash: string) => `legacy.sansu.g1.math-1-${unit}.${hash}`;
const illustrateRows = (id: string, name: string, description: string, entries: Row[]) =>
  attach(id, rows(name, description, entries), description);
const illustrateCount = (id: string, name: string, n: number, description: string, icon = 'apple') =>
  attach(id, counters(name, n, description, icon), description);

// 具体物の数・対応・増減。取消線は「なくなった物」で、答えの数値は書かない。
get(g1('data.0002')).payload.prompt = 'えを みよう。あかい はなは しろい はなより なんぼん おおい？';
illustrateRows(
  g1('data.0002'),
  'flowers-4-2',
  'あかい はなは 4ほん、しろい はなは 2ほん。はしを そろえて ならんでいます。',
  [
    { label: 'あかい はな', icon: 'red-flower', count: 4 },
    { label: 'しろい はな', icon: 'white-flower', count: 2 },
  ],
);
illustrateRows(g1('hikizan.0003'), 'flowers-7-5', 'あかい はなは 7ほん、しろい はなは 5ほん。', [
  { label: 'あかい はな', icon: 'red-flower', count: 7 },
  { label: 'しろい はな', icon: 'white-flower', count: 5 },
]);
for (const [id, name, icon, count, removed, label] of [
  [g1('hikizan.0001'), 'apples-8-take-3', 'apple', 8, 3, 'はじめは 8こ'],
  [g1('hikizan.0007'), 'birds-7-leave-2', 'bird', 7, 2, 'はじめは 7わ'],
  [g1('kuriagari-kurisagari.0006'), 'acorns-12-take-4', 'acorn', 12, 4, 'はじめは 12こ'],
  [legacy(3, '334599058766'), 'cars-8-leave-5', 'car', 8, 5, 'はじめは 8だい'],
  [legacy(3, 'adb80c3ad7af'), 'apples-5-take-3', 'apple', 5, 3, 'はじめは 5こ'],
] as const)
  illustrateRows(id, name, `${label}。そのうち ${removed}つに、なくなった しるしの ばつが ついています。`, [
    { label, icon, count, removed },
  ]);
for (const [id, name, description, entries] of [
  [
    g1('tashizan.0001'),
    'fruit-3-plus-4',
    'りんご 3こと、みかん 4こを あわせます。',
    [
      { label: 'りんご', icon: 'apple', count: 3 },
      { label: 'みかん', icon: 'orange', count: 4 },
    ],
  ],
  [
    g1('tashizan.0004'),
    'apples-8-plus-2',
    'はじめの りんごが 8こ。あとから 2こ いれます。',
    [
      { label: 'はじめ', icon: 'apple', count: 8 },
      { label: 'あとから', icon: 'apple', count: 2 },
    ],
  ],
  [
    g1('tashizan.0006'),
    'balloons-4-plus-3',
    'あかい ふうせん 4こと、あおい ふうせん 3こ。',
    [
      { label: 'あかい ふうせん', icon: 'red-balloon', count: 4 },
      { label: 'あおい ふうせん', icon: 'blue-balloon', count: 3 },
    ],
  ],
  [
    g1('tashizan.0007'),
    'acorns-5-plus-2',
    'どんぐりが 5こ。あとから 2こ ふえます。',
    [
      { label: 'はじめ', icon: 'acorn', count: 5 },
      { label: 'ふえる', icon: 'acorn', count: 2 },
    ],
  ],
  [
    g1('kazu-20.0001'),
    'apples-10-plus-4',
    'りんご 10こと、りんご 4こ。',
    [
      { label: '10こ', icon: 'apple', count: 10 },
      { label: '4こ', icon: 'apple', count: 4 },
    ],
  ],
  [
    legacy(3, 'a0cc8743250a'),
    'bananas-7-apples-3',
    'ばなな 7ほんと、りんご 3こを、はしを そろえて ならべています。',
    [
      { label: 'ばなな', icon: 'banana', count: 7 },
      { label: 'りんご', icon: 'apple', count: 3 },
    ],
  ],
  [
    g1('kazu-100.correspondence-0001'),
    'cups-straws',
    'コップ 3こと ストロー 3ぼんが、1つずつ むかいあっています。',
    [
      { label: 'コップ', icon: 'cup', count: 3 },
      { label: 'ストロー', icon: 'straw', count: 3 },
    ],
  ],
  [
    g1('kazu-100.correspondence-0002'),
    'children-chairs',
    'こども 5にんと、いす 4きゃくが、はしを そろえて ならんでいます。',
    [
      { label: 'こども', icon: 'person', count: 5 },
      { label: 'いす', icon: 'chair', count: 4 },
    ],
  ],
  [
    g1('kazu-100.correspondence-0003'),
    'plates-apples',
    'さら 4まいと、りんご 6こが、はしを そろえて ならんでいます。',
    [
      { label: 'さら', icon: 'plate', count: 4 },
      { label: 'りんご', icon: 'apple', count: 6 },
    ],
  ],
] as [string, string, string, Row[]][])
  illustrateRows(id, name, description, entries);
get(g1('kazu-100.count-0001')).payload.prompt = 'りんごは なんこ ありますか？';
get(g1('kazu-100.count-0001')).explanation = 'りんごを 1こずつ かぞえると、7こです。';
illustrateCount(g1('kazu-100.count-0001'), 'count-apples-7', 7, 'りんごが 7こ、ならんでいます。');
get(g1('kazu-100.count-0003')).payload.prompt = 'えんぴつの かずを あらわす すうじは どれ？';
illustrateCount(
  g1('kazu-100.count-0003'),
  'count-pencils-5',
  5,
  'えんぴつが 5ほん、ならんでいます。',
  'pencil',
);
const orderDescription = 'ひだりから、ねこ、いぬ、うさぎ、とりの じゅんばんです。';
attach(
  g1('kazu-100.count-0002'),
  asset(
    'animal-order',
    orderDescription,
    text('ひだり', 28, 35) +
      text('みぎ', 706, 35) +
      ['cat', 'dog', 'rabbit', 'bird'].map((key, i) => use(key, 78 + i * 188, 66, 110)).join(''),
  ),
  orderDescription,
);

// 分類方法は選択肢の絵も比較する。並び順は問題側のshuffleに追従する。
const animalDescription = 'ねこ 3びき、いぬ 1ぴき、うさぎ 2ひき。';
const animalQ = get(g1('data.0003'));
const animalChoices = animalQ.payload.choices as { id: string; image?: string }[];
const animalLayouts = [
  ['cat', 'cat', 'cat', 'dog', 'rabbit', 'rabbit']
    .map((key, i) => use(key, [20, 90, 160, 20, 20, 90][i]!, [12, 12, 12, 82, 152, 152][i]!, 60))
    .join(''),
  ['cat', 'rabbit', 'cat', 'dog', 'rabbit', 'cat']
    .map((key, i) => use(key, [10, 148, 86, 170, 4, 100][i]!, [5, 50, 135, 145, 130, 5][i]!, 54))
    .join(''),
  text('ねこ', 20, 48, 28) + text('いぬ', 20, 110, 28) + text('うさぎ', 20, 172, 28),
];
animalChoices.forEach(
  (c, i) => (c.image = asset(`sort-animals-${c.id}`, animalDescription, animalLayouts[i]!, 240, 220)),
);
changed.set(animalQ.id, '同じ動物をそろえる・散らす・名前だけの3つの選択肢図。');

const shapeChoices = get(g1('katachi.0001')).payload.choices as { id: string; image?: string }[];
const box = (x: number, y: number, w: number, h: number) =>
  `<path d="M${x} ${y + 12}l12 -12h${w}v${h}l-12 12h-${w}Z" fill="#f2a93b" ${outline}/><path d="M${x} ${y + 12}h${w}l12 -12M${x + w} ${y + 12}v${h}" fill="none" ${outline}/>`;
const shapeBodies = [
  `<circle cx="80" cy="60" r="42" fill="#80c6ff" ${outline}/><path d="M48 31Q65 18 80 23" fill="none" stroke="#fff" stroke-width="7"/>`,
  box(20, 30, 110, 48),
  box(48, 20, 64, 64),
];
shapeChoices.forEach(
  (c, i) =>
    (c.image = asset(
      `solid-${c.id}`,
      'まるい ボール、ながい はこ、さいころの かたち。',
      shapeBodies[i]!,
      180,
      120,
    )),
);
changed.set(g1('katachi.0001'), '球・直方体・立方体を選択肢画像で提示。');
const stackChoices = get(g1('katachi.0002')).payload.choices as { id: string; image?: string }[];
[
  box(55, 10, 50, 44) + box(55, 66, 50, 44),
  box(2, 66, 50, 44) + box(130, 66, 50, 44),
  box(28, 66, 50, 44) + box(90, 66, 50, 44),
].forEach(
  (body, i) =>
    (stackChoices[i]!.image = asset(`boxes-${stackChoices[i]!.id}`, 'おなじ はこが 2こ。', body, 200, 140)),
);
changed.set(g1('katachi.0002'), '同じ2箱を上下・離す・横並びにした選択肢画像。');
const chairDescription = 'いすの ざめんの うえに かばん、ざめんの したに ねこが います。';
attach(
  g1('katachi.0003'),
  asset(
    'cat-chair-bag',
    chairDescription,
    `<path d="M320 20H480V137H320Z" fill="#c08a55" ${outline}/><path d="M300 130H500V150H300Z" fill="#e7bb8b" ${outline}/><path d="M315 150V252M485 150V252" stroke="#7a5230" stroke-width="12"/>` +
      use('bag', 356, 48, 84) +
      use('cat', 360, 166, 80),
  ),
  chairDescription,
);

// 10のまとまりと分解は、実物を数えて考えられる形で示す。
for (const [id, n] of [
  [g1('kazu-100.place-value-0001'), 34],
  [g1('kazu-100.place-value-0002'), 52],
  [g1('kazu-100.place-value-0003'), 67],
  [g1('kazu-20.0002'), 16],
  [g1('kazu-20.0006'), 18],
  [legacy(6, '0d5b59f1d0b1'), 24],
  [legacy(6, '582c47dfbafd'), 36],
  [legacy(6, 'd29acb17630b'), 57],
] as const)
  illustrateCount(
    id,
    `tens-${n}`,
    n,
    `しかくの わく 1つに えんぴつが 10ぽん。わくが ${Math.floor(n / 10)}つ、ばらが ${n % 10}ほん あります。`,
    'pencil',
  );
for (const q of all.filter(
  (q) =>
    q.id.includes('legacy-bunkai') ||
    (q.id.includes('math-1-1.') && q.type === 'choice' && String(q.payload.prompt).includes('ふたつ')),
)) {
  const n = Number(String(q.payload.prompt).match(/\d+/)![0]);
  illustrateCount(q.id, `split-${n}`, n, `りんごが ${n}こ。2つの まとまりに わけて かんがえましょう。`);
}
for (const [id, filled] of [
  [g1('kazu-100.make-ten-0001'), 7],
  [g1('kazu-100.make-ten-0002'), 6],
] as const) {
  const description = `2だんに 5つずつ、あわせて 10この ますが あります。${filled}この ますに りんごが はいっています。`;
  const body =
    text('10この ます', 290, 36) +
    Array.from({ length: 10 }, (_, i) => {
      const x = 190 + (i % 5) * 84,
        y = 56 + Math.floor(i / 5) * 84;
      return `<rect x="${x}" y="${y}" width="80" height="80" rx="5" fill="#eaf3f7" stroke="#71869b" stroke-width="2"/>${i < filled ? use('apple', x + 8, y + 8, 64) : ''}`;
    }).join('');
  attach(id, asset(`ten-frame-${filled}`, description, body), description);
}
for (const [id, left, right] of [
  [g1('kazu-100.order-0001'), 4, 7],
  [g1('kazu-20.0003'), 13, 17],
] as const)
  illustrateRows(
    id,
    `compare-${left}-${right}`,
    `${left}この つみきと、${right}この つみき。どちらも 10こずつの れつに なっています。`,
    [
      { label: String(left), icon: 'block', count: left },
      { label: String(right), icon: 'block', count: right },
    ],
  );
for (const [id, left, right] of [
  [g1('kuriagari-kurisagari.0001'), 9, 4],
  [g1('kuriagari-kurisagari.0002'), 8, 7],
  [g1('tashizan.0008'), 8, 7],
] as const) {
  const description = `10この ますに りんごが ${left}こ。べつに ${right}この りんごが あります。`;
  const body =
    text('10この ます', 68, 32) +
    Array.from({ length: 10 }, (_, i) => {
      const x = 20 + (i % 5) * 68,
        y = 50 + Math.floor(i / 5) * 68;
      return `<rect x="${x}" y="${y}" width="64" height="64" fill="#eaf3f7" stroke="#71869b" stroke-width="2"/>${i < left ? use('apple', x + 6, y + 6, 52) : ''}`;
    }).join('') +
    text('＋', 365, 128, 40) +
    Array.from({ length: right }, (_, i) =>
      use('apple', 430 + (i % 5) * 68, 50 + Math.floor(i / 5) * 68, 52),
    ).join('');
  attach(id, asset(`make-ten-${left}-${right}`, description, body, 800, 210), description);
}
illustrateRows(
  g1('kuriagari-kurisagari.0004'),
  'thirteen-take-five',
  '10この りんごの うち 5こに ばつ。べつに 3この りんごが あります。',
  [
    { label: '10の まとまり', icon: 'apple', count: 10, removed: 5 },
    { label: 'ばら', icon: 'apple', count: 3 },
  ],
);
// 旧教材の「○を数える」10問は、具体物を10個ずつ囲む問題に置換する。
for (const q of all.filter(
  (q) =>
    q.id.startsWith('legacy.') &&
    (String(q.payload.prompt).startsWith('○は、') ||
      String(q.payload.promptImage).includes('/visuals/count-apples-')),
)) {
  const n = Number((q.payload.answers as string[])[0]);
  q.payload.prompt = 'りんごは ぜんぶで なんこ ありますか？';
  q.payload.template = '{{INPUT}}こ';
  q.payload.suffix = 'こ';
  q.explanation =
    n >= 10
      ? `10この まとまりが ${Math.floor(n / 10)}つ、ばらが ${n % 10}こ。ぜんぶで ${n}こです。`
      : `りんごを 1こずつ かぞえると、${n}こです。`;
  illustrateCount(
    q.id,
    `count-apples-${n}`,
    n,
    n >= 10
      ? `しかくの わく 1つに りんごが 10こ。わくが ${Math.floor(n / 10)}つ、ばらが ${n % 10}こです。`
      : `りんごが ${n}こ あります。`,
  );
}
const keypad = get(g1('kazu-100.ringo-keypad-0001'));
keypad.type = 'text-input';
keypad.payload = {
  prompt: 'りんごが 7こと 4こ。ぜんぶで なんこ？',
  answers: ['11'],
  template: '{{INPUT}}こ',
  suffix: 'こ',
};
illustrateRows(keypad.id, 'apples-7-plus-4', 'りんご 7こと 4こを あわせます。', [
  { label: '7こ', icon: 'apple', count: 7 },
  { label: '4こ', icon: 'apple', count: 4 },
]);

// 長さ・かさは、比較の基準や比べる対象そのものを描く。
const pencils = get(g1('kurabekata.0001')).payload.choices as { id: string; image?: string }[];
const pencil = (x: number, y: number, w: number) =>
  `<g transform="translate(${x} ${y}) scale(${w / 64} 0.5)">${icons.pencil.replaceAll('<path ', '<path vector-effect="non-scaling-stroke" ')}</g>`;
[
  pencil(10, 12, 155) + pencil(15, 70, 115),
  pencil(0, 0, 110) + pencil(108, 85, 110),
  pencil(10, 35, 160),
].forEach(
  (body, i) =>
    (pencils[i]!.image = asset(
      `pencil-compare-${pencils[i]!.id}`,
      'えんぴつの はしや、ならべかたを みましょう。',
      body,
      240,
      140,
    )),
);
changed.set(g1('kurabekata.0001'), '端をそろえる・離す・1本だけの比較図。');
illustrateRows(
  g1('kurabekata.0002'),
  'measure-desk-shelf',
  'つくえは つみき 8こぶん、たなは おなじ つみき 6こぶん。',
  [
    { label: 'つくえ', icon: 'block', count: 8 },
    { label: 'たな', icon: 'block', count: 6 },
  ],
);
const waterDescription = 'ほそくて たかい いれものと、ひくくて はばの ひろい いれものが あります。';
attach(
  g1('kurabekata.0003'),
  asset(
    'water-vessels',
    waterDescription,
    `<path d="M140 28H244V220H140Z" fill="#c8f4ff" ${outline}/><ellipse cx="192" cy="28" rx="52" ry="12" fill="#fff" ${outline}/><path d="M440 125H690V220H440Z" fill="#c8f4ff" ${outline}/><ellipse cx="565" cy="125" rx="125" ry="12" fill="#fff" ${outline}/>`,
  ),
  waterDescription,
);

// 時計の針・時刻の前後を実際の時計盤で示す。
function clock(hour: number, minute: number, x: number) {
  const hand = (angle: number, length: number, color: string, width: number) =>
    `<line x1="${x}" y1="126" x2="${x + Math.sin(angle) * length}" y2="${126 - Math.cos(angle) * length}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
  return (
    `<circle cx="${x}" cy="126" r="92" fill="#fff" ${outline}/>` +
    Array.from({ length: 12 }, (_, i) => {
      const a = ((i + 1) * Math.PI) / 6;
      return `<text x="${x + Math.sin(a) * 73}" y="${134 - Math.cos(a) * 73}" font-size="22" text-anchor="middle">${i + 1}</text>`;
    }).join('') +
    hand((((hour % 12) + minute / 60) * Math.PI) / 6, 45, '#273449', 8) +
    hand((minute * Math.PI) / 30, 64, '#e5484d', 5) +
    `<circle cx="${x}" cy="126" r="6" fill="#273449"/>`
  );
}
attach(
  g1('tokei.0005'),
  asset('long-hand', 'ながい はりは あかい はり、みじかい はりは くろい はり。', clock(3, 30, 400)),
  'ながい はりは あかい はり、みじかい はりは くろい はりです。',
);
attach(
  g1('tokei.0006'),
  asset(
    'clocks-8-and-half',
    '8じの とけいと、8じ30ぷんの とけい。',
    clock(8, 0, 220) + clock(8, 30, 580) + text('8じ', 196, 247) + text('8じ 30ぷん', 522, 247),
  ),
  '8じの とけいと、8じ30ぷんの とけいが ならんでいます。',
);
attach(
  legacy(8, '7b4e7e51b9eb'),
  asset(
    'clock-one-turn',
    'ながい はりが 12から みぎまわりに 1しゅうします。',
    clock(3, 0, 400) +
      `<path d="M400 18A108 108 0 1 1 360 26" fill="none" stroke="#3d8ef0" stroke-width="5"/><path d="M358 15L374 22 361 36" fill="none" stroke="#3d8ef0" stroke-width="5"/>`,
  ),
  'ながい はりが 12から みぎまわりに 1しゅうします。',
);

// 文章題は「最初の量・変化・比較」を図にする。未知の量には「？」を置く。
function bars(
  name: string,
  description: string,
  topLabel: string,
  a: number,
  bottomLabel: string,
  b: number,
  mode: 'difference' | 'less' | 'more' | 'add',
  unit: string,
) {
  const max = mode === 'more' || mode === 'add' ? a + b : Math.max(a, b),
    scale = 480 / max;
  const x = 230,
    wa = a * scale,
    wb = b * scale;
  const rect = (y: number, w: number, fill: string) =>
    `<rect x="${x}" y="${y}" width="${w}" height="48" fill="${fill}" ${outline}/>`;
  let body = text(topLabel, 16, 70, 23) + rect(40, wa, '#80c6ff') + text(`${a}${unit}`, x + 12, 72, 24);
  const lower = mode === 'less' ? a - b : mode === 'more' ? a + b : b;
  body +=
    text(bottomLabel, 16, 166, 23) +
    rect(136, lower * scale, '#ffd447') +
    text(mode === 'less' || mode === 'more' ? '？' : `${b}${unit}`, x + 12, 168, 24);
  if (mode === 'less' || mode === 'more') {
    const start = x + Math.min(a, lower) * scale,
      end = x + Math.max(a, lower) * scale;
    body +=
      `<path d="M${start} 100V118H${end}V100" fill="none" stroke="#273449" stroke-width="2"/>` +
      text(`${b}${unit} ${mode === 'less' ? 'すくない' : 'おおい'}`, x, 222, 24);
  } else if (mode === 'difference') {
    body +=
      `<path d="M${x + wb} 96V113H${x + wa}V96" fill="none" stroke="#273449" stroke-width="2"/>` +
      text('ちがいは ？', x, 222, 24);
  } else body += text('あわせると ？', x, 222, 24);
  return asset(name, description, body);
}
for (const [hash, name, a, b, top, bottom, mode, unit] of [
  ['51c44ae28310', 'money-difference', 90, 30, 'みくさん', 'いもうと', 'difference', 'えん'],
  ['6c0325c6e9af', 'money-addition', 55, 30, 'もっている', 'もらう', 'add', 'えん'],
  ['77899e75da75', 'class-difference', 36, 30, '1くみ', '2くみ', 'difference', 'にん'],
  ['7cbc728997f0', 'pencils-fewer', 12, 3, 'はるかさん', 'たくまさん', 'less', 'ほん'],
  ['8aa8ea763eae', 'apples-fewer', 15, 7, 'ゆいさん', 'りこさん', 'less', 'こ'],
  ['91fcf0312a4a', 'children-addition', 15, 40, 'はじめ', 'あとから', 'add', 'にん'],
  ['a76d953c1d33', 'brother-age', 6, 2, 'りょうさん', 'おにいさん', 'more', 'さい'],
  ['d565d918d645', 'brother-candy', 5, 5, 'ゆうとさん', 'おにいさん', 'more', 'こ'],
] as const) {
  const id = legacy(9, hash),
    description = `${top}は ${a}${unit}。${bottom}は ${mode === 'less' ? `${b}${unit} すくなく、かずは はてな` : mode === 'more' ? `${b}${unit} おおく、かずは はてな` : `${b}${unit}`}。`;
  attach(id, bars(name, description, top, a, bottom, b, mode, unit), description);
}
function groups(
  name: string,
  description: string,
  groups: number,
  icon: string,
  each: number,
  people: boolean,
) {
  const body = Array.from({ length: groups }, (_, i) => {
    const x = 12 + i * (776 / groups),
      w = 760 / groups;
    return (
      `<g data-group-count="${each}"><rect x="${x}" y="16" width="${w}" height="218" rx="10" fill="#eaf3f7" stroke="#71869b" stroke-width="2"/>` +
      (people ? use('person', x + w / 2 - 27, 28, 54) : text('はん', x + 22, 55, 24)) +
      Array.from({ length: each }, (_, j) =>
        use(
          icon,
          x + 12 + (j % 2) * 58,
          people ? 110 + Math.floor(j / 2) * 56 : 76 + Math.floor(j / 2) * 62,
          52,
        ),
      ).join('') +
      '</g>'
    );
  }).join('');
  return asset(name, description, body);
}
for (const [hash, name, n, icon, each, people, desc] of [
  ['0ae1b28a84da', 'family-bread', 5, 'bread', 2, true, '5にんが それぞれ パンを 2こずつ もっています。'],
  [
    '696022d14077',
    'four-groups',
    4,
    'person',
    3,
    false,
    '4つの はんが あります。1つの はんに こどもが 3にんずつ います。',
  ],
  ['d3a516ae95c3', 'children-chocolate', 4, 'chocolate', 2, true, '4にんに チョコを 2こずつ くばります。'],
] as const)
  attach(legacy(9, hash), groups(name, desc, n, icon, each, people), desc);
illustrateRows(legacy(9, '21c817506842'), 'make-pairs', 'こども 8にん。2にんで 1つの はんに します。', [
  { label: 'こども', icon: 'person', count: 8 },
  { label: '1つの はん', icon: 'person', count: 2 },
]);
illustrateRows(
  legacy(9, '3e2f1449e1d8'),
  'share-bread',
  'わける まえの パンが 15こ。もらう こどもは 5にん。',
  [
    { label: 'わける パン', icon: 'bread', count: 15 },
    { label: 'もらう こども', icon: 'person', count: 5 },
  ],
);
illustrateRows(legacy(9, 'e3bac09b0df6'), 'share-candy', 'あめが 9こ。1にんに 3こずつ くばります。', [
  { label: 'ぜんぶの あめ', icon: 'candy', count: 9 },
  { label: '1にんぶん', icon: 'candy', count: 3 },
]);

// 画像追加で本文と入力テンプレートが二重になる旧文章題は、入力欄だけの形にそろえる。
for (const q of all.filter((q) => changed.has(q.id) && q.type === 'text-input')) {
  const p = q.payload;
  if (typeof p.template === 'string' && p.template.length > 45 && (p.answers as string[]).length === 1) {
    p.template = `{{INPUT}}${p.suffix ?? ''}`;
    const suffix = String(p.suffix ?? '');
    if (suffix && String(p.prompt).endsWith(` ${suffix}`))
      p.prompt = String(p.prompt).slice(0, -suffix.length - 1);
    p.prompt = String(p.prompt).replace(/ 人\[ひと\]$/, '');
  }
}
assert.equal(
  JSON.stringify(all.map((q) => [q.id, q.grade, q.unit, answers(q)])),
  before,
  'Do not change the learning target or correct answer',
);
for (const { file, questions } of sets) writeFileSync(file, JSON.stringify(questions, null, 2) + '\n');
const review = all.map((q) => ({
  id: q.id,
  decision: changed.has(q.id)
    ? 'illustrated'
    : q.payload.promptImage || (q.payload.choices as { image?: string }[] | undefined)?.some((c) => c.image)
      ? 'existing-visual'
      : q.type === 'number-build'
        ? 'interactive'
        : 'symbol-practice',
  reason:
    changed.get(q.id) ??
    (q.payload.promptImage || (q.payload.choices as { image?: string }[] | undefined)?.some((c) => c.image)
      ? '既存の図版を維持'
      : q.type === 'number-build'
        ? '数を作る・数直線の操作で学ぶため維持'
        : '式・数字列・数の組合せそのものを読む練習として維持'),
}));
writeFileSync('scripts/data/sansu-g1-visual-review.json', JSON.stringify(review, null, 2) + '\n');
console.log(`${changed.size} of ${all.length} questions illustrated`);
