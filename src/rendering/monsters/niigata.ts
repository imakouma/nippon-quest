/** 新潟県の モンスター（手描き。docs/06 §4・§6.3〜6.5 の 規格） */
import { NQ } from '../palette';
import type { MonsterDesign } from './design';
import { lord } from './lastbosses';

/**
 * 花火の 光：まん中から のびる とげとげ。fill = 中、tips = とげの 先の 色（左右で そろうように えらぶ）。
 * 外周 1 ドットは 空ける
 */
function hanabi(
  size: number,
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  n: number,
  fill: string,
  tips: string,
): string[] {
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => {
      if (x < 1 || y < 1 || x > size - 2 || y > size - 2) return '.';
      const d = Math.hypot(x - cx, y - cy);
      const k = ((Math.atan2(x - cx, cy - y) + Math.PI) / (2 * Math.PI)) * n;
      const u = k % 1;
      const r = rIn + (rOut - rIn) * (1 - 2 * Math.min(u, 1 - u));
      if (d > r) return '.';
      const i = Math.round(k) % n;
      return d > r - 3 ? tips[Math.min(i, n - i) % tips.length]! : fill;
    }).join(''),
  );
}

// ───────────────────────── 通常 ─────────────────────────

/** イナホン：たて長の お米の つぶ。頭から 稲穂が のびて 右へ おもそうに たれ、左に 葉が 1 まい（モリ） */
const inahon: MonsterDesign = {
  size: 32,
  colors: {
    P: NQ.paper,
    W: NQ.white,
    p: NQ.blush,
    Y: NQ.gold,
    Q: NQ.ochre,
    G: NQ.green,
    L: NQ.leaf,
    S: NQ.sand,
  },
  rim: { [NQ.paper]: NQ.cloud },
  layers: [
    // 稲穂（くき・つぶつぶの 穂）と 葉
    {
      x: 10,
      rows: [
        '................',
        '.......GGGYY....',
        'L.....G..YYQY...',
        'LL...G....QYYY..',
        '.GL..G....YQYQY.',
        '..GL.G.....YYYQ.',
        '...GLG.....QYQYY',
        '.....G......YYQY',
        '.............QYY',
        '.............YQ.',
        '..............Q.',
      ],
    },
    // お米の つぶの からだ・小さな 手・足
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '.............PPP',
        '............PPPP',
        '...........PPPPP',
        '..........PPPPPP',
        '.........PPPPPPP',
        '........PPPPPPPP',
        '........PPPPPPPP',
        '........PPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '.......PPPPPPPPP',
        '.....PPPPPPPPPPP',
        '.....PPPPPPPPPPP',
        '......PPPPPPPPPP',
        '.......PPPPPPPPP',
        '........PPPPPPPP',
        '........PPPPPPPP',
        '........PPPPPPPP',
        '.........PPPPPPP',
        '..........PPPPPP',
        '...........PPPPP',
        '............PPPP',
        '..........SSSPPP',
        '.........SSSS...',
      ],
    },
    // かお
    {
      mirror: true,
      y: 15,
      rows: [
        '...........WW...',
        '...........Wo...',
        '...........Wo...',
        '.........pp.....',
        '..............oo',
      ],
    },
    // つや（左上）
    { x: 11, y: 9, rows: ['.W', 'W.', 'W.'] },
  ],
};

/** ヒスイコロ：糸魚川の 海岸を ころがる ヒスイの 石。角を おとした 四角、上の 面は 明るく、白い すじと ひび（ツチ） */
const hisuiKoro: MonsterDesign = {
  size: 32,
  colors: {
    J: NQ.leaf,
    g: NQ.green,
    l: NQ.lime,
    s: NQ.sprout,
    W: NQ.white,
    P: NQ.paper,
    p: NQ.blush,
    T: NQ.tan,
    B: NQ.brown,
  },
  rim: { [NQ.leaf]: NQ.green, [NQ.tan]: NQ.brown },
  rimDepth: 2,
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
        '.........lllllll',
        '........lsslllll',
        '.......lssllllll',
        '......llslllllll',
        '.....JlllJJJJJJJ',
        '....JJJJJJJJJJJJ',
        '....JJJJJJJJJJJJ',
        '....JJJJJJJJJJJJ',
        '....JJJJJJJJJJJJ',
        '....JJJJJJJJJJJJ',
        '....JJJJJJJJJJJJ',
        '....JJJJJJJJJJJJ',
        '....JJJJJJJJJJJJ',
        '....JJJJJJJJJJJJ',
        '....JJJJJJJJJJJJ',
        '....JJJJJJJJJJJJ',
        '.....JJJJJJJJJJJ',
        '......JJJJJJJJJJ',
        '.......JJJJJJJJJ',
        '........JJJJJJJJ',
        '........TTT..JJJ',
        '.......TTTT.....',
        '.......BBBB.....',
      ],
    },
    // 白い すじ（ヒスイの もよう）
    { x: 5, y: 13, rows: ['P..', 'PP.', '.PP', '..P'] },
    { x: 22, y: 15, rows: ['...P', '..PP', '.PP.', 'P...'] },
    { x: 6, y: 21, rows: ['PP...', '.PPP.', '...PP'] },
    // ひび（右上の 面の さかい）
    { x: 20, y: 12, rows: ['.g.', 'g.g', '...', 'g..'] },
    // かお
    {
      mirror: true,
      y: 15,
      rows: [
        '..........WW....',
        '..........Wo....',
        '..........Wo....',
        '........pp...o..',
        '..............oo',
      ],
    },
    // つや と きらり
    { x: 6, y: 13, rows: ['W', 'W'] },
    { x: 2, y: 4, rows: ['.W.', 'WsW', '.W.'] },
  ],
};

/** コトキ：佐渡の トキの ひな。目の まわりが 赤い かお、下へ まがった 黒い くちばし（先は 赤）、とき色の つばさ（カゼ） */
const kotoki: MonsterDesign = {
  size: 32,
  colors: {
    W: NQ.white,
    P: NQ.blush,
    A: NQ.apricot,
    R: NQ.red,
    N: NQ.night,
    n: NQ.slate,
    p: NQ.blush,
    E: NQ.paper,
  },
  rim: { [NQ.white]: NQ.cloud, [NQ.blush]: NQ.berry },
  layers: [
    // とき色の つばさ（からだの よこから のぞく）
    {
      mirror: true,
      y: 9,
      rows: [
        '.A..............',
        '.AP.............',
        '.APP............',
        '.APPP...........',
        '.APPPW..........',
        '..APPPW.........',
        '..APPPWW........',
        '...APPPW........',
        '...APPPW........',
        '....APPW........',
        '.....APW........',
        '......A.........',
      ],
    },
    // かざり羽・まるい からだ・足
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '..........W.....',
        '..........WW..W.',
        '...........WW.WW',
        '...........WWWWW',
        '.............WWW',
        '..........WWWWWW',
        '.........WWWWWWW',
        '........WWWWWWWW',
        '.......WWWWWWWWW',
        '......WWWWWWWWWW',
        '......WWWWWWWWWW',
        '.....WWWWWWWWWWW',
        '.....WWWWWWWWWWW',
        '.....WWWWWWWWWWW',
        '.....WWWWWWWWWWW',
        '....WWWWWWWWWWWW',
        '.....WWWWWWWWWWW',
        '.....WWWWWWWWWWW',
        '.....WWWWWWWWWWW',
        '.....WWWWWWWWWWW',
        '......WWWWWWWWWW',
        '......WWWWWWWWWW',
        '.......WWWWWWWWW',
        '........WWWWWWWW',
        '.........WWWWWWW',
        '..........WWWWWW',
        '.............WWW',
        '............RR..',
        '...........RRRR.',
      ],
    },
    // 赤い かお（目の まわり）と 目
    {
      mirror: true,
      y: 10,
      rows: [
        '...........RRRRR',
        '..........RRRRRR',
        '.........RRWWRRR',
        '.........RRWoRRR',
        '.........RRWoRRR',
        '..........RRRRRR',
        '...........RRRRR',
        '..........pp....',
      ],
    },
    // くちばし（下へ まがる。先は 赤）
    { x: 14, y: 14, rows: ['nNN', 'NNN', 'NNN', '.NN', '.NN', '..NN', '..NR', '...R'] },
    // むねの ふわふわ
    { x: 10, y: 24, rows: ['E.E'] },
    { x: 20, y: 24, rows: ['E.E'] },
  ],
};

/** シオビキン：村上の 塩引き鮭。たて長の 鮭の からだ、白い おなか、頭に わらなわ、下に 大きな 尾びれ（ミズ） */
const shiobikin: MonsterDesign = {
  size: 32,
  colors: {
    A: NQ.apricot,
    V: NQ.vermilion,
    b: NQ.brick,
    N: NQ.navy,
    n: NQ.denim,
    P: NQ.paper,
    W: NQ.white,
    S: NQ.sand,
    T: NQ.tan,
    p: NQ.blush,
  },
  rim: { [NQ.apricot]: NQ.vermilion, [NQ.navy]: NQ.ink },
  layers: [
    // わらなわ（頭の 上）
    { x: 12, y: 2, rows: ['SSTSSTSS', 'TSSTSSTS'] },
    // からだ（せなかは こい 青、おなかは だいだい）
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '................',
        '................',
        '..........NNNNNN',
        '........NNNNNNNN',
        '.......NNNNNNNNN',
        '......NNNNNNNNNN',
        '......NNNNNNNNNN',
        '.....NNNNNNNNNNN',
        '.....NnnnnnAAAAA',
        '....AAAAAAAAAAAA',
        '....AAAAAAAAAAAA',
        '....AAAAAAAAAAAA',
        '....AAAAAAAAAAAA',
        '....AAAAAAAAAAAA',
        '....AAAAAAAAAAAA',
        '.....AAAAAAAAAAA',
        '.....AAAAAAAAAAA',
        '.....AAAAAAAAAAA',
        '......AAAAAAAAAA',
        '......AAAAAAAAAA',
        '.......AAAAAAAAA',
        '........AAAAAAAA',
        '.........AAAAAAA',
        '..........VVVVVV',
        '.........VVVVVVV',
        '........VVVVVVVV',
        '.......VVVVVVVVV',
        '......VVVVVVV...',
        '......VVVV......',
      ],
    },
    // 白い おなか
    {
      mirror: true,
      y: 20,
      rows: ['........PPPPPPPP', '.........PPPPPPP', '.........PPPPPPP', '..........PPPPPP'],
    },
    // よこの ひれ
    { x: 1, y: 17, rows: ['..VV', '.VVV', 'VVVV', '.VVb'] },
    { x: 27, y: 17, rows: ['VV..', 'VVV.', 'VVVV', 'bVV.'] },
    // かお（目・ほっぺ・口）
    {
      mirror: true,
      y: 12,
      rows: [
        '..........WW....',
        '..........Wo....',
        '..........Wo....',
        '........pp......',
        '.............ooo',
      ],
    },
    // つや
    { x: 8, y: 13, rows: ['.W', 'W.'] },
  ],
};

/** キタカゼザケ（シオビキンの しんか）：北風を まとって とびはねる 大きな 鮭。赤い すじと きりっと した まゆ（ミズ） */
const kitakazeZake: MonsterDesign = {
  size: 32,
  colors: {
    A: NQ.apricot,
    V: NQ.vermilion,
    b: NQ.brick,
    N: NQ.navy,
    n: NQ.denim,
    P: NQ.paper,
    W: NQ.white,
    M: NQ.mint,
    I: NQ.ice,
    p: NQ.blush,
  },
  rim: { [NQ.apricot]: NQ.vermilion, [NQ.navy]: NQ.ink },
  layers: [
    // 北風（うしろ）
    { x: 1, y: 6, rows: ['.MMM.', 'M....', 'M..MM', '.MMI.'] },
    { x: 26, y: 20, rows: ['.MMM.', '....M', 'MM..M', '.IMM.'] },
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '.........NNNNNNN',
        '.......NNNNNNNNN',
        '......NNNNNNNNNN',
        '.....NNNNNNNNNNN',
        '.....NNNNNNNNNNN',
        '....NNNNNNNNNNNN',
        '....NnnnnnnAAAAA',
        '...AAAAAAAAAAAAA',
        '...AAAAAAAAAAAAA',
        '...AAAAAAAAAAAAA',
        '...AAAAAAAAAAAAA',
        '...AAAAAAAAAAAAA',
        '...AAAAAAAAAAAAA',
        '...AAAAAAAAAAAAA',
        '....AAAAAAAAAAAA',
        '....AAAAAAAAAAAA',
        '....AAAAAAAAAAAA',
        '.....AAAAAAAAAAA',
        '.....AAAAAAAAAAA',
        '......AAAAAAAAAA',
        '.......AAAAAAAAA',
        '........AAAAAAAA',
        '.........VVVVVVV',
        '........VVVVVVVV',
        '.......VVVVVVVVV',
        '......VVVVVVVVVV',
        '.....VVVVVVVVVV.',
        '.....VVVVVVV....',
        '.....VVVV.......',
      ],
    },
    // 白い おなかと 赤い すじ
    {
      mirror: true,
      y: 19,
      rows: ['.......PPPPPPPPP', '.......PPPPPPPPP', '........PPPPPPPP', '.........PPPPPPP'],
    },
    { mirror: true, y: 13, rows: ['....bbbbbbbbbbbb'] },
    // 大きな よこひれ
    { x: 1, y: 16, rows: ['...VV', '..VVV', '.VVVV', 'VVVVV', '.VVbb'] },
    { x: 26, y: 16, rows: ['VV...', 'VVV..', 'VVVV.', 'VVVVV', 'bbVV.'] },
    // かお（きりっと した まゆ）
    {
      mirror: true,
      y: 8,
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
    { x: 7, y: 11, rows: ['.W', 'W.'] },
  ],
};

// ───────────────────────── しんか ─────────────────────────

/** ミノリマル（イナホンの しんか）：実った 稲穂を 左右に たらした かぶと、わらなわの おび、米俵の たて（モリ） */
const minoriMaru: MonsterDesign = {
  size: 32,
  colors: {
    P: NQ.paper,
    W: NQ.white,
    p: NQ.blush,
    Y: NQ.gold,
    Q: NQ.ochre,
    G: NQ.green,
    S: NQ.sand,
    T: NQ.tan,
    B: NQ.brown,
  },
  rim: { [NQ.paper]: NQ.cloud, [NQ.sand]: NQ.tan },
  layers: [
    // 左右に たれた 稲穂の かざり
    {
      mirror: true,
      y: 1,
      rows: [
        '........QYYYGG..',
        '......QYQYQ..GG.',
        '.....YQYQ.....G.',
        '....QYQY......GG',
        '....YQYQ........',
        '....QYQ.........',
        '.....Q..........',
      ],
    },
    // からだ・わらなわの おび・足
    {
      mirror: true,
      rows: [
        '................',
        '................',
        '................',
        '................',
        '................',
        '..............PP',
        '............PPPP',
        '..........PPPPPP',
        '.........PPPPPPP',
        '........PPPPPPPP',
        '.......PPPPPPPPP',
        '......PPPPPPPPPP',
        '......PPPPPPPPPP',
        '.....PPPPPPPPPPP',
        '.....PPPPPPPPPPP',
        '.....PPPPPPPPPPP',
        '....PPPPPPPPPPPP',
        '....PPPPPPPPPPPP',
        '....PPPPPPPPPPPP',
        '....PPPPPPPPPPPP',
        '....STSTSTSTSTST',
        '....TSTSTSTSTSTS',
        '....PPPPPPPPPPPP',
        '....PPPPPPPPPPPP',
        '.....PPPPPPPPPPP',
        '.....PPPPPPPPPPP',
        '......PPPPPPPPPP',
        '.......PPPPPPPPP',
        '........PPP.....',
        '.......SSSS.....',
        '.......BBBB.....',
      ],
    },
    // かお（きりっと した まゆ）
    {
      mirror: true,
      y: 11,
      rows: [
        '.........o......',
        '..........oo....',
        '..........WW....',
        '..........Wo....',
        '..........Wo....',
        '........pp......',
        '..............oo',
      ],
    },
    // 米俵の たて（左手。3 本の なわ、左の はしは まるい ふた）
    {
      x: 1,
      y: 17,
      rows: [
        '...SBSSBSSBo',
        '.TTSBSSBSSBo',
        'TTTSBSSBSSBo',
        'TBTSBSSBSSBo',
        'TTTSBSSBSSBo',
        'TBTSBSSBSSBo',
        'TTTSBSSBSSBo',
        '.TTTBTTBTTBo',
        '...TBTTBTTo.',
      ],
    },
    // 右手（こぶしを あげる）
    { x: 27, y: 14, rows: ['PPP', 'PPP', '.PP', '.PP', 'PP.'] },
    // つや（左上）
    { x: 9, y: 8, rows: ['.W', 'W.'] },
  ],
};

/** ヒスイの 結晶（とがった 六角の 柱。左の 面が 明るく、右の 面が こい） */
const CRYSTAL = ['..l..', '.llJ.', '.lsJg', 'llsJg', 'lsJJg', 'lsJJg', 'lJJJg'];
const CRYSTAL_S = ['.l.', 'llJ', 'lsg', 'lJg', 'lJg'];

/** ヒスイゴロウ（ヒスイコロの しんか）：灰色の 岩の からだに ヒスイの 結晶が 生えた ゴロウ。むねに 大きな ヒスイ（ツチ） */
const hisuiGoro: MonsterDesign = {
  size: 32,
  colors: {
    J: NQ.leaf,
    g: NQ.green,
    l: NQ.lime,
    s: NQ.sprout,
    W: NQ.white,
    p: NQ.blush,
    R: NQ.silver,
    r: NQ.gray,
    K: NQ.slate,
    P: NQ.cloud,
  },
  rim: { [NQ.silver]: NQ.gray },
  rimDepth: 2,
  layers: [
    // 頭と かたの 結晶
    { x: 13, y: 1, rows: CRYSTAL },
    { x: 9, y: 4, rows: CRYSTAL_S },
    { x: 20, y: 4, rows: CRYSTAL_S },
    { x: 2, y: 7, rows: CRYSTAL_S },
    { x: 27, y: 7, rows: CRYSTAL_S },
    // 岩の からだ（かた・うで・足）
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
        '.........RRRRRRR',
        '.......RRRRRRRRR',
        '......RRRRRRRRRR',
        '.RRRR.RRRRRRRRRR',
        '.RRRRRRRRRRRRRRR',
        '.RRRRRRRRRRRRRRR',
        '.RRRRRRRRRRRRRRR',
        '.RRRRoRRRRRRRRRR',
        '..RRRoRRRRRRRRRR',
        '..RRRoRRRRRRRRRR',
        '..RRRoRRRRRRRRRR',
        '..RRRoRRRRRRRRRR',
        '.RRRRoRRRRRRRRRR',
        '.RRRRRoRRRRRRRRR',
        '.RRRRRoRRRRRRRRR',
        '..RRR.RRRRRRRRRR',
        '......RRRRRRRRRR',
        '.......RRRRRRRRR',
        '.......RRRRR....',
        '.......RRRRR....',
        '......RRRRRR....',
        '......RRRRRR....',
        '......KKKKKK....',
      ],
    },
    // むねの 大きな ヒスイ
    {
      mirror: true,
      y: 19,
      rows: [
        '.............lll',
        '............llsl',
        '...........lssJJ',
        '...........lsJJJ',
        '...........lJJJJ',
        '............JJJJ',
        '.............JJJ',
      ],
    },
    { x: 17, y: 21, rows: ['.g', 'gg', 'gg', 'g.'] },
    { x: 18, y: 20, rows: ['g', 'g', 'g', 'g', 'g'] },
    // 岩の ひび
    { x: 8, y: 10, rows: ['.K', 'K.', '.K'] },
    { x: 23, y: 23, rows: ['K.', '.K', 'K.'] },
    // かお（きりっと）
    {
      mirror: true,
      y: 11,
      rows: [
        '.........o......',
        '..........oo....',
        '..........WW....',
        '..........Wo....',
        '..........Wo....',
        '........pp......',
        '.............ooo',
      ],
    },
    // 岩の つや
    { x: 8, y: 8, rows: ['.PP', 'P..'] },
    { x: 2, y: 11, rows: ['PP'] },
  ],
};

/** アケボノトキ（コトキの しんか）：ななめ上へ 大きく ひろげた とき色の つばさ（先は 指のように わかれる）、長い かざり羽と くちばし（カゼ） */
const akebonoToki: MonsterDesign = {
  size: 32,
  colors: {
    W: NQ.white,
    P: NQ.blush,
    A: NQ.apricot,
    O: NQ.vermilion,
    R: NQ.red,
    N: NQ.night,
    n: NQ.slate,
    p: NQ.blush,
    E: NQ.paper,
  },
  rim: { [NQ.white]: NQ.cloud, [NQ.blush]: NQ.berry },
  layers: [
    // つばさ（肩から 左右 ななめ上へ。うらは とき色、ふちは だいだい）
    {
      mirror: true,
      y: 2,
      rows: [
        '.O..............',
        '.OA.............',
        '.OAA............',
        '..OAP...........',
        '.OAPPW..........',
        '..OAPPW.........',
        '.OAPPPWW........',
        '..OAPPPWW.......',
        '...OAPPPWW......',
        '..OAAPPPPWW.....',
        '...OAPPPPPWW....',
        '....OAPPPPPW....',
        '.....OAPPPPW....',
        '......OAPPPW....',
        '.......AAPPW....',
        '........AP......',
      ],
    },
    // かざり羽（うしろへ 長く）・からだ・足
    {
      mirror: true,
      rows: [
        '................',
        '..........W.....',
        '.........WW...W.',
        '..........WW..WW',
        '...........WWWWW',
        '...........WWWWW',
        '..........WWWWWW',
        '.........WWWWWWW',
        '.........WWWWWWW',
        '.........WWWWWWW',
        '.........WWWWWWW',
        '.........WWWWWWW',
        '.........WWWWWWW',
        '........WWWWWWWW',
        '........WWWWWWWW',
        '........WWWWWWWW',
        '........WWWWWWWW',
        '.......WWWWWWWWW',
        '.......WWWWWWWWW',
        '.......WWWWWWWWW',
        '.......WWWWWWWWW',
        '........WWWWWWWW',
        '.........WWWWWWW',
        '..........WWWWWW',
        '...........WWWWW',
        '............WWWW',
        '............R..R',
        '............R..R',
        '...........RR.RR',
      ],
    },
    // 赤い かお と 目（きりっと）
    {
      mirror: true,
      y: 7,
      rows: [
        '...........oo...',
        '..........RRoRRR',
        '.........RRWWRRR',
        '.........RRWoRRR',
        '.........RRWoRRR',
        '..........RRRRRR',
        '...........RRRRR',
        '..........pp....',
      ],
    },
    // 長い くちばし
    { x: 14, y: 11, rows: ['nNN', 'NNN', 'NNN', '.NN', '.NN', '.NN', '..NN', '..NN', '..NR', '...R'] },
    // むねの ふわふわ
    { x: 11, y: 21, rows: ['E.E'] },
    { x: 19, y: 21, rows: ['E.E'] },
  ],
};

// ───────────────────────── 中ボス ─────────────────────────

/** サンシャクドン（中ボス）：長岡の 正三尺玉の 花火だま。うしろで 花火が ひらき、頭の 右で 導火線に 火花。王冠（ヒノ） */
const sanjakuDon: MonsterDesign = {
  size: 40,
  colors: {
    V: NQ.vermilion,
    b: NQ.brick,
    A: NQ.apricot,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    C: NQ.cream,
    W: NQ.white,
    Z: NQ.azure,
    L: NQ.leaf,
    T: NQ.tan,
    N: NQ.night,
  },
  rim: { [NQ.vermilion]: NQ.brick, [NQ.gold]: NQ.ochre },
  rimDepth: 2,
  layers: [
    // うしろで ひらく 花火
    { rows: hanabi(40, 19.5, 22, 12, 19, 14, 'C', 'GZLZ') },
    // かたの とげ（黒い 鉄）
    {
      mirror: true,
      y: 13,
      rows: [
        '..N.................',
        '.NNN................',
        '.NNNN...............',
        '..NNNN..............',
        '...NNN..............',
        '....NN..............',
      ],
    },
    // 花火だまの からだ（キャンバスいっぱい）
    {
      mirror: true,
      y: 8,
      rows: [
        '..............VVVVVV',
        '...........VVVVVVVVV',
        '.........VVVVVVVVVVV',
        '........VVVVVVVVVVVV',
        '.......VVVVVVVVVVVVV',
        '......VVVVVVVVVVVVVV',
        '.....VVVVVVVVVVVVVVV',
        '.....VVVVVVVVVVVVVVV',
        '....VVVVVVVVVVVVVVVV',
        '....VVVVVVVVVVVVVVVV',
        '...VVVVVVVVVVVVVVVVV',
        '...VVVVVVVVVVVVVVVVV',
        '...VVVVVVVVVVVVVVVVV',
        '..VVVVVVVVVVVVVVVVVV',
        '..VVVVVVVVVVVVVVVVVV',
        '..VVVVVVVVVVVVVVVVVV',
        '..VVVVVVVVVVVVVVVVVV',
        '..VVVVVVVVVVVVVVVVVV',
        '..VVVVVVVVVVVVVVVVVV',
        '...VVVVVVVVVVVVVVVVV',
        '...VVVVVVVVVVVVVVVVV',
        '...VVVVVVVVVVVVVVVVV',
        '....VVVVVVVVVVVVVVVV',
        '....VVVVVVVVVVVVVVVV',
        '.....VVVVVVVVVVVVVVV',
        '......VVVVVVVVVVVVVV',
        '.......VVVVVVVVVVVVV',
        '.........VVVVVVVVVVV',
        '...........bbbbVVVVV',
        '.........bbbbbbbbbbb',
        '.........bbbbbbbbbbb',
      ],
    },
    // 鉄の たが（金の おび）
    {
      mirror: true,
      y: 23,
      rows: ['..GGGGGGGGGGGGGGGGGG', '..QQQQQQQQQQQQQQQQQQ', '..GGGGGGGGGGGGGGGGGG'],
    },
    { x: 18, y: 23, rows: ['RRRR', 'RRRR'] },
    // 大きな 王冠
    {
      mirror: true,
      y: 2,
      rows: [
        '...................G',
        '...............G...G',
        '...............GG.GG',
        '...............GGGGG',
        '...............GGGGR',
        '...............QQQQQ',
      ],
    },
    // かお（するどい 目・まゆ・きばの ある 口）
    {
      mirror: true,
      y: 15,
      rows: [
        '..........oo........',
        '............oo......',
        '..........WWWo......',
        '..........WWWo......',
        '..........WWoo......',
        '..........Wooo......',
      ],
    },
    { mirror: true, y: 28, rows: ['..........oooooooooo', '...........WoWoWoWo.'] },
    // つや（左上）
    { x: 9, y: 14, rows: ['..AA', '.A..', 'A...', 'A...'] },
    // 導火線と 火花（右上）
    { x: 26, y: 3, rows: ['...G.C', '..GCG.', '.T.G..', '.T....', 'T.....', 'T.....'] },
    // 足もとの ほのお
    { x: 3, y: 31, rows: ['.A.', 'AVA', 'AVA', '.A.'] },
    { x: 34, y: 33, rows: ['.A.', 'AVA', '.A.'] },
  ],
};

/** サンシャクドン（フィールドに立つ 32×32） */
const sanjakuDonField: MonsterDesign = {
  size: 32,
  colors: {
    V: NQ.vermilion,
    b: NQ.brick,
    A: NQ.apricot,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    C: NQ.cream,
    W: NQ.white,
    Z: NQ.azure,
    T: NQ.tan,
    N: NQ.night,
  },
  rim: { [NQ.vermilion]: NQ.brick },
  layers: [
    { rows: hanabi(32, 15.5, 17, 9, 15, 12, 'C', 'GZ') },
    // かたの とげ
    { mirror: true, y: 12, rows: ['..N.............', '.NNN............', '.NNN............'] },
    {
      mirror: true,
      y: 8,
      rows: [
        '..........VVVVVV',
        '........VVVVVVVV',
        '.......VVVVVVVVV',
        '......VVVVVVVVVV',
        '.....VVVVVVVVVVV',
        '.....VVVVVVVVVVV',
        '....VVVVVVVVVVVV',
        '....VVVVVVVVVVVV',
        '...VVVVVVVVVVVVV',
        '...VVVVVVVVVVVVV',
        '...VVVVVVVVVVVVV',
        '...VVVVVVVVVVVVV',
        '...VVVVVVVVVVVVV',
        '...VVVVVVVVVVVVV',
        '....VVVVVVVVVVVV',
        '....VVVVVVVVVVVV',
        '.....VVVVVVVVVVV',
        '.....VVVVVVVVVVV',
        '......VVVVVVVVVV',
        '.......VVVVVVVVV',
        '........bbbVVVVV',
        '.......bbbbbbbbb',
        '.......bbbbbbbbb',
      ],
    },
    // 金の たが
    { mirror: true, y: 19, rows: ['...GGGGGGGGGGGGG', '...QQQQQQQQQQQQQ'] },
    { x: 14, y: 19, rows: ['RRRR'] },
    // 王冠
    {
      mirror: true,
      y: 4,
      rows: ['...........G...G', '...........GG.GG', '...........GGGGG', '...........QQQQR'],
    },
    // かお（するどい 目）
    {
      mirror: true,
      y: 13,
      rows: ['........oo......', '.........WWo....', '.........WWo....', '.........Woo....'],
    },
    { mirror: true, y: 24, rows: ['.........ooooooo', '..........WoWoWo'] },
    { x: 6, y: 12, rows: ['.A', 'A.'] },
    { x: 21, y: 2, rows: ['..G.C', '.GCG.', 'T.G..', 'T....', 'T....'] },
  ],
};

// ───────────────────────── 県ボス ─────────────────────────

/**
 * 錦鯉（紅白）の よこがお（左むき）。I = ひれ、j = ひれの すじ、R = 赤い もよう、c = うろこ・えら、
 * Y = 金の ひげと 王冠、足もとは 川の 水しぶき
 */
const KOI = [
  '................................................',
  '................................................',
  '................................................',
  '................................................',
  '................................................',
  '................................................',
  '...................II...........................',
  '.........Y..Y..Y..IIIjI.........................',
  '.........YY.Y.YY.IIIjIII........................',
  '.........YYYYYYYIIIjIIIjII......................',
  '.........YYRRYYYIIjIIIjIIIjI....................',
  '.........YYRRYYYPPRRRRRIIjIII...................',
  '.........QQQQQQQRRRRRRRRRRIIIII..........IIj....',
  '..........RRRRRRRRRRRRRRRRRRIII.........IIjII...',
  '........RoooRRRRRRRRRRRRRRRRRP..........IjIII...',
  '.......ooRRRRRRrPRRRRRRRRRRRRRRR.......IjIIIjI..',
  '......PPPooRRRPPcPRRRRRRRRRRPRRRRR.....IIIIjIII.',
  '.....PPPoWooPPPPcPPRRRRRRRRPPRRRRRRR..IIIjIIIII.',
  '.....PPPooooPPPPPcPcPPPcPPPcPRRRRRRRPIIIIIIIIjI.',
  '....PPPPPooPPPPPPcPPPPPPPPPPPPRRRRRPPPjIIIII....',
  '....PPPPPPPPPPPPPcPPPcPPPcPPPcPRRRPPPPPIIIII....',
  '....PpPPPppPPPPPPcPPPPPPPPPPPPPPPPPPPPPjjjjj....',
  '....ppoPPPPPPPPPPcPcPPPcPPPcPPPcPPPcPPPIIIII....',
  '....pooPPPPPPPPPPcPPPPPPPPPPPPPPPPPPPPjIIIII....',
  '.....YPYPPPPPPPPccPPPcPPPcPPPcPPPcPPPIIIIIIIIjI.',
  '....YPPYPPPPPPPPcPPPPPPPPPPPPPPPPPPP..IIIjIIIII.',
  '....Y.PPYPPPPPPcPPPcPPPcPPPcPPPcPP.....IIIIjIII.',
  '...Y...PPPPPPPPPPPPPPPPPPPPPPPPP.......IjIIIjI..',
  '...Y....PPPPPPPPPcPPPcPPPcPPPc..........IjIII...',
  '....Y.....PPPPIjIPPPPPPPPPIjI...........IIjII...',
  '............PPIjIPPPPPPPPPIjI............IIj....',
  '..............IIjIIPPPP...IIjII.................',
  '..............IIjII........IIjII................',
  '..............IIIjIII.....IIIjIII...............',
  '..........W....IIIjIII.............W............',
  '.........WSW..IIIIjWIII...........WSW...........',
  '..........S.......WSW..............S......W.....',
  '.........SSS.......S..............SSS....WSW....',
  '....W...SSASS.....SSS............SSASS....S.....',
  '...WSW.SAAAAAS...SSASS.....W....SAAAAAS..SSS....',
  '....S..SAAAAAS..SAAAAAS...WSW...SAAAAAS.SSASS...',
  '...SSSSSAAAAASSSSAAAAASSSSSSSSSSSAAAAASSSAAAAS..',
  '.SSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAS.',
  '.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.',
  '.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.',
  '.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.',
  '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..',
  '................................................',
];

const koiColors = {
  P: NQ.paper,
  c: NQ.cloud,
  R: NQ.red,
  r: NQ.brick,
  W: NQ.white,
  Y: NQ.gold,
  Q: NQ.ochre,
  p: NQ.blush,
  I: NQ.ice,
  j: NQ.sky,
  S: NQ.sky,
  A: NQ.azure,
  B: NQ.blue,
};

/**
 * シナノガワノヌシ（県ボス）：信濃川に すむ 大きな 錦鯉（紅白）。頭の 上に 王冠、金の ひげ、大きな 尾びれと せびれ。
 * 川の 水しぶきを あげて とびはねる（ミズ）
 */
const shinanogawaNoNushi: MonsterDesign = {
  size: 48,
  colors: koiColors,
  rim: {
    [NQ.paper]: NQ.cloud,
    [NQ.red]: NQ.brick,
    [NQ.ice]: NQ.sky,
    [NQ.azure]: NQ.blue,
    [NQ.gold]: NQ.ochre,
  },
  rimDepth: 2,
  layers: [{ rows: KOI }],
};

/** シナノガワノヌシ 後半：滝を のぼった 鯉は 竜に なる…。ひれが 金色に 光り、うしろに 金の 光、ひげが 竜の ように のびる */
const shinanogawaNoNushiP0: MonsterDesign = {
  ...shinanogawaNoNushi,
  colors: { ...koiColors, I: NQ.cream, j: NQ.yellow, C: NQ.cream },
  rim: {
    [NQ.paper]: NQ.cloud,
    [NQ.red]: NQ.brick,
    [NQ.cream]: NQ.yellow,
    [NQ.azure]: NQ.blue,
    [NQ.gold]: NQ.ochre,
  },
  layers: [
    { rows: hanabi(48, 23.5, 20, 16, 23, 16, 'C', 'Y') },
    { rows: KOI },
    // 竜の ように 長く のびた ひげ
    { x: 1, y: 27, rows: ['..Y', '.Y.', '.Y.', 'Y..', 'Y..', '.Y.'] },
    { x: 8, y: 26, rows: ['Y..', '.Y.', '.Y.', '..Y'] },
  ],
};

// ───────────────────────── ラスボス ─────────────────────────

/** 紺地に 日の丸の 旗（うしろに 立てる。さおは 黒うるし） */
const KENSHIN_BANNER = [
  'TZZZZZZZZ',
  'TZZZZZZZZ',
  'TZZZRRZZZ',
  'TZZRRRRZZ',
  'TZZRRRRZZ',
  'TZZZRRZZZ',
  'TZZZZZZZZ',
  'TZZZZZZZZ',
  ...Array.from({ length: 34 }, () => 'T'),
];

/** 上杉謙信：白い 頭巾（行人包み）と むらさきの よろい。頭巾の はしが 風に なびき、うしろに 紺地 日の丸の 旗（ヒカリ） */
const kenshinBody = lord(
  [
    '........................',
    '........................',
    '................PPPPPPPP',
    '.............PPPPPPPPPPP',
    '...........PPPPPPPPPPPPP',
    '..........PPPPPPPPPPPPPP',
    '.........PPPPPPPPPPPPPPP',
    '.........PPPPPPPPPPPPPPP',
    '........PPPPPPPPPPPPPPPP',
    '........PPPcPPPPPPPPPPPP',
    '........PPcPPPPPPPPPPPPP',
    '........PPPPPPFFFFFFFFFF',
    '........PPPPPFFoooFFFFFF',
    '........PPPPPFFFWoFFFFFF',
    '........PPPPPFFFWoFFFFFF',
    '........PPPPPFFFFFFFFfFF',
    '........PPPPPfFFFFFFFFoo',
    '........PPPPPPffFFFFFFFF',
    '........PPPPPPPPPPPPPPPP',
    '.......PPPPPPPPPPPPPPPPP',
    '......PPPcPPPPPPPPPPPPPP',
    '.....PPPPPPPPPPPPPPPPPPP',
  ],
  {
    P: NQ.paper,
    c: NQ.cloud,
    K: NQ.indigo,
    S: NQ.violet,
    G: NQ.gold,
    R: NQ.red,
    T: NQ.night,
    H: NQ.slate,
    Z: NQ.navy,
  },
  { [NQ.paper]: NQ.cloud, [NQ.violet]: NQ.indigo },
  [
    // 首も 頭巾で つつむ
    { mirror: true, y: 23, rows: ['.................PPPPPPP'] },
    // 風に なびく 頭巾の はし（右）
    { x: 40, y: 9, rows: ['PP.....', 'PPP....', '.PPPP..', '..PPcP.', '...PPPP', '....PPc', '.....PP'] },
  ],
);

const uesugiKenshin: MonsterDesign = {
  ...kenshinBody,
  layers: [{ x: 2, y: 2, rows: KENSHIN_BANNER }, ...kenshinBody.layers],
};

export const NIIGATA: Readonly<Record<string, MonsterDesign>> = {
  'niigata-inahon': inahon,
  'niigata-minori-maru': minoriMaru,
  'niigata-hisui-koro': hisuiKoro,
  'niigata-hisui-goro': hisuiGoro,
  'niigata-kotoki': kotoki,
  'niigata-akebono-toki': akebonoToki,
  'niigata-shiobikin': shiobikin,
  'niigata-kitakaze-zake': kitakazeZake,
  'niigata-midboss-sanjaku-don': sanjakuDon,
  'niigata-midboss-sanjaku-don.field': sanjakuDonField,
  'niigata-boss-shinanogawa-no-nushi': shinanogawaNoNushi,
  'niigata-boss-shinanogawa-no-nushi.p0': shinanogawaNoNushiP0,
  'niigata-lastboss-uesugi-kenshin': uesugiKenshin,
};
