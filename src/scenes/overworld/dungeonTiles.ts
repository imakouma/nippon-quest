/**
 * ダンジョンの 見た目を 入口の 実在の 場所に 合わせる タイル（221〜269）。どれを 使うかは
 * scripts/scaffold-maps.ts の THEMES・DUNGEON_THEMES・SECRET_THEMES。番号は その T と 対応。
 * 1 テーマ ＝ 床・床2・かべ（上から見た かたまり）・かべの前の面 の 4 まい。253 から あとは 置く もの（「すけ」＝ decor）。
 *   221〜224 鍾乳洞（limestone）  225〜228 鉱山の 坑道（mine）  229〜232 火口（volcano）  233〜236 渓谷（gorge）
 *   237〜240 お城の 中（castle）   241〜244 やしき（house）      245〜248 竹林・森（forest）  249〜252 海の 洞くつ（sea）
 */
import { NQ } from '../art/palette';
import type { Rect, TileApi } from './townTiles';

/** かべの前の面：ブロックの すじ と 光、上は天井の かげ、下は床との さかい（fieldArt の face と 同じ 形） */
const face = (r: Rect, base: string, line: string, light: string, edge: string) => {
  r(0, 0, 16, 16, base);
  r(0, 5, 16, 1, line);
  r(0, 11, 16, 1, line);
  r(6, 0, 1, 5, line);
  r(12, 6, 1, 5, line);
  r(3, 12, 1, 4, line);
  r(1, 2, 3, 1, light);
  r(8, 8, 2, 1, light);
  r(0, 0, 16, 1, edge);
  r(0, 15, 16, 1, edge);
};

/** 上から見た かべ（かたまり）：暗い地に 小さな つぶ */
const rock = (r: Rect, base: string, speck: string) => {
  r(0, 0, 16, 16, base);
  for (const [x, y] of [
    [4, 5],
    [11, 2],
    [9, 11],
    [2, 13],
    [13, 8],
  ] as const)
    r(x, y, 1, 1, speck);
};

/** たたみ（へりの 色を かえる） */
const tatami = (r: Rect, hem: string) => {
  r(0, 0, 16, 16, NQ.sprout);
  for (let y = 2; y < 15; y += 3) r(1, y, 14, 1, NQ.lime);
  r(0, 0, 16, 1, hem);
  r(0, 15, 16, 1, hem);
  r(0, 0, 1, 16, hem);
  r(15, 0, 1, 16, hem);
};

export function drawDungeonTiles({ tile }: TileApi): void {
  // ───── 221〜224 鍾乳洞：白っぽい 岩・つらら石・水たまり（秋芳洞・龍河洞・玉泉洞） ─────
  tile(221, (r) => {
    r(0, 0, 16, 16, NQ.beige);
    r(3, 4, 3, 1, NQ.cloud);
    r(10, 9, 3, 1, NQ.cloud);
    r(6, 12, 1, 1, NQ.tan);
    r(13, 3, 1, 1, NQ.tan);
  });
  tile(222, (r) => {
    r(0, 0, 16, 16, NQ.beige);
    r(4, 5, 8, 6, NQ.sky);
    r(5, 6, 6, 4, NQ.ice);
    r(7, 7, 2, 1, NQ.white);
    r(2, 13, 3, 1, NQ.cloud);
  });
  tile(223, (r) => rock(r, NQ.brown, NQ.beige));
  tile(224, (r) => {
    face(r, NQ.beige, NQ.tan, NQ.white, NQ.brown);
    // 天井から さがる つらら石
    for (const x of [2, 8, 13]) {
      r(x, 1, 2, 4, NQ.cloud);
      r(x, 5, 1, 2, NQ.white);
    }
  });

  // ───── 225〜228 鉱山の 坑道：木の 支柱と 板・トロッコの レール・鉱石（石見銀山・別子銅山・生野銀山） ─────
  tile(225, (r) => {
    r(0, 0, 16, 16, NQ.bark);
    r(2, 3, 4, 1, NQ.brown);
    r(9, 10, 4, 1, NQ.brown);
    r(12, 5, 1, 1, NQ.gray);
    r(4, 13, 1, 1, NQ.gray);
  });
  tile(226, (r) => {
    r(0, 0, 16, 16, NQ.bark);
    for (const x of [1, 7, 13]) r(x, 4, 2, 8, NQ.brown);
    r(0, 5, 16, 1, NQ.silver);
    r(0, 10, 16, 1, NQ.silver);
  });
  tile(227, (r) => rock(r, NQ.ink, NQ.amber));
  tile(228, (r) => {
    r(0, 0, 16, 16, NQ.brown);
    for (const y of [4, 9, 14]) r(0, y, 16, 1, NQ.bark);
    r(1, 0, 2, 16, NQ.tan);
    r(13, 0, 2, 16, NQ.tan);
    r(0, 0, 16, 2, NQ.tan);
    r(0, 1, 16, 1, NQ.brown);
    r(0, 15, 16, 1, NQ.ink);
    r(7, 6, 2, 2, NQ.amber);
  });

  // ───── 229〜232 火口：黒い 岩・赤い ひび・ゆげ（阿蘇・霧島・有珠山・恐山） ─────
  tile(229, (r) => {
    r(0, 0, 16, 16, NQ.night);
    r(3, 4, 6, 1, NQ.brick);
    r(5, 5, 1, 2, NQ.brick);
    r(9, 11, 5, 1, NQ.brick);
    r(2, 12, 1, 2, NQ.ink);
  });
  tile(230, (r) => {
    r(0, 0, 16, 16, NQ.night);
    r(4, 5, 8, 6, NQ.brick);
    r(5, 6, 6, 4, NQ.vermilion);
    r(7, 7, 2, 2, NQ.gold);
    r(1, 13, 4, 1, NQ.brick);
  });
  tile(231, (r) => rock(r, NQ.ink, NQ.brick));
  tile(232, (r) => {
    face(r, NQ.night, NQ.ink, NQ.slate, NQ.ink);
    r(2, 7, 4, 1, NQ.brick);
    r(3, 8, 1, 3, NQ.vermilion);
    r(11, 2, 1, 4, NQ.brick);
    r(12, 12, 3, 1, NQ.vermilion);
  });

  // ───── 233〜236 渓谷・滝：こけの 岩・水の 流れ・シダ（高千穂峡・三段峡・黒部峡谷） ─────
  tile(233, (r) => {
    r(0, 0, 16, 16, NQ.slate);
    r(3, 3, 3, 1, NQ.green);
    r(10, 10, 4, 1, NQ.forest);
    r(7, 13, 1, 1, NQ.gray);
    r(13, 5, 1, 1, NQ.silver);
  });
  tile(234, (r) => {
    r(0, 0, 16, 16, NQ.slate);
    r(3, 4, 10, 8, NQ.blue);
    r(4, 5, 8, 6, NQ.azure);
    r(6, 6, 3, 1, NQ.sky);
    r(9, 9, 2, 1, NQ.sky);
  });
  tile(235, (r) => rock(r, NQ.forest, NQ.lime));
  tile(236, (r) => {
    face(r, NQ.gray, NQ.slate, NQ.silver, NQ.night);
    r(0, 0, 16, 3, NQ.forest);
    r(0, 3, 16, 1, NQ.green);
    for (const x of [4, 12]) {
      r(x, 4, 1, 3, NQ.green);
      r(x - 1, 5, 3, 1, NQ.green);
    }
  });

  // ───── 237〜240 お城の 中：板の間・たたみ・白い かべ・はしら（熊本城・姫路城・彦根城） ─────
  tile(237, (r) => {
    r(0, 0, 16, 16, NQ.sand);
    for (const y of [5, 11]) r(0, y, 16, 1, NQ.tan);
    r(8, 0, 1, 5, NQ.tan);
    r(3, 6, 1, 5, NQ.tan);
    r(12, 12, 1, 4, NQ.tan);
  });
  tile(238, (r) => tatami(r, NQ.gold));
  tile(239, (r) => {
    r(0, 0, 16, 16, NQ.cloud);
    r(0, 7, 16, 2, NQ.bark);
    r(7, 0, 2, 16, NQ.bark);
    r(1, 1, 5, 5, NQ.paper);
    r(10, 10, 5, 5, NQ.paper);
  });
  tile(240, (r) => {
    r(0, 0, 16, 16, NQ.paper);
    r(0, 0, 16, 2, NQ.bark);
    r(0, 12, 16, 3, NQ.brown);
    r(0, 15, 16, 1, NQ.bark);
    r(2, 2, 2, 10, NQ.brown);
    r(12, 2, 2, 10, NQ.brown);
    // さま（矢を 射る まど）
    r(7, 4, 2, 3, NQ.ink);
  });

  // ───── 241〜244 やしき・学校：たたみ・板の間・木の かべ・しょうじ（松下村塾・旧居・やかた） ─────
  tile(241, (r) => tatami(r, NQ.night));
  tile(242, (r) => {
    r(0, 0, 16, 16, NQ.brown);
    for (const y of [4, 9, 14]) r(0, y, 16, 1, NQ.bark);
    r(2, 1, 3, 1, NQ.tan);
    r(10, 6, 3, 1, NQ.tan);
  });
  tile(243, (r) => rock(r, NQ.bark, NQ.brown));
  tile(244, (r) => {
    r(0, 0, 16, 16, NQ.paper);
    r(0, 0, 16, 2, NQ.bark);
    r(0, 14, 16, 2, NQ.brown);
    for (const x of [5, 10]) r(x, 2, 1, 12, NQ.tan);
    for (const y of [6, 10]) r(0, y, 16, 1, NQ.tan);
    r(0, 0, 1, 16, NQ.brown);
    r(15, 0, 1, 16, NQ.brown);
  });

  // ───── 245〜248 竹林・森：こけの 地面・木の 根・竹（嵯峨野の 竹林・屋島） ─────
  tile(245, (r) => {
    r(0, 0, 16, 16, NQ.tan);
    r(3, 4, 3, 1, NQ.green);
    r(10, 9, 3, 1, NQ.leaf);
    r(6, 12, 1, 1, NQ.brown);
    r(13, 3, 1, 1, NQ.brown);
  });
  tile(246, (r) => {
    r(0, 0, 16, 16, NQ.tan);
    r(2, 7, 12, 2, NQ.brown);
    r(3, 6, 4, 1, NQ.bark);
    r(10, 9, 4, 1, NQ.bark);
    r(5, 2, 4, 1, NQ.leaf);
  });
  tile(247, (r) => {
    r(0, 0, 16, 16, NQ.forest);
    for (const x of [1, 7, 12]) {
      r(x, 0, 3, 16, NQ.green);
      r(x, 0, 1, 16, NQ.leaf);
      r(x, 5, 3, 1, NQ.lime);
      r(x, 11, 3, 1, NQ.lime);
    }
  });
  tile(248, (r) => {
    r(0, 0, 16, 16, NQ.green);
    for (const x of [0, 6, 11]) {
      r(x, 0, 4, 16, NQ.leaf);
      r(x + 3, 0, 1, 16, NQ.green);
      r(x, 4, 4, 1, NQ.green);
      r(x, 10, 4, 1, NQ.green);
    }
    r(0, 0, 16, 1, NQ.forest);
    r(0, 15, 16, 1, NQ.forest);
  });

  // ───── 249〜252 海の 洞くつ：青い 岩・しぶき（青の洞門・七ツ釜・松島） ─────
  tile(249, (r) => {
    r(0, 0, 16, 16, NQ.teal);
    r(3, 4, 3, 1, NQ.aqua);
    r(10, 10, 3, 1, NQ.aqua);
    r(12, 4, 1, 1, NQ.mint);
    r(5, 13, 1, 1, NQ.mint);
  });
  tile(250, (r) => {
    r(0, 0, 16, 16, NQ.teal);
    r(4, 5, 8, 6, NQ.aqua);
    r(5, 6, 6, 4, NQ.mint);
    r(7, 7, 2, 1, NQ.white);
  });
  tile(251, (r) => rock(r, NQ.navy, NQ.teal));
  tile(252, (r) => {
    face(r, NQ.denim, NQ.navy, NQ.aqua, NQ.ink);
    r(1, 12, 4, 1, NQ.white);
    r(9, 13, 5, 1, NQ.white);
    r(12, 2, 3, 1, NQ.mint);
  });

  // ───── 253〜269 置く もの（すけ。地面の 上に 重ねる） ─────
  // 253 つらら石と 石筍（鍾乳洞）
  tile(253, (r) => {
    r(5, 0, 5, 5, NQ.cloud);
    r(6, 5, 3, 3, NQ.white);
    r(7, 8, 1, 2, NQ.cloud);
    r(5, 12, 6, 4, NQ.beige);
    r(6, 10, 4, 2, NQ.beige);
    r(6, 12, 2, 3, NQ.cloud);
  });
  // 254 坑木（木の 支柱。鉱山）
  tile(254, (r) => {
    r(1, 1, 14, 2, NQ.brown);
    r(1, 0, 14, 1, NQ.tan);
    r(2, 3, 3, 13, NQ.brown);
    r(2, 3, 1, 13, NQ.tan);
    r(11, 3, 3, 13, NQ.brown);
    r(11, 3, 1, 13, NQ.tan);
  });
  // 255 トロッコ（鉱山）
  tile(255, (r) => {
    r(2, 5, 12, 7, NQ.slate);
    r(2, 5, 12, 1, NQ.silver);
    r(3, 6, 10, 3, NQ.ink);
    r(4, 6, 3, 2, NQ.amber);
    r(8, 7, 3, 2, NQ.gold);
    r(3, 12, 3, 3, NQ.night);
    r(10, 12, 3, 3, NQ.night);
    r(0, 14, 16, 1, NQ.brown);
  });
  // 256 鉱石の 山（鉱山の さいだん）
  tile(256, (r) => {
    r(2, 8, 12, 7, NQ.slate);
    r(4, 5, 8, 4, NQ.gray);
    r(6, 3, 4, 3, NQ.silver);
    r(5, 9, 3, 3, NQ.gold);
    r(9, 10, 3, 3, NQ.amber);
    r(7, 6, 2, 2, NQ.cream);
    r(1, 14, 14, 1, NQ.night);
  });
  // 257 溶岩だまり（火口の さいだん）
  tile(257, (r) => {
    r(1, 4, 14, 11, NQ.ink);
    r(2, 5, 12, 9, NQ.brick);
    r(3, 6, 10, 7, NQ.vermilion);
    r(5, 8, 6, 3, NQ.gold);
    r(7, 9, 2, 1, NQ.cream);
    r(2, 2, 2, 2, NQ.slate);
    r(12, 1, 2, 2, NQ.slate);
  });
  // 258 ゆげの 岩（火口）
  tile(258, (r) => {
    r(3, 10, 10, 5, NQ.ink);
    r(4, 9, 8, 2, NQ.night);
    r(5, 11, 3, 2, NQ.brick);
    r(5, 1, 3, 3, NQ.cloud);
    r(8, 3, 3, 3, NQ.silver);
    r(6, 5, 3, 3, NQ.cloud);
  });
  // 259 こけ岩（渓谷）
  tile(259, (r) => {
    r(3, 5, 10, 9, NQ.gray);
    r(2, 7, 12, 6, NQ.gray);
    r(3, 5, 8, 3, NQ.green);
    r(4, 4, 5, 1, NQ.leaf);
    r(9, 10, 4, 3, NQ.slate);
    r(3, 13, 10, 1, NQ.slate);
  });
  // 260 シダ（渓谷）
  tile(260, (r) => {
    r(7, 8, 2, 7, NQ.forest);
    for (const [x, y, w] of [
      [2, 6, 5],
      [9, 6, 5],
      [3, 9, 4],
      [9, 9, 4],
      [4, 12, 3],
      [9, 12, 3],
    ] as const) {
      r(x, y, w, 1, NQ.green);
      r(x, y + 1, w, 1, NQ.leaf);
    }
    r(6, 3, 4, 4, NQ.lime);
  });
  // 261 金の びょうぶ（お城）
  tile(261, (r) => {
    r(1, 2, 14, 12, NQ.gold);
    r(1, 2, 14, 1, NQ.cream);
    r(1, 13, 14, 1, NQ.ochre);
    r(8, 2, 1, 12, NQ.ochre);
    r(3, 5, 3, 5, NQ.forest);
    r(10, 6, 3, 4, NQ.brick);
    r(4, 4, 1, 2, NQ.green);
    r(0, 14, 16, 2, NQ.bark);
  });
  // 262 火ばち（お城・やしき）
  tile(262, (r) => {
    r(3, 7, 10, 7, NQ.brown);
    r(3, 7, 10, 1, NQ.tan);
    r(4, 8, 8, 3, NQ.bark);
    r(6, 8, 4, 2, NQ.brick);
    r(7, 8, 2, 1, NQ.orange);
    r(2, 14, 12, 1, NQ.bark);
  });
  // 263 上段の間（お城・やしきの さいだん）
  tile(263, (r) => {
    r(0, 1, 16, 8, NQ.gold);
    r(0, 1, 16, 1, NQ.cream);
    r(0, 8, 16, 1, NQ.ochre);
    r(5, 3, 3, 4, NQ.brick);
    r(9, 4, 3, 3, NQ.forest);
    r(1, 9, 14, 6, NQ.sprout);
    r(1, 9, 14, 1, NQ.night);
    r(1, 14, 14, 1, NQ.night);
    r(5, 10, 6, 4, NQ.red);
    r(5, 10, 6, 1, NQ.blush);
  });
  // 264 ついたて（しょうじの ついたて。やしき）
  tile(264, (r) => {
    r(2, 2, 12, 11, NQ.paper);
    r(2, 2, 12, 1, NQ.bark);
    r(2, 12, 12, 1, NQ.bark);
    r(2, 2, 1, 11, NQ.brown);
    r(13, 2, 1, 11, NQ.brown);
    r(8, 3, 1, 9, NQ.tan);
    r(3, 7, 10, 1, NQ.tan);
    r(3, 13, 2, 2, NQ.bark);
    r(11, 13, 2, 2, NQ.bark);
  });
  // 265 あんどん（やしきの あかり）
  tile(265, (r) => {
    r(4, 3, 8, 9, NQ.paper);
    r(4, 3, 8, 1, NQ.bark);
    r(4, 11, 8, 1, NQ.bark);
    r(4, 3, 1, 9, NQ.brown);
    r(11, 3, 1, 9, NQ.brown);
    r(6, 6, 4, 4, NQ.cream);
    r(7, 7, 2, 2, NQ.gold);
    r(5, 12, 6, 2, NQ.brown);
    r(4, 14, 8, 1, NQ.bark);
  });
  // 266 竹（竹林）
  tile(266, (r) => {
    for (const [x, w] of [
      [3, 3],
      [9, 3],
    ] as const) {
      r(x, 0, w, 16, NQ.green);
      r(x, 0, 1, 16, NQ.lime);
      for (const y of [3, 9, 14]) r(x, y, w, 1, NQ.forest);
    }
    r(1, 2, 3, 1, NQ.leaf);
    r(12, 5, 3, 1, NQ.leaf);
    r(1, 11, 2, 1, NQ.leaf);
  });
  // 267 木の 根（森）
  tile(267, (r) => {
    r(6, 0, 4, 16, NQ.bark);
    r(6, 0, 1, 16, NQ.brown);
    r(2, 6, 5, 3, NQ.bark);
    r(1, 8, 3, 2, NQ.brown);
    r(9, 9, 5, 3, NQ.bark);
    r(12, 11, 3, 2, NQ.brown);
    r(3, 3, 3, 2, NQ.green);
    r(10, 4, 3, 2, NQ.green);
  });
  // 268 しぶきの 岩（海の 洞くつ）
  tile(268, (r) => {
    r(3, 7, 10, 8, NQ.navy);
    r(2, 9, 12, 5, NQ.denim);
    r(4, 8, 4, 2, NQ.teal);
    r(2, 14, 12, 1, NQ.ink);
    r(4, 3, 2, 4, NQ.aqua);
    r(9, 2, 2, 5, NQ.mint);
    r(6, 1, 2, 2, NQ.white);
  });
  // 269 海そうと 貝（海の 洞くつ）
  tile(269, (r) => {
    r(3, 4, 2, 11, NQ.forest);
    r(4, 2, 2, 5, NQ.green);
    r(9, 6, 2, 9, NQ.forest);
    r(10, 4, 2, 4, NQ.green);
    r(11, 11, 4, 4, NQ.cloud);
    r(12, 10, 2, 2, NQ.paper);
    r(1, 14, 14, 1, NQ.navy);
  });
}
