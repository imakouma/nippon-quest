/** 千葉県の モンスター（手描き。docs/06 §4・§6.3〜6.5 の 規格） */
import { NQ } from '../palette';
import type { MonsterDesign } from './design';

// ───────────────────────── 下書きの 道具（まるい 形を 式で 作ってから、顔や 部品を 手で 重ねる） ─────────────────────────

/** (x, y) → 文字 の 関数で 文字の 地図を 作る（'.' は とうめい） */
const plot = (w: number, h: number, f: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => f(x, y)).join(''));

/** だ円の 中か（中心 cx, cy・半径 rx, ry） */
const inEll = (x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

/** 形の 左上の ふち（右下に 1 ずらした 形に 入らない ところ）＝ 光の あたる ふち */
const litEdge = (inside: (x: number, y: number) => boolean, x: number, y: number): boolean =>
  inside(x, y) && !inside(x - 1, y - 1);

// ───────────────────────── 通常モンスター ─────────────────────────

/** 落花生の さや：上の ふくらみ（頭）と 下の ふくらみ（からだ）。まん中が くびれる */
const peanut = (hy: number, hrx: number, hry: number, by: number, brx: number, bry: number) => {
  const inside = (x: number, y: number) => inEll(x, y, 15.5, hy, hrx, hry) || inEll(x, y, 15.5, by, brx, bry);
  // さやの あみめ（ななめの 格子）
  const net = (x: number, y: number) => (x + y) % 5 === 0 || (x - y + 40) % 5 === 0;
  return { inside, net };
};

/** ホリピー：落花生の さやの 子。上が 頭、下が からだ。さやの あみめ、頭に 黄色い 落花生の 花（ツチ） */
const HORIPII = peanut(11.5, 9.5, 7, 23, 10.5, 6.5);
const horipii: MonsterDesign = {
  size: 32,
  colors: {
    S: NQ.sand,
    E: NQ.beige,
    T: NQ.tan,
    B: NQ.brown,
    W: NQ.white,
    p: NQ.blush,
    Y: NQ.yellow,
    A: NQ.apricot,
    L: NQ.leaf,
    G: NQ.green,
  },
  rim: { [NQ.sand]: NQ.tan, [NQ.beige]: NQ.sand },
  layers: [
    // 小さな うで
    {
      rows: plot(32, 32, (x, y) =>
        y >= 17 && y <= 19 && Math.abs(x - 15.5) >= 8.5 && Math.abs(x - 15.5) <= 10.5 - (y - 17) ? 'S' : '.',
      ),
    },
    // さや（頭と からだ）
    {
      rows: plot(32, 32, (x, y) => {
        if (!HORIPII.inside(x, y) || y > 29) return '.';
        if (litEdge(HORIPII.inside, x, y)) return 'E';
        return HORIPII.net(x, y) ? 'T' : 'S';
      }),
    },
    // 顔（あみめを けして 目・ほっぺ・口）
    {
      x: 10,
      y: 9,
      rows: ['SSSSSSSSSSSS', 'SWWSSSSSSWWS', 'SWoSSSSSSoWS', 'SWoSSSSSSoWS', 'pSSSoSSoSSSp', 'SSSSSooSSSSS'],
    },
    // 落花生の 花と 葉
    { x: 13, y: 1, rows: ['..YY..', '.YAAY.', '..YY..', 'LLGGLL'] },
    // 足
    { x: 11, y: 29, rows: ['BBB..BBB..', 'BBB..BBB..'] },
  ],
};

/** なしの 実：まるくて 下が 少し ひろい。右上を シャリッと かじった あと（白い 実が 見える） */
const pear = (cx: number, cy: number, r: number, bx: number, by: number, br: number) => {
  const whole = (x: number, y: number) => inEll(x, y, cx, cy, r + (y > cy ? 0.6 : 0), r - 0.4);
  const inside = (x: number, y: number) => whole(x, y) && !inEll(x, y, bx, by, br, br);
  const flesh = (x: number, y: number) => inEll(x, y, bx, by, br + 1.6, br + 1.6);
  return { inside, flesh };
};
/** 皮の 小さな てんてん（なしの 皮の とくちょう） */
const pearDots = (x: number, y: number) => (x * 7 + y * 3) % 11 === 0 && (x + y) % 2 === 0;

/** シャリリン：千葉の なしの ようせい。茶色っぽい 金色の 皮に てんてん、かじった あとの 白い 実、ヘタと 葉っぱ（モリ） */
const SHARI = pear(15.5, 17.5, 12, 27.5, 10, 3.6);
const sharirin: MonsterDesign = {
  size: 32,
  colors: {
    S: NQ.sand,
    E: NQ.beige,
    P: NQ.paper,
    B: NQ.brown,
    L: NQ.leaf,
    G: NQ.green,
    W: NQ.white,
    p: NQ.blush,
    K: NQ.sky,
  },
  rim: { [NQ.sand]: NQ.tan, [NQ.beige]: NQ.sand },
  layers: [
    {
      rows: plot(32, 32, (x, y) => {
        if (!SHARI.inside(x, y) || y > 29) return '.';
        if (SHARI.flesh(x, y)) return 'P';
        if (litEdge(SHARI.inside, x, y) && x < 16 && y < 18) return 'E';
        return pearDots(x, y) ? 'E' : 'S';
      }),
    },
    // つや（左上）
    { x: 8, y: 9, rows: ['.WW', 'WE.', 'W..'] },
    // ヘタと 葉っぱ（左へ ひらく）
    { x: 9, y: 1, rows: ['.......B', '..LLL..B', '.LLLLLLB', 'LLLGGGLB', '.LLLL..BB'] },
    // 顔
    { x: 10, y: 14, rows: ['.WW......WW.', '.Wo......oW.', '.Wo......oW.', 'p...o..o...p', '.....oo.....'] },
    // しる の しずく
    { x: 28, y: 4, rows: ['K.', 'KK'] },
    // 足
    { x: 11, y: 29, rows: ['BBB..BBB..', 'BBB..BBB..'] },
  ],
};

/** はまぐり：上が まるく とがった、よこに ひろい 三角。貝がらの すじは 上の とがり（殻頂）を 中心に した 弧 */
const clam = (cx: number, top: number, cy: number, rx: number, ry: number, k: number) => {
  const inside = (x: number, y: number) =>
    inEll(x, y, cx, cy, rx, ry) && Math.abs(x - cx) <= (y - top) * k + 1 && y >= top;
  const band = (x: number, y: number) => Math.floor(Math.hypot((x - cx) / 1.3, y - top));
  return { inside, band };
};
/** 貝がらを ぬる：rings＝こい すじ（tan）、その あいだの 1 つおきの 帯は 砂色（sand）、殻頂に 茶色の ちょうつがい */
const clamShell = (c: ReturnType<typeof clam>, bottom: number, rings: number[], cx = 15.5) =>
  plot(32, 32, (x, y) => {
    if (!c.inside(x, y) || y > bottom) return '.';
    const b = c.band(x, y);
    if (b <= 1 && Math.abs(x - cx) < 1) return 'B';
    if (litEdge(c.inside, x, y) && x < cx) return 'W';
    if (rings.includes(b)) return 'T';
    if (b > rings[1]! && b < rings[2]!) return 'S';
    return 'E';
  });

/** クジュクリン：九十九里浜の はまぐり。貝がらの すじと 茶色の もよう、よこに 小さな ひれ、頭から 水を ふく（ミズ） */
const KUJU = clam(15.5, 6, 18, 13.5, 10.5, 1.5);
const kujukurin: MonsterDesign = {
  size: 32,
  colors: {
    E: NQ.beige,
    S: NQ.sand,
    T: NQ.tan,
    B: NQ.brown,
    Z: NQ.azure,
    K: NQ.sky,
    W: NQ.white,
    p: NQ.blush,
  },
  rim: { [NQ.beige]: NQ.sand, [NQ.sand]: NQ.tan, [NQ.azure]: NQ.blue },
  layers: [
    // よこの ひれ
    {
      x: 1,
      y: 19,
      rows: [
        '.ZZ........................ZZ.',
        'ZZZZ......................ZZZZ',
        '.ZZZ......................ZZZ.',
      ],
    },
    // 貝がら
    { rows: clamShell(KUJU, 28, [11, 15, 19, 22]) },
    // 頭の 上の 小さな 水の ひれ
    { x: 13, y: 2, rows: ['.K..K.', 'KZ..ZK', 'KZZZZK', '.ZZZZ.'] },
    // 顔
    {
      x: 10,
      y: 14,
      rows: ['.WW......WW.', '.Wo......oW.', '.Wo......oW.', 'p..........p', '....oooo....', '.....oo.....'],
    },
    // 足（すなに もぐる 足）
    { x: 12, y: 28, rows: ['TTT..TTT', 'TTT..TTT', 'TTT..TTT'] },
  ],
};

// ───────────────────────── しんか ─────────────────────────

/** ピーナイト（ホリピーの しんか）：さやの よろいの 騎士。かぶとの まびさし、花の はねかざり、さやの たて（ツチ） */
const PEANIGHT = peanut(11, 10.5, 7.5, 23, 11.5, 6.8);
const peanight: MonsterDesign = {
  size: 32,
  colors: {
    S: NQ.sand,
    E: NQ.beige,
    T: NQ.tan,
    B: NQ.brown,
    K: NQ.bark,
    W: NQ.white,
    p: NQ.blush,
    Y: NQ.yellow,
    A: NQ.apricot,
    L: NQ.leaf,
    G: NQ.green,
  },
  rim: { [NQ.sand]: NQ.tan, [NQ.beige]: NQ.sand, [NQ.brown]: NQ.bark },
  layers: [
    // 右の こぶし（かかげる）
    { x: 26, y: 13, rows: ['.SS.', 'SSSS', 'SSSS', '.SS.', '.SS.', 'SS..'] },
    {
      rows: plot(32, 32, (x, y) => {
        if (!PEANIGHT.inside(x, y) || y > 29) return '.';
        if (litEdge(PEANIGHT.inside, x, y)) return 'E';
        return PEANIGHT.net(x, y) ? 'T' : 'S';
      }),
    },
    // かぶと（まびさし・ほお当て）
    {
      x: 5,
      y: 3,
      rows: [
        '......BBBBBBBBBB......',
        '....BBBBBBBBBBBBBB....',
        '...BBBBBBBBBBBBBBBB...',
        '..BBBBBBBBBBBBBBBBBB..',
        '..KKKKKKKKKKKKKKKKKK..',
      ],
    },
    // 顔（きりっと した まゆ）
    {
      x: 8,
      y: 8,
      rows: [
        'SSSSSSSSSSSSSSSS',
        'SSooSSSSSSSSooSS',
        'SSSWWSSSSSSWWSSS',
        'SSSWoSSSSSSoWSSS',
        'SSSWoSSSSSSoWSSS',
        'SpSSSSoooSSSSSpS',
        'SSSSSSSooSSSSSSS',
      ],
    },
    // 花の はねかざり
    { x: 13, y: 1, rows: ['..YY..', '.YAAY.', 'LLYYLL'] },
    // こしの ベルト
    { x: 6, y: 20, rows: ['BBBBBBBBBBBBBBBBBBBB', '....................'] },
    // さやの たて（左の うで）
    {
      x: 1,
      y: 15,
      rows: [
        '...BBBB...',
        '..BSSSSB..',
        '.BSSYYSSB.',
        '.BSYAAYSB.',
        '.BSSYYSSB.',
        '.BSSSSSSB.',
        '..BSSSSB..',
        '...BBBB...',
      ],
    },
    // 足（ブーツ）
    { x: 10, y: 29, rows: ['BBBB..BBBB..', 'KKKK..KKKK..'] },
  ],
};

/** コウスイヒメ（シャリリンの しんか）：大きく なった なしの おひめさま。なしの 花の かんざし、葉っぱの スカート、なしの 花の つえ（モリ） */
const KOUSUI = pear(15.5, 15.5, 12.5, -20, 0, 1);
const kousuiHime: MonsterDesign = {
  size: 32,
  colors: {
    S: NQ.sand,
    E: NQ.beige,
    B: NQ.brown,
    L: NQ.leaf,
    G: NQ.green,
    W: NQ.white,
    p: NQ.blush,
    Y: NQ.yellow,
    b: NQ.berry,
    M: NQ.lime,
  },
  rim: { [NQ.sand]: NQ.tan, [NQ.beige]: NQ.sand, [NQ.leaf]: NQ.green },
  layers: [
    // 葉っぱの スカート（うしろ。すそは ぎざぎざ）
    {
      rows: plot(32, 32, (x, y) =>
        y >= 21 && y <= 28 && Math.abs(x - 15.5) <= 7 + (y - 21) * 1.1 && !(y === 28 && (x + 1) % 3 === 0)
          ? 'L'
          : '.',
      ),
    },
    {
      rows: plot(32, 32, (x, y) => {
        if (!KOUSUI.inside(x, y) || y > 24) return '.';
        if (litEdge(KOUSUI.inside, x, y) && x < 16 && y < 16) return 'E';
        return pearDots(x, y) ? 'E' : 'S';
      }),
    },
    { x: 8, y: 7, rows: ['.WW', 'WE.', 'W..'] },
    // スカートの 葉すじ
    { x: 8, y: 25, rows: ['M..M..M..M..M..M', '.M..M..M..M..M..'] },
    // ヘタと 葉
    { x: 15, y: 1, rows: ['.B......', '.B.LLL..', 'BBLLGLL.'] },
    // なしの 花の かんざし（左上に 3 つ）
    { x: 2, y: 2, rows: ['.WW..WW..', 'WWWWWWWW.', 'WYWWWWYW.', '.WWWYWWW.', '..WWWWW..', '...W.W...'] },
    // 顔（まつげ）
    {
      x: 9,
      y: 11,
      rows: [
        'o..........o.',
        '.WW......WW..',
        '.Wo......oW..',
        '.Wo......oW..',
        'p...o..o...p.',
        '.....oo......',
      ],
    },
    // なしの 花の つえ（右手）
    {
      x: 26,
      y: 7,
      rows: ['WWW', 'WYW', 'WWW', '.B.', '.B.', '.B.', 'SB.', 'SS.', '.B.', '.B.', '.B.', '.B.'],
    },
    // 左手
    { x: 3, y: 17, rows: ['SS', 'SS'] },
    // くつ
    { x: 11, y: 29, rows: ['.bb....bb.', 'bbb....bbb'] },
  ],
};

/** 大波：左で 立ちあがり、上で 右へ まきこむ わっか（まん中が 波の トンネル）と、左下へ ひろがる 波の すそ */
const BIG_WAVE = plot(32, 28, (x, y) => {
  const d = Math.hypot(x - 10, y - 11);
  const a = Math.atan2(y - 11, x - 10);
  const ring = d <= 10 && d >= 5 && !(a > 0.15 && a < 2.5);
  const foot = y >= 16 && x >= 1 && x <= 2 + (y - 16) * 1.1;
  if (!(ring || foot) || y < 1 || x < 1) return '.';
  if (ring && d > 8.6) return (x + y) % 3 === 0 ? 'K' : 'W';
  if (ring && d < 6.2) return 'N';
  if ((x * 2 + y) % 7 === 0) return 'K';
  return d > 6.8 && d < 8.6 ? 'K' : 'Z';
});

/** ナミノリガイ（クジュクリンの しんか）：大波に のる はまぐり。うしろで まく 波、ひれの うでで バランス、足もとに サーフボード（ミズ） */
const NAMI = clam(19, 12, 21, 10.5, 6.8, 1.5);
const naminoriGai: MonsterDesign = {
  size: 32,
  colors: {
    E: NQ.beige,
    S: NQ.sand,
    T: NQ.tan,
    B: NQ.brown,
    Z: NQ.azure,
    N: NQ.blue,
    K: NQ.sky,
    W: NQ.white,
    p: NQ.blush,
    R: NQ.red,
  },
  rim: { [NQ.beige]: NQ.sand, [NQ.sand]: NQ.tan, [NQ.azure]: NQ.blue, [NQ.red]: NQ.brick },
  layers: [
    { rows: BIG_WAVE },
    // 波の 先の しぶき（右へ たれる つめ）
    { x: 19, y: 10, rows: ['WW..', 'W.W.', 'W..W'] },
    // ひれの うで（ひろげて バランス）
    { x: 5, y: 17, rows: ['.ZZ.', 'ZZZZ', '.ZZZ'] },
    { x: 27, y: 17, rows: ['.ZZ.', 'ZZZZ', 'ZZZ.'] },
    // 貝がら
    { rows: clamShell(NAMI, 26, [7, 10, 13, 15], 19) },
    // 顔（きりっと）
    {
      x: 14,
      y: 15,
      rows: ['.oo....oo..', '..WW..WW...', '..Wo..oW...', '..Wo..oW...', 'p........p.', '...oooo....'],
    },
    // 足
    { x: 15, y: 26, rows: ['TTT..TTT'] },
    // サーフボード
    {
      x: 4,
      y: 27,
      rows: ['.RRRRRRRRRRRRRRRRRRRRRRRRR.', 'RRRRRRRRRRRRRWWRRRRRRRRRRRR', '.RRRRRRRRRRRRRRRRRRRRRRRRR.'],
    },
  ],
};

// ───────────────────────── 中ボス ─────────────────────────

/** イヌボウケンの からだ（S＝キャンバスの 大きさ。40 と 32 で 同じ 形を ちぢめて つかう） */
const inuParts = (S: number) => {
  const k = S / 40;
  const c = (S - 1) / 2;
  const head = (x: number, y: number) => inEll(x, y, c, 19 * k, 11 * k, 7.5 * k);
  const earL = (x: number, y: number) => {
    const t = (y - 8 * k) / (7 * k);
    return t >= 0 && t <= 1 && x >= c - 9.5 * k - t * 1.5 * k && x <= c - 8 * k + t * 5 * k;
  };
  const ear = (x: number, y: number) => earL(x, y) || earL(S - 1 - x, y);
  const earInL = (x: number, y: number) => {
    const t = (y - 10.5 * k) / (4.5 * k);
    return t >= 0 && t <= 1 && x >= c - 8.6 * k && x <= c - 8 * k + t * 3 * k;
  };
  const earIn = (x: number, y: number) => earInL(x, y) || earInL(S - 1 - x, y);
  const muzzle = (x: number, y: number) => inEll(x, y, c, 23.2 * k, 5.5 * k, 3.4 * k);
  const body = (x: number, y: number) => inEll(x, y, c, 32 * k, 12.5 * k, 7 * k) && y <= S - 2;
  const leg = (x: number, y: number) =>
    y >= 30 * k &&
    y <= S - 2 &&
    (Math.abs(x - (c - 5 * k)) <= 2.4 * k || Math.abs(x - (c + 5 * k)) <= 2.4 * k);
  return { head, ear, earIn, muzzle, body, leg };
};

/** 灯台の 光（あかりの へやから 左右へ ひろがる） */
const beams = (S: number, cy: number, x0: number) =>
  plot(S, S, (x, y) => {
    const dx = x < S / 2 ? x0 - x : x - (S - 1 - x0);
    if (dx <= 0 || x < 1 || x > S - 2 || y < 1) return '.';
    const dy = Math.abs(y - cy);
    if (dy > 0.6 + dx * 0.26) return '.';
    return dy <= 0.4 + dx * 0.07 ? 'Y' : 'C';
  });

/**
 * イヌボウケン（中ボス）：犬吠埼の 灯台の あかりの へやを かぶった 大きな 白い 犬。金の まどわく、左右へ のびる 灯台の 光、
 * 赤い 首わに 金の ふだ、くるんと まいた しっぽ、足もとに 太平洋の 波。灯台の 屋根に 王冠（ヒカリ）
 */
const INU = inuParts(40);
const inubouken: MonsterDesign = {
  size: 40,
  colors: {
    W: NQ.white,
    c: NQ.cloud,
    E: NQ.beige,
    L: NQ.slate,
    N: NQ.night,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    Y: NQ.yellow,
    C: NQ.cream,
    Z: NQ.azure,
    p: NQ.blush,
  },
  rim: { [NQ.white]: NQ.cloud, [NQ.gold]: NQ.ochre, [NQ.azure]: NQ.blue, [NQ.red]: NQ.brick },
  rimDepth: 2,
  layers: [
    { rows: beams(40, 8.5, 13) },
    // くるんと まいた しっぽ（右）
    { x: 29, y: 23, rows: ['..WWW..', '.WcccW.', 'WcWWWcW', 'WcW.WcW', 'WcWWccW', '.WccWW.', '..WW...'] },
    // からだ・前足（つま先の すじ）
    {
      rows: plot(40, 40, (x, y) => {
        if (INU.leg(x, y)) return y >= 37 && (x === 13 || x === 15 || x === 24 || x === 26) ? 'o' : 'W';
        return INU.body(x, y) ? 'W' : '.';
      }),
    },
    // 足の あいだの かげ・むねの ふわふわ
    { x: 18, y: 32, rows: ['cccc', '.cc.', '.cc.', '.cc.', '.cc.', '.cc.'] },
    { x: 15, y: 29, rows: ['.c........', 'c.c....c.c', '........c.'] },
    // 耳・頭・はなづら
    {
      rows: plot(40, 40, (x, y) => {
        if (INU.earIn(x, y)) return 'c';
        if (INU.muzzle(x, y)) return 'E';
        if (INU.ear(x, y) || INU.head(x, y)) return 'W';
        if (y >= 19 && y <= 25 && (x === 8 || x === 31) && y % 3 !== 0) return 'W';
        return '.';
      }),
    },
    // 赤い 首わと 金の ふだ
    { x: 11, y: 26, rows: ['RRRRRRRRRRRRRRRRRR', '.RRRRRRRGGRRRRRRR.', '........GG........'] },
    // あかりの へや（金の まどわく）・見はらし台・屋根・王冠
    {
      mirror: true,
      rows: [
        '....................',
        '................G..G',
        '................GGGR',
        '................QQQQ',
        '...................N',
        '...............NNNNN',
        '..............NLNNNN',
        '..............GGGGGG',
        '..............GYCGYC',
        '..............GYCGYC',
        '..............GYCGYC',
        '............NNNNNNNN',
        '............NLNNLNNL',
      ],
    },
    // 顔：まゆ・金の 目（3×4）・はな・口・した・ほっぺ
    {
      mirror: true,
      y: 14,
      rows: [
        '............ooo.....',
        '...............oo...',
        '.............YYY....',
        '.............YYo....',
        '.............Yoo....',
        '.............YYo....',
        '..........pp........',
        '.................ooo',
        '..................oo',
        '...................o',
        '.................oo.',
        '...................p',
        '...................p',
      ],
    },
    // 足もとの 波（左右）
    { x: 1, y: 32, rows: ['..WW....', '.WZZW...', 'WZZZZW..', 'ZZZZZZW.', 'ZZZZZZZW', 'ZZZZZZZZ'] },
    { x: 31, y: 32, rows: ['....WW..', '...WZZW.', '..WZZZZW', '.WZZZZZZ', 'WZZZZZZZ', 'ZZZZZZZZ'] },
  ],
};

/** イヌボウケン（フィールドに 立つ 32×32）。光の すじは みじかく */
const INU_F = inuParts(32);
const inuboukenField: MonsterDesign = {
  size: 32,
  colors: {
    W: NQ.white,
    c: NQ.cloud,
    E: NQ.beige,
    N: NQ.night,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    Y: NQ.yellow,
    C: NQ.cream,
    p: NQ.blush,
  },
  rim: { [NQ.white]: NQ.cloud, [NQ.gold]: NQ.ochre },
  layers: [
    { rows: beams(32, 7, 10) },
    { x: 24, y: 19, rows: ['.WWW.', 'WcWcW', 'WcccW', '.WWW.'] },
    { rows: plot(32, 32, (x, y) => (INU_F.leg(x, y) || INU_F.body(x, y) ? 'W' : '.')) },
    { x: 15, y: 26, rows: ['cc', 'cc', 'cc', 'cc', 'cc'] },
    {
      rows: plot(32, 32, (x, y) => {
        if (INU_F.earIn(x, y)) return 'c';
        if (INU_F.muzzle(x, y)) return 'E';
        return INU_F.ear(x, y) || INU_F.head(x, y) ? 'W' : '.';
      }),
    },
    { x: 9, y: 21, rows: ['RRRRRRRRRRRRRR', '......GG......'] },
    {
      mirror: true,
      rows: [
        '................',
        '.............G.G',
        '.............GGR',
        '.............QQQ',
        '............NNNN',
        '...........GGGGG',
        '...........GYCGY',
        '...........GYCGY',
        '..........NNNNNN',
      ],
    },
    {
      mirror: true,
      y: 12,
      rows: [
        '..........ooo...',
        '...........YY...',
        '...........Yo...',
        '...........Yo...',
        '.........p......',
        '..............oo',
        '...............o',
        '..............o.',
        '...............p',
      ],
    },
  ],
};

// ───────────────────────── 県ボス ─────────────────────────

type Pt = readonly [number, number];
/** 折れ線に そった 太い ひも（はじめ r0 → おわり r1）。入れば 0〜1（はじめ→おわり）、入らなければ -1 */
const tube = (pts: readonly Pt[], r0: number, r1: number) => {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i]![0], p[1] - pts[i]![1]));
  const total = lens.reduce((a, b) => a + b, 0);
  return (x: number, y: number): number => {
    let run = 0;
    let best = -1;
    for (let i = 0; i < lens.length; i++) {
      const [ax, ay] = pts[i]!;
      const [bx, by] = pts[i + 1]!;
      const L = lens[i]!;
      const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / (L * L)));
      const u = (run + t * L) / total;
      const d = Math.hypot(x - (ax + t * (bx - ax)), y - (ay + t * (by - ay)));
      if (d <= r0 + (r1 - r0) * u) best = u;
      run += L;
    }
    return best;
  };
};
const mirrorX = (f: (x: number, y: number) => number, S: number) => (x: number, y: number) =>
  Math.max(f(x, y), f(S - 1 - x, y));

/** しょうゆの 大だる：まん中が ふくらんだ 木の おけ。たての 板の すじ、竹の たが 2 本、上に しょうゆの 面 */
const taruHalf = (y: number) => 14.5 + 1.5 * Math.sin((Math.PI * (y - 30)) / 17);
const TARU = plot(48, 48, (x, y) => {
  const c = 23.5;
  if (y < 29 || y > 46) return '.';
  const rx = taruHalf(31);
  if (y <= 33 && inEll(x, y, c, 31, rx, 2.4))
    return inEll(x, y, c, 31, rx - 1.4, 1.5) ? ((x * 3 + y) % 11 === 0 ? 'A' : 'K') : 'E';
  if (y < 31 || Math.abs(x - c) > taruHalf(y)) return '.';
  if (y === 35 || y === 36 || y === 42 || y === 43) return (x + y) % 5 === 0 ? 'S' : 'M';
  return (x + 1) % 4 === 0 ? 'T' : 'S';
});
/** 竜の からだ（たるから 立ちあがる 首）・しっぽ・うで・つの */
const RYU_NECK = tube(
  [
    [23.5, 32],
    [23.5, 25],
    [23.5, 18],
  ],
  6,
  5.2,
);
const RYU_TAIL = tube(
  [
    [36, 33],
    [42, 26],
    [43.5, 17],
    [41, 9],
    [37, 6],
  ],
  3.6,
  1.4,
);
const RYU_ARM = mirrorX(
  tube(
    [
      [19, 23],
      [14, 26],
      [10, 24.5],
    ],
    2.4,
    1.9,
  ),
  48,
);
const RYU_HORN = mirrorX(
  tube(
    [
      [19.5, 8],
      [17, 4],
      [13.5, 1.5],
    ],
    1.7,
    0.7,
  ),
  48,
);
const RYU_WHISKER = mirrorX(
  tube(
    [
      [18, 17.5],
      [12, 20],
      [7, 19],
      [5, 16.5],
    ],
    0.55,
    0.45,
  ),
  48,
);
const RYU_HEAD = (x: number, y: number) => inEll(x, y, 23.5, 12.5, 10.5, 7.2);
const RYU_SNOUT = (x: number, y: number) => inEll(x, y, 23.5, 16.6, 5.6, 3);

/** しっぽの 先の ひれ・頭の よこの ひれ（ミズの ひれ） */
const RYU_FIN = ['A.....', 'AAA...', '.AAAA.', 'AAAAAA', '..AAAA', '.AAA..'];

/**
 * ショウユリュウ（県ボス）：野田・銚子の しょうゆの 大だるから 立ちあがる こげ茶の 竜。金の つの と 王冠、
 * ミズの ひれ、長い ひげ、竜の 玉の かわりに 大豆（しょうゆの もと）を にぎる。たるの ふちから しょうゆが たれる（ミズ）
 */
const shoyuRyu: MonsterDesign = {
  size: 48,
  colors: {
    D: NQ.brown,
    K: NQ.bark,
    A: NQ.amber,
    T: NQ.tan,
    S: NQ.sand,
    E: NQ.beige,
    M: NQ.green,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    Y: NQ.yellow,
    W: NQ.white,
  },
  rim: { [NQ.brown]: NQ.bark, [NQ.sand]: NQ.tan, [NQ.gold]: NQ.ochre },
  rimDepth: 2,
  layers: [
    // しっぽ（右うしろで まきあがる）と 先の ひれ
    {
      rows: plot(48, 48, (x, y) =>
        RYU_TAIL(x, y) >= 0 ? (RYU_TAIL(x, y) > 0.3 && (x + y) % 4 === 0 ? 'A' : 'D') : '.',
      ),
    },
    { x: 33, y: 1, rows: ['..A..', '.AAA.', 'AAAAA', '.AAA.'] },
    // 頭の よこの ひれ
    { mirror: true, x: 8, y: 9, rows: RYU_FIN },
    // 首（おなかは 大豆色の だんだん）
    {
      rows: plot(48, 48, (x, y) => {
        const u = RYU_NECK(x, y);
        if (u < 0) return '.';
        if (Math.abs(x - 23.5) <= 3) return y % 3 === 0 ? 'S' : 'E';
        return litEdge((xx, yy) => RYU_NECK(xx, yy) >= 0, x, y) ? 'A' : 'D';
      }),
    },
    { rows: TARU },
    // たるの ふちから たれる しょうゆ
    {
      x: 11,
      y: 32,
      rows: ['K.......K............K....', 'K.......K............K....', '........K.................'],
    },
    // うで
    { rows: plot(48, 48, (x, y) => (RYU_ARM(x, y) >= 0 ? 'D' : '.')) },
    // 左手の 大豆（竜の 玉）と つめ
    {
      x: 3,
      y: 18,
      rows: ['..SSSS..', '.SEESSS.', 'SEESSSSS', 'SSSSTTSS', 'SSSSSSSS', '.SSSSSS.', '..SSSS..', '.W.W.W..'],
    },
    // 右手の つめ（ひらく）
    { x: 38, y: 21, rows: ['.W.W', 'W.DD', '.DDD', 'W.DD'] },
    // ひげ・つの
    { rows: plot(48, 48, (x, y) => (RYU_HORN(x, y) >= 0 ? 'G' : RYU_WHISKER(x, y) >= 0 ? 'T' : '.')) },
    // 頭
    {
      rows: plot(48, 48, (x, y) => {
        if (RYU_SNOUT(x, y)) return 'T';
        if (!RYU_HEAD(x, y)) return '.';
        return litEdge(RYU_HEAD, x, y) ? 'A' : 'D';
      }),
    },
    // 王冠・まゆ・目（3×4）・はなの あな・口と 小さな きば
    {
      mirror: true,
      rows: [
        '........................',
        '....................G..G',
        '....................GGGR',
        '....................GGGR',
        '....................QQQQ',
        '........................',
        '........................',
        '...............AAA......',
        '................AAAA....',
        '................WYYY....',
        '................YYYo....',
        '................YYoo....',
        '................YYoo....',
        '........................',
        '........................',
        '.....................o..',
        '........................',
        '..................oooooo',
        '...................W....',
      ],
    },
    // しょうゆの しずく
    { x: 2, y: 8, rows: ['.K', 'KK', 'KA'] },
    { x: 44, y: 30, rows: ['.K', 'KK', 'AK'] },
    { x: 6, y: 30, rows: ['K.', 'KK'] },
  ],
};

/** ショウユリュウ 後半：しょうゆが ぐつぐつ にえたち、からだが 赤く かがやく。目は 白く 光り、たるの まわりに うずと ゆげ */
const shoyuRyuP0: MonsterDesign = {
  ...shoyuRyu,
  colors: { ...shoyuRyu.colors, D: NQ.brick, A: NQ.vermilion, Y: NQ.white, C: NQ.cloud },
  rim: { [NQ.brick]: NQ.bark, [NQ.sand]: NQ.tan, [NQ.gold]: NQ.ochre },
  layers: [
    ...shoyuRyu.layers,
    // ゆげ
    { x: 1, y: 1, rows: ['.WW', 'WCW', '.W.'] },
    { x: 43, y: 12, rows: ['.WW', 'WWC', 'CW.'] },
    // にえたつ あわ
    { x: 13, y: 30, rows: ['.W......W.......W...', 'W.W....W.W.....W.W..'] },
    // たるの まわりの うず
    { x: 1, y: 37, rows: ['.WWW', 'W...', 'W.W.', '.W..'] },
    { x: 43, y: 37, rows: ['WWW.', '...W', '.W.W', '..W.'] },
  ],
};

// ───────────────────────── 裏ステージの ラスボス ─────────────────────────

/**
 * 伊能忠敬（ラスボス）：日本じゅうを 歩いて はかった 地図の 人。黒い 陣笠（金の 紋）、紺の 羽織に 赤い 羽織ひも、
 * しまの はかまと 白い きゃはん。右手に 方位ばんの ついた つえ、左手に 海岸線を かいた 地図、うしろに 星（ツチ → ヒカリ）
 */
const inoTadataka: MonsterDesign = {
  size: 48,
  colors: {
    F: NQ.skinLight,
    f: NQ.skinMid,
    s: NQ.silver,
    K: NQ.night,
    L: NQ.slate,
    N: NQ.navy,
    B: NQ.brown,
    T: NQ.tan,
    W: NQ.white,
    G: NQ.gold,
    R: NQ.red,
    P: NQ.paper,
    Z: NQ.azure,
    p: NQ.blush,
  },
  rim: { [NQ.skinLight]: NQ.skinMid, [NQ.tan]: NQ.brown, [NQ.navy]: NQ.night },
  rimDepth: 2,
  layers: [
    {
      mirror: true,
      rows: [
        '........................',
        '........................',
        '........................',
        '.....................KKK',
        '..................KKKKKK',
        '...............KKKKKKGGG',
        '............KKKKLLKKGKKG',
        '.........KKKKLLLKKKKGKKG',
        '.......KKKKLLKKKKKKKKGGG',
        '......KKKKKKKKKKKKKKKKKK',
        '.......LLLLLLLLLLLLLLLLL',
        '...............ssFFFFFFF',
        '...............sFFFFFFFF',
        '...............sFsssFFFF',
        '...............sFWWWFFFF',
        '...............sFWWoFFFF',
        '................FWooFFFF',
        '................FWooFFFf',
        '................FpFFFFFf',
        '................FFFFFFFF',
        '................FFFFFFoo',
        '.................FFFFFFF',
        '..................ffffff',
        '...............NNNNNWWFF',
        '............NNNNNNNNWWsF',
        '..........NNNNNNNNNNNWWs',
        '........NNNNNNNNNNNNNNWR',
        '.......NNNNNWWNNNNNNNNRR',
        '.......NNNNNWWNNNNNNNNNs',
        '......NNNNNNNNNNNNNNNNNs',
        '......NNNNNNNNNNNNNNNNNs',
        '......NNNNNNNNNNNNNNNNNs',
        '.......NNNN.NNNNNNNNNNNs',
        '...........BBTTBBTTBBTTB',
        '...........BBTTBBTTBBTTB',
        '..........BBTTBBTTBBTTBB',
        '..........BBTTBBTTBBTTBB',
        '.........BBTTBBTTBBTTBBo',
        '.........BBTTBBTTBBTTBo.',
        '.........BBTTBBTTBBTTBo.',
        '........BBTTBBTTBBTTBBo.',
        '........BBTTBBTTBBTTBo..',
        '...........WWWWWWW......',
        '...........WsWsWsW......',
        '...........WWWWWWW......',
        '..........TTTTTTTT......',
        '..........BTTTTTTB......',
        '........................',
      ],
    },
    // 星（左上・右上）
    { x: 39, y: 2, rows: ['..G..', '.GGG.', 'GGWGG', '.GGG.', '..G..'] },
    { x: 11, y: 12, rows: ['.G.', 'GWG', '.G.'] },
    // 方位ばんの ついた つえ（右手）
    { x: 2, y: 3, rows: ['.GGGG.', 'GPPRPG', 'GPPRPG', 'GPPoPG', 'GPPoPG', '.GGGG.', '..TT..'] },
    { x: 4, y: 10, rows: Array.from({ length: 36 }, () => 'TT') },
    { x: 2, y: 27, rows: ['.FFFF.', 'FFFFFF', 'FFFFFF', '.FFFF.'] },
    // 海岸線の 地図（左手）
    {
      x: 34,
      y: 23,
      rows: [
        'BTTTTTTTTTTTB',
        '.PPPPPPPPPZP.',
        '.PPPPPPPPZZP.',
        '.PPPPPPPZZPP.',
        '.PPPPPZZZPPP.',
        '.PPPPZZPPPPP.',
        '.PPZZZPPPPPP.',
        '.PZZPPPPPPPP.',
        '.PPZPPPPRPPP.',
        'BTTTTTTTTTTTB',
      ],
    },
    { x: 32, y: 27, rows: ['FFF', 'FFFF', 'FFF'] },
  ],
};

export const CHIBA: Readonly<Record<string, MonsterDesign>> = {
  'chiba-horipii': horipii,
  'chiba-peanight': peanight,
  'chiba-sharirin': sharirin,
  'chiba-kousui-hime': kousuiHime,
  'chiba-kujukurin': kujukurin,
  'chiba-naminori-gai': naminoriGai,
  'chiba-midboss-inubouken': inubouken,
  'chiba-midboss-inubouken.field': inuboukenField,
  'chiba-boss-shoyu-ryu': shoyuRyu,
  'chiba-boss-shoyu-ryu.p0': shoyuRyuP0,
  'chiba-lastboss-ino-tadataka': inoTadataka,
};
