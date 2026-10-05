/**
 * 名所の絵：まつり・生きもの・人・むかしの くらし（ねぶた・花火・おどり・秋田犬・ツル・忍者・鵜飼…）。
 * それぞれ 32×32 の えはがき。背景（空・地面）から かいて、主役（人・動物・山車）は layer() で ふちどる。v で えらび。
 * 子ども向け：こわく しない（血・ほね・きば・刃物は かかない）。実在の 人も かかない。
 */
import { mirrorRows, paint, type Grid } from '../grid';
import {
  box,
  cloud,
  dot,
  ground,
  hills,
  layer,
  NQ,
  oval,
  roundTree,
  sea,
  seg,
  sh,
  sky,
  sun,
  thick,
  tree,
  tri,
  type SceneFn,
} from './kit';

export type EventKey =
  | 'namahageMask'
  | 'kanto'
  | 'fireworks'
  | 'nebutaFloat'
  | 'horseSamurai'
  | 'dance'
  | 'snowStatue'
  | 'kiriko'
  | 'lanternCrown'
  | 'tanabata'
  | 'taikoDance'
  | 'danjiri'
  | 'festivalFloat'
  | 'kagura'
  | 'kite'
  | 'pinwheels'
  | 'dog'
  | 'crane'
  | 'dolphin'
  | 'horse'
  | 'monkey'
  | 'deer'
  | 'ibis'
  | 'seaTurtle'
  | 'mudskipper'
  | 'dinosaur'
  | 'ninja'
  | 'ukai'
  | 'puppet'
  | 'kappa'
  | 'ainu';

// ───────────────────────── この ファイルだけの 小物 ─────────────────────────

/** 文字の 地図で かく（flip = 左右 はんてん） */
function spr(
  l: Grid,
  rows: readonly string[],
  map: Readonly<Record<string, string>>,
  x: number,
  y: number,
  flip = false,
): void {
  paint(l, flip ? mirrorRows(rows) : rows, map, Math.round(x), Math.round(y));
}

const pick = <T>(arr: readonly T[], i: number): T => arr[((i % arr.length) + arr.length) % arr.length]!;

/** ちょうちん（3 はば）。body の 色で 光る */
function lantern(
  g: Grid,
  x: number,
  y: number,
  body: string = NQ.red,
  h = 3,
  glow: string = NQ.apricot,
): void {
  box(g, x, y, x + 2, y, NQ.bark);
  box(g, x, y + 1, x + 2, y + h, body);
  seg(g, x + 1, y + 1, x + 1, y + h - 1, glow);
  box(g, x, y + h + 1, x + 2, y + h + 1, NQ.bark);
}

/** ちょうちんの ひも（左右に たるむ）と ちょうちん */
function lanternString(
  g: Grid,
  y: number,
  sag: number,
  step: number,
  cols: readonly string[],
  seed = 0,
): void {
  for (let x = 1; x <= 30; x++) {
    const t = (x - 1) / 29;
    dot(g, x, y + sag * 4 * t * (1 - t), NQ.bark);
  }
  let i = 0;
  for (let x = 2 + (seed % 3); x <= 27; x += step, i++) {
    const t = (x + 0.5) / 29;
    const yy = Math.round(y + sag * 4 * t * (1 - t)) + 1;
    lantern(g, x, yy, pick(cols, i + seed), 2);
  }
}

/** 花火（まるく ひらく 線） */
function burst(g: Grid, cx: number, cy: number, r: number, outer: string, inner: string, rays = 12): void {
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + 0.26;
    for (let k = Math.max(1, Math.round(r * 0.3)); k <= r; k++)
      dot(g, cx + Math.cos(a) * k, cy + Math.sin(a) * k, k > r * 0.6 ? outer : inner);
    dot(g, cx + Math.cos(a) * (r + 1.2), cy + Math.sin(a) * (r + 1.2), NQ.cream);
  }
  dot(g, cx, cy, NQ.white);
}

/** たいまつ・かがり火の ほのお（x = まん中、y = 下） */
function flame(g: Grid, x: number, y: number, h: number): void {
  tri(g, x - 2, y, x + 3, y, x + 0.5, y - h, NQ.vermilion);
  tri(g, x - 1, y, x + 2, y, x + 0.5, y - h * 0.65, NQ.orange);
  box(g, x, y - 1, x + 1, y, NQ.gold);
  dot(g, x, y - h * 0.3, NQ.yellow);
}

/** 見物の 人の 頭の ならび（y から 下は ぬりつぶし） */
function crowd(g: Grid, y: number, col: string, seed = 0): void {
  box(g, 1, y + 1, 30, 30, col);
  for (let x = 1 + (seed % 2); x <= 30; x += 3) oval(g, x + 1, y + 0.5 - ((x + seed) % 2), 1.4, 1.5, col);
}

/** 町家の ならび（y = 屋根の 上） */
function townRow(g: Grid, y: number, wall: string, roof: string, win: string, seed = 0): void {
  for (let x = 1, i = 0; x <= 30; i++) {
    const w = 6 + ((i + seed) % 3);
    const top = y + ((i + seed) % 2);
    tri(g, x - 1, top + 2, x + w, top + 2, x + w / 2 - 0.5, top - 1, roof);
    box(g, x, top + 2, x + w - 2, 30, wall);
    box(g, x + 1, top + 4, x + 2, top + 5, win);
    if (w > 6) box(g, x + 4, top + 4, x + 5, top + 5, win);
    x += w;
  }
}

/**
 * おどる 人（7×10）。up = 両手を 上、wave = かた手 上。
 * S はだ・H かみ・T 服・t 服の もよう・O おび・K 足
 */
const DANCER = {
  up: [
    'S.....S',
    'a.HHH.a',
    'a.SSS.a',
    '.aTTTa.',
    '..TTT..',
    '..OOO..',
    '..TTT..',
    '.TTtTT.',
    '.TtTTt.',
    '..K.K..',
  ],
  wave: [
    '......S',
    '..HHH.a',
    '..SSS.a',
    'aaTTTa.',
    'S.TTT..',
    '..OOO..',
    '..TTT..',
    '.TTtTT.',
    '.TtTTt.',
    '..K.K..',
  ],
} as const;

function dancer(
  l: Grid,
  x: number,
  y: number,
  cloth: string,
  alt: string,
  obi: string,
  pose: keyof typeof DANCER,
  flip = false,
  skin: string = NQ.skinLight,
): void {
  spr(
    l,
    DANCER[pose],
    { S: skin, a: cloth, H: NQ.hairBlack, T: cloth, t: alt, O: obi, K: NQ.ink },
    x,
    y,
    flip,
  );
}

/** 横向きの 人（5×9、右向き）。はっぴ・はちまき */
const RUNNER = ['.HHH.', '.HSSe', '..SS.', '.TTT.', 'TTTTS', 'STTT.', '.BBB.', '.B.B.', 'K..K.'];

// ───────────────────────── まつり ─────────────────────────

/** なまはげ：赤と 青の おにの お面（わらの みの）。にこにこ・おどけ顔 */
const namahageMask: SceneFn = (g, o) => {
  sky(g, 'night', o.seed);
  // 雪の 家（うしろ）
  tri(g, 0, 15, 12, 15, 6, 9, NQ.cloud);
  box(g, 1, 15, 10, 25, NQ.brown);
  box(g, 3, 18, 8, 22, NQ.cream);
  seg(g, 5.5, 18, 5.5, 22, NQ.tan);
  ground(g, 25, NQ.cloud, NQ.white);
  for (let i = 0; i < 10; i++) dot(g, 2 + ((i * 11 + o.seed) % 28), 2 + ((i * 7 + o.seed) % 22), NQ.white);

  const ogre = (l: Grid, cx: number, cy: number, r: number, face: string, faceSh: string, horn: string) => {
    // わらの みの
    tri(l, cx - r * 1.7, 31, cx + r * 1.7, 31, cx, cy + r * 0.2, NQ.sand);
    for (let k = -3; k <= 3; k++) seg(l, cx + k * 0.4, cy + r + 1, cx + k * r * 0.45, 30, NQ.tan);
    // ぼさぼさの かみ（わら）
    oval(l, cx, cy - r * 0.15, r * 1.4, r * 1.3, NQ.beige);
    for (let k = 0; k < 9; k++) {
      const a = Math.PI * (0.05 + (k / 8) * 0.9);
      seg(
        l,
        cx - Math.cos(a) * r * 0.9,
        cy - Math.sin(a) * r * 0.9,
        cx - Math.cos(a) * r * 1.35,
        cy - Math.sin(a) * r * 1.25,
        NQ.sand,
      );
    }
    // つの（みじかく まるい）
    tri(l, cx - r * 0.85, cy - r * 0.7, cx - r * 0.25, cy - r * 0.8, cx - r * 0.75, cy - r * 1.6, horn);
    tri(l, cx + r * 0.85, cy - r * 0.7, cx + r * 0.25, cy - r * 0.8, cx + r * 0.75, cy - r * 1.6, horn);
    // かお
    oval(l, cx, cy + r * 0.1, r, r * 1.05, face, faceSh);
    // まゆ（あがり まゆ = びっくり顔）
    seg(l, cx - r * 0.8, cy - r * 0.35, cx - r * 0.2, cy - r * 0.6, NQ.ink);
    seg(l, cx + r * 0.8, cy - r * 0.35, cx + r * 0.2, cy - r * 0.6, NQ.ink);
    // まるい 目
    const er = Math.max(1.3, r * 0.3);
    oval(l, cx - r * 0.42, cy - r * 0.05, er, er, NQ.white);
    oval(l, cx + r * 0.42, cy - r * 0.05, er, er, NQ.white);
    dot(l, cx - r * 0.42 - 0.5, cy - r * 0.05, NQ.ink);
    dot(l, cx + r * 0.42 - 0.5, cy - r * 0.05, NQ.ink);
    // 大きな はな
    oval(l, cx, cy + r * 0.35, r * 0.25, r * 0.2, faceSh);
    // にっこり 口（小さな しかくい 歯）
    oval(l, cx, cy + r * 0.72, r * 0.55, r * 0.28, NQ.ink, undefined, (_x, y) => y + 0.5 >= cy + r * 0.62);
    dot(l, cx - 1, cy + r * 0.62 + 0.5, NQ.white);
    dot(l, cx, cy + r * 0.62 + 0.5, NQ.white);
  };
  layer(g, (l) => ogre(l, 24, 16, 4.2, NQ.azure, NQ.blue, NQ.cream));
  layer(g, (l) => ogre(l, 13, 14, 6, NQ.red, NQ.brick, NQ.gold));
};

/** 竿燈：竹の さおに ちょうちんが たくさん（夜） */
const kanto: SceneFn = (g, o) => {
  sky(g, 'night', o.seed);
  // 遠くの 竿燈（うすく）
  for (const bx of [4, 28]) {
    seg(g, bx, 5, bx, 26, NQ.amber);
    for (let y = 6; y <= 20; y += 3)
      for (let x = bx - 3; x <= bx + 3; x += 2) if (x !== bx) dot(g, x, y, NQ.ochre);
  }
  crowd(g, 27, NQ.night, o.seed);
  // まん中の 竿燈
  seg(g, 15.5, 1, 15.5, 25, NQ.tan, 2);
  seg(g, 14, 1, 17, 1, NQ.white);
  for (let r = 0; r < 7; r++) {
    const y = 3 + r * 3;
    const n = r === 0 ? 1 : r === 1 ? 2 : 3;
    seg(g, 15.5 - n * 3 - 0.5, y, 16 + n * 3 + 0.5, y, NQ.tan);
    for (let k = -n; k <= n; k++) {
      const x = 15 + k * 3;
      box(g, x, y + 1, x + 1, y + 2, NQ.gold);
      dot(g, x, y + 1, NQ.cream);
      dot(g, x + 1, y + 2, NQ.orange);
    }
  }
  // ささえる 人（手のひらに のせる）
  layer(g, (l) => {
    spr(
      l,
      ['.S.S.', '.S.S.', '.RRR.', '.HSS.', '.SSS.', 'WWWWW', 'WNWNW', '.NNN.', '.N.N.'],
      { S: NQ.skinMid, R: NQ.white, H: NQ.hairBlack, W: NQ.white, N: NQ.navy },
      13,
      22,
    );
  });
};

/** 花火大会（v: river = 川に うつる） */
const fireworks: SceneFn = (g, o) => {
  sky(g, 'night', o.seed);
  if (o.v === 'river') {
    const up: [number, number, number, string, string][] = [
      [10, 8, 6, NQ.red, NQ.gold],
      [23, 6, 4, NQ.azure, NQ.ice],
      [21, 14, 2, NQ.lime, NQ.cream],
    ];
    for (const [x, y, r, a, b] of up) burst(g, x, y, r, a, b, r > 4 ? 16 : 10);
    // 向こう岸の 町と 長い 橋
    townRow(g, 17, NQ.night, NQ.ink, NQ.gold, o.seed);
    box(g, 1, 21, 30, 30, NQ.navy);
    box(g, 1, 20, 30, 20, NQ.slate);
    for (let x = 2; x <= 30; x += 4) seg(g, x, 20, x, 22, NQ.slate);
    // 川に うつる 花火（きらきらの たての すじ）
    for (const [x, , r, a, b] of up)
      for (let k = 0; k <= r + 1; k += 2) {
        dot(g, x, 23 + k, a);
        dot(g, x - 1, 24 + k, a);
        if (k < r) {
          dot(g, x - 3, 24 + k, b);
          dot(g, x + 2, 23 + k, b);
        }
      }
    for (let i = 0; i < 4; i++) {
      const x = 2 + ((i * 9 + o.seed) % 24);
      seg(g, x, 27 + (i % 2) * 2, x + 2, 27 + (i % 2) * 2, NQ.blue);
    }
    return;
  }
  const shots: [number, number, number, string, string][] = [
    [11, 9, 7, NQ.red, NQ.gold],
    [24, 7, 5, NQ.azure, NQ.ice],
    [22, 17, 3, NQ.lime, NQ.cream],
    [5, 17, 3, NQ.blush, NQ.cream],
  ];
  for (const [x, y, r, a, b] of shots) burst(g, x, y, r, a, b, r > 4 ? 16 : 10);
  // 打ち上げの 光の すじ
  seg(g, 16, 28, 16, 22, NQ.cream);
  hills(g, 26, 4, NQ.indigo, o.seed);
  townRow(g, 24, NQ.night, NQ.ink, NQ.gold, o.seed);
  crowd(g, 29, NQ.ink, o.seed);
};

/** ねぶた：光る 大きな むしゃの 山車（夜） */
const nebutaFloat: SceneFn = (g, o) => {
  sky(g, 'night', o.seed);
  crowd(g, 28, NQ.ink, o.seed);
  layer(g, (l) => {
    // 台
    box(l, 3, 25, 28, 27, NQ.brick);
    seg(l, 3, 25, 28, 25, NQ.gold);
    // よろいの からだ
    oval(l, 16, 21, 11, 5.5, NQ.azure);
    oval(l, 17, 22, 7, 4, NQ.red);
    seg(l, 10, 19, 24, 24, NQ.gold);
    seg(l, 10, 23, 24, 18, NQ.gold);
    // 上げた うで（金の おうぎ）
    thick(l, 19, 15, 24, 8, 1.6, NQ.red);
    oval(l, 25.5, 7, 1.6, 1.6, NQ.skinLight);
    tri(l, 22, 3, 30, 3, 26, 7, NQ.gold);
    seg(l, 26, 7, 23, 3, NQ.ochre);
    seg(l, 26, 7, 29, 3, NQ.ochre);
    // 前に だした うで
    thick(l, 7, 17, 3, 20, 1.4, NQ.yellow);
    oval(l, 3, 21, 1.6, 1.4, NQ.skinLight);
    // かお
    oval(l, 12, 11, 5.5, 5.5, NQ.paper);
    // かみ・まげ
    oval(l, 12, 6.5, 5, 2.2, NQ.hairBlack);
    oval(l, 12, 3.5, 1.6, 1.4, NQ.hairBlack);
    seg(l, 7, 7, 17, 7, NQ.red);
  });
  // くまどり・目・口（黒い 線）
  seg(g, 8, 9, 11, 10, NQ.ink);
  seg(g, 16, 9, 13, 10, NQ.ink);
  dot(g, 10, 11, NQ.white);
  dot(g, 14, 11, NQ.white);
  dot(g, 10, 12, NQ.ink);
  dot(g, 13, 12, NQ.ink);
  seg(g, 8, 12, 8, 14, NQ.red);
  seg(g, 16, 12, 16, 14, NQ.red);
  seg(g, 10, 15, 14, 15, NQ.brick);
  dot(g, 12, 13, NQ.blush);
};

/** 横に 走る 馬（右向き）。x0,y0 = 胴の まん中 */
function gallopHorse(l: Grid, x: number, y: number, body: string, mane: string): void {
  thick(l, x - 7, y - 1, x - 10, y + 2, 1, mane);
  thick(l, x - 3, y + 1, x - 7, y + 5, 0.8, body);
  thick(l, x - 3, y + 1, x - 4, y + 6, 0.8, sh(body));
  thick(l, x + 3, y + 1, x + 7, y + 4, 0.8, body);
  thick(l, x + 3, y + 1, x + 4, y + 6, 0.8, sh(body));
  oval(l, x, y, 6.5, 3, body);
  thick(l, x + 4, y - 1, x + 7, y - 5, 1.6, body);
  thick(l, x + 7, y - 5, x + 10, y - 3, 1.2, body);
  tri(l, x + 6, y - 6, x + 8, y - 6, x + 6.5, y - 8.5, body);
  seg(l, x + 3, y - 2, x + 6, y - 7, mane, 2);
  dot(l, x + 8, y - 5, NQ.ink);
}

/** 相馬野馬追：よろいの むしゃが はたを せおって 馬で 走る */
const horseSamurai: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 23, 5, 7);
  hills(g, 21, 4, NQ.green, o.seed);
  ground(g, 21, NQ.leaf, NQ.lime);
  // 土けむり
  oval(g, 5, 27, 3, 1.5, NQ.beige);
  oval(g, 3, 25, 2, 1.2, NQ.beige);
  const flag = pick([NQ.red, NQ.azure, NQ.gold, NQ.white], o.seed);
  const mark = flag === NQ.white ? NQ.red : NQ.white;
  layer(g, (l) => {
    // せなかの はた
    seg(l, 11, 3, 11, 16, NQ.bark);
    box(l, 5, 3, 10, 12, flag);
    oval(l, 8, 7.5, 1.8, 1.8, mark);
    gallopHorse(l, 15, 22, NQ.brown, NQ.bark);
    // むしゃ
    box(l, 13, 15, 17, 19, NQ.red);
    seg(l, 13, 17, 17, 17, NQ.gold);
    thick(l, 16, 16, 20, 17, 0.8, NQ.red);
    box(l, 12, 19, 16, 20, NQ.navy);
    oval(l, 15, 13, 2, 2, NQ.skinLight);
    // かぶと と 金の くわがた
    oval(l, 15, 11.5, 2.6, 1.6, NQ.night, undefined, (_x, yy) => yy < 12);
    seg(l, 12, 11, 12, 11, NQ.night);
    seg(l, 13, 10, 11, 7, NQ.gold);
    seg(l, 16, 10, 18, 7, NQ.gold);
  });
  dot(g, 15, 13, NQ.ink);
};

/** おどり（v: yukata = ぼんおどり、naruko = よさこい、awa = 阿波おどり） */
const dance: SceneFn = (g, o) => {
  if (o.v === 'naruko') {
    sky(g, 'day', o.seed);
    cloud(g, 7, 5, 7);
    townRow(g, 12, NQ.beige, NQ.slate, NQ.sky, o.seed);
    ground(g, 26, NQ.silver, NQ.cloud);
    // 大きな はた
    layer(g, (l) => {
      seg(l, 27, 2, 27, 24, NQ.brown);
      tri(l, 27, 3, 27, 13, 18, 4, NQ.blush);
      tri(l, 27, 6, 27, 13, 21, 9, NQ.gold);
    });
    const suits: [string, string, string][] = [
      [NQ.blush, NQ.gold, NQ.berry],
      [NQ.gold, NQ.azure, NQ.orange],
      [NQ.aqua, NQ.blush, NQ.teal],
    ];
    layer(g, (l) => {
      suits.forEach(([c, a, ob], i) => {
        const x = 2 + i * 8;
        const y = 15 + (i % 2);
        dancer(l, x, y, c, a, ob, i === 1 ? 'up' : 'wave', i === 2);
        // なるこ（木の 鳴り物）
        const hands = i === 1 ? [x, x + 6] : i === 2 ? [x] : [x + 6];
        for (const hx of hands) {
          box(l, hx, y - 2, hx, y - 1, NQ.gold);
          dot(l, hx, y - 3, NQ.red);
        }
      });
    });
    return;
  }
  if (o.v === 'awa') {
    sky(g, 'dusk', o.seed);
    townRow(g, 11, NQ.bark, NQ.ink, NQ.gold, o.seed);
    lanternString(g, 5, 3, 5, [NQ.red, NQ.white, NQ.red], o.seed);
    ground(g, 26, NQ.tan, NQ.sand);
    const cols: [string, string][] = [
      [NQ.blush, NQ.white],
      [NQ.red, NQ.cream],
      [NQ.blush, NQ.white],
      [NQ.lavender, NQ.white],
    ];
    layer(g, (l) => {
      cols.forEach(([c, a], i) => {
        const x = 1 + i * 7.5;
        const y = 15 + (i % 2);
        dancer(l, x, y, c, a, NQ.gold, 'up', false);
        // あみがさ（半月の わらの かさ）
        spr(l, ['..CCC..', '.CCCCC.'], { C: NQ.sand }, x, y);
        dot(l, x + 3, y, NQ.tan);
      });
    });
    return;
  }
  // yukata：夜の ぼんおどり
  sky(g, 'night', o.seed);
  townRow(g, 11, NQ.bark, NQ.ink, NQ.orange, o.seed);
  lanternString(g, 4, 3, 5, [NQ.red, NQ.white], o.seed);
  ground(g, 26, NQ.brown, NQ.tan);
  const yk: [string, string, string][] = [
    [NQ.azure, NQ.white, NQ.red],
    [NQ.white, NQ.azure, NQ.gold],
    [NQ.blush, NQ.white, NQ.red],
    [NQ.navy, NQ.white, NQ.gold],
  ];
  layer(g, (l) => {
    yk.forEach(([c, a, ob], i) => dancer(l, 1 + i * 7.5, 16, c, a, ob, i % 2 ? 'wave' : 'up', i % 2 === 1));
  });
};

/** 雪まつり：大きな 雪の お城（夜の ライトアップ・雪が ふる） */
const snowStatue: SceneFn = (g, o) => {
  sky(g, 'night', o.seed);
  ground(g, 26, NQ.cloud, NQ.white);
  layer(g, (l) => {
    // 石がき
    tri(l, 3, 26, 29, 26, 16, 12, NQ.cloud);
    box(l, 6, 20, 25, 25, NQ.cloud);
    for (let y = 21; y <= 25; y += 2) seg(l, 6, y, 25, y, NQ.ice);
    // 1 だんめ
    box(l, 8, 15, 23, 19, NQ.white);
    tri(l, 4, 15, 27, 15, 15.5, 11, NQ.ice);
    box(l, 10, 16, 11, 17, NQ.sky);
    box(l, 15, 16, 16, 17, NQ.sky);
    box(l, 20, 16, 21, 17, NQ.sky);
    // 2 だんめ
    box(l, 11, 8, 20, 11, NQ.white);
    tri(l, 8, 8, 23, 8, 15.5, 4, NQ.ice);
    box(l, 14, 9, 17, 10, NQ.sky);
    // てっぺん
    box(l, 13, 3, 18, 4, NQ.white);
    tri(l, 11, 3, 20, 3, 15.5, 1, NQ.ice);
  });
  // 見に 来た 人（小さく）
  for (const x of [3, 5, 27])
    spr(g, ['h', 'c', 'c'], { h: NQ.hairBlack, c: pick([NQ.red, NQ.azure, NQ.gold], x) }, x, 26);
  for (let i = 0; i < 12; i++)
    dot(g, 2 + ((i * 13 + o.seed) % 28), 2 + ((i * 5 + o.seed * 3) % 26), NQ.white);
};

/** キリコ：高い あんどんの 塔を かついで、たいまつが もえる（夜） */
const kiriko: SceneFn = (g, o) => {
  sky(g, 'night', o.seed);
  // 大たいまつ
  seg(g, 4, 12, 4, 30, NQ.bark, 2);
  flame(g, 4, 12, 9);
  ground(g, 27, NQ.night);
  const tower = (l: Grid, x: number, y: number, w: number, h: number, pic: string) => {
    // 屋根
    tri(l, x - 2, y + 2, x + w + 1, y + 2, x + w / 2 - 0.5, y - 1, NQ.bark);
    box(l, x - 1, y + 2, x + w, y + 2, NQ.gold);
    // あんどん（光る 紙）
    box(l, x, y + 3, x + w - 1, y + h, NQ.cream);
    box(l, x, y + 3, x, y + h, NQ.red);
    box(l, x + w - 1, y + 3, x + w - 1, y + h, NQ.red);
    oval(l, x + w / 2, y + 3 + h * 0.35, w * 0.28, h * 0.18, pic);
    for (let yy = y + 3 + Math.round(h * 0.6); yy < y + h; yy += 2) seg(l, x + 2, yy, x + w - 3, yy, pic);
    // 台と かつぎ棒
    box(l, x - 1, y + h + 1, x + w, y + h + 2, NQ.brown);
    seg(l, x - 4, y + h + 3, x + w + 3, y + h + 3, NQ.tan);
  };
  layer(g, (l) => {
    tower(l, 22, 6, 6, 13, NQ.azure);
    tower(l, 10, 2, 9, 19, NQ.red);
  });
  // かつぐ 人
  layer(g, (l) => {
    for (const x of [8, 12, 16, 20, 24])
      spr(
        l,
        ['HSH', 'WWW', 'NNN', 'N.N'],
        { H: NQ.hairBlack, S: NQ.skinMid, W: NQ.white, N: NQ.navy },
        x,
        25,
      );
  });
};

/** 山鹿灯籠：金の とうろうを 頭に のせて おどる（夜） */
const lanternCrown: SceneFn = (g, o) => {
  sky(g, 'night', o.seed);
  // 遠くの 灯籠の わ
  for (let x = 2; x <= 29; x += 3) {
    const y = 13 + Math.round(Math.sin(x / 3) * 0.8);
    dot(g, x, y, NQ.gold);
    dot(g, x, y + 1, NQ.ochre);
  }
  ground(g, 26, NQ.denim, NQ.slate);
  const crownRows = ['..g..', '.ggg.', 'gcgcg', 'ggggg', '.o.o.'];
  layer(g, (l) => {
    for (let i = 0; i < 3; i++) {
      const x = 2 + i * 10;
      const y = 16 + (i % 2);
      dancer(l, x, y, NQ.white, NQ.azure, NQ.red, i === 1 ? 'up' : 'wave', i === 2);
      spr(l, crownRows, { g: NQ.gold, c: NQ.cream, o: NQ.ochre }, x + 1, y - 4);
    }
  });
};

/** 七夕：竹から ながい ふきながしが たれる 商店街 */
const tanabata: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  // アーケードの 屋根
  box(g, 1, 1, 30, 2, NQ.ice);
  townRow(g, 17, NQ.beige, NQ.slate, NQ.sky, o.seed);
  ground(g, 27, NQ.silver, NQ.cloud);
  // 竹の 葉
  seg(g, 1, 3, 30, 3, NQ.green);
  for (let x = 2; x <= 29; x += 3) tri(g, x, 3, x + 3, 3, x + 1, 5, NQ.leaf);
  const sets = [
    [NQ.red, NQ.gold, NQ.azure, NQ.blush, NQ.lime],
    [NQ.violet, NQ.sky, NQ.gold, NQ.red, NQ.white],
    [NQ.blush, NQ.lime, NQ.orange, NQ.azure, NQ.gold],
  ];
  layer(g, (l) => {
    sets.forEach((cols, i) => {
      const cx = 6 + i * 10;
      const top = 5 + (i % 2);
      const len = 16 + ((i + o.seed) % 3);
      // くす玉
      oval(l, cx, top + 2, 3.5, 2.5, cols[0]!, sh(cols[0]!));
      for (let k = 0; k < 7; k++) {
        const x = cx - 3 + k;
        const bot = top + len - (k % 2) - (k === 0 || k === 6 ? 2 : 0);
        seg(l, x, top + 4, x, bot, pick(cols, k + 1));
      }
    });
  });
};

/** エイサー：大だいこを かかえて おどる（沖縄） */
const taikoDance: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 6, 5, 8);
  sun(g, 26, 5, 2.5);
  box(g, 1, 16, 30, 19, NQ.aqua);
  box(g, 1, 16, 30, 16, NQ.mint);
  ground(g, 20, NQ.beige, NQ.sand);
  // ハイビスカス
  for (const [x, y] of [
    [3, 26],
    [28, 24],
    [26, 28],
  ] as const) {
    oval(g, x + 1, y + 1, 2, 1.5, NQ.green);
    oval(g, x, y, 1.6, 1.6, NQ.red);
    dot(g, x, y, NQ.yellow);
  }
  layer(g, (l) => {
    // ばち（上げた 手）
    seg(l, 22, 6, 25, 1, NQ.tan);
    thick(l, 18, 13, 21, 7, 1, NQ.white);
    oval(l, 22, 6.5, 1.3, 1.3, NQ.skinMid);
    // からだ
    box(l, 12, 12, 18, 19, NQ.white);
    box(l, 12, 12, 13, 19, NQ.violet);
    box(l, 17, 12, 18, 19, NQ.violet);
    box(l, 12, 18, 18, 19, NQ.gold);
    // あし（黒い ももひき、白い きゃはん）
    box(l, 12, 20, 14, 26, NQ.hairBlack);
    box(l, 16, 20, 18, 26, NQ.hairBlack);
    box(l, 12, 25, 14, 27, NQ.white);
    box(l, 16, 25, 18, 27, NQ.white);
    // かお と サージ（頭の ぬの）
    oval(l, 15.5, 9, 3, 3, NQ.skinMid);
    oval(l, 15.5, 6.8, 3.6, 2, NQ.violet, undefined, (_x, y) => y < 8);
    oval(l, 20, 6, 1.4, 1.4, NQ.violet);
    thick(l, 20, 6, 23, 9, 0.6, NQ.lavender);
    // 大だいこ
    oval(l, 9, 17, 5, 5, NQ.red);
    oval(l, 9, 17, 3.6, 3.6, NQ.beige);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      dot(l, 8.5 + Math.cos(a) * 4.3, 16.5 + Math.sin(a) * 4.3, NQ.ink);
    }
    oval(l, 9, 17, 1.2, 1.2, NQ.gold);
  });
  dot(g, 14, 9, NQ.ink);
  dot(g, 16, 9, NQ.ink);
  seg(g, 14, 11, 16, 11, NQ.brick);
};

/** だんじり：ほりものの 木の 山車が 町を かけぬける。屋根の 上で おどる 人 */
const danjiri: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  townRow(g, 9, NQ.beige, NQ.slate, NQ.bark, o.seed);
  ground(g, 26, NQ.silver, NQ.cloud);
  // いきおいの 線
  for (let i = 0; i < 4; i++) seg(g, 1, 13 + i * 3, 4 + (i % 2) * 2, 13 + i * 3, NQ.white);
  layer(g, (l) => {
    // 車
    oval(l, 10, 26, 2.5, 2.5, NQ.hairBlack);
    oval(l, 20, 26, 2.5, 2.5, NQ.hairBlack);
    // からだ（木）
    box(l, 6, 17, 23, 24, NQ.brown);
    box(l, 8, 18, 21, 21, NQ.tan);
    for (let x = 9; x <= 20; x += 3) box(l, x, 19, x + 1, 20, NQ.amber);
    seg(l, 6, 23, 23, 23, NQ.red);
    // 柱
    box(l, 7, 13, 8, 16, NQ.brown);
    box(l, 21, 13, 22, 16, NQ.brown);
    box(l, 9, 14, 20, 16, NQ.red);
    // そりかえった 屋根
    tri(l, 3, 13, 26, 13, 14.5, 8, NQ.bark);
    seg(l, 3, 12, 5, 13, NQ.bark);
    seg(l, 26, 12, 24, 13, NQ.bark);
    seg(l, 5, 13, 24, 13, NQ.gold);
    // 屋根の 上で おどる 人（うちわ）
    spr(
      l,
      ['Y.......Y', 'SS.HHH.SS', '..SSSS...', '...WWW...', '...WWW...', '...NNN...', '...N.N...'],
      { Y: NQ.gold, S: NQ.skinMid, H: NQ.hairBlack, W: NQ.white, N: NQ.navy },
      10,
      2,
    );
    // つな
    seg(l, 24, 20, 30, 21, NQ.beige);
  });
  // つなを 引く 人
  layer(g, (l) =>
    spr(l, RUNNER, { H: NQ.hairBlack, S: NQ.skinMid, e: NQ.ink, T: NQ.white, B: NQ.navy, K: NQ.ink }, 26, 18),
  );
};

/** 曳山・屋台（v: red = 赤い 大だい、night = ちょうちんの 夜まつりと 花火） */
const festivalFloat: SceneFn = (g, o) => {
  if (o.v === 'red') {
    sky(g, 'day', o.seed);
    cloud(g, 25, 4, 7);
    townRow(g, 13, NQ.beige, NQ.slate, NQ.bark, o.seed);
    ground(g, 26, NQ.sand, NQ.beige);
    layer(g, (l) => {
      oval(l, 9, 26.5, 2.5, 2.5, NQ.hairBlack);
      oval(l, 22, 26.5, 2.5, 2.5, NQ.hairBlack);
      box(l, 4, 22, 27, 24, NQ.hairBlack);
      seg(l, 4, 23, 27, 23, NQ.gold);
      // 大きな 赤い たい
      tri(l, 1, 6, 1, 20, 8, 13, NQ.red);
      oval(l, 17, 13, 11, 8, NQ.red, NQ.brick);
      oval(l, 18, 16.5, 8, 3, NQ.apricot);
      tri(l, 12, 6, 22, 6, 13, 1, NQ.red);
      tri(l, 14, 20, 20, 20, 15, 23, NQ.brick);
    });
    // うろこ・目・口
    for (let y = 9; y <= 17; y += 3)
      for (let x = 9 + (y % 2) * 2; x <= 20; x += 4) seg(g, x, y, x + 1, y + 1, NQ.gold);
    oval(g, 23.5, 10.5, 2, 2, NQ.white);
    dot(g, 23, 10, NQ.ink);
    seg(g, 26, 14, 28, 14, NQ.brick);
    return;
  }
  if (o.v === 'night') {
    sky(g, 'night', o.seed);
    burst(g, 7, 6, 4, NQ.red, NQ.gold, 12);
    burst(g, 25, 5, 3, NQ.lime, NQ.cream, 10);
    hills(g, 20, 4, NQ.indigo, o.seed);
    ground(g, 28, NQ.night);
    layer(g, (l) => {
      oval(l, 10, 27.5, 2.2, 2.2, NQ.hairBlack);
      oval(l, 22, 27.5, 2.2, 2.2, NQ.hairBlack);
      // ちょうちんの 山（台形）
      for (let r = 0; r < 5; r++) {
        const y = 13 + r * 3;
        const hw = 6 + r * 2;
        box(l, 16 - hw, y, 15 + hw, y + 2, NQ.bark);
        for (let x = 16 - hw; x <= 14 + hw; x += 2) {
          dot(l, x, y, NQ.gold);
          dot(l, x, y + 1, NQ.orange);
        }
      }
      // 屋根
      tri(l, 7, 13, 24, 13, 15.5, 8, NQ.hairBlack);
      seg(l, 8, 12, 23, 12, NQ.gold);
      box(l, 15, 6, 16, 8, NQ.gold);
    });
    return;
  }
  // ふつう：屋根つきの 舞台の 曳山（ちょうちん・金の かざり）
  sky(g, 'day', o.seed);
  townRow(g, 14, NQ.beige, NQ.slate, NQ.bark, o.seed);
  ground(g, 27, NQ.silver, NQ.cloud);
  layer(g, (l) => {
    oval(l, 10, 27, 2.5, 2.5, NQ.hairBlack);
    oval(l, 22, 27, 2.5, 2.5, NQ.hairBlack);
    box(l, 6, 19, 26, 25, NQ.brick);
    box(l, 8, 20, 24, 23, NQ.red);
    seg(l, 6, 24, 26, 24, NQ.gold);
    // 舞台
    box(l, 8, 11, 9, 18, NQ.bark);
    box(l, 23, 11, 24, 18, NQ.bark);
    box(l, 10, 11, 22, 18, NQ.cream);
    // 舞台の 子ども（かぶきの すがた）
    spr(
      l,
      ['.HHH.', '.SSS.', 'RRRRR', 'SRGRS', '.RRR.', '.RRR.', '.K.K.'],
      { H: NQ.hairBlack, S: NQ.paper, R: NQ.blush, G: NQ.gold, K: NQ.ink },
      14,
      11,
    );
    // 屋根
    tri(l, 4, 11, 28, 11, 16, 4, NQ.hairBlack);
    seg(l, 4, 10, 6, 11, NQ.hairBlack);
    seg(l, 28, 10, 26, 11, NQ.hairBlack);
    seg(l, 6, 11, 26, 11, NQ.gold);
    box(l, 15, 3, 16, 4, NQ.gold);
  });
  dot(g, 15, 12, NQ.ink);
  dot(g, 17, 12, NQ.ink);
  lantern(g, 5, 12, NQ.red, 3);
  lantern(g, 25, 12, NQ.red, 3);
};

/** 石見神楽：大蛇（おろち）と まう 人。ぶたいに かがり火 */
const kagura: SceneFn = (g, o) => {
  sky(g, 'night', o.seed);
  // しめなわと 紙の かざり
  seg(g, 1, 3, 30, 3, NQ.sand, 2);
  for (let x = 3; x <= 29; x += 5) spr(g, ['W.', 'WW', '.W', 'W.'], { W: NQ.white }, x, 4);
  // ぶたい
  ground(g, 25, NQ.tan, NQ.sand);
  for (let x = 4; x <= 30; x += 5) seg(g, x, 26, x - 1, 30, NQ.brown);
  flame(g, 3, 24, 7);
  flame(g, 28, 24, 7);
  seg(g, 3, 25, 3, 29, NQ.bark);
  seg(g, 28, 25, 28, 29, NQ.bark);
  layer(g, (l) => {
    // 大蛇の からだ（うろこの じゃばら）
    for (let k = 0; k < 6; k++) {
      const x = 27 - k * 2.4;
      const y = 22 - Math.sin(k * 1.2) * 3;
      oval(l, x, y, 2.4, 2.8, k % 2 ? NQ.green : NQ.leaf);
      dot(l, x - 0.5, y - 0.5, NQ.gold);
    }
    // 大蛇の 頭（金の つの、まるい 目）
    oval(l, 20, 10, 6, 4.5, NQ.leaf, NQ.green);
    tri(l, 15, 7, 18, 6, 14, 3, NQ.gold);
    tri(l, 22, 6, 25, 7, 26, 3, NQ.gold);
    oval(l, 15, 13, 4, 2.2, NQ.lime);
    box(l, 12, 13, 17, 13, NQ.red);
    oval(l, 18, 8.5, 1.8, 1.8, NQ.white);
    oval(l, 22.5, 8.5, 1.8, 1.8, NQ.white);
  });
  dot(g, 17, 8, NQ.ink);
  dot(g, 22, 8, NQ.ink);
  // まう 人（金の おうぎ）
  layer(g, (l) =>
    spr(
      l,
      [
        'YY.......',
        'YY.......',
        '.S..GGG..',
        '..S.SSS..',
        '...RRRRR.',
        '...RYRRRR',
        '...RRRR.S',
        '..WWWWW..',
        '.WWWWWWW.',
        '.WWWWWWW.',
        '..K...K..',
      ],
      { Y: NQ.gold, S: NQ.skinLight, G: NQ.gold, R: NQ.red, W: NQ.azure, K: NQ.ink },
      4,
      13,
    ),
  );
};

/** たこあげ：しかくい 大だこが 海辺の 空に */
const kite: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 26, 16, 7);
  box(g, 1, 22, 30, 24, NQ.azure);
  box(g, 1, 22, 30, 22, NQ.sky);
  ground(g, 25, NQ.sand, NQ.beige);
  const kites: [number, number, number, string, string][] = [
    [3, 3, 11, NQ.red, NQ.white],
    [19, 6, 8, NQ.azure, NQ.gold],
    [24, 1, 5, NQ.gold, NQ.red],
  ];
  const shift = o.seed % 2;
  for (const [x0, y0, s] of kites) seg(g, x0 + shift + s / 2, y0 + s, 10 + x0 / 3, 27, NQ.white);
  layer(g, (l) => {
    for (const [x0, y0, s, bg, fg] of kites) {
      const x = x0 + shift;
      box(l, x, y0, x + s - 1, y0 + s - 1, bg);
      oval(l, x + s / 2, y0 + s / 2, s * 0.32, s * 0.32, fg);
      if (s > 6) {
        oval(l, x + s / 2, y0 + s / 2, s * 0.14, s * 0.14, bg);
        box(l, x, y0, x + s - 1, y0, sh(bg));
      }
    }
    // たこを あげる 人
    spr(
      l,
      RUNNER,
      { H: NQ.hairBlack, S: NQ.skinMid, e: NQ.ink, T: NQ.red, B: NQ.white, K: NQ.ink },
      10,
      22,
      true,
    );
    spr(
      l,
      RUNNER,
      { H: NQ.hairBlack, S: NQ.skinMid, e: NQ.ink, T: NQ.azure, B: NQ.white, K: NQ.ink },
      17,
      22,
      true,
    );
  });
};

/** 風車（7×7）。a・b は はねの 色、c は まん中 */
const PINWHEEL = ['aaa...b', '.aa..bb', '..a.bbb', '...c...', 'bbb.a..', 'bb..aa.', 'b...aaa'];

/** 恐山：青い 湖の そばの 白い 石の はらに 風車（かざぐるま） */
const pinwheels: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 8, 4, 7);
  hills(g, 12, 5, NQ.green, o.seed);
  box(g, 1, 12, 30, 16, NQ.aqua);
  box(g, 1, 12, 30, 12, NQ.mint);
  seg(g, 4, 14, 8, 14, NQ.mint);
  seg(g, 19, 15, 24, 15, NQ.mint);
  ground(g, 17, NQ.cloud, NQ.white);
  // 石
  for (let i = 0; i < 10; i++) {
    const x = 2 + ((i * 7 + o.seed) % 27);
    const y = 18 + ((i * 5) % 12);
    oval(g, x + 1, y + 1, 1.5, 1, i % 3 ? NQ.silver : NQ.gray);
  }
  const cols = [NQ.red, NQ.gold, NQ.azure, NQ.blush, NQ.lime, NQ.violet, NQ.orange];
  const spots = [
    [2, 16],
    [12, 18],
    [22, 16],
    [6, 23],
    [19, 24],
  ] as const;
  layer(g, (l) =>
    spots.forEach(([x, y], i) => {
      seg(l, x + 3, y + 4, x + 3, y + 9, NQ.silver);
      spr(l, PINWHEEL, { a: pick(cols, i + o.seed), b: pick(cols, i + o.seed + 3), c: NQ.white }, x, y);
    }),
  );
};

// ───────────────────────── 生きもの ─────────────────────────

/** 秋田犬：くるんと まいた しっぽ、白い ほっぺ（左向き） */
const dog: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 24, 5, 8);
  hills(g, 21, 5, NQ.leaf, o.seed);
  ground(g, 21, NQ.lime, NQ.sprout);
  for (let i = 0; i < 6; i++) dot(g, 2 + ((i * 9 + o.seed) % 27), 24 + (i % 3) * 2, NQ.leaf);
  layer(g, (l) => {
    const F = NQ.orange;
    const W = NQ.paper;
    // あし
    for (const x of [11, 14, 20, 23]) {
      box(l, x, 22, x + 1, 27, F);
      box(l, x, 26, x + 1, 27, W);
    }
    // からだ
    oval(l, 18, 20, 7.5, 4, F, undefined, (_x, y) => y < 21);
    oval(l, 18, 20, 7.5, 4, W, undefined, (_x, y) => y >= 21);
    // しっぽ（くるん）
    oval(l, 23.5, 13.5, 3, 3, F);
    oval(l, 23.5, 13.5, 1.2, 1.2, NQ.apricot);
    // 頭
    thick(l, 11, 17, 12, 20, 2.2, W);
    oval(l, 10, 13.5, 4.5, 4, F);
    oval(l, 8.5, 16, 3.5, 2.5, W);
    oval(l, 5.5, 16, 2.5, 1.8, W);
    tri(l, 7, 11, 10, 11, 8, 6.5, F);
    tri(l, 11, 11, 14, 11, 13, 6.5, F);
    dot(l, 8, 10, NQ.blush);
    dot(l, 12.5, 10, NQ.blush);
  });
  dot(g, 3, 15, NQ.ink);
  dot(g, 8, 13, NQ.ink);
  dot(g, 4, 17, NQ.blush);
};

/** 立つ ツル（6×9、左向き） */
const CRANE = ['.WR...', 'yWW...', '..W...', '..W...', '..GGG.', '.GGGGD', '..GGGD', '..k.k.', '..k.k.'];

/** ナベヅル：田んぼに たくさん（白い くび、灰色の からだ） */
const crane: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  hills(g, 14, 4, NQ.green, o.seed);
  ground(g, 14, NQ.sand, NQ.beige);
  for (let y = 16; y <= 30; y += 3) seg(g, 1, y, 30, y, NQ.tan);
  // とぶ ツル
  layer(g, (l) => {
    tri(l, 7, 1, 17, 6, 14, 9, NQ.silver);
    tri(l, 29, 2, 17, 6, 19, 9, NQ.silver);
    seg(l, 7, 1, 10, 2, NQ.hairBlack);
    seg(l, 29, 2, 26, 3, NQ.hairBlack);
    oval(l, 17, 7, 4, 1.8, NQ.slate);
    box(l, 9, 6, 13, 7, NQ.white);
    dot(l, 10, 6, NQ.red);
    seg(l, 7, 7, 8, 7, NQ.yellow);
    seg(l, 21, 7, 25, 8, NQ.hairBlack);
  });
  const map = { W: NQ.white, R: NQ.red, y: NQ.yellow, G: NQ.slate, D: NQ.ink, k: NQ.ink };
  layer(g, (l) => {
    const spots = [
      [3, 15],
      [11, 17],
      [19, 14],
      [24, 19],
      [6, 21],
      [15, 21],
    ] as const;
    spots.forEach(([x, y], i) => spr(l, CRANE, map, x, y, (i + o.seed) % 3 === 0));
  });
};

/** イルカ（16×10、右むきに はねる） */
const DOLPHIN = [
  '.......D........',
  '......DDD.......',
  '....GGGGGGG.....',
  '..GGGGGGGGGGG...',
  '.GGGGLLLLLGGGG..',
  'GGGL......LGeGG.',
  'GGL........LGGGG',
  'GL..........LLL.',
  'TT..............',
  'T.T.............',
];

/** イルカ ウォッチング：海で はねる イルカ */
const dolphin: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 7, 5, 8);
  hills(g, 15, 3, NQ.green, o.seed);
  sea(g, 15, NQ.azure, o.seed);
  const map = { D: NQ.slate, G: NQ.gray, L: NQ.cloud, e: NQ.ink, T: NQ.slate };
  layer(g, (l) => {
    spr(l, DOLPHIN, map, 3, 9);
    spr(l, DOLPHIN, map, 16, 13);
  });
  // しぶき
  for (const [x, y] of [
    [2, 20],
    [4, 19],
    [15, 23],
    [17, 22],
    [29, 20],
  ] as const)
    dot(g, x, y, NQ.white);
  oval(g, 30, 23, 1.5, 1, NQ.white);
};

/** 小さな 馬。right = 右向き、graze = 頭を 下げて 草を たべる。x,y = 胴の まん中 */
function pony(
  l: Grid,
  x: number,
  y: number,
  body: string,
  mane: string,
  right: boolean,
  graze: boolean,
): void {
  const f = right ? 1 : -1;
  thick(l, x - 5 * f, y - 1, x - 6 * f, y + 3, 0.7, mane);
  for (const k of [-4, -2, 2, 4]) {
    seg(l, x + k * f, y + 1, x + k * f, y + 5, body);
    dot(l, x + k * f, y + 5, NQ.bark);
  }
  oval(l, x + 0.5, y, 5, 2.4, body);
  if (graze) {
    thick(l, x + 4 * f, y - 1, x + 6 * f, y + 3, 1.1, body);
    seg(l, x + 3 * f, y - 2, x + 5 * f, y + 1, mane);
    oval(l, x + 6.5 * f + 0.5, y + 4.5, 1.4, 1.1, body);
  } else {
    thick(l, x + 4 * f, y - 1, x + 6 * f, y - 4, 1.2, body);
    thick(l, x + 6 * f, y - 4, x + 8 * f, y - 3, 1, body);
    seg(l, x + 3 * f, y - 2, x + 5 * f, y - 6, mane);
    dot(l, x + 6 * f, y - 6, body);
  }
}

/** 都井岬の 御崎馬：海の そばの みどりの みさきで 草を たべる */
const horse: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 22, 5, 8);
  sea(g, 12, NQ.azure, o.seed);
  // みさき（みどりの 丘）
  for (let x = 1; x <= 30; x++) {
    const top = Math.round(19 - x * 0.3 + Math.sin(x / 3) * 0.6);
    box(g, x, top, x, 30, NQ.leaf);
    dot(g, x, top, NQ.lime);
  }
  for (let i = 0; i < 8; i++) dot(g, 2 + ((i * 7 + o.seed) % 27), 23 + (i % 4) * 2, NQ.green);
  tree(g, 28, 12, 6, NQ.green);
  layer(g, (l) => {
    pony(l, 20, 16, NQ.brown, NQ.bark, true, false);
    pony(l, 9, 23, NQ.tan, NQ.hairBrown, false, true);
  });
  dot(g, 27, 12, NQ.ink);
};

/** 地獄谷の 野猿：雪の 中、ゆけむりの 温泉に つかる サル */
const monkey: SceneFn = (g, o) => {
  sky(g, 'snow', o.seed);
  tree(g, 5, 12, 10, NQ.forest);
  tree(g, 27, 11, 9, NQ.forest);
  tri(g, 1.5, 8, 8.5, 8, 5, 4, NQ.white);
  ground(g, 12, NQ.white, NQ.white);
  // 岩
  oval(g, 16, 19, 15, 7, NQ.gray);
  oval(g, 16, 17, 15, 3, NQ.white, undefined, (_x, y) => y < 16);
  // お湯
  oval(g, 16, 21, 12.5, 5.5, NQ.teal);
  oval(g, 16, 20.5, 11.5, 4.5, NQ.aqua);
  // 手前の 雪
  ground(g, 27, NQ.white, NQ.cloud);
  const sarus = [
    [11, 16],
    [22, 17],
  ] as const;
  layer(g, (l) => {
    for (const [x, y] of sarus) {
      oval(l, x, y + 4, 4.5, 2.5, NQ.tan);
      oval(l, x - 3.6, y + 0.5, 1.2, 1.3, NQ.tan);
      oval(l, x + 3.6, y + 0.5, 1.2, 1.3, NQ.tan);
      oval(l, x, y, 3.6, 3.3, NQ.tan);
      oval(l, x, y + 0.8, 2.3, 2.3, NQ.red);
      oval(l, x, y - 2.8, 2, 0.9, NQ.white);
    }
  });
  // お湯に しずむ からだ
  oval(g, 16, 22.5, 11.5, 2.5, NQ.aqua);
  box(g, 6, 21, 26, 21, NQ.aqua);
  seg(g, 7, 21, 14, 21, NQ.mint);
  // にこにこの 目
  for (const [x, y] of sarus) {
    dot(g, x - 2, y, NQ.ink);
    dot(g, x + 1, y, NQ.ink);
    seg(g, x - 1, y + 2, x, y + 2, NQ.brick);
  }
  // ゆげ
  for (const x of [6, 16, 27]) {
    seg(g, x, 14, x + 1, 12, NQ.white);
    seg(g, x + 1, 12, x, 10, NQ.white);
  }
};

/** 奈良の シカ：公園の 鹿と 鳥居 */
const deer: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  roundTree(g, 5, 18, 5, NQ.green);
  roundTree(g, 28, 17, 4, NQ.leaf);
  // 鳥居
  box(g, 14, 5, 29, 6, NQ.red);
  box(g, 13, 4, 30, 4, NQ.bark);
  box(g, 15, 8, 28, 8, NQ.red);
  box(g, 16, 5, 17, 20, NQ.red);
  box(g, 25, 5, 26, 20, NQ.red);
  ground(g, 20, NQ.leaf, NQ.lime);
  for (let i = 0; i < 7; i++) dot(g, 2 + ((i * 9 + o.seed) % 27), 23 + (i % 3) * 2, NQ.green);
  layer(g, (l) => {
    const B = NQ.tan;
    for (const x of [9, 11, 18, 20]) box(l, x, 22, x, 28, B);
    oval(l, 15, 20, 7, 3.5, B);
    oval(l, 15, 21.5, 5, 1.5, NQ.beige);
    for (const [x, y] of [
      [13, 18],
      [16, 19],
      [19, 18],
    ] as const)
      dot(l, x, y, NQ.beige);
    oval(l, 22, 18, 1.4, 1.2, NQ.white);
    thick(l, 9, 19, 8, 14, 1.4, B);
    oval(l, 7, 12.5, 3, 2.5, B);
    oval(l, 4.5, 13.5, 1.8, 1.5, B);
    tri(l, 9, 11, 12, 10, 12, 12, B);
    tri(l, 5, 10, 3, 9, 5, 11.5, B);
    seg(l, 7, 10, 6, 6, NQ.sand);
    seg(l, 6, 7, 5, 6, NQ.sand);
    seg(l, 8, 10, 9, 7, NQ.sand);
  });
  dot(g, 6, 12, NQ.ink);
  dot(g, 3, 14, NQ.ink);
};

/** トキ：白と ピンクの つばさ、赤い かお。田んぼの 上を とぶ */
const ibis: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 26, 22, 6);
  hills(g, 21, 4, NQ.green, o.seed);
  // 田んぼ（だんだん）
  box(g, 1, 22, 30, 30, NQ.leaf);
  for (let y = 22; y <= 30; y += 3) {
    seg(g, 1, y, 30, y, NQ.lime);
    for (let x = 2 + (y % 2); x <= 30; x += 3) dot(g, x, y + 1, NQ.green);
  }
  layer(g, (l) => {
    // つばさ
    tri(l, 2, 5, 14, 10, 14, 14, NQ.white);
    tri(l, 30, 5, 18, 10, 18, 14, NQ.white);
    tri(l, 3, 6, 14, 12, 12, 13, NQ.blush);
    tri(l, 29, 6, 18, 12, 20, 13, NQ.blush);
    tri(l, 2, 5, 6, 8, 6, 6, NQ.apricot);
    tri(l, 30, 5, 26, 8, 26, 6, NQ.apricot);
    // からだ
    oval(l, 16, 13, 4.5, 2.5, NQ.white);
    seg(l, 20, 13, 23, 15, NQ.red);
    // 頭
    oval(l, 10, 12, 2.2, 2, NQ.white);
    oval(l, 9.5, 12.5, 1.4, 1.4, NQ.red);
    seg(l, 11, 10, 13, 9, NQ.white);
    // くちばし（下に まがる）
    seg(l, 8, 13, 5, 14, NQ.hairBlack);
    dot(l, 4, 15, NQ.hairBlack);
  });
  dot(g, 9, 12, NQ.ink);
};

/** ウミガメ：すなはまを 海へ むかう（上から 見た） */
const seaTurtle: SceneFn = (g, o) => {
  sky(g, 'dusk', o.seed);
  sea(g, 7, NQ.azure, o.seed);
  // なみうちぎわ
  for (let x = 1; x <= 30; x++) {
    const y = 13 + Math.round(Math.sin((x + o.seed) / 3) * 1);
    box(g, x, y, x, 30, NQ.sand);
    dot(g, x, y, NQ.white);
  }
  // あしあと
  for (let y = 26; y <= 30; y += 2) {
    dot(g, 13, y, NQ.tan);
    dot(g, 19, y, NQ.tan);
  }
  layer(g, (l) => {
    // ひれ
    tri(l, 10, 15, 5, 12, 7, 18, NQ.teal);
    tri(l, 22, 15, 27, 12, 25, 18, NQ.teal);
    tri(l, 12, 23, 9, 26, 12, 26, NQ.teal);
    tri(l, 20, 23, 23, 26, 20, 26, NQ.teal);
    // 頭
    oval(l, 16, 12, 2.5, 3, NQ.aqua);
    // こうら
    oval(l, 16, 19, 6.5, 7, NQ.green);
    oval(l, 16, 19, 5, 5.5, NQ.brown);
  });
  // こうらの もよう
  oval(g, 16, 19, 2, 2, NQ.tan);
  for (const [x, y] of [
    [13, 16],
    [18, 16],
    [13, 21],
    [18, 21],
  ] as const)
    box(g, x, y, x + 1, y + 1, NQ.tan);
  dot(g, 15, 11, NQ.ink);
  dot(g, 16, 11, NQ.ink);
};

/** ムツゴロウ：ぴかぴかの ひがたで 目が とびでた 魚 */
const mudskipper: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 8, 5, 8);
  hills(g, 12, 2, NQ.green, o.seed);
  box(g, 1, 12, 30, 14, NQ.azure);
  ground(g, 15, NQ.slate, NQ.gray);
  // ひかる どろ
  for (let i = 0; i < 8; i++) {
    const x = 2 + ((i * 11 + o.seed) % 26);
    const y = 17 + ((i * 5) % 13);
    seg(g, x, y, x + 2, y, i % 2 ? NQ.silver : NQ.gray);
  }
  oval(g, 17, 27, 11, 1.2, NQ.gray);
  layer(g, (l) => {
    // しっぽ
    tri(l, 24, 22, 30, 18, 30, 26, NQ.brown);
    // せびれ（2 まい）
    tri(l, 13, 20, 20, 20, 15, 14, NQ.sand);
    tri(l, 19, 20, 26, 21, 24, 16, NQ.sand);
    // からだ と 大きな 頭
    oval(l, 17, 22, 8.5, 3, NQ.tan, NQ.brown);
    oval(l, 10, 21.5, 4.5, 3.8, NQ.tan);
    // うでの ような ひれ
    tri(l, 10, 24, 14, 24, 9, 28, NQ.brown);
    // とびでた 目
    oval(l, 8.5, 17, 1.8, 1.8, NQ.white);
    oval(l, 12.5, 17, 1.8, 1.8, NQ.white);
  });
  for (const [x, y] of [
    [15, 17],
    [16, 19],
    [22, 19],
    [15, 22],
    [19, 22],
    [22, 23],
    [11, 20],
  ] as const)
    dot(g, x, y, NQ.sky);
  dot(g, 8, 17, NQ.ink);
  dot(g, 12, 17, NQ.ink);
  dot(g, 6, 22, NQ.bark);
  seg(g, 7, 23, 8, 23, NQ.bark);
};

/** きょうりゅう：にこにこの きょうりゅう（はくぶつかんの もけい）と 火山 */
const dinosaur: SceneFn = (g, o) => {
  sky(g, 'dusk', o.seed);
  tri(g, 16, 18, 31, 18, 24, 6, NQ.violet);
  tri(g, 22, 8, 26, 8, 24, 6, NQ.orange);
  oval(g, 25, 4, 2.5, 1.5, NQ.silver);
  oval(g, 28, 2.5, 2, 1.2, NQ.silver);
  ground(g, 22, NQ.green, NQ.leaf);
  // シダ
  for (const x of [3, 28]) {
    seg(g, x, 22, x, 15, NQ.bark);
    for (let k = 0; k < 3; k++) {
      seg(g, x, 15 + k * 2, x - 3, 17 + k * 2, NQ.leaf);
      seg(g, x, 15 + k * 2, x + 3, 17 + k * 2, NQ.leaf);
    }
  }
  layer(g, (l) => {
    const C = NQ.leaf;
    // しっぽ
    thick(l, 9, 19, 3, 23, 1.6, C);
    // あし
    box(l, 11, 21, 13, 27, C);
    box(l, 17, 21, 19, 27, C);
    box(l, 10, 27, 13, 27, NQ.green);
    box(l, 17, 27, 20, 27, NQ.green);
    // からだ
    oval(l, 15, 18, 7, 5.5, C);
    oval(l, 17, 20, 4, 3.5, NQ.sprout);
    // 頭
    oval(l, 21, 9, 5.5, 4, C);
    thick(l, 18, 12, 19, 15, 2, C);
    // 小さな 手
    seg(l, 21, 17, 23, 18, C);
    // せなかの とげ（まるい）
    for (const [x, y] of [
      [9, 13],
      [12, 11],
      [15, 11],
    ] as const)
      oval(l, x, y, 1.3, 1.3, NQ.gold);
  });
  // 目・くち・もよう
  oval(g, 21.5, 7.5, 1.4, 1.4, NQ.white);
  dot(g, 21, 7, NQ.ink);
  seg(g, 22, 11, 25, 10, NQ.green);
  dot(g, 12, 16, NQ.green);
  dot(g, 10, 18, NQ.green);
  dot(g, 14, 15, NQ.green);
};

/** 忍者：月夜の お城の 屋根の 上 */
const ninja: SceneFn = (g, o) => {
  sky(g, 'night', o.seed);
  oval(g, 20, 10, 7, 7, NQ.cream);
  oval(g, 18, 8, 1.5, 1.2, NQ.yellow);
  oval(g, 23, 13, 1.2, 1, NQ.yellow);
  hills(g, 25, 5, NQ.indigo, o.seed);
  // 屋根（かわら）
  tri(g, -2, 31, 34, 31, 16, 20, NQ.slate);
  for (let y = 23; y <= 30; y += 2)
    for (let x = 1; x <= 30; x++)
      if ((x + y) % 4 === 0 && Math.abs(x - 16) < (y - 20) * 1.6) dot(g, x, y, NQ.gray);
  seg(g, 16, 20, 16, 21, NQ.gray);
  layer(g, (l) => {
    // 忍者（あか い マフラーが なびく）
    spr(
      l,
      [
        '...NNNN....',
        '..NNNNNN...',
        '..NSeSeN...',
        '..NNNNNNRR.',
        '...NNNNRRRR',
        '..NNNNNN.RR',
        '.NNNNNNNN..',
        'SNNNNNNNNS.',
        '..NNNNNN...',
        '..NN..NN...',
        '.NN....NN..',
        'KK......KK.',
      ],
      { N: NQ.denim, S: NQ.skinLight, e: NQ.ink, R: NQ.red, K: NQ.ink },
      11,
      8,
    );
  });
};

/** 鵜飼：夜の 川で かがり火の 舟、鵜と 鵜匠 */
const ukai: SceneFn = (g, o) => {
  sky(g, 'night', o.seed);
  // 山と 城
  hills(g, 16, 8, NQ.indigo, o.seed);
  box(g, 7, 6, 9, 8, NQ.gray);
  tri(g, 6, 6, 10, 6, 8, 4, NQ.slate);
  box(g, 1, 16, 30, 30, NQ.blue);
  seg(g, 1, 16, 30, 16, NQ.denim);
  for (let i = 0; i < 5; i++) {
    const x = 2 + ((i * 7 + o.seed) % 20);
    seg(g, x, 25 + (i % 3) * 2, x + 3, 25 + (i % 3) * 2, NQ.navy);
  }
  // 火の うつり
  for (let y = 23; y <= 30; y += 2)
    seg(g, 22 + (y % 3), y, 25 + (y % 3), y, y % 4 === 1 ? NQ.gold : NQ.orange);
  layer(g, (l) => {
    // 舟
    box(l, 2, 19, 25, 21, NQ.tan);
    tri(l, 24, 18, 30, 17, 25, 22, NQ.tan);
    seg(l, 2, 21, 25, 21, NQ.brown);
    // かがり火の さお と かご
    seg(l, 27, 18, 27, 10, NQ.bark);
    seg(l, 24, 10, 27, 10, NQ.bark);
    box(l, 23, 11, 25, 13, NQ.bark);
    // 鵜匠（くろい えぼし・こしみの）
    spr(
      l,
      ['..KK..', '.KKKK.', '..SS..', '..SS..', '.NNNN.', 'NNNNNS', 'SNNN..', '.TTTT.', 'TTTTTT', '.N..N.'],
      { K: NQ.hairBlack, S: NQ.skinMid, N: NQ.navy, T: NQ.sand },
      13,
      9,
    );
    // 鵜（くろい 鳥）
    for (const [x, y] of [
      [20, 25],
      [12, 26],
      [26, 27],
    ] as const) {
      oval(l, x + 1.5, y + 1, 2.5, 1.3, NQ.hairBlack);
      box(l, x - 1, y - 2, x - 1, y, NQ.hairBlack);
      box(l, x - 2, y - 3, x - 1, y - 3, NQ.hairBlack);
      dot(l, x - 3, y - 3, NQ.yellow);
    }
  });
  // つな
  for (const [x, y] of [
    [19, 23],
    [11, 23],
    [25, 24],
  ] as const)
    seg(g, 19, 15, x, y, NQ.cloud);
  for (const [x, y] of [
    [20, 25],
    [12, 26],
    [26, 27],
  ] as const)
    dot(g, x - 2, y - 2, NQ.white);
  // 火
  tri(g, 21, 11, 27, 11, 24, 3, NQ.vermilion);
  tri(g, 22, 11, 26, 11, 24, 5, NQ.orange);
  box(g, 23, 9, 24, 10, NQ.gold);
  for (const [x, y] of [
    [20, 5],
    [27, 3],
    [28, 7],
  ] as const)
    dot(g, x, y, NQ.gold);
};

/** 人形浄瑠璃：まくの ある ぶたいで、黒い 人が うごかす 人形 */
const puppet: SceneFn = (g, o) => {
  // 金の びょうぶ
  box(g, 1, 1, 30, 30, NQ.gold);
  for (let x = 6; x <= 30; x += 6) seg(g, x, 5, x, 24, NQ.ochre);
  seg(g, 3, 14, 10, 10, NQ.bark);
  oval(g, 8, 10, 3, 1.5, NQ.green);
  oval(g, 4, 13, 2.5, 1.2, NQ.green);
  // 上の まく
  box(g, 1, 1, 30, 4, NQ.red);
  for (let x = 1; x <= 30; x += 4) oval(g, x + 2, 4.5, 2, 1.5, NQ.red);
  seg(g, 1, 1, 30, 1, NQ.brick);
  // よこの しまの まく
  const stripes = [NQ.hairBlack, NQ.green, NQ.amber];
  for (let x = 1; x <= 4; x++) seg(g, x, 5, x, 30, pick(stripes, x + o.seed));
  for (let x = 27; x <= 30; x++) seg(g, x, 5, x, 30, pick(stripes, x + o.seed));
  // ぶたい
  box(g, 5, 25, 26, 30, NQ.brown);
  seg(g, 5, 25, 26, 25, NQ.tan);
  // うしろの 黒い 人（ずきん）
  layer(g, (l) => {
    oval(l, 19, 10, 3, 3.2, NQ.hairBlack);
    box(l, 15, 13, 24, 25, NQ.hairBlack);
    thick(l, 16, 15, 13, 17, 1, NQ.hairBlack);
  });
  // 人形（赤い きもの・白い かお）
  layer(g, (l) => {
    oval(l, 13, 9, 3, 2.6, NQ.hairBlack);
    oval(l, 13, 5.8, 1.6, 1.4, NQ.hairBlack);
    dot(l, 16, 6, NQ.gold);
    dot(l, 10, 7, NQ.blush);
    oval(l, 13, 11, 2.2, 2.2, NQ.white);
    tri(l, 7, 24, 19, 24, 13, 13, NQ.red);
    box(l, 10, 16, 16, 17, NQ.gold);
    thick(l, 11, 15, 8, 17, 1, NQ.red);
    oval(l, 7.5, 18, 1, 1, NQ.white);
    for (const [x, y] of [
      [11, 20],
      [15, 21],
      [13, 19],
    ] as const)
      dot(l, x, y, NQ.blush);
  });
  dot(g, 12, 11, NQ.ink);
  dot(g, 14, 11, NQ.ink);
  dot(g, 13, 12, NQ.red);
};

/** かっぱ：川の そばの 岩に すわる みどりの かっぱ（頭に お皿） */
const kappa: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  roundTree(g, 25, 13, 4, NQ.green);
  roundTree(g, 5, 11, 3, NQ.leaf);
  ground(g, 12, NQ.leaf, NQ.lime);
  // 川
  for (let y = 18; y <= 30; y++) {
    const x0 = 1;
    const x1 = Math.round(10 + (y - 18) * 1.8);
    box(g, x0, y, Math.min(30, x1), y, NQ.azure);
  }
  seg(g, 3, 22, 6, 22, NQ.ice);
  seg(g, 5, 26, 9, 26, NQ.ice);
  // 岩
  oval(g, 19, 27, 8, 3.5, NQ.gray, NQ.slate);
  layer(g, (l) => {
    // こうら
    oval(l, 23, 19, 3, 4.5, NQ.brown);
    // あし
    box(l, 13, 22, 21, 24, NQ.leaf);
    // からだ
    oval(l, 18, 19, 4.5, 4.5, NQ.leaf);
    oval(l, 17, 20, 2.5, 2.5, NQ.sprout);
    // 頭
    oval(l, 18, 11, 5.5, 4.8, NQ.leaf);
    oval(l, 18, 7.5, 4, 1.8, NQ.forest);
    oval(l, 18, 7.2, 2.8, 1.2, NQ.ice);
    // くちばし
    oval(l, 13.5, 13, 2.4, 1.5, NQ.gold);
    // きゅうり
    thick(l, 12, 18, 15, 16, 0.9, NQ.green);
  });
  oval(g, 16, 10.5, 1.3, 1.3, NQ.white);
  oval(g, 20, 10.5, 1.3, 1.3, NQ.white);
  dot(g, 15, 10, NQ.ink);
  dot(g, 19, 10, NQ.ink);
  dot(g, 20, 13, NQ.blush);
  dot(g, 12, 13, NQ.ochre);
};

/** アイヌの くらし：かやぶきの 家（チセ）と アイヌもようの ぬの */
const ainu: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 24, 4, 8);
  hills(g, 17, 5, NQ.green, o.seed);
  for (const x of [3, 28]) tree(g, x, 18, 9, NQ.forest);
  ground(g, 18, NQ.leaf, NQ.lime);
  layer(g, (l) => {
    // チセ（かやの 屋根と かべ）
    tri(l, 3, 14, 23, 14, 13, 3, NQ.sand);
    for (let x = 6; x <= 20; x += 2) seg(l, 13, 4, x, 14, NQ.ochre);
    box(l, 5, 14, 21, 22, NQ.tan);
    for (let y = 15; y <= 21; y += 2) seg(l, 5, y, 21, y, NQ.sand);
    box(l, 11, 16, 15, 22, NQ.bark);
    box(l, 17, 16, 19, 18, NQ.bark);
    // ぬの（アットゥシ）を かける
    seg(l, 22, 9, 30, 9, NQ.brown);
    seg(l, 23, 9, 23, 22, NQ.brown);
    box(l, 24, 10, 29, 20, NQ.navy);
  });
  // もよう（うずまき と とげ）
  const W = NQ.white;
  spr(
    g,
    ['.WWWW.', 'W.WW.W', 'W.W..W', '.WW.W.', 'W.WW.W', 'W....W', '.WWWW.', '..RR..', '.W..W.', 'W.WW.W'],
    { W, R: NQ.red },
    24,
    10,
  );
  // 下の おび もよう
  box(g, 1, 25, 30, 30, NQ.navy);
  seg(g, 1, 25, 30, 25, NQ.red);
  seg(g, 1, 30, 30, 30, NQ.red);
  for (let x = 1; x <= 30; x += 6) {
    spr(g, ['.WW.W', 'W..W.', 'W.WW.', '.W..W'], { W }, x, 26);
    dot(g, x + 5, 27, NQ.red);
    dot(g, x + 5, 28, NQ.red);
  }
};

export const EVENTS: Record<EventKey, SceneFn> = {
  namahageMask,
  kanto,
  fireworks,
  nebutaFloat,
  horseSamurai,
  dance,
  snowStatue,
  kiriko,
  lanternCrown,
  tanabata,
  taikoDance,
  danjiri,
  festivalFloat,
  kagura,
  kite,
  pinwheels,
  dog,
  crane,
  dolphin,
  horse,
  monkey,
  deer,
  ibis,
  seaTurtle,
  mudskipper,
  dinosaur,
  ninja,
  ukai,
  puppet,
  kappa,
  ainu,
};
