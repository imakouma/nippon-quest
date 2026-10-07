/** 兵庫県の モンスター（手描き。docs/06 §4・§6.3〜6.5 の 規格） */
import { NQ } from '../palette';
import type { MonsterDesign } from './design';
import { FACE, HELMET, lord } from './lastbosses';

/** タコツボン：明石の たこつぼから 顔を 出した たこ。ねじりはちまき・ちゅーの 口・バンザイする 足（ミズ） */
const takotsubon: MonsterDesign = {
  size: 32,
  colors: {
    V: NQ.vermilion,
    r: NQ.brick,
    A: NQ.apricot,
    W: NQ.white,
    C: NQ.cloud,
    p: NQ.blush,
    B: NQ.brown,
    K: NQ.bark,
    T: NQ.tan,
  },
  rim: { [NQ.vermilion]: NQ.brick, [NQ.brown]: NQ.bark },
  layers: [
    // たこつぼ（ふちが あつい 土の つぼ）
    {
      mirror: true,
      y: 15,
      rows: [
        '.....TTTTTTTTTTT',
        '....BBBBBBBBBBBB',
        '.....KKKKKKKKKKK',
        '......BBBBBBBBBB',
        '.....BBBBBBBBBBB',
        '....BBBBBBBBBBBB',
        '...BBBBBBBBBBBBB',
        '...BBBBBBBBBBBBB',
        '...KKKKKKKKKKKKK',
        '...BBBBBBBBBBBBB',
        '...BBBBBBBBBBBBB',
        '....BBBBBBBBBBBB',
        '.....BBBBBBBBBBB',
        '......BBBBBBBBBB',
        '........BBBBBBBB',
      ],
    },
    // あたま（はちまき・目・ちゅーの 口）
    {
      mirror: true,
      y: 2,
      rows: [
        '..........VVVVVV',
        '........VVVVVVVV',
        '.......VVVVVVVVV',
        '......VVVVVVVVVV',
        '.....WWWWWWWWWWW',
        '.....CCCCCCCCCCC',
        '......VVVVVVVVVV',
        '......VVVVVWWVVV',
        '......VVVVVWoVVV',
        '......VVVVVWoVVV',
        '......VVVVpVVVrr',
        '......VVVVVVVVro',
        '.......VVVVVVVrr',
      ],
    },
    // バンザイする 足（内がわに きゅうばん）
    {
      mirror: true,
      y: 7,
      rows: [
        '..V.............',
        '.VV.............',
        '.VV.............',
        '.VVW............',
        '..VVW...........',
        '..VVVW..........',
        '...VVVV.........',
        '....VVV.........',
      ],
    },
    // つぼの ふちに たれる 足
    {
      mirror: true,
      y: 15,
      rows: [
        '......VVV.......',
        '......VWV.......',
        '.....VVV........',
        '.....VW.........',
        '......V.........',
      ],
    },
    // はちまきの むすび目
    { x: 27, y: 5, rows: ['.W', 'WC', 'CW', 'C.'] },
    // つや（左上）
    { x: 10, y: 3, rows: ['AA', 'A.'] },
    { x: 5, y: 20, rows: ['T', 'T', 'T'] },
    { x: 4, y: 24, rows: ['T', 'T'] },
  ],
};

/** タコツボダイショウ：タコツボンの しんか。さかさまの たこつぼの かぶと（なわの おび）・きりっと まゆ・力こぶの 足・うずまく 水（ミズ） */
const takotsuboDaisho: MonsterDesign = {
  size: 32,
  colors: {
    V: NQ.vermilion,
    r: NQ.brick,
    A: NQ.apricot,
    W: NQ.white,
    p: NQ.blush,
    B: NQ.brown,
    K: NQ.bark,
    T: NQ.tan,
    G: NQ.gold,
    S: NQ.sky,
    a: NQ.azure,
  },
  rim: { [NQ.vermilion]: NQ.brick, [NQ.brown]: NQ.bark },
  layers: [
    // 8本の 足（ひろげて ふんばる）
    {
      mirror: true,
      y: 17,
      rows: [
        '......VVVVVVVVVV',
        '.....VVVVVVVVVVV',
        '....VVVVVVVVVVVV',
        '....VVVV..VVVV..',
        '...VVVW...VWVV..',
        '...VVV....VVVV..',
        '..VVVW....VWVV..',
        '..VVV......VVV..',
        '.VVVW......VWV..',
        '.VVV.......VVV..',
        '.VV.......VVVV..',
        '.VVV......VVV...',
        '..VV.....VVV....',
        '.........VV.....',
      ],
    },
    // あたま
    {
      mirror: true,
      y: 8,
      rows: [
        '......VVVVVVVVVV',
        '.....VVVVVVVVVVV',
        '.....VVVVoVVVVVV',
        '.....VVVVVooVVVV',
        '.....VVVVVWWVVVV',
        '.....VVVVVWoVVVV',
        '.....VVVVVWoVVVV',
        '.....VVVVpVVVVrr',
        '.....VVVVVVVVVro',
        '......VVVVVVVVrr',
      ],
    },
    // さかさまの たこつぼの かぶと（まん中が ふくらみ、口の ふちで あたまに のる）
    {
      mirror: true,
      y: 1,
      rows: [
        '..............GG',
        '............BBBB',
        '..........BBBBBB',
        '.........BBBBBBB',
        '........BBBBBBBB',
        '........TKTKTKTK',
        '........BBBBBBBB',
        '.........BBBBBBB',
        '........TTTTTTTT',
        '........BBBBBBBB',
      ],
    },
    // 力こぶの 足
    {
      mirror: true,
      y: 10,
      rows: [
        '.VV.............',
        '.VVV............',
        '..VV............',
        '..VVW...........',
        '..VVV...........',
        '..VVVW..........',
        '...VVVV.........',
        '....VVV.........',
      ],
    },
    // うずまく 水
    { mirror: true, y: 5, rows: ['..aa', '.a..', '.a.S', '..S.'] },
    // つや
    { x: 11, y: 4, rows: ['TT', 'T.'] },
    { x: 6, y: 10, rows: ['A'] },
  ],
};

/** クロマメン：丹波の つやつや 黒豆。頭に ふた葉の め（モリ） */
const kuromamen: MonsterDesign = {
  size: 32,
  colors: {
    N: NQ.night,
    L: NQ.slate,
    g: NQ.silver,
    W: NQ.white,
    p: NQ.blush,
    b: NQ.berry,
    G: NQ.green,
    E: NQ.leaf,
    M: NQ.lime,
  },
  rim: { [NQ.leaf]: NQ.green },
  layers: [
    // ふた葉
    {
      mirror: true,
      y: 1,
      rows: [
        '.........EE.....',
        '........EMEE....',
        '........EMEEE...',
        '.........EEEEG..',
        '...........GGGG.',
        '..............GG',
        '..............GG',
      ],
    },
    // まめの からだ
    {
      mirror: true,
      y: 7,
      rows: [
        '..........NNNNNN',
        '........NNNNNNNN',
        '......NNNNNNNNNN',
        '.....NNNNNNNNNNN',
        '....NNNNNNNNNNNN',
        '....NNNNNNNNNNNN',
        '...NNNNNNNNNNNNN',
        '...NNNNNWWNNNNNN',
        '...NNNNNWoNNNNNN',
        '...NNNNNWoNNNNNN',
        '...NNNNpNNNNNNNN',
        '...NNNNNNNNNNbNN',
        '...NNNNNNNNNNNbb',
        '...NNNNNNNNNNNNN',
        '....NNNNNNNNNNNN',
        '....NNNNNNNNNNNN',
        '.....NNNNNNNNNNN',
        '......NNNNNNNNNN',
        '........NNNNNNNN',
        '..........NNNNNN',
      ],
    },
    // あし
    { mirror: true, y: 27, rows: ['........LL......', '.......LLL......'] },
    // つやつやの ひかり（左上）
    { x: 6, y: 9, rows: ['..LLL', '.LgWL', 'LLWWL', 'LLgL.', 'LL...', 'L....'] },
  ],
};

/** タマネギン：淡路島の たまねぎ。葉っぱの ちょんまげと 丸い皮（モリ） */
const tamanegin: MonsterDesign = {
  size: 32,
  colors: { G: NQ.green, E: NQ.leaf, Y: NQ.cream, A: NQ.apricot, B: NQ.brown, p: NQ.blush },
  rim: { [NQ.leaf]: NQ.green, [NQ.cream]: NQ.apricot },
  layers: [
    {
      mirror: true,
      y: 1,
      rows: [
        '...........E...',
        '..........EEE..',
        '.........EEEG..',
        '........EEEG...',
        '..........E....',
        '..........E....',
        '........YYYY...',
        '......YYYYYYYY.',
        '.....YYYYYYYYYY',
        '....YYYYYYYYYYY',
        '...YYYYYYYYYYYY',
        '..YYYYYYYYYYYYY',
        '..YYYYYYYYYYYYY',
        '.YYYYYYoYYYYYYY',
        '.YYYYYYoYYYYYYY',
        '.YYYYYYYYYYYYYY',
        '.YYYYYpYYYYYYYY',
        '.YYYYYYYYYYYYYY',
        '..YYYYYYYYYYYYY',
        '..YYYYYYYYYYYYY',
        '...YYYYYYYYYYYY',
        '....YYYYYYYYYYY',
        '.....YYYYYYYYYY',
        '......YYYYYYYY.',
        '........AAAA...',
        '.........BB....',
        '.........BB....',
        '........BBB....',
        '........BBB....',
      ],
    },
  ],
};

/** オオタマネギ：皮が よろいの ように 重なった タマネギンの しんか（モリ） */
const ootamanegi: MonsterDesign = {
  ...tamanegin,
  colors: { ...tamanegin.colors, O: NQ.ochre, W: NQ.white },
  layers: [
    ...tamanegin.layers,
    { mirror: true, y: 9, rows: ['......OOOOOOOOO', '.....O.........', '....O..........'] },
    { mirror: true, y: 14, rows: ['......WW.......', '......W........'] },
  ],
};

/** クロマメムシャ：クロマメンの しんか。まめが 3 つ ならぶ さやの かぶと・ふた葉の 前立て・葉の たて・きりっと 目（モリ） */
const kuromameMusha: MonsterDesign = {
  size: 32,
  colors: {
    N: NQ.night,
    L: NQ.slate,
    g: NQ.silver,
    W: NQ.white,
    p: NQ.blush,
    b: NQ.berry,
    G: NQ.green,
    E: NQ.leaf,
    M: NQ.lime,
    F: NQ.forest,
  },
  rim: { [NQ.leaf]: NQ.green },
  layers: [
    // ふた葉の 前立て（V 字）
    {
      mirror: true,
      y: 0,
      rows: [
        '................',
        '.........EE.....',
        '........EMEE....',
        '.........EEEE...',
        '...........EEGG.',
        '..............GG',
      ],
    },
    // まめの からだ
    {
      mirror: true,
      y: 9,
      rows: [
        '....NNNNNNNNNNNN',
        '...NNNNNNNNNNNNN',
        '..NNNNNNNNNNNNNN',
        '..NNNNNNNNWNNNNN',
        '..NNNNNNNNWoNNNN',
        '..NNNNNNNNWoNNNN',
        '..NNNNNNNpNNNNNN',
        '..NNNNNNNNNNNbNN',
        '..NNNNNNNNNNNNbb',
        '..NNNNNNNNNNNNNN',
        '..NNNNNNNNNNNNNN',
        '...NNNNNNNNNNNNN',
        '...NNNNNNNNNNNNN',
        '....NNNNNNNNNNNN',
        '.....NNNNNNNNNNN',
        '.......NNNNNNNNN',
        '.........NNNNNNN',
      ],
    },
    // さやの かぶと（まめの ふくらみが 3 つ）
    {
      mirror: true,
      y: 5,
      rows: [
        '.......EEE..EEEE',
        '.....EEMMEEEMMEE',
        '....EEEEEEEEEEEE',
        '...GEEEEEEEEEEEE',
        '..FGGGGGGGGGGGGG',
        '..FFFFFFFFFFFFFF',
      ],
    },
    // あし（さやの すねあて）
    {
      mirror: true,
      y: 26,
      rows: ['.......GGG......', '.......GGG......', '.......GGG......', '......FFFF......'],
    },
    // 大きな 葉の たて（左）
    {
      x: 1,
      y: 15,
      rows: [
        '....EE....',
        '...EMME...',
        '..EMMEEE..',
        '.EEMEGEEE.',
        'EEEEGEEEEE',
        'EMEEGEEEEE',
        'EEEGGGEEEE',
        '.EEEGEEEE.',
        '..EEGEEE..',
        '...EGEE...',
        '....G.....',
      ],
    },
    // 右うで：葉の 軍配（ぐんばい）を かかげる
    {
      x: 25,
      y: 1,
      rows: [
        '..EEE.',
        '.EMEEE',
        '.EEGEE',
        '..EGE.',
        '...G..',
        '...L..',
        '..LL..',
        '..LL..',
        '.LL...',
        'LL....',
      ],
    },
    // つや
    { x: 5, y: 11, rows: ['.LL', 'LgW', 'LW.'] },
  ],
};

/** ソロバンバン：播州そろばん。上の わくが 顔、下は はりと 玉の ならぶ そろばん。玉は 数を 数えている とちゅう（ツチ） */
const sorobanban: MonsterDesign = {
  size: 32,
  colors: {
    B: NQ.brown,
    K: NQ.bark,
    T: NQ.tan,
    E: NQ.beige,
    S: NQ.sand,
    W: NQ.white,
    p: NQ.blush,
  },
  rim: { [NQ.brown]: NQ.bark },
  layers: [
    {
      mirror: true,
      y: 3,
      rows: [
        '...SSSSSSSSSSSSS',
        '..BBBBBBBBBBBBBB',
        '..BBBBBBBBBBBBBB',
        '..BBBBBBBBWWBBBB',
        '..BBBBBBBBWoBBBB',
        '..BBBBBBBBWoBBBB',
        '..BBBBBBppBBBBoB',
        '..BBBBBBBBBBBBBo',
        '..BBTKKEEKEETKKE',
        '..BBKKKETKKEKKKE',
        '..BBEKEEKKKEEKEE',
        '..BBBBBBBSBBBBBB',
        '..BBTKKETKKEEKEE',
        '..BBKKKEKKKEEKEE',
        '..BBEKEETKKETKKE',
        '..BBEKEEKKKEKKKE',
        '..BBTKKETKKETKKE',
        '..BBKKKEKKKEKKKE',
        '..BBTKKEEKEETKKE',
        '..BBKKKEEKEEKKKE',
        '..BBTKKETKKETKKE',
        '..BBKKKEKKKEKKKE',
        '..BBBBBBBBBBBBBB',
        '..BBBBBBBBBBBBBB',
        '.......BBB......',
        '.......BBB......',
        '......BBBB......',
      ],
    },
    // わくの ひび（ツチ）
    { x: 5, y: 25, rows: ['.K', 'K.'] },
  ],
};

/** ソロバンショウグン：ソロバンバンの しんか。玉を つらねた 前立ての かぶと・きりっと まゆ・赤い はり・ふんばる 足（ツチ） */
const sorobanShogun: MonsterDesign = {
  size: 32,
  colors: {
    B: NQ.brown,
    K: NQ.bark,
    T: NQ.tan,
    E: NQ.beige,
    S: NQ.sand,
    W: NQ.white,
    p: NQ.blush,
    R: NQ.red,
    r: NQ.brick,
    N: NQ.slate,
    L: NQ.gray,
  },
  rim: { [NQ.brown]: NQ.bark, [NQ.red]: NQ.brick, [NQ.slate]: NQ.night },
  layers: [
    // 玉を つらねた 前立て（2 本の じく）
    {
      mirror: true,
      y: 1,
      rows: [
        '........TKK.....',
        '........KKK.....',
        '.........K......',
        '........TKK.....',
        '........KKK.....',
        '.........K......',
      ],
    },
    // かぶと と ふきかえし
    {
      mirror: true,
      y: 7,
      rows: ['.......NNNNNNNNN', '.....NNNNNNNNNNN', '..LNNNNNNNNNNNNN', '.LL.............'],
    },
    // 顔の わく と そろばんの からだ
    {
      mirror: true,
      y: 10,
      rows: [
        '..BBBBBBBBBBBBBB',
        '..BBBBBBBoooBBBB',
        '..BBBBBBBBWNBBBB',
        '..BBBBBBBBWoBBBB',
        '..BBBBBBBBWoBBBB',
        '..BBBBBBppBBBooo',
        '..BBBBBBBBBBBBBB',
        '..BBTKKETKKETKKE',
        '..BBKKKEKKKEKKKE',
        '..RRRRRRRRRRRRRR',
        '..BBTKKEEKEETKKE',
        '..BBKKKEEKEEKKKE',
        '..BBTKKETKKETKKE',
        '..BBKKKEKKKEKKKE',
        '..BBEKEETKKETKKE',
        '..BBEKEEKKKEKKKE',
        '..BBBBBBBBBBBBBB',
        '......BBBB......',
        '.....BBBBB......',
        '....NNNNNN......',
      ],
    },
    // かぶとの つや
    { x: 9, y: 8, rows: ['LL'] },
  ],
};

/**
 * タジマモウギュウ（中ボス）：但馬の 黒毛の 巨牛。大きく 反って とがった 角、金の 鼻わ、するどい 目、
 * せなかから 立ちのぼる 炎、はなから ふく 白い ゆげ、ふんばる 太い 前足。王冠は 角の あいだ（ヒノ）
 */
const tajimaMogyu: MonsterDesign = {
  size: 40,
  colors: {
    N: NQ.night,
    L: NQ.slate,
    g: NQ.gray,
    E: NQ.beige,
    K: NQ.bark,
    W: NQ.white,
    c: NQ.cloud,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    V: NQ.vermilion,
    A: NQ.apricot,
  },
  rim: { [NQ.beige]: NQ.sand, [NQ.gold]: NQ.ochre, [NQ.gray]: NQ.slate },
  rimDepth: 2,
  layers: [
    // からだ（もりあがった 肩）と ふんばる 太い 前足
    {
      mirror: true,
      y: 17,
      rows: [
        '........NNNNNNNNNNNN',
        '......NNNNNNNNNNNNNN',
        '....NNNNNNNNNNNNNNNN',
        '...NNNNNNNNNNNNNNNNN',
        '..NNNNNNNNNNNNNNNNNN',
        '.NNNNNNNNNNNNNNNNNNN',
        '.NNNNNNNNNNNNNNNNNNN',
        '.NNNNNNNNNNNNNNNNNNN',
        '.NNNNNNNNNNNNNNNNNNN',
        '.NNNNNNNNNNNNNNNNNNN',
        '.NNNNNNNNNNNNNNNNNNN',
        '.NNNNNNNNNNNNNNNNNNN',
        '.NNNNNNNNNNNNNNNNNNN',
        '.NNNNNNNNNNNN...NNNN',
        '.NNNNNNNNNNNN...NNNN',
        '.NNNNNNNNNNNN...NNNN',
        '.NNNNNNNNNNNN...NNNN',
        '.NNNNNNNNNNNN.......',
        '.NNNNNNNNNNNN.......',
        '.NNNNNNNNNNNN.......',
        '.KKKKKgKKKKKK.......',
        '.KKKKKgKKKKKK.......',
      ],
    },
    // 耳（肩の 上に ぴんと）
    {
      mirror: true,
      y: 15,
      rows: ['....NNNNN...........', '...NNNNNN...........', '...NLLNNN...........', '....NNNNN...........'],
    },
    // 顔（ひさしの かげ・するどい 目・はなづら）
    {
      mirror: true,
      y: 9,
      rows: [
        '..........NNNNNNNNNN',
        '.........NNNNNNNNNNN',
        '........NNNNNNNNNNNN',
        '.......NNNNNNNNNNNNN',
        '.......NNLLLLNNNNNNN',
        '.......NNNNLLLLLLNNN',
        '.......NNNNoooooooNN',
        '.......NNNNNWWWoNNNN',
        '.......NNNNNWWWoNNNN',
        '.......NNNNNWWooNNNN',
        '.......NNNNNNNNNNNNN',
        '........NNNNNNNNNNNN',
        '.........NNNNNNNNNNN',
        '.........ggggggggggg',
        '.........ggggggggggg',
        '.........ggggggggggg',
        '.........ggggooggggg',
        '.........gggoooggggg',
        '.........ggggggggggg',
        '..........gggggggggg',
        '...........ggggggggg',
      ],
    },
    // 角（大きく 反って 上へ、先は 黒く とがる）
    {
      mirror: true,
      y: 2,
      rows: [
        '..K.................',
        '.KK.................',
        '.EEE................',
        '.EEEE...............',
        '..EEEE..............',
        '..EEEEE.............',
        '...EEEEEE...........',
        '....EEEEEEE.........',
        '.....EEEEEEEE.......',
        '.......EEEEEEE......',
        '.........EEEEE......',
        '..........EEEE......',
      ],
    },
    // 王冠（角の あいだ、赤い 宝石）
    {
      mirror: true,
      y: 5,
      rows: ['................G..G', '................GGGG', '................GGGR', '................QQQQ'],
    },
    // 金の 鼻わ
    {
      mirror: true,
      y: 30,
      rows: [
        '................GGGG',
        '...............GG...',
        '...............GG...',
        '...............GG...',
        '................GGGG',
      ],
    },
    // せなかから 立ちのぼる 炎
    {
      mirror: true,
      y: 14,
      rows: [
        '...A................',
        '..VAG...............',
        '..VAG...............',
        '.VVAG...............',
        '.VVAGA..............',
        '.VVVAV..............',
        '.VVVAA..............',
        '..VVVAG.............',
        '..VVVAA.............',
        '...VVVA.............',
        '....VVV.............',
      ],
    },
    // はなから ふく 白い ゆげ
    { x: 5, y: 23, rows: ['..cW', '.cWW', 'cWWc', '.cW.'] },
    { x: 31, y: 23, rows: ['Wc..', 'WWc.', 'cWWc', '.Wc.'] },
    // 毛の つや（左上）
    { x: 10, y: 10, rows: ['LL', 'L.'] },
    { x: 3, y: 20, rows: ['LL', 'L.'] },
    { x: 2, y: 31, rows: ['L', 'L'] },
  ],
};

/** タジマモウギュウ（フィールドに立つ 32×32）。40 の すがたに あわせた 巨牛 */
const tajimaMogyuField: MonsterDesign = {
  size: 32,
  colors: {
    N: NQ.night,
    L: NQ.slate,
    g: NQ.gray,
    E: NQ.beige,
    K: NQ.bark,
    W: NQ.white,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    V: NQ.vermilion,
  },
  rim: { [NQ.beige]: NQ.sand, [NQ.gold]: NQ.ochre, [NQ.gray]: NQ.slate },
  layers: [
    // からだと 前足
    {
      mirror: true,
      y: 14,
      rows: [
        '.......NNNNNNNNN',
        '.....NNNNNNNNNNN',
        '...NNNNNNNNNNNNN',
        '..NNNNNNNNNNNNNN',
        '.NNNNNNNNNNNNNNN',
        '.NNNNNNNNNNNNNNN',
        '.NNNNNNNNNNNNNNN',
        '.NNNNNNNNNNNNNNN',
        '.NNNNNNNNNNNNNNN',
        '.NNNNNNNNNNNNNNN',
        '.NNNNNNNNNNNNNNN',
        '.NNNNNNNNN..NNNN',
        '.NNNNNNNNN..NNNN',
        '.NNNNNNNNN..NNNN',
        '.NNNNNNNNN......',
        '.NNNNNNNNN......',
        '.KKKKgKKKK......',
      ],
    },
    // せなかの 炎
    {
      mirror: true,
      y: 13,
      rows: [
        '...G............',
        '..VG............',
        '.VVG............',
        '.VVG............',
        '.VVVG...........',
        '..VVG...........',
        '..VVV...........',
        '...VV...........',
      ],
    },
    // 耳
    { mirror: true, y: 12, rows: ['...NNNN.........', '...NLLN.........', '....NNN.........'] },
    // 顔・はなづら・金の 鼻わ
    {
      mirror: true,
      y: 7,
      rows: [
        '........NNNNNNNN',
        '.......NNNNNNNNN',
        '......NNNNNNNNNN',
        '......NNNLLLLNNN',
        '......NNNoooooNN',
        '......NNNNWWoNNN',
        '......NNNNWWoNNN',
        '......NNNNNNNNNN',
        '.......NNNNNNNNN',
        '........gggggggg',
        '........gggggggg',
        '........gggooggg',
        '........ggoooggg',
        '........gggggggg',
        '.........ggggggg',
        '............GGGG',
        '...........GG...',
        '...........GG...',
        '............GGGG',
      ],
    },
    // 角
    {
      mirror: true,
      y: 2,
      rows: [
        '..K.............',
        '.KK.............',
        '.EEE............',
        '..EEE...........',
        '..EEEE..........',
        '...EEEEE........',
        '....EEEEEE......',
        '......EEEEEE....',
        '........EEEE....',
      ],
    },
    // 王冠
    {
      mirror: true,
      y: 3,
      rows: ['............G..G', '............GGGG', '............GGGR', '............QQQQ'],
    },
    // ゆげ と つや
    { x: 4, y: 17, rows: ['.WW', 'WW.'] },
    { x: 25, y: 17, rows: ['WW.', '.WW'] },
    { x: 7, y: 8, rows: ['LL', 'L.'] },
    { x: 2, y: 18, rows: ['LL', 'L.'] },
  ],
};

/** まん中から のびる とげとげの 光（左右対称）。C = 光、K = 先っぽ */
function rays(size: number, cy: number, rIn: number, rOut: number, n: number, bottom: number): string[] {
  const cx = (size - 1) / 2;
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => {
      const d = Math.hypot(x - cx, y - cy);
      const a = Math.abs(Math.atan2(x - cx, cy - y));
      const u = (a / ((2 * Math.PI) / n)) % 1;
      const r = rIn + (rOut - rIn) * (1 - 2 * Math.min(u, 1 - u));
      if (d > r || y > bottom || x < 1 || y < 1 || x > size - 2) return '.';
      return d > r - 2.5 ? 'K' : 'C';
    }).join(''),
  );
}

/** シラサギテンシュ：天守の 左半分（y 1〜46）。屋根 3 だん・白い かべ・まどの 目・破風の 口・石垣の うでと 足 */
const TENSHU = [
  '....................G..G',
  '..........GG........GGGG',
  '...........GG.......GGGR',
  '............GG......QQQQ',
  '............GGGNNNNNNNNN',
  '..........LLNNNNNNNNNNNN',
  '.........LNNNNNNNNNNNNNN',
  '.........NNNNNNNNNNNNNNN',
  '..........nnnnnnnnnnnnnn',
  '...........WWWWWWWWWWWWW',
  '...........WWnnnnnWWWWWW',
  '...........WWnYYnnWWWWWW',
  '...........WWnYYonWWWWWW',
  '...........WWnYYonWWWWWW',
  '...........WWnYoonWWWWWW',
  '...........WWnnnnnWWWWNN',
  '......LLNNNNNNNNNNNNNNWW',
  '.....LNNNNNNNNNNNNNNNWWW',
  '.....NNNNNNNNNNNNNNNNWnn',
  '......nnnnnnnnnnnnnnnnnn',
  '........WWWWWWWWWWWWWWWW',
  '........WWWnnWWWWWWWWWWW',
  '........WWWnnWWWWnWWWWWW',
  '........WWWWWWWWnnnWWWWW',
  '........WWWWWWWWWWWWWWWW',
  '........WWWWWWWWWWWWWWWW',
  '..LLNNNNNNNNNNNNNNNNNNNN',
  '.LNNNNNNNNNNNNNNNNNNNNNN',
  '.NNNNNNNNNNNNNNNNNNNNNNN',
  '..nnnnnnnnnnnnnnnnnnnnnn',
  '.SSSS..WWWWWWWWWWWWWWWWW',
  '.SSTS..WWWnnWWWWWWWWWWWW',
  '.SSSS..WWWnnWWWWWWnnnnnn',
  '.TTTT..WWWWWWWWWWWnGnnnn',
  '.SSSS..WWWWWWWWWWWnnnnnn',
  '.SSTS..WWWWWWWWWWWnGnnnn',
  '.SSSS.EEEEEEEEEEEEnnnnnn',
  '.TTTT.SSSTSSSSTSSSnnnnnn',
  '.SSSSSSSSSSSSSSSSSnnnnnn',
  '.SSSSSTTTTTTTTTTTTnnnnnn',
  '.STSSSSSTSSSSSTSSS......',
  '.SSSSSSSSSSSSSSSSS......',
  '....TTTTTTTTTTTTTT......',
  '....SSTSSSSSTSSSSS......',
  '...SSSSSSSSSSSSSSS......',
  '...BBBBBBBBBBBBBBB......',
];

const tenshuColors = {
  W: NQ.white,
  N: NQ.slate,
  L: NQ.gray,
  n: NQ.night,
  Y: NQ.cream,
  G: NQ.gold,
  Q: NQ.ochre,
  R: NQ.red,
  S: NQ.sand,
  T: NQ.tan,
  E: NQ.beige,
  B: NQ.brown,
};

/**
 * シラサギテンシュ（県ボス）：目を さました 姫路城の 天守。屋根の しゃちほこ・まどの 目・破風の 口・
 * 白い かべの さま（○△□ の あな）・石垣の うでと 足。王冠は 屋根の むね（ツチ → ヒカリ）
 */
const shirasagiTenshu: MonsterDesign = {
  size: 48,
  colors: tenshuColors,
  rim: { [NQ.white]: NQ.cloud, [NQ.sand]: NQ.tan, [NQ.gold]: NQ.ochre },
  rimDepth: 2,
  layers: [{ mirror: true, y: 1, rows: TENSHU }],
};

/** シラサギテンシュ 後半（ヒカリ）：白い かべが かがやき、うしろに 金の 光。まどの 目が 白く 光る */
const shirasagiTenshuP0: MonsterDesign = {
  ...shirasagiTenshu,
  colors: { ...tenshuColors, Y: NQ.white, C: NQ.cream, K: NQ.yellow },
  rim: { [NQ.white]: NQ.cream, [NQ.sand]: NQ.tan, [NQ.gold]: NQ.ochre },
  layers: [
    { rows: rays(48, 18, 17, 24, 16, 32) },
    { mirror: true, y: 1, rows: TENSHU },
    // きらきら
    { x: 2, y: 3, rows: ['.K.', 'KCK', '.K.'] },
    { x: 43, y: 6, rows: ['.K.', 'KCK', '.K.'] },
  ],
};

/** 池田輝政：池田家の しるし「あげは蝶」の 金の 前立て、白鷺城の ような 白い よろい（ヒカリ） */
const ikedaTerumasa = lord(
  [
    '......GGG..........G....',
    '.....GYYYGG.........G...',
    '.....GYYNYYGG........G..',
    '......GYYNYYYGG.......GN',
    '.......GYYYNYYYYGGG....N',
    '.........GGYYNYYYYYYGGGN',
    '............GGGGGGGGGGGN',
    '..............GYYRYYYGGN',
    '..............GYRRYGG..N',
    '.............GGG..NNNNNN',
    ...HELMET,
    ...FACE,
  ],
  {
    N: NQ.night,
    L: NQ.slate,
    K: NQ.paper,
    S: NQ.silver,
    G: NQ.gold,
    Y: NQ.yellow,
    R: NQ.red,
    T: NQ.slate,
    H: NQ.gray,
  },
  { [NQ.paper]: NQ.cloud, [NQ.silver]: NQ.gray },
);

export const HYOGO: Readonly<Record<string, MonsterDesign>> = {
  'hyogo-takotsubon': takotsubon,
  'hyogo-takotsubo-daisho': takotsuboDaisho,
  'hyogo-kuromamen': kuromamen,
  'hyogo-kuromame-musha': kuromameMusha,
  'hyogo-tamanegin': tamanegin,
  'hyogo-ootamanegi': ootamanegi,
  'hyogo-sorobanban': sorobanban,
  'hyogo-soroban-shogun': sorobanShogun,
  'hyogo-midboss-tajima-mogyu': tajimaMogyu,
  'hyogo-midboss-tajima-mogyu.field': tajimaMogyuField,
  'hyogo-boss-shirasagi-tenshu': shirasagiTenshu,
  'hyogo-boss-shirasagi-tenshu.p0': shirasagiTenshuP0,
  'hyogo-lastboss-ikeda-terumasa': ikedaTerumasa,
};
