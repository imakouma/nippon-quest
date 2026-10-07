/** 神奈川県の モンスター（手描き。docs/06 §4・§6.3〜6.5 の 規格） */
import { NQ } from '../palette';
import type { MonsterDesign } from './design';
import { FACE, HELMET, lord } from './lastbosses';

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
      if (Math.hypot(x - (ax + t * (bx - ax)), y - (ay + t * (by - ay))) <= r0 + (r1 - r0) * u) best = u;
      run += L;
    }
    return best;
  };
};
/** 左右 はんてんした ものも 入れる */
const mirrorX = (f: (x: number, y: number) => number, S: number) => (x: number, y: number) =>
  Math.max(f(x, y), f(S - 1 - x, y));

// ───────────────────────── 通常モンスター ─────────────────────────

/** 立ちあがった 魚：まるい 頭 → 細く なって → 下で おびれが ひろがる（おびれが 足） */
const fish = (cy: number, r: number, tailY: number, bottom: number) => (x: number, y: number) =>
  inEll(x, y, 15.5, cy, r, r) ||
  (y > cy && y <= tailY && Math.abs(x - 15.5) <= r * (1 - (y - cy) / (tailY - cy + 2))) ||
  (y > tailY && y <= bottom && Math.abs(x - 15.5) <= 1.5 + (y - tailY) * 1.4);

/** ピチラス：湘南の しらす。すきとおった 白い からだ、大きな 黒い 目、ぎんの すじ、まわりに 小さな なかま（ミズ） */
const PICHI = fish(13, 7.5, 24, 29);
const pichirasu: MonsterDesign = {
  size: 32,
  colors: { W: NQ.white, I: NQ.ice, s: NQ.silver, Z: NQ.azure, p: NQ.blush },
  rim: { [NQ.white]: NQ.ice, [NQ.ice]: NQ.sky, [NQ.azure]: NQ.blue },
  layers: [
    // 頭の ひれ・よこの ひれ
    { x: 13, y: 3, rows: ['.ZZZZ.', 'ZZZZZZ'] },
    { x: 5, y: 15, rows: ['ZZ..................ZZ', 'ZZZ................ZZZ', '.ZZ................ZZ.'] },
    {
      rows: plot(32, 32, (x, y) => {
        if (!PICHI(x, y)) return '.';
        if (y >= 18 && y <= 24 && Math.abs(x - 15.5) < 1) return 's';
        return y > 17 ? 'I' : 'W';
      }),
    },
    // 顔（大きな 黒い 目）
    {
      x: 10,
      y: 10,
      rows: ['.oo....oo.', 'oWo....oWo', 'ooo....ooo', '.oo....oo.', 'p........p', '....oo....'],
    },
    // 小さな なかま
    { x: 2, y: 22, rows: ['.WW.', 'WWWo', '.WW.'] },
    { x: 25, y: 5, rows: ['.WW.', 'oWWW', '.WW.'] },
  ],
};

/** 寄木の もよう：3 ドットの ますを ななめに わって、4 色の 木を ならべる */
const yosegi = (x: number, y: number): string => {
  const i = (Math.floor(x / 3) + Math.floor(y / 3)) % 2;
  const tri = (x % 3) + (y % 3) >= 3;
  return tri ? (i ? 'B' : 'K') : i ? 'S' : 'T';
};

/** ヒミツバコン：箱根寄木細工の ひみつばこ。上と ふちに 寄木の もよう、まん中の 板に 顔、右に ずらす 板（ツチ） */
const himitsubakon: MonsterDesign = {
  size: 32,
  colors: { E: NQ.beige, S: NQ.sand, T: NQ.tan, B: NQ.brown, K: NQ.bark, W: NQ.white, p: NQ.blush },
  rim: { [NQ.beige]: NQ.sand },
  layers: [
    // ふたの 上（少し 上から 見た 台形）
    {
      rows: plot(32, 32, (x, y) =>
        y >= 6 && y <= 10 && Math.abs(x - 15.5) <= 7.5 + (y - 6) * 0.6 ? yosegi(x, y) : '.',
      ),
    },
    { x: 5, y: 11, rows: ['KKKKKKKKKKKKKKKKKKKKKK'] },
    // 前の 面：ふちは 寄木、まん中は 板
    {
      rows: plot(32, 32, (x, y) => {
        if (y < 12 || y > 27 || x < 5 || x > 26) return '.';
        if (x >= 9 && x <= 22 && y >= 14 && y <= 25) return 'E';
        return yosegi(x, y);
      }),
    },
    {
      x: 8,
      y: 13,
      rows: ['KKKKKKKKKKKKKKKK', ...Array.from({ length: 12 }, () => 'K..............K'), 'KKKKKKKKKKKKKKKK'],
    },
    // ずらした 板（ひみつばこの しかけ）
    { x: 26, y: 15, rows: ['KKK', 'SSK', 'TTK', 'SSK', 'KKK'] },
    // 顔
    {
      x: 10,
      y: 17,
      rows: ['.WW......WW.', '.Wo......oW.', '.Wo......oW.', 'p..........p', '....oooo....', '.....oo.....'],
    },
    // 足
    { x: 6, y: 28, rows: ['KKK..............KKK', 'KKK..............KKK'] },
  ],
};

/** トビ（トンビ）の 顔と からだ（前から）。茶色の はね、うすい 顔、黄色い はなの つけねの まがった くちばし */
const tonbiBody = (x: number, y: number) =>
  inEll(x, y, 15.5, 10, 5.6, 5) ||
  inEll(x, y, 15.5, 18.5, 5.6, 6.8) ||
  (y >= 23 && y <= 28 && Math.abs(x - 15.5) <= 3 + (y - 23) * 0.6 && !(y >= 27 && Math.abs(x - 15.5) < 1.5));

/** ピーヒョロ：江の島の 空を まう トビ。ひろげた 茶色の つばさ、先の ゆび羽、ちょっと 切れこんだ おばね、足もとに 風（カゼ） */
const piihyoro: MonsterDesign = {
  size: 32,
  colors: {
    B: NQ.brown,
    T: NQ.tan,
    H: NQ.hairBrown,
    E: NQ.beige,
    W: NQ.white,
    Y: NQ.yellow,
    M: NQ.mint,
    p: NQ.blush,
  },
  rim: { [NQ.brown]: NQ.bark, [NQ.tan]: NQ.brown },
  layers: [
    // つばさ（左半分を かいて はんてん）
    {
      mirror: true,
      y: 8,
      rows: [
        '..........BB....',
        '.......BBBBB....',
        '.....BBBBTTT....',
        '...BBBBTTTTT....',
        '.HBBBTTTTTTT....',
        '.HBTTTTTTTTT....',
        '.H.HBTTTTTT.....',
        '.H.H.HBTTT......',
        '...H.H.HB.......',
        '.....H..........',
      ],
    },
    {
      rows: plot(32, 32, (x, y) =>
        tonbiBody(x, y) ? (inEll(x, y, 15.5, 19, 3, 4.5) ? ((x + y) % 3 === 0 ? 'B' : 'T') : 'B') : '.',
      ),
    },
    // 顔（うすい 顔・目・くちばし）
    {
      x: 11,
      y: 7,
      rows: [
        '.EEEEEEEE.',
        'EEEEEEEEEE',
        'EWWEEEEWWE',
        'EWoEEEEoWE',
        'EWoEYYEoWE',
        'pEEEYHEEEp',
        '.EEEEHEEE.',
      ],
    },
    // 足
    { x: 12, y: 24, rows: ['YY....YY'] },
    // 風
    {
      x: 2,
      y: 25,
      rows: ['MMWW..................WWMM', '..........................', '....MMW..............WMM..'],
    },
  ],
};

// ───────────────────────── しんか ─────────────────────────

/** イワシグン（ピチラスの しんか）：大きく なった マイワシ。青い せなか、ぎんの からだに 黒い「七つ星」の てんてん、まわりを 小さな イワシの むれが まわる（ミズ） */
const IWASHI = fish(13, 9, 25, 29);
const iwashigun: MonsterDesign = {
  size: 32,
  colors: { Z: NQ.azure, N: NQ.blue, s: NQ.silver, c: NQ.cloud, W: NQ.white, K: NQ.sky, p: NQ.blush },
  rim: { [NQ.azure]: NQ.blue, [NQ.cloud]: NQ.silver, [NQ.white]: NQ.cloud },
  layers: [
    // まわりを まわる 小さな イワシ
    { x: 1, y: 6, rows: ['.cc.', 'cccZ', '.cc.'] },
    { x: 27, y: 9, rows: ['.cc.', 'Zccc', '.cc.'] },
    { x: 2, y: 24, rows: ['.cc.', 'cccZ', '.cc.'] },
    { x: 26, y: 22, rows: ['.cc.', 'Zccc', '.cc.'] },
    // ひれ
    { x: 12, y: 1, rows: ['..ZZZZ..', '.ZZZZZZ.', 'ZZZZZZZZ'] },
    {
      x: 3,
      y: 14,
      rows: ['ZZZ....................ZZZ', 'ZZZZ..................ZZZZ', '.ZZZ..................ZZZ.'],
    },
    {
      rows: plot(32, 32, (x, y) => {
        if (!IWASHI(x, y)) return '.';
        if (y > 25) return 'Z';
        if (y < 9) return litEdge(IWASHI, x, y) ? 'K' : 'Z';
        if (Math.abs(x - 15.5) <= 3 && y > 17) return 'W';
        return 'c';
      }),
    },
    // 七つ星（よこの 黒い てんてん）
    {
      x: 7,
      y: 14,
      rows: [
        'o................o',
        '................',
        '.o..............o.',
        '................',
        '..o............o..',
        '................',
        '....o........o....',
      ],
    },
    // 顔（きりっと）
    {
      x: 10,
      y: 8,
      rows: [
        '.oo....oo.',
        '..o....o..',
        '.WW....WW.',
        '.Wo....oW.',
        '.Wo....oW.',
        'p........p',
        '...oooo...',
      ],
    },
  ],
};

/** カラクリジョウ（ヒミツバコンの しんか）：寄木の はこの からだに、小田原城のような 白い かべと 黒い 屋根の 頭、はこを つんだ うでと 足（ツチ） */
const karakuriJo: MonsterDesign = {
  size: 32,
  colors: {
    E: NQ.beige,
    S: NQ.sand,
    T: NQ.tan,
    B: NQ.brown,
    K: NQ.bark,
    W: NQ.white,
    L: NQ.slate,
    N: NQ.night,
    G: NQ.gold,
    p: NQ.blush,
  },
  rim: { [NQ.beige]: NQ.sand, [NQ.white]: NQ.cloud, [NQ.slate]: NQ.night },
  layers: [
    // 天守の 頭：しゃちほこ・屋根・白い かべ・屋根
    {
      mirror: true,
      y: 1,
      rows: [
        '..........G.....',
        '..........GG....',
        '...........LLLLL',
        '.........LLLLLLL',
        '......LLLLLLLLLL',
        '.....L.WWWWWWWWW',
        '.......WWKWWWKWW',
        '.......WWWWWWWWW',
        '....LLLLLLLLLLLL',
        '...L.LLLLLLLLLLL',
        '.....NNNNNNNNNNN',
      ],
    },
    // はこの からだ
    {
      rows: plot(32, 32, (x, y) => {
        if (y < 12 || y > 26 || x < 5 || x > 26) return '.';
        if (x >= 9 && x <= 22 && y >= 14 && y <= 24) return 'E';
        return yosegi(x, y);
      }),
    },
    {
      x: 8,
      y: 13,
      rows: ['KKKKKKKKKKKKKKKK', ...Array.from({ length: 10 }, () => 'K..............K'), 'KKKKKKKKKKKKKKKK'],
    },
    // はこを つんだ うで
    { x: 1, y: 14, rows: ['SSTT', 'TBBS', 'SSTT', 'KKKK', 'TTSS', 'SBBT', 'TTSS'] },
    { x: 27, y: 14, rows: ['TTSS', 'SBBT', 'TTSS', 'KKKK', 'SSTT', 'TBBS', 'SSTT'] },
    // 顔（きりっと）
    {
      x: 10,
      y: 15,
      rows: [
        '.oo......oo.',
        '..o......o..',
        '.WW......WW.',
        '.Wo......oW.',
        '.Wo......oW.',
        'p..........p',
        '....oooo....',
      ],
    },
    // はこの 足
    { x: 7, y: 27, rows: ['STTS........STTS', 'TBBT........TBBT', 'KKKK........KKKK'] },
  ],
};

/** カザキリトンビ（ピーヒョロの しんか）：つばさを 高く かかげた 大きな トビ。長い 風切り羽、きりっとした 目、白い 風の すじ（カゼ） */
const KAZA_WING = mirrorX(
  tube(
    [
      [12, 14],
      [6.5, 8],
      [2.5, 2.5],
    ],
    3.8,
    1.6,
  ),
  32,
);
const kazakiriTonbi: MonsterDesign = {
  size: 32,
  colors: {
    B: NQ.brown,
    T: NQ.tan,
    H: NQ.hairBrown,
    E: NQ.beige,
    W: NQ.white,
    Y: NQ.yellow,
    M: NQ.mint,
    A: NQ.aqua,
    p: NQ.blush,
  },
  rim: { [NQ.brown]: NQ.bark, [NQ.tan]: NQ.brown },
  layers: [
    // かかげた つばさ
    {
      rows: plot(32, 32, (x, y) => {
        const u = KAZA_WING(x, y);
        if (u < 0 || y < 1 || x < 1 || x > 30) return '.';
        if (u > 0.7) return 'H';
        return Math.abs(x - 15.5) < 9 - y * 0.2 ? 'T' : 'B';
      }),
    },
    // 風切り羽の ゆび
    { x: 1, y: 5, rows: ['H.H', 'H.H.H', '..H.H'] },
    { x: 27, y: 5, rows: ['.H.H', 'H.H.', 'H.H.'] },
    {
      rows: plot(32, 32, (x, y) =>
        tonbiBody(x, y) ? (inEll(x, y, 15.5, 19, 3, 4.5) ? ((x + y) % 3 === 0 ? 'W' : 'T') : 'B') : '.',
      ),
    },
    {
      x: 11,
      y: 6,
      rows: [
        '.oo....oo.',
        '.EooEEooE.',
        'EEEEEEEEEE',
        'EWWEEEEWWE',
        'EWoEEEEoWE',
        'EWoEYYEoWE',
        'pEEEYHEEEp',
        '.EEEEHEEE.',
      ],
    },
    { x: 12, y: 24, rows: ['YY....YY'] },
    // 風の すじ
    { x: 1, y: 20, rows: ['WW...', '.MMW.', '...AM'] },
    { x: 26, y: 20, rows: ['...WW', '.WMM.', 'MA...'] },
    { x: 3, y: 27, rows: ['MMWW..............WWMM'] },
  ],
};

// ───────────────────────── 中ボス ─────────────────────────

/** クロタマゴンの からだ（S＝キャンバスの 大きさ） */
const tamagoParts = (S: number) => {
  const k = S / 40;
  const c = (S - 1) / 2;
  const egg = (x: number, y: number) => inEll(x, y, c, 21.5 * k, 11.5 * k, 14 * k);
  const arm = mirrorX(
    tube(
      [
        [c - 10 * k, 22 * k],
        [c - 15 * k, 27 * k],
        [c - 15.5 * k, 32 * k],
      ],
      3.5 * k,
      3 * k,
    ),
    S,
  );
  const fist = (x: number, y: number) =>
    inEll(x, y, c - 15.5 * k, 33.5 * k, 3.8 * k, 3.2 * k) ||
    inEll(x, y, c + 15.5 * k, 33.5 * k, 3.8 * k, 3.2 * k);
  const leg = (x: number, y: number) =>
    y >= 32 * k && y <= S - 2 && Math.abs(x - c) >= 2.5 * k && Math.abs(x - c) <= 8.5 * k;
  return { egg, arm, fist, leg };
};
/** 岩：灰色（g）に 銀の ふち（s）と 黄色い 硫黄（Y）の つぶ */
const rocky = (inside: (x: number, y: number) => boolean) => (x: number, y: number) =>
  !inside(x, y) ? '.' : litEdge(inside, x, y) ? 's' : (x * 5 + y * 3) % 13 === 0 ? 'Y' : 'g';

/**
 * クロタマゴン（中ボス）：大涌谷の 黒たまごの 大きな モンスター。まっ黒で つやつやの たまごの からだ、上の ひびから 白身と ゆげ、
 * 硫黄の つぶが ついた 岩の うでと 足。たまごの てっぺんに 王冠（ツチ → 後半 ヒノ）
 */
const TAMA = tamagoParts(40);
const kurotamagon: MonsterDesign = {
  size: 40,
  colors: {
    N: NQ.night,
    L: NQ.slate,
    g: NQ.gray,
    s: NQ.silver,
    Y: NQ.yellow,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    W: NQ.white,
    c: NQ.cloud,
  },
  rim: { [NQ.gray]: NQ.slate, [NQ.gold]: NQ.ochre, [NQ.white]: NQ.cloud },
  rimDepth: 2,
  layers: [
    // ゆげ
    { x: 2, y: 3, rows: ['..WWW...', '.WWcWW..', 'WWccWWW.', '.WWcWW..', '..WW....'] },
    { x: 30, y: 2, rows: ['...WWW..', '..WWcWW.', '.WWWccWW', '..WWcWW.', '....WW..'] },
    {
      rows: plot(
        40,
        40,
        rocky((x, y) => TAMA.arm(x, y) >= 0 || TAMA.fist(x, y)),
      ),
    },
    { rows: plot(40, 40, rocky(TAMA.leg)) },
    // 黒い たまご（左上に 大きな つや）
    {
      rows: plot(40, 40, (x, y) => {
        if (!TAMA.egg(x, y)) return '.';
        if (inEll(x, y, 13.5, 13, 2.2, 3.6)) return 'L';
        return litEdge(TAMA.egg, x, y) ? 'L' : 'N';
      }),
    },
    { x: 12, y: 10, rows: ['.W', 'W.'] },
    // 上の ひびから 白身
    { x: 22, y: 8, rows: ['o.o.o', 'WoWoW', 'WWWWW', '.WWW.'] },
    // 王冠
    {
      mirror: true,
      y: 3,
      rows: ['................G..G', '................GGGR', '................GGGR', '................QQQQ'],
    },
    // 顔：まゆ・白い 目（3×4）・歯を 見せて にやり
    {
      mirror: true,
      y: 16,
      rows: [
        '............sss.....',
        '..............ss....',
        '.............WWW....',
        '.............WWo....',
        '.............Woo....',
        '.............Woo....',
        '....................',
        '...............ooooo',
        '...............oWWWW',
        '................oooo',
      ],
    },
    // 足もとの 硫黄
    { x: 3, y: 36, rows: ['.Y..', 'YYY.', 'YYYY'] },
    { x: 33, y: 36, rows: ['..Y.', '.YYY', 'YYYY'] },
  ],
};

/** クロタマゴン（フィールドに 立つ 32×32） */
const TAMA_F = tamagoParts(32);
const kurotamagonField: MonsterDesign = {
  size: 32,
  colors: {
    N: NQ.night,
    L: NQ.slate,
    g: NQ.gray,
    s: NQ.silver,
    Y: NQ.yellow,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    W: NQ.white,
  },
  rim: { [NQ.gray]: NQ.slate, [NQ.gold]: NQ.ochre },
  layers: [
    { x: 2, y: 3, rows: ['.WW.', 'WWWW', '.WW.'] },
    { x: 26, y: 2, rows: ['.WW.', 'WWWW', '.WW.'] },
    {
      rows: plot(
        32,
        32,
        rocky((x, y) => TAMA_F.arm(x, y) >= 0 || TAMA_F.fist(x, y)),
      ),
    },
    { rows: plot(32, 32, rocky(TAMA_F.leg)) },
    {
      rows: plot(32, 32, (x, y) =>
        !TAMA_F.egg(x, y) ? '.' : inEll(x, y, 11, 10.5, 1.6, 2.8) || litEdge(TAMA_F.egg, x, y) ? 'L' : 'N',
      ),
    },
    { x: 18, y: 7, rows: ['o.o.', 'WWWW'] },
    { mirror: true, y: 2, rows: ['.............G.G', '.............GGR', '.............QQQ'] },
    {
      mirror: true,
      y: 13,
      rows: [
        '..........ss....',
        '...........WW...',
        '...........Wo...',
        '...........Wo...',
        '................',
        '............oooo',
        '............oWWW',
      ],
    },
  ],
};

// ───────────────────────── 県ボス ─────────────────────────

/** 獅子の 頭（大きな まるい 顔）と、うしろに ひろがる からだの 布 */
const SHISHI = {
  head: (x: number, y: number) => inEll(x, y, 23.5, 16, 16, 12),
  cloth: (x: number, y: number) => y >= 18 && y <= 40 && Math.abs(x - 23.5) <= 13 + (y - 18) * 0.42,
  leg: (x: number, y: number) => y >= 38 && y <= 46 && Math.abs(x - 23.5) >= 3.5 && Math.abs(x - 23.5) <= 9,
};
/** 布の うろこ もよう（金の 半円） */
const scales = (x: number, y: number) => {
  const row = Math.floor(y / 3);
  const cx = ((x + (row % 2) * 2) % 4) - 1.5;
  const cy = (y % 3) - 0.5;
  return Math.hypot(cx, cy) > 1.6 ? 'G' : 'R';
};

/**
 * ヨコハマシシオウ（県ボス）：横浜中華街の 春節の 獅子舞の 王。大きな 赤い 獅子の 頭、おでこに まるい かがみ、
 * 金の まぶたの 大きな 目、白い ふさふさの まゆと あごひげ、大きく あけた 口。うしろに うろこ もようの 布、足には 毛の すそ（ヒノ）
 */
const yokohamaShishiOh: MonsterDesign = {
  size: 48,
  colors: {
    R: NQ.red,
    G: NQ.gold,
    Q: NQ.ochre,
    W: NQ.white,
    c: NQ.cloud,
    K: NQ.bark,
    E: NQ.green,
    S: NQ.sky,
    p: NQ.blush,
    A: NQ.apricot,
    Y: NQ.yellow,
  },
  rim: { [NQ.red]: NQ.brick, [NQ.gold]: NQ.ochre, [NQ.white]: NQ.cloud },
  rimDepth: 2,
  layers: [
    // からだの 布（うしろ）と 白い 毛の すそ
    {
      rows: plot(48, 48, (x, y) => {
        if (!SHISHI.cloth(x, y) || x < 1 || x > 46) return '.';
        if (y >= 38) return (x + y) % 2 === 0 ? 'W' : 'c';
        return scales(x, y);
      }),
    },
    // 足（毛の すそと くつ）
    { rows: plot(48, 48, (x, y) => (SHISHI.leg(x, y) ? (y >= 45 ? 'K' : y >= 42 ? 'W' : 'R') : '.')) },
    // 頭
    { rows: plot(48, 48, (x, y) => (SHISHI.head(x, y) ? (litEdge(SHISHI.head, x, y) ? 'A' : 'R') : '.')) },
    // 頭の まわりの 白い 毛・耳
    {
      mirror: true,
      y: 5,
      rows: [
        '..............WW........',
        '..........WWWWcW........',
        '.......WWWcW............',
        '.....WWcWW..............',
        '....WcW.................',
        '...WWW..................',
        '..WcW...................',
        '..WWW...................',
        '.WcW....................',
        '.WWW....................',
        '.WcW....................',
        '..WW....................',
        '..WcW...................',
        '...WW...................',
      ],
    },
    // 王冠・かがみ・まぶた・大きな 目・はな・口・あごひげ
    {
      mirror: true,
      rows: [
        '........................',
        '....................G..G',
        '....................GGGR',
        '....................GGGR',
        '....................QQQQ',
        '....................GGGG',
        '...................GGSSS',
        '..................GGSSWW',
        '..................GGSSSS',
        '...................GGSSS',
        '..........WWWWWW....GGGG',
        '.........WWcWWcWW.......',
        '.........GGGGGGGG.......',
        '........GWWWWWWWG.......',
        '........GWWWWooWG.......',
        '........GWWWoooWG..AAAAA',
        '........GWWWoooWG.AAAAAA',
        '.........GWWWWWG..AAAAAY',
        '..........GGGGG....AAAAA',
        '....EE..................',
        '...EEEE...oooooooooooooo',
        '....EE...oKKWWWWWWWWWWWW',
        '.........oKKKKKKKKKKKKKK',
        '.........oKKKKKKpppppppp',
        '..........oKKKppppppppp.',
        '...........oWWWWWWWWWWWW',
        '...........WWcWWcWWcWWcW',
        '............WWcWWcWWcWWc',
        '.............WWWcWWWcWWW',
        '...............WWWWcWWWW',
        '.................WWWWWWW',
      ],
    },
  ],
};

/** ヨコハマシシオウ 後半：まわりに 炎と 爆竹の 火花が はじけ、目が 金色に 光る（ヒノ・2 回 こうげき） */
const yokohamaShishiOhP0: MonsterDesign = {
  ...yokohamaShishiOh,
  colors: { ...yokohamaShishiOh.colors, V: NQ.vermilion, C: NQ.cream, W: NQ.white },
  layers: [
    // 炎（うしろ）
    {
      mirror: true,
      x: 1,
      y: 2,
      rows: [
        '.....C.................',
        '.....A.............',
        '....VAV.......',
        '....VAV..',
        '...VVAVV',
        '...VAAAV',
        '..VVAAV',
        '..VAAV',
        '.VVAV',
        '.VAAV',
        '.VAV',
        'VVAV',
        'VAAV',
        'VAV',
        'VVAV',
        '.VAV',
        '.VV',
      ],
    },
    ...yokohamaShishiOh.layers,
    // 目が 金色に
    {
      mirror: true,
      y: 13,
      rows: [
        '........................',
        '.........YYYYYYY........',
        '.........YYYYooY........',
        '.........YYYoooY........',
        '.........YYYoooY........',
        '..........YYYYY.........',
      ],
    },
    // 爆竹の 火花
    { x: 2, y: 40, rows: ['.C.', 'CVC', '.C.'] },
    { x: 43, y: 40, rows: ['.C.', 'CVC', '.C.'] },
    { x: 1, y: 1, rows: ['C.C', '.V.', 'C.C'] },
    { x: 44, y: 1, rows: ['C.C', '.V.', 'C.C'] },
  ],
};

// ───────────────────────── 裏ステージの ラスボス ─────────────────────────

/**
 * 源頼朝（ラスボス）：源氏の 家の しるし「笹竜胆（ささりんどう）」の 金の 前立てと 金の くわがた、黒い かぶと、白い よろいに 赤い ひも。
 * 右に 源氏の 白い 旗（ヒカリ）
 */
const minamotoYoritomo = lord(
  [
    '........................',
    '...GG...................',
    '...GYG..............G..G',
    '....GYG............GYGGY',
    '.....GYG............GGGG',
    '......GYG..........G.GGG',
    '.......GYGG.......GYG.GG',
    '.........GYGG......GGGGG',
    '...........GGGGGGGGGYGGG',
    '..............NNGGGGGGGG',
    ...HELMET,
    ...FACE,
  ],
  {
    N: NQ.night,
    L: NQ.slate,
    K: NQ.paper,
    S: NQ.cloud,
    G: NQ.gold,
    Y: NQ.yellow,
    R: NQ.red,
    T: NQ.navy,
    H: NQ.slate,
    B: NQ.brown,
  },
  { [NQ.paper]: NQ.cloud },
  [
    // 源氏の 白い 旗（よこ木から さげる）
    { x: 44, y: 3, rows: Array.from({ length: 43 }, (_, i) => (i === 0 ? 'BB' : 'B.')) },
    {
      x: 35,
      y: 3,
      rows: [
        'BBBBBBBBB',
        '.KKKKKKK.',
        '.KKKKKKK.',
        '.KKKKKKK.',
        '.KKKKKKK.',
        '.KKKKKKS.',
        '.KKKKKSS.',
        '.KKKKKKK.',
        '.KKKKKKK.',
        '.K.KKK.K.',
      ],
    },
  ],
);

export const KANAGAWA: Readonly<Record<string, MonsterDesign>> = {
  'kanagawa-pichirasu': pichirasu,
  'kanagawa-iwashigun': iwashigun,
  'kanagawa-himitsubakon': himitsubakon,
  'kanagawa-karakuri-jo': karakuriJo,
  'kanagawa-piihyoro': piihyoro,
  'kanagawa-kazakiri-tonbi': kazakiriTonbi,
  'kanagawa-midboss-kurotamagon': kurotamagon,
  'kanagawa-midboss-kurotamagon.field': kurotamagonField,
  'kanagawa-boss-yokohama-shishi-oh': yokohamaShishiOh,
  'kanagawa-boss-yokohama-shishi-oh.p0': yokohamaShishiOhP0,
  'kanagawa-lastboss-minamoto-yoritomo': minamotoYoritomo,
};
