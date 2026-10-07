import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TOWN_THEMES } from '../../scripts/data/towns';

/**
 * scaffold:maps が作ったマップが「遊べる」ことを機械的に確かめる。
 *  - maps/ を唯一のマップソースとして検証する
 *  - 遷移先のマップとスポーン地点が存在する
 *  - スタート地点から、そのマップの物体すべてに歩いて（または同じマップの中の船で）行ける
 *  - content の events が使う物体が、マップにちゃんと置かれている
 *  - にほんちず（public/worldmap.json）が world の島・県と、県のフィールドの ★ 看板に合っている
 */
interface Obj {
  name: string;
  type: string;
  x: number;
  y: number;
  properties?: { name: string; value: unknown }[];
}

interface TiledMap {
  width: number;
  height: number;
  layers: { name: string; data?: number[]; objects?: Obj[] }[];
}

const MAPS = new URL('../../maps/', import.meta.url);
const PREFECTURES = new URL('../../content/prefectures/', import.meta.url);
const WORLD_MAP = new URL('../../public/worldmap.json', import.meta.url);
const WORLD = new URL('../../content/world/japan.json', import.meta.url);
const ITEMS = new URL('../../content/items/', import.meta.url);

const jsonFiles = (dir: URL) => readdirSync(dir).filter((f) => f.endsWith('.json'));
const maps = new Map<string, TiledMap>(
  jsonFiles(MAPS).map((f) => [
    f.slice(0, -5),
    JSON.parse(readFileSync(new URL(f, MAPS), 'utf8')) as TiledMap,
  ]),
);

const objectsOf = (m: TiledMap) => m.layers.find((l) => l.name === 'objects')?.objects ?? [];
const prop = (o: Obj, name: string) => o.properties?.find((p) => p.name === name)?.value;
const tileIndex = (m: TiledMap, o: Obj) => Math.floor(o.y / 16) * m.width + Math.floor(o.x / 16);

/** 'spawn' から4方向に歩いて届くマス。遷移のマスには乗れるが、その先へは歩けない（乗った瞬間に移動するため） */
function reachable(key: string, m: TiledMap): Set<number> {
  const col = m.layers.find((l) => l.name === 'collision')?.data ?? [];
  const objs = objectsOf(m);
  const transitions = new Map(objs.filter((o) => o.type === 'transition').map((o) => [tileIndex(m, o), o]));
  const spawnTile = (name: string) => {
    const s = objs.find((o) => o.type === 'spawn' && o.name === name);
    return s ? tileIndex(m, s) : undefined;
  };
  const start = spawnTile('spawn');
  if (start === undefined) return new Set();
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const i = queue.shift()!;
    const warp = transitions.get(i);
    if (warp) {
      // 同じマップの中の船は、着いた先から続けて歩ける
      const to = prop(warp, 'targetMap') === key ? spawnTile(String(prop(warp, 'targetSpawn'))) : undefined;
      if (to !== undefined && !seen.has(to)) {
        seen.add(to);
        queue.push(to);
      }
      continue;
    }
    const x = i % m.width;
    for (const j of [x > 0 ? i - 1 : -1, x < m.width - 1 ? i + 1 : -1, i - m.width, i + m.width]) {
      if (j < 0 || j >= m.width * m.height || seen.has(j) || col[j] === 3) continue;
      seen.add(j);
      queue.push(j);
    }
  }
  return seen;
}

describe('マップ', () => {
  it.each([...maps.keys()])('%s: 遷移先があり、すべての物体に歩いて行ける', (key) => {
    const m = maps.get(key)!;
    const objs = objectsOf(m);
    expect(objs.some((o) => o.type === 'spawn' && o.name === 'spawn')).toBe(true);
    for (const o of objs.filter((o) => o.type === 'transition')) {
      const target = maps.get(String(prop(o, 'targetMap')));
      expect(target, `${o.name} の行き先`).toBeDefined();
      const spawn = String(prop(o, 'targetSpawn'));
      expect(
        objectsOf(target!).some((t) => t.name === spawn),
        `${o.name} → ${String(prop(o, 'targetMap'))} の ${spawn}`,
      ).toBe(true);
    }
    const seen = reachable(key, m);
    for (const o of objs) {
      // 建物（名所エリアの むら）は 通れない。となりまで 行ければ よい
      if (o.type === 'structure') {
        const i = tileIndex(m, o);
        const near = [i - 1, i + 1, i - m.width, i + m.width * 3, i + m.width * 2];
        expect(
          near.some((j) => seen.has(j)) ||
            [...seen].some(
              (j) =>
                Math.abs((j % m.width) - (i % m.width)) <= 4 &&
                Math.abs(Math.floor(j / m.width) - Math.floor(i / m.width)) <= 4,
            ),
          `${key} の ${o.name} の そばに 行けない`,
        ).toBe(true);
        continue;
      }
      expect(seen.has(tileIndex(m, o)), `${key} の ${o.name} に行けない`).toBe(true);
    }
  });

  it('県のフィールドには中ボスの場所が 1 つ、名所の看板（フィールド・離島）は その県の motifs を指している', () => {
    for (const f of jsonFiles(PREFECTURES)) {
      const area = JSON.parse(readFileSync(new URL(f, PREFECTURES), 'utf8')) as {
        id: string;
        motifs?: { id: string }[];
      };
      const m = maps.get(`${area.id}-field`);
      expect(m, area.id).toBeDefined();
      expect(
        objectsOf(m!).filter((o) => o.type === 'midboss'),
        area.id,
      ).toHaveLength(1);
      for (const key of [`${area.id}-field`, `${area.id}-enclave`])
        for (const o of objectsOf(maps.get(key) ?? { width: 0, height: 0, layers: [] }).filter(
          (x) => x.type === 'landmark' || x.type === 'specialty',
        ))
          expect(
            area.motifs?.some((x) => x.id === prop(o, 'motifId')),
            `${key} の ${o.name}`,
          ).toBe(true);
    }
  });

  it('裏ステージ（secret）の ある 県は、フィールドに 入口が あり、<県>-secret の おくに ラスボスが いる', () => {
    for (const f of jsonFiles(PREFECTURES)) {
      const area = JSON.parse(readFileSync(new URL(f, PREFECTURES), 'utf8')) as {
        id: string;
        secret?: { boss: string };
      };
      if (!area.secret) continue;
      expect(
        objectsOf(maps.get(`${area.id}-field`)!).some((o) => o.name === 'to_secret'),
        `${area.id}-field の 入口`,
      ).toBe(true);
      const secret = maps.get(`${area.id}-secret`);
      expect(secret, `${area.id}-secret`).toBeDefined();
      expect(
        objectsOf(secret!)
          .filter((o) => o.type === 'lastboss')
          .map((o) => o.name),
        area.id,
      ).toEqual([`lastboss_${area.id}`]);
    }
  });

  it('content の events が使う物体がマップに置かれている', () => {
    for (const f of jsonFiles(PREFECTURES)) {
      const area = JSON.parse(readFileSync(new URL(f, PREFECTURES), 'utf8')) as {
        events?: { trigger?: { map: string; objectName: string } }[];
      };
      for (const { trigger } of area.events ?? []) {
        if (!trigger) continue;
        const m = maps.get(trigger.map);
        expect(m, trigger.map).toBeDefined();
        expect(
          objectsOf(m!).some((o) => o.name === trigger.objectName),
          `${trigger.map} の ${trigger.objectName}`,
        ).toBe(true);
      }
    }
  });
});

describe('町とダンジョン', () => {
  const layer = (m: TiledMap, name: string) => m.layers.find((l) => l.name === name)?.data ?? [];

  it('町には 建物（屋根・かべ・とびら）と かざりが あり、お店の人と 町の人が いる', () => {
    for (const [key, m] of maps) {
      if (!key.endsWith('-town')) continue;
      const bg = layer(m, 'background');
      // 屋根（都会の 町は ビルの 屋上 217）
      expect(
        [6, 16, 17, 18, 65, 66, 67, 68, 217].some((t) => bg.includes(t)),
        `${key} の屋根`,
      ).toBe(true);
      expect(bg.includes(21), `${key} のとびら`).toBe(true);
      expect(layer(m, 'decor').filter((t) => t > 0).length, `${key} のかざり`).toBeGreaterThan(50);
      expect(objectsOf(m).filter((o) => o.type === 'npc').length, `${key} の人`).toBeGreaterThanOrEqual(6);
    }
  });

  it('47都道府県すべての町に歩いて行ける床屋がいる', () => {
    const towns = [...maps].filter(([key]) => key.endsWith('-town'));
    expect(towns).toHaveLength(47);
    for (const [key, map] of towns) {
      const barber = objectsOf(map).find(
        (object) => object.type === 'npc' && prop(object, 'role') === 'barber',
      );
      expect(barber, `${key} の床屋`).toBeDefined();
      expect(reachable(key, map).has(tileIndex(map, barber!)), `${key} の床屋に行ける`).toBe(true);
    }
  });

  it('どの県にも 町の テーマ（scripts/data/towns.ts）が あり、理由（note）が 書いてある', () => {
    for (const f of jsonFiles(PREFECTURES)) {
      const id = f.slice(0, -5);
      expect(TOWN_THEMES[id]?.note, id).toBeTruthy();
    }
  });

  it('町の 見た目は 県ごとに ちがう（使っている タイルの くみあわせが ほぼ 全部 ちがう）', () => {
    const looks = new Set<string>();
    let towns = 0;
    for (const [key, m] of maps) {
      if (!key.endsWith('-town')) continue;
      towns++;
      const tiles = new Set([...layer(m, 'background'), ...layer(m, 'decor')].filter((t) => t > 12));
      looks.add([...tiles].sort((a, b) => a - b).join(','));
    }
    expect(looks.size).toBeGreaterThanOrEqual(towns - 3);
  });

  it('ダンジョンは かべの前の面が あり、たからばこが 2 つ以上（いちばん おくの へやに 1 つ）', () => {
    for (const [key, m] of maps) {
      if (!key.endsWith('-dungeon')) continue;
      expect(
        // かべの前の面の タイル（scripts/scaffold-maps.ts の THEMES の face。テーマを 足したら ここにも 足す）
        [41, 45, 49, 53, 224, 228, 232, 236, 240, 244, 248, 252].some((t) =>
          layer(m, 'background').includes(t),
        ),
        `${key} のかべ`,
      ).toBe(true);
      const chests = objectsOf(m).filter((o) => o.type === 'chest');
      expect(chests.length, key).toBeGreaterThanOrEqual(2);
      expect(
        chests.some((o) => o.name.endsWith('_treasure')),
        key,
      ).toBe(true);
    }
  });
});

interface WorldMapJson {
  regions: {
    id: string;
    width: number;
    height: number;
    rows: string[];
    areas: { id: string; capital: [number, number]; stamps: string[] }[];
  }[];
}

describe('にほんちず（public/worldmap.json）', () => {
  const wm = JSON.parse(readFileSync(WORLD_MAP, 'utf8')) as WorldMapJson;
  const world = JSON.parse(readFileSync(WORLD, 'utf8')) as { islands: { id: string; areas: string[] }[] };

  it('world の島と県がすべてあり、県庁所在地はその県のマスにある', () => {
    expect(wm.regions.map((r) => r.id).sort()).toEqual(world.islands.map((i) => i.id).sort());
    for (const island of world.islands) {
      const r = wm.regions.find((x) => x.id === island.id)!;
      expect(r.areas.map((a) => a.id).sort(), island.id).toEqual([...island.areas].sort());
      expect(r.rows, island.id).toHaveLength(r.height);
      const cells = new RegExp(`^[.a-${String.fromCharCode(96 + r.areas.length)}]{${r.width}}$`);
      for (const row of r.rows) expect(row, island.id).toMatch(cells);
      r.areas.forEach((a, k) =>
        expect(r.rows[a.capital[1]]?.[a.capital[0]], `${a.id} の県庁所在地`).toBe(
          String.fromCharCode(97 + k),
        ),
      );
    }
  });

  it('県の名所の数は、その県のフィールドと離島の ★ 看板（イベントと名所スタンプ）と同じ', () => {
    const stampsOf = new Map(wm.regions.flatMap((r) => r.areas).map((a) => [a.id, a.stamps]));
    for (const f of jsonFiles(PREFECTURES)) {
      const area = JSON.parse(readFileSync(new URL(f, PREFECTURES), 'utf8')) as {
        id: string;
        events?: { motifId: string; trigger?: { map: string; objectName: string } }[];
      };
      const signs = new Set<string>();
      for (const key of [`${area.id}-field`, `${area.id}-enclave`]) {
        for (const o of objectsOf(maps.get(key) ?? { width: 0, height: 0, layers: [] })) {
          if (o.type === 'landmark' || o.type === 'specialty') signs.add(String(prop(o, 'motifId')));
          const ev = area.events?.find((e) => e.trigger?.map === key && e.trigger.objectName === o.name);
          if (o.type === 'event' && ev) signs.add(ev.motifId);
        }
      }
      expect([...(stampsOf.get(area.id) ?? [])].sort(), area.id).toEqual([...signs].sort());
    }
  });

  it('特産品（たべもの・こうげいひん）は宝箱で、あけると もらえる アイテム（<県>-<motif の id>）がある', () => {
    const items = new Set(jsonFiles(ITEMS).map((f) => f.slice(0, -5)));
    for (const f of jsonFiles(PREFECTURES)) {
      const area = JSON.parse(readFileSync(new URL(f, PREFECTURES), 'utf8')) as {
        id: string;
        motifs: { id: string; kind: string }[];
      };
      const kindOf = new Map(area.motifs.map((m) => [m.id, m.kind]));
      for (const key of [`${area.id}-field`, `${area.id}-enclave`])
        for (const o of objectsOf(maps.get(key) ?? { width: 0, height: 0, layers: [] })) {
          const motifId = String(prop(o, 'motifId'));
          if (o.type === 'specialty') {
            expect(['food', 'craft'], `${key} の ${o.name}`).toContain(kindOf.get(motifId));
            expect(items.has(`${area.id}-${motifId}`), `${key} の ${o.name} のアイテム`).toBe(true);
          }
          if (o.type === 'landmark')
            expect(['food', 'craft'], `${key} の ${o.name}`).not.toContain(kindOf.get(motifId));
        }
    }
  });

  it('どの都道府県にも、名所・特産品の ★ 看板が 8 か所以上ある', () => {
    for (const a of wm.regions.flatMap((r) => r.areas))
      expect(a.stamps.length, a.id).toBeGreaterThanOrEqual(8);
  });
});

describe('宝箱の 中身', () => {
  it('どの マップの 宝箱も、content に ある どうぐが 入っている（なくした やくそう・名前だけの どうぐ は ない）', () => {
    const items = new Set(
      readdirSync(new URL('../../content/items/', import.meta.url)).map((f) => f.replace(/\.json$/, '')),
    );
    const dir = MAPS;
    const bad: string[] = [];
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const m = JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as { layers: { objects?: Obj[] }[] };
      for (const o of m.layers.flatMap((l) => l.objects ?? []))
        if (o.type === 'chest') {
          const id = o.properties?.find((p) => p.name === 'itemId')?.value;
          if (typeof id !== 'string' || !items.has(id)) bad.push(`${f}:${o.name}:${String(id)}`);
        }
    }
    expect(bad).toEqual([]);
  });
});
