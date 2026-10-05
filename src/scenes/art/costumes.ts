/**
 * めいさんひんの そうび（県の 名所スタンプを ぜんぶ あつめた ごほうび）を 着た 主人公の 絵。
 * そうびの id → 絵。ロジックは src/core/progression/meisan.ts、しくみは characters.ts の heroLook / walkSheet。
 *
 * 主人公の コマは 町の人（16×24）より 大きい 24×32（HERO_FRAME）。上に 8 ドット・左右に 4 ドットの よゆうが あり、
 * 頭の かぶりものや 体の きぐるみを 体より 大きく 描ける（ぱっと 見て かわったと わかるように）。
 *  - legMap：足の 地図の 文字を 差し替える（ズボン B・すね S・くつ K）。あとの そうびほど 先に 使った 文字には さわらない
 *  - draw：コマの マス目に じかに 描く（左向き。右向きは コマごと 左右反転する）
 *
 * 47 都道府県ぶんを 描くため、形の「型」（まるい ぼうし・どんぶり・かさ・きぐるみ・きもの・よろい・すねあて・ブーツ）に
 * 県ごとの 色と もようを わたして 作る。型に ない 形（さくらんぼ・かに・赤べこ・だるま…）は その県だけの 絵。
 * コマの 中の 場所：頭 y 9〜18（かお 13〜18）・体 19〜25・足 26〜30。正面の まん中は x 11.5、よこ向きは 12。
 */
import { put, type Grid } from './grid';
import { NQ } from './palette';

/** 主人公の コマ（24×32）。人物の 地図（14×22）を (ox, oy) に 置く */
export const HERO_FRAME = { w: 24, h: 32, ox: 5, oy: 9 } as const;

export type CostumeView = 'front' | 'back' | 'side';
export type CostumePose = 'walk' | 'attack' | 'hurt' | 'victory';
export type CostumeSlot = 'head' | 'chest' | 'legs' | 'feet';

type Colors = Readonly<Record<string, string>>;
type Draw = (g: Grid, view: CostumeView, pose: CostumePose, base: Colors) => void;

export interface CostumeArt {
  slot: CostumeSlot;
  /** legMap で 使う 文字の 色 */
  colors?: Colors;
  legMap?: Readonly<Record<string, string>>;
  /** base＝人物の 色（S＝はだ など） */
  draw?: Draw;
}

/** 描く じゅん（あとの ものが 上に のる） */
export const COSTUME_ORDER: readonly CostumeSlot[] = ['legs', 'feet', 'chest', 'head'];

/** もよう：その マスの 色（null＝もとの 色のまま）。dx は 中心からの よこの ずれ ÷ 半径 */
type Pat = (x: number, y: number, dx: number) => string | null | undefined;

const cxOf = (view: CostumeView): number => (view === 'side' ? 12 : 11.5);
const LEG_Y0 = HERO_FRAME.oy + 17;
const LEG_Y1 = HERO_FRAME.oy + 21;

/** だ円を ぬる。col(x, y, dx) で 1 マスずつ 色を きめる */
function oval(
  g: Grid,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  y0: number,
  y1: number,
  col: (x: number, y: number, dx: number) => string,
): void {
  for (let y = y0; y <= y1; y++) {
    const t = (y - cy) / ry;
    if (Math.abs(t) > 1) continue;
    const hw = rx * Math.sqrt(1 - t * t);
    for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) put(g, x, y, col(x, y, (x - cx) / rx));
  }
}

/** はば hw(y) の 形を ぬる（まん中 cx） */
function shape(
  g: Grid,
  cx: number,
  y0: number,
  y1: number,
  hw: (y: number) => number,
  col: (x: number, y: number, dx: number) => string,
): void {
  for (let y = y0; y <= y1; y++) {
    const w = hw(y);
    if (w < 0) continue;
    for (let x = Math.ceil(cx - w); x <= Math.floor(cx + w); x++)
      put(g, x, y, col(x, y, (x - cx) / Math.max(w, 1)));
  }
}

/** y0〜y1 の 行で、colors の 色の マスだけ もようで ぬりなおす */
function repaint(g: Grid, y0: number, y1: number, colors: readonly string[], pat: Pat): void {
  for (let y = y0; y <= y1; y++)
    g[y]?.forEach((c, x) => {
      if (!c || !colors.includes(c)) return;
      const to = pat(x, y, 0);
      if (to) put(g, x, y, to);
    });
}

/** きぐるみ・きものの 手（ばんざいの ときは 上に 出ている）。reach＝手の 高さでの 服の はば（半分） */
function hands(g: Grid, view: CostumeView, pose: CostumePose, base: Colors, reach: number): void {
  if (pose === 'victory') return;
  const skin = base.S ?? NQ.skinLight;
  const cx = cxOf(view);
  if (view === 'side') {
    const hy = pose === 'attack' ? 21 : 23;
    const hx = Math.ceil(cx - reach) - 1;
    put(g, hx, hy, skin);
    if (pose === 'attack') put(g, hx - 1, hy, skin);
    return;
  }
  for (const hx of [Math.ceil(cx - reach) - 1, Math.floor(cx + reach) + 1]) {
    put(g, hx, 23, skin);
    put(g, hx, 24, skin);
  }
}

// ───────────────────────── 頭の 型 ─────────────────────────

interface DomeOpts {
  body: string;
  shade: string;
  /** 左上の ひかり */
  light?: string;
  pattern?: Pat;
  /** ふち（切り口の 実など）。無ければ まるい まま 頭に のせる */
  rim?: string;
  rimShade?: string;
  /** よこの 半径（ふつう 9。しいたけの かさは もっと ひろい） */
  rx?: number;
  /** てっぺん・まわりの かざり（つる・へた・目・つの…） */
  extra?: (g: Grid, cx: number, view: CostumeView) => void;
}

/** まるい ぼうし（くだもの・メロン・たこ など）。頭より ひとまわり 大きい */
function domeHat(o: DomeOpts): Draw {
  return (g, view) => {
    const cx = cxOf(view);
    const rx = o.rx ?? 9;
    const rim = 12;
    oval(g, cx, 9, rx, 8, 2, o.rim ? rim - 1 : rim, (x, y, dx) => {
      const p = o.pattern?.(x, y, dx);
      if (p) return p;
      if (o.light && dx < -0.3 && y <= 5) return o.light;
      return dx > 0.45 ? o.shade : o.body;
    });
    if (o.rim) {
      const t = (rim - 9) / 8;
      const hw = rx * Math.sqrt(1 - t * t);
      for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++)
        put(g, x, rim, x > cx + 3 ? (o.rimShade ?? o.rim) : o.rim);
    }
    o.extra?.(g, cx, view);
  };
}

/** さかさの どんぶり・かぶと（やきもの・銅器・うどん）。上に 高台（こうだい） */
function bowlHat(o: {
  body: string;
  shade: string;
  rim: string;
  foot?: string;
  pattern?: Pat;
  extra?: DomeOpts['extra'];
}): Draw {
  return (g, view) => {
    const cx = cxOf(view);
    shape(
      g,
      cx,
      3,
      3,
      () => 2.5,
      () => o.foot ?? o.shade,
    );
    shape(
      g,
      cx,
      4,
      12,
      (y) => 4.5 + (y - 4) * 0.6,
      (x, y, dx) => (y === 12 ? o.rim : (o.pattern?.(x, y, dx) ?? (dx > 0.5 ? o.shade : o.body))),
    );
    o.extra?.(g, cx, view);
  };
}

/** ひろい かさ（すげがさ）。まん中が とがって、ふちは コマの はばいっぱい */
function kasaHat(o: { body: string; shade: string; band: string }): Draw {
  return (g, view) => {
    const cx = cxOf(view);
    shape(
      g,
      cx,
      2,
      2,
      () => 0.5,
      () => o.shade,
    );
    shape(
      g,
      cx,
      3,
      12,
      (y) => 1 + (y - 3) * 1.25,
      (x, y) => (y === 10 || y === 11 ? o.band : Math.round(x - cx) % 3 === 0 && y > 4 ? o.shade : o.body),
    );
  };
}

/** つると 葉っぱ（メロン・すいか など） */
const stemLeaf = (g: Grid, cx: number): void => {
  const sx = Math.floor(cx);
  put(g, sx, 1, NQ.brown);
  put(g, sx - 1, 0, NQ.brown);
  put(g, sx + 1, 1, NQ.leaf);
  put(g, sx + 2, 1, NQ.leaf);
  put(g, sx + 2, 0, NQ.green);
};

/** へた（かき・いちご）：てっぺんに ひろがる みどりの 葉 */
const calyx = (g: Grid, cx: number): void => {
  const sx = Math.floor(cx);
  for (let x = sx - 4; x <= sx + 5; x++) put(g, x, 2, x % 2 ? NQ.green : NQ.leaf);
  for (const x of [sx - 2, sx, sx + 2]) put(g, x, 1, NQ.leaf);
  put(g, sx, 0, NQ.brown);
};

/** 正面の 目（たこ・ふぐ・赤べこ）。白目に 黒目 */
const eyes = (g: Grid, cx: number, view: CostumeView, y: number, gap = 3): void => {
  if (view === 'back') return;
  const xs = view === 'side' ? [Math.floor(cx) - gap] : [Math.floor(cx) - gap, Math.ceil(cx) + gap - 1];
  for (const x of xs) {
    put(g, x, y, NQ.white);
    put(g, x + 1, y, NQ.white);
    put(g, x, y + 1, NQ.white);
    put(g, x + 1, y + 1, NQ.ink);
  }
};

// ───────────────────────── 体の 型 ─────────────────────────

/** まるい きぐるみ（くだもの・せんべい など）。体より ひとまわり 大きく、手だけ 出る */
function fruitSuit(o: { body: string; shade: string; light?: string; pattern?: Pat; leaf?: boolean }): Draw {
  return (g, view, pose, base) => {
    const side = view === 'side';
    const cx = cxOf(view);
    const rx = side ? 6.5 : 8;
    oval(g, cx, 23, rx, 4.4, 19, 27, (x, y, dx) => o.pattern?.(x, y, dx) ?? (dx > 0.4 ? o.shade : o.body));
    if (o.light) {
      put(g, Math.round(cx - rx + 3), 21, o.light);
      put(g, Math.round(cx - rx + 2), 22, o.light);
    }
    if (o.leaf) {
      put(g, Math.floor(cx) + 1, 19, NQ.brown);
      put(g, Math.floor(cx) + 5, 18, NQ.leaf);
      put(g, Math.floor(cx) + 6, 18, NQ.leaf);
      put(g, Math.floor(cx) + 6, 17, NQ.green);
    }
    hands(g, view, pose, base, rx);
  };
}

/** はばの きまり：きもの・よろいの 形（かた・そで・すそ） */
const robeWidth = (side: boolean) => (y: number) =>
  side ? (y <= 19 ? 4 : 5) : y <= 19 ? 6.5 : y <= 23 ? 8 : 7;

/** きもの・はっぴ（おりもの・そめもの）。えりと おびが つく */
function robe(o: { body: string; shade?: string; pattern?: Pat; collar?: string; obi?: string }): Draw {
  return (g, view, pose, base) => {
    const side = view === 'side';
    const cx = cxOf(view);
    shape(g, cx, 19, 28, robeWidth(side), (x, y, dx) => {
      if (o.obi && (y === 23 || y === 24)) return o.obi;
      if (
        o.collar &&
        view === 'front' &&
        y <= 22 &&
        Math.abs(x - cx) >= y - 19.5 &&
        Math.abs(x - cx) <= y - 18
      )
        return o.collar;
      return o.pattern?.(x, y, dx) ?? (o.shade && dx > 0.6 ? o.shade : o.body);
    });
    hands(g, view, pose, base, side ? 5 : 8);
  };
}

/** よろい（ぬりもの・やきもの）。かたあてが はり出し、よこに 板の すじ */
function armorSuit(o: { body: string; shade: string; trim: string; pattern?: Pat }): Draw {
  return (g, view, pose, base) => {
    const side = view === 'side';
    const cx = cxOf(view);
    shape(g, cx, 19, 27, robeWidth(side), (x, y, dx) => {
      if (y === 22 || y === 25) return o.shade;
      if (y === 27) return o.trim;
      if (view !== 'side' && Math.abs(x - cx) < 1) return o.trim;
      return o.pattern?.(x, y, dx) ?? (dx > 0.6 ? o.shade : o.body);
    });
    // かたあて
    shape(
      g,
      cx,
      19,
      20,
      () => (side ? 5.5 : 9.5),
      (x, y) => (y === 19 ? o.trim : o.shade),
    );
    hands(g, view, pose, base, side ? 5 : 8);
  };
}

// ───────────────────────── 足の 型 ─────────────────────────

/** すねあて・ズボン：ひざから 下の 色と もよう */
function legsWear(o: { pants: string; shin?: string; pattern?: Pat }): CostumeArt {
  const shin = o.shin ?? o.pants;
  return {
    slot: 'legs',
    colors: { g: o.pants, G: shin },
    legMap: { B: 'g', S: 'G' },
    draw: (g, _view, _pose, base) => {
      // 半ズボンの ところ（足の 上の 2 行）も おなじ 色に
      const pants = base.B;
      if (pants) repaint(g, LEG_Y0 - 2, LEG_Y0 - 1, [pants], () => o.pants);
      if (o.pattern) repaint(g, LEG_Y0 - 2, LEG_Y1, [o.pants, shin], o.pattern);
    },
  };
}

/** 大きな ブーツ（すねまで）。足もとを 1 ドットずつ ひろげて どっしり 見せ、ふちに つや・もよう */
function bootsWear(o: { boot: string; top?: string; pattern?: Pat }): CostumeArt {
  return {
    slot: 'feet',
    colors: { F: o.boot },
    legMap: { K: 'F', S: 'F' },
    draw: (g) => {
      for (let y = LEG_Y0 + 2; y <= LEG_Y1; y++) {
        const row = g[y]!;
        const xs = row.flatMap((c, x) => (c === o.boot ? [x] : []));
        for (const x of xs) {
          if (row[x - 1] === null) put(g, x - 1, y, o.boot);
          if (row[x + 1] === null) put(g, x + 1, y, o.boot);
        }
      }
      if (o.pattern) repaint(g, LEG_Y0, LEG_Y1, [o.boot], o.pattern);
      if (o.top) {
        const top = LEG_Y0 + 1;
        g[top]?.forEach((c, x) => c === o.boot && put(g, x, top, o.top!));
      }
    },
  };
}

// ───────────────────────── その県だけの 形 ─────────────────────────

/** 山形：さくらんぼ 2 つぶを 頭に のせる。じくは てっぺんで むすぶ */
const cherries: Draw = (g, view) => {
  const cx = cxOf(view);
  for (const ox of view === 'side' ? [-2.5, 3.5] : [-4.5, 4.5])
    oval(g, cx + ox, 8.5, 4.6, 4.4, 4, 12, (_x, y, dx) =>
      dx < -0.2 && y <= 6 ? NQ.apricot : dx > 0.4 ? NQ.brick : NQ.red,
    );
  const sx = Math.floor(cx);
  for (let y = 1; y <= 3; y++) {
    put(g, sx - 3 + y, y, NQ.green);
    put(g, sx + 4 - y, y, NQ.green);
  }
  put(g, sx, 0, NQ.green);
  put(g, sx + 1, 0, NQ.leaf);
  put(g, sx + 2, 0, NQ.leaf);
};

/** 福島：赤べこ の かぶりもの。赤い 頭に 金の もよう、黒い つの、目と 白い はな */
const akabeko = domeHat({
  body: NQ.red,
  shade: NQ.brick,
  pattern: (x, y) => (y === 10 && x % 3 === 0 ? NQ.gold : y === 11 ? NQ.ink : null),
  extra: (g, cx, view) => {
    const sx = Math.floor(cx);
    for (const [x, y] of [
      [-8, 3],
      [-9, 2],
      [-9, 1],
      [9, 3],
      [10, 2],
      [10, 1],
    ] as const)
      put(g, sx + x, y, NQ.ink);
    eyes(g, cx, view, 5, 3);
    if (view !== 'back') for (let x = sx - 1; x <= sx + 2; x++) put(g, x, 8, NQ.white);
  },
});

/** 群馬：高崎だるまの ずきん。かおの まわりを 赤で つつみ、ひたいに 金の もよう */
const daruma: Draw = (g, view, pose, base) => {
  domeHat({
    body: NQ.red,
    shade: NQ.brick,
    light: NQ.vermilion,
    pattern: (x, y) => ((y === 8 || y === 9) && (x + y) % 3 === 0 ? NQ.gold : null),
  })(g, view, pose, base);
  const cx = cxOf(view);
  // よこの たれ（かおの 両がわ）
  const sides =
    view === 'side'
      ? [[Math.floor(cx) + 2, Math.floor(cx) + 6]]
      : [
          [Math.ceil(cx - 7), Math.ceil(cx - 5)],
          [Math.floor(cx + 5), Math.floor(cx + 7)],
        ];
  for (const [x0, x1] of sides)
    for (let y = 12; y <= 18; y++) for (let x = x0!; x <= x1!; x++) put(g, x, y, y === 18 ? NQ.gold : NQ.red);
  if (view === 'back')
    for (let y = 12; y <= 18; y++)
      for (let x = Math.ceil(cx - 7); x <= Math.floor(cx + 7); x++) put(g, x, y, NQ.red);
};

/** 福井・越前がに：あかい こうらの ぼうしに、目と 大きな はさみ */
const crab = domeHat({
  body: NQ.vermilion,
  shade: NQ.brick,
  light: NQ.apricot,
  pattern: (x, y) => (y >= 4 && y <= 9 && (x * 3 + y * 5) % 7 === 0 ? NQ.brick : null),
  extra: (g, cx, view) => {
    const sx = Math.floor(cx);
    if (view !== 'back')
      for (const x of view === 'side' ? [sx - 3] : [sx - 3, sx + 3]) {
        put(g, x, 1, NQ.ink);
        put(g, x, 2, NQ.vermilion);
      }
    // はさみ
    for (const s of view === 'side' ? [-1] : [-1, 1]) {
      const bx = s < 0 ? sx - 10 : sx + 11;
      for (let y = 7; y <= 12; y++) put(g, bx, y, NQ.vermilion);
      put(g, bx - s, 7, NQ.vermilion);
      put(g, bx - s, 8, NQ.vermilion);
      put(g, bx + s, 6, NQ.vermilion);
      put(g, bx + s, 7, NQ.brick);
    }
  },
});

/** 三重：真珠の かんむり。金の わに 白い 真珠 */
const pearlCrown: Draw = (g, view) => {
  const cx = cxOf(view);
  const hw = view === 'side' ? 5.5 : 7;
  for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) {
    put(g, x, 11, NQ.gold);
    put(g, x, 12, NQ.ochre);
    if (x % 2 === 0) put(g, x, 11, NQ.white);
  }
  const peaks = view === 'side' ? [-4, 0, 4] : [-6, -3, 0, 3, 6];
  for (const p of peaks) {
    const x = Math.round(cx + p);
    const h = p === 0 ? 5 : Math.abs(p) <= 3 ? 7 : 8;
    for (let y = h; y <= 10; y++) put(g, x, y, NQ.gold);
    put(g, x, h - 1, NQ.white);
    put(g, x, h - 2, NQ.cloud);
  }
};

/** 兵庫・明石の たこ：あかい あたまに すいばん、目、ふちから あしが たれる */
const octopus = domeHat({
  body: NQ.berry,
  shade: NQ.brick,
  light: NQ.blush,
  extra: (g, cx, view) => {
    eyes(g, cx, view, 7, 3);
    const sx = Math.floor(cx);
    for (const s of view === 'side' ? [-1] : [-1, 1])
      for (let y = 12; y <= 17; y++) {
        const x = s < 0 ? sx - 8 + (y % 2) : sx + 8 - (y % 2) + 1;
        put(g, x, y, NQ.berry);
        if (y % 2) put(g, x + (s < 0 ? 1 : -1), y, NQ.blush);
      }
  },
});

/** 山口・下関の ふぐ：まるい からだに とげ、白い おなか、目 */
const fugu = domeHat({
  body: NQ.ochre,
  shade: NQ.amber,
  pattern: (x, y) =>
    y >= 11 ? NQ.white : x % 3 === 1 && (y + (Math.floor(x / 3) % 2) * 2) % 4 === 0 ? NQ.brown : null,
  extra: (g, cx, view) => {
    for (let a = 0; a < 16; a++) {
      const th = Math.PI * (a / 15);
      put(g, Math.round(cx - Math.cos(th) * 10), Math.round(9 - Math.sin(th) * 8.6), NQ.amber);
    }
    eyes(g, cx, view, 6, 4);
  },
});

/** 香川：讃岐うどんの どんぶりを 頭に のせる。上は めんと ねぎ、ゆげが たつ */
const udonBowl: Draw = (g, view) => {
  const cx = cxOf(view);
  // ゆげ
  for (const [dx, y] of [
    [-3, 0],
    [-2, 1],
    [2, 0],
    [3, 1],
    [-3, 2],
    [3, 2],
  ] as const)
    put(g, Math.round(cx + dx), y, NQ.cloud);
  // めんと ねぎ・かまぼこ
  shape(
    g,
    cx,
    3,
    4,
    () => 9.5,
    (x, y) =>
      (x * 2 + y) % 7 === 0
        ? NQ.leaf
        : x === Math.round(cx + 4)
          ? NQ.blush
          : (x + y) % 3 === 0
            ? NQ.sand
            : NQ.cream,
  );
  // どんぶり
  shape(
    g,
    cx,
    5,
    11,
    (y) => 9.5 - (y - 5) * 0.6,
    (_x, y, dx) => (y === 5 ? NQ.navy : y === 8 || y === 9 ? NQ.navy : dx > 0.5 ? NQ.cloud : NQ.white),
  );
  shape(
    g,
    cx,
    12,
    12,
    () => 4,
    () => NQ.navy,
  );
};

/** 長崎：カステラの きぐるみ。上は こげ茶の やきめ、下に かみ */
const castella: Draw = (g, view, pose, base) => {
  const side = view === 'side';
  const cx = cxOf(view);
  const hw = side ? 5.5 : 8;
  shape(
    g,
    cx,
    19,
    28,
    () => hw,
    (_x, y, dx) => (y <= 20 ? NQ.brown : y === 28 ? NQ.paper : dx > 0.6 ? NQ.ochre : NQ.yellow),
  );
  hands(g, view, pose, base, hw);
};

// ───────────────────────── 47 都道府県 ─────────────────────────

const net = (x: number, y: number) => (x + y) % 6 === 0 || (x - y + 120) % 6 === 0;
const dots = (x: number, y: number, n = 5) => (x * 2 + y * 3) % n === 0;

export const COSTUME_ART: Readonly<Record<string, CostumeArt>> = {
  // ── 北海道・東北
  'hokkaido-meisan-yubari-melon': {
    slot: 'head',
    draw: domeHat({
      body: NQ.leaf,
      shade: NQ.green,
      light: NQ.lime,
      pattern: (x, y) => (net(x, y) ? NQ.sprout : null),
      rim: NQ.orange,
      rimShade: NQ.amber,
      extra: stemLeaf,
    }),
  },
  'aomori-meisan-ringo': {
    slot: 'chest',
    draw: fruitSuit({ body: NQ.red, shade: NQ.berry, light: NQ.white, leaf: true }),
  },
  'iwate-meisan-nanbu-tekki': bootsWear({
    boot: NQ.slate,
    top: NQ.silver,
    pattern: (x, y) => ((x + y) % 3 === 0 ? NQ.night : null),
  }),
  'miyagi-meisan-zunda': {
    slot: 'chest',
    draw: fruitSuit({
      body: NQ.lime,
      shade: NQ.leaf,
      light: NQ.sprout,
      pattern: (x, y) => (dots(x, y, 7) ? NQ.leaf : null),
    }),
  },
  'akita-meisan-magewappa': legsWear({
    pants: NQ.tan,
    shin: NQ.sand,
    pattern: (_x, y) => (y % 2 === 0 ? NQ.tan : NQ.sand),
  }),
  'yamagata-meisan-sakuranbo': { slot: 'head', draw: cherries },
  'fukushima-meisan-akabeko': { slot: 'head', draw: akabeko },

  // ── 関東
  'ibaraki-meisan-natto': {
    slot: 'chest',
    // 水戸納豆の わらづと：たての わらの すじ、ひもで しばる
    draw: robe({
      body: NQ.sand,
      pattern: (x, y) => (y === 21 || y === 26 ? NQ.brown : x % 2 ? NQ.tan : NQ.sand),
    }),
  },
  'tochigi-meisan-ichigo': {
    slot: 'head',
    draw: domeHat({
      body: NQ.red,
      shade: NQ.brick,
      light: NQ.vermilion,
      // つぶつぶの たね（ずらした こうし）
      pattern: (x, y) =>
        y > 3 && x % 3 === 1 && (y + (Math.floor(x / 3) % 2) * 2) % 4 === 0 ? NQ.cream : null,
      extra: calyx,
    }),
  },
  'gunma-meisan-takasaki-daruma': { slot: 'head', draw: daruma },
  'saitama-meisan-soka-senbei': {
    slot: 'chest',
    draw: fruitSuit({
      body: NQ.amber,
      shade: NQ.brown,
      pattern: (x, y) => (Math.abs(x - 11.5) < 1.5 && y >= 20 ? NQ.forest : dots(x, y, 6) ? NQ.brown : null),
    }),
  },
  'chiba-meisan-rakkasei': legsWear({
    pants: NQ.sand,
    shin: NQ.beige,
    pattern: (x, y) => ((x + y) % 3 === 0 ? NQ.tan : null),
  }),
  'tokyo-meisan-edo-kiriko': bootsWear({
    boot: NQ.azure,
    top: NQ.ice,
    pattern: (x, y) => ((x + y) % 3 === 0 ? NQ.ice : (x - y + 30) % 3 === 0 ? NQ.blue : null),
  }),
  'kanagawa-meisan-yosegi-zaiku': legsWear({
    pants: NQ.tan,
    pattern: (x, y) => [NQ.sand, NQ.brown, NQ.tan, NQ.beige][(x + y * 2) % 4],
  }),

  // ── 北陸・甲信越
  'niigata-meisan-tsubame-sanjo': bootsWear({
    boot: NQ.silver,
    top: NQ.white,
    pattern: (x, y) => ((x + y) % 4 === 0 ? NQ.cloud : null),
  }),
  'toyama-meisan-takaoka-doki': bootsWear({
    boot: NQ.amber,
    top: NQ.gold,
    pattern: (x, y) => ((x * 2 + y) % 5 === 0 ? NQ.brown : null),
  }),
  'ishikawa-meisan-wajimanuri': {
    slot: 'chest',
    draw: armorSuit({
      body: NQ.night,
      shade: NQ.ink,
      trim: NQ.brick,
      pattern: (x, y) => ((x * 3 + y * 5) % 11 === 0 ? NQ.gold : null),
    }),
  },
  'fukui-meisan-echizen-gani': { slot: 'head', draw: crab },
  'yamanashi-meisan-budou': {
    slot: 'head',
    draw: domeHat({
      body: NQ.violet,
      shade: NQ.indigo,
      // ぶどうの つぶ：4 ドットごとの まるに ひかり
      pattern: (x, y) => {
        const ox = (x + (Math.floor(y / 3) % 2) * 2) % 4;
        const oy = y % 3;
        if (ox === 1 && oy === 1) return NQ.lavender;
        if (ox === 3 || oy === 0) return NQ.indigo;
        return null;
      },
      extra: stemLeaf,
    }),
  },
  'nagano-meisan-kiso-shikki': bootsWear({
    boot: NQ.brick,
    top: NQ.gold,
    pattern: (x, y) => ((x + y) % 5 === 0 ? NQ.red : null),
  }),

  // ── 東海
  'gifu-meisan-fuyugaki': {
    slot: 'head',
    draw: domeHat({ body: NQ.orange, shade: NQ.amber, light: NQ.apricot, extra: calyx }),
  },
  'shizuoka-meisan-shizuoka-cha': {
    slot: 'head',
    // 茶つみの すげがさ：みどりの おび
    draw: kasaHat({ body: NQ.sand, shade: NQ.tan, band: NQ.leaf }),
  },
  'aichi-meisan-arimatsu-shibori': {
    slot: 'chest',
    // 有松絞り：あいいろに 白い 小さな わの もよう
    draw: robe({
      body: NQ.blue,
      shade: NQ.navy,
      collar: NQ.white,
      pattern: (x, y) => ((x % 3 === 0 && y % 3 === 1) || (x % 3 === 1 && y % 3 === 0) ? NQ.sky : null),
    }),
  },
  'mie-meisan-ago-shinju': { slot: 'head', draw: pearlCrown },

  // ── 近畿
  'shiga-meisan-omi-jofu': {
    slot: 'chest',
    // 近江上布：うすい あおに 白い かすり
    draw: robe({
      body: NQ.sky,
      shade: NQ.azure,
      collar: NQ.navy,
      obi: NQ.navy,
      pattern: (x, y) => ((x + y) % 4 === 0 && (x - y + 40) % 4 === 0 ? NQ.white : null),
    }),
  },
  'kyoto-meisan-tango-chirimen': {
    slot: 'chest',
    // 丹後ちりめんの きもの：べにいろに 花、金の おび
    draw: robe({
      body: NQ.berry,
      shade: NQ.brick,
      collar: NQ.white,
      obi: NQ.gold,
      pattern: (x, y) => (dots(x, y, 7) ? NQ.blush : (x * 2 + y * 3) % 7 === 1 ? NQ.white : null),
    }),
  },
  'osaka-meisan-takoyaki': {
    slot: 'head',
    // たこ焼き：ソース・マヨネーズ・あおのり
    draw: domeHat({
      body: NQ.amber,
      shade: NQ.brown,
      pattern: (x, y) => {
        if (y <= 7 && (x + y) % 4 === 0) return NQ.cream;
        if (y <= 7) return dots(x, y, 7) ? NQ.leaf : NQ.bark;
        return null;
      },
    }),
  },
  'hyogo-meisan-akashi-tako': { slot: 'head', draw: octopus },
  'nara-meisan-nara-zumi': legsWear({
    pants: NQ.night,
    shin: NQ.ink,
    pattern: (_x, y) => (y === LEG_Y0 + 1 ? NQ.gold : null),
  }),
  'wakayama-meisan-arida-mikan': {
    slot: 'chest',
    draw: fruitSuit({
      body: NQ.orange,
      shade: NQ.amber,
      light: NQ.cream,
      pattern: (x, y) => (dots(x, y, 9) ? NQ.apricot : null),
      leaf: true,
    }),
  },

  // ── 中国
  'tottori-meisan-nijisseiki-nashi': {
    slot: 'chest',
    draw: fruitSuit({
      body: NQ.sprout,
      shade: NQ.lime,
      light: NQ.white,
      pattern: (x, y) => (dots(x, y, 8) ? NQ.sand : null),
      leaf: true,
    }),
  },
  'shimane-meisan-shinjiko-shijimi': bootsWear({
    boot: NQ.night,
    top: NQ.lavender,
    pattern: (_x, y) => (y % 2 === 0 ? NQ.indigo : null),
  }),
  'okayama-meisan-okayama-denim': legsWear({
    // 色おちした あかるい ジーンズに オレンジの ぬいめ
    pants: NQ.azure,
    shin: NQ.sky,
    pattern: (x, y) => (x % 5 === 0 ? NQ.orange : y === LEG_Y1 ? NQ.blue : null),
  }),
  'hiroshima-meisan-okonomiyaki': {
    slot: 'chest',
    draw: fruitSuit({
      body: NQ.amber,
      shade: NQ.brown,
      pattern: (x, y) => {
        if ((x + y) % 4 === 0 && y <= 24) return NQ.cream;
        if (y <= 24) return dots(x, y, 7) ? NQ.leaf : NQ.bark;
        return null;
      },
    }),
  },
  'yamaguchi-meisan-shimonoseki-fugu': { slot: 'head', draw: fugu },

  // ── 四国
  'tokushima-meisan-aizome': {
    slot: 'chest',
    // 阿波の 藍染め：こい あいに 白い なみ
    draw: robe({
      body: NQ.navy,
      collar: NQ.white,
      pattern: (x, y) => (y % 3 === 0 && (x + Math.floor(y / 3)) % 4 !== 0 ? NQ.sky : null),
    }),
  },
  'kagawa-meisan-sanuki-udon': { slot: 'head', draw: udonBowl },
  'ehime-meisan-imabari-towel': {
    slot: 'chest',
    // 今治タオルの マント：白に あおい すじ
    draw: robe({
      body: NQ.white,
      shade: NQ.cloud,
      pattern: (_x, y) => (y === 21 || y === 26 ? NQ.sky : null),
    }),
  },
  'kochi-meisan-kochi-yuzu': {
    slot: 'head',
    draw: domeHat({
      body: NQ.yellow,
      shade: NQ.ochre,
      light: NQ.cream,
      pattern: (x, y) => (dots(x, y, 9) ? NQ.gold : null),
      extra: stemLeaf,
    }),
  },

  // ── 九州・沖縄
  'fukuoka-meisan-koishiwarayaki': {
    slot: 'head',
    // 小石原焼：クリーム色に 茶色の とびかんな
    draw: bowlHat({
      body: NQ.beige,
      shade: NQ.sand,
      rim: NQ.brown,
      pattern: (x, y) => (y >= 6 && (x + y * 2) % 3 === 0 ? NQ.brown : null),
    }),
  },
  'saga-meisan-aritayaki': {
    slot: 'chest',
    // 有田焼の よろい：白に あいいろの 花
    draw: armorSuit({
      body: NQ.white,
      shade: NQ.cloud,
      trim: NQ.blue,
      pattern: (x, y) => (dots(x, y, 6) ? NQ.azure : null),
    }),
  },
  'nagasaki-meisan-castella': { slot: 'chest', draw: castella },
  'kumamoto-meisan-kumamoto-suika': {
    slot: 'head',
    draw: domeHat({
      body: NQ.leaf,
      shade: NQ.green,
      pattern: (x, y) => ((x + (y % 2)) % 4 === 0 ? NQ.forest : null),
      rim: NQ.red,
      rimShade: NQ.berry,
      extra: (g, cx) => {
        for (const d of [-6, -2, 2, 6]) put(g, Math.round(cx + d), 12, NQ.ink);
      },
    }),
  },
  'oita-meisan-oita-shiitake': {
    slot: 'head',
    // しいたけの かさ：ひろくて ひらたい。白い ひびと うらの ひだ
    draw: domeHat({
      body: NQ.brown,
      shade: NQ.bark,
      light: NQ.tan,
      rx: 11,
      rim: NQ.beige,
      rimShade: NQ.sand,
      pattern: (x, y) => (y >= 4 && (x * 5 + y * 3) % 11 === 0 ? NQ.beige : null),
    }),
  },
  'miyazaki-meisan-miyazaki-mango': {
    slot: 'chest',
    draw: fruitSuit({
      body: NQ.vermilion,
      shade: NQ.brick,
      light: NQ.cream,
      pattern: (_x, y) => (y >= 25 ? NQ.orange : null),
    }),
  },
  'kagoshima-meisan-sakurajima-daikon': bootsWear({
    boot: NQ.white,
    top: NQ.leaf,
    pattern: (x, y) => (y === LEG_Y1 && x % 2 ? NQ.cloud : null),
  }),
  'okinawa-meisan-bingata': {
    slot: 'chest',
    // 紅型：あざやかな きいろに 赤と あおの 花
    draw: robe({
      body: NQ.yellow,
      shade: NQ.gold,
      collar: NQ.red,
      obi: NQ.red,
      pattern: (x, y) => (dots(x, y, 7) ? NQ.red : (x * 2 + y * 3) % 7 === 3 ? NQ.azure : null),
    }),
  },
};
