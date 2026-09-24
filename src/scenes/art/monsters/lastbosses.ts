/**
 * 裏ステージの ラスボス（その土地の 歴史上の人物。docs/05 §7）。48×48（県ボスと同じ大きさ）。
 * よろい武者は からだ（ARMOR）と かぶと・顔（HELMET・FACE）を ともに使い、前立て（かぶとの かざり）と 色で 人を 描き分ける。
 * 文字：N/L かぶと、G/Y 金、R 赤い ひも、K/S よろい、T 草摺、H すね、F/f はだ、W 目の光、M ひげ（'o' は ink）
 */
import { NQ } from '../palette';
import type { Layer, MonsterDesign } from './design';

/** よろいの からだ（左半分。y 23〜46） */
export const ARMOR = [
  '.................FFFFFFF',
  '..............GGGGGGGGGG',
  '...SSSSSSS..KKKKKKKKKKKK',
  '..SKKKKKKKS.KKGGKKKKKKKK',
  '..SKKKKKKKS.KKKKRRKKKKKK',
  '..GGGGGGGGG.KKKKKRRKKKKK',
  '..SKKKKKKKS.KKKKKKRRKKKK',
  '..SKKKKKKKS.GGGGGGGGGGGG',
  '..GGGGGGGGG.KKSSKKKKKKKK',
  '..SKKKKKKKS.KKKKKKKKKKKK',
  '..SKKKKKKKS.KKKKKKKKKKKK',
  '..GGGGGGGGG.GGGGGGGGGGGG',
  '....HHHHHH..RRRRRRRRRRRR',
  '....HHHHFF..KKKKKKKKKKKK',
  '.....HHFFF..KKKKKKKKKKKK',
  '......FFF..TTTTTTTTTTTTT',
  '..........TSSTTSSTTSSTTT',
  '.........GGGGGGGGGGGGGGG',
  '........TSSTTSSTTSSTTSST',
  '........TTTTTTTTTTTTTTTT',
  '........GGGGGGGGGGGGGGGG',
  '............HHHHHH......',
  '............HHHHHH......',
  '...........KKKKKKK......',
];

/**
 * 東北の 6 人の ラスボス用の 大きな よろい（左半分。y 23〜46）。
 * とがった 肩の よろい・太い 金の おび・ひろい 足の かまえで、ARMOR より ひとまわり 大きく 強そうに 見せる。
 * （ARMOR は ほかの 県の 武者も 使うので さわらない）
 */
const ARMOR_TOHOKU = [
  '.................FFFFFFF',
  '.....S........GGGGGGGGGG',
  '....SLS.......KKKKKKKKKK',
  '...SLLLS....KKKKGGKKKKKK',
  '..SLLLLLS...KKKGGGGKKKKK',
  '.SSSSSSSSSS.KKKKRRKKKKKK',
  '.SKKKKKKKKS.KKKKKRRKKKKK',
  '.SKKKKKKKKS.KKKKKKRRKKKK',
  '.GGGGGGGGGG.GGGGGGGGGGGG',
  '.SKKKKKKKKS.KKSSKKKKKKKK',
  '.SKKKKKKKKS.KKKKKKKKKKKK',
  '.GGGGGGGGGG.KKKKKKKKKKKK',
  '..HHHHHHHH..GGGGGGGGGGGG',
  '..HHHHHHHH..RRRRRRRRRRRR',
  '...HHHHFF...KKKKKKKKKKKK',
  '....HHFFF...KKKKKKKKKKKK',
  '.....FFF...TTTTTTTTTTTTT',
  '..........TSSTTSSTTSSTTT',
  '.........GGGGGGGGGGGGGGG',
  '........TSSTTSSTTSSTTSST',
  '........TTTTTTTTTTTTTTTT',
  '........GGGGGGGGGGGGGGGG',
  '...........HHHHHHHH.....',
  '..........KKKKKKKKKK....',
];

/** かぶとの はち（前立ての すぐ下。3 行） */
export const HELMET = ['............NNNLNNNNNNNN', '..........NNNLLNNNNNNNNN', '.........NNNLNNNNNNNNNNN'];

/** まびさし（金）と 顔（9 行） */
export const FACE = [
  '........GGGGGGGGGGGGGGGG',
  '......NNNNNNNFFFFFFFFFFF',
  '.....NNNNNNNFFFFFFFFFFFF',
  '....NNLNNNNFFoooFFFFFFFF',
  '....NNNNNNNFFWoFFFFFFFFF',
  '...NNLNNNNNFFFFFFFFFfFFF',
  '...NNNNNNNNfFFFFFFFFFFoo',
  '....NNNNNNNffFFFFFFFFFFF',
  '.....NNNNNN..fffffffffff',
];

/** ひげの ある 顔 */
export const BEARD_FACE = [
  ...FACE.slice(0, 6),
  '...NNNNNNNNfFFFFFFFFMMoo',
  '....NNNNNNNffFFFFFMMMMMM',
  '.....NNNNNN..fffMMMMMMMM',
];

export const SKIN = { F: NQ.skinLight, f: NQ.skinMid, W: NQ.white };

/** するどい 目（FACE の 上に かさねる）。まゆを つりあげ、白目を 大きく、ひとみを 小さく */
const SHARP_EYES: Layer = { mirror: true, x: 11, y: 16, rows: ['.ooooo', 'ooWWWo', '.oWooo', '..ooo.'] };

/** よろい武者：head は 22 行（y 1〜22）。extra は 左右ちがいの 物（目の しるし・つえ など） */
export const lord = (
  head: string[],
  colors: Record<string, string>,
  rim: Record<string, string>,
  extra: Layer[] = [],
): MonsterDesign => ({
  size: 48,
  colors: { ...SKIN, ...colors },
  rim: { [NQ.gold]: NQ.ochre, [NQ.skinLight]: NQ.skinMid, ...rim },
  rimDepth: 2,
  layers: [{ mirror: true, y: 23, rows: ARMOR }, { mirror: true, y: 1, rows: head }, ...extra],
});

/** 東北の ラスボス：大きな よろい ＋ するどい 目。extra は そのあとに かさねる */
const tohokuLord = (
  head: string[],
  colors: Record<string, string>,
  rim: Record<string, string>,
  extra: Layer[] = [],
): MonsterDesign => ({
  size: 48,
  colors: { ...SKIN, ...colors },
  rim: { [NQ.gold]: NQ.ochre, [NQ.skinLight]: NQ.skinMid, ...rim },
  rimDepth: 2,
  layers: [
    { mirror: true, y: 23, rows: ARMOR_TOHOKU },
    { mirror: true, y: 1, rows: head },
    SHARP_EYES,
    ...extra,
  ],
});

/** 伊達政宗：大きな 金の 三日月の 前立てと 黒い よろい。右目に 眼帯（独眼竜）、まわりに むらさきの オーラ */
const dateMasamune = tohokuLord(
  [
    '..GG....................',
    '..GYG...................',
    '...GYG..................',
    '....GYG.................',
    '.....GYGG...............',
    '......GYYGG.............',
    '........GYYGGG..........',
    '..........GGYYYGGG......',
    '.............GGGYYYGGGGG',
    '...............NNGGGGGGG',
    ...HELMET,
    ...FACE,
  ],
  {
    N: NQ.night,
    L: NQ.slate,
    K: NQ.night,
    S: NQ.slate,
    G: NQ.gold,
    Y: NQ.yellow,
    R: NQ.red,
    T: NQ.indigo,
    H: NQ.navy,
    V: NQ.violet,
  },
  { [NQ.slate]: NQ.night },
  [
    // むらさきの オーラ（かたの そと）
    { mirror: true, x: 1, y: 14, rows: ['..V', '.V.', 'V..', 'V..', '.V.', '..V'] },
    { mirror: true, x: 2, y: 34, rows: ['.V', 'V.', 'V.', '.V'] },
    { mirror: true, x: 4, y: 6, rows: ['.V.', 'V.V', '.V.'] },
    // 眼帯（見る がわの 左＝政宗の 右目）
    { x: 11, y: 16, rows: ['NNNNNN', 'NNNNNN', 'NNNNNN', 'NNNNNN'] },
  ],
);

/** 源義経：金の 鍬形（くわがた）と 赤い 日の丸、青みどりの よろい、まわりに 風（カゼ） */
const minamotoYoshitsune = tohokuLord(
  [
    '.........GG.............',
    '.........GG.............',
    '..........GG............',
    '...........GG...........',
    '............GG..........',
    '.............GG.........',
    '..............GG.....RRR',
    '...............GG....RRR',
    '................GGG..RRR',
    '.................GGGGGGG',
    ...HELMET,
    ...FACE,
  ],
  {
    N: NQ.night,
    L: NQ.slate,
    K: NQ.teal,
    S: NQ.aqua,
    G: NQ.gold,
    R: NQ.red,
    T: NQ.green,
    H: NQ.cloud,
    M: NQ.mint,
  },
  { [NQ.aqua]: NQ.teal },
  [
    // 八艘とびの 風
    { mirror: true, x: 1, y: 16, rows: ['MMM.', '...M', '..M.', '.M..', 'MMMM'] },
    { mirror: true, x: 2, y: 33, rows: ['MMM.', '...M', '.MMM'] },
    { mirror: true, x: 3, y: 5, rows: ['.MM', 'M..', '.MM'] },
  ],
);

/** 津軽為信：太い 金の 鍬形、赤い よろい、黒い ひげ、もえあがる ほのお（ヒノ） */
const tsugaruTamenobu = tohokuLord(
  [
    '........................',
    '....GG..................',
    '.....GG.................',
    '......GG................',
    '.......GGG..............',
    '.........GGG............',
    '...........GGGG.........',
    '..............GGGGGGGGGG',
    '...............GGGGGGGGG',
    '...............NNGGGGGGG',
    ...HELMET,
    ...BEARD_FACE,
  ],
  {
    N: NQ.brick,
    L: NQ.red,
    K: NQ.brick,
    S: NQ.red,
    G: NQ.gold,
    Y: NQ.yellow,
    R: NQ.yellow,
    T: NQ.bark,
    H: NQ.brown,
    M: NQ.hairBlack,
    V: NQ.vermilion,
    A: NQ.apricot,
  },
  { [NQ.red]: NQ.brick },
  [
    // 体の りんかくから 立ちのぼる ほのお
    { mirror: true, x: 1, y: 12, rows: ['..V', '.VA', 'VAV', 'VAV', '.VV', '..V'] },
    { mirror: true, x: 2, y: 30, rows: ['.V', 'VA', 'VA', 'VV', '.V'] },
    { mirror: true, x: 4, y: 4, rows: ['.A.', 'AVA', '.A.'] },
  ],
);

/** 佐竹義宣：佐竹の 家の しるし「扇に 月」の 前立て、青い よろい、こおりの しぶき（ミズ） */
const satakeYoshinobu = tohokuLord(
  [
    '..............GGGGGGGGGG',
    '............GGYGGYGGYGGG',
    '............GYGGYGGRRRRR',
    '.............GGYGGRRRRRR',
    '..............GGYGRRRRRR',
    '...............GGYGRRRRR',
    '................GGYGGGGG',
    '..................GGYGGG',
    '....................GGGG',
    '...............NNNNNNNGG',
    ...HELMET,
    ...FACE,
  ],
  {
    N: NQ.navy,
    L: NQ.denim,
    K: NQ.blue,
    S: NQ.azure,
    G: NQ.gold,
    Y: NQ.yellow,
    R: NQ.red,
    T: NQ.navy,
    H: NQ.denim,
    I: NQ.ice,
    k: NQ.sky,
  },
  { [NQ.azure]: NQ.blue },
  [
    // ふぶきと こおりの かけら
    { mirror: true, x: 1, y: 15, rows: ['.I.', 'IkI', '.I.', '..k', '.k.', 'k..'] },
    { mirror: true, x: 2, y: 34, rows: ['.I.', 'IkI', '.I.'] },
    { mirror: true, x: 4, y: 5, rows: ['.I.', 'IkI', '.I.'] },
  ],
);

/** 蒲生氏郷：上に 長く のびる 燕尾形（えんびなり）の かぶと、茶色の よろい、まいあがる 土けむり（ツチ） */
const gamoUjisato = tohokuLord(
  [
    '..........NNN...........',
    '..........NLNN..........',
    '...........NLNN.........',
    '...........NLNNN........',
    '............NLNNN.......',
    '............NLNNNN......',
    '.............NLNNNNN....',
    '.............NLNNNNNNN..',
    '..............NLNNNNNNNN',
    '..............NLNNNNNNNN',
    '.............NNLNNNNNNNN',
    '..........NNNNLNNNNNNNNN',
    '.........NNNNNNNNNNNNNNN',
    ...FACE,
  ],
  {
    N: NQ.night,
    L: NQ.slate,
    K: NQ.brown,
    S: NQ.tan,
    G: NQ.gold,
    R: NQ.red,
    T: NQ.bark,
    H: NQ.hairBrown,
    Y: NQ.yellow,
  },
  { [NQ.tan]: NQ.brown },
  [
    // まいあがる 土と 金の 火花
    { mirror: true, x: 1, y: 36, rows: ['S.S', '.S.', 'SSS'] },
    { mirror: true, x: 2, y: 18, rows: ['..S', '.S.', 'S..', 'S..', '.S.'] },
    { mirror: true, x: 4, y: 6, rows: ['.Y.', 'Y.Y', '.Y.'] },
  ],
);

/** 松尾芭蕉：頭巾（ずきん）と 旅の ころも、つえ（モリ）。目は しずかに とじ、まわりに 光の つぶ */
const matsuoBasho: MonsterDesign = {
  size: 48,
  colors: {
    ...SKIN,
    N: NQ.slate,
    L: NQ.silver,
    K: NQ.brown,
    S: NQ.tan,
    G: NQ.green,
    R: NQ.leaf,
    T: NQ.bark,
    H: NQ.brown,
    Y: NQ.gold,
    Z: NQ.tan,
    r: NQ.red,
    C: NQ.cream,
  },
  // つえの 金の わは 細いので かげに しない（かげにすると 金が 消える）
  rim: { [NQ.tan]: NQ.brown, [NQ.skinLight]: NQ.skinMid },
  rimDepth: 2,
  layers: [
    { mirror: true, y: 23, rows: ARMOR },
    {
      mirror: true,
      y: 1,
      rows: [
        ...Array.from({ length: 7 }, () => '........................'),
        '................LLLLLLLL',
        '.............LLNNNNNNNNN',
        '...........LNNNNNNNNNNNN',
        '..........LNNNNNNNNNNNNN',
        '.........LNNNNNNNNNNNNNN',
        '.........NNNNNNNNNNNNNNN',
        '.........NNNNFFFFFFFFFFF',
        '.........NNNFFFFFFFFFFFF',
        '.........NNFFoooFFFFFFFF',
        '.........NNFFFooFFFFFFFF',
        '.........NNFFFFFFFFFfFFF',
        '.........NNfFFFFFFFFFFoo',
        '..........NffFFFFFFFFFFF',
        '...........Nffffffffffff',
        '............KKKKKKKKKKKK',
      ],
    },
    // 旅の つえ（金の わと 赤い ふさ）
    { x: 40, y: 9, rows: ['.Y..', 'YYY.', '.Zr.', '.Zr.', ...Array.from({ length: 34 }, () => '.Z..')] },
    // 「閑かさや」の 光の つぶ
    { mirror: true, x: 2, y: 12, rows: ['.C.', 'CYC', '.C.'] },
    { mirror: true, x: 3, y: 30, rows: ['.C.', 'CYC', '.C.'] },
    { mirror: true, x: 5, y: 4, rows: ['C'] },
  ],
};

export const LAST_BOSSES: Readonly<Record<string, MonsterDesign>> = {
  'aomori-lastboss-tsugaru-tamenobu': tsugaruTamenobu,
  'iwate-lastboss-minamoto-yoshitsune': minamotoYoshitsune,
  'miyagi-lastboss-date-masamune': dateMasamune,
  'akita-lastboss-satake-yoshinobu': satakeYoshinobu,
  'yamagata-lastboss-matsuo-basho': matsuoBasho,
  'fukushima-lastboss-gamo-ujisato': gamoUjisato,
};
