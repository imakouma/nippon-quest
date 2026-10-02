import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bundledFetchReader,
  findBrokenReferences,
  loadContent,
  type FileReader,
} from '../../src/core/content/loader';

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
