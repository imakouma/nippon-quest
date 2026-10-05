/** 広島県の モンスター（手描き。docs/06 §4・§6.3〜6.5 の 規格） */
import { NQ } from '../palette';
import type { Layer, MonsterDesign } from './design';
import { BEARD_FACE, HELMET, lord } from './lastbosses';

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

/** カサネヤキン：生地・キャベツ・そば・たまご・ソースを かさねた 広島の お好み焼き。ソースに マヨネーズと 青のり、頭に 炎、手に コテ（ヒノ） */
const kasaneyakinColors = {
  V: NQ.vermilion,
  G: NQ.gold,
  B: NQ.brown,
  T: NQ.tan,
  l: NQ.leaf,
  Y: NQ.yellow,
  L: NQ.lime,
  E: NQ.beige,
  W: NQ.white,
  p: NQ.blush,
};
const kasaneyakin: MonsterDesign = {
  size: 32,
  colors: kasaneyakinColors,
  rim: { [NQ.yellow]: NQ.ochre, [NQ.lime]: NQ.leaf },
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
        '...........BBBBB',
        '........BBBBlBBB',
        '......BBBWBBBWBB',
        '.....BlBWBWBWBWB',
        '.....BBWBBlWBBBW',
        '.....YBBYYBBYYBB',
        '.....YYYYYYYYYYY',
        '.....YYYYYWWYYYY',
        '.....YYYYYWoYYYY',
        '.....YYYYYWoYYoY',
        '.....YYYppYYYYYo',
        '.....YYYYYYYYYYY',
        '.....TTTTTTTTTTT',
        '.....TBTTTBTTTBT',
        '.....TTTBTTTBTTT',
        '.....LLLLLLLLLLL',
        '.....LlLLLlLLLlL',
        '.....LLLlLLLlLLL',
        '.....EEEEEEEEEEE',
        '......EEEEEEEEEE',
        '........EEEEEEEE',
        '.........BBB....',
        '........BBBB....',
      ],
    },
    // 頭の 炎（まん中が 大きい）
    {
      mirror: true,
      y: 2,
      rows: [
        '...............G',
        '..............VG',
        '..........G..VGG',
        '.........VG..VGV',
        '.........VGV..VV',
        '..........V.....',
      ],
    },
    // 左うで
    { x: 3, y: 15, rows: ['.YY', 'YYY', 'YY.'] },
    // 右手に コテ（お好み焼きを 食べる 小さな へら）
    {
      x: 27,
      y: 5,
      rows: ['.WWW', '.WWW', '.WWW', '..T.', '..T.', '..T.', '..T.', '..T.', '..T.', '..T.', '.YYY', 'YYY.'],
    },
  ],
};

/** カキガラン：だんだんに かさなった かきの から（上は ふた、下は うつわ）。黒い ふちの 身に 顔。かきいかだに のる（ミズ） */
const kakigaran: MonsterDesign = {
  size: 32,
  colors: {
    S: NQ.silver,
    G: NQ.gray,
    W: NQ.white,
    N: NQ.slate,
    E: NQ.beige,
    p: NQ.blush,
    A: NQ.azure,
    T: NQ.tan,
    B: NQ.brown,
  },
  rim: { [NQ.silver]: NQ.gray, [NQ.beige]: NQ.sand, [NQ.azure]: NQ.blue, [NQ.tan]: NQ.brown },
  layers: [
    // ぷっくりした 身（黒い ひだの ふち）と、ごつごつの から（下の うつわ）
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
        '...........EEEEE',
        '........EEEEEEEE',
        '.......EEEEEEEEE',
        '......EEEEEEEEEE',
        '.....EEEEEEEEEEE',
        '..A..EEEEEWWEEEE',
        '.AAAEEEEEEWoEEEE',
        '.AAAEEEEEEWoEEoE',
        '..AAEEEEppEEEEEo',
        '....EEEEEEEEEEEE',
        '...NENNENNNENNEN',
        '..SNWSNNSWNNNSWN',
        '..SSSSSSSSSSSSSS',
        '..SGGSSSGGGSSSSG',
        '...SSSSSSSSSSSSS',
        '...SSGGGSSSSGGGS',
        '....SSSSSSSSSSSS',
        '.....SSGGSSSSGGS',
        '.......SSSSSSSSS',
        '..TTTTTTTTTTTTTT',
        '..TTTBTTTTTBTTTT',
        '..TTTTTTTTTTTTTT',
      ],
    },
    // うえの から（ぼうしの ように かぶる）
    {
      mirror: true,
      y: 2,
      rows: [
        '.............WWW',
        '..........WWWSSS',
        '........WWSSSSSS',
        '.......WSSGGGSSS',
        '......WSSSSSSGGG',
        '.....SSGGGSSSSSS',
        '.....SSSSSSGGGSS',
        '....NSNNSNNNSNNS',
      ],
    },
  ],
};

/** セトレモン：瀬戸内の おひさまを あびた レモン。上と 下が とがった 形、つぶつぶの 皮、葉っぱ、金の わっか（ヒカリ） */
const setolemon: MonsterDesign = {
  size: 32,
  colors: {
    Y: NQ.yellow,
    Q: NQ.ochre,
    C: NQ.cream,
    W: NQ.white,
    p: NQ.blush,
    L: NQ.leaf,
    g: NQ.green,
    G: NQ.gold,
  },
  rim: { [NQ.yellow]: NQ.ochre, [NQ.leaf]: NQ.green },
  layers: [
    // わっか
    { mirror: true, y: 1, rows: ['............GGGG', '...........G....', '............QQQQ'] },
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '..............YY',
        '.............YYY',
        '..........YYYYYY',
        '........YYYYYYYY',
        '.......YYCCYYYYY',
        '......YYCYYYYYYY',
        '.....YYCYYYYQYYY',
        '.....YYYYYYYYYYY',
        '....YYYYYYYYYYYY',
        '....YYYYYYWWYYYY',
        '..YYYYQYYYWoYYYY',
        '..YYYYYYYYWoYYoY',
        '...YYYYYppYYYYYo',
        '....YYYYYYYYYYYY',
        '....YYYYYYYYYQYY',
        '....YYQYYYYYYYYY',
        '.....YYYYYYQYYYY',
        '.....YYYYYYYYYYY',
        '......YYYYYYYYYY',
        '.......YYYYYYYYY',
        '........YYYYYYYY',
        '..........YYYYYY',
        '.............YYY',
        '..............YY',
      ],
    },
    // へたと 葉っぱ（右上へ）
    { x: 16, y: 3, rows: ['.....LLL.', '....LLLLL', '..ggLLLL.', '.g.......'] },
  ],
};

// ───────────────────────── しんか ─────────────────────────

/** テッパンダブル（カサネヤキンの しんか）：そばを 2 玉に した 高い お好み焼き。はちまき・りょう手に コテ・大きな 炎（ヒノ） */
const teppanDouble: MonsterDesign = {
  size: 32,
  colors: kasaneyakinColors,
  rim: { [NQ.yellow]: NQ.ochre, [NQ.lime]: NQ.leaf },
  layers: [
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '................',
        '................',
        '................',
        '..........BBBBBB',
        '........BBBBBBBB',
        '......BBBBBlBBBB',
        '.....BBBBWBBBWBB',
        '....BBBBWBWBWBWB',
        '....BlBWBBlWBBBW',
        '....YBBYBBYYYBBY',
        '....WWWWWWWWWWWW',
        '....WWWWWWWWWWWW',
        '....YYYYYYYYYYYY',
        '....YYYYYoYYYYYY',
        '....YYYYYYooYYYY',
        '....YYYYYYWWYYYY',
        '....YYYYYYWoYYYY',
        '....YYYYYYWoYYoY',
        '....YYYppYYYYYoo',
        '....YYYYYYYYYYYY',
        '....TTTTTTTTTTTT',
        '....TBTTTBTTTBTT',
        '....TTTBTTTBTTTB',
        '....TBTTTBTTTBTT',
        '....LLLLLLLLLLLL',
        '....LlLLLlLLLlLL',
        '....EEEEEEEEEEEE',
        '.....EEEEEEEEEEE',
        '.......BBBB.....',
      ],
    },
    {
      mirror: true,
      y: 1,
      rows: [
        '...............G',
        '........G.....VG',
        '.......VG....VGG',
        '.......VGV...VGV',
        '......VGGV..VVGV',
        '.......VV.....V.',
      ],
    },
    // りょう手の コテ
    {
      mirror: true,
      y: 4,
      rows: [
        '.WWW',
        '.WWW',
        '.WWW',
        '..T.',
        '..T.',
        '..T.',
        '..T.',
        '..T.',
        '..T.',
        '..T.',
        '..T.',
        '..T.',
        '..T.',
        '..T.',
        '.YYY',
      ],
    },
  ],
};

/** カキガラドン（カキガランの しんか）：なんまいも かさなった かきがらの よろい。とがった からの かざり・かたの から・大きな ひれ・波（ミズ） */
const kakigaraDon: MonsterDesign = {
  size: 32,
  colors: {
    S: NQ.silver,
    G: NQ.gray,
    W: NQ.white,
    N: NQ.slate,
    E: NQ.beige,
    p: NQ.blush,
    A: NQ.azure,
    K: NQ.sky,
    I: NQ.ice,
  },
  rim: { [NQ.silver]: NQ.gray, [NQ.beige]: NQ.sand, [NQ.azure]: NQ.blue },
  layers: [
    // 大きな 身・かたの から・下の から・波
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
        '...........EEEEE',
        '........EEEEEEEE',
        '.......EEEEEEEEE',
        '..WWS.EEEEEEEEEE',
        '.WSSSSEEEooEEEEE',
        '.SGGSSEEEEEooEEE',
        '.SSSSSEEEEEWWEEE',
        '.SGGSSEEEEEWoEEE',
        '.SSSSSEEEEEWoEoE',
        '..AAAEEEppEEEEoo',
        '.AAAAEEEEEEEEEEE',
        '.AAAANENNENNNENN',
        '..AASNWSNNSWNNSW',
        '...SSSSSSSSSSSSS',
        '...SGGSSSGGGSSSS',
        '...SSSSSSSSSSSSS',
        '....SSGGGSSSSGGG',
        '.....SSSSSSSSSSS',
        '......SSGGSSSSGG',
        '........SSSSSSSS',
        '..KKKIIKKKKKIIKK',
        '.KAAKKKAAKKKKAAK',
        '.AAAAAAAAAAAAAAA',
      ],
    },
    // うえの から（とがった ひだが 立つ）
    {
      mirror: true,
      rows: [
        '................',
        '.........W....W.',
        '.........WS..WSS',
        '......W..SSWSSSS',
        '.....WSWSSSSGSSS',
        '....WSSGGGSSSSGG',
        '...WSSSSSSGGGSSS',
        '...SSGGGSSSSSSSS',
        '...SSSSSSSGGGSSS',
        '...NSNNSNNNSNNSN',
      ],
    },
  ],
};

/** 光の とげ（左右対称）。O = 光、L = 先っぽ。真上（gap より 内がわ）には 出さない */
function rays(
  size: number,
  cy: number,
  rIn: number,
  rOut: number,
  n: number,
  bottom: number,
  gap = 0,
): string[] {
  const cx = (size - 1) / 2;
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => {
      const d = Math.hypot(x - cx, y - cy);
      const a = Math.abs(Math.atan2(x - cx, cy - y));
      const u = (a / ((2 * Math.PI) / n)) % 1;
      const r = a < gap ? 0 : rIn + (rOut - rIn) * (1 - 2 * Math.min(u, 1 - u));
      if (d > r || y > bottom || x < 1 || y < 1 || x > size - 2) return '.';
      return d > r - 2 ? 'L' : 'O';
    }).join(''),
  );
}

const TAIYO_BODY = [
  '..............YY',
  '.............YYY',
  '..........YYYYYY',
  '........YYYYYYYY',
  '.......YYCCYYYYY',
  '......YYCYYYYYYY',
  '.....YYCYYYYQYYY',
  '.....YYYYYYYYYYY',
  '....YYYYYYoYYYYY',
  '....YYYYYYYooYYY',
  '....YYYYYYWWYYYY',
  '....YYYQYYWoYYYY',
  '....YYYYYYWoYYoY',
  '....YYYYppYYYYoo',
  '....YYYYYYYYYYYY',
  '....YYQYYYYYYQYY',
  '.....YYYYYYYYYYY',
  '.....YYYYYQYYYYY',
  '......YYYYYYYYYY',
  '.......YYYYYYYYY',
  '.........YYYYYYY',
  '............YYYY',
  '..............YY',
];

/** タイヨウレモン（セトレモンの しんか）：おひさまの ような だいだいの 光を せおった レモン。白い レモンの 花と 2 まいの 葉（ヒカリ） */
const taiyoLemon: MonsterDesign = {
  size: 32,
  colors: {
    Y: NQ.yellow,
    Q: NQ.ochre,
    C: NQ.cream,
    O: NQ.orange,
    L: NQ.gold,
    W: NQ.white,
    p: NQ.blush,
    F: NQ.leaf,
    g: NQ.green,
    P: NQ.paper,
  },
  rim: { [NQ.yellow]: NQ.ochre, [NQ.leaf]: NQ.green },
  layers: [
    { rows: rays(32, 17, 9, 16, 10, 27, 0.5) },
    ...inked(TAIYO_BODY, 0, 7, true),
    // 2 まいの 葉と 白い 花
    ...inked(['.........FF.....', '........FFFF..PP', '.........FFFgPWW', '...........FFgPP'], 0, 3, true),
    // うで（おひさまに むかって あげる）
    { mirror: true, y: 14, rows: ['..YY', '..YY', '...Y'] },
  ],
};

// ───────────────────────── 中ボス ─────────────────────────

const fudeColors = {
  N: NQ.night,
  P: NQ.paper,
  V: NQ.violet,
  L: NQ.lavender,
  D: NQ.denim,
  n: NQ.navy,
  G: NQ.gold,
  Q: NQ.ochre,
  R: NQ.red,
  T: NQ.tan,
};

/**
 * フデダイショウ（中ボス）：熊野筆の 大将。キャンバスいっぱいの 大きな すがた。
 * 頭は すみを ふくんだ とがった 筆の 毛、細く するどい 金の 目、
 * 大きく はった かみしもの かた、赤い 帯、せの たけほどの 大きな 筆（ヤミ）
 */
const fudeDaisho: MonsterDesign = {
  size: 40,
  colors: fudeColors,
  rim: { [NQ.violet]: NQ.indigo, [NQ.paper]: NQ.cloud, [NQ.tan]: NQ.brown, [NQ.denim]: NQ.navy },
  rimDepth: 2,
  layers: [
    // 筆の 毛の 頭（先は すみで まっ黒）と 顔
    {
      mirror: true,
      y: 1,
      rows: [
        '...................N',
        '..................NN',
        '..................NN',
        '.................NNN',
        '.................NNN',
        '................NNNN',
        '...............NNNNN',
        '..............NNNNPN',
        '.............NNNPNNP',
        '............NNPNNPNN',
        '...........NPPNPPNPP',
        '..........NPLPPPLPPP',
        '.........PPLPPPLPPPP',
        '........PPPPPPPPPPPP',
        '.......PPPPPPPPPPPPP',
        '......PPPPPPPPPPPPPP',
        '......PPPPPPPPPPPPPP',
        '......PPPPPPPoooPPPP',
        '......PPPPPPGGGGoPPP',
        '......PPPPPPGGGGoPPP',
        '......PPPPPPGGGooPPP',
        '......PPPPPPPPPPPPPP',
        '......PPPPPPPPPPPPoo',
        '.......PPPPPPPPPPPPP',
      ],
    },
    // 王冠（おでこ）
    ...inked(['..G..G', '..GGGG', '..GGGR', '..QQQQ'], 14, 14, true),
    // かみしもの 大きな かた・赤い 帯・はかま
    {
      mirror: true,
      y: 25,
      rows: [
        '.LLLLLLLLLLLLLLVGGGG',
        '.VVVVVVVVVVVVVVVVVPP',
        '..VVVVVVVVVVVVVVVVVP',
        '...VVVVVVVVVVVVVVVVV',
        '.....VVVVVVVVVVVVVVV',
        '......RRRRRRRRRRRRRR',
        '......RRRRRRRRRRRRRR',
        '......DDDDDDDDDDDDDD',
        '.....DDDDDDDnDDDDDDD',
        '.....DDDDDDnDDDDDDDD',
        '....DDDDDDnDDDDDDDDD',
        '....DDDDDDDDDDDD....',
        '...NNNNNNNNNNNN.....',
      ],
    },
    // 左の こぶし（こしに あてる）
    { x: 2, y: 30, rows: ['..VV', '.VVV', 'PPVV', 'PPPV', '.PP.'] },
    // せの たけほどの 大きな 筆（右手で つえの ように もつ。先は すみ）
    ...inked(
      [
        '.RR.',
        'R..R',
        '.RR.',
        '.TT.',
        '.TT.',
        '.nn.',
        '.TT.',
        '.TT.',
        '.TT.',
        '.TT.',
        '.nn.',
        '.TT.',
        '.TT.',
        '.TT.',
        '.TT.',
        '.nn.',
        '.TT.',
        '.TT.',
        '.TT.',
        '.TT.',
        'GGGG',
        'QQQQ',
        'PPPP',
        'PPPP',
        'PLPP',
        'PPPP',
        '.PN.',
        '.NN.',
        '.N..',
      ],
      34,
      4,
    ),
    // 右手（筆を にぎる）
    ...inked(['.PPP', 'PPPP', '.PP.'], 33, 27),
    // とびちる すみ
    { x: 1, y: 9, rows: ['.N.', 'N.N', '.N.'] },
    { x: 2, y: 20, rows: ['N.', '.N'] },
    { x: 36, y: 1, rows: ['.N.', 'N.N', '.N.'] },
  ],
};

/** フデダイショウ（フィールドに 立つ 32×32） */
const fudeDaishoField: MonsterDesign = {
  size: 32,
  colors: {
    N: NQ.night,
    P: NQ.paper,
    V: NQ.violet,
    D: NQ.denim,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    T: NQ.tan,
  },
  rim: { [NQ.violet]: NQ.indigo, [NQ.paper]: NQ.cloud },
  layers: [
    {
      mirror: true,
      y: 1,
      rows: [
        '...............N',
        '..............NN',
        '.............NNN',
        '............NNNN',
        '...........NNNNN',
        '..........NNNNPN',
        '.........NNPNNPN',
        '........NPPNPPNP',
        '.......PPVPPPVPP',
        '......PPPPPPPPPP',
        '......PPPPPPPPPP',
        '......PPPPoooPPP',
        '......PPPGGGoPPP',
        '......PPPGGGoPPP',
        '......PPPGGooPPP',
        '......PPPPPPPPPP',
        '......PPPPPPPPoo',
        '.......PPPPPPPPP',
      ],
    },
    ...inked(['..G..G', '..GGGG', '..GGGR', '..QQQQ'], 10, 9, true),
    {
      mirror: true,
      y: 19,
      rows: [
        '.VVVVVVVVVVVVGGG',
        '.VVVVVVVVVVVVVPP',
        '..VVVVVVVVVVVVVP',
        '...VVVVVVVVVVVVV',
        '....RRRRRRRRRRRR',
        '....RRRRRRRRRRRR',
        '....DDDDDDDDDDDD',
        '...DDDDDDDDDDDDD',
        '...DDDDDDDDDDDDD',
        '...DDDDDDDDDD...',
        '..NNNNNNNNNN....',
      ],
    },
    ...inked(
      [
        '.TT.',
        '.TT.',
        '.NN.',
        '.TT.',
        '.TT.',
        '.TT.',
        '.NN.',
        '.TT.',
        '.TT.',
        'GGGG',
        'PPPP',
        'PPPP',
        '.PN.',
        '.N..',
      ],
      27,
      13,
    ),
    ...inked(['.PP', 'PPP'], 26, 20),
  ],
};

// ───────────────────────── 県ボス ─────────────────────────

/** もみじの 葉（7×7）。R 赤、V 光、r すじ */
const MOMIJI = ['...R...', 'R..V..R', 'RV.V.VR', '.RVrVR.', 'RRRrRRR', '.R.r.R.', '...r...'];

/** たてがみの もみじ（左半分の 位置） */
const MANE_AT: readonly [number, number][] = [
  [4, 2],
  [1, 9],
  [8, 9],
  [2, 16],
];

const RYU_HEAD = [
  '................AAAAAAAA',
  '...............AAAAAAAAA',
  '..............AASSAAAAAA',
  '..............ASAAAAAAAA',
  '..............AAoAAAAAAA',
  '..............AAAooAAAAA',
  '..............AAoooAAAAA',
  '..............AAGGGoAAAA',
  '..............AAGGGoAAAA',
  '..............AAGGooAAAA',
  '...............AAAAAAKKK',
  '...............AAAAKKKKK',
  '................AAKKKoKK',
  '................AAKKKKKK',
  '.................AKKKKKK',
  '.................AKooooo',
  '.................AKKWKKK',
  '..................AKKKKK',
];

const RYU_BODY = [
  '...............AAAAAAAAA',
  '..............AAAAAIIIII',
  '.............AAAAAAIIIII',
  '............AABAAAAKKKKK',
  '............AAAAAAAIIIII',
  '............ABAAAAAIIIII',
  '............AAAAAAAKKKKK',
  '............AAABAAAIIIII',
  '.............AAAAAAIIIII',
  '.............ABAAAAKKKKK',
  '....AAAAAAAA.AAAAAAIIIII',
  '..AAAABAAABAAAAAAAAIIIII',
  '.AAABAAABAAAABAAAAAAAAAA',
  '.AAIIIIIIIIIIAAAAABAAABA',
  '.AIIIIIIIIIIIIIAAAAAAAAA',
  '.AAKKKKKKKKKKKKAABAAABAA',
  '..AAAAAAAAAAAAAAAAAAAAAA',
  '...AAABAAABAAABAAAABAAAA',
  '....AAAAAAAAAAAAAAAAAAAA',
  '...WWKKWWWKKKWWWKKWWWKKW',
  '..KKAAKKKAAAKKKAAAKKKAAA',
];

const RYU_ARM = [
  '..W.W....',
  '..WAW.W..',
  '.AAAAAW..',
  '.AAAAAA..',
  '..AAAA...',
  '..AAAA...',
  '..AAAA...',
  '..AAAAA..',
  '...AAAAA.',
  '....AAAAA',
  '.....AAAA',
];

const RYU_HORN = [
  '......G.................',
  '.....GG.......G.........',
  '.....GG......GG.........',
  '......GG....GG..........',
  '.......GG..GG...........',
  '........GGGG............',
  '.........GGG............',
  '..........GG............',
  '..........GG............',
];

const ryuLayers = (mane: Layer[], extra: Layer[] = []): Layer[] => [
  ...mane,
  ...inked(RYU_BODY, 0, 25, true),
  ...inked(RYU_ARM, 3, 19, true),
  ...inked(RYU_HORN, 0, 1, true),
  ...inked(RYU_HEAD, 0, 7, true),
  // 王冠（角の あいだ）
  ...inked(['....G..G', '....GGGG', '....GGGJ', '....QQQQ'], 16, 3, true),
  // ひげ（ながれる）
  {
    mirror: true,
    y: 19,
    rows: ['..............KK', '.............K..', '...........KK...', '..........K.....'],
  },
  // うろこの つや（左上）
  { x: 15, y: 9, rows: ['SS', 'S.'] },
  ...extra,
];

const ryuColors = {
  A: NQ.azure,
  B: NQ.blue,
  K: NQ.sky,
  I: NQ.ice,
  W: NQ.white,
  S: NQ.ice,
  R: NQ.red,
  V: NQ.vermilion,
  r: NQ.brick,
  G: NQ.gold,
  Q: NQ.ochre,
  J: NQ.red,
};

/** モミジリュウ（県ボス）：三段峡の 淵に すむ 青い 竜。もみじの たてがみ・金の 角・つめ・とぐろ（ミズ） */
const momijiRyu: MonsterDesign = {
  size: 48,
  colors: ryuColors,
  rim: { [NQ.azure]: NQ.blue, [NQ.red]: NQ.brick, [NQ.gold]: NQ.ochre },
  rimDepth: 2,
  layers: ryuLayers(MANE_AT.flatMap(([x, y]) => inked(MOMIJI, x, y, true))),
};

/** モミジリュウ 後半（モリ）：たてがみが だいだいと 金に もえる もみじに なり、目が 光り、もみじの あらしが まう */
const momijiRyuP0: MonsterDesign = {
  ...momijiRyu,
  colors: { ...ryuColors, R: NQ.orange, V: NQ.cream, r: NQ.vermilion, W: NQ.cream },
  rim: { [NQ.azure]: NQ.blue, [NQ.orange]: NQ.amber, [NQ.gold]: NQ.ochre },
  layers: ryuLayers(
    MANE_AT.flatMap(([x, y]) => inked(MOMIJI, x, y, true)),
    [
      // まう もみじ
      ...inked(['.R.', 'RVR', '.r.'], 2, 29),
      ...inked(['.R.', 'RVR', '.r.'], 43, 25),
      ...inked(['.R.', 'RVR', '.r.'], 41, 35),
      ...inked(['.R.', 'RVR', '.r.'], 4, 37),
      ...inked(['.R.', 'RVR', '.r.'], 10, 1),
      ...inked(['.R.', 'RVR', '.r.'], 35, 1),
    ],
  ),
};

// ───────────────────────── 裏ステージ ─────────────────────────

/** 毛利元就：「三本の 矢」を 赤い ひもで たばねた 金の 前立て、みどりの よろい、白い ひげ（カゼ） */
const mouriMotonari = lord(
  [
    '.........YY............Y',
    '.........YYYY.........YY',
    '..........YYYG.......YYY',
    '............GG.........G',
    '.............GG........G',
    '..............GG.......G',
    '...............GG.....WG',
    '................WW....WG',
    '.................WWRRRRR',
    '...............NNNNNRRRR',
    ...HELMET,
    ...BEARD_FACE,
  ],
  {
    N: NQ.night,
    L: NQ.slate,
    K: NQ.green,
    S: NQ.leaf,
    G: NQ.gold,
    Y: NQ.yellow,
    R: NQ.red,
    T: NQ.forest,
    H: NQ.bark,
    M: NQ.silver,
  },
  { [NQ.leaf]: NQ.green },
  [
    // 高く かかげた 軍配（ぐんばい）
    ...inked(
      [
        '.GGGGG.',
        'GRRRRRG',
        'GRRRRRG',
        'GRRRRRG',
        'GRRRRRG',
        '.GGGGG.',
        '...M...',
        '...M...',
        '...M...',
        '...M...',
        '...M...',
        '...M...',
      ],
      38,
      3,
    ),
    ...inked(['.FFF', 'FFFF', '.FF.'], 38, 15),
    { x: 39, y: 18, rows: ['KKK', 'KKK', 'KKK', 'KKK', 'KKK', 'KKK', 'KKK'] },
    // 金の 光の つぶ
    { x: 2, y: 6, rows: ['.Y.', 'YGY', '.Y.'] },
    { x: 33, y: 22, rows: ['.Y.', 'YGY', '.Y.'] },
  ],
);

// ───────────────────────── 帝釈峡の カメ ─────────────────────────

const kameColors = {
  S: NQ.silver,
  C: NQ.cloud,
  G: NQ.gray,
  T: NQ.tan,
  L: NQ.leaf,
  W: NQ.white,
  p: NQ.blush,
};

/** イワバシガメ：帝釈峡の 石の 橋「雄橋」の かけらを こうらに した カメ。石の アーチと こけ（ツチ） */
const iwabashigame: MonsterDesign = {
  size: 32,
  colors: kameColors,
  rim: { [NQ.silver]: NQ.gray, [NQ.tan]: NQ.brown, [NQ.leaf]: NQ.green },
  layers: [
    // からだ・顔
    {
      mirror: true,
      y: 13,
      rows: [
        '.......TTTTTTTTT',
        '......TTTTTTTTTT',
        '.....TTTTTTTTTTT',
        '....TTTTTTTTTTTT',
        '....TTTTTTTTTTTT',
        '....TTTTTWWTTTTT',
        '....TTTTTWoTTTTT',
        '....TTTTTWoTTTTo',
        '....TTTppTTTTTTo',
        '....TTTTTTTTTTTT',
        '....TTTTTTTTTTTT',
        '.....TTTTTTTTTTT',
        '.....TTTTTTTTTTT',
        '......TTTTTTTTTT',
        '.......TTTTTTTTT',
        '....TTTT..TTTTTT',
        '....TTTT..TTTT..',
      ],
    },
    // 石の アーチの こうら
    {
      mirror: true,
      y: 1,
      rows: [
        '..........SSSSSS',
        '........SSSSSSSS',
        '.......SSSSSSSSS',
        '......SSCCCCCCCC',
        '......SCSSSSSSSS',
        '.....SCSSSSSSSSS',
        '.....SCSSSSGSSSS',
        '.....SSSSSSSSSSS',
        '.....SSSGSSSSSSS',
        '.....SSSSSSSSSSS',
        '......SSSSSSSSSS',
        '.......SSSSSSSSS',
      ],
    },
    // こけ
    { x: 6, y: 4, rows: ['.LL', 'LLL'] },
    { x: 11, y: 2, rows: ['LL'] },
  ],
};

/** オンバシガメ（イワバシガメの しんか）：こうらが 大きな 石の 橋に なった カメ。きりっと した まゆ（ツチ） */
const onbashigame: MonsterDesign = {
  size: 32,
  colors: kameColors,
  rim: { [NQ.silver]: NQ.gray, [NQ.tan]: NQ.brown, [NQ.leaf]: NQ.green },
  layers: [
    {
      mirror: true,
      y: 14,
      rows: [
        '......TTTTTTTTTT',
        '.....TTTTTTTTTTT',
        '...TTTTTTTTTTTTT',
        '...TTTTToooTTTTT',
        '...TTTTTTTToTTTT',
        '...TTTTTTWWTTTTT',
        '...TTTTTTWoTTTTT',
        '...TTTTTTWoTTTTo',
        '...TTTppTTTTTTTo',
        '...TTTTTTTTTTTTT',
        '...TTTTTTTTTTTTT',
        '...TTTTTTTTTTTTT',
        '....TTTTTTTTTTTT',
        '.....TTTTTTTTTTT',
        '...TTTT...TTTTTT',
        '...TTTT...TTTT..',
      ],
    },
    {
      mirror: true,
      y: 1,
      rows: [
        '........SSSSSSSS',
        '......SSSSSSSSSS',
        '.....SSSCCCCCCCC',
        '....SSCSSSSSSSSS',
        '....SCSSSSSSSSSS',
        '...SCSSSSSSGSSSS',
        '...SCSSSSSSSSSSS',
        '...SSSSSSSSSSSSS',
        '...SSSGSSSSSSSSS',
        '...SSSSSSSSSSSSS',
        '...SSSSSSSSSGSSS',
        '...SSSSSSSSSSSSS',
        '....SSSSSSSSSSSS',
        '.....SSSSSSSSSSS',
      ],
    },
    // こけ
    { x: 4, y: 3, rows: ['.LL', 'LLL'] },
    { x: 9, y: 1, rows: ['LL.', '.LL'] },
    // ふとい うで
    { x: 1, y: 22, rows: ['..TT', '.TTT', 'TTTT', 'TTT.'] },
  ],
};

export const HIROSHIMA: Readonly<Record<string, MonsterDesign>> = {
  'hiroshima-kasaneyakin': kasaneyakin,
  'hiroshima-teppan-double': teppanDouble,
  'hiroshima-kakigaran': kakigaran,
  'hiroshima-kakigara-don': kakigaraDon,
  'hiroshima-setolemon': setolemon,
  'hiroshima-taiyo-lemon': taiyoLemon,
  'hiroshima-iwabashigame': iwabashigame,
  'hiroshima-onbashigame': onbashigame,
  'hiroshima-midboss-fude-daisho': fudeDaisho,
  'hiroshima-midboss-fude-daisho.field': fudeDaishoField,
  'hiroshima-boss-momiji-ryu': momijiRyu,
  'hiroshima-boss-momiji-ryu.p0': momijiRyuP0,
  'hiroshima-lastboss-mouri-motonari': mouriMotonari,
};
