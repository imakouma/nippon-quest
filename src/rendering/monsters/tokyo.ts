/** 東京都の モンスター（手描き。docs/06 §4・§6.3〜6.5 の 規格） */
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

/** 練馬だいこん：白くて 細長い。上の 方は うすい みどり、下は 細い 根っこ */
const daikon = (cy: number, rx: number, ry: number) => (x: number, y: number) =>
  inEll(x, y, 15.5, cy, rx, ry) ||
  (y >= cy + ry - 1.5 && y <= cy + ry + 1.5 && Math.abs(x - 15.5) <= cy + ry + 1.5 - y);
const daikonFill = (inside: (x: number, y: number) => boolean, neck: number) =>
  plot(32, 32, (x, y) => {
    if (!inside(x, y) || y > 29) return '.';
    if (y <= neck) return 'S';
    return (x * 3 + y * 5) % 17 === 0 && y > neck + 4 ? 'c' : 'W';
  });

/** ネリコン：練馬だいこんの 子。白い 細長い からだ、みどりの くび、3 まいの 葉っぱ、細い 根っこ（モリ） */
const NERI = daikon(17, 5.6, 11.5);
const NERI_LEAF = (x: number, y: number) =>
  Math.max(
    tube(
      [
        [15.5, 9],
        [15.5, 1.6],
      ],
      1.9,
      1.3,
    )(x, y),
    mirrorX(
      tube(
        [
          [14.5, 8],
          [11, 3.5],
          [8.5, 2],
        ],
        1.6,
        1.1,
      ),
      32,
    )(x, y),
  );
const nerikon: MonsterDesign = {
  size: 32,
  colors: { W: NQ.white, c: NQ.cloud, S: NQ.sprout, L: NQ.leaf, G: NQ.green, p: NQ.blush },
  rim: { [NQ.white]: NQ.cloud, [NQ.leaf]: NQ.green, [NQ.sprout]: NQ.lime },
  layers: [
    { rows: plot(32, 32, (x, y) => (NERI_LEAF(x, y) >= 0 ? ((x + y) % 4 === 0 ? 'G' : 'L') : '.')) },
    // うで
    { x: 8, y: 17, rows: ['WW..............WW', 'WW..............WW'] },
    { rows: daikonFill(NERI, 9) },
    // 顔
    {
      x: 11,
      y: 13,
      rows: ['.WW....WW.', '.Wo....oW.', '.Wo....oW.', 'p........p', '...o..o...', '....oo....'],
    },
  ],
};

/** 江戸切子の グラス：上が 少し ひろい つつ。下は あつい すきとおった ガラス */
const cup = (top: number, bottom: number, w: number) => (x: number, y: number) =>
  y >= top &&
  y <= bottom &&
  Math.abs(x - 15.5) <= w - (y - top) * 0.18 - (y >= bottom - 2 ? (y - bottom + 3) * 0.9 : 0);
/** けずった もよう（ななめの 格子）。まん中の ひし形に きらり */
const kirikoCut = (x: number, y: number): string =>
  (x + y) % 5 === 0 || (x - y + 50) % 5 === 0 ? 'I' : (x + y) % 5 === 2 && (x - y + 50) % 5 === 2 ? 'S' : 'Z';

/** キラリコ：江戸切子の 青い グラス。ななめの 格子の けずり もよう、すきとおった 口と 底、金の わっか、きらきら（ヒカリ） */
const KIRA = cup(9, 28, 10.5);
const kirariko: MonsterDesign = {
  size: 32,
  colors: {
    Z: NQ.azure,
    I: NQ.ice,
    S: NQ.sky,
    W: NQ.white,
    C: NQ.cream,
    G: NQ.gold,
    Q: NQ.ochre,
    p: NQ.blush,
  },
  rim: { [NQ.azure]: NQ.blue, [NQ.ice]: NQ.sky },
  layers: [
    {
      rows: plot(32, 32, (x, y) => {
        if (!KIRA(x, y)) return '.';
        if (y >= 25) return x % 3 === 0 ? 'S' : 'I';
        if (y <= 10) return 'I';
        return kirikoCut(x, y);
      }),
    },
    // グラスの 口（中が 見える）
    { x: 7, y: 8, rows: ['..IIIIIIIIIIII..', 'IISSSSSSSSSSSSII', '..IIIIIIIIIIII..'] },
    // 顔の まど
    {
      x: 9,
      y: 14,
      rows: [
        'ZZZZZZZZZZZZZZ',
        'ZZWWZZZZZZWWZZ',
        'ZZWoZZZZZZoWZZ',
        'ZZWoZZZZZZoWZZ',
        'ZpZZZZooZZZZpZ',
        'ZZZZZZZZZZZZZZ',
      ],
    },
    // 金の わっか
    { x: 10, y: 3, rows: ['..GGGGGGGG..', 'GG........GG', '..QQQQQQQQ..'] },
    // きらきら
    { x: 2, y: 6, rows: ['.W.', 'WCW', '.W.'] },
    { x: 27, y: 13, rows: ['.W.', 'WCW', '.W.'] },
  ],
};

/** ムササビの まく：前足と 後ろ足の あいだに はった 四角い まく。よこと 下は 内がわへ へこむ */
const membrane = (x0: number, x1: number, y0: number, y1: number) => (x: number, y: number) =>
  x >= x0 &&
  x <= x1 &&
  y >= y0 &&
  y <= y1 &&
  !inEll(x, y, x0 - 2.2, (y0 + y1) / 2, 4, (y1 - y0) / 2 - 2) &&
  !inEll(x, y, x1 + 2.2, (y0 + y1) / 2, 4, (y1 - y0) / 2 - 2) &&
  !inEll(x, y, 15.5, y1 + 2.5, 7, 3.2);

/** ムササビュン：高尾山の ムササビ。まくを ひろげて すべる、大きな 目、白い ほおの すじ、ふさふさの しっぽ、風（カゼ） */
const MUSA = membrane(2, 29, 10, 24);
const musasabyun: MonsterDesign = {
  size: 32,
  colors: {
    T: NQ.tan,
    B: NQ.brown,
    E: NQ.beige,
    W: NQ.white,
    p: NQ.blush,
    M: NQ.mint,
    A: NQ.aqua,
  },
  rim: { [NQ.tan]: NQ.brown, [NQ.brown]: NQ.bark },
  layers: [
    // しっぽ
    {
      rows: plot(32, 32, (x, y) =>
        inEll(x, y, 15.5, 26.5, 3.6, 3.8) && y <= 29 ? (Math.abs(x - 15.5) < 1 ? 'T' : 'B') : '.',
      ),
    },
    // まく
    { rows: plot(32, 32, (x, y) => (MUSA(x, y) ? (litEdge(MUSA, x, y) ? 'E' : 'T') : '.')) },
    // 4 本の 足
    { x: 1, y: 9, rows: ['BB..........................BB', 'BB..........................BB'] },
    { x: 1, y: 23, rows: ['BB..........................BB', 'BB..........................BB'] },
    // からだと おなか
    {
      rows: plot(32, 32, (x, y) =>
        inEll(x, y, 15.5, 18.5, 3.5, 4.5) ? 'E' : inEll(x, y, 15.5, 17.5, 5.5, 6.5) ? 'B' : '.',
      ),
    },
    // 頭・耳
    {
      rows: plot(32, 32, (x, y) =>
        inEll(x, y, 15.5, 9.5, 6.5, 5.5) ||
        inEll(x, y, 10.5, 4.8, 1.8, 1.8) ||
        inEll(x, y, 20.5, 4.8, 1.8, 1.8)
          ? 'T'
          : '.',
      ),
    },
    // 顔（大きな 目・白い ほおの すじ）
    {
      x: 9,
      y: 7,
      rows: ['..oo....oo..', '.oWo....oWo.', '.ooo....ooo.', '.ooo....ooo.', 'WWWWp..pWWWW', '.....oo.....'],
    },
    // 風
    {
      x: 1,
      y: 27,
      rows: ['MMAA..................AAMM', '..........................', '...MMA..............AMM...'],
    },
  ],
};

// ───────────────────────── しんか ─────────────────────────

/** ダイコンザムライ（ネリコンの しんか）：葉っぱの ちょんまげを 赤い ひもで ゆい、みどりの かたぎぬと はかまの だいこんの さむらい。こしに 手（モリ） */
const ZAMU = daikon(17.5, 7, 11.5);
const ZAMU_KNOT = (x: number, y: number) =>
  Math.max(
    tube(
      [
        [15.5, 9],
        [15.5, 3.5],
      ],
      2,
      1.6,
    )(x, y),
    mirrorX(
      tube(
        [
          [15.5, 4],
          [12.5, 2],
          [10, 1.6],
        ],
        1.3,
        0.9,
      ),
      32,
    )(x, y),
  );
const daikonZamurai: MonsterDesign = {
  size: 32,
  colors: {
    W: NQ.white,
    c: NQ.cloud,
    S: NQ.sprout,
    L: NQ.leaf,
    G: NQ.green,
    F: NQ.forest,
    R: NQ.red,
    p: NQ.blush,
  },
  rim: { [NQ.white]: NQ.cloud, [NQ.leaf]: NQ.green, [NQ.sprout]: NQ.lime },
  layers: [
    { rows: plot(32, 32, (x, y) => (ZAMU_KNOT(x, y) >= 0 ? ((x + y) % 4 === 0 ? 'G' : 'L') : '.')) },
    { x: 14, y: 6, rows: ['RRRR'] },
    { rows: daikonFill(ZAMU, 10) },
    // かたぎぬ（かたの 張った 上着）と はかま
    {
      x: 3,
      y: 15,
      rows: [
        'GGGGGGGGG........GGGGGGGGG',
        '.LLLLLLLLG......GLLLLLLLL.',
        '.....LLLLLG....GLLLLL.....',
        '.......LLLL....LLLL.......',
        '.......LLLL....LLLL.......',
        '.......LLLLLLLLLLLL.......',
        '.......LFLLFLLFLLFL.......',
        '.......LFLLFLLFLLFL.......',
        '........LLLLLLLLLL........',
      ],
    },
    // こしに あてた 手
    { x: 7, y: 20, rows: ['WW', 'WW'] },
    { x: 23, y: 20, rows: ['WW', 'WW'] },
    // 顔（きりっと）
    {
      x: 11,
      y: 8,
      rows: ['.oo....oo.', '..o....o..', '.WW....WW.', '.Wo....oW.', '.Wo....oW.', 'p..oooo..p'],
    },
  ],
};

/** カガヤキリコ（キラリコの しんか）：ふたの かぶとを かぶった 大きな 切子の グラス。上に 紅（あか）、下に 瑠璃（あお）の 2 色、大きな 金の わっか（ヒカリ） */
const KAGA = cup(10, 29, 11.5);
const kagayakiriko: MonsterDesign = {
  size: 32,
  colors: {
    Z: NQ.azure,
    I: NQ.ice,
    S: NQ.sky,
    W: NQ.white,
    C: NQ.cream,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    p: NQ.blush,
  },
  rim: { [NQ.azure]: NQ.blue, [NQ.ice]: NQ.sky, [NQ.red]: NQ.brick },
  layers: [
    // 大きな 金の わっか（ふたの うしろ）
    {
      rows: plot(32, 32, (x, y) =>
        inEll(x, y, 15.5, 6, 13, 2.6) && !inEll(x, y, 15.5, 6, 11.5, 1.4) ? (y > 6 ? 'Q' : 'G') : '.',
      ),
    },
    {
      rows: plot(32, 32, (x, y) => {
        if (!KAGA(x, y)) return '.';
        if (y >= 26) return x % 3 === 0 ? 'S' : 'I';
        if (y <= 16) return (x + y) % 4 === 0 || (x - y + 40) % 4 === 0 ? 'W' : 'R';
        return kirikoCut(x, y);
      }),
    },
    // ふた（すきとおった かぶと）と 金の つまみ
    {
      rows: plot(32, 32, (x, y) =>
        inEll(x, y, 15.5, 10, 9, 5) && y <= 10 ? (x % 3 === 0 ? 'S' : 'I') : '.',
      ),
    },
    { x: 14, y: 3, rows: ['.GG.', 'GGGG'] },
    // 顔の まど
    {
      x: 8,
      y: 17,
      rows: [
        'ZZZZZZZZZZZZZZZZ',
        'ZZooZZZZZZZZooZZ',
        'ZZZWWZZZZZZWWZZZ',
        'ZZZWoZZZZZZoWZZZ',
        'ZZZWoZZZZZZoWZZZ',
        'ZZpZZZZooZZZZpZZ',
      ],
    },
    // 小さな ガラスの うで
    { x: 1, y: 18, rows: ['.II', 'III', 'II.'] },
    { x: 28, y: 15, rows: ['.I.', 'II.', '.II', '.II'] },
    // きらきら
    { x: 1, y: 11, rows: ['.W.', 'WCW', '.W.'] },
    { x: 27, y: 22, rows: ['.W.', 'WCW', '.W.'] },
    { x: 26, y: 10, rows: ['C'] },
  ],
};

/** ツキヨムササビ（ムササビュンの しんか）：うしろに 三日月と 星。大きく ひろげた まく、きりっとした 目、足もとに 風（カゼ） */
const TSUKI = membrane(1, 30, 9, 25);
const tsukiyoMusasabi: MonsterDesign = {
  size: 32,
  colors: {
    T: NQ.tan,
    B: NQ.brown,
    E: NQ.beige,
    W: NQ.white,
    C: NQ.cream,
    Y: NQ.yellow,
    M: NQ.mint,
    A: NQ.aqua,
    p: NQ.blush,
  },
  rim: { [NQ.tan]: NQ.brown, [NQ.brown]: NQ.bark, [NQ.mint]: NQ.aqua },
  layers: [
    // 三日月（右上）
    {
      rows: plot(32, 32, (x, y) =>
        inEll(x, y, 26.5, 4.5, 4.2, 3.8) && !inEll(x, y, 28.5, 3.2, 3.4, 3.2) && y >= 1 && x <= 30
          ? x > 25
            ? 'Y'
            : 'C'
          : '.',
      ),
    },
    { x: 2, y: 2, rows: ['.C.', 'CWC', '.C.'] },
    {
      rows: plot(32, 32, (x, y) =>
        inEll(x, y, 15.5, 27, 4, 3.8) && y <= 29 ? (Math.abs(x - 15.5) < 1 ? 'T' : 'B') : '.',
      ),
    },
    {
      rows: plot(32, 32, (x, y) =>
        TSUKI(x, y)
          ? litEdge(TSUKI, x, y)
            ? 'E'
            : (x + y) % 7 === 0 && Math.abs(x - 15.5) > 7
              ? 'B'
              : 'T'
          : '.',
      ),
    },
    {
      x: 1,
      y: 7,
      rows: [
        'BBB..........................BBB'.slice(0, 30),
        'BB............................BB'.slice(0, 30),
      ],
    },
    { x: 1, y: 24, rows: ['BB..........................BB', 'BBB........................BBB'] },
    {
      rows: plot(32, 32, (x, y) =>
        inEll(x, y, 15.5, 18.5, 3.5, 4.5) ? 'E' : inEll(x, y, 15.5, 17.5, 5.8, 6.8) ? 'B' : '.',
      ),
    },
    {
      rows: plot(32, 32, (x, y) =>
        inEll(x, y, 15.5, 9, 6.8, 5.5) || inEll(x, y, 10, 4.2, 1.8, 2) || inEll(x, y, 21, 4.2, 1.8, 2)
          ? 'T'
          : '.',
      ),
    },
    // 顔（きりっと）
    {
      x: 9,
      y: 6,
      rows: ['.oo......oo.', '..ooo..ooo..', '.oWo....oWo.', '.ooo....ooo.', 'WWWWp..pWWWW', '.....oo.....'],
    },
    // 風
    { x: 2, y: 28, rows: ['MMAA..............AAMM', '....................', '..MMA...........AMM..'] },
  ],
};

// ───────────────────────── 中ボス ─────────────────────────

/**
 * デンパオー（中ボス）：東京タワーの 鉄骨の ロボット。赤と 白の しまの 鉄骨、大展望台の 顔（黒い バイザーに 金の 目）、
 * 頭から のびる 上の 塔と アンテナ、左右へ ひろがる 電波。塔の 根もとに 王冠（カゼ → 後半 ヒカリ）
 */
const towerParts = (S: number) => {
  const k = S / 40;
  const c = (S - 1) / 2;
  const legTop = 21 * k;
  const body = (x: number, y: number) => {
    if (y < legTop || y > S - 2) return false;
    const hw = 5 * k + (y - legTop) * 0.72;
    const arch = y >= 29 * k && Math.abs(x - c) <= (y - 28 * k) * 0.8;
    return Math.abs(x - c) <= Math.min(hw, 17 * k) && !arch;
  };
  const upper = (x: number, y: number) =>
    y >= 5 * k && y <= 13 * k && Math.abs(x - c) <= 1.6 * k + (y - 5 * k) * 0.2;
  const arm = mirrorX(
    tube(
      [
        [c - 9 * k, 17 * k],
        [c - 13 * k, 22 * k],
        [c - 15 * k, 27 * k],
      ],
      2 * k,
      1.8 * k,
    ),
    S,
  );
  const waves = (x: number, y: number) => {
    const d = Math.hypot(x - c, y - 4 * k);
    const side = Math.abs(y - 4 * k) < Math.abs(x - c) * 0.55;
    return side && y >= 1 && [6, 9.5, 13].some((r) => Math.abs(d - r * k) < 0.75)
      ? d > 11 * k
        ? 'A'
        : 'M'
      : '';
  };
  return { body, upper, arm, waves, c };
};
const TOWER = towerParts(40);
/** 鉄骨の もよう：赤（V）の 中に ななめの 格子（o）、ところどころ 白い 帯 */
const lattice = (x: number, y: number, bands: number[], step: number) =>
  bands.includes(y) ? 'W' : (x + y) % step === 0 || (x - y + 80) % step === 0 ? 'o' : 'V';
const denpaOh: MonsterDesign = {
  size: 40,
  colors: {
    V: NQ.vermilion,
    W: NQ.white,
    N: NQ.night,
    Y: NQ.yellow,
    K: NQ.sky,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    M: NQ.mint,
    A: NQ.aqua,
  },
  rim: { [NQ.vermilion]: NQ.brick, [NQ.white]: NQ.cloud, [NQ.gold]: NQ.ochre },
  rimDepth: 2,
  layers: [
    { rows: plot(40, 40, (x, y) => TOWER.waves(x, y) || '.') },
    // 下の 塔（4 本の 足の あいだは アーチ）
    { rows: plot(40, 40, (x, y) => (TOWER.body(x, y) ? lattice(x, y, [26, 27, 33, 34], 6) : '.')) },
    // うで（鉄骨）と こぶし
    { rows: plot(40, 40, (x, y) => (TOWER.arm(x, y) >= 0 ? ((x + y) % 4 === 0 ? 'W' : 'V') : '.')) },
    { x: 2, y: 26, rows: ['.WWW', 'WWWW', 'WWWW', '.WW.'] },
    { x: 34, y: 26, rows: ['WWW.', 'WWWW', 'WWWW', '.WW.'] },
    // 上の 塔と アンテナ
    { rows: plot(40, 40, (x, y) => (TOWER.upper(x, y) ? lattice(x, y, [9], 4) : '.')) },
    { x: 19, y: 1, rows: ['VV', 'WW', 'VV', 'WW'] },
    { x: 17, y: 5, rows: ['WWWWWW', 'WKKKKW'] },
    // 大展望台の 顔（黒い バイザーに 金の 目 3×4）
    {
      mirror: true,
      y: 13,
      rows: [
        '..........VVVVVVVVVV',
        '.........WWWWWWWWWWW',
        '.........WKWKWKWKWKW',
        '.........NNNNNNNNNNN',
        '.........NNNYYYNNNNN',
        '.........NNNYYoNNNNN',
        '.........NNNYooNNNNN',
        '.........NNNYooNNNNN',
        '.........WWWWWWWWWWW',
        '..........VVVVVVVVVV',
      ],
    },
    // 王冠（上の 塔の 根もと）
    { mirror: true, y: 10, rows: ['...............G...G', '...............GGGGR', '...............QQQQQ'] },
  ],
};

/** デンパオー（フィールドに 立つ 32×32） */
const TOWER_F = towerParts(32);
const denpaOhField: MonsterDesign = {
  size: 32,
  colors: {
    V: NQ.vermilion,
    W: NQ.white,
    N: NQ.night,
    Y: NQ.yellow,
    K: NQ.sky,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    M: NQ.mint,
    A: NQ.aqua,
  },
  rim: { [NQ.vermilion]: NQ.brick, [NQ.gold]: NQ.ochre },
  layers: [
    { rows: plot(32, 32, (x, y) => TOWER_F.waves(x, y) || '.') },
    { rows: plot(32, 32, (x, y) => (TOWER_F.body(x, y) ? lattice(x, y, [21, 27], 5) : '.')) },
    { rows: plot(32, 32, (x, y) => (TOWER_F.arm(x, y) >= 0 ? 'V' : '.')) },
    { rows: plot(32, 32, (x, y) => (TOWER_F.upper(x, y) ? 'V' : '.')) },
    { x: 15, y: 1, rows: ['VV', 'WW', 'VV'] },
    {
      mirror: true,
      y: 10,
      rows: [
        '........VVVVVVVV',
        '.......WWWWWWWWW',
        '.......NNNNNNNNN',
        '.......NNYYNNNNN',
        '.......NNYoNNNNN',
        '.......NNYoNNNNN',
        '.......WWWWWWWWW',
      ],
    },
    { mirror: true, y: 7, rows: ['............G..G', '............GGGR', '............QQQQ'] },
  ],
};

// ───────────────────────── 県ボス ─────────────────────────

/** 三原山の ぬしの 形：火山の 形の 頭（上に 火口）、岩の かた、太い うで と 足 */
const MIHARA = {
  head: (x: number, y: number) => y >= 6 && y <= 19 && Math.abs(x - 23.5) <= 4.5 + (y - 6) * 0.62,
  crater: (x: number, y: number) => inEll(x, y, 23.5, 6.6, 3.6, 1.2),
  shoulder: (x: number, y: number) => inEll(x, y, 11, 22, 7.5, 6.5) || inEll(x, y, 36, 22, 7.5, 6.5),
  torso: (x: number, y: number) => inEll(x, y, 23.5, 30, 12.5, 10.5),
  arm: mirrorX(
    tube(
      [
        [10, 24],
        [6.5, 31],
        [6.5, 36],
      ],
      4.2,
      3.6,
    ),
    48,
  ),
  fist: (x: number, y: number) => inEll(x, y, 6.5, 38.5, 4.5, 3.8) || inEll(x, y, 40.5, 38.5, 4.5, 3.8),
  leg: (x: number, y: number) =>
    y >= 38 && y <= 46 && Math.abs(x - 23.5) >= 2.5 && Math.abs(x - 23.5) <= 10 + (y >= 44 ? 1 : 0),
  crack: mirrorX(
    tube(
      [
        [17, 23],
        [20, 27],
        [17.5, 31],
        [21, 36],
      ],
      0.6,
      0.5,
    ),
    48,
  ),
};
/** 岩の はだ：夜色（N）に 左上の ふちの スレート（L）と ななめの すじ */
const rock = (inside: (x: number, y: number) => boolean) => (x: number, y: number) =>
  !inside(x, y) ? '.' : litEdge(inside, x, y) || (x * 2 + y) % 11 === 0 ? 'L' : 'N';
/** つばきの 花（赤い 花びら・金の しべ）と 葉 */
const TSUBAKI = [
  '.FF.RRR.....',
  'FEFRRRRR....',
  '.FRRrRRrR...',
  '..RRRGGRRR..',
  '..RrRGGRrR..',
  '...RRRRRRFF.',
  '....RRRR.FEF',
  '..........FF',
];

/**
 * ミハラノヌシ（県ボス）：伊豆大島の 三原山の ぬし。火山の 形の 頭の 火口に 王冠、黒い 溶岩の 大きな からだに 光る ひび、
 * 両かたに 大島の 赤い つばきの 花。火口の まわりに ゆげ（ツチ → 後半 ヒノ）
 */
const miharaNoNushi: MonsterDesign = {
  size: 48,
  colors: {
    N: NQ.night,
    L: NQ.slate,
    V: NQ.vermilion,
    A: NQ.apricot,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    r: NQ.brick,
    F: NQ.forest,
    E: NQ.green,
    Y: NQ.yellow,
    W: NQ.white,
    c: NQ.cloud,
  },
  rim: { [NQ.gold]: NQ.ochre },
  rimDepth: 2,
  layers: [
    // ゆげ（火口の 左右）
    { x: 10, y: 1, rows: ['..WW...', '.WWcW..', 'WWccWW.', '.WccW..'] },
    { x: 31, y: 1, rows: ['...WW..', '..WcWW.', '.WWccWW', '..WccW.'] },
    {
      rows: plot(
        48,
        48,
        rock((x, y) => MIHARA.arm(x, y) >= 0 || MIHARA.fist(x, y)),
      ),
    },
    { rows: plot(48, 48, rock(MIHARA.leg)) },
    { rows: plot(48, 48, rock(MIHARA.torso)) },
    { rows: plot(48, 48, rock(MIHARA.shoulder)) },
    // 光る ひび
    {
      rows: plot(48, 48, (x, y) =>
        MIHARA.crack(x, y) >= 0 && MIHARA.torso(x, y) ? ((x + y) % 3 === 0 ? 'A' : 'V') : '.',
      ),
    },
    { rows: plot(48, 48, rock(MIHARA.head)) },
    {
      rows: plot(48, 48, (x, y) =>
        MIHARA.crater(x, y) ? (inEll(x, y, 23.5, 6.6, 2.4, 0.6) ? 'A' : 'V') : '.',
      ),
    },
    // 王冠（火口に のせる）
    {
      mirror: true,
      y: 1,
      rows: [
        '....................G..G',
        '....................GGGR',
        '....................GGGR',
        '....................QQQQ',
      ],
    },
    // 顔：まゆ・光る 目（3×4）・溶岩の 口
    {
      mirror: true,
      y: 9,
      rows: [
        '................oo......',
        '..................ooo...',
        '.................YYY....',
        '.................YYo....',
        '.................Yoo....',
        '.................Yoo....',
        '........................',
        '.....................VVV',
        '....................VAAA',
      ],
    },
    // かたの つばき
    { x: 4, y: 15, rows: TSUBAKI },
    { x: 32, y: 15, rows: TSUBAKI.map((r) => [...r].reverse().join('')) },
    // むねの つばき
    { x: 20, y: 27, rows: ['.RRRR..', 'RRrRRR.', 'RRGGRr.', 'RrGGRR.', '.RRRR..'] },
  ],
};

/** ミハラノヌシ 後半（ヒノ）：岩が 赤く 焼け、ひびと 火口が まぶしく かがやき、かたから 火が 立つ。目は 白く */
const miharaNoNushiP0: MonsterDesign = {
  ...miharaNoNushi,
  colors: { ...miharaNoNushi.colors, L: NQ.brick, A: NQ.cream, Y: NQ.white, X: NQ.apricot },
  layers: [
    // かたと 頭の 火
    { x: 3, y: 6, rows: ['...V....', '..VXV...', '..VXV...', '.VXAXV..', '.VXAXV..', 'VVXAXVV.'] },
    { x: 37, y: 6, rows: ['....V...', '...VXV..', '...VXV..', '..VXAXV.', '..VXAXV.', '.VVXAXVV'] },
    ...miharaNoNushi.layers.slice(2),
    // 足もとまで 走る ひび
    { x: 15, y: 39, rows: ['V......', '.V.....', 'V......', '.V.....'] },
    { x: 31, y: 39, rows: ['......V', '.....V.', '......V', '.....V.'] },
  ],
};

// ───────────────────────── 裏ステージの ラスボス ─────────────────────────

/** 大波（うしろで まきあがり、左で くだける）。わっかの 外がわが あわ（W）、中が 青 */
const hokusaiWave = plot(48, 48, (x, y) => {
  if (x < 1 || x > 46 || y < 1) return '.';
  const d = Math.hypot(x - 28, y - 22);
  const a = Math.atan2(y - 22, x - 28);
  if (d > 20.5 || d < 13 || (a > 1.55 && a < 2.85)) return '.';
  if (d > 19) return (x + y) % 3 === 0 ? 'S' : 'W';
  if (d > 17) return 'S';
  if (d < 14.5) return 'N';
  return (x * 2 + y) % 9 === 0 ? 'S' : 'Z';
});

/**
 * 葛飾北斎（ラスボス）：江戸の 絵師。黒い 頭巾に 白い まゆと ひげの おじいさん、茶色の きもの。
 * 大きな 筆（金の 口金・赤い ふさ）を かかげ、うしろに「神奈川沖浪裏」のような 大波が まきあがる（ミズ）
 */
const katsushikaHokusai: MonsterDesign = {
  size: 48,
  colors: {
    F: NQ.skinLight,
    f: NQ.skinMid,
    W: NQ.white,
    K: NQ.night,
    B: NQ.brown,
    T: NQ.tan,
    G: NQ.gold,
    R: NQ.red,
    N: NQ.navy,
    Z: NQ.azure,
    S: NQ.sky,
    p: NQ.blush,
  },
  rim: { [NQ.skinLight]: NQ.skinMid, [NQ.brown]: NQ.bark, [NQ.white]: NQ.cloud },
  rimDepth: 2,
  layers: [
    { rows: hokusaiWave },
    // 波の 先の あわの つめ（左）
    { x: 5, y: 16, rows: ['W.W.W', '.W.W.', 'W...W'] },
    {
      mirror: true,
      rows: [
        '........................',
        '........................',
        '........................',
        '........................',
        '..................KKKKKK',
        '................KKKKKKKK',
        '...............KKKKKKKKK',
        '..............KKKKKKKKKK',
        '..............KKKKKKKKKK',
        '..............KKFFFFFFFF',
        '..............KKFFFFFFFF',
        '..............KWWWWFFFFF',
        '..............KFFWWWFFFF',
        '..............KFFWWoFFFF',
        '..............KFFWooFFFF',
        '..............KFFWooFFFf',
        '..............KFpFFFFFFf',
        '..............KFFFFFFFFF',
        '...............FFWWWWWWW',
        '...............FWWWWWWoo',
        '..........BBBBBTWWWWWWWW',
        '........BBBBBBBBTWWWWWWW',
        '.......BBBBBBBBBBTWWWWWW',
        '......BBBBBBBBBBBBTWWWWW',
        '.....BBBBBBBBBBBBBBTWWWW',
        '.....BBBBBBBBBBBBBBBTWWW',
        '....BBBBBBBBBBBBBBBBBTWW',
        '....BBBBBBBBBBBBBBBBBBTB',
        '....BBBBBBBBBBBBBBBBBBBB',
        '....BBBBTBBBBBBBBBBBBBBB',
        '....BBBBTBBBBTTTTTTTTTTT',
        '....BBBBTBBBBTTTTTTTTGGG',
        '....BBBBTBBBBTTTTTTTTTTT',
        '.....BBBTBBBBBBBBBBBBBBB',
        '.....BBBTBBBBBBBBBBBBBBB',
        '.....BBBBBBBBBBBBBBBBBBB',
        '..........BBBBBBBBBBBBBB',
        '..........BBBBBBBBBBBBBB',
        '..........BBBBBBBBBBBBBB',
        '..........BBBBBBBBBBBBBB',
        '..........BBBBBBBBBBBBBo',
        '..........BBBBBBBBBBBBBo',
        '..........BBBBBBBBBBBBBo',
        '...........BBBBBBBBBBBo.',
        '..............FFFF......',
        '.............KKKKKK.....',
        '.............K..K.......',
        '........................',
      ],
    },
    // かかげた 大きな 筆（右手）：すみの ついた 穂先・金の 口金・赤い ふさ
    {
      rows: plot(48, 48, (x, y) =>
        tube(
          [
            [11, 34],
            [4.5, 13],
          ],
          1.1,
          1,
        )(x, y) >= 0
          ? 'T'
          : '.',
      ),
    },
    { x: 2, y: 5, rows: ['..o.', '.oo.', '.ooo', 'oooo', 'oooo', '.GGG', '.GGG'] },
    { x: 10, y: 33, rows: ['.RR', 'RRR', 'RR.', '.R.'] },
    { x: 7, y: 29, rows: ['.FFF', 'FFFF', 'FFFF', '.FF.'] },
    // 左手（ひらく）
    { x: 38, y: 29, rows: ['FFF.', 'FFFF', 'FFFF', '.FF.'] },
  ],
};

export const TOKYO: Readonly<Record<string, MonsterDesign>> = {
  'tokyo-nerikon': nerikon,
  'tokyo-daikon-zamurai': daikonZamurai,
  'tokyo-kirariko': kirariko,
  'tokyo-kagayakiriko': kagayakiriko,
  'tokyo-musasabyun': musasabyun,
  'tokyo-tsukiyo-musasabi': tsukiyoMusasabi,
  'tokyo-midboss-denpa-oh': denpaOh,
  'tokyo-midboss-denpa-oh.field': denpaOhField,
  'tokyo-boss-mihara-no-nushi': miharaNoNushi,
  'tokyo-boss-mihara-no-nushi.p0': miharaNoNushiP0,
  'tokyo-lastboss-katsushika-hokusai': katsushikaHokusai,
};
