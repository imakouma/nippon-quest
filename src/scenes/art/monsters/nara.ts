/** 奈良県の モンスター（手描き。docs/06 §4・§6.3〜6.5 の 規格） */
import { NQ } from '../palette';
import type { MonsterDesign } from './design';
import { ARMOR, SKIN } from './lastbosses';

/** ハッパズシ：柿の 葉で つつんだ おすし。上が ひらいて ごはんと さけが 見える。葉の すじ と おった 葉の はし（モリ） */
const happazushi: MonsterDesign = {
  size: 32,
  colors: {
    E: NQ.leaf,
    G: NQ.green,
    M: NQ.lime,
    W: NQ.white,
    c: NQ.cloud,
    A: NQ.apricot,
    p: NQ.blush,
  },
  rim: { [NQ.leaf]: NQ.green, [NQ.apricot]: NQ.vermilion },
  layers: [
    {
      mirror: true,
      y: 5,
      rows: [
        '..EE............',
        '..EME...........',
        '...EEE..........',
        '....EEEAAAAAAAAA',
        '....EEEAWAAAWAAA',
        '....EEEWWWWWWWWW',
        '....EEEcWWWWWWWW',
        '....EEEEEEEEEEEE',
        '...EEEEEEEEEEEEE',
        '...EMEEEEEEEEEEE',
        '...EEEEEEEEWWEEE',
        '...EEEEEEEEWoEEE',
        '...EEEEEEEEWoEEE',
        '...EEEEEEEpEEEoE',
        '...EEEEEEEEEEEEo',
        '...EEEEEEEEEEEEM',
        '...EEEEEEEEEMEEM',
        '...EEEEEEEEEEMEM',
        '...EEEEEEEEEEEMM',
        '...EEEEEEEEEMEEM',
        '....EEEEEEEEEMEM',
        '.....EEEEEEEEEMM',
        '.......EEEEEEEEM',
        '.........GG.....',
        '........GGG.....',
      ],
    },
  ],
};

/** ハッパズシヤグラ：ハッパズシの しんか。柿の 葉ずしを 3 だん つみかさねた やぐら。てっぺんに 大きな 柿の 実、葉の 手（モリ） */
const happazushiYagura: MonsterDesign = {
  size: 32,
  colors: {
    E: NQ.leaf,
    G: NQ.green,
    M: NQ.lime,
    W: NQ.white,
    A: NQ.apricot,
    p: NQ.blush,
    O: NQ.orange,
    Y: NQ.yellow,
    K: NQ.bark,
  },
  rim: { [NQ.leaf]: NQ.green, [NQ.orange]: NQ.amber, [NQ.apricot]: NQ.vermilion },
  layers: [
    // 柿の 実（へたの 葉が 4 まい）
    {
      mirror: true,
      y: 1,
      rows: [
        '...............K',
        '..........GG.GGG',
        '.........OGGGGGG',
        '........OOOOOOOO',
        '.......OOOOOOOOO',
        '.......OOOOOOOOO',
        '........OOOOOOOO',
      ],
    },
    // 3 だんの 柿の 葉ずし（まん中の だんに 顔）
    {
      mirror: true,
      y: 8,
      rows: [
        '.......EEEWWWWWW',
        '.......EEAAWAAAA',
        '.......EEEEEEEEE',
        '.......EEEEEEEEE',
        '.......GGGGGGGGG',
        '....EEEEWWWWWWWW',
        '....EEEEEEEEEEEE',
        '....EEEEEEoooEEE',
        '....EEEEEEEWoEEE',
        '....EEEEEEEWoEEE',
        '....EEEEEEEWoEEE',
        '....EEEEEEpEEEoo',
        '....EEEEEEEEEEEE',
        '....GGGGGGGGGGGG',
        '..EEEEWWWWWWWWWW',
        '..EEEEAAWAAAAWAA',
        '..EEEEEEEEEEEEEE',
        '..EEEEEEEEEEEEEM',
        '..EEEEEEEEEEEMEM',
        '..EEEEEEEEEEEEMM',
        '..EEEEEEEEEEEEEM',
        '...GGGGGGGGGGGGG',
        '.....GG....GG...',
      ],
    },
    // 葉の 手
    { mirror: true, y: 15, rows: ['..EE', '.EME', '..EE'] },
    // つや
    { x: 11, y: 5, rows: ['YY', 'Y.'] },
    { x: 5, y: 14, rows: ['M'] },
  ],
};

/** スミノスケ：奈良墨の モンスター。黒い 墨の からだに 金の おびと 雲の もよう、とがった 耳、金の 目、足もとに 墨の 水たまり（ヤミ） */
const suminosuke: MonsterDesign = {
  size: 32,
  colors: {
    N: NQ.night,
    D: NQ.indigo,
    V: NQ.violet,
    L: NQ.lavender,
    G: NQ.gold,
    p: NQ.blush,
  },
  layers: [
    // 足もとの 墨の 水たまり
    { mirror: true, y: 26, rows: ['.....DDDDDDDDDDD', '......DDVDDDDDDD', '........DDDDDDDD'] },
    // 墨の からだ（とがった 耳）
    {
      mirror: true,
      y: 2,
      rows: [
        '.......N........',
        '.......NN.......',
        '.......NDN......',
        '.......NDDN.NNNN',
        '.......NNNNNNNNN',
        '.......NNNNNNNNN',
        '.......NGGGGGGGG',
        '.......NNNNNNNNN',
        '.......NNNNNNNNN',
        '.......NNNNGGNNN',
        '.......NNNNGoNNN',
        '.......NNNNGoNNN',
        '.......NNNpNNNVN',
        '.......NNNNNNNNV',
        '.......NNNNNNNNN',
        '.......NNNNNNNNN',
        '.......NNNNNNNNN',
        '.......NNNNNNNNN',
        '.......NNNNNNNNN',
        '.......NNNNNNNNN',
        '.......NGGGGGGGG',
        '.......NNNNNNNNN',
        '........NNNNNNNN',
        '..........NNNNNN',
      ],
    },
    // 金の 雲の もよう（左下）
    { x: 9, y: 16, rows: ['.GGG.', 'G...G', 'G.G.G', 'G.GG.', '.G...'] },
    // うで
    { mirror: true, y: 15, rows: ['.....DD', '....DD.', '....D..'] },
    // 左の ふちの ひかり
    { x: 7, y: 7, rows: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D'] },
    { x: 8, y: 4, rows: ['L'] },
  ],
};

/** スミリュウ：スミノスケの しんか。墨に きざまれる 竜が とびだした 黒い 竜。金の 角・ひげ・おなか、むらさきの つばさ、筆の ような しっぽ（ヤミ） */
const sumiryu: MonsterDesign = {
  size: 32,
  colors: {
    N: NQ.night,
    D: NQ.indigo,
    V: NQ.violet,
    G: NQ.gold,
    Q: NQ.ochre,
    W: NQ.white,
    p: NQ.blush,
  },
  rim: { [NQ.violet]: NQ.indigo },
  layers: [
    // つばさ（うしろ）
    {
      mirror: true,
      y: 6,
      rows: [
        '.N..............',
        '.NN.............',
        '.NVN............',
        '.NVVN...........',
        '.NVVVN..........',
        '.NVVVVN.........',
        '.NVNVVVN........',
        '.NVVNVVVN.......',
        '..NVVNVVN.......',
        '..NVVVNVN.......',
        '...NVVVNN.......',
        '...N.NVVN.......',
        '.......NN.......',
      ],
    },
    // 頭・からだ・足
    {
      mirror: true,
      y: 4,
      rows: [
        '...........NNNNN',
        '.........NNNNNNN',
        '........NNNNNNNN',
        '.......NNNNNNNNN',
        '.......NNNNGGNNN',
        '.......NNNNGoNNN',
        '.......NNNNGoNNN',
        '.......NNNNNNNNN',
        '........NNNNNNNN',
        '.........NNoNNNN',
        '.........NNNNNNN',
        '.........NNNNWoo',
        '........NNNNNNNN',
        '.......NNNNNQQQQ',
        '......NNNNNNGGGG',
        '......NNNNNQQQQQ',
        '.....WNNNNNNGGGG',
        '......NNNNNQQQQQ',
        '.......NNNNNGGGG',
        '.......NNNNNNNNN',
        '........NNNNNNNN',
        '........NNNNNNN.',
        '.......NNNNN....',
        '.......NNNNN....',
        '......WNWNWN....',
      ],
    },
    // 金の 角
    {
      mirror: true,
      y: 1,
      rows: ['........G.......', '........GG......', '.........GG.....', '..........GG....'],
    },
    // 金の ひげ
    { mirror: true, y: 14, rows: ['....GGG.........', '...G............', '...G............'] },
    // 筆の ような しっぽ（右）
    { x: 23, y: 21, rows: ['.....NN', '....NNN', '...NNN.', '..NNN..', '.NNDN..', 'NNNN...', '.DD....'] },
    // うろこの つや・ほっぺ
    { x: 9, y: 6, rows: ['DD', 'D.'] },
    { x: 11, y: 13, rows: ['p'] },
  ],
};

/** ソウメンツルリ：三輪そうめんの モンスター。ガラスの うつわに 山もりの そうめん、はしで つるりと もちあげた そうめん、色つきの そうめん、ひれ（ミズ） */
const somenTsururi: MonsterDesign = {
  size: 32,
  colors: {
    W: NQ.white,
    c: NQ.cloud,
    S: NQ.sky,
    A: NQ.azure,
    I: NQ.ice,
    p: NQ.blush,
    M: NQ.lime,
    T: NQ.tan,
  },
  rim: { [NQ.sky]: NQ.azure },
  layers: [
    // 山もりの そうめん
    {
      mirror: true,
      y: 8,
      rows: [
        '..........WWWW..',
        '........WWcccWWW',
        '......WWWWWWWWcc',
        '.....ccWWWcccWWW',
        '....WWWWWWWWWWcc',
        '....WcccWWWWcccW',
      ],
    },
    // ガラスの うつわ（ひれの とって）
    {
      mirror: true,
      y: 14,
      rows: [
        '....IIIIIIIIIIII',
        '....SSSSSSSSSSSS',
        '....SSSSSSSSSSSS',
        '.A..SSSSSSSSSSSS',
        '.AA.SSSSSSSWWSSS',
        '.AAASSSSSSSWoSSS',
        '..AASSSSSSSWoSSS',
        '...ASSSSSSpSSSoS',
        '.....SSSSSSSSSSo',
        '.....SSSSSSSSSSS',
        '......SSSSSSSSSS',
        '.......SSSSSSSSS',
        '.........SSSSSSS',
        '..........IIIIII',
        '.........AAAAAAA',
      ],
    },
    // ふちから たれる そうめん
    { mirror: true, y: 14, rows: ['.......W', '.......W', '........W', '........W'] },
    // 色つきの そうめん
    { x: 9, y: 11, rows: ['pp..', '..pp'] },
    { x: 17, y: 12, rows: ['MM.', '..M'] },
    // はしで もちあげた そうめん（右上）
    {
      x: 19,
      y: 1,
      rows: [
        '.......T.T',
        '......T.T.',
        '.....T.T..',
        '....T.T...',
        '...T.T....',
        '..T.T.....',
        '.WTW......',
        '.W.W......',
        '.W.W......',
      ],
    },
    // ガラスの つや
    { x: 6, y: 16, rows: ['I', 'I', 'I'] },
  ],
};

/** ウズマキソウメン：ソウメンツルリの しんか。うずまく 水と いっしょに、そうめんが ねじれて ふきあがる。大きな ひれ・きりっと まゆ（ミズ） */
const uzumakiSomen: MonsterDesign = {
  size: 32,
  colors: {
    W: NQ.white,
    S: NQ.sky,
    A: NQ.azure,
    B: NQ.blue,
    I: NQ.ice,
    p: NQ.blush,
    M: NQ.lime,
  },
  rim: { [NQ.sky]: NQ.azure },
  layers: [
    // ねじれて ふきあがる そうめんと 水
    {
      mirror: true,
      y: 2,
      rows: [
        '..........S..S..',
        '...........SWWS.',
        '..........WWSSWW',
        '...........WWSSW',
        '...........SWWSS',
        '............SWWS',
        '............WSSW',
        '.............WWS',
        '.............SWW',
        '..............SW',
        '..............WS',
        '.............WWW',
      ],
    },
    // 大きな ひれ
    {
      mirror: true,
      y: 13,
      rows: [
        '.A..............',
        '.AA.............',
        '.AAA............',
        '.AASA...........',
        '..ASAA..........',
        '..AAAA..........',
        '...AA...........',
      ],
    },
    // ガラスの うつわ
    {
      mirror: true,
      y: 14,
      rows: [
        '...IIIIIIIIIIIII',
        '...SSSSSSSSSSSSS',
        '...SSSSSSSooSSSS',
        '...SSSSSSSSWoSSS',
        '...SSSSSSSSWoSSS',
        '...SSSSSSSSWoSSS',
        '....SSSSSSpSSSoo',
        '....SSSSSSSSSSSS',
        '.....SSSSSSSSSSS',
        '......SSSSSSSSSS',
        '.......SSSSSSSSS',
        '.........IIIIIII',
        '........BBBBBBBB',
        '.........BBBBBBB',
        '...........BBBBB',
      ],
    },
    // ふちから たれる そうめん
    { mirror: true, y: 14, rows: ['......W', '......W', '.......W', '.......W', '......W'] },
    // 水しぶき
    { x: 3, y: 3, rows: ['.SS', 'S..', 'S.S', '.S.'] },
    { x: 26, y: 3, rows: ['SS.', '..S', 'S.S', '.S.'] },
    // 色つきの そうめん
    { x: 14, y: 6, rows: ['p'] },
    { x: 17, y: 9, rows: ['M'] },
    // ガラスの つや
    { x: 5, y: 16, rows: ['I', 'I', 'I'] },
  ],
};

/**
 * ヒトメセンボン（中ボス）：吉野山の さくらの 精。山のように もりあがる 花の かんむり、太い みき の からだ、
 * 花を つけた えだの うで、根の 足。王冠は 花の いちばん 上（モリ → カゼ）
 */
const hitomeSenbon: MonsterDesign = {
  size: 40,
  colors: {
    P: NQ.blush,
    p: NQ.blush,
    b: NQ.berry,
    W: NQ.white,
    Y: NQ.cream,
    B: NQ.brown,
    K: NQ.bark,
    T: NQ.tan,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
  },
  rim: { [NQ.blush]: NQ.berry, [NQ.brown]: NQ.bark, [NQ.gold]: NQ.ochre },
  rimDepth: 2,
  layers: [
    // えだの うで（花の 手）
    {
      mirror: true,
      y: 15,
      rows: [
        '.PPP................',
        '.PWPP...............',
        '.PPPBB..............',
        '..PPPBB.............',
        '.....BBB............',
        '......BBBB..........',
        '........BBBBB.......',
        '..........BBBB......',
      ],
    },
    // みきの からだ と 根の 足
    {
      mirror: true,
      y: 16,
      rows: [
        '............BBBBBBBB',
        '............BBBBBBBB',
        '...........BBBBBBBBB',
        '...........BBoooBBBB',
        '...........BBBWWoBBB',
        '...........BBBWWoBBB',
        '...........BBBWWoBBB',
        '...........BBBWooBBB',
        '...........BBpBBBBBB',
        '...........BBBBBBBoo',
        '...........BBBBBBBBB',
        '...........BBBBBBBBB',
        '...........BBKBBBBBB',
        '...........BBBKBBBBB',
        '...........BBBBBBBBB',
        '...........BBBBBBBBB',
        '..........BBBBBBBBBB',
        '.........BBBBBB.BBBB',
        '.......BBBBBB.....BB',
        '.....BBBBBB.........',
        '....BBBBB...........',
        '....KKKK............',
      ],
    },
    // 花の かんむり（山もりの さくら）
    {
      mirror: true,
      y: 3,
      rows: [
        '..........PPP...PPPP',
        '.......PPPPPPP.PPPPP',
        '.....PPPPPWPPPPPPPPP',
        '....PPPPWYWPPPPPPPPP',
        '...PPPPPPWPPPPPWPPPP',
        '..PPPPPPPPPPPPWYWPPP',
        '..PPWPPPPPPPPPPWPPPP',
        '.PPWYWPPPPPPPPPPPPPP',
        '.PPPWPPPPPPWPPPPPPPP',
        '.PPPPPPPPPWYWPPPPPPP',
        '..PPPPPPPPPWPPPPPWPP',
        '..PPPPPPPPPPPPPPWYWP',
        '...PPPPPPPPPPPPPPWPP',
        '....PPPPPP..PPPPPPPP',
        '......PP.....PPPPPP.',
      ],
    },
    // 王冠
    {
      mirror: true,
      y: 1,
      rows: ['................G..G', '................GGGG', '................GGGR', '................QQQQ'],
    },
    // 花びら
    { x: 2, y: 34, rows: ['.P', 'PP'] },
    { x: 35, y: 30, rows: ['PP', 'P.'] },
    // みきの つや
    { x: 12, y: 17, rows: ['T', 'T', 'T', 'T'] },
  ],
};

/** ヒトメセンボン（フィールドに立つ 32×32） */
const hitomeSenbonField: MonsterDesign = {
  size: 32,
  colors: {
    P: NQ.blush,
    p: NQ.blush,
    b: NQ.berry,
    W: NQ.white,
    B: NQ.brown,
    K: NQ.bark,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
  },
  rim: { [NQ.blush]: NQ.berry, [NQ.brown]: NQ.bark },
  layers: [
    {
      mirror: true,
      y: 13,
      rows: [
        '..PP............',
        '.PWPBB..........',
        '..PPBBB.........',
        '......BBBBBBBBBB',
        '.........BBBBBBB',
        '.........BBWoBBB',
        '.........BBWoBBB',
        '.........BpBBBBB',
        '.........BBBBBoo',
        '.........BBBBBBB',
        '.........BBBKBBB',
        '.........BBBBBBB',
        '........BBBBBBBB',
        '.......BBBBB..BB',
        '.....BBBBB......',
        '.....KKKK.......',
      ],
    },
    {
      mirror: true,
      y: 3,
      rows: [
        '.........PP..PPP',
        '......PPPPPPPPPP',
        '....PPPPWPPPPPPP',
        '...PPPPPPPPPPWPP',
        '..PPWPPPPPPPPPPP',
        '..PPPPPPPPWPPPPP',
        '...PPPPPPPPPPPPP',
        '....PPPP...PPPPP',
        '......P.....PPP.',
      ],
    },
    {
      mirror: true,
      y: 1,
      rows: ['.............G.G', '.............GGG', '.............GGR', '.............QQQ'],
    },
  ],
};

/** まん中から のびる とげとげの 光（左右対称）。inner = 光、tip = 先っぽ */
function rays(
  size: number,
  cy: number,
  rIn: number,
  rOut: number,
  n: number,
  bottom: number,
  inner: string,
  tip: string,
): string[] {
  const cx = (size - 1) / 2;
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => {
      const d = Math.hypot(x - cx, y - cy);
      const a = Math.abs(Math.atan2(x - cx, cy - y));
      const u = (a / ((2 * Math.PI) / n)) % 1;
      const r = rIn + (rOut - rIn) * (1 - 2 * Math.min(u, 1 - u));
      if (d > r || y > bottom || x < 1 || y < 1 || x > size - 2) return '.';
      return d > r - 2.5 ? tip : inner;
    }).join(''),
  );
}

/** シカダイオウの 左半分：大きく ひろがる 角（先は 金） */
const SHIKA_ANTLER = [
  '.....G.....G............',
  '.....E.....E............',
  '.G...EE....E............',
  '.E...EE...EE............',
  '.EE..EE...E.............',
  '..EE.EE..EE.............',
  '..EEEEEE.E..............',
  '...EEEEEEE..............',
  '....EEEEEE..............',
  '.....EEEEEE.............',
  '.......EEEEEE...........',
  '.........EEEEEE.........',
  '...........EEEEE........',
];
/** 頭・耳・もみじの えり・からだ・足（y 8〜46） */
const SHIKA_BODY = [
  '..................TTTTTT',
  '................TTTTTTTT',
  '...............TTTTTTTTT',
  '..............TTTTTTTTTT',
  '.............TTTTTTTTTTT',
  '.............TTTTTTTTTTT',
  '......TTTT...TTTTTTTTTTT',
  '....TTTTTTT..TTooTTTTTTT',
  '...TTSSSSTTTTTWWoTTTTTTT',
  '....TTTTTTTTTTWWoTTTTTTT',
  '.......TTTT..TWWoTTTTTTT',
  '.............TWooTTTTTTT',
  '..............TpTTTTTTTT',
  '..............TTTTTTTTTT',
  '...............TTTTTWWWW',
  '...............TTTTWWWWW',
  '................TTTWWWKK',
  '................TTTWWWKK',
  '.................TTWWWWo',
  '..................TWWWWW',
  '..............VRVVAVVRVV',
  '............VVRVVVRVAVVR',
  '..........TTTVVTTTTTWWWW',
  '........TTTTTTTTTTTTWWWW',
  '......TTTTTTTTTTTTTTTWWW',
  '.....TTWTTTTTTTTTTTTTTWW',
  '....TTTTTTWTTTTTTTTTTTTT',
  '....TTWTTTTTTTTTTTTTTTTT',
  '...TTTTTTTTWTTTTTTTTTTTT',
  '...TTTTWTTTTTTTTTTTTTTTT',
  '...TTTTTTTTTTTTTTTTTTTTT',
  '....TTTTTTTTTTTTTTTTTTTT',
  '....TTTTT....TTTT.......',
  '....TTTTT....TTTT.......',
  '....TTTTT....TTTT.......',
  '....TTTTT....TTTT.......',
  '....TTTTT....TTTT.......',
  '....KKKKK....KKKK.......',
  '....KKKKK....KKKK.......',
];
const SHIKA_CROWN = [
  '....................G..G',
  '....................GGGG',
  '....................GGGR',
  '....................QQQQ',
];

const shikaColors = {
  T: NQ.tan,
  S: NQ.sand,
  W: NQ.white,
  K: NQ.bark,
  E: NQ.beige,
  G: NQ.gold,
  Q: NQ.ochre,
  R: NQ.red,
  V: NQ.vermilion,
  A: NQ.apricot,
  p: NQ.blush,
};

/**
 * シカダイオウ（県ボス）：奈良公園の シカたちの 王さま。大きく ひろがる 角（先は 金）、角の あいだに 王冠、
 * 白い はなづらと むね、かたの 白い てんてん、もみじの えりかざり、4 本の 足で 堂々と 立つ（ヒカリ）
 */
const shikaDaio: MonsterDesign = {
  size: 48,
  colors: shikaColors,
  rim: { [NQ.tan]: NQ.brown, [NQ.beige]: NQ.sand, [NQ.gold]: NQ.ochre },
  rimDepth: 2,
  layers: [
    { mirror: true, y: 1, rows: SHIKA_ANTLER },
    { mirror: true, y: 8, rows: SHIKA_BODY },
    { mirror: true, y: 4, rows: SHIKA_CROWN },
    // 毛の つや
    { x: 15, y: 11, rows: ['SS', 'S.'] },
  ],
};

/** シカダイオウ 後半：角が 金色に かがやき、うしろに 光。きらきら */
const shikaDaioP0: MonsterDesign = {
  ...shikaDaio,
  colors: { ...shikaColors, E: NQ.yellow, C: NQ.cream, Z: NQ.white },
  rim: { [NQ.tan]: NQ.brown, [NQ.yellow]: NQ.gold, [NQ.gold]: NQ.ochre },
  layers: [
    { rows: rays(48, 16, 14, 22, 14, 26, 'C', 'Z') },
    ...shikaDaio.layers,
    { x: 2, y: 20, rows: ['.Z.', 'ZCZ', '.Z.'] },
    { x: 43, y: 24, rows: ['.Z.', 'ZCZ', '.Z.'] },
  ],
};

/** 聖徳太子：黒い 冠（うしろに たつ かざり）、うすい ひげ、むらさきの 衣、両手で 笏（しゃく）を もつ（カゼ） */
const shotokuTaishi: MonsterDesign = {
  size: 48,
  colors: {
    ...SKIN,
    N: NQ.hairBlack,
    L: NQ.slate,
    K: NQ.violet,
    S: NQ.lavender,
    G: NQ.gold,
    R: NQ.red,
    T: NQ.indigo,
    H: NQ.indigo,
    M: NQ.hairBlack,
    E: NQ.beige,
    Z: NQ.tan,
  },
  rim: { [NQ.violet]: NQ.indigo, [NQ.skinLight]: NQ.skinMid, [NQ.beige]: NQ.tan },
  rimDepth: 2,
  layers: [
    { mirror: true, y: 23, rows: ARMOR },
    // 冠・顔
    {
      mirror: true,
      y: 1,
      rows: [
        '........................',
        '.....................NNN',
        '....................NNLN',
        '....................NNLN',
        '....................NNLN',
        '....................NNLN',
        '....................NNNN',
        '..............NNNNNNNNNN',
        '............NNNNNNNNNNNN',
        '...........NNNLNNNNNNNNN',
        '...........NNNNNNNNNNNNN',
        '...........GGGGGGGGGGGGG',
        '...........FFFFFFFFFFFFF',
        '..........FFFFFFFFFFFFFF',
        '.........FFFFoooFFFFFFFF',
        '.........FFFFWoFFFFFFFFF',
        '..........FFFFFFFFFfFFFF',
        '..........fFFFFFFFFFMMFF',
        '..........ffFFFFFFFFFFFo',
        '...........ffFFFFFFFFFFM',
        '............fffffffffffM',
        '............KKKKKKKKKKKK',
      ],
    },
    // そでの 先（手は まん中で 笏を もつ）
    { mirror: true, y: 36, rows: ['........SS', '.......SSS', '......SSS.'] },
    // 笏（しゃく）と 手
    {
      x: 20,
      y: 25,
      rows: [
        '...EE...',
        '..EEEE..',
        '..EEEZ..',
        '..EEEZ..',
        '..EEEZ..',
        '..EEEZ..',
        '.FFFFFF.',
        'FFFFFFFF',
        '.FFFFFF.',
        '..EEEZ..',
        '..EEEZ..',
        '...EZ...',
      ],
    },
  ],
};

export const NARA: Readonly<Record<string, MonsterDesign>> = {
  'nara-happazushi': happazushi,
  'nara-happazushi-yagura': happazushiYagura,
  'nara-suminosuke': suminosuke,
  'nara-sumiryu': sumiryu,
  'nara-somen-tsururi': somenTsururi,
  'nara-uzumaki-somen': uzumakiSomen,
  'nara-midboss-hitome-senbon': hitomeSenbon,
  'nara-midboss-hitome-senbon.field': hitomeSenbonField,
  'nara-boss-shika-daio': shikaDaio,
  'nara-boss-shika-daio.p0': shikaDaioP0,
  'nara-lastboss-shotoku-taishi': shotokuTaishi,
};
