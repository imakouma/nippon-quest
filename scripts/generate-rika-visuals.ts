/** 元の正答・選択肢を保ち、観察対象と実験条件を図解する。 */
import { strict as assert } from 'node:assert';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import {
  arrow,
  arm,
  battery,
  beaker,
  bulb,
  butterfly,
  candle,
  caterpillar,
  circle,
  circuit,
  clip,
  cloud,
  coil,
  fish,
  group,
  heat,
  ink,
  insect,
  jar,
  leaf,
  magnet,
  magnifier,
  path,
  pendulum,
  plant,
  rect,
  scale,
  seed,
  sprout,
  sun,
  syringe,
  text,
  thermometer,
  tree,
  xml,
} from './rika-visuals/drawing';

interface Question {
  id: string;
  type: string;
  grade: number;
  unit: string;
  tags?: string[];
  explanation?: string;
  payload: {
    prompt?: string;
    promptImage?: string;
    promptImageAlt?: string;
    promptSpeech?: string;
    template?: string;
    suffix?: string;
    answer?: string;
    answers?: string[];
    choices?: { id: string; text?: string }[];
  };
}
const sets = readdirSync('content/questions/rika', { recursive: true })
  .filter((f) => String(f).endsWith('.json'))
  .sort()
  .map((file) => ({
    file: `content/questions/rika/${file}`,
    questions: JSON.parse(readFileSync(`content/questions/rika/${file}`, 'utf8')) as Question[],
  }));
const all = sets.flatMap((s) => s.questions);
assert.equal(all.length, 689, 'Review added or removed science questions');
const signature = () =>
  JSON.stringify(
    all.map((q) => [q.id, q.type, q.grade, q.unit, q.payload.answer, q.payload.answers, q.payload.choices]),
  );
const before = signature();
const repairs = JSON.parse(readFileSync('scripts/data/rika-source-repairs.json', 'utf8')) as {
  id: string;
  prompt: string;
  sourceAnswer: string;
  reviewedAnswer?: string;
}[];
const normalize = (s: string) =>
  s
    .replace(/\[[^\]]+\]/g, '')
    .normalize('NFKC')
    .replace(/[\s,、・。]/g, '');
for (const repair of repairs) {
  const q = all.find((q) => q.id === repair.id)!;
  assert(q, repair.id);
  assert.equal(
    normalize(q.payload.choices!.find((c) => c.id === q.payload.answer)!.text!),
    normalize(repair.reviewedAnswer ?? repair.sourceAnswer),
    repair.id,
  );
  q.payload.prompt = repair.prompt;
}
const dir = 'assets/questions/rika/visuals';
mkdirSync(dir, { recursive: true });
const changed = new Map<string, string>();
function draw(name: string, hashes: string[], description: string, body: string, height = 260) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="${height}" viewBox="0 0 480 ${height}" role="img" aria-label="${xml(description)}"><title>${xml(description)}</title><rect width="480" height="${height}" rx="12" fill="#fff"/><g fill="${ink}" font-family="sans-serif">${body}</g></svg>\n`;
  assert(!svg.includes('undefined'));
  writeFileSync(`${dir}/${name}.svg`, svg);
  for (const hash of hashes) {
    const matches = all.filter((q) => q.id.endsWith(hash));
    assert.equal(matches.length, 1, hash);
    const q = matches[0]!;
    assert(!changed.has(q.id), `Duplicate illustration: ${q.id}`);
    assert(
      !q.payload.promptImage || q.payload.promptImage.startsWith('questions/rika/visuals/'),
      `Keep existing image: ${q.id}`,
    );
    q.payload.promptImage = `questions/rika/visuals/${name}.svg`;
    if (q.type === 'choice') q.payload.promptSpeech = `${q.payload.prompt} ${description}`;
    else q.payload.promptImageAlt = description;
    changed.set(q.id, description);
  }
}

draw(
  'series-motor',
  ['e6b07deb3339'],
  '電池2ことモーターをひとつの輪につないだ回路。回る速さは示さない。',
  circuit('series', true),
);
draw(
  'parallel-bulb',
  ['34a0265e47c7'],
  '2この電池のプラスどうしとマイナスどうしをつないで豆電球につなぐ回路。明るさは示さない。',
  circuit('parallel'),
);
draw(
  'bulb-glass',
  ['498c16e51fe0'],
  '導線の先が豆電球のガラスの部分にふれている。金属の口金にはつながっていない。',
  group(240, 100, bulb(), 2) + path('M185 72H70v125h128M295 72h115v125H290') + group(240, 197, battery()),
);
draw(
  'chest-bones',
  ['38c5ed1aaf60'],
  '胸の骨が、肺や心臓のある場所を囲む模式図。骨の役割は書かない。',
  path('M240 45V210', 'none', '#c5a781', 12) +
    path('M220 85q-55-35-65 35v65q35 25 65-10Z', '#e8bcb9') +
    path('M260 85q55-35 65 35v65q-35 25-65-10Z', '#e8bcb9') +
    [0, 1, 2, 3, 4]
      .map((i) =>
        path(`M240 ${70 + i * 25}q-110-30-90 20q40 25 90 0q50 25 90 0q20-50-90-20`, 'none', '#d1b68f', 7),
      )
      .join(''),
);
draw(
  'magnet-barrier',
  ['76b1b18ef7de'],
  '磁石と鉄のくぎの間にプラスチック板を置いた。くぎの動く結果は示さない。',
  group(65, 105, magnet(), 1.1) +
    rect(235, 45, 15, 150, '#d1e7f4') +
    path('M365 90v90m-12-90h24', 'none', '#6c8396', 5) +
    text('プラスチック板', 235, 235, 24),
);
// 小3: 生き物の形と、実験する前の配置を示す。
draw(
  'magnifying-leaf',
  ['45d11cceb0fa', 'a86d2fdd1dba', 'bfad0c46dd5f'],
  '葉を虫めがねで観察する場面。レンズと葉の間のきょりを変えて調べる。',
  group(125, 125, leaf(0, 0), 2) + group(300, 115, magnifier()) + text('葉を かんさつ', 240, 230),
);
draw(
  'leaf-shape',
  ['d3f6b99414c3', '9bc36598332d'],
  '形のちがう2枚の葉。丸みのある葉と、ふちがぎざぎざした葉を並べている。',
  group(135, 150, leaf(0, 0), 2) +
    path(
      'M320 185l-55-35 16-5-18-20 18-3-9-25 20 2-2-24 20 8 12-28 14 27 19-8-3 25 20-2-9 25 18 4-17 20 16 4Z',
      '#85bf69',
    ) +
    path('M320 185V90') +
    text('形を くらべよう', 240, 235),
);
draw(
  'plant-body',
  ['83348d998a7c', '20c6ed71fda1', '9913caa90f00', 'dd879a5ec396', '4d18732ae6c6', 'e4366cfde9ef'],
  '植物の全体を、地面の上と下に分けて示した図。部分の名前のラベルはない。',
  path('M40 177H440', 'none', '#ad9275') + group(240, 68, plant()) + text('地面', 410, 205, 24),
);
draw(
  'plant-height',
  ['9ae2fd9effd3', '36a0387cbcd4', '45969d4c94f1', '1e1561d0b8f9'],
  '植物の横に高さを測るものさしを置いた観察の図。',
  group(215, 65, plant()) +
    rect(325, 40, 30, 170, '#fff0c9') +
    Array.from({ length: 9 }, (_, i) => path(`M325 ${50 + i * 18}h${i % 2 ? 12 : 21}`)).join('') +
    text('高さ・葉・くき', 240, 240),
);
draw(
  'sunflower-balsam',
  ['1a3f0ae2f679'],
  'ヒマワリとホウセンカの苗。同じ時期に観察して、これからの育ち方を比べる。',
  group(135, 100, sprout()) +
    group(340, 100, sprout()) +
    text('ヒマワリ', 135, 230) +
    text('ホウセンカ', 340, 230),
);
draw(
  'seed-sowing',
  ['584930957bfb', '5b45b0a6c3bc', '82a733220e1f', 'ad90e75aae3f', '3133ae0d9f80'],
  '土を入れた植木鉢と苗。植えつけや水やりを考える場面。',
  path('M90 125h115l-15 85h-85Z', '#ddab7e') +
    path('M95 135h105', 'none', '#795b3b', 12) +
    group(150, 81, sprout(), 0.7) +
    path('M305 105h70v70h-70zM375 135l45-35 8 14-53 40M305 115q-55-20-45 30q5 20 45 10', '#a8ccdf') +
    text('土と なえ', 150, 245),
);
draw(
  'young-leaves',
  ['980986c641f6', 'b639074466f8', 'd3c4f83856d9', 'a3a3c4ab179a'],
  '芽が出たばかりの苗と、さらに葉が出た苗。葉の形や枚数を観察する。',
  group(130, 110, sprout()) +
    group(340, 90, sprout()) +
    group(340, 75, leaf(0, 0), 0.65) +
    group(340, 70, leaf(0, 0), -0.65) +
    text('出たばかり', 130, 235, 24) +
    text('そのあと', 340, 235, 24),
);
draw(
  'insect-body',
  ['61e7fc9e66a8', '6b5fef5033f0', '992fe0cc2ba0', 'e47faa3b789a'],
  '昆虫を上から見た模式図。体のまとまり、触角、足のつながる様子を示す。名前のラベルはない。',
  group(240, 130, insect(), 1.2),
);
draw(
  'caterpillar',
  ['130d28eef4b2', '4beecd4f35d9'],
  '葉の近くにいる細長い生き物。体の形を観察する。',
  group(185, 140, caterpillar(), 1.4) + group(370, 190, leaf(0, 0), 1.7),
);
draw(
  'insect-habitats',
  ['09857a7b399f', '466eeb823e9e', '6e5324aa1379', 'dbd37e9cd9c9'],
  '池、落ち葉の下、葉のある草という3つのすみか。どの生き物がくらすかを考える。',
  path('M25 90q55-35 110 0v65q-55 35-110 0Z', '#c5e8fa') +
    text('池', 80, 205) +
    group(250, 120, leaf(0, 0), 1.5) +
    group(280, 145, leaf(0, 0)) +
    text('落ち葉', 245, 205) +
    group(400, 75, plant(), 0.6) +
    text('草', 400, 205),
);
draw(
  'butterfly-stages',
  ['c86850339a50'],
  'チョウの成長の4つの姿を順不同で示す。成虫、卵、さなぎ、幼虫。順序の矢印はない。',
  group(125, 65, butterfly(), 0.55) +
    text('せい虫', 125, 145) +
    circle(355, 73, 13, '#fff4c9') +
    text('たまご', 355, 145) +
    path('M130 185q-36 55 0 65q36-30 0-65', '#a8bc6c') +
    text('さなぎ', 125, 290) +
    group(305, 225, caterpillar()) +
    text('よう虫', 355, 290),
  310,
);
draw(
  'mirror-light',
  ['16fe7ff6d3a6', '5a2f7fb57c47'],
  '日光を鏡ではね返して、板に当てる実験。光の進み方や重なった部分を調べる。',
  group(65, 65, sun(), 0.65) +
    path('M110 60L180 160', 'none', '#e6b443', 5) +
    path('M145 180l70-45', 'none', '#8da7ba', 12) +
    rect(340, 55, 25, 140, '#eee7d3') +
    text('かがみ', 175, 235) +
    text('板', 355, 235),
);
draw(
  'sound-drum',
  ['1baad717e855', '4c167c73fe8e'],
  '太鼓の上に小さな紙片を置き、ばちでたたいて観察する実験。紙片の動きは描かない。',
  rect(110, 115, 200, 75, '#dc9a75') +
    '<ellipse cx="210" cy="115" rx="100" ry="25" fill="#fff1dc" stroke="#26394a" stroke-width="3"/>' +
    rect(175, 102, 12, 8, '#e7b94d') +
    rect(232, 112, 12, 8, '#8dbbd3') +
    path('M280 45l70 70', 'none', '#927451', 10) +
    text('紙を のせた 太鼓', 240, 235),
);
draw(
  'string-phone',
  ['cdddd90ce47f'],
  '2つの紙コップを糸でつないだ糸電話。糸の張り方を考える。',
  path('M55 75h60l-10 90H65Z', '#f6deb4') +
    path('M365 75h60l-10 90h-40Z', '#f6deb4') +
    path('M85 165Q240 205 395 165', 'none', '#617e91') +
    text('糸電話', 240, 245),
);
draw(
  'triangle-sound',
  ['cf4ced4396dc'],
  'トライアングルと、たたくための金属の棒。',
  path('M230 45L120 200h205l-22-38', 'none', '#95acbb', 9) + path('M330 85l60 80', 'none', '#95acbb', 7),
);
draw(
  'wind-car',
  ['10426b245212', '10449977149d', '357e6c67f8aa', '3f39fe355c4a', 'd28c7d90a446'],
  '風を当てる前の帆つきの車と送風機。車の進むきょりは示していない。',
  rect(55, 110, 55, 65, '#d5e7f0') +
    circle(85, 80, 35, '#eaf4fa') +
    path('M85 55v50m-25-25h50') +
    rect(275, 155, 105, 25, '#e5ae71') +
    circle(295, 185, 15, '#d4dce3') +
    circle(360, 185, 15, '#d4dce3') +
    path('M320 155V55l55 80h-55', '#a8d8f0') +
    path('M25 210H445') +
    text('風を 当てる', 110, 245),
);
draw(
  'rubber-car',
  ['1ca209e91733', '29f106612467', '9b6b729600bb', 'bf887024cad1', 'c9d8cb9f4443'],
  '車につけたゴムを引きのばして走らせる実験。出発位置だけを示し、進むきょりは描かない。',
  rect(245, 100, 110, 35, '#e5ae71') +
    circle(265, 145, 16, '#d4dce3') +
    circle(335, 145, 16, '#d4dce3') +
    path('M245 115Q145 90 65 115Q145 140 245 115', 'none', '#cb8b55', 5) +
    path('M65 85v60M220 180H440') +
    text('ゴムを のばす', 155, 220),
);
draw(
  'sun-shade',
  ['2b2e5dc2a113', '5b194e123371', '5f2169dd2509', '8865ac68a7c5', 'c8975261bcb0', 'df505e894844'],
  '日なたと建物のかげを比べる場面。2か所に温度計を置く。温度の数値は示さない。',
  group(65, 55, sun(), 0.7) +
    rect(225, 55, 90, 130, '#d5dce2') +
    path('M315 185l120 35H225Z', '#c8d0d7', 'none') +
    group(145, 157, thermometer(), 0.55) +
    group(375, 157, thermometer(), 0.55) +
    text('日なた', 110, 245) +
    text('かげ', 375, 245),
);
draw(
  'thermometer-reading',
  ['45545669c0bb', '93a3004d88af'],
  '温度計の目もりと液の高さを大きく示す。目を置く位置は描かない。',
  group(240, 120, thermometer(), 1.1) + text('目もりを 読む', 210, 240),
);
draw(
  'compass',
  ['2f951fbe25b6', 'a443c7ae33a4'],
  '水平に置いた方位磁針。色のついた針と白い針があり、方位の答えの文字はない。',
  circle(240, 125, 87, '#f4f7fa') +
    path('M240 50l-17 75h34Z', '#e48d83') +
    path('M240 200l-17-75h34Z', '#fff') +
    circle(240, 125, 7, ink) +
    [0, 90, 180, 270].map((a) => `<g transform="rotate(${a} 240 125)">${path('M240 40v12')}</g>`).join(''),
);
draw(
  'circuit-single',
  ['2d105d494dd5', '3d64605e8be5', '9ea5bfe12c6d', 'e9416fa6bbec', 'ff616c610e4d'],
  '乾電池と豆電球を導線でつないだ回路。豆電球の明るさや電流の向きは図に示さない。',
  circuit('single'),
);
draw(
  'circuit-open',
  ['5e58452f94a5'],
  '乾電池と豆電球の回路の途中が切れている。電球が光るかどうかは示さない。',
  circuit('open'),
);
draw(
  'conductor-test',
  ['1b90f658c982', '1e75a02b83d2', '3ac86d4160a6', '5f64bd3987e1', '8b4fbe78fa4b', '988c0be26210'],
  '導線の中の金属と外側のおおいを大きく示す。電気をつなぐ場所を考える。',
  path('M55 110H300', 'none', '#73a6c4', 28) +
    path('M300 110h105', 'none', '#c58b4b', 10) +
    text('おおい', 160, 180) +
    text('中の金属', 370, 180),
);
draw(
  'magnet-same',
  ['42f3e50c6206'],
  'N極どうしを近づけた2本の棒磁石。動く向きの矢印は描かない。',
  group(70, 105, magnet(true)) + group(310, 105, magnet()) + text('同じ 極', 240, 205),
);
draw(
  'magnet-opposite',
  ['89b4fcaefc8e'],
  'S極とN極を向かい合わせた2本の棒磁石。動く向きは描かない。',
  group(70, 105, magnet()) + group(310, 105, magnet()) + text('ちがう 極', 240, 205),
);
draw(
  'magnet-parts',
  ['027f51f5d70c', '826215f6a7df'],
  '棒磁石の両端とまん中を①、②、③で示す。引きつける力の強さは描かない。',
  group(90, 95, magnet(), 3) + text('①', 105, 70) + text('②', 240, 70) + text('③', 375, 70),
);
draw(
  'magnet-iron',
  ['1da0cd3c9d1d', '49e5b2f7126c', '7d8945a82ba2', '8cfe9816af21', '9e8f507c75e5', 'a11c4f96e5d4'],
  '棒磁石と、近くに置いた鉄のくぎとクリップ。間にすきまがあり、動く結果は示さない。',
  group(75, 85, magnet(), 1.4) +
    path('M315 85v95m-12-95h24', 'none', '#6c8396', 5) +
    group(375, 120, clip()) +
    text('鉄のくぎ', 300, 225, 24) +
    text('クリップ', 405, 225, 23),
);
draw(
  'clay-shape',
  ['1e2ea9453164', '62c5d7178bb5', '643ed37368ef', '72749b5d85f5'],
  '同じ材料を丸い形と平たい形にしたときの重さを比べる。はかりの表示は空欄。',
  group(120, 155, scale()) +
    circle(120, 108, 30, '#deba91') +
    group(360, 155, scale()) +
    path('M310 125l20-28 80 6 12 22Z', '#deba91') +
    text('形を 変える', 240, 235),
);
draw(
  'equal-volume',
  ['2f37f992c555', '4267ce0a6a92', '935fc1d30972', 'a018956dd332', 'eb9526d72cd6'],
  '同じ大きさのアルミニウム、木、プラスチックの立方体。重さの結果は示さない。',
  rect(40, 75, 90, 90, '#bdcbd4') +
    rect(195, 75, 90, 90, '#d9b58a') +
    rect(350, 75, 90, 90, '#a3d0df') +
    text('アルミ', 85, 215) +
    text('木', 240, 215) +
    text('プラスチック', 395, 215, 21),
);

// 小4: 変える条件と観察する場所を図にする。予想する結果は描かない。
draw(
  'air-temperature',
  ['2b087bc23952', '9d6e2516a86b', 'c16bf5d20984'],
  '木の近くで温度計を使う場面。地面からの高さの数値は書いていない。',
  group(110, 110, tree()) +
    group(310, 110, thermometer()) +
    path('M25 215H455') +
    path('M360 215V52m-10 0h20m-20 163h20') +
    text('高さは？', 405, 125, 22),
);
draw(
  'weather-observation',
  ['4c2bd8d56476', '964c7e0f5f80', 'a2f67510d152', 'e0bbd2cf8a4f', '5cb00c159493'],
  '晴れた空と雨の空を並べ、どちらも温度計で観察する。気温の結果は示さない。',
  group(115, 75, sun()) +
    group(360, 70, cloud(), 0.8) +
    path('M320 110l-10 15m40-15-10 15m40-15-10 15', 'none', '#5283a7') +
    group(115, 185, thermometer(), 0.45) +
    group(360, 185, thermometer(), 0.45),
);
draw(
  'seasonal-observation',
  [
    '19a2bbe3675f',
    '2cbfeaf6a76a',
    'f3825866490e',
    'f8259173bdf0',
    '18100477df93',
    '24313c9f106a',
    '7416ae78d211',
    '791e489b88ad',
    'ee652373ec82',
    '1d4771cc882b',
    'a6b5c3d4210c',
    '1e17f1ffef29',
    '2052e85620d7',
    '737196a41667',
    'b3194b961594',
    'c7830b01cbdb',
    'e9339a00c4d0',
    'ff29eda54318',
  ],
  '植物と動物を季節ごとに観察するカード。木とチョウ、春、夏、秋、冬の記録欄があり、観察結果はまだ空欄。',
  group(95, 95, tree(), 0.65) +
    group(130, 190, butterfly(), 0.55) +
    ['春', '夏', '秋', '冬']
      .map(
        (s, i) =>
          rect(230 + (i % 2) * 115, 30 + Math.floor(i / 2) * 110, 100, 90) +
          text(s, 280 + (i % 2) * 115, 65 + Math.floor(i / 2) * 110) +
          text('？', 280 + (i % 2) * 115, 105 + Math.floor(i / 2) * 110),
      )
      .join(''),
);
draw(
  'summer-vine',
  ['309d3b122c29', '78dc40687631'],
  '支柱を立てたツルレイシの苗と、観察する木。これからの葉や花の変化を考える。',
  path('M70 200V40h110v160M70 75h110m-110 40h110m-110 40h110', 'none', '#a79778') +
    group(130, 115, sprout()) +
    group(350, 125, tree(), 0.85),
);
draw(
  'mantis-eggs',
  ['b8a57531ba12', '471c13b400f0'],
  '細い枝に付いている茶色い卵のかたまりと、近くに描いたカマキリ。成長を観察する対象を示す。',
  path('M65 180L200 55', 'none', '#96744c', 7) +
    path('M110 145q-30-30 0-50q55-20 65 15q0 30-65 35', '#c6aa7d') +
    Array.from({ length: 6 }, (_, i) => path(`M${120 + i * 7} 100l8 30`, 'none', '#927651', 2)).join('') +
    group(
      340,
      125,
      path('M-25-55L25-55 0-30Z', '#98ba78') +
        path('M0-30V40', 'none', '#7da265', 16) +
        path(
          'M0-12l-35-25 10 35M0-12l35-25-10 35M0 10l-40 20-15 35M0 10l40 20 15 35M0 30l-25 30M0 30l25 30',
          'none',
          '#526d46',
          4,
        ) +
        path('M-12-55l-10-20M12-55l10-20'),
    ),
);
draw(
  'motor-circuit',
  ['ceb312650c85', 'd4d68c1c529c', 'bb4cf50ece88'],
  '乾電池とモーターを導線でつないだ回路。回る向きや速さは示していない。',
  circuit('motor'),
);
draw(
  'ammeter',
  ['3b6f2a0371fd', 'ab91fb981c89', 'df71eee3fe1a'],
  '中央が0のかんい検流計。左右にふれる針と、導線をつなぐ端子を示す。道具の名前は図には書かない。',
  rect(110, 40, 260, 165, '#e3edf1') +
    path('M145 145Q240 35 335 145') +
    path('M240 145V77', 'none', '#c26f5c', 5) +
    text('0', 240, 63) +
    text('−', 150, 140) +
    text('+', 330, 140) +
    circle(165, 187, 8, '#94b9cc') +
    circle(315, 187, 8, '#e29a8e'),
);
draw(
  'circuit-series',
  ['6aa7c715e72c', 'f4c0d08b8776'],
  '電池を2こ一列につなぎ、電球と回路にした図。電流や明るさの変化は示さない。',
  circuit('series'),
);
draw(
  'circuit-parallel',
  ['044c9f542b2d', 'eec98d250b09'],
  '電池のプラスどうし、マイナスどうしをつないだ回路。モーターの速さは示さない。',
  circuit('parallel', true),
);
draw(
  'syringe-air',
  ['4f3819fd3e4a', '7bc760cfb26e', '81675f00e86e', 'f067d2db8a66'],
  '出口をふさいで空気を閉じこめた筒。押す前のピストンの位置を示す。',
  syringe(false),
);
draw(
  'syringe-water',
  ['600963ece2ca', '72d74dd61fbc', 'd42bb8d5d143'],
  '出口をふさいで水を閉じこめた筒。押した後のピストンの位置は示さない。',
  syringe(true),
);
draw(
  'syringe-compare',
  ['3799f1baed23'],
  '同じ形の筒に空気と水をそれぞれ閉じこめた。どちらも押す前で、変化はまだ描いていない。',
  group(0, 0, syringe(false), 0.9) + group(0, 210, syringe(true), 0.9),
  440,
);
const starDisc =
  circle(240, 125, 104, '#d9dfe8') +
  circle(240, 125, 80, '#233a56') +
  path('M170 130Q240 50 310 130Q240 190 170 130', '#fff4c5') +
  [0, 45, 90, 135, 180, 225, 270, 315]
    .map((a) => `<g transform="rotate(${a} 240 125)">${path('M240 24v12')}</g>`)
    .join('') +
  [
    [200, 107],
    [244, 87],
    [265, 133],
    [222, 151],
    [281, 112],
  ]
    .map(([x, y]) => circle(x!, y!, 3, '#7187a0'))
    .join('');
draw(
  'star-chart',
  ['1994e8fb649f', '1d6dd11f9a3d', '739679e78171', 'b10edd43678f', '00663db7499d'],
  '回転させる円盤と星を見る窓がある星座観察用の道具。道具の名前は書かない。正確な星の位置を調べるための星図ではなく、形を示す模式図。',
  starDisc,
);
draw(
  'summer-triangle',
  ['a2484e68bb0b'],
  '明るい3つの星、ベガ、デネブ、アルタイルを線で結んだ模式図。図形の名前は書かない。',
  rect(15, 15, 450, 230, '#e9f1f8') +
    path('M130 65L345 70 255 195Z', 'none', '#738ca5', 2) +
    circle(130, 65, 7, '#f7ca65') +
    circle(345, 70, 7, '#f7ca65') +
    circle(255, 195, 7, '#f7ca65') +
    text('ベガ', 115, 40, 23) +
    text('デネブ', 360, 45, 23) +
    text('アルタイル', 255, 237, 23),
);
draw(
  'soil-grains',
  ['7bb2c46060c7', '8a56a93b8111', 'd25069bd2604'],
  '同じ大きさの容器に入れた大きな土のつぶと小さな土のつぶ。水の通る速さは示さない。',
  rect(45, 55, 165, 130, '#f1e8d7') +
    rect(270, 55, 165, 130, '#f1e8d7') +
    Array.from({ length: 12 }, (_, i) =>
      circle(69 + (i % 4) * 39, 80 + Math.floor(i / 4) * 40, 17, '#c7ad87'),
    ).join('') +
    Array.from({ length: 60 }, (_, i) =>
      circle(283 + (i % 10) * 15, 68 + Math.floor(i / 10) * 20, 6, '#c7ad87'),
    ).join('') +
    text('大きな つぶ', 125, 230) +
    text('小さな つぶ', 355, 230),
);
draw(
  'sloping-ground',
  ['0baae1821827', '38c919888283', '99199a72b3c9', 'be7d77ff44d3', 'e3e421d03b9b'],
  '高さのちがう地面と、上から落ちる雨。水が流れる方向やたまる場所の答えは図に書かない。',
  path('M25 100L180 145 250 200 330 178 455 190V240H25Z', '#d6bf9c') +
    group(240, 65, cloud(), 0.75) +
    path('M180 88l-8 18m45-10-8 18m45-10-8 18m45-10-8 18', 'none', '#5283a7'),
);
draw(
  'evaporation-cups',
  ['2e8510d75451', '4ce981cc6be3', 'b8df3441ba08'],
  '水を入れた同じコップを、ふたなしとラップありで並べた。水面は同じ高さで、あとの変化を予想する。',
  group(120, 125, beaker()) +
    group(360, 125, beaker('#b8dfff', true)) +
    text('ふたなし', 120, 230) +
    text('ラップあり', 360, 230),
);
draw(
  'cold-bag',
  ['26bc215a0434', 'd86b93449e58', 'f0bd2048b814', 'e907dd52095c'],
  '冷たい保冷剤を密封した袋の外側に水滴が付いている。水の出どころは図に示さない。',
  rect(130, 45, 220, 155, '#eaf4fc') +
    rect(175, 75, 130, 90, '#b6d5ec') +
    text('保冷剤', 240, 130, 25) +
    [
      [120, 90],
      [360, 135],
      [150, 210],
      [325, 215],
    ]
      .map(([x, y]) => path(`M${x} ${y}q-13 20 0 22q13-2 0-22`, '#97cbee'))
      .join(''),
);
draw(
  'moon-observation',
  [
    '0e079e9bc4d2',
    '31f6f4dba2d8',
    '405644258fa8',
    '794b16e15cbb',
    '9ca9f26bec56',
    'ba09bd125739',
    'cf2c8954c155',
  ],
  '地上の目印と空に見える月。記録用の方位と時刻の欄は空欄で、月の移動する向きは描かない。',
  rect(20, 20, 440, 155, '#e9f1f8') +
    circle(330, 65, 24, '#ffeeb9') +
    path('M55 165v-50l30-25 30 25v50M75 165v-30h20v30', '#d4dce5') +
    text('方位：＿＿  時刻：＿＿', 240, 225, 24),
);
draw(
  'arm-bones',
  ['31f2ee594417', '405b54ddb6d5', '461384f9defd', '6d1f16fbd776', '9e2f0c5b14b5', 'f99da9a882bb'],
  'ひじで曲がった腕の模式図。内側の骨と赤い筋肉を示す。収縮前後の変化や部分の答えの名前は描かない。',
  group(240, 130, arm(), 1.5),
);
draw(
  'heated-metal',
  ['1ec7274f2cc2', '4d2d857bd8f8', '61961a25bc5d'],
  '金属の棒を温めたり冷やしたりして長さの変化を調べる。棒のあとの長さは示さない。',
  rect(65, 85, 350, 35, '#c6d2da') +
    group(150, 180, heat(), 1.7) +
    text('金属の 棒', 240, 45) +
    text('長さを くらべる', 240, 240),
);
draw(
  'heated-water',
  ['2b3787da1435', '46dc44de466c', '57906082a8c8', 'b3a544eba604', 'e5c7dc0daa15'],
  '水を入れたフラスコに細い管を付け、湯で温める実験。管の水面がどう動くかを考える。',
  path('M70 95v120h340V95', '#ffe5bf') +
    path('M220 60v55q-65 30-40 75h120q25-45-40-75V60Z', '#bfdff3') +
    rect(230, 20, 20, 100, '#ecf7fc') +
    path('M240 115V70', 'none', '#4b8eae', 6) +
    text('湯', 380, 180) +
    text('水面は？', 335, 55, 24),
);
draw(
  'heated-air',
  [
    '1cb7157dbdcf',
    '57d45ff216b9',
    '5821980d1bf6',
    '78b7afad36fd',
    '9043fa2674b7',
    '9b63efae9a35',
    'cb73f7fe1894',
    'f640e124c0d6',
  ],
  '空気の入ったびんの口に石けん膜を付け、湯で温める。膜はまだふくらんでいない。',
  path('M70 100v115h340V100', '#ffe5bf') +
    path('M220 55v55q-45 25-45 75h130q0-50-45-75V55Z', '#edf6fb') +
    path('M215 55h50', 'none', '#7aa7bd', 4) +
    text('空気', 240, 160) +
    text('石けん膜', 240, 35, 23) +
    text('湯', 380, 180),
);
draw(
  'metal-conduction',
  ['5e554c0cec90', '6507600aa446', '95be7176fe62', '9c7020398ea7', 'd03aa05a175c', 'fe7280f681ca'],
  '金属の棒の一端を温める実験。棒の上に同じ間隔でろうを置く。どこからとけるかは描かない。',
  rect(60, 85, 360, 27, '#c7d4de') +
    [100, 170, 240, 310, 380].map((x) => circle(x, 80, 7, '#f5dc94')).join('') +
    group(95, 165, heat(), 1.5) +
    text('ろう', 320, 45) +
    text('一方の はしを 温める', 240, 235, 24),
);
draw(
  'pan-handle',
  ['6fe6da8c180e'],
  '金属のフライパンと、色や材料のちがう取っ手を示す。',
  path('M70 115h230q-15 65-115 65T70 115', '#bdcbd4') +
    path('M300 130h110', 'none', '#7c8896', 22) +
    text('金属', 180, 75) +
    text('取っ手', 375, 75),
);
draw(
  'water-heating',
  [
    '3b1ba621982d',
    '43eecc7170f4',
    '487010f47b5a',
    '824b3ba12f07',
    'baa38010e475',
    'fdd4ff7b4007',
    '3d47f44c202d',
    'rika.g4.mizu-no-sugata.0002',
  ],
  'ビーカーの水を下から温め、温度計で調べる実験。水の動く方向や沸騰の温度は示さない。',
  group(220, 115, beaker()) +
    group(255, 93, thermometer(), 0.7) +
    path('M155 180h130m-115 0-10 30m110-30 10 30') +
    group(200, 220, heat(), 0.9),
  270,
);
draw(
  'warm-room',
  ['71979b289b43', 'cb116a328349'],
  '部屋の低い位置に暖房器具を置き、上と下に温度計を置いた図。温度差や空気の動きは示さない。',
  rect(50, 25, 380, 210, '#f5f2e9') +
    rect(95, 170, 90, 50, '#e9b596') +
    [110, 130, 150, 170].map((x) => path(`M${x} 180v30`)).join('') +
    group(350, 75, thermometer(), 0.4) +
    group(350, 185, thermometer(), 0.4),
);
draw(
  'cooling-water',
  ['3c80af05d7af', 'rika.g4.mizu-no-sugata.0001', 'rika.g4.mizu-no-sugata.0003', '6ea090d8c6c7'],
  '水を入れた容器を氷の近くで冷やし、温度計で観察する。温度の数値や体積の変化は示さない。',
  group(230, 115, beaker()) +
    group(255, 100, thermometer(), 0.7) +
    rect(65, 155, 55, 45, '#c1e4f6') +
    rect(350, 150, 55, 50, '#c1e4f6') +
    text('冷やす', 240, 240),
);

// 小5: 原因や結果のラベルを足さず、実験の設定と生物の構造を補助する。
draw(
  'pendulum-timing',
  ['cb0d7e4a1508', 'f31f512b595e'],
  'ふりことストップウォッチ。ふりこが動く時間を測る場面で、時間の数値は空欄。',
  group(150, 130, pendulum()) +
    circle(365, 125, 49, '#eef5fa') +
    rect(351, 57, 28, 18, '#b4c6d2') +
    text('？秒', 365, 137) +
    text('時間を はかる', 240, 245),
);
draw(
  'germinating-seed',
  ['c7a2088d9d7b', 'ee47449d7eb9', 'fe0ee81a9e27'],
  '種から根と芽が出始めた状態を示す。必要な条件や現象の名前は図に書かない。',
  group(130, 130, seed(), 1.5) + arrow(205, 135, 60) + group(345, 102, sprout(), 1.1),
);
draw(
  'seed-reserves',
  ['c3e6d083d142'],
  '育ち始めたインゲンマメの苗。下の2枚の子葉と、その上に出た葉を示す。養分の変化は図に書かない。',
  group(240, 110, sprout(), 1.2) +
    group(240, 70, leaf(0, 0)) +
    group(240, 60, leaf(0, 0), -1) +
    text('苗を かんさつ', 240, 235),
);
draw(
  'medaka-tank',
  ['0f0f312f0460', '4a5a88e9a10e', '8d1139a33d93'],
  '水草を入れた水そうの中をメダカが泳ぐ。卵や水草のはたらきは描かない。',
  rect(40, 35, 400, 180, '#e8f5fc') +
    path('M45 65H435', 'none', '#72afcc') +
    group(210, 115, fish(), 0.7) +
    path('M345 205V85m0 90l-30-30m30 10l28-30m-28 0-25-25m25 8 24-25', 'none', '#5b995b', 6),
);
draw(
  'fish-egg',
  ['8676d6f1f289'],
  'たまごの中にいるメダカと、腹の近くにある丸い部分を大きく示した模式図。部分のはたらきは書かない。',
  circle(240, 130, 90, '#edf7fc') +
    circle(245, 150, 43, '#f5dfa0') +
    path('M200 140q-45-80 35-78q90 2 58 85q-5 30-27 40', 'none', '#a0b9c7', 19) +
    circle(194, 111, 13, '#c4dbe2') +
    circle(194, 108, 5, ink),
);
draw(
  'flower-pollen',
  ['31aceeffc614', '8e63cdbbe16f'],
  '花を横から見た模式図。中央のめしべと、その周りのおしべ、先に付いた細かな粒を大きく示す。現象の名前は書かない。',
  path('M240 185Q110 170 85 65Q180 65 240 145Q300 65 395 65Q370 170 240 185', '#f5c1cf') +
    path('M240 210V65', 'none', '#6e9b67', 10) +
    circle(240, 60, 14, '#a5c48c') +
    path('M205 175V95m70 80V95', 'none', '#a99b61', 6) +
    circle(205, 90, 14, '#f0c861') +
    circle(275, 90, 14, '#f0c861') +
    [0, 1, 2].map((i) => circle(298 + i * 14, 70 - i * 10, 4, '#d5aa43')).join(''),
);
draw(
  'river-stones',
  ['0fa64b613ae6'],
  '上流と下流で見られた石を並べた観察図。上流は角ばった大きな石、下流は丸みのある小さな石。変化の原因は書かない。',
  path('M65 155l10-65 65-30 45 45-15 65Z', '#aab8c3') +
    circle(325, 145, 24, '#aab8c3') +
    circle(382, 155, 18, '#aab8c3') +
    text('上流', 125, 225) +
    text('下流', 350, 225),
);
const womb =
  path('M145 40Q70 145 160 215Q205 245 230 215Q280 235 330 200Q390 140 330 55Q250 0 145 40Z', '#f7d4cd') +
  path('M150 53Q95 135 165 199Q235 240 314 190Q368 128 317 65Q246 15 150 53Z', '#d9edf3') +
  path('M143 57q-28 20-17 75l24-7q-10-40 16-58Z', '#d89091') +
  circle(245, 105, 30, '#e7b795') +
  path('M259 132q55 25 15 60q-42 25-65-15q-24-35 10-47Z', '#e7b795') +
  path('M241 157Q178 185 145 104', 'none', '#ba7777', 8) +
  path('M224 145l-27 12 15 22m58-18-17 19 21 7', 'none', '#a9765e', 7);
draw(
  'womb-functions',
  ['145483829531', '286f98b4dcf6', '49a2ace2b033', '84bb6ad76ecc', 'e5275a698570'],
  '母親のおなかの中の模式図。赤ちゃん、へそのお、たいばん、周りの液体の位置を示す。物質を運ぶ矢印や機能の説明はない。',
  womb +
    text('たいばん', 65, 35, 22) +
    path('M95 40l35 30') +
    text('へそのお', 390, 230, 22) +
    path('M340 215l-130-50'),
);
draw(
  'womb-location',
  ['e48ec50265b9'],
  '母親のおなかの中で育つ赤ちゃんの模式図。包んでいる器官の名前は書かない。',
  womb,
);
for (const hash of ['143d35c53ce7', 'a3fd7dd5cc5b', 'd9451562aebe'] as const) {
  const q = all.find((q) => q.id.endsWith(hash))!;
  const template = q.payload.template!;
  assert(template.includes('{{INPUT}}'));
  q.payload.prompt = {
    '143d35c53ce7':
      '水[みず]と食塩[しょくえん]を合[あ]わせて115 g。全部[ぜんぶ]とかすと、食塩水[しょくえんすい]は何[なん]g？',
    a3fd7dd5cc5b:
      '水[みず]100 gにミョウバンをとかすと、水[みず]よう液[えき]は110 g。とかしたミョウバンは何[なん]g？',
    d9451562aebe:
      '水[みず]100 gに食塩[しょくえん]5 gを全部[ぜんぶ]とかした。食塩水[しょくえんすい]は何[なん]g？',
  }[hash]!;
  q.payload.template = '{{INPUT}} g';
  delete q.payload.suffix;
}
draw(
  'solution-mass-143d35c53ce7',
  ['143d35c53ce7'],
  '水と食塩を合わせた重さは115グラム。とかした後の重さを考える。',
  group(95, 100, beaker(), 0.7) +
    rect(145, 85, 45, 45, '#faf3d9') +
    text('食塩', 168, 70, 23) +
    group(125, 190, scale('115 g')) +
    arrow(220, 135, 55) +
    group(365, 105, beaker(), 0.7) +
    group(365, 190, scale()),
  230,
);
draw(
  'solution-mass-a3fd7dd5cc5b',
  ['a3fd7dd5cc5b'],
  '水100グラムにミョウバンをとかすと水よう液110グラムになった。ミョウバンの重さは空欄。',
  group(75, 100, beaker(), 0.65) +
    text('水 100 g', 75, 205, 23) +
    text('+', 150, 115, 30) +
    rect(180, 85, 55, 45, '#faf3d9') +
    text('ミョウバン', 210, 60, 23) +
    text('？g', 210, 205, 25) +
    arrow(260, 110, 45) +
    group(385, 100, beaker(), 0.65) +
    text('110 g', 385, 205, 25),
  230,
);
draw(
  'solution-mass-d9451562aebe',
  ['d9451562aebe'],
  '水100グラムに食塩5グラムをとかす。食塩水の重さは空欄。',
  group(75, 100, beaker(), 0.65) +
    text('水 100 g', 75, 205, 23) +
    text('+', 150, 115, 30) +
    rect(180, 85, 55, 45, '#faf3d9') +
    text('食塩 5 g', 210, 205, 23) +
    arrow(260, 110, 45) +
    group(385, 100, beaker(), 0.65) +
    text('？g', 385, 205, 25),
  230,
);
draw(
  'solution-weight',
  ['93469736da52'],
  '水と食塩を合わせてからとかす前後の図。どちらも同じ容器を使い、外へこぼさない。はかりの数値は示さない。',
  group(110, 110, beaker(), 0.8) +
    rect(160, 100, 40, 40, '#faf3d9') +
    text('食塩', 180, 85, 22) +
    arrow(230, 135, 45) +
    group(365, 110, beaker(), 0.8) +
    text('とかす前', 120, 225) +
    text('とかした後', 365, 225),
);
draw(
  'solution-amount',
  ['a8e7017222ae', 'ba5c1094cfcb'],
  '水に食塩を少しずつ加えてとかす実験。容器の底の様子や、とける限度の答えは示さない。',
  group(220, 135, beaker()) +
    path('M295 40l60 30', 'none', '#8094a4', 7) +
    '<ellipse cx="285" cy="35" rx="23" ry="12" fill="#faf3d9" stroke="#26394a" stroke-width="3"/>' +
    text('少しずつ 加える', 240, 240, 24),
);
draw(
  'electromagnet',
  ['023c71fdae5b', '8a8346651bd4', '912a0dd4389a', 'c7d68110d4a8'],
  '鉄しんに導線を巻いたコイルと乾電池の回路。電磁石の極や力の強さは描かない。',
  group(240, 85, coil()) +
    path('M140 38H65v152h133m92 0h125V132H341') +
    group(240, 190, battery()) +
    text('コイル', 240, 35),
);

// 小6: 器官・燃焼・発電の対象を示し、未知の結果は空欄に保つ。
draw(
  'candle-air',
  ['85914b947505', '8dab2305003b', 'acbc71cd514c'],
  '集気びんの中で燃えるろうそく。空気の成分や割合、変化の結果は書かない。',
  group(240, 125, jar(true)) + group(240, 145, candle(), 0.7) + text('びんの中の 空気', 240, 240),
);
draw(
  'jar-openings',
  ['e11aec13cb01'],
  'ろうそくを入れた集気びんの上下にすきまを設けた実験。線香の煙が進む向きは描かない。',
  group(240, 115, jar(true)) +
    rect(182, 170, 23, 10, '#fff') +
    rect(275, 170, 23, 10, '#fff') +
    group(240, 140, candle(), 0.7) +
    path('M115 205l45-50', 'none', '#8c6c4d', 5) +
    text('すきま', 100, 55) +
    path('M150 50h42') +
    text('すきま', 365, 200) +
    path('M315 190l-30-15'),
);
draw(
  'limewater-observation',
  ['ff109f778631'],
  '実験の前の透明な石灰水と、問題文で観察された白くにごった石灰水。気体の名前は示さない。',
  group(120, 115, beaker('#e8f5fc')) +
    arrow(215, 120, 50) +
    group(360, 115, beaker('#eeeeec')) +
    text('前', 120, 230) +
    text('白く にごった', 355, 230, 23),
);
draw(
  'limewater-test',
  ['a12ddd07c998', 'f9d40670fd7a'],
  '気体を石灰水に通す実験。チューブの先は液の中にあり、反応後の色はまだ示さない。',
  group(240, 125, beaker('#e8f5fc')) +
    path('M90 45h130v100', 'none', '#6e96b1', 6) +
    circle(230, 125, 4, '#fff') +
    circle(225, 110, 4, '#fff') +
    text('石灰水', 240, 240),
);
const generator =
  rect(50, 65, 110, 85, '#b0cfdb') +
  circle(100, 100, 15, '#e7eef3') +
  path('M100 100l-30-35h-25', 'none', '#4f7082', 6) +
  text('手回し発電機', 110, 220, 22);
draw(
  'hand-generator',
  ['2c209c1852c8', '7120e72536af', 'c4d4e302d846'],
  '手回し発電機につないだモーター。ハンドルの回転の速さや方向を変えて調べる。モーターの動く結果は示さない。',
  generator +
    path('M160 85H300M160 135h140') +
    group(345, 110, rect(-45, -35, 90, 70, '#d0e5ed') + text('M', 0, 10, 30) + path('M45 0h35')) +
    text('モーター', 345, 220, 24),
);
draw(
  'solar-motor',
  ['ce756f4ff36f', 'e742537d2673'],
  '光を当てる光電池とモーターを導線でつなぐ実験。回転の速さは示さない。',
  group(90, 50, sun(), 0.55) +
    path('M55 110h145l-25 75H30Z', '#7fabc9') +
    path('M65 110l-25 75m65-75-25 75m65-75-25 75m65-75-25 75M45 135h145m-155 25h145', 'none', '#e9f5fc', 2) +
    path('M200 120h90m-110 50h110') +
    group(340, 140, rect(-45, -35, 90, 70, '#d0e5ed') + text('M', 0, 10, 30) + path('M45 0h35')) +
    text('光電池', 110, 235) +
    text('モーター', 340, 235, 24),
);
draw(
  'fan-energy',
  ['63d970284d87'],
  '電気コードにつながる扇風機。電気が何に変わるかを考える。',
  circle(240, 100, 65, '#e9f4fa') +
    path('M240 90q-75-80-45 10q-25 65 45 20q80 20 15-25Z', '#a8cada') +
    circle(240, 100, 12, '#8baabf') +
    path('M240 165v45m-45 0h90M285 210h75v-40', 'none', ink, 6) +
    rect(345, 145, 30, 25, '#d7dfe5') +
    path('M351 145v-14m18 14v-14'),
);
draw(
  'dryer-energy',
  ['ae23e3182d63'],
  '電気コードにつながるドライヤー。温度や風の答えを表す矢印は描かない。',
  path('M110 70h170l65 30-65 30H110Z', '#b1d1e2') +
    path('M195 130l-15 80h55l-10-80Z', '#9eb8c9') +
    circle(115, 100, 30, '#d7e7ef') +
    path('M205 210q0 35 100 20v-35', 'none', ink, 5),
);
draw(
  'lamp-led-comparison',
  ['be7239b411ed'],
  '同じ量の電気をためて豆電球とLEDを比べる。光った時間の長さは問題文にある観察結果を使う。',
  group(120, 100, bulb(), 1.6) +
    path('M320 125V85q40-55 80 0v40Z', '#f4dca0') +
    path('M340 125v60m40-60v60', 'none', ink, 4) +
    text('豆電球', 120, 235) +
    text('LED', 360, 235),
);
const lungs =
  path('M235 25v60l-40 30m50-30 40 30', 'none', '#8da9bb', 12) +
  path('M212 65Q145 50 140 155Q145 215 213 175Z', '#e9b6b2') +
  path('M268 65Q335 50 340 155Q335 215 267 175Z', '#e9b6b2') +
  path('M208 100l-30 30m23-15-14 45M272 100l30 30m-23-15 14 45', 'none', '#b07878', 4);
draw(
  'lungs',
  ['c1817c2353a6', 'f8c38ef686f8', '16bd961d5353'],
  '気管につながる左右の肺の模式図。気体がどちらへ出入りするかや、名前の答えは書かない。',
  lungs + text('体の中の つくり', 240, 240),
);
const digestive =
  path('M210 30v55q0 30 35 35q50 0 55 35q-10 35-65 5q-30-15-35 20', 'none', '#d79f86', 17) +
  path('M185 175q-35 20 0 30h90q35 15 0 30h-70q-35 15 0 25h65', 'none', '#d4b483', 11) +
  path('M175 170q-30 0-30 35v70h160v-80q0-25-30-25', 'none', '#c08777', 13) +
  path('M235 275v30', 'none', '#c08777', 10);
draw(
  'digestive-tract',
  ['06018759107a', '2e5ca6170ab2', 'aa9156ab8edb'],
  '口から続く食べ物の通り道の模式図。胃と腸の形を示し、器官の名前は書かない。',
  group(0, -5, digestive, 0.9) + text('口から 続く道', 355, 70, 23),
  300,
);
draw(
  'fish-gills',
  ['786a76b64a62', '6821dd87c0ab'],
  '魚の頭の近くのつくりを観察する図。頭の後ろのひだ状の部分を丸い枠で大きく示し、名前は書かない。',
  group(175, 130, fish(), 1.2) +
    circle(345, 115, 65, '#eef6fa') +
    [0, 1, 2, 3].map((i) => path(`M${320 + i * 13} 75q-20 40 0 80`, 'none', '#bf817b', 6)).join('') +
    path('M147 115l140-35', 'none', '#708b9c', 2),
);
draw(
  'pulse-count',
  ['a4d53abfef87', '3a6a63f8630d', 'ff295856c314'],
  '手首の脈を調べる位置と時計。数えた回数や心臓との関係は書かない。',
  path('M45 100h145l55-20 45 25-35 40-65-10H45Z', '#ebc5a6') +
    path('M170 45v58m25-53v57', 'none', '#c89578', 16) +
    circle(365, 120, 55, '#f6f9fb') +
    path('M365 80v40l25 15') +
    text('脈を 数える', 150, 220),
);
draw(
  'kidney-location',
  ['21ad9cdcbae9', '321cdef043ff', 'b4cad7be7f8c', 'f90d87f1b571'],
  '左右の豆の形をした器官と、管でつながる袋状の部分を示す模式図。物質の名前や臓器のはたらきは書かない。',
  path('M170 45q-55-10-55 50q0 60 55 45q-30-45 0-95', '#c98f86') +
    path('M310 45q55-10 55 50q0 60-55 45q30-45 0-95', '#c98f86') +
    path('M160 135q0 45 50 55m110-55q0 45-50 55', 'none', '#b99578', 5) +
    path('M200 185q40-15 80 0q5 55-40 50q-45 5-40-50', '#edcdaa'),
);
draw(
  'heart-body',
  ['0467332dc3f0', '5233962add07', '915bbf9c51c1'],
  '胸の中央付近の器官と、体に広がる血管の模式図。血液が進む道順の答えは示さない。',
  path(
    'M200 55q40-25 80 0l35 60 35 75-25 10-30-55v90h-35v-75h-40v75h-35v-90l-30 55-25-10 35-75Z',
    '#edf3f7',
  ) +
    path('M240 85q-35-32-40 0q0 30 40 48q40-18 40-48q-5-32-40 0', '#da8d87') +
    path('M240 133v35m0-25-40 30m40-30 40 30', 'none', '#a67477', 4),
);
draw(
  'plant-light',
  ['49e138f4f00f', '93e2ed045ae8', '9ff0cb574b4e'],
  '日光の当たる植物と水。葉で何がつくられるかや、気体の出入りの答えは書かない。',
  group(100, 60, sun(), 0.7) +
    group(275, 70, plant()) +
    path('M340 185h60v35h-60Z', '#badff0') +
    text('植物を かんさつ', 240, 245),
);
draw(
  'food-connection',
  ['8088d7eeaa7c'],
  '草、草を食べる昆虫、その昆虫を食べるカエルの関係を図示する。関係の名前は書かない。',
  group(70, 105, plant(), 0.5) +
    arrow(130, 135, 45) +
    group(235, 125, insect(), 0.55) +
    arrow(285, 135, 45) +
    path('M350 170q-25-60 25-65q35-25 55 20q25 40-10 45Z', '#8fb779') +
    circle(375, 108, 10, '#b4d493') +
    circle(414, 108, 10, '#b4d493') +
    circle(375, 108, 3, ink) +
    circle(414, 108, 3, ink) +
    text('食べられる → 食べる', 240, 235, 23),
);
draw(
  'bottle-gas',
  ['13344ee34aaa'],
  '水と二酸化炭素を入れ、ふたをしたペットボトル。振った後の形は描かない。',
  rect(207, 30, 66, 22, '#96adbf') +
    path('M207 52v25l-35 40v105h136V117l-35-40V52Z', '#eef7fc') +
    path('M175 165h130v54H175Z', '#b9dff1', 'none') +
    text('二酸化炭素', 240, 135, 23) +
    text('水', 240, 201, 25),
);

draw(
  'star-observation',
  [
    '56221769fa98',
    '573724f6bdc8',
    'd7b450ec2247',
    '985be956689d',
    '14b63a37f958',
    '93c897e6d701',
    'bf78a904668d',
    'e60ff2cacc91',
  ],
  '同じ場所から星を観察するための空と地上の目印。星の動く方向の答えは描かない。',
  rect(20, 20, 440, 160, '#e9f1f8') +
    [
      [110, 60],
      [180, 110],
      [270, 65],
      [360, 120],
      [410, 55],
    ]
      .map(([x, y]) => circle(x!, y!, 5, '#f4c66b'))
      .join('') +
    path('M70 175v-35l30-25 30 25v35', '#c1d0da') +
    text('方位：＿＿  時刻：＿＿', 240, 230, 24),
);
draw(
  'orion-pattern',
  ['ae71c44d7880', '2152ca71a8c7'],
  '冬の夜空の星を線で結んだ模式図。星の位置関係を簡略化して示す。図には名称を書かない。',
  path('M140 45L320 65 275 125 335 215 130 215 205 135Z', 'none', '#8298ad', 2) +
    path('M205 135L240 130 275 125', 'none', '#8298ad', 2) +
    [
      [140, 45],
      [320, 65],
      [275, 125],
      [335, 215],
      [130, 215],
      [205, 135],
      [240, 130],
    ]
      .map(([x, y]) => circle(x!, y!, 6, '#f2c169'))
      .join(''),
);
draw(
  'winter-triangle',
  ['34795d5a9b29', '37c9856c8f52'],
  'ベテルギウス、プロキオン、シリウスを結んだ冬の夜空の模式図。星の集まりの名前は書かない。',
  path('M110 65L365 100 240 205Z', 'none', '#8298ad', 2) +
    circle(110, 65, 7, '#eca77c') +
    circle(365, 100, 7, '#f4cd75') +
    circle(240, 205, 7, '#d0e4f7') +
    text('ベテルギウス', 110, 35, 23) +
    text('プロキオン', 365, 65, 23) +
    text('シリウス', 240, 245, 23),
);
draw(
  'seed-shapes',
  ['918d188d4350', 'acbff057f0d9'],
  'ホウセンカの丸く小さな種と、ヒマワリの細長くしまのある種を拡大して比べる。実際の大きさの比ではない。',
  circle(120, 110, 24, '#ad7c50') +
    path('M335 55Q280 140 340 175Q395 135 335 55Z', '#686254') +
    path('M335 68q-22 60 5 93', 'none', '#e0d2b4', 8) +
    text('ホウセンカ', 120, 230, 24) +
    text('ヒマワリ', 340, 230, 24),
);
draw(
  'winter-bud',
  ['8f8b60b4fbeb'],
  '枝の先にある冬芽を拡大した観察図。芽の内側は描かない。',
  path('M180 225l65-105 55-55m-55 55-45-40', 'none', '#95724d', 12) +
    path('M240 125q-38-55 10-85q40 45-10 85', '#ba9a73') +
    path('M240 120l10-65', 'none', '#866445', 3),
);
draw(
  'iodine-test',
  ['3be7b6992898', '8a05528aaf87'],
  '茶色のヨウ素液を試料にたらす実験。試料に何がふくまれるか、反応後の色は示さない。',
  path('M255 45l60-20 12 25-60 20Z', '#d1dde6') +
    path('M255 45l-25 35 37-10Z', '#af855b') +
    path('M220 90q-12 20 0 22q12-2 0-22', '#af855b') +
    '<ellipse cx="230" cy="165" rx="95" ry="35" fill="#f4e7c5" stroke="#26394a" stroke-width="3"/>' +
    text('ヨウ素液を たらす', 240, 235, 24),
);
draw(
  'water-through-plant',
  ['167628db3ac9', 'd156086c85c7', '97f13d6c3daa', '226ca88a6c0a', '46a13945bbb5'],
  '根から葉までの植物全体を示す。水や養分の名前、はたらきの答えは図に書かない。',
  group(240, 65, plant()) + path('M70 175H410', 'none', '#aa8f6e', 3),
);
draw(
  'small-intestine-surface',
  ['d6842b16bbc9'],
  '小腸の内側の表面を拡大した模式図。細かな突起が並ぶ形を示し、はたらきの答えは書かない。',
  path(
    'M40 185V140q10-90 25 0q10 30 20 0q10-90 25 0q10 30 20 0q10-90 25 0q10 30 20 0q10-90 25 0q10 30 20 0q10-90 25 0q10 30 20 0q10-90 25 0q10 30 20 0q10-90 25 0q10 30 20 0q10-90 25 0v45Z',
    '#efc0b1',
  ) + text('内側を 大きく見る', 240, 240, 24),
);
draw(
  'volcanic-grains',
  ['084bcb4e54c9'],
  '火山灰の粒を拡大した模式図。角のある粒や透明な粒など、異なる形と色を示す。',
  path('M75 65l60 10-20 65-65-5Z', '#a4a8a8') +
    path('M245 50l40 45-55 55-35-65Z', '#d5e8ed') +
    path('M340 120l75 10-20 70-60-25Z', '#b7a993') +
    text('火山灰を 拡大', 240, 240, 24),
);
draw(
  'volcano',
  ['088976700f94', 'eff84167a8d3'],
  '噴火する火山の模式図。山の上の噴出物と、斜面を流れるものを描き、名前は書かない。',
  path('M35 225l140-110 45 15 35-15 180 110Z', '#bfa78d') +
    path('M235 125q-30 40 40 65l35 35', 'none', '#df9772', 15) +
    group(235, 65, cloud(), 0.8) +
    [
      [150, 65],
      [300, 70],
      [190, 100],
      [280, 100],
    ]
      .map(([x, y]) => circle(x!, y!, 4, '#7b7d7b'))
      .join(''),
);
draw(
  'solution-heating',
  ['22cbed1f9920', 'ce3f06f06beb'],
  '水よう液を蒸発させる実験。加熱した後に何が残るかは描かない。',
  group(240, 110, beaker()) + group(240, 205, heat(), 1.4) + path('M170 175H310m-130 0-15 50m135-50 15 50'),
);
draw(
  'dissolving-metal',
  ['c288c74f4b1b', '53095dbff20e'],
  '水よう液の中に金属片を入れた実験の模式図。発生する気体や取り出せる物質の名前は書かない。',
  group(240, 130, beaker('#e4f1f7')) +
    rect(225, 130, 15, 45, '#a6b5c0') +
    circle(240, 115, 5) +
    circle(230, 100, 4) +
    text('金属を 入れる', 240, 240),
);

draw(
  'microscope',
  ['076c93e9798f', 'edd5b3f58445'],
  'けんび鏡の形を示す。上のレンズ、台、ねじ、下の鏡があり、部品の名前は図には書かない。',
  path('M180 35l90 30-15 35-90-30Z', '#c3d9e5') +
    path('M275 80q80 20 50 100l-25 25', 'none', '#91acbd', 22) +
    path('M145 135h150', 'none', ink, 10) +
    rect(160, 125, 95, 10, '#edf7fc') +
    circle(320, 120, 17, '#e4c190') +
    path('M205 205l50-30', 'none', '#9db9cb', 15) +
    path('M150 230h210', 'none', '#91acbd', 17),
);
draw(
  'cloud-record',
  ['5724d56a50ad', '576a09546384', '871a68d3f600', 'c8a5a4f3522b', 'b61a9fd48f65'],
  '雲の形や量を観察する2枚の記録枠。時刻と方位を書きこむ欄がある。天気や動きの答えは示さない。',
  rect(20, 30, 210, 150, '#edf5fb') +
    rect(250, 30, 210, 150, '#edf5fb') +
    group(110, 110, cloud(), 0.7) +
    group(355, 95, cloud(), 0.9) +
    text('時刻：＿＿', 125, 215, 24) +
    text('方位：＿＿', 355, 215, 24),
);
draw(
  'rain-slope',
  ['632588c9ac86', '811743e626cc', '985a622d92fa', 'd5c3725fe066'],
  '山の斜面と地面、木、降る雨を示す模式図。水の流れの速さや土の動きの答えは描かない。',
  path('M20 180L170 80 290 200 460 220V250H20Z', '#d9c5a3') +
    group(120, 110, tree(), 0.5) +
    group(320, 55, cloud(), 0.6) +
    path('M275 80l-7 20m40-20-7 20m40-20-7 20', 'none', '#6c9fba'),
);
draw(
  'dissolve-substances',
  ['12dfb06e8f0f', '86390ed7436f', 'eab0e5d6de1c', '29d79bcf0381'],
  '水の量や温度、とかす物を変えて調べるためのビーカーと温度計。結果は描かない。',
  group(135, 135, beaker()) +
    group(345, 135, beaker()) +
    group(365, 100, thermometer(), 0.6) +
    text('水の量・温度', 240, 240, 24),
);
draw(
  'birth-comparison',
  ['8159e0ec60f1', '21ce032cb3c9'],
  '魚のたまごと、母親の体内で育つ赤ちゃんを並べた模式図。実際の大きさの比ではない。',
  circle(100, 120, 52, '#e2f0f7') +
    group(100, 120, fish(), 0.45) +
    group(215, 15, womb, 0.65) +
    text('メダカ', 100, 240, 24) +
    text('ヒト', 365, 240, 24),
);
draw(
  'pollen-transfer',
  ['80f904c7f52a', 'e322b48ad170'],
  '花の中央と周りの細い部分を大きく示し、その上に小さな粒がある。運ぶ生物や現象の名前は書かない。',
  path('M240 185Q110 170 85 65Q180 65 240 145Q300 65 395 65Q370 170 240 185', '#f5c1cf') +
    path('M240 210V65', 'none', '#6e9b67', 10) +
    circle(240, 60, 14, '#a5c48c') +
    path('M205 175V95m70 80V95', 'none', '#a99b61', 6) +
    circle(205, 90, 14, '#f0c861') +
    circle(275, 90, 14, '#f0c861'),
);

assert.equal(signature(), before, 'Visuals must preserve learning targets, answers and choices');
for (const s of sets) writeFileSync(s.file, JSON.stringify(s.questions, null, 2) + '\n');
const review = all.map((q) => ({
  id: q.id,
  decision: changed.has(q.id)
    ? 'illustrated'
    : q.payload.promptImage || q.type === 'experiment'
      ? 'existing-visual'
      : 'text-sufficient',
  reason:
    changed.get(q.id) ??
    (q.payload.promptImage || q.type === 'experiment'
      ? '既存の写真・図・実験表示を確認し、観察情報を維持する'
      : '語句・手順・一般的な性質を問う文章。必要な条件や穴埋め文を確認し、追加図なしで読める形を維持する'),
}));
writeFileSync('scripts/data/rika-visual-review.json', JSON.stringify(review, null, 2) + '\n');
console.log(`${changed.size} / ${all.length} science questions illustrated`);
