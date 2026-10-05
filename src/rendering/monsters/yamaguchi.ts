/** 山口県の モンスター（手描き。docs/06 §4・§6.3〜6.5 の 規格） */
import { NQ } from '../palette';
import type { Layer, MonsterDesign } from './design';
import { lord } from './lastbosses';

/** 地図の まわり 1 ドットを ink にする（重ねる 部品を くっきり させる）。x-1, y-1 に 置く */
function ring(rows: readonly string[], half = false): string[] {
  const w = Math.max(...rows.map((r) => r.length));
  const at = (x: number, y: number) => (rows[y]?.[x] ?? '.') !== '.';
  return Array.from({ length: rows.length + 2 }, (_, j) =>
    Array.from({ length: w + (half ? 1 : 2) }, (_, i) => {
      const x = i - 1;
      const y = j - 1;
      return !at(x, y) && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) ? 'o' : '.';
    }).join(''),
  );
}

/** 部品を ink の ふちどりつきで 置く */
const inked = (rows: readonly string[], x: number, y: number, half = false): Layer[] => [
  { mirror: half, x: x - 1, y: y - 1, rows: ring(rows, half) },
  { mirror: half, x, y, rows },
];

// ───────────────────────── 通常 ─────────────────────────

/** プクフク：下関の トラフグ。まんまるに ふくらんだ からだ、青い せなかの 黒い もよう、よこの 大きな 黒い 紋、白い おなかの とげ、小さな 口に 2 本の 歯（ミズ） */
const pukufukuColors = {
  A: NQ.azure,
  N: NQ.navy,
  W: NQ.white,
  I: NQ.white,
  K: NQ.sky,
  p: NQ.blush,
};
const pukufuku: MonsterDesign = {
  size: 32,
  colors: pukufukuColors,
  rim: { [NQ.azure]: NQ.blue, [NQ.white]: NQ.cloud },
  layers: [
    {
      mirror: true,
      y: 2,
      rows: [
        '................',
        '................',
        '................',
        '...............K',
        '..........A...KK',
        '..........AAAAAA',
        '........AAAANAAA',
        '.....AAAAAAAAAAA',
        '.....AANAAAAANAA',
        '...AAAAAAAAAAAAA',
        '....AANAAAWWAAAA',
        '...AAAAAAAWoAAAA',
        '...AAAAAAAWoAAAA',
        '...AWWWAApAAAAAA',
        '..AWNNNWAAAAAAoo',
        '..AWNNNWIIIIIIoW',
        '..IIWWWIIIIIIIIo',
        '.KKIIIIIIIIIIIII',
        '.KKKIIIIIIIIIIII',
        '..KIIIIIIIIIIIII',
        '..WIIIIIIIIIIIII',
        '...IIIIIIIIIIIII',
        '...WIIIIIIIIIIII',
        '....IIIIIIIIIIII',
        '.....WIIIIIIIIII',
        '......IIIIIIIIII',
        '........IIIIIIII',
        '..........IIIIII',
      ],
    },
    // しっぽの ひれ
    { mirror: true, y: 29, rows: ['.............KKK'] },
  ],
};

/** ナナバケン：萩焼の 茶わん。やわらかな 土の 色に 白い うわぐすりが たれ、こまかな ひび（貫入）、中に お茶、切れこみの ある 高台が 足（ツチ） */
const chawanColors = {
  P: NQ.paper,
  L: NQ.lime,
  F: NQ.sprout,
  E: NQ.sand,
  C: NQ.beige,
  T: NQ.tan,
  B: NQ.brown,
  W: NQ.white,
  p: NQ.blush,
};
const nanabaken: MonsterDesign = {
  size: 32,
  colors: chawanColors,
  rim: { [NQ.sand]: NQ.tan },
  layers: [
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '........PPPPPPPP',
        '.....PPPLLLLLLLL',
        '....PPLLLFLLLLLL',
        '....PPPLLLLLFLLL',
        '....CPPPPPPPPPPP',
        '....ECPEEPPEEEPE',
        '....ECPEEEPEEEEE',
        '....ECEETEEEEEEE',
        '....EETEEEWWEEEE',
        '....EEETEEWoEEEE',
        '..EEEEEEEEWoEEoE',
        '..EEEEEppEEEEEEo',
        '....EEEEEETEEEEE',
        '.....EETEEEETEEE',
        '.....EEETEEEEEEE',
        '......EEEEETEEEE',
        '.......EEEEEEEEE',
        '.........TTTTTTT',
        '.........TTTTTT.',
        '.........TTTTT..',
        '.........BBBB...',
      ],
    },
  ],
};

/** ナツミカンブシ：萩の 夏みかんの さむらい。へたの ちょんまげと 葉、かたの はった かみしも、はかま（モリ） */
const mikanColors = {
  O: NQ.orange,
  a: NQ.amber,
  C: NQ.cream,
  W: NQ.white,
  p: NQ.blush,
  L: NQ.leaf,
  g: NQ.green,
  D: NQ.denim,
  S: NQ.navy,
};
const natsumikanBushi: MonsterDesign = {
  size: 32,
  colors: mikanColors,
  rim: { [NQ.orange]: NQ.amber, [NQ.denim]: NQ.navy, [NQ.leaf]: NQ.green },
  layers: [
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '..............gg',
        '..............gg',
        '...........OOOgg',
        '.........OOOOOOO',
        '.......OOCCOOOOO',
        '......OOCOOOOOOO',
        '.....OOCOOOaOOOO',
        '.....OOOOOOOOOOO',
        '....OOOOOOOOOOOO',
        '....OOOOOoooOOOO',
        '....OOOOOOWWOOOO',
        '....OOaOOOWoOOOO',
        '....OOOOOOWoOOoO',
        '....OOOOppOOOOOo',
        '.DDDDOOOOOOOOOOO',
        '.DDDDDDOOOOOOaOO',
        '..DDDDDDOOOOOOOO',
        '....DDDDDOOOOOOO',
        '....DDDDDDOOOOOO',
        '.....DDDDDDOOOOO',
        '......DDDDDDOOOO',
        '.......SSSSSSSSS',
        '.......SSSSSSSSS',
        '......SSSSSSSSSS',
        '......SSSSSSS.SS',
        '.....SSSSSSS....',
        '.....ggggggg....',
      ],
    },
    // 葉っぱ（ちょんまげの よこ）
    { x: 17, y: 1, rows: ['...LLL', '.LLLLL', 'gLLLL.'] },
  ],
};

// ───────────────────────── しんか ─────────────────────────

/** カンモンフク（プクフクの しんか）：もっと 大きく ふくらみ、とげが 立つ。きりっと した まゆ、あけた 口、関門海峡の 波（ミズ） */
const kanmonFuku: MonsterDesign = {
  size: 32,
  colors: pukufukuColors,
  rim: { [NQ.azure]: NQ.blue, [NQ.white]: NQ.cloud },
  layers: [
    {
      mirror: true,
      rows: [
        '................',
        '..............KK',
        '.........A...KKK',
        '......A..AAAAAAA',
        '.......AAAAANAAA',
        '.....AAAAAAAAAAA',
        '...A.AANAAAAANAA',
        '....AAAAAAAAAAAA',
        '...AAANAAAAAAAAA',
        '..AAAAAAAooAAAAA',
        '...AAAAAAAAoAAAA',
        '..AAANAAAAWWAAAA',
        '..AAAAAAAAWoAAAA',
        '.AAAAAAAAAWoAAAA',
        '..AWWWAAApAAAAAA',
        '.AWNNNWAAAAAAooo',
        '..WNNNWIIIIIIoWo',
        '.KKWWWIIIIIIIIoo',
        '.KKKIIIIIIIIIIII',
        '.KKKKIIIIIIIIIII',
        '..KKIIIIIIIIIIII',
        '..WIIIIIIIIIIIII',
        '...IIIIIIIIIIIII',
        '...WIIIIIIIIIIII',
        '....IIIIIIIIIIII',
        '....WIIIIIIIIIII',
        '......IIIIIIIIII',
        '..KKKWWKKKKKWWKK',
        '.KAAKKKAAKKKKAAK',
        '.AAAAAAAAAAAAAAA',
      ],
    },
  ],
};

/** ノボリガマン（ナナバケンの しんか）：萩焼の 茶わんの 頭に、山の しゃめんを のぼる 登り窯の からだ。むねの 窯の 口に 火（ツチ） */
const noborigaman: MonsterDesign = {
  size: 32,
  colors: { ...chawanColors, O: NQ.orange, G: NQ.gold },
  rim: { [NQ.sand]: NQ.tan, [NQ.tan]: NQ.brown },
  layers: [
    // 登り窯の からだ（左右に 段に なって 下がる かまの へや）
    {
      mirror: true,
      y: 13,
      rows: [
        '.........TTTTTTT',
        '.......TTTTTTTTT',
        '...TTTTTTBTTTTTT',
        '..TTTTTTTTTTTTTT',
        '..TooTTBTTTToooo',
        '..TOOTTTTTToOOOO',
        '..TGGTTTBTToOGGO',
        '..TTTTTTTTToGGGG',
        '..TTTBTTTTToOGGG',
        '...TTTTTTTTTTTTT',
        '...TTTBTTTTBTTTT',
        '....TTTTTTTTTTTT',
        '.....TTTTTT..TTT',
        '.....TTTTTT.....',
        '.....TTTTTT.....',
        '....BBBBBBB.....',
      ],
    },
    // うで
    { mirror: true, y: 16, rows: ['..TT', '.TTT', '.TTT', '.TTT', '.TTT', '.EEE', '.EE.'] },
    // 茶わんの 頭
    ...inked(
      [
        '..PPPPPP',
        'PPLLLLLL',
        'PLLFLLLL',
        'PPPPPPPP',
        'CEPEEPPE',
        'CEEEEEEE',
        'CEooEEEE',
        'EEEEoEEE',
        'EEEEWWEE',
        'EEEEWoEE',
        'EEpEWoEo',
        '.EEEEEEo',
      ],
      8,
      2,
      true,
    ),
  ],
};

/** ミカンダイミョウ（ナツミカンブシの しんか）：大きな 夏みかんの 殿さま。葉の かざり、白い 夏みかんの 花、金の 紋の かみしも、ひらいた 扇（モリ） */
const mikanDaimyo: MonsterDesign = {
  size: 32,
  colors: { ...mikanColors, G: NQ.gold, R: NQ.red, P: NQ.white },
  rim: { [NQ.orange]: NQ.amber, [NQ.denim]: NQ.navy, [NQ.leaf]: NQ.green },
  layers: [
    {
      mirror: true,
      rows: [
        '................',
        '..............gg',
        '..............gg',
        '..........OOOOgg',
        '........OOOOOOOO',
        '......OOCCOOOOOO',
        '.....OOCOOOOOOOO',
        '....OOCOOOaOOOOO',
        '....OOOOOOOOOOOO',
        '...OOOOOOOOOOOOO',
        '...OOOOOooOOOOOO',
        '...OOOOOOOooOOOO',
        '...OOOaOOOWWOOOO',
        '...OOOOOOOWoOOOO',
        '...OOOOOOOWoOOoo',
        '...OOOOOppOOOOOo',
        '.DDDDDOOOOOOOOOO',
        '.DGGDDDOOOOOOaOO',
        '.DGGDDDDOOOOOOOO',
        '..DDDDDDDOOOOOOO',
        '....DDDDDDOOOOOO',
        '....DDDDDDDOOOOO',
        '.....DDDDDDDOOOO',
        '......SSSSSSSSSS',
        '......SSSSSSSSSS',
        '.....SSSSSSSSSSS',
        '.....SSSSSSS..SS',
        '....SSSSSSSS....',
        '....gggggggg....',
      ],
    },
    // 葉の かざり（左右へ ひろがる）と 白い 花
    {
      mirror: true,
      y: 1,
      rows: ['........LL......', '.......LLLL.....', '.........LLLL.PP', '.............PWP'],
    },
    // ひらいた 扇（右手）
    ...inked(['..RRRRR', '.RGGGGR', 'RGGGGR.', '.RGGR..', '...g...', '...g...'], 24, 18),
  ],
};

// ───────────────────────── 中ボス ─────────────────────────

const HEBI_HEAD = [
  '..............WWWWWW',
  '............WWWWWWWW',
  '...........WWCWWWWWW',
  '..........WWCWWWWWWW',
  '..........WWWWWWWWWW',
  '..........WWoooWWWWW',
  '..........WWBBBoWWWW',
  '..........WWBBBoWWWW',
  '..........WWBBBoWWWW',
  '..........WWBBooWWWW',
  '...........WWWWWWWWW',
  '...........WWWWWWWWW',
  '............WWWWWWWo',
  '.............WWWWWWW',
  '..............WWWWWW',
];

/** とぐろの 1 だん（左半分。上が つや、下が かげ、うろこの つぶ） */
const coil = (left: number, w: number): string[] => {
  const row = (l: number, ch: string) => '.'.repeat(l) + ch.repeat(w - l);
  return [
    row(left + 2, 'W'),
    row(left, 'W'),
    '.'.repeat(left) + 'WWC'.repeat(w).slice(0, w - left),
    row(left, 'W'),
    row(left, 'P'),
    row(left + 2, 'P'),
  ];
};

/** キンタイシロヘビ（中ボス）：錦帯橋の 木の アーチの 上で とぐろを まく、白い 大ヘビ。王冠と 青い 目、赤い した（ヒカリ） */
const kintaiShirohebi: MonsterDesign = {
  size: 40,
  colors: {
    W: NQ.white,
    P: NQ.paper,
    C: NQ.cream,
    B: NQ.sky,
    Y: NQ.cream,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    T: NQ.tan,
    K: NQ.brown,
    S: NQ.silver,
    p: NQ.blush,
  },
  rim: { [NQ.white]: NQ.cloud, [NQ.tan]: NQ.brown, [NQ.silver]: NQ.gray, [NQ.gold]: NQ.ochre },
  rimDepth: 2,
  layers: [
    // 錦帯橋（木の アーチと 石の 橋げた）
    {
      mirror: true,
      y: 29,
      rows: [
        '..........TTTTTTTTTT',
        '.......TTTTTTTTTTTTT',
        '....TTTTKTTTKTTTKTTT',
        '..TTTKTTTKTTTKTTTKTT',
        '.TTTTTTTKKKKKKKKKKKK',
        '.TKTTTKK............',
        '.SSSSSS.............',
        '.SSSSSS.............',
        '.SSSSSS.............',
        '.SSSSSS.............',
      ],
    },
    // とぐろ（3 だん。下から。キャンバスいっぱいに 太く）
    ...inked(coil(1, 20), 0, 24, true),
    ...inked(coil(3, 20), 0, 19, true),
    ...inked(coil(6, 20), 0, 14, true),
    // しっぽの 先（右へ）
    ...inked(['...WW', '..WW.', 'WWW..'], 33, 21),
    // 頭
    ...inked(HEBI_HEAD, 0, 2, true),
    // 王冠
    ...inked(['...G..G', '...GGGG', '...GGGR', '...QQQQ'], 13, 1, true),
    // ちょろっと 出た 赤い した
    { x: 18, y: 17, rows: ['.RR.', 'R..R'] },
    // きらきら
    { x: 2, y: 5, rows: ['.Y.', 'YGY', '.Y.'] },
    { x: 35, y: 7, rows: ['.Y.', 'YGY', '.Y.'] },
    { x: 4, y: 12, rows: ['Y.', '.G'] },
  ],
};

/** キンタイシロヘビ（フィールドに 立つ 32×32） */
const kintaiShirohebiField: MonsterDesign = {
  size: 32,
  colors: {
    W: NQ.white,
    P: NQ.paper,
    C: NQ.cream,
    B: NQ.sky,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    T: NQ.tan,
    K: NQ.brown,
    S: NQ.silver,
  },
  rim: { [NQ.white]: NQ.cloud, [NQ.tan]: NQ.brown },
  layers: [
    {
      mirror: true,
      y: 24,
      rows: [
        '........TTTTTTTT',
        '.....TTTTTTTTTTT',
        '..TTTKTTTKTTTKTT',
        '.TTTTTTKKKKKKKKK',
        '.SSSSS..........',
        '.SSSSS..........',
      ],
    },
    ...inked(coil(1, 16), 0, 19, true),
    ...inked(coil(4, 16), 0, 14, true),
    ...inked(
      [
        '..........WWWWWW',
        '.........WWWWWWW',
        '........WWWWWWWW',
        '........WWoooWWW',
        '........WWBBoWWW',
        '........WWBBoWWW',
        '.........WWWWWWo',
        '..........WWWWWW',
      ],
      0,
      6,
      true,
    ),
    ...inked(['..G.G', '..GGG', '..GGR', '..QQQ'], 11, 3, true),
    { x: 15, y: 14, rows: ['RR'] },
  ],
};

// ───────────────────────── 県ボス ─────────────────────────

/** アキヨシダイオウ（県ボス）：秋吉台の 石灰岩の 大王。草の かみと かた から 白い 石が つき出し、むねの 洞くつの おくに 黄金の 柱（ツチ）。
 *  g/G 草、w/W 石灰岩、s/S 石の からだ、N 洞くつ、Y 黄金柱 */
const daiouColors = {
  s: NQ.silver,
  S: NQ.cloud,
  w: NQ.cloud,
  W: NQ.white,
  g: NQ.leaf,
  G: NQ.lime,
  N: NQ.night,
  Y: NQ.gold,
  Q: NQ.ochre,
  J: NQ.red,
  K: NQ.slate,
};

const akiyoshiLayers = (grassHi: Layer[] = []): Layer[] => [
  // からだ・うで・足（左半分）
  {
    mirror: true,
    y: 18,
    rows: [
      '.......ww...........gggg',
      '..ww..wWw.....gggggggggg',
      '.gwWgggWwgggggggGggggggg',
      '.ggwWgggGggggGggggssssss',
      '.GgggggggggGgggsssssssss',
      '.ggggGggggggggssssssssss',
      '..sssssssssss.ssssssKsss',
      '..sssssssssss.sssssNNNNN',
      '..ssKsssssKss.ssssNNNNNN',
      '..sssssssssss.sssNNWNWNN',
      '..sssssKsssss.sssNNNNNYY',
      '..ssssssssss..sssNNNNYYY',
      '..SSSSssss....sssNNNNNYY',
      '.SSSSSSsss....sssNNNNYYY',
      '.SSSSSSSs.....sssNNNNNYY',
      '..SSSSSS......sssNNNNYYY',
      '...SSSS.......ssssssssss',
      '..............sssKssssss',
      '.............sssssssssss',
      '............ssssssss.sss',
      '............ssssssss....',
      '...........sssssssss....',
      '...........sssssssss....',
      '...........sssssssss....',
      '...........ssssKssss....',
      '...........sssssssss....',
      '..........KKKKKKKKKK....',
    ],
  },
  // 頭
  {
    mirror: true,
    y: 3,
    rows: [
      '.......w................',
      '.......ww...............',
      '......wWw...............',
      '......wWw.......w.......',
      '.....gwWwg.....wWw......',
      '.....ggggggg.ggwWwgg....',
      '.....gggGggggggggggggggg',
      '.....ggggggGggggGggggggg',
      '......gGgggsssssssssssss',
      '......ggggssssssssssssss',
      '.......ggssooosssssssss',
      '........gssssoosssssssss',
      '........gsssYYYossssssss',
      '........gsssYYYossssssss',
      '........gsssYYYossssssss',
      '........gsssYYoossssssss',
      '.........sssssssssssssss',
      '..........sssssssKoooooo',
      '...........ssssssssssss',
    ],
  },
  // 王冠（2 本の 石の つのの あいだ）
  ...inked(['..Y..Y', '..YYYY', '..YYYJ', '..QQQQ'], 18, 1, true),
  // かたから つき出す 石灰岩の とげ
  {
    mirror: true,
    y: 14,
    rows: [
      '.....W..................',
      '....wWw.................',
      '....wWw.................',
      '...wwWww................',
      '..wwWWWww...............',
      '..wWWWWWw...............',
    ],
  },
  ...grassHi,
];

const akiyoshiDaiou: MonsterDesign = {
  size: 48,
  colors: daiouColors,
  rim: { [NQ.silver]: NQ.gray, [NQ.leaf]: NQ.green, [NQ.gold]: NQ.ochre },
  rimDepth: 2,
  layers: akiyoshiLayers(),
};

/** アキヨシダイオウ 後半（ヒノ）：山焼きの 炎が 草の かみと かたに もえひろがり、洞くつの 黄金の 柱が 赤く かがやく */
const akiyoshiDaiouP0: MonsterDesign = {
  ...akiyoshiDaiou,
  colors: { ...daiouColors, g: NQ.vermilion, G: NQ.gold, Y: NQ.apricot, N: NQ.brick },
  rim: { [NQ.silver]: NQ.gray, [NQ.vermilion]: NQ.red, [NQ.gold]: NQ.ochre },
  layers: akiyoshiLayers([
    // 立ちのぼる 炎
    {
      mirror: true,
      y: 14,
      rows: ['..G.............', '..gG.......G....', '.ggG......gGg...', '.gGgg....ggGg...'],
    },
  ]),
};

// ───────────────────────── 裏ステージ ─────────────────────────

/** 吉田松陰：まげを ゆった 若い 先生。こん色の きもの、灰色の はかま、金の ふちの 本を もつ（ヒカリ） */
const yoshidaShoin = lord(
  [
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '......................NN',
    '.....................NNN',
    '......................WW',
    '..................NNNNNN',
    '...............NNFFFFFFF',
    '.............NNFFFFFFFFF',
    '............NNFFFFFFFFFF',
    '...........NNFFFFFFFFFFF',
    '..........NNFFFFFFFFFFFF',
    '.........NNFFoooFFFFFFFF',
    '.........NFFFFWoFFFFFFFF',
    '.........NFFFFFFFFFFFFFF',
    '.........NFFFFFFFFFFfFFF',
    '..........fFFFFFFFFFFFoo',
    '..........ffFFFFFFFFFFFF',
    '............ffffffffffff',
  ],
  {
    N: NQ.hairBlack,
    L: NQ.slate,
    K: NQ.navy,
    S: NQ.denim,
    G: NQ.slate,
    R: NQ.red,
    T: NQ.gray,
    H: NQ.denim,
    Y: NQ.gold,
    P: NQ.paper,
  },
  { [NQ.denim]: NQ.navy },
  [
    // 大きな かたの ころも（金の ふち）
    {
      mirror: true,
      y: 24,
      rows: [
        '.YYYYYYYY...............',
        '.SSSSSSSSS..............',
        '.SHHSSSHSS..............',
        '.SSSSSSSSS..............',
        '.YYYYYYYYY..............',
        '..SSSSSSSS..............',
        '...SSSSSSS..............',
        '....SSSSSS..............',
      ],
    },
    // 金の ふちの 本（ひらいて もつ）
    ...inked(
      ['YYYYYYYYY', 'YPPPPYPPY', 'YPoPPYPoY', 'YPPPPYPPY', 'YPoPPYPoY', 'YYYYRYYYY', '....R....'],
      3,
      33,
    ),
    // 高く かかげた 手と、学びの 光
    ...inked(['.FFF', 'FFFF', '.FF.'], 38, 13),
    { x: 39, y: 16, rows: ['SSS', 'SSS', 'SSS', 'SSS', 'SSS', 'SSS', 'SSS', 'SSS'] },
    { x: 37, y: 5, rows: ['..Y..', '.YPY.', 'YPPPY', '.YPY.', '..Y..'] },
    { x: 3, y: 8, rows: ['.Y.', 'YPY', '.Y.'] },
    { x: 8, y: 3, rows: ['Y.', '.P'] },
  ],
);

// ───────────────────────── 角島大橋の 鳥 ─────────────────────────

const hashiColors = {
  P: NQ.paper,
  C: NQ.cloud,
  W: NQ.white,
  A: NQ.aqua,
  T: NQ.teal,
  Y: NQ.yellow,
  p: NQ.blush,
};

/** ハシワタリ：角島大橋の ように まっすぐ のびた 白い つばさの 海鳥。青みどりの 海の しぶき（カゼ） */
const hashiwatari: MonsterDesign = {
  size: 32,
  colors: hashiColors,
  rim: { [NQ.paper]: NQ.cloud, [NQ.aqua]: NQ.teal },
  layers: [
    // まっすぐ のびた つばさ（橋の ような 白い 一直線）
    {
      mirror: true,
      y: 12,
      rows: ['.PPPPPPPPPPPPPPP', '.PPPPPPPPPPPPPPP', '.CCCPPPPPPPPPPPP', '..PPPPPPPPPPPPPP'],
    },
    // からだ
    {
      mirror: true,
      y: 8,
      rows: [
        '..........PPPPPP',
        '........PPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPWWPPP',
        '.......PPPPWoPPP',
        '.......PPPPWoPPP',
        '.......PppPPPPoP',
        '.......PPPPPPPPo',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '........PPPPPPPP',
        '........PPPPPPPP',
        '.........PPPPPPP',
        '.........PPPPPPP',
        '..........PPPPPP',
        '..........PPPPPP',
        '...........PPPPP',
        '...........PPPPP',
        '..........YY....',
        '..........YY....',
      ],
    },
    // くちばし
    { x: 15, y: 14, rows: ['YY', 'YY'] },
    // 海の しぶき
    { x: 1, y: 23, rows: ['.AA', 'A..', '.AA'] },
    { x: 27, y: 21, rows: ['AA.', '..A', 'AA.'] },
  ],
};

/** オオハシワタリ（ハシワタリの しんか）：もっと 長い つばさと 青みどりの すじ、きりっと した まゆ（カゼ） */
const oohashiwatari: MonsterDesign = {
  size: 32,
  colors: hashiColors,
  rim: { [NQ.paper]: NQ.cloud, [NQ.aqua]: NQ.teal },
  layers: [
    // 長い つばさ（2 だん）
    {
      mirror: true,
      y: 10,
      rows: [
        '.PPPPPPPPPPPPPPP',
        '.PPPPPPPPPPPPPPP',
        '.AAAAPPPPPPPPPPP',
        '.PPPPPPPPPPPPPPP',
        '.TTTPPPPPPPPPPPP',
        '..PPPPPPPPPPPPPP',
        '...PPPPPPPPPPPPP',
      ],
    },
    {
      mirror: true,
      y: 6,
      rows: [
        '..........PPPPPP',
        '........PPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPoooPPP',
        '.......PPPPPPoPP',
        '.......PPPPWWPPP',
        '.......PPPPWoPPP',
        '.......PPPPWoPPP',
        '.......PppPPPPoP',
        '.......PPPPPPPPo',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '........PPPPPPPP',
        '........PPPPPPPP',
        '.........PPPPPPP',
        '.........PPPPPPP',
        '..........PPPPPP',
        '..........PPPPPP',
        '...........PPPPP',
        '...........PPPPP',
        '..........YY....',
        '..........YY....',
      ],
    },
    // くちばし
    { x: 15, y: 13, rows: ['YY', 'YY', 'YY'] },
    // 海の しぶき
    { x: 1, y: 22, rows: ['.AA', 'A..', '.AA'] },
    { x: 27, y: 19, rows: ['AA.', '..A', 'AA.'] },
  ],
};

export const YAMAGUCHI: Readonly<Record<string, MonsterDesign>> = {
  'yamaguchi-pukufuku': pukufuku,
  'yamaguchi-kanmon-fuku': kanmonFuku,
  'yamaguchi-nanabaken': nanabaken,
  'yamaguchi-noborigaman': noborigaman,
  'yamaguchi-natsumikan-bushi': natsumikanBushi,
  'yamaguchi-mikan-daimyo': mikanDaimyo,
  'yamaguchi-hashiwatari': hashiwatari,
  'yamaguchi-oohashiwatari': oohashiwatari,
  'yamaguchi-midboss-kintai-shirohebi': kintaiShirohebi,
  'yamaguchi-midboss-kintai-shirohebi.field': kintaiShirohebiField,
  'yamaguchi-boss-akiyoshi-daiou': akiyoshiDaiou,
  'yamaguchi-boss-akiyoshi-daiou.p0': akiyoshiDaiouP0,
  'yamaguchi-lastboss-yoshida-shoin': yoshidaShoin,
};
