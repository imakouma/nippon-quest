/** 和歌山県の モンスター（手描き。docs/06 §4・§6.3〜6.5 の 規格） */
import { NQ } from '../palette';
import type { MonsterDesign } from './design';
import { FACE, HELMET, lord } from './lastbosses';

/** コロミカン：有田みかん。よこに ひらたい まるい みかん、へたと 葉、皮の つぶつぶ（モリ） */
const koromikan: MonsterDesign = {
  size: 32,
  colors: {
    O: NQ.orange,
    a: NQ.amber,
    Y: NQ.yellow,
    K: NQ.bark,
    E: NQ.leaf,
    M: NQ.lime,
    W: NQ.white,
    p: NQ.blush,
  },
  rim: { [NQ.orange]: NQ.amber, [NQ.leaf]: NQ.green },
  layers: [
    // みかんの からだ
    {
      mirror: true,
      y: 8,
      rows: [
        '..........OOOOOO',
        '.......OOOOOOOOO',
        '.....OOOOOOOOOOO',
        '....OOOOOOOOOOOO',
        '...OOOOOOOOOOOOO',
        '...OOOOOOOOOOOOO',
        '..OOOOOOOOOOOOOO',
        '..OOOOOOOOOOOOOO',
        '..OOOOOOOOWWOOOO',
        '..OOOOOOOOWoOOOO',
        '..OOOOOOOOWoOOOO',
        '..OOOOOOOpOOOOOO',
        '..OOOaOOOOOOOOoO',
        '..OOOOOOOOOOOOOo',
        '...OOOOOOOOOOOOO',
        '...OOOOOOOaOOOOO',
        '....OOOOOOOOOOOO',
        '.....OOOOOOOOOOO',
        '.......OOOOOOOOO',
        '..........OOOOOO',
      ],
    },
    // 足
    { mirror: true, y: 28, rows: ['........aa......', '.......aaa......'] },
    // へた と 葉
    { x: 15, y: 4, rows: ['..EEE.', 'KEMEEE', 'KKEEE.', 'KK....'] },
    // 皮の つぶつぶ・つや
    { x: 13, y: 11, rows: ['a'] },
    { x: 19, y: 13, rows: ['a'] },
    { x: 6, y: 11, rows: ['YY', 'Y.', 'Y.'] },
  ],
};

/** モリモリミカン：コロミカンの しんか。大きな 葉の 前立て、皮を むいた おなかに ふさ、きりっと まゆ（モリ） */
const morimoriMikan: MonsterDesign = {
  size: 32,
  colors: {
    O: NQ.orange,
    a: NQ.amber,
    A: NQ.apricot,
    Y: NQ.yellow,
    K: NQ.bark,
    E: NQ.leaf,
    M: NQ.lime,
    W: NQ.white,
    p: NQ.blush,
  },
  rim: { [NQ.orange]: NQ.amber, [NQ.leaf]: NQ.green },
  layers: [
    // 大きな 葉の 前立て
    {
      mirror: true,
      y: 1,
      rows: [
        '.........EE.....',
        '........EMEE....',
        '........EMMEE...',
        '.........EEEEE..',
        '..........EEEEE.',
        '............EEKK',
        '..............KK',
      ],
    },
    // うで
    { mirror: true, y: 10, rows: ['..OO', '.OOO', '.OOa', '..OO', '...O'] },
    // みかんの からだ（下は 皮を むいて ふさが 見える）
    {
      mirror: true,
      y: 8,
      rows: [
        '.........OOOOOOO',
        '......OOOOOOOOOO',
        '....OOOOOOOOOOOO',
        '...OOOOOOOOOOOOO',
        '..OOOOOOOOOOOOOO',
        '..OOOOOOOooOOOOO',
        '..OOOOOOOOWoOOOO',
        '..OOOOOOOOWoOOOO',
        '..OOOOOOOOWoOOOO',
        '..OOOOOOOpOOOooo',
        '..OOOOOOOOOOOOOO',
        '..OOOaOOOOOOOOOO',
        '..OOOOOOOOOOOOOO',
        '..OOOOOOOOOOaOOO',
        '...OOOOOOOOOOOOO',
        '...OOOOaOOOOOOOO',
        '....OOOOOOOOOOOO',
        '.....OOOOOOOOOOO',
        '......OOOOOOOOOO',
        '........OOOOOOOO',
        '.........aa.....',
        '........aaa.....',
      ],
    },
    // つや
    { x: 5, y: 11, rows: ['YY', 'Y.'] },
  ],
};

/** カンカンタン：紀州備長炭。銀色に 光る かたい 炭の からだ、ふしと ひび、頭に 3 本の炎（ヒノ） */
const kankantan: MonsterDesign = {
  size: 32,
  colors: {
    L: NQ.slate,
    N: NQ.night,
    g: NQ.silver,
    W: NQ.white,
    p: NQ.blush,
    R: NQ.red,
    V: NQ.vermilion,
    A: NQ.apricot,
    G: NQ.gold,
    C: NQ.cream,
  },
  rim: { [NQ.slate]: NQ.night },
  layers: [
    // 頭の 炎
    {
      mirror: true,
      y: 1,
      rows: [
        '...............C',
        '..............AG',
        '..............VG',
        '...........A.VAG',
        '..........VGVVAA',
        '..........VAAVVA',
      ],
    },
    // 炭の からだ
    {
      mirror: true,
      y: 7,
      rows: [
        '.........RRRRRRR',
        '.........LLLLLLL',
        '........LLgLLLLL',
        '........LLgLLLLL',
        '.........LgLLLLL',
        '.........LLLWWLL',
        '.........LLLWoLL',
        '.........LLLWoLL',
        '.........LLpLLoL',
        '........LLLLLLLo',
        '........LgLLLLLL',
        '........LgLLLLLL',
        '.........LLLLLLL',
        '.........NNNNNNN',
        '.........LLLLLLL',
        '........LLgLLLLL',
        '........LLgLLLLL',
        '.........LLLLLLL',
        '.........LLLLLLL',
        '..........LLLLLL',
        '...........LL...',
        '...........LL...',
      ],
    },
    // うで
    { mirror: true, y: 15, rows: ['......LL', '.....LL.', '.....L..'] },
    // ひび
    { x: 19, y: 22, rows: ['N', '.N', 'N.'] },
  ],
};

/** ビンチョウホムラ：カンカンタンの しんか。ひびから 赤く 光る 太い 炭の からだ、大きな 炎の かんむり、きりっと まゆ、光る こぶし（ヒノ） */
const binchoHomura: MonsterDesign = {
  size: 32,
  colors: {
    L: NQ.slate,
    N: NQ.night,
    g: NQ.silver,
    W: NQ.white,
    p: NQ.blush,
    R: NQ.red,
    V: NQ.vermilion,
    A: NQ.apricot,
    G: NQ.gold,
    C: NQ.cream,
  },
  rim: { [NQ.slate]: NQ.night },
  layers: [
    // 大きな 炎の かんむり
    {
      mirror: true,
      y: 1,
      rows: [
        '.......C.......C',
        '.......G......AG',
        '......AG......VG',
        '......VGA..A.VAG',
        '.....VVAG.VGVVAA',
        '.....VVVAVVAAVVA',
        '......VVVVVVVVVV',
      ],
    },
    // 炭の からだ（ひびが 赤く 光る）
    {
      mirror: true,
      y: 8,
      rows: [
        '......RRRRRRRRRR',
        '......LLLLLLLLLL',
        '.....LLgLLLLLLLL',
        '.....LLgLLLooLLL',
        '.....LLgLLLLWoLL',
        '.....LLLLLLLWoLL',
        '.....LLLLLLLWoLL',
        '.....LLLLLLpLLoo',
        '......LLLLLLLLLL',
        '......LLRLLLLLLL',
        '......LLLRLLLLLL',
        '......LLRLLLLLLL',
        '......NNNNNNNNNN',
        '......LLLLLLLRLL',
        '.....LLgLLLLLLRL',
        '.....LLgLLLLLRLL',
        '......LLLLLLLLLL',
        '.......LLLLLLLLL',
        '........LLL.....',
        '.......LLLL.....',
        '......NNNNN.....',
      ],
    },
    // 光る こぶし
    { mirror: true, y: 14, rows: ['....LL', '..RLL.', '.RAR..', '..R...'] },
  ],
};

/** トウダイン：潮岬の 白い 灯台。金の わっか、あかりの まどから 光の すじ、ろうか、みさきの 岩（ヒカリ） */
const toudain: MonsterDesign = {
  size: 32,
  colors: {
    W: NQ.white,
    N: NQ.navy,
    I: NQ.ice,
    Y: NQ.cream,
    G: NQ.gold,
    Q: NQ.ochre,
    L: NQ.slate,
    g: NQ.silver,
    p: NQ.blush,
  },
  rim: { [NQ.white]: NQ.cloud, [NQ.silver]: NQ.gray },
  layers: [
    // 金の わっか
    { mirror: true, y: 1, rows: ['............GGGG', '...........G....', '............QQQQ'] },
    // 光の すじ
    {
      mirror: true,
      y: 6,
      rows: [
        '.YY.............',
        '.YYYY...........',
        '.YYYYYYYYYY.....',
        '.YYYY...........',
        '.YY.............',
      ],
    },
    // 灯台
    {
      mirror: true,
      y: 4,
      rows: [
        '...............G',
        '.............NNN',
        '............NNNN',
        '...........IYYYY',
        '...........IYYYY',
        '...........IYIYY',
        '.........NNNNNNN',
        '..........WWWWWW',
        '..........WWWWWW',
        '..........WWWWWW',
        '..........WWWWWW',
        '..........WWWWWW',
        '.........WWWWWWW',
        '.........WWWWWWW',
        '.........WWWWWWW',
        '.........WWWWWWW',
        '.........WWWWWWW',
        '.........WWWWWWW',
        '........WWWWWWNN',
        '........WWWWWWNN',
        '........WWWWWWNN',
        '........WWWWWWNN',
        '....ggLLLLLLLLLL',
        '..gggLLLLgLLLLLL',
        '.LLLLLLLLLLLLLLL',
        '...LLLLLLLLLLLLL',
      ],
    },
    // 顔（白い かべに 黒い 目）
    {
      mirror: true,
      y: 16,
      rows: ['...........Wo...', '...........Wo...', '..........p...o.', '...............o'],
    },
  ],
};

/** マモリトウダイ：トウダインの しんか。赤い おびの 灯台、四方へ のびる 光、きりっと まゆ、赤白の うきわを もつ（ヒカリ） */
const mamoriToudai: MonsterDesign = {
  size: 32,
  colors: {
    W: NQ.white,
    N: NQ.navy,
    I: NQ.ice,
    Y: NQ.cream,
    G: NQ.gold,
    Q: NQ.ochre,
    L: NQ.slate,
    g: NQ.silver,
    p: NQ.blush,
    R: NQ.red,
  },
  rim: { [NQ.white]: NQ.cloud, [NQ.red]: NQ.brick },
  layers: [
    // 光の すじ（大きく）
    {
      mirror: true,
      y: 3,
      rows: [
        '.Y..............',
        '.YYY............',
        '.YYYYYY.........',
        '.YYYYYYYYYY.....',
        '.YYYYYY.........',
        '.YYY............',
        '.Y..............',
      ],
    },
    // 灯台
    {
      mirror: true,
      y: 2,
      rows: [
        '...............G',
        '.............NNN',
        '...........GNNNN',
        '...........IYYYY',
        '...........IYYYY',
        '...........IYIYY',
        '.........NNNNNNN',
        '.........N.N.N.N',
        '.........WWWWWWW',
        '.........WWWWWWW',
        '.........WWWooWW',
        '.........WWWWWoW',
        '.........WWWWWoW',
        '.........WWWWpWW',
        '.........WWWWWWo',
        '........RRRRRRRR',
        '........RRRRRRRR',
        '........WWWWWWWW',
        '........WWWWWWWW',
        '........WWWWWWNN',
        '........WWWWWWNN',
        '........WWWWWWNN',
        '........WWWWWWNN',
        '....ggLLLLLLLLLL',
        '..gggLLLLgLLLLLL',
        '.LLLLLLLLLLLLLLL',
        '...LLLLLLLLLLLLL',
      ],
    },
    // 赤白の うきわ（左手）
    { x: 1, y: 16, rows: ['.RRWR.', 'R....W', 'W....R', 'R....R', '.WRRW.'] },
    { x: 7, y: 17, rows: ['WW', 'WW'] },
  ],
};

/** シブキン：那智の 滝の しぶきから 生まれた まるい 生きもの。上から おちる 白い 水の すじ、ひれ（ミズ） */
const shibukin: MonsterDesign = {
  size: 32,
  colors: {
    I: NQ.ice,
    S: NQ.sky,
    W: NQ.white,
    p: NQ.blush,
  },
  rim: { [NQ.ice]: NQ.sky, [NQ.sky]: NQ.azure },
  layers: [
    // 上から おちる 滝の しぶき
    {
      mirror: true,
      x: 4,
      y: 1,
      rows: [
        '.WW.....',
        '.WI.....',
        '.WI..WW.',
        '.WI..WI.',
        '.WI..WI.',
        '.WI..WI.',
        '.WI..WI.',
        '.WI..WI.',
        '.WI..WI.',
      ],
    },
    // ひれ
    { mirror: true, x: 1, y: 19, rows: ['SS.', 'SSS', 'SSS', 'SS.'] },
    // しぶきの からだ
    {
      mirror: true,
      y: 10,
      rows: [
        '..........IIIIII',
        '........IIIIIIII',
        '......IIIIIIIIII',
        '.....IIIIIIIIIII',
        '....IIIIIIIIIIII',
        '....IIIIIIIIIIII',
        '...IIIWWIIIIIIII',
        '...IIIWoIIIIIIII',
        '...IIIWoIIIIIIII',
        '...IIIIIIIIIIIII',
        '...IpIIIIIIIIooo',
        '...IIIIIIIIIIIoo',
        '....IIIIIIIIIIII',
        '....IIIIIIIIIIII',
        '.....IIIIIIIIIII',
        '......IIIIIIIIII',
        '.......IIIIIIIII',
        '........IIIIIIII',
        '.........IIIIIII',
        '.........IIIIIII',
      ],
    },
    // つや
    { x: 8, y: 12, rows: ['WW', 'W.'] },
  ],
};

/** オオタキマル：シブキンの しんか。せなかに 那智の 滝を せおった すがた。きりっと まゆ、大きな ひれ（ミズ） */
const ootakimaru: MonsterDesign = {
  size: 32,
  colors: {
    A: NQ.azure,
    S: NQ.sky,
    I: NQ.ice,
    W: NQ.white,
    c: NQ.cloud,
    p: NQ.blush,
  },
  rim: { [NQ.azure]: NQ.blue, [NQ.sky]: NQ.azure },
  layers: [
    // せなかの 滝
    {
      mirror: true,
      x: 3,
      y: 1,
      rows: [
        'WWWWWWWWWWWWW',
        'WWIWWIWWIWWIW',
        'WWIWWIWWIWWIW',
        'WWIWWIWWIWWIW',
        'WWIWWIWWIWWIW',
        'WWIWWIWWIWWIW',
        'WWIWWIWWIWWIW',
        'WWIWWIWWIWWIW',
        'WWIWWIWWIWWIW',
        'WWIWWIWWIWWIW',
        'WWIWWIWWIWWIW',
        '.WIWWIWWIWWIW',
        '..IWWIWWIWWIW',
      ],
    },
    // 滝つぼの しぶき
    { mirror: true, x: 1, y: 27, rows: ['cc.', '.cc'] },
    // からだ
    {
      mirror: true,
      y: 9,
      rows: [
        '.........AAAAAAA',
        '.......AAAAAAAAA',
        '......AAAAAAAAAA',
        '.....AAAAAAAAAAA',
        '....oooAAAAAAAAA',
        '...AAAAooAAAAAAA',
        '...AWWoAAAAAAAAA',
        '...AWWoAAAAAAAAA',
        '..AAAAAAAAAAAAAA',
        '..AAAAAAAAAAAAAA',
        '..AApAAAAAoooooo',
        '..AAAAAAAAAAoooo',
        '..AAAAAAAAAAAAAA',
        '..AAAAAAAAAAAAAA',
        '...AAAAAAAAAAAAA',
        '...AAAAAAAAAAAAA',
        '....AAAAAAAAAAAA',
        '.....AAAAAAAAAAA',
        '......AAAAAAAAAA',
        '.......AAAAAAAAA',
        '........AAAAAAAA',
      ],
    },
    // 大きな ひれ
    { mirror: true, x: 1, y: 22, rows: ['.SS.', 'SSSS', 'SSSS', '.SSS', '..SS'] },
  ],
};

/**
 * ウメボシヨコヅナ（中ボス）：南高梅の うめぼしの 大横綱。太い 肩と うで、しこを ふむ 足、
 * 太い 白い つな、大きな 梅の 花の けしょうまわし、するどい 目、王冠は へたの 上（ツチ → ヒノ）
 */
const umeboshiYokozuna: MonsterDesign = {
  size: 40,
  colors: {
    R: NQ.red,
    r: NQ.brick,
    A: NQ.apricot,
    W: NQ.white,
    c: NQ.cloud,
    V: NQ.violet,
    G: NQ.gold,
    Q: NQ.ochre,
    K: NQ.bark,
    E: NQ.leaf,
    Y: NQ.cream,
  },
  rim: { [NQ.red]: NQ.brick, [NQ.violet]: NQ.indigo, [NQ.gold]: NQ.ochre },
  rimDepth: 2,
  layers: [
    // しこを ふむ 足
    {
      mirror: true,
      y: 28,
      rows: [
        '.......RRRRRRR......',
        '......RRRRRRRR......',
        '.....RRRRRRRRR......',
        '....RRRRRRRRR.......',
        '...RRRRRRRRRR.......',
        '...RRRRRRRRR........',
        '..RRRRRRRRRR........',
        '..RRRRRRRRR.........',
        '..RRRRRRRRR.........',
        '.RRRRRRRRRRR........',
      ],
    },
    // 太い うでと こぶし
    {
      mirror: true,
      y: 15,
      rows: [
        '...RRRR.............',
        '..RRRRR.............',
        '.RRRRRR.............',
        '.RRRRR..............',
        '.RRRRR..............',
        '.RRRRRR.............',
        '.RRRRRR.............',
        '..RRRRR.............',
        '..RRRR..............',
      ],
    },
    // うめぼしの からだ と するどい 顔
    {
      mirror: true,
      y: 6,
      rows: [
        '..............RRRRRR',
        '............RRRRRRRR',
        '..........RRRRRRRRRR',
        '.........RRRRRRRRRRR',
        '........RRRRRRRRRRRR',
        '.......RRRRRRRRRRRRR',
        '.......oooRRRRRRRRRR',
        '......RRRRoooRRRRRRR',
        '......RRooooRRRRRRRR',
        '.....RRRWWooRRRRRRRR',
        '.....RRRWWooRRRRRRRR',
        '.....RRRRRRRRRRRRRRR',
        '.....RRRRRRRRRRRRRRR',
        '.....RRRRRRRRRoooooo',
        '.....RRRRRRRRRRooooo',
        '.....RRRRRRRRRRRoooo',
        '.....RRRRRRRRRRRRRRR',
        '.....RRRRRRRRRRRRRRR',
        '......RRRRRRRRRRRRRR',
        '......RRRRRRRRRRRRRR',
        '.......RRRRRRRRRRRRR',
        '........RRRRRRRRRRRR',
      ],
    },
    // 太い つな
    { mirror: true, x: 6, y: 24, rows: ['WWcWWcWWcWWcWW', 'cWWcWWcWWcWWcW'] },
    // 梅の 花の けしょうまわし
    {
      mirror: true,
      x: 13,
      y: 26,
      rows: [
        'GGGGGGG',
        'GVVVVVV',
        'GVVWWVV',
        'GVWWWWW',
        'GVWWWYY',
        'GVWWWWW',
        'GVVWWVV',
        'GVVVVVV',
        'GGGGGGG',
      ],
    },
    // 王冠（金と 赤い 宝石）と へた
    {
      mirror: true,
      y: 1,
      rows: [
        '................G..G',
        '................GGGG',
        '................GGGR',
        '................QQQQ',
        '..................KK',
      ],
    },
    // 葉
    { x: 24, y: 2, rows: ['..EE', '.EEE', 'EEE.'] },
    // すっぱさの ゆげ
    { mirror: true, x: 2, y: 5, rows: ['.cc..', '.cc..', '.....', 'cc...', 'cc...'] },
    // しこの 土ぼこり
    { mirror: true, x: 13, y: 35, rows: ['cc..', '.cc.'] },
    // うでの つけねの かげ
    { mirror: true, x: 5, y: 17, rows: ['r', 'r', 'r', 'r', 'r'] },
    // つや と しわ
    { x: 12, y: 9, rows: ['AAA', 'AA.'] },
    { x: 26, y: 12, rows: ['.rr', 'r..'] },
    { x: 7, y: 22, rows: ['rr.', '..r'] },
    { x: 30, y: 20, rows: ['.r', 'r.'] },
  ],
};

/** ウメボシヨコヅナ（フィールドに立つ 32×32） */
const umeboshiYokozunaField: MonsterDesign = {
  size: 32,
  colors: {
    R: NQ.red,
    r: NQ.brick,
    A: NQ.apricot,
    W: NQ.white,
    c: NQ.cloud,
    V: NQ.violet,
    G: NQ.gold,
    K: NQ.bark,
    E: NQ.leaf,
  },
  rim: { [NQ.red]: NQ.brick, [NQ.gold]: NQ.ochre },
  layers: [
    // 足
    {
      mirror: true,
      y: 22,
      rows: [
        '......RRRRR.....',
        '.....RRRRRR.....',
        '....RRRRRRR.....',
        '....RRRRRR......',
        '...RRRRRRR......',
        '...RRRRRRR......',
        '..RRRRRRR.......',
        '..RRRRRRRR......',
      ],
    },
    // うで
    {
      mirror: true,
      y: 12,
      rows: [
        '..RRR...........',
        '.RRRR...........',
        '.RRRR...........',
        '.RRRR...........',
        '.RRRRR..........',
        '.RRRRR..........',
        '..RRRR..........',
      ],
    },
    // からだ と 顔
    {
      mirror: true,
      y: 5,
      rows: [
        '...........RRRRR',
        '.........RRRRRRR',
        '........RRRRRRRR',
        '.......RRRRRRRRR',
        '......RRRRRRRRRR',
        '.....oooRRRRRRRR',
        '.....RoooRRRRRRR',
        '.....RWWoRRRRRRR',
        '....RRRRRRRRRRRR',
        '....RRRRRRRRRRRR',
        '....RRRRRRRooooo',
        '....RRRRRRRRoooo',
        '....RRRRRRRRRRRR',
        '.....RRRRRRRRRRR',
        '.....RRRRRRRRRRR',
        '......RRRRRRRRRR',
        '.......RRRRRRRRR',
      ],
    },
    // つな
    { mirror: true, x: 5, y: 18, rows: ['WcWcWcWcWcW', 'cWcWcWcWcWc'] },
    // けしょうまわし
    {
      mirror: true,
      x: 10,
      y: 20,
      rows: ['GGGGGG', 'GVVVVV', 'GVWWWW', 'GVWWWW', 'GVVVVV', 'GGGGGG'],
    },
    // 王冠 と へた
    {
      mirror: true,
      y: 1,
      rows: ['............G..G', '............GGGG', '............GGGR', '..............KK'],
    },
    // 葉
    { x: 19, y: 2, rows: ['.EE', 'EE.'] },
    // つや
    { x: 8, y: 7, rows: ['AA'] },
  ],
};

/**
 * クロシオリュウの 左半分：長く するどい 金の 角、白い なみの たてがみ、口を あけた 大きな 頭、
 * うねる ひげ、つめの ある 前足、大波から 立ちあがる からだ
 */
const RYU_HORN = [
  '.....GG.................',
  '.....GGG................',
  '......GGG...............',
  '.......GGG..............',
  '........GGG.............',
  '.........GGGG...........',
  '..........GGGG..........',
  '...........GGGG.........',
  '............GGGG........',
];
const RYU_CROWN = [
  '....................G..G',
  '....................GGGG',
  '....................GGGR',
  '....................QQQQ',
];
const RYU_MANE = [
  '.........WWW............',
  '.......WWWWW............',
  '......WWWWWW............',
  '....WWWWWWWW............',
  '.....WWWWWWW............',
  '...WWWWWWWWW............',
  '....WWWWWWWW............',
  '..WWWWWWWWWW............',
  '...WWWWWWWWW............',
  '.WWWWWWWWWWW............',
  '...WWWWWWWWW............',
  '..WWWWWWWWWW............',
  '....WWWWWWWW............',
  '...WWWWWWWWW............',
  '.....WWWWWWW............',
  '......WWWWWW............',
  '.......WWWWW............',
  '........WWWW............',
  '.........WWW............',
];
const RYU_HEAD = [
  '..................NNNNNN',
  '................NNNNNNNN',
  '..............NNBBBBBBBB',
  '............NNBBBBBBBBBB',
  '...........NBBBBBBBBBBBB',
  '..........NBBBBBBBBBBBBB',
  '.........NBBNNNNNBBBBBBB',
  '........NBBBooooBBBBBBBB',
  '........NBBBWWooBBBBBBBB',
  '........NBBBWWooBBBBBBBB',
  '........NBBBBBBBBBBBBBBB',
  '........NBBBBBBBBBBBBBBB',
  '.........NBBBBBBBBBBBBBB',
  '.........NBBBBBBoooooooo',
  '..........NBBBBBWoooWooo',
  '..........NBBBBBoooooooo',
  '...........NBBBBoooooooo',
  '...........NBBBBBBBBBBBB',
  '............NBBBBBBBBBBB',
  '.............NBBBBBBBBBB',
];
const RYU_BODY = [
  '...........NBBBBBBBBBBBB',
  '..........NBBBBBBBBBBBBB',
  '.........NBBBBBBBBBBBBBB',
  '.........NBBBBBBBSSSSSSS',
  '........NBBBBBBBBIIIIIII',
  '........NBBBBBBBBSSSSSSS',
  '.......NBBBBBBBBBIIIIIII',
  '.......NBBBBBBBBBSSSSSSS',
  '......NBBBBBBBBBBIIIIIII',
  '......NBBBBBBBBBBSSSSSSS',
  '.....NBBBBBBBBBBBIIIIIII',
];
const RYU_WAVE = [
  '..WWW...................',
  '.WWIIW..................',
  '.WIBBIW.................',
  '.WBBBBIW................',
  '.BBBBBBIW.....WWW.......',
  '.BBBBBBBIW...WWIIW......',
  '.ABBBBBBBIW.WIBBBIW.....',
  '.ABBBBBBBBIWIBBBBBIW....',
  '.ABBBBBBBBBBBBBBBBBIWWWW',
  '.BBBBBBBBBBBBBBBBBBBBIII',
  '.BBNBBBBBBBBBBNBBBBBBBBB',
  '.BBBNNBBBBBBBBBNNBBBBBBB',
  '..BBBBBBBBBBBBBBBBBBBBBB',
  '..NBBBBBBNBBBBBBBBNBBBBB',
  '...BBBBBBBNNBBBBBBBNNBBB',
  '...NNNNNNNNNNNNNNNNNNNNN',
];
const RYU_ARM = [
  '........BBBB',
  '.......BBBBBB',
  '......BBBBBBB',
  '.....BBBBBBB',
  '....ABBBBBB',
  '...ABBBBBB',
  '..ABBBBBB',
  '..BBBBBBB',
  '.WBBBBBB',
  'WWBBBBB',
  'WWBBBB',
  '.WWBB',
];
const RYU_WHISKER = [
  '.......AA',
  '.....AA..',
  '...AA....',
  '..AA.....',
  '.AA......',
  '.AA......',
  '..AA.....',
  '...AA....',
];

const ryuColors = {
  N: NQ.navy,
  B: NQ.blue,
  A: NQ.azure,
  S: NQ.sky,
  I: NQ.ice,
  W: NQ.white,
  G: NQ.gold,
  Q: NQ.ochre,
  R: NQ.red,
};

const ryuLayers = [
  { mirror: true, y: 1, rows: RYU_HORN },
  { mirror: true, y: 2, rows: RYU_CROWN },
  { mirror: true, y: 9, rows: RYU_MANE },
  { mirror: true, y: 6, rows: RYU_HEAD },
  { mirror: true, y: 26, rows: RYU_BODY },
  { mirror: true, y: 31, rows: RYU_WAVE },
  { mirror: true, x: 1, y: 26, rows: RYU_ARM },
  { mirror: true, x: 1, y: 19, rows: RYU_WHISKER },
  // むねの うろこの つや
  { x: 20, y: 27, rows: ['AA', 'A.'] },
];

/**
 * クロシオリュウ（県ボス）：潮岬の おきを ながれる 黒潮の 海竜。大波から 立ちあがり、口を あけて ほえる。
 * 長く するどい 金の 角の あいだに 王冠、白い なみの たてがみ、うねる ひげ、つめの ある 前足（ミズ → カゼ）
 */
const kuroshioRyu: MonsterDesign = {
  size: 48,
  colors: ryuColors,
  rim: { [NQ.blue]: NQ.navy, [NQ.gold]: NQ.ochre, [NQ.white]: NQ.cloud },
  rimDepth: 2,
  layers: ryuLayers,
};

/** クロシオリュウ 後半（カゼ）：からだが 青みどりに かわり、大きな 風の うずと しぶきが まきおこる */
const kuroshioRyuP0: MonsterDesign = {
  ...kuroshioRyu,
  colors: { ...ryuColors, B: NQ.teal, A: NQ.aqua, S: NQ.mint, M: NQ.mint },
  rim: { [NQ.teal]: NQ.navy, [NQ.gold]: NQ.ochre, [NQ.white]: NQ.cloud },
  layers: [
    ...ryuLayers,
    // 風の うず
    { mirror: true, x: 1, y: 4, rows: ['.MMM.', 'M...M', 'M.MM.', 'M.M..', '.MM..'] },
    // 海を はしる 風の すじ
    { mirror: true, x: 1, y: 39, rows: ['.MMMM...', 'MM..MMM.'] },
    { mirror: true, x: 2, y: 43, rows: ['MMMM....', '...MMMM.'] },
  ],
};

/**
 * 徳川吉宗：大きな 金の 鍬形（くわがた）と 葵（あおい）の 前立て、紀州（木の 国）の みどりの よろい。
 * 大きな 肩の よろい（そで）と 黒い 陣羽織、するどい まゆ、まわりに 金の 光（モリ）
 */
const tokugawaYoshimune = lord(
  [
    '....GYG.................',
    '....GYYG................',
    '.....GYYG...............',
    '......GYYG..........GGGG',
    '.......GYYG........GNNNY',
    '........GYYG......GNNYYY',
    '.........GYYGG....GNNNYY',
    '...........GYYGG..GYYNNN',
    '.............GYYGGGYYYNN',
    '...............GGGGGGGGG',
    ...HELMET,
    ...FACE,
  ],
  {
    N: NQ.night,
    L: NQ.slate,
    K: NQ.forest,
    S: NQ.green,
    G: NQ.gold,
    Y: NQ.yellow,
    R: NQ.red,
    T: NQ.forest,
    H: NQ.bark,
    C: NQ.cream,
  },
  { [NQ.green]: NQ.forest },
  [
    // 陣羽織（よろいの 上に はおる 黒い ベスト。むねの まえが あく）
    { mirror: true, x: 16, y: 22, rows: ['NNN', 'NNN', 'NNN', 'NNN', 'NNN', 'NNN', 'NNN', 'NN.', 'NN.'] },
    // するどい まゆ
    { mirror: true, x: 18, y: 15, rows: ['o..', 'Foo', 'FWo'] },
    // まわりの 金の 光
    { x: 2, y: 8, rows: ['GC', 'CG'] },
    { x: 43, y: 6, rows: ['CG', 'GC'] },
    { x: 1, y: 11, rows: ['CG', 'GC'] },
    { x: 45, y: 13, rows: ['GC', 'CG'] },
  ],
);

export const WAKAYAMA: Readonly<Record<string, MonsterDesign>> = {
  'wakayama-koromikan': koromikan,
  'wakayama-morimori-mikan': morimoriMikan,
  'wakayama-kankantan': kankantan,
  'wakayama-bincho-homura': binchoHomura,
  'wakayama-toudain': toudain,
  'wakayama-mamori-toudai': mamoriToudai,
  'wakayama-shibukin': shibukin,
  'wakayama-ootakimaru': ootakimaru,
  'wakayama-midboss-umeboshi-yokozuna': umeboshiYokozuna,
  'wakayama-midboss-umeboshi-yokozuna.field': umeboshiYokozunaField,
  'wakayama-boss-kuroshio-ryu': kuroshioRyu,
  'wakayama-boss-kuroshio-ryu.p0': kuroshioRyuP0,
  'wakayama-lastboss-tokugawa-yoshimune': tokugawaYoshimune,
};
