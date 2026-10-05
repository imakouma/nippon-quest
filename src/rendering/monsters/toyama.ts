/** 富山県の モンスター（手描き。docs/06 §4・§6.3〜6.5 の 規格） */
import { NQ } from '../palette';
import type { MonsterDesign } from './design';
import { FACE, HELMET, lord } from './lastbosses';

// ───────────────────────── 通常 ─────────────────────────

/** チューリポン：砺波の 赤い チューリップ。花の カップが 顔、葉の うで、球根の 足（モリ） */
const tulipon: MonsterDesign = {
  size: 32,
  colors: {
    R: NQ.red,
    r: NQ.brick,
    A: NQ.apricot,
    G: NQ.leaf,
    L: NQ.lime,
    T: NQ.tan,
    t: NQ.sand,
    B: NQ.brown,
    W: NQ.white,
    p: NQ.blush,
  },
  rim: { [NQ.red]: NQ.brick, [NQ.leaf]: NQ.green, [NQ.tan]: NQ.brown },
  layers: [
    // 葉（左右の うで）
    {
      mirror: true,
      y: 12,
      rows: [
        '...L............',
        '...LL...........',
        '...GLL..........',
        '....GLL.........',
        '....GGLL........',
        '.....GGLL.......',
        '......GGLLL.....',
        '.......GGGLLLL..',
        '.........GGGGGGG',
      ],
    },
    // 花の カップ・くき・球根・根っこ
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '................',
        '...............R',
        '.......R......RR',
        '.......RR....RRR',
        '.......RRR..RRRR',
        '.......RRRRRRRRR',
        '......RRRRRRRRRR',
        '......RRRRRRRRRR',
        '......RRRRRRRRRR',
        '......RRRRRRRRRR',
        '......RRRRRRRRRR',
        '......RRRRRRRRRR',
        '......RRRRRRRRRR',
        '.......RRRRRRRRR',
        '.......RRRRRRRRR',
        '........RRRRRRRR',
        '.........RRRRRRR',
        '...........RRRRR',
        '..............GG',
        '..............GG',
        '..............GG',
        '..............GG',
        '............TTTT',
        '..........TTTTTT',
        '.........TTTTTTT',
        '.........TTTTTTT',
        '..........TTTTTT',
        '...........B..B.',
        '..........B..B..',
      ],
    },
    // 花びらの かさなり（上の ほう）
    { mirror: true, y: 7, rows: ['..........r', '..........r', '...........r'] },
    // つや（左の 花びら）・球根の つや
    { x: 7, y: 5, rows: ['.A', 'A.', 'A.', 'A.', 'A.'] },
    { x: 10, y: 25, rows: ['.t', 't.'] },
    // かお
    {
      mirror: true,
      y: 11,
      rows: [
        '..........WW....',
        '..........Wo....',
        '..........Wo....',
        '........pp....o.',
        '...............o',
      ],
    },
  ],
};

/** ピッカイカ：富山湾で 青く 光る ホタルイカ。三角の ひれ、大きな 目、うでの 先が 光る。頭の 上に 金の わ（ヒカリ） */
const pikkaIka: MonsterDesign = {
  size: 32,
  colors: {
    B: NQ.blue,
    A: NQ.azure,
    S: NQ.sky,
    I: NQ.ice,
    W: NQ.white,
    Y: NQ.gold,
    Q: NQ.ochre,
    p: NQ.blush,
  },
  rim: { [NQ.blue]: NQ.navy },
  layers: [
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '............YYYY',
        '...........Y....',
        '............QQQQ',
        '..............BB',
        '.............BBB',
        '............BBBB',
        '...........BBBBB',
        '........BBBBBBBB',
        '.......BBBBBBBBB',
        '......BBBBBBBBBB',
        '.......BBBBBBBBB',
        '.........BBBBBBB',
        '..........BBBBBB',
        '..........BBBBBB',
        '..........BBBBBB',
        '.........BBBBBBB',
        '........BBBBBBBB',
        '........BBBBBBBB',
        '........BBBBBBBB',
        '........BBBBBBBB',
        '.........BBBBBBB',
        '........BB.BB.BB',
        '.......BB.BB..BB',
        '......BB..BB..BB',
        '......BB.BB...BB',
        '.....SS..BB...BB',
        '.....II..SS...SS',
        '.........II...II',
      ],
    },
    // 光る つぶ
    {
      mirror: true,
      y: 8,
      rows: [
        '..........S.....',
        '................',
        '........S...S...',
        '................',
        '...........S....',
        '................',
        '............S...',
      ],
    },
    // つや（ひれの 左上）
    { x: 7, y: 10, rows: ['.A', 'AA'] },
    { x: 12, y: 7, rows: ['A'] },
    // かお
    {
      mirror: true,
      y: 17,
      rows: [
        '..........WW....',
        '..........Wo....',
        '..........Wo....',
        '.........p......',
        '..............oo',
      ],
    },
  ],
};

/** オコジョン：立山の 岩の あいだに すむ オコジョ（夏の 茶色い 毛）。すっと 立ちあがって まわりを 見る。足もとに 風（カゼ） */
const okojon: MonsterDesign = {
  size: 32,
  colors: {
    T: NQ.tan,
    E: NQ.beige,
    W: NQ.white,
    p: NQ.blush,
    k: NQ.bark,
    M: NQ.mint,
    A: NQ.aqua,
  },
  rim: { [NQ.tan]: NQ.brown, [NQ.beige]: NQ.sand },
  layers: [
    // しっぽ（右。先は 黒い）
    {
      x: 22,
      y: 7,
      rows: [
        '....kk..',
        '...kkkk.',
        '...kTTk.',
        '...TTTT.',
        '..TTTT..',
        '..TTT...',
        '.TTTT...',
        '.TTT....',
        'TTTT....',
        'TTT.....',
        'TT......',
      ],
    },
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '................',
        '................',
        '.........TT.....',
        '........TEET....',
        '........TEETTTTT',
        '.........TTTTTTT',
        '........TTTTTTTT',
        '.......TTTTTTTTT',
        '.......TTTTTTTTT',
        '.......TTTTTTTTT',
        '.......TTTTTTTTT',
        '.......TTTTTTEEE',
        '........TTTEEEEE',
        '.........TEEEEEE',
        '..........EEEEEE',
        '..........TEEEEE',
        '.........TTEEEEE',
        '.........TTEEEEE',
        '.........TTEEEEE',
        '.........TTEEEEE',
        '.........TTEEEEE',
        '.........TTEEEEE',
        '.........TTTEEEE',
        '.........TTTEEEE',
        '..........TTTEEE',
        '..........TTTTTT',
        '..........TTT...',
        '.........EEEE...',
        '.........EEEE...',
      ],
    },
    // 前足（むねの 前で そろえる）
    { mirror: true, y: 18, rows: ['............TT..', '............TT..'] },
    // かお
    {
      mirror: true,
      y: 10,
      rows: [
        '...........WW...',
        '...........Wo...',
        '.........p.Wo...',
        '...............o',
        '..............o.',
      ],
    },
    // 風
    { x: 1, y: 21, rows: ['.MMM.', 'M....', 'M..MM', '.MMA.', '.....', '..AMM'] },
    { x: 26, y: 26, rows: ['MMM.', '...M', 'AMM.'] },
  ],
};

/** マスズシン：まるい わっぱの ます寿司。上に ますの 切り身、よこに 笹の 葉（ミズ） */
const masuzushin: MonsterDesign = {
  size: 32,
  colors: {
    E: NQ.beige,
    T: NQ.tan,
    S: NQ.sand,
    B: NQ.brown,
    P: NQ.blush,
    b: NQ.berry,
    G: NQ.leaf,
    g: NQ.green,
    W: NQ.white,
    p: NQ.blush,
  },
  rim: { [NQ.beige]: NQ.sand, [NQ.tan]: NQ.brown, [NQ.leaf]: NQ.green },
  layers: [
    // 笹の 葉（左右）
    {
      mirror: true,
      y: 12,
      rows: [
        '..G.............',
        '.GGG............',
        '.GgGG...........',
        '..GgGG..........',
        '...GgGG.........',
        '....GGG.........',
      ],
    },
    // わっぱの からだ
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '..........TTTTTT',
        '........TTTTTTTT',
        '.......TTTTTTTTT',
        '......TTTTTTTTTT',
        '......TTTTTTTTTT',
        '.....TTTTTTTTTTT',
        '.....EEEEEEEEEEE',
        '....EEEEEEEEEEEE',
        '....EEEEEEEEEEEE',
        '....EEEEEEEEEEEE',
        '....EEEEEEEEEEEE',
        '....EEEEEEEEEEEE',
        '....EEEEEEEEEEEE',
        '....EEEEEEEEEEEE',
        '....EEEEEEEEEEEE',
        '.....EEEEEEEEEEE',
        '.....EEEEEEEEEEE',
        '......EEEEEEEEEE',
        '......TTTTTTTTTT',
        '.......TTTTTTTTT',
        '........TTTTTTTT',
        '..........TTTTTT',
        '................',
        '.........BBB....',
        '.........BBB....',
      ],
    },
    // ますの 切り身（上の 面）
    {
      mirror: true,
      y: 7,
      rows: [
        '........PPPPPPPP',
        '.......PPPPPPPPP',
        '......PPPPPPPPPP',
        '......PbPPbPPbPP',
        '.....PPPPPPPPPPP',
      ],
    },
    // かお
    {
      mirror: true,
      y: 16,
      rows: [
        '..........WW....',
        '..........Wo....',
        '..........Wo....',
        '........pp......',
        '.............ooo',
      ],
    },
    { x: 7, y: 14, rows: ['.S', 'S.'] },
  ],
};

/** オオマスズシ（マスズシンの しんか）：二だんに かさねた 大きな ます寿司。なわで むすび、笹の 葉が 大きい（ミズ） */
const ooMasuzushi: MonsterDesign = {
  size: 32,
  colors: {
    E: NQ.beige,
    T: NQ.tan,
    S: NQ.sand,
    B: NQ.brown,
    P: NQ.blush,
    b: NQ.berry,
    G: NQ.leaf,
    g: NQ.green,
    W: NQ.white,
    p: NQ.blush,
  },
  rim: { [NQ.beige]: NQ.sand, [NQ.tan]: NQ.brown, [NQ.leaf]: NQ.green },
  layers: [
    // 大きな 笹の 葉
    {
      mirror: true,
      y: 9,
      rows: [
        '..G.............',
        '.GGG............',
        '.GgGG...........',
        '..GgGG..........',
        '...GgGG.........',
        '....GgGG........',
        '.....GGGG.......',
        '......GGG.......',
      ],
    },
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '................',
        '................',
        '.........TTTTTTT',
        '.......TTTTTTTTT',
        '......TTTTTTTTTT',
        '.....TTTTTTTTTTT',
        '.....EEEEEEEEEEE',
        '....EEEEEEEEEEEE',
        '....EEEEEEEEEEEE',
        '....EEEEEEEEEEEE',
        '....TTTTTTTTTTTT',
        '...TTTTTTTTTTTTT',
        '...EEEEEEEEEEEEE',
        '...EEEEEEEEEEEEE',
        '...EEEEEEEEEEEEE',
        '...EEEEEEEEEEEEE',
        '...EEEEEEEEEEEEE',
        '...EEEEEEEEEEEEE',
        '...EEEEEEEEEEEEE',
        '...EEEEEEEEEEEEE',
        '....EEEEEEEEEEEE',
        '....EEEEEEEEEEEE',
        '.....EEEEEEEEEEE',
        '.....TTTTTTTTTTT',
        '......TTTTTTTTTT',
        '.......TTTTTTTTT',
        '.........TTTTTTT',
        '........BBB.....',
        '........BBB.....',
      ],
    },
    // 上の だんの ますの 切り身
    { mirror: true, y: 5, rows: ['.......PPPPPPPPP', '......PPPPPPPPPP', '.....PbPPbPPbPPP'] },
    // むすんだ なわ
    { mirror: true, y: 20, rows: ['...SBSSBSSBSSBSS'] },
    // かお（きりっと）
    {
      mirror: true,
      y: 14,
      rows: [
        '.........o......',
        '..........oo....',
        '..........WW....',
        '..........Wo....',
        '..........Wo....',
        '........pp......',
        '............oooo',
      ],
    },
    { x: 5, y: 10, rows: ['.S', 'S.'] },
  ],
};

// ───────────────────────── しんか ─────────────────────────

/** マンカイチューリ（チューリポンの しんか）：大きく ひらいた 赤い チューリップ。葉の 先に 白と 黄色の 小さな チューリップ（モリ） */
const mankaiChuri: MonsterDesign = {
  size: 32,
  colors: {
    R: NQ.red,
    r: NQ.brick,
    Y: NQ.yellow,
    P: NQ.paper,
    G: NQ.leaf,
    L: NQ.lime,
    T: NQ.tan,
    W: NQ.white,
    p: NQ.blush,
  },
  rim: { [NQ.red]: NQ.brick, [NQ.leaf]: NQ.green, [NQ.tan]: NQ.brown },
  layers: [
    // 大きな 葉
    {
      mirror: true,
      y: 11,
      rows: [
        '..L.............',
        '..LL............',
        '..GLL...........',
        '..GLLL..........',
        '...GLLL.........',
        '...GGLLL........',
        '....GGLLL.......',
        '.....GGLLLL.....',
        '......GGGLLLLL..',
        '........GGGGGGGG',
      ],
    },
    // ひらいた 花・くき・球根
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '....R......R....',
        '....RR....RRR...',
        '.....RR..RRYRR.R',
        '.....RRRRRYYYRRR',
        '.....RRRRYYYYRRR',
        '....RRRRRRYYRRRR',
        '....RRRRRRRRRRRR',
        '....RRRRRRRRRRRR',
        '....RRRRRRRRRRRR',
        '....RRRRRRRRRRRR',
        '....RRRRRRRRRRRR',
        '.....RRRRRRRRRRR',
        '.....RRRRRRRRRRR',
        '......RRRRRRRRRR',
        '.......RRRRRRRRR',
        '.........RRRRRRR',
        '...........RRRRR',
        '..............GG',
        '..............GG',
        '..............GG',
        '..............GG',
        '............TTTT',
        '..........TTTTTT',
        '.........TTTTTTT',
        '.........TTTTTTT',
        '..........TTTTTT',
        '..........T..T..',
        '.........TT.TT..',
      ],
    },
    // 花びらの かさなり
    { mirror: true, y: 6, rows: ['........r', '.........r', '.........r', '..........r'] },
    // 葉の 先の 小さな チューリップ（左は 白、右は 黄色）
    { x: 1, y: 6, rows: ['P.P', 'PPP', 'PPP', '.P.'] },
    { x: 28, y: 6, rows: ['Y.Y', 'YYY', 'YYY', '.Y.'] },
    // かお（きりっと）
    {
      mirror: true,
      y: 10,
      rows: [
        '.........o......',
        '..........oo....',
        '..........WW....',
        '..........Wo....',
        '..........Wo....',
        '........pp....o.',
        '...............o',
      ],
    },
    { x: 6, y: 4, rows: ['.p', 'p.'] },
  ],
};

/** ギンガイカ（ピッカイカの しんか）：天の川の ように 光の つぶが ならぶ 大きな ホタルイカ。長い しょく手を ひろげる（ヒカリ） */
const gingaIka: MonsterDesign = {
  size: 32,
  colors: {
    B: NQ.blue,
    A: NQ.azure,
    S: NQ.sky,
    I: NQ.ice,
    W: NQ.white,
    Y: NQ.gold,
    Q: NQ.ochre,
    C: NQ.cream,
    p: NQ.blush,
  },
  rim: { [NQ.blue]: NQ.navy },
  layers: [
    {
      mirror: true,
      rows: [
        '................',
        '............YYYY',
        '...........Y....',
        '............QQQQ',
        '.............BBB',
        '...........BBBBB',
        '.........BBBBBBB',
        '.....BBBBBBBBBBB',
        '...BBBBBBBBBBBBB',
        '..BBBBBBBBBBBBBB',
        '...BBBBBBBBBBBBB',
        '.....BBBBBBBBBBB',
        '.......BBBBBBBBB',
        '.........BBBBBBB',
        '.........BBBBBBB',
        '........BBBBBBBB',
        '.......BBBBBBBBB',
        '.......BBBBBBBBB',
        '.......BBBBBBBBB',
        '.......BBBBBBBBB',
        '........BBBBBBBB',
        '...BB..BB.BB.BBB',
        '..BB..BB.BB..BBB',
        '.BB..BB..BB..BBB',
        '.BB..BB.BB...BBB',
        '.SS..BB.BB...BBB',
        '.II..SS.SS...BBB',
        '.....II.II...SSS',
        '.............III',
      ],
    },
    // 天の川の ような 光の つぶ（ななめの 帯）
    {
      rows: [
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................',
        '.....................I..........',
        '...................S...S........',
        '.....I..........S...W...S.......',
        '........S....S...S........S.....',
        '.......S...W...S................',
        '.........S...S..................',
        '...........S....................',
      ],
    },
    // つや
    { x: 5, y: 8, rows: ['.AA', 'AA.'] },
    // かお（きりっと）
    {
      mirror: true,
      y: 14,
      rows: [
        '.........o......',
        '..........oo....',
        '..........WW....',
        '..........Wo....',
        '..........Wo....',
        '........p.......',
        '..............oo',
      ],
    },
    // まわりの 星
    { x: 1, y: 2, rows: ['.C.', 'CWC', '.C.'] },
    { x: 28, y: 4, rows: ['.C.', 'CWC', '.C.'] },
  ],
};

/** フブキオコジョ（オコジョンの しんか）：冬の まっ白な 毛、しっぽの 先だけ 黒い。まわりに ふぶきの うず（カゼ） */
const fubukiOkojo: MonsterDesign = {
  size: 32,
  colors: {
    P: NQ.paper,
    W: NQ.white,
    p: NQ.blush,
    k: NQ.night,
    M: NQ.mint,
    A: NQ.aqua,
    I: NQ.ice,
    S: NQ.sky,
  },
  rim: { [NQ.paper]: NQ.cloud, [NQ.mint]: NQ.aqua },
  layers: [
    // ふぶきの うず（うしろ）
    {
      rows: [
        '................................',
        '................................',
        '..MMMM....................MMMM..',
        '.M....M..................M....M.',
        '.M..M.M..................M.M..M.',
        '.M...M....................M...M.',
        '..MM........................MM..',
      ],
    },
    // しっぽ（右。先は 黒い）
    {
      x: 22,
      y: 4,
      rows: [
        '....kk..',
        '...kkkk.',
        '...kPPk.',
        '...PPPP.',
        '..PPPP..',
        '..PPP...',
        '.PPPP...',
        '.PPP....',
        'PPPP....',
        'PPP.....',
        'PP......',
      ],
    },
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '................',
        '.........PP.....',
        '........PSSP....',
        '........PSSPPPPP',
        '.........PPPPPPP',
        '........PPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '........PPPPPPPP',
        '.........PPPPPPP',
        '.........PPPPPPP',
        '........PPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '........PPPPPPPP',
        '........PPPPPPPP',
        '.........PPPPPPP',
        '.........PPPPPPP',
        '.........PPP....',
        '........PPPP....',
        '........PPPP....',
      ],
    },
    // 前足（こぶしを かまえる）
    { mirror: true, y: 17, rows: ['....PP.......', '...PPPP......', '...PPPP......'] },
    // かお（きりっと。黒い 目に 光）
    {
      mirror: true,
      y: 8,
      rows: [
        '.........oo.....',
        '...........oo...',
        '...........Wo...',
        '...........oo...',
        '.........p.oo...',
        '...............o',
        '..............o.',
      ],
    },
    // 足もとの 雪と 風
    { x: 1, y: 24, rows: ['.MM..', 'M..M.', '.I..M', '..MM.'] },
    { x: 26, y: 23, rows: ['..MM.', '.M..M', 'M..I.', '.MM..'] },
    { x: 3, y: 12, rows: ['.I.', 'IWI', '.I.'] },
    { x: 27, y: 15, rows: ['.I.', 'IWI', '.I.'] },
  ],
};

// ───────────────────────── 中ボス ─────────────────────────

const gabuColors = {
  R: NQ.red,
  A: NQ.apricot,
  Y: NQ.gold,
  Q: NQ.ochre,
  K: NQ.night,
  W: NQ.white,
  G: NQ.leaf,
  g: NQ.green,
  b: NQ.berry,
  N: NQ.navy,
  p: NQ.blush,
};

/** ガブジシ（中ボス）：井波彫刻の 獅子頭。赤い うるしの 大きな 頭、金の まゆ、黒い 毛、大きな 口と 歯、唐草の 布。王冠（ヒノ） */
const gabujishi: MonsterDesign = {
  size: 40,
  colors: gabuColors,
  rim: { [NQ.red]: NQ.brick, [NQ.leaf]: NQ.green, [NQ.gold]: NQ.ochre },
  rimDepth: 2,
  layers: [
    // 唐草の 布（頭の うしろから 下へ）
    {
      mirror: true,
      y: 20,
      rows: [
        '..GG................',
        '.GGGG...............',
        '.GGGGG..............',
        '.GGWGGG.............',
        '.GWGWGGGGGGGGGGGGGGG',
        '.GGWWGGGGWWGGGGGGWWG',
        '..GGGGGGWGGWGGGGWGGW',
        '..GGGGGGGWWGGGGGGWWG',
        '..GGWWGGGGGGGGWWGGGG',
        '...WGGWGGGGGGWGGWGGG',
        '...GWWGGGGGGGGWWGGGG',
        '....GGGGGGGGGGGGGGGG',
        '.....GGGGGGGGGGGGGGG',
        '.......GGGGGGGGGGGGG',
        '..........NNN..GGGGG',
        '..........NNN.......',
        '..........NNN.......',
        '.........WWWW.......',
      ],
    },
    // 金の つの（左右）
    {
      mirror: true,
      rows: [
        '....................',
        '....YY..............',
        '....YYY.............',
        '...QYYY.............',
        '...QQYY.............',
        '....QYY.............',
        '.....YY.............',
      ],
    },
    // 頭（黒い 毛・赤い 頭・金の 耳・まゆ・大きな 口）
    {
      mirror: true,
      rows: [
        '....................',
        '....................',
        '.........KK.KK......',
        '.......KKKKKKKKKKKKK',
        '.....KKKKKKKKKKKKKKK',
        '...KKKKKKKKKKKKKKKKK',
        '..KKKKKKKKKKKKKKKKKK',
        '..KKKKRRRRRRRRRRRRRR',
        '.KKKKRRRRRRRRRRRRRRR',
        '.KKKYRRRRRRRRRRRRRRR',
        '.KKYYRRYYYYRRRRRRRRR',
        '.KKYYRYRRRRYRRRRRRRR',
        '.KKYRRRWWoRRRRRRRRRR',
        '.KKRRRRWWoRRRRRRARRR',
        '.KKRRRRWWoRRRRRAARRR',
        '.KKRRRRWooRRRRRAARRR',
        '.KRRRRRRRRRRRRRRAARR',
        '.KRRRRRRRRRRRRRRRoRR',
        '..RRRRRRRRRRRRRRRRRR',
        '..RRRWWoWWoWWoWWoWWW',
        '..RRRobbbbbbbbbbbbbb',
        '..RRRobbbbbbbbbbbbbb',
        '..RRRWWoWWoWWoWWoWWW',
        '..RRRRRRRRRRRRRRRRRR',
        '...RRRRRRRRRRRRRRRRR',
        '....RRRRRRRRRRRRRRRR',
        '......RRRRRRRRRRRRRR',
      ],
    },
    // 王冠
    {
      mirror: true,
      rows: ['....................', '................Y..Y', '................YYYR', '................QQQQ'],
    },
    // つや と 足もとの ほのお
    { x: 7, y: 8, rows: ['.AA', 'A..'] },
    { x: 1, y: 30, rows: ['.A.', 'ARA', 'ARA', '.A.'] },
    { x: 36, y: 32, rows: ['.A.', 'ARA', '.A.'] },
  ],
};

/** ガブジシ（フィールドに立つ 32×32） */
const gabujishiField: MonsterDesign = {
  size: 32,
  colors: {
    R: NQ.red,
    Y: NQ.gold,
    Q: NQ.ochre,
    K: NQ.night,
    W: NQ.white,
    G: NQ.leaf,
    b: NQ.berry,
    N: NQ.navy,
    A: NQ.apricot,
  },
  rim: { [NQ.red]: NQ.brick, [NQ.leaf]: NQ.green },
  layers: [
    {
      mirror: true,
      y: 17,
      rows: [
        '..GG............',
        '.GGGG...........',
        '.GWGGGGGGGGGGGGG',
        '.GGWGGGGWGGGGGWG',
        '..GGGGGWGWGGGWGW',
        '..GWGGGGGGGGGGGG',
        '...GWGGGGGGGGGGG',
        '....GGGGGGGGGGGG',
        '......GGGGGGGGGG',
        '.........NN..GGG',
        '.........NN.....',
        '.........NN.....',
        '........WWW.....',
      ],
    },
    {
      mirror: true,
      rows: [
        '................',
        '............Y..Y',
        '............YYYR',
        '.......KK.K.QQQQ',
        '.....KKKKKKKKKKK',
        '....KKKKKKKKKKKK',
        '...KRRRRRRRRRRRR',
        '..YKRRRRRRRRRRRR',
        '..YRRYYYRRRRRRRR',
        '...RRRRRRWRRRRRR',
        '...RRRRRRWoRRRAA',
        '...RRRRRRooRRRRR',
        '...RRRRRRRRRRRoR',
        '...RRRRRRRRRRRRR',
        '..RRRWWoWWoWWoWW',
        '..RRRobbbbbbbbbb',
        '..RRRWWoWWoWWoWW',
        '..RRRRRRRRRRRRRR',
        '....RRRRRRRRRRRR',
      ],
    },
  ],
};

// ───────────────────────── 県ボス ─────────────────────────

/**
 * 立山の 王：まん中の 山が 頭（王冠）、左右の 山が かた。s/g = 岩（左の 面が 明るい）、W/c = 雪、
 * n = 黒部峡谷の 深い 谷（むね）、A/S = 谷の 川と 称名滝（右の かた）、L/G = ハイマツ
 */
const TATEYAMA = [
  '................................................',
  '...................Y...YY...Y...................',
  '...................YY.YYYY.YY...................',
  '...................YYYYYYYYYY...................',
  '...................YYYYRRYYYY...................',
  '...................YYYYRRYYYY...................',
  '...................QQQQQQQQQQ...................',
  '.....................IWWccc.....................',
  '........W............WWWccc............W........',
  '.......WWc..........WWWWcccc..........WWc.......',
  '.......WWc..........WWWWcccc..........WWc.......',
  '......IWWcc........WWWWWccccc........WWWcc......',
  '......WWWcc.......WWWWWWcccccc.......WWWcc......',
  '.....WWWWccc......ssWWsgccggcc......WWWWccc.....',
  '.....WssWcgg....nnnssssggggggnnn....WWsgccg.....',
  '....ssssggggg....ssnnssggggnngg....ssssggggg....',
  '....ssssggggg...ssWWossggggoWWgg...ssssggggg....',
  '...sssssgggggg..ssWWossggggoWWgg..sssssgggggg...',
  '...sssssggggggssssWWossggggoWWggggssssSISWggg...',
  '..ssssssggggggssssWoossggggooWggggssssSISIgggg..',
  '..ssssssggggggsssssssssgggggggggggssssSISIgggg..',
  '.sssssssggggKssssssosssgggggoggggggKssSISWggggg.',
  '.sssssssgggggKssssssooooooooggggggKsssSISIggggg.',
  '.sssssssggggsKsssssssWsgggWgggggggKgssSISIggggg.',
  '.ssssLGsggggKssssssssssggggggggggggKssSISWLGggg.',
  '.sssLGGGgggssssssssssnnnnnnggggggggggsSISIGGGgg.',
  '.sssssssggssssssssLGsnnnnnnggLGgggggggSISIggggg.',
  '.sssssssgggggggggLGGGnnnnnngLGGGssssssSISWggggg.',
  '..sssgggggssssssgggggnnnnnngggggggggggSISIgggg..',
  '..ssKgggggssLGssggggggnnnnggggggggggggSISIgKgg..',
  '..sssKggggsLGGGsggggggnnnngggggggLGgggSISWKggg..',
  '..sssKggggssssssggggggnnnnggggggLGGGgggSISIggg..',
  '.sssggggggssssssggggggnnnngggggggggggggSISIgggg.',
  '.sssggggggsssssLGggggggnnggggggggggggggSISWgggg.',
  '.sssggggggssssLGGGgggggAAgggggLGgggggggSISIgggg.',
  '.sssggggggssssssgggggggAAggggLGGGggggggSISIgggg.',
  '.sssggggggssssssgggggggAAggggggggggggggSISWgggg.',
  '.ssKggKggKssssssgggggggSSgggggggggggggKSISIgKgg.',
  '..........ssssssggggggSAASgggggggggggg.SISI.....',
  '............sssgggggg......gggggggggW..SWSW.W...',
  '............sssgggggg......ggggggggg.SIWIWIS....',
  '............sssgggggg......ggggggggg............',
  '............sssgggggg......ggggggggg............',
  '............sssgggggg......ggggggggg............',
  '............sssgggggg......ggggggggg............',
  '............sssgggggg......ggggggggg............',
  '...........KKKKKKKKKKK....KKKKKKKKKKK...........',
  '................................................',
];

const tateyamaColors = {
  Y: NQ.gold,
  Q: NQ.ochre,
  R: NQ.red,
  W: NQ.white,
  c: NQ.cloud,
  I: NQ.ice,
  n: NQ.night,
  s: NQ.silver,
  g: NQ.gray,
  K: NQ.slate,
  L: NQ.leaf,
  G: NQ.green,
  S: NQ.sky,
  A: NQ.azure,
};

/** まるい 光（うしろの 朝日） */
function disc(size: number, cx: number, cy: number, r: number, ch: string, rim: string): string[] {
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => {
      const d = Math.hypot(x - cx, y - cy);
      if (d > r || x < 1 || y < 1 || x > size - 2 || y > size - 2) return '.';
      return d > r - 2 ? rim : ch;
    }).join(''),
  );
}

/** タテヤマオウ（県ボス）：立山の 三つの 山が 目を さました 岩と 雪の 王。むねに 黒部峡谷、右の かたから 称名滝（ツチ） */
const tateyamaOu: MonsterDesign = {
  size: 48,
  colors: tateyamaColors,
  rim: { [NQ.gray]: NQ.slate, [NQ.silver]: NQ.gray },
  rimDepth: 2,
  layers: [{ rows: TATEYAMA }],
};

/** タテヤマオウ 後半：朝日が のぼり、山の 雪が あかね色に そまる（モルゲンロート）。目が 光る */
const tateyamaOuP0: MonsterDesign = {
  ...tateyamaOu,
  colors: { ...tateyamaColors, W: NQ.cream, c: NQ.apricot, I: NQ.cream, O: NQ.orange },
  layers: [{ rows: disc(48, 23.5, 12, 14, 'O', 'Y') }, { rows: TATEYAMA }],
};

// ───────────────────────── ラスボス ─────────────────────────

/** 黒母衣（うしろに ふくらむ 大きな 布。佐々成政は 織田信長の 黒母衣衆の ひとり） */
const HORO = [
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '..........nnnn..........',
  '.......nnnnnnnnn........',
  '.....nnnnnnnnnnnn.......',
  '....nnnhnnnnnnnnn.......',
  '...nnnhnnnnnnnnnn.......',
  '..nnnhnnnnnnnnnnn.......',
  '..nnhnnnnnnnnnnnn.......',
  '.nnnhnnnnnnnnnnn........',
  '.nnhnnnnnnnnnnnn........',
  '.nnhnnnnnnnnnnnn........',
  '.nnhnnnnnnnnnnnn........',
  '.nnnhnnnnnnnnnnn........',
  '.nnnhnnnnnnnnnnn........',
  '..nnnhnnnnnnnnnn........',
  '..nnnnhnnnnnnnnn........',
  '...nnnnnnnnnnnnn........',
  '....nnnnnnnnnnnn........',
  '.....nnnnnnnnnnn........',
  '.......nnnnnnnnn........',
];

/** 佐々成政：立山の 三つの 山の 前立て、青い よろい、うしろに 黒母衣、かたに 雪（ミズ） */
const narimasaBody = lord(
  [
    '.......................G',
    '......................GG',
    '.....................GYG',
    '...............G....GYGG',
    '..............GG...GYGGG',
    '.............GYG..GYGGGG',
    '............GYGG.GYGGGGG',
    '...........GGGGGGGGGGGGG',
    '...........GGGGGGGGGGGGG',
    '...............NNGGGGGGG',
    ...HELMET,
    ...FACE,
  ],
  {
    N: NQ.navy,
    L: NQ.denim,
    K: NQ.denim,
    S: NQ.ice,
    G: NQ.gold,
    Y: NQ.yellow,
    R: NQ.red,
    T: NQ.navy,
    H: NQ.slate,
    n: NQ.night,
    h: NQ.gray,
  },
  { [NQ.ice]: NQ.sky },
  [
    // かたと かぶとに つもった 雪
    { mirror: true, y: 24, rows: ['...WWWWWWW..............', '..WWWWWWWWW.............'] },
    // ふってくる 雪
    { x: 2, y: 3, rows: ['.W.', 'WWW', '.W.'] },
    { x: 43, y: 12, rows: ['.W.', 'WWW', '.W.'] },
    { x: 41, y: 2, rows: ['W'] },
  ],
);

const sassaNarimasa: MonsterDesign = {
  ...narimasaBody,
  layers: [{ mirror: true, rows: HORO }, ...narimasaBody.layers],
};

export const TOYAMA: Readonly<Record<string, MonsterDesign>> = {
  'toyama-tulipon': tulipon,
  'toyama-mankai-churi': mankaiChuri,
  'toyama-pikka-ika': pikkaIka,
  'toyama-ginga-ika': gingaIka,
  'toyama-okojon': okojon,
  'toyama-fubuki-okojo': fubukiOkojo,
  'toyama-masuzushin': masuzushin,
  'toyama-oo-masuzushi': ooMasuzushi,
  'toyama-midboss-gabujishi': gabujishi,
  'toyama-midboss-gabujishi.field': gabujishiField,
  'toyama-boss-tateyama-ou': tateyamaOu,
  'toyama-boss-tateyama-ou.p0': tateyamaOuP0,
  'toyama-lastboss-sassa-narimasa': sassaNarimasa,
};
