import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bundledFetchReader,
  findBrokenReferences,
  loadContent,
  type FileReader,
} from '../../src/core/content/loader';
import { missionConditionSchema } from '../../src/core/content/schemas';

const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const read: FileReader = async (rel) => JSON.parse(readFileSync(CONTENT + rel, 'utf8'));

afterEach(() => vi.unstubAllGlobals());

describe('content loader', () => {
  it('47都道府県と10島を読み込める', async () => {
    const c = await loadContent(read);
    expect(c.areas.size).toBe(47);
    expect(c.world.islands).toHaveLength(10);
    expect(c.world.islands.reduce((n, i) => n + i.areas.length, 0)).toBe(47);
  });

  it('参照切れがない', async () => {
    const c = await loadContent(read);
    expect(findBrokenReferences(c)).toEqual([]);
  });

  it('県の複数所属・所属漏れと、島ID・順番の重複を検出する', async () => {
    const c = await loadContent(read);
    const world = structuredClone(c.world);
    const tohoku = world.islands.find((island) => island.id === 'tohoku')!;
    const hokkaido = world.islands.find((island) => island.id === 'hokkaido')!;
    hokkaido.areas.push('aomori');
    tohoku.areas = tohoku.areas.filter((areaId) => areaId !== 'iwate');
    tohoku.areas = tohoku.areas.filter((areaId) => areaId !== 'miyagi');
    hokkaido.areas.push('miyagi');
    world.islands.push({ ...structuredClone(hokkaido), areas: ['hokkaido'] });

    const errors = findBrokenReferences({ ...c, world });
    expect(errors).toContain('world: area "aomori" が複数の島にあります: tohoku, hokkaido');
    expect(errors).toContain('area "iwate": world のどの島にも含まれていません');
    expect(errors).toContain('area "miyagi": island "tohoku" の areas に含まれていません');
    expect(errors).toContain('world: island id "hokkaido" が重複しています');
    expect(errors).toContain(`world: island order ${hokkaido.order} が重複しています`);
  });

  it('ボス種別・所属と名所エリアの参照切れを検出する', async () => {
    const c = await loadContent(read);
    const monsters = new Map(c.monsters);
    const islandBoss = c.world.islands.find((island) => island.id === 'tohoku')!.bossId;
    monsters.set(islandBoss, { ...monsters.get(islandBoss)!, isBoss: false, area: 'aomori' });

    const areas = new Map(c.areas);
    const aomori = structuredClone(areas.get('aomori')!);
    monsters.set(aomori.boss!, { ...monsters.get(aomori.boss!)!, area: 'iwate' });
    aomori.midBoss = 'missing-midboss';
    aomori.regions.forEach((region) => (region.start = false));
    aomori.regions[0]!.motifs.push('missing-motif');
    aomori.regions[0]!.boss!.monsterId = 'missing-region-boss';
    aomori.regionGates.push({ between: ['missing-region', 'missing-region'], openedBy: 'missing-region' });
    aomori.encounters[0]!.region = 'missing-region';
    areas.set(aomori.id, aomori);

    const errors = findBrokenReferences({ ...c, areas, monsters });
    expect(errors).toContain(`world: island "tohoku" の bossId "${islandBoss}" は isBoss: true が必要です`);
    expect(errors).toContain(`world: island "tohoku" の bossId "${islandBoss}" の area が "aomori" です`);
    expect(errors).toContain(`area "aomori": boss "${aomori.boss}" の area が "iwate" です`);
    expect(errors).toContain('area "aomori": midBoss "missing-midboss" が存在しません');
    expect(errors).toContain('area "aomori": regions の start はちょうど1つ必要です');
    expect(errors).toContain('area "aomori": region "sannai" の motif "missing-motif" が存在しません');
    expect(errors).toContain('area "aomori": region "sannai" の boss "missing-region-boss" が存在しません');
    expect(errors).toContain('area "aomori": regionGate の openedBy "missing-region" が存在しません');
    expect(errors).toContain('area "aomori": encounter の region "missing-region" が存在しません');
  });

  it('青森は playable で、ボス・イベント・NPCが揃っている', async () => {
    const c = await loadContent(read);
    const aomori = c.areas.get('aomori')!;
    expect(aomori.status).toBe('playable');
    expect(aomori.boss).toBe('aomori-boss-tsugaru-no-nushi');
    expect(aomori.events.length).toBeGreaterThanOrEqual(4);
    expect(aomori.town?.npcs.length).toBeGreaterThanOrEqual(5);
  });

  it('47 都道府県 すべて playable で、中ボス・県ボス・裏ステージ・イベント・町の人（お店の人を ふくむ 2 人 以上）が そろっている', async () => {
    const c = await loadContent(read);
    for (const a of c.areas.values()) {
      expect(a.status, a.id).toBe('playable');
      expect(a.midBoss, a.id).toBeDefined();
      expect(a.boss, a.id).toBeDefined();
      expect(a.secret, a.id).toBeDefined();
      expect(a.events.length, a.id).toBeGreaterThanOrEqual(1);
      expect(a.town?.npcs.length ?? 0, a.id).toBeGreaterThanOrEqual(2);
      expect(
        a.town?.npcs.some((n) => n.role === 'shop'),
        a.id,
      ).toBe(true);
    }
  });

  it('イベント報酬は score 0 でも必ずある（GDD §7）', async () => {
    const c = await loadContent(read);
    for (const a of c.areas.values())
      for (const e of a.events) expect(e.rewardByScore.some((r) => r.min === 0)).toBe(true);
  });

  it('たのみごとの必要数は 1 以上だけを受け入れる', () => {
    expect(missionConditionSchema.safeParse('defeat:aomori-ringoron:3').success).toBe(true);
    expect(missionConditionSchema.safeParse('collect:aomori-ringo:1').success).toBe(true);
    expect(missionConditionSchema.safeParse('perfect:sansu:10').success).toBe(true);
    expect(missionConditionSchema.safeParse('defeat:aomori-ringoron:0').success).toBe(false);
    expect(missionConditionSchema.safeParse('collect:aomori-ringo:00').success).toBe(false);
    expect(missionConditionSchema.safeParse('perfect:sansu:0').success).toBe(false);
  });

  it('名所・特産品の名前と説明は、漢字にすべて ひらがなのルビがある（フィールドや地図では読みを出すため）', async () => {
    const c = await loadContent(read);
    const bare: string[] = [];
    for (const a of c.areas.values())
      for (const m of a.motifs)
        for (const s of [m.name, m.blurb]) {
          const rest = s.replace(/[一-鿿々〆ヶ]+\[[ぁ-ゖー]+\]/g, '');
          if (/[一-鿿々〆ヶ]|[[\]]/.test(rest)) bare.push(`${a.id}.${m.id}: ${s}`);
        }
    expect(bare).toEqual([]);
  });

  it('id 重複を検出する', async () => {
    const dupes: string[] = [];
    const fake: FileReader = async (rel) => {
      if (rel === 'manifest.json') {
        const m = (await read('manifest.json')) as { files: Record<string, string[]>; questions: string[] };
        return { ...m, files: { ...m.files, items: [...m.files.items!, m.files.items![0]!] } };
      }
      return read(rel);
    };
    await loadContent(fake, { onDuplicate: (id) => dupes.push(id) });
    expect(dupes.length).toBeGreaterThan(0);
  });

  it('壊れたスキーマはファイル名つきで落ちる', async () => {
    const fake: FileReader = async (rel) => (rel === 'balance/settings.json' ? { nope: true } : read(rel));
    await expect(loadContent(fake)).rejects.toThrow(/settings\.json/);
  });

  it('本番用 reader は bundle を一度だけ取得して、複数ファイルを読む', async () => {
    const fetchMock = vi.fn(async () =>
      Promise.resolve(
        new Response(JSON.stringify({ 'a.json': { id: 'a' }, 'b.json': { id: 'b' } }), { status: 200 }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const bundledRead = bundledFetchReader('/content');

    await expect(bundledRead('a.json')).resolves.toEqual({ id: 'a' });
    await expect(bundledRead('b.json')).resolves.toEqual({ id: 'b' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/content/content-bundle.json', { cache: 'no-cache' });
  });

  it('bundle がない古い配信環境では個別 JSON の取得へ戻る', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.endsWith('content-bundle.json')
        ? Promise.resolve(new Response(null, { status: 404 }))
        : Promise.resolve(new Response(JSON.stringify({ id: 'fallback' }), { status: 200 })),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(bundledFetchReader('/content')('a.json')).resolves.toEqual({ id: 'fallback' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('bundle の通信や解析に失敗しても個別 JSON の取得へ戻る', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('network error'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'fallback' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(bundledFetchReader('/content')('a.json')).resolves.toEqual({ id: 'fallback' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('bundle が壊れた JSON でも個別 JSON の取得へ戻る', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{broken', { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'fallback' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(bundledFetchReader('/content')('a.json')).resolves.toEqual({ id: 'fallback' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('bundle に目的ファイルが欠けていても個別 JSON の取得へ戻る', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ 'other.json': {} }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'fallback' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(bundledFetchReader('/content')('a.json')).resolves.toEqual({ id: 'fallback' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith('/content/a.json', { cache: 'no-cache' });
  });

  it('問題専用 bundle を指定できる', async () => {
    const fetchMock = vi.fn(async () =>
      Promise.resolve(new Response(JSON.stringify({ 'questions/a.json': [] }), { status: 200 })),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      bundledFetchReader('/content', 'questions-bundle.json')('questions/a.json'),
    ).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith('/content/questions-bundle.json', { cache: 'no-cache' });
  });
});
