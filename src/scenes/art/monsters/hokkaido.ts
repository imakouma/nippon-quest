/** 北海道の モンスター（手描き。docs/06 §4・§6.3〜6.5 の 規格） */
import { NQ } from '../palette';
import type { MonsterDesign } from './design';

type Paint = (x: number, y: number) => string;
type Oval = readonly [cx: number, cy: number, rx: number, ry: number];

/** だ円を いくつか あわせた かたち（ドットの まん中で はかる）を paint で ぬった w×h の 地図 */
function blob(w: number, h: number, ovals: readonly Oval[], paint: Paint | string): string[] {
  const f: Paint = typeof paint === 'string' ? () => paint : paint;
  const inside = (x: number, y: number) =>
    ovals.some(([cx, cy, rx, ry]) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1);
  return Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => (inside(x, y) ? f(x, y) : '.')).join(''),
  );
}

/** おうぎ形（かなめ hx, hy・半径 r・真上から ±deg 度）。paint(x, y, t, d)：t は 左はし 0〜右はし 1、d は かなめからの きょり */
function fan(
  w: number,
  h: number,
  [hx, hy, r, deg]: Oval,
  paint: (x: number, y: number, t: number, d: number) => string,
): string[] {
  return Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => {
      const dx = x + 0.5 - hx;
      const dy = hy - (y + 0.5);
      const d = Math.hypot(dx, dy);
      const a = (Math.atan2(dx, dy) * 180) / Math.PI;
      if (dy < 0 || Math.abs(a) > deg || d > r) return '.';
      return paint(x, y, (a + deg) / (2 * deg), d);
    }).join(''),
  );
}

/** 地図の まわり 1 ドットを ink に する（重ねた 部品を くっきり させる）。x-1, y-1 に 置く */
function ring(rows: readonly string[]): string[] {
  const w = Math.max(...rows.map((r) => r.length));
  const at = (x: number, y: number) => (rows[y]?.[x] ?? '.') !== '.';
  return Array.from({ length: rows.length + 2 }, (_, j) =>
    Array.from({ length: w + 2 }, (_, i) => {
      const x = i - 1;
      const y = j - 1;
      return !at(x, y) && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) ? 'o' : '.';
    }).join(''),
  );
}

/** メロンの あみめ（ななめの すじが 2 方向） */
const net = (x: number, y: number) => (x + y) % 5 === 0 || (x - y + 40) % 5 === 0;

// ───────────────────────── 通常モンスター ─────────────────────────

/** アミメロン：夕張メロン。あみめの もようの まるい 実、T の 字に 切った つると 葉っぱ（モリ） */
const amiMelon: MonsterDesign = {
  size: 32,
  colors: { M: NQ.lime, N: NQ.sprout, g: NQ.green, L: NQ.leaf, W: NQ.white, p: NQ.blush },
  rim: { [NQ.lime]: NQ.leaf },
  rimDepth: 2,
  layers: [
    {
      rows: blob(32, 31, [[16, 18, 13, 12]], (x, y) =>
        net(x, y) && !(x >= 8 && x <= 23 && y >= 14 && y <= 22) ? 'N' : 'M',
      ),
    },
    // T の 字の つると 葉っぱ
    { x: 11, y: 3, rows: ['g........g', 'gggggggggg', '....gg....', '....gg....'] },
    { x: 18, y: 1, rows: ['...LLLL', '.LLLLLLL', 'LLggLLL.', '.LL.....'] },
    // 足
    { mirror: true, x: 9, y: 28, rows: ['ggg', 'ggg'] },
    // 目・ほっぺ・口・つや
    { mirror: true, x: 10, y: 15, rows: ['WW', 'Wo', 'Wo'] },
    { mirror: true, x: 8, y: 18, rows: ['pp'] },
    { mirror: true, x: 14, y: 19, rows: ['o.', '.o'] },
    { x: 6, y: 10, rows: ['.W', 'W.'] },
  ],
};

/** ジャガゴロン：十勝の じゃがいも。でこぼこの からだ、くぼみ（芽の あと）、土の よごれ（ツチ） */
const JAGA_SPOTS: readonly (readonly [number, number])[] = [
  [7, 15],
  [24, 12],
  [21, 24],
  [8, 23],
  [25, 19],
  [14, 11],
];
const jagaGoron: MonsterDesign = {
  size: 32,
  colors: { S: NQ.sand, b: NQ.brown, E: NQ.beige, K: NQ.bark, W: NQ.white, p: NQ.blush },
  rim: { [NQ.sand]: NQ.tan },
  rimDepth: 2,
  layers: [
    {
      rows: blob(
        32,
        31,
        [
          [16, 19.5, 13.5, 10],
          [11, 12.5, 6, 4.5],
          [22, 12, 5, 4],
        ],
        (x, y) => (JAGA_SPOTS.some(([sx, sy]) => (sx === x || sx + 1 === x) && sy === y) ? 'b' : 'S'),
      ),
    },
    // 足
    { mirror: true, x: 9, y: 28, rows: ['SSS', 'KKK'] },
    // 土の よごれ・つや
    { x: 5, y: 21, rows: ['K.', '.K'] },
    { x: 8, y: 11, rows: ['.EE', 'E..'] },
    // 目・ほっぺ・口
    { mirror: true, x: 11, y: 16, rows: ['WW', 'Wo', 'Wo'] },
    { mirror: true, x: 9, y: 19, rows: ['pp'] },
    { mirror: true, x: 14, y: 20, rows: ['oo', '.o'] },
  ],
};

/** ホタテン：オホーツク海の ホタテ。すじの ある おうぎ形の 貝がら、足に なった 耳、あわ（ミズ） */
const hotaten: MonsterDesign = {
  size: 32,
  colors: { T: NQ.sand, B: NQ.tan, E: NQ.beige, S: NQ.sky, W: NQ.white, p: NQ.blush },
  rim: { [NQ.sand]: NQ.tan, [NQ.beige]: NQ.sand },
  layers: [
    // 耳（かなめの 両がわ。足に なる）
    {
      mirror: true,
      x: 7,
      y: 24,
      rows: ['......EE', '....EEEE', '..EEEEEE', 'EEEEEEEE', 'EEEBEEBE', '.EEEEEEE'],
    },
    {
      rows: fan(32, 31, [16, 29, 19.5, 48], (x, y, t, d) => {
        const rib = (t * 9) % 1 < 0.2;
        if (rib && d > 18.6) return '.';
        const face = x >= 9 && x <= 22 && y >= 16 && y <= 22;
        return rib && !face ? 'B' : 'T';
      }),
    },
    // 目・ほっぺ・口・つや・あわ
    { mirror: true, x: 11, y: 17, rows: ['WW', 'Wo', 'Wo'] },
    { mirror: true, x: 9, y: 20, rows: ['pp'] },
    { mirror: true, x: 15, y: 21, rows: ['o'] },
    { x: 8, y: 12, rows: ['.E', 'E.'] },
    { x: 2, y: 4, rows: ['.S.', 'SWS', '.S.'] },
    { x: 27, y: 2, rows: ['SS', 'SW'] },
  ],
};

/** クリオネル：流氷の 天使 クリオネ。すきとおった からだ、ぱたぱた うごく ひれ、中に オレンジの 光、金の わっか（ヒカリ） */
const kurioneru: MonsterDesign = {
  size: 32,
  colors: {
    I: NQ.ice,
    S: NQ.sky,
    W: NQ.white,
    A: NQ.apricot,
    V: NQ.vermilion,
    G: NQ.gold,
    Q: NQ.ochre,
    c: NQ.cream,
    p: NQ.blush,
  },
  rim: { [NQ.ice]: NQ.sky, [NQ.sky]: NQ.azure },
  layers: [
    // わっか
    { mirror: true, x: 11, y: 2, rows: ['.GGGG', 'G....', '.QQQQ'] },
    // ひれ（からだの よこ）
    {
      mirror: true,
      x: 3,
      y: 14,
      rows: ['...SSS..', '.SSIISS.', 'SIIIIISS', 'SSIIIISS', '.SSSSSS.', '...SS...'],
    },
    // からだ・頭・しっぽ
    { rows: blob(32, 31, [[16, 19.5, 6, 9]], 'I') },
    { rows: blob(32, 31, [[16, 11, 7, 5.5]], 'I') },
    { mirror: true, x: 14, y: 27, rows: ['II', '.I', '.I'] },
    // おなかの オレンジの 光
    { mirror: true, x: 14, y: 16, rows: ['.A', 'AV', 'AV', 'cV', '.A'] },
    // 目・ほっぺ・口・つや・きらきら
    { mirror: true, x: 12, y: 9, rows: ['WW', 'Wo', 'Wo'] },
    { mirror: true, x: 10, y: 12, rows: ['pp'] },
    { mirror: true, x: 15, y: 13, rows: ['o'] },
    { x: 11, y: 7, rows: ['WW'] },
    { x: 3, y: 5, rows: ['.c.', 'cWc', '.c.'] },
    { x: 26, y: 23, rows: ['.c.', 'cWc', '.c.'] },
  ],
};

/** キタコン：キタキツネの 子。耳の うらと 足の 先が 黒い、白い ほお と むね、ふさふさの しっぽ、頭に 小さな 炎（ヒノ） */
const KITAKON_TAIL = [
  '...PPP.',
  '..PPPPP',
  '..PPPPP',
  '..OPPP.',
  '.OOOO..',
  '.OOOO..',
  'OOOOO..',
  'OOOOO..',
  'OOOO...',
  'OOO....',
  'OO.....',
];
const kitakon: MonsterDesign = {
  size: 32,
  colors: {
    O: NQ.orange,
    P: NQ.paper,
    K: NQ.night,
    W: NQ.white,
    p: NQ.blush,
    V: NQ.vermilion,
    A: NQ.apricot,
    G: NQ.gold,
  },
  rim: { [NQ.orange]: NQ.amber, [NQ.paper]: NQ.cloud },
  layers: [
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '.....K..........',
        '.....KK.........',
        '.....KKK........',
        '.....OPKO.......',
        '.....OPPOO......',
        '.....OPPPOO.....',
        '....OOPPPOOOOOOO',
        '....OOOOOOOOOOOO',
        '...OOOOOOOOOOOOO',
        '...OOOOOOOOOOOOO',
        '..POOOOOOOWWOOOO',
        '..PPOOOOOOWoOOOO',
        '..PPPOOOOOWoOOOO',
        '..PPPPOOOOOOOPPP',
        '...PPPPpOOPPPPPP',
        '....PPPPPPPPPPPo',
        '.....PPPPPPPPPoP',
        '......PPPPPPPPPP',
        '.......OOOOPPPPP',
        '......OOOOOPPPPP',
        '......OOOOOOPPPP',
        '.....OOOOOOOPPPP',
        '.....OOOOOOOPPPP',
        '.....OOOOOOOOPPP',
        '.....OOOOOOKKKPP',
        '.....OOOOOOKKKOO',
        '......OOOOOKKKOO',
        '......KKKK.KKK..',
      ],
    },
    // しっぽ（右で 立ちあがる）
    { x: 23, y: 17, rows: ring(KITAKON_TAIL) },
    { x: 24, y: 18, rows: KITAKON_TAIL },
    // 頭の 炎
    { mirror: true, x: 15, y: 3, rows: ['G', 'A', 'A', 'V', 'V'] },
    { mirror: true, x: 13, y: 5, rows: ['G', 'A', 'V'] },
    // おでこの つや
    { x: 8, y: 10, rows: ['PP'] },
  ],
};

// ───────────────────────── しんか ─────────────────────────

/** ドデカメロン：アミメロンの しんか。ふたを かぶとの ように もちあげ、オレンジの 実が のぞく。つるの うでに 葉の たて（モリ） */
const dodekaMelon: MonsterDesign = {
  size: 32,
  colors: {
    M: NQ.lime,
    N: NQ.sprout,
    g: NQ.green,
    L: NQ.leaf,
    A: NQ.apricot,
    c: NQ.cream,
    W: NQ.white,
    p: NQ.blush,
  },
  rim: { [NQ.lime]: NQ.leaf, [NQ.apricot]: NQ.orange },
  rimDepth: 2,
  layers: [
    {
      rows: blob(32, 31, [[16, 20, 11.5, 10.5]], (x, y) => {
        if (y <= 12) return (x * 3 + y) % 7 === 0 ? 'c' : 'A';
        return net(x, y) && !(x >= 8 && x <= 23 && y >= 13 && y <= 21) ? 'N' : 'M';
      }),
    },
    // ふた（かぶと）と T の 字の つる
    { rows: blob(32, 12, [[16, 6.5, 11.5, 3.8]], (x, y) => (net(x, y) ? 'N' : 'M')) },
    { x: 13, y: 1, rows: ['g....g', 'gggggg', '..gg..'] },
    // つるの うでと 葉の たて
    {
      mirror: true,
      x: 1,
      y: 11,
      rows: ['.LL.', 'LLLL', 'LgLL', 'LLgL', '.LL.', '..g.', '..g.', '..gg', '...g'],
    },
    // 足
    { mirror: true, x: 10, y: 29, rows: ['ggg', 'ggg'] },
    // まゆ・目・ほっぺ・口・つや
    { mirror: true, x: 10, y: 13, rows: ['oo..', '..oo'] },
    { mirror: true, x: 11, y: 15, rows: ['WW', 'Wo', 'Wo'] },
    { mirror: true, x: 9, y: 18, rows: ['pp'] },
    { mirror: true, x: 13, y: 19, rows: ['ooo', '.oo'] },
    { x: 6, y: 16, rows: ['.W', 'W.'] },
  ],
};

/** ジャガドドン：ジャガゴロンの しんか。大きな でこぼこの からだ、芽の つの、いもの こぶし、ひび（ツチ） */
const DODON_FIST = ['.SSS.', 'SSSSS', 'SESSS', 'SSSSb', '.SSb.'];
const jagaDodon: MonsterDesign = {
  size: 32,
  colors: {
    S: NQ.sand,
    b: NQ.brown,
    E: NQ.beige,
    K: NQ.bark,
    L: NQ.leaf,
    l: NQ.lime,
    W: NQ.white,
    p: NQ.blush,
  },
  rim: { [NQ.sand]: NQ.tan },
  rimDepth: 2,
  layers: [
    // 芽の つの
    { mirror: true, x: 7, y: 1, rows: ['ll...', 'lLl..', '.lLL.', '...L.', '...LL', '....L'] },
    {
      rows: blob(
        32,
        31,
        [
          [16, 17.5, 12, 11],
          [10, 10.5, 5, 4],
          [22.5, 10, 5, 4.5],
        ],
        (x, y) =>
          (
            [
              [8, 22],
              [22, 23],
              [13, 26],
              [7, 12],
            ] as const
          ).some(([sx, sy]) => (sx === x || sx + 1 === x) && sy === y)
            ? 'b'
            : 'S',
      ),
    },
    // ひび
    { x: 21, y: 8, rows: ['b..', '.b.', '.bb', '..b'] },
    // 足
    { mirror: true, x: 9, y: 26, rows: ['SSSS', 'SSSS', 'SSSS', 'KKKK', 'KKKK'] },
    // いもの こぶし
    { mirror: true, x: 0, y: 16, rows: ring(DODON_FIST) },
    { mirror: true, x: 1, y: 17, rows: DODON_FIST },
    // まゆ・目・ほっぺ・口・つや
    { mirror: true, x: 9, y: 13, rows: ['ooo.', '...o'] },
    { mirror: true, x: 10, y: 15, rows: ['WW', 'Wo', 'Wo'] },
    { mirror: true, x: 8, y: 18, rows: ['pp'] },
    { mirror: true, x: 12, y: 19, rows: ['oooo', 'oWWW', '.ooo'] },
    { x: 7, y: 9, rows: ['.EE', 'E..'] },
  ],
};

/** ジェットホタテ：ホタテンの しんか。大きな 貝がらの ふちに 青い 目が ならび、耳から 水を ふきだして とぶ（ミズ） */
const jetHotate: MonsterDesign = {
  size: 32,
  colors: {
    T: NQ.sand,
    B: NQ.tan,
    E: NQ.beige,
    S: NQ.sky,
    I: NQ.ice,
    A: NQ.azure,
    W: NQ.white,
    p: NQ.blush,
  },
  rim: { [NQ.sand]: NQ.tan, [NQ.beige]: NQ.sand, [NQ.sky]: NQ.azure },
  layers: [
    // 耳から ふきだす 水
    { mirror: true, x: 5, y: 25, rows: ['...WWIS', '..WIISS', '.WISS..', 'WIS....', 'IS.....'] },
    // 耳
    { mirror: true, x: 8, y: 21, rows: ['....EEEE', '..EEEEEE', 'EEEEEEEE', 'EEBEEBEE'] },
    {
      rows: fan(32, 31, [16, 25, 21, 43], (x, y, t, d) => {
        const u = (t * 10) % 1;
        const rib = u < 0.2;
        if (rib && d > 20.1) return '.';
        if (d > 18.2 && d < 19.4 && u > 0.4 && u < 0.7) return 'A';
        const face = x >= 8 && x <= 23 && y >= 11 && y <= 19;
        return rib && !face ? 'B' : 'T';
      }),
    },
    // まゆ・目・ほっぺ・口・つや
    { mirror: true, x: 10, y: 11, rows: ['ooo.', '...o'] },
    { mirror: true, x: 11, y: 13, rows: ['WW', 'Wo', 'Wo'] },
    { mirror: true, x: 9, y: 16, rows: ['pp'] },
    { mirror: true, x: 14, y: 17, rows: ['oo', '.o'] },
    { x: 8, y: 8, rows: ['.E', 'E.'] },
  ],
};

/** リュウヒョウテンシ：クリオネルの しんか。大きく ひろげた ひれの つばさ、大きな わっか、足もとに 流氷（ヒカリ） */
const ryuhyoTenshi: MonsterDesign = {
  size: 32,
  colors: {
    I: NQ.ice,
    S: NQ.sky,
    W: NQ.white,
    A: NQ.apricot,
    V: NQ.vermilion,
    G: NQ.gold,
    Q: NQ.ochre,
    c: NQ.cream,
    p: NQ.blush,
  },
  rim: { [NQ.ice]: NQ.sky, [NQ.sky]: NQ.azure, [NQ.white]: NQ.sky },
  layers: [
    // 大きな わっか
    { mirror: true, x: 9, y: 1, rows: ['..GGGGG', '.G.....', '..QQQQQ'] },
    // ひれの つばさ
    {
      mirror: true,
      x: 1,
      y: 9,
      rows: [
        '.....SS...',
        '...SSIIS..',
        '.SSIIIIIS.',
        'SIIIIWIIIS',
        'SIIIWIIIII',
        'SIIIIIIIII',
        '.SIIIIIIII',
        '..SIIIIIII',
        '...SSIIIII',
        '.....SSIII',
        '.......SSI',
      ],
    },
    // からだ・頭
    { rows: blob(32, 31, [[16, 18, 6.5, 8.5]], 'I') },
    { rows: blob(32, 31, [[16, 10, 6.5, 5]], 'I') },
    // おなかの 光
    { mirror: true, x: 13, y: 14, rows: ['..A', '.AV', 'AVc', 'AVV', '.AV', '..A'] },
    // 足もとの 流氷
    {
      mirror: true,
      x: 2,
      y: 24,
      rows: [
        '........WWWW..',
        '...WWWW.WIIIWI',
        '..WIIIIWWIIIII',
        '.WIIIIIIWIIIII',
        'WIIIIISSWIIIII',
        'SSSSSS..SSSSSS',
      ],
    },
    // まゆ・目・ほっぺ・口・つや・きらきら
    { mirror: true, x: 11, y: 7, rows: ['oo.', '..o'] },
    { mirror: true, x: 12, y: 8, rows: ['.W', 'Wo', 'Wo'] },
    { mirror: true, x: 10, y: 11, rows: ['pp'] },
    { mirror: true, x: 14, y: 12, rows: ['o.', '.o'] },
    { x: 11, y: 6, rows: ['WW'] },
    { x: 2, y: 3, rows: ['.c.', 'cWc', '.c.'] },
    { x: 27, y: 5, rows: ['.c.', 'cWc', '.c.'] },
  ],
};

/** ホムラギツネ：キタコンの しんか。炎の たてがみ、先が 炎に なった 大きな しっぽ、耳もとに ハマナスの 花（ヒノ） */
const HOMURA_TAIL = [
  '..G..',
  '.GAG.',
  '.VAGV',
  'VAGAV',
  'VAAAV',
  'OVVVO',
  'OOOOO',
  'OOOOO',
  'OOOOO',
  '.OOOO',
  '.OOOO',
  '.OOOO',
  '..OOO',
  '..OOO',
  '..OOO',
  '.OOOO',
  'OOOO.',
  'OOO..',
  'OO...',
  'O....',
];
const homuraGitsune: MonsterDesign = {
  size: 32,
  colors: {
    O: NQ.orange,
    P: NQ.paper,
    K: NQ.night,
    W: NQ.white,
    p: NQ.blush,
    V: NQ.vermilion,
    A: NQ.apricot,
    G: NQ.gold,
    b: NQ.berry,
  },
  rim: { [NQ.orange]: NQ.amber, [NQ.paper]: NQ.cloud },
  layers: [
    // 立ちあがった からだ（耳が 高く、むねを はる）
    {
      mirror: true,
      rows: [
        '................',
        '.....K..........',
        '.....KK.........',
        '.....KKK........',
        '.....OPKK.......',
        '.....OPPOO......',
        '.....OPPPOOOOOOO',
        '....OOPPPOOOOOOO',
        '....OOOOOOOOOOOO',
        '....OOOOOOoooOOO',
        '....POOOOOWWOOOO',
        '...PPOOOOOWoOOOO',
        '...PPPOOOOWoOOOO',
        '...PPPPOOOOOOPPP',
        '....PPPpOOPPPPPP',
        '.....PPPPPPPPPPo',
        '......PPPPPPPPoP',
        '.......PPPPPPPPP',
        '........OOOPPPPP',
        '.......OOOOPPPPP',
        '......OOOOOOPPPP',
        '......OOOOOOPPPP',
        '......OOOOOOOPPP',
        '......OOOOOOOPPP',
        '.......OOOOOOOOO',
        '.......OOOOOOOOO',
        '.......OOOOOOOOO',
        '........OOOOO...',
        '.........OOOO...',
        '.........KKKK...',
        '.........KKKK...',
      ],
    },
    // 炎の えりまき
    {
      mirror: true,
      x: 3,
      y: 15,
      rows: [
        '.V..........',
        'VAV.........',
        'VGAV........',
        '.VAAV.......',
        '..VVAV.V.V.V',
        '....VAVAVAVA',
        '.....VGVGVGV',
      ],
    },
    // 先が 炎の しっぽ（右で 高く 立つ）
    { x: 25, y: 3, rows: ring(HOMURA_TAIL) },
    { x: 26, y: 4, rows: HOMURA_TAIL },
    // 頭の 炎
    { mirror: true, x: 15, y: 1, rows: ['G', 'G', 'A', 'A', 'V'] },
    { mirror: true, x: 13, y: 3, rows: ['G', 'A', 'V'] },
    // 耳もとの ハマナスの 花・おでこの つや
    { x: 3, y: 4, rows: ['.p.', 'pGp', '.b.'] },
    { x: 9, y: 8, rows: ['PP'] },
  ],
};

// ───────────────────────── 中ボス ─────────────────────────

/** セツゾウゴーレム（中ボス）：さっぽろ雪まつりの 大雪像が 動きだした。けずった 雪の ブロック、あげた こぶし、台座（ミズ） */
const setsuzoColors = {
  W: NQ.white,
  I: NQ.ice,
  S: NQ.sky,
  A: NQ.azure,
  G: NQ.gold,
  Q: NQ.ochre,
  R: NQ.red,
};
const setsuzoGolem: MonsterDesign = {
  size: 40,
  colors: setsuzoColors,
  rim: { [NQ.white]: NQ.cloud, [NQ.ice]: NQ.sky },
  rimDepth: 2,
  layers: [
    {
      mirror: true,
      rows: [
        '....................',
        '................G..G',
        '................GGGR',
        '................QQQQ',
        '...........WWWWWWWWW',
        '..........WWWWWWWWWW',
        '..WWW.....WWWWWWWWWW',
        '.WWWWW....WoSSSSSSSS',
        '.WSWSW....WSooSSSSSS',
        '.WWWWW....WSSSooSSSS',
        '.WWWWS....WSSWWWSSSS',
        '.IWWWS....WSSWWoSSSS',
        '..IWS.....WSSWWoSSSS',
        '..WWS.....WSSWooSSSS',
        '..WWS.....WSSSSSSAAA',
        '..WWSS....WWSSSSSSWS',
        '..WWWSS...WWWWWWWWWW',
        '..WWWWWSSWWWWWWWWWWW',
        '...WWWWWWWWWWWWWWWWW',
        '...WWWWWWWWWSWWWWWWW',
        '....WWWWWWWWSWWWWWWW',
        '....SSSSSSSSSSSSSSSS',
        '.....WWWWWWWSWWWWWWW',
        '.....WWWWWWWSWWWWWWW',
        '.....WWWWWWWSWWWWWWW',
        '.....IWWWWWWSWWWWWWW',
        '.....SSSSSSSSSSSSSSS',
        '......WWWWWWWWWWSWWW',
        '......WWWWWWWWWWSWWW',
        '......IWWWWWWWWWSWWW',
        '.......IIIIIIIIIIIII',
        '.........WWWWWWW....',
        '.........WWWWWWW....',
        '.........WWWWWWI....',
        '...WWWWWWWWWWWWWWWWW',
        '...IIIIIIIIIIIIIIIII',
        '...IIISIIIIIISIIIIII',
        '...IIISIIIIIISIIIIII',
        '...SSSSSSSSSSSSSSSSS',
      ],
    },
  ],
};

/** セツゾウゴーレム（フィールドに 立つ 32×32） */
const setsuzoGolemField: MonsterDesign = {
  size: 32,
  colors: setsuzoColors,
  rim: { [NQ.white]: NQ.cloud, [NQ.ice]: NQ.sky },
  layers: [
    {
      mirror: true,
      y: 2,
      rows: [
        '................',
        '............G..G',
        '............GGGR',
        '............QQQQ',
        '........WWWWWWWW',
        '..WW...WWWWWWWWW',
        '.WWWW..WIAIIIIII',
        '.WSWS..WIIAAIIII',
        '.WWWW..WIIWWIIII',
        '..WS...WIIWoIIII',
        '..WS...WIIWoIAAA',
        '..WWS..WWIIIIIWI',
        '..WWWSSWWWWWWWWW',
        '...WWWWWWWWWWWWW',
        '...WWWWWWWSWWWWW',
        '....SSSSSSSSSSSS',
        '....WWWWWWWWWSWW',
        '....WWWWWWWWWSWW',
        '....SSSSSSSSSSSS',
        '.....WWWWWWWWWWW',
        '......IIIIIIIIII',
        '.......WWWW.....',
        '.......WWWW.....',
        '.......WWWI.....',
        '..WWWWWWWWWWWWWW',
        '..IIIIIIIIIIIIII',
        '..IISIIIIIISIIII',
        '..SSSSSSSSSSSSSS',
      ],
    },
  ],
};

// ───────────────────────── 県ボス ─────────────────────────

/** サケ（口に くわえる。頭が 左、しっぽが 右） */
const SALMON = [
  '...ssssssssssssssssss...ss',
  '.sssssssssssssssssssss.sss',
  'soEspppppppppppppppsssssss',
  '.ssssssssssssssssssss..ss.',
  '...sssssssssssssssss....s.',
];

/** ヒグマの からだ（左半分。まるい 耳と 頭、あげた 両うで、むねの 明るい 毛） */
const HIGUMA = [
  '........................',
  '...................G...G',
  '...................GG.GG',
  '...................GGGGR',
  '...........BBB.....GGGGR',
  '..........BBBBB....QQQQQ',
  '..E.E.E..BBTTBB.BBBBBBBB',
  '..EBEBE..BBTTBBBBBBBBBBB',
  '.BBBBBBB.BBBBBBBBBBBBBBB',
  '.BTTBTTB..BBBBBBBBBBBBBB',
  '.BBTTTBB..BBBBBBBBBBBBBB',
  '.BBBBBBB.BBBBBBoooBBBBBB',
  '..BBBBB..BBBBBBBBooBBBBB',
  '..BBBBB..BBBBBBBeeeBBBBB',
  '..BBBBB..BBBBBBBeeoBBBBB',
  '..BBBBB..BBBBBBBeeoBBTTT',
  '..BBBBB..BBBBBBBeooBTTTT',
  '..BBBBB..BBBBBBBBBBTTToo',
  '..BBBBB..BBBBBBBBBTTTToo',
  '..BBBBB...BBBBBBBBTTTTTo',
  '..BBBBB...BBBBBBBBTTTTTT',
  '..BBBBBB...BBBBBBBTTTTTT',
  '..BBBBBBB...BBBBBBBTTTTT',
  '..BBBBBBBB...BBBBBBBBBBB',
  '..BBBBBBBBBBBBBBBBBBBBBB',
  '...BBBBBBBBBBBBBBBBBBBBB',
  '...BBBBBBBBBBBBBBBBBTTTT',
  '...BBBBBBBBBBBBBBBTTTTTT',
  '...BBBBBBBBBBBBBBTTTTTTT',
  '...BBBBBBBBBBBBBBTTTTTTT',
  '...BBBBBBBBBBBBBBTTTTTTT',
  '...BBBBBBBBBBBBBBBTTTTTT',
  '...BBBBBBBBBBBBBBBBTTTTT',
  '....BBBBBBBBBBBBBBBBBBBB',
  '....BBBBBBBBBBBBBBBBBBBB',
  '....BBBBBBBBBBBBBBBBBBBB',
  '.....BBBBBBBBBBBBBBBBBBB',
  '.....BBBBBBBBBBBBBBBBBBB',
  '......BBBBBBBBBBBBBBBBBB',
  '.......BBBBBBBBBBBB.....',
  '.......BBBBBBBBBBBB.....',
  '.......BBBBBBBBBBBB.....',
  '.......BBBBBBBBBBBB.....',
  '.......BBBBBBBBBBBB.....',
  '.......BBBBBBBBBBBB.....',
  '......BBBBBBBBBBBBB.....',
  '......EBEBEBEBBBBBB.....',
];

/** 流氷の かたあて（左半分） */
const HIGUMA_ICE = [
  '....IIW.......',
  '...IWWIIW.....',
  '..IWWIIIIWW...',
  '.IWIIIISIIIW..',
  'IWIIIISSIIIII.',
  'IIIIISSIIIISS.',
  'SSIIISIIIISS..',
  '..SSSIISSS....',
];

/** ヒグマダイオウ（県ボス）：知床の 森の 王。サケを くわえ、両手を あげて 立ちはだかる。かたに 流氷の よろい（ツチ） */
const higumaColors = {
  B: NQ.brown,
  T: NQ.tan,
  E: NQ.beige,
  e: NQ.white,
  W: NQ.white,
  I: NQ.ice,
  S: NQ.sky,
  G: NQ.gold,
  Q: NQ.ochre,
  R: NQ.red,
  s: NQ.silver,
  p: NQ.blush,
};
const higumaDaio: MonsterDesign = {
  size: 48,
  colors: higumaColors,
  rim: { [NQ.brown]: NQ.bark, [NQ.ice]: NQ.sky, [NQ.silver]: NQ.gray },
  rimDepth: 2,
  layers: [
    { mirror: true, rows: HIGUMA },
    // 流氷の かたあて
    { mirror: true, x: 3, y: 23, rows: HIGUMA_ICE },
    // くわえた サケ（鼻の 下）
    { x: 10, y: 18, rows: ring(SALMON) },
    { x: 11, y: 19, rows: SALMON },
    // 毛の つや（左上）
    { x: 13, y: 8, rows: ['EE', 'E.'] },
  ],
};

/** ヒグマダイオウ 後半（ミズ）：流氷の よろいが うでまで のび、目が 氷の 色に 光り、まわりに 氷の かけら */
const higumaDaioP0: MonsterDesign = {
  ...higumaDaio,
  colors: { ...higumaColors, e: NQ.ice, E: NQ.ice },
  layers: [
    // 氷の かけら（うしろ）
    { mirror: true, x: 1, y: 22, rows: ['.I.', 'IWI', 'ISI', '.S.'] },
    { mirror: true, x: 2, y: 30, rows: ['.I', 'IW', 'IS', '.S'] },
    { mirror: true, x: 1, y: 38, rows: ['.I.', 'IWI', '.S.'] },
    ...higumaDaio.layers,
    // うでの 氷の こて
    { mirror: true, x: 1, y: 12, rows: ['.IIWIII.', 'IWWIIISI', 'IIIISSII', '.SSIISS.'] },
    // 足の 氷
    { mirror: true, x: 7, y: 40, rows: ['.IIWIIIIIIII', 'IWWIIIISIIIS', 'SSIISSIISSS.'] },
    // きらきら
    { x: 2, y: 2, rows: ['.W.', 'WIW', '.W.'] },
    { x: 43, y: 3, rows: ['.W.', 'WIW', '.W.'] },
  ],
};

// ───────────────────────── ラスボス ─────────────────────────

/** クラーク博士の 頭（左半分。かみ・ひげ H、つや h、白い まじり s） */
const CLARK_HEAD = [
  '................HHHHHHHH',
  '..............HHHHHHHHHH',
  '.............HHHHHHHHHHH',
  '.............HHHhhHHHHHH',
  '............HHHhhHHHHHHH',
  '............HHHFFFFFFFFF',
  '............HHFFFFFFFFFF',
  '............HHFFFFFFFFFF',
  '............HHFFFoooFFFF',
  '...........fHHFFFFWoFFFF',
  '...........fHHFFFFFFFFFf',
  '............HHFFFFFFFFFf',
  '............HHHFFFFFFFFF',
  '............HHHHFFFHHHHH',
  '............HHHHHHHHHHoo',
  '............HHHsHHHHHHHH',
  '.............HHHHHHsHHHH',
  '..............HHHHHHHHHH',
  '...............HHHHHHHHH',
  '.................HHHHHHH',
];

/** クラーク博士の からだ（左半分。フロックコート D・えり N・シャツ W・ネクタイ R・ボタン G・くつ K） */
const CLARK_BODY = [
  '............DDDDDDDDDDDD',
  '..........DDDDDDDDDDDDDD',
  '.........DDDDDDDDDDDNWWR',
  '........DDDDDDDDDDDNNWRR',
  '........DDDDDDDDDDDNWWRR',
  '........DDDDDDDDDDNNWWWR',
  '........DDDDDDDDDDNNWWWW',
  '........DDDDDDDDDDNNWWWW',
  '........DDDDDDDDDDDNNWWW',
  '........DDDDDDDDDDDGNNWW',
  '........DDDDDDDDDDDDDNNN',
  '........DDDDDDDDDDDDDDNN',
  '........DDDDDDDDDDDGDDDN',
  '........DDDDDDDDDDDDDDDN',
  '........DDDDDDDDDDDDDDDN',
  '.......DDDDDDDDDDDDGDDDN',
  '.......DDDDDDDDDDDDDDDDN',
  '.......DDDDDDDDDDDDDDNNN',
  '......DDDDDDDDDDDDDDNNNN',
  '......DDDDDDDDDDDDDNNNN.',
  '.....DDDDDDDDDDDDDDNNNN.',
  '.....DDDDDDDDDDDDD.NNNN.',
  '....DDDDDDDDDDDDD..NNNN.',
  '..............KKKKKKKK..',
  '..............KKKKKKKK..',
];

/** クラーク博士（ラスボス）：札幌農学校の 先生。フロックコートに 赤い ネクタイ、みどりの 本を かかえ、右手で 空を ゆびさす（モリ） */
const clark: MonsterDesign = {
  size: 48,
  colors: {
    F: NQ.skinLight,
    f: NQ.skinMid,
    W: NQ.white,
    H: NQ.hairBrown,
    h: NQ.tan,
    s: NQ.silver,
    D: NQ.denim,
    N: NQ.navy,
    R: NQ.red,
    G: NQ.gold,
    g: NQ.green,
    K: NQ.night,
  },
  rim: { [NQ.denim]: NQ.navy, [NQ.skinLight]: NQ.skinMid, [NQ.green]: NQ.forest },
  rimDepth: 2,
  layers: [
    { mirror: true, y: 22, rows: CLARK_BODY },
    // ゆびさす 右うで（見る がわの 左）
    {
      x: 4,
      y: 2,
      rows: [
        '..F.....',
        '..F.....',
        '..FF....',
        '.FFFF...',
        '.FFFFf..',
        '.fFFFf..',
        '..WWWW..',
        '..DDDD..',
        '..DDDDD.',
        '...DDDD.',
        '...DDDDD',
        '....DDDD',
        '....DDDD',
        '....DDDDD',
        '.....DDDD',
        '.....DDDDD',
        '......DDDD',
        '......DDDDD',
        '.......DDDD',
        '.......DDDDD',
        '........DDDD',
      ],
    },
    { mirror: true, y: 3, rows: CLARK_HEAD },
    // 本（見る がわの 右。金の 葉の しるし）と 本を もつ 手
    {
      x: 29,
      y: 27,
      rows: ring([
        'gggggggggW',
        'gggggggggW',
        'gggGGggggW',
        'ggGGGGgggW',
        'gggGGggggW',
        'ggggGggggW',
        'gggggggggW',
        'gggggggggW',
      ]),
    },
    {
      x: 30,
      y: 28,
      rows: [
        'gggggggggW',
        'gggggggggW',
        'gggGGggggW',
        'ggGGGGgggW',
        'gggGGggggW',
        'ggggGggggW',
        'gggggggggW',
        'gggggggggW',
      ],
    },
    { x: 37, y: 34, rows: ['FFF', 'fFf'] },
  ],
};

/** ラベンドリ：富良野の ラベンダー畑の 小さな 鳥。頭に 3 つの 花の ほ、黄色い くちばし（カゼ） */
const lavendori: MonsterDesign = {
  size: 32,
  colors: {
    V: NQ.violet,
    L: NQ.lavender,
    g: NQ.green,
    l: NQ.lime,
    W: NQ.white,
    p: NQ.blush,
    Y: NQ.gold,
    S: NQ.sprout,
  },
  rim: { [NQ.lavender]: NQ.violet },
  rimDepth: 2,
  layers: [
    // つばさ（からだの よこ）
    { mirror: true, x: 1, y: 13, rows: ['..VL', '.VLL', 'VLLL', 'VLLL', '.VLL', '..VL'] },
    {
      mirror: true,
      rows: [
        '................',
        '..............V.',
        '.............VLV',
        '..............V.',
        '.............VLV',
        '..............V.',
        '.............glg',
        '..........LLLLLL',
        '........LLLLLLLL',
        '.......LLLLLLLLL',
        '......LLLLLLLLLL',
        '.....LLLLLLLLLLL',
        '.....LLLLLLLLLLL',
        '....LLLLLLLLLLLL',
        '....LLLLLWWLLLLL',
        '....LLLLLWoLLLLL',
        '....LLLLLWoLLLLL',
        '....LppLLLLLLLLL',
        '....LLLLLLLLLLLL',
        '....LLLLLLLLLLLL',
        '.....LLLLLLLLLLL',
        '.....LLLLLLLLLLL',
        '......LLLLLLLLLL',
        '.......LLLLLLLLL',
        '........LLLLLLLL',
        '..........LLLLLL',
        '..........YY....',
        '..........YY....',
        '..........YY....',
        '.........YYY....',
        '.........YYY....',
      ],
    },
    // くちばし・つや
    { x: 14, y: 17, rows: ['YYYY', '.YY.'] },
    { x: 7, y: 10, rows: ['.S', 'S.'] },
  ],
};

/** ムラサキカゼドリ：ラベンドリの しんか。大きく ひろげた つばさで かおりの 風を はこぶ（カゼ） */
const murasakiKazedori: MonsterDesign = {
  size: 32,
  colors: {
    V: NQ.violet,
    I: NQ.indigo,
    L: NQ.lavender,
    g: NQ.green,
    l: NQ.lime,
    W: NQ.white,
    p: NQ.blush,
    Y: NQ.gold,
    M: NQ.mint,
    A: NQ.aqua,
  },
  rim: { [NQ.lavender]: NQ.violet },
  rimDepth: 2,
  layers: [
    // 大きく ひろげた つばさ
    {
      mirror: true,
      x: 1,
      y: 8,
      rows: ['....I', '...IV', '..IVL', '.IVLL', 'IVLLL', 'IVLLL', 'IVLLL', '.IVLL', '..IVL', '...IV', '....I'],
    },
    {
      mirror: true,
      rows: [
        '................',
        '.............V..',
        '............VLV.',
        '.............V..',
        '............VLV.',
        '.............V..',
        '............glg.',
        '.........VVVVVVV',
        '.......VVLLLLLLL',
        '......VLLLLLLLLL',
        '.....VLLLLLLLLLL',
        '....VLLLLLLLLLLL',
        '....VLLLooLLLLLL',
        '...VLLLLLLoooLLL',
        '...VLLLLLWWLLLLL',
        '...VLLLLLWoLLLLL',
        '...VLLLLLWoLLLLL',
        '...VLLppLLLLLLLL',
        '...VLLLLLLLLLLLL',
        '...VLLLLLLLLLLLL',
        '....VLLLLLLLLLLL',
        '....VLLLLLLLLLLL',
        '.....VLLLLLLLLLL',
        '......VLLLLLLLLL',
        '.......VVLLLLLLL',
        '.........VVVLLLL',
        '..........YY....',
        '..........YY....',
        '..........YY....',
        '.........YYY....',
        '.........YYY....',
      ],
    },
    // くちばしと 風
    { x: 14, y: 17, rows: ['YYYY', '.YY.'] },
    { x: 1, y: 3, rows: ['MMM.', '...M', '.AA.'] },
    { x: 26, y: 24, rows: ['.MMM', 'M...', '.AA.'] },
  ],
};

export const HOKKAIDO: Readonly<Record<string, MonsterDesign>> = {
  'hokkaido-lavendori': lavendori,
  'hokkaido-murasaki-kazedori': murasakiKazedori,
  'hokkaido-ami-melon': amiMelon,
  'hokkaido-dodeka-melon': dodekaMelon,
  'hokkaido-jaga-goron': jagaGoron,
  'hokkaido-jaga-dodon': jagaDodon,
  'hokkaido-hotaten': hotaten,
  'hokkaido-jet-hotate': jetHotate,
  'hokkaido-kurioneru': kurioneru,
  'hokkaido-ryuhyo-tenshi': ryuhyoTenshi,
  'hokkaido-kitakon': kitakon,
  'hokkaido-homura-gitsune': homuraGitsune,
  'hokkaido-midboss-setsuzo-golem': setsuzoGolem,
  'hokkaido-midboss-setsuzo-golem.field': setsuzoGolemField,
  'hokkaido-boss-higuma-daio': higumaDaio,
  'hokkaido-boss-higuma-daio.p0': higumaDaioP0,
  'hokkaido-lastboss-clark': clark,
};
