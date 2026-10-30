import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TRANSPORT_LINKS } from '../../scripts/data/interPrefectureLinks';
import type { LandBorderLink } from '../../scripts/terrain/prefectureBorders';
import {
  areaReachableForTravel,
  areaUnlockedForTravel,
  interPrefectureAccess,
  interPrefectureUnlockRule,
  type InterPrefectureLinkRef,
  type LinkUnlockProgress,
} from '../../src/core/progression/interPrefecture';
import { midBossFlag } from '../../src/core/progression/route';
import { content } from './helpers';

const terrain = JSON.parse(
  readFileSync(new URL('../../scripts/data/terrain.json', import.meta.url), 'utf8'),
) as { interPrefectureBorders: LandBorderLink[] };

const links: InterPrefectureLinkRef[] = [...terrain.interPrefectureBorders, ...TRANSPORT_LINKS];
const empty = (): LinkUnlockProgress => ({
  areaSigns: [],
  eventsDone: [],
  islandsCleared: [],
});

describe('県境・実在交通の解放表', () => {
  it('高速移動先は前地方と地方内prefixを攻略した県だけ解放する', async () => {
    const { world } = await content();
    expect(areaUnlockedForTravel(world, 'aomori', empty())).toBe(true);
    expect(areaUnlockedForTravel(world, 'iwate', empty())).toBe(false);
    expect(areaUnlockedForTravel(world, 'iwate', { ...empty(), areaSigns: ['aomori'] })).toBe(true);
    expect(areaUnlockedForTravel(world, 'niigata', empty())).toBe(false);
    expect(
      areaUnlockedForTravel(world, 'niigata', {
        ...empty(),
        islandsCleared: ['tohoku', 'hokkaido', 'kanto'],
      }),
    ).toBe(true);
    expect(areaReachableForTravel(world, 'gifu', { ...empty(), areaSigns: ['gifu'] })).toBe(false);
    expect(
      areaReachableForTravel(world, 'gifu', {
        ...empty(),
        areaSigns: ['gifu'],
        islandsCleared: ['tohoku', 'hokkaido', 'kanto', 'hokuriku', 'koshinetsu'],
      }),
    ).toBe(true);
  });

  it('95リンクを物語37・章間10・近道47・特例1へ一意に分類する', async () => {
    const { world } = await content();
    const counts = { story: 0, chapter: 0, shortcut: 0, special: 0 };
    for (const link of links) counts[interPrefectureUnlockRule(world, link).kind] += 1;
    expect(counts).toEqual({ story: 37, chapter: 10, shortcut: 47, special: 1 });
  });

  it('物語順37リンクは前進時だけ地方内の先行県完了を要求し、後戻りは常に開く', async () => {
    const { world } = await content();
    const storyLinks = links.filter((link) => interPrefectureUnlockRule(world, link).kind === 'story');
    expect(storyLinks).toHaveLength(37);
    for (const link of storyLinks) {
      const rule = interPrefectureUnlockRule(world, link);
      expect(rule.kind).toBe('story');
      if (rule.kind !== 'story') continue;
      const island = world.islands.find((candidate) => candidate.areas.includes(rule.completedAreaId))!;
      const completedIndex = island.areas.indexOf(rule.completedAreaId);
      const requiredAreas = island.areas.slice(0, completedIndex + 1);
      const laterAreaId = link.areas.find((areaId) => areaId !== rule.completedAreaId)!;
      const forward = { ...link, areas: [rule.completedAreaId, laterAreaId] as const };
      const reverse = { ...link, areas: [laterAreaId, rule.completedAreaId] as const };
      expect(interPrefectureAccess(world, forward, empty(), false).open, `${link.id}: forward`).toBe(false);
      expect(
        interPrefectureAccess(
          world,
          forward,
          { ...empty(), eventsDone: requiredAreas.map(midBossFlag) },
          false,
        ).open,
        `${link.id}: midboss prefix`,
      ).toBe(true);
      expect(interPrefectureAccess(world, reverse, empty(), false).open, `${link.id}: reverse`).toBe(true);
    }
  });

  it('旧攻略順で後ろの県だけ完了していても、現行順の未攻略県を飛ばせない', async () => {
    const { world } = await content();
    const gifuMie = links.find((link) => link.id === 'land-gifu-mie')!;
    expect(
      interPrefectureAccess(world, gifuMie, { ...empty(), eventsDone: [midBossFlag('gifu')] }, false),
    ).toMatchObject({ open: false, missingAreas: ['shizuoka', 'aichi'] });

    const osakaNara = links.find((link) => link.id === 'land-osaka-nara')!;
    expect(
      interPrefectureAccess(world, osakaNara, { ...empty(), areaSigns: ['shiga', 'kyoto', 'osaka'] }, false),
    ).toMatchObject({ open: false, missingAreas: ['hyogo'] });
    expect(
      interPrefectureAccess(
        world,
        osakaNara,
        { ...empty(), areaSigns: ['shiga', 'kyoto', 'hyogo', 'osaka'] },
        false,
      ).open,
    ).toBe(true);

    const gifuAichi = links.find((link) => link.id === 'land-gifu-aichi')!;
    const legacyGifuOnly = { ...empty(), areaSigns: ['gifu'] };
    expect(
      interPrefectureAccess(world, { ...gifuAichi, areas: ['aichi', 'gifu'] }, legacyGifuOnly, false),
    ).toMatchObject({ open: false, missingAreas: ['shizuoka', 'aichi'] });
    expect(
      interPrefectureAccess(world, { ...gifuAichi, areas: ['gifu', 'aichi'] }, legacyGifuOnly, false),
    ).toMatchObject({ open: true, missingAreas: [] });
  });

  it('JIS順と攻略順が逆の7県境は攻略順の直前県を要求する', async () => {
    const { world } = await content();
    const expected = {
      'land-yamanashi-nagano': 'nagano',
      'land-gifu-aichi': 'aichi',
      'land-osaka-hyogo': 'hyogo',
      'land-hiroshima-yamaguchi': 'yamaguchi',
      'land-okayama-hiroshima': 'hiroshima',
      'land-tokushima-kagawa': 'kagawa',
      'land-ehime-kochi': 'kochi',
    } as const;
    for (const [id, completedAreaId] of Object.entries(expected))
      expect(
        interPrefectureUnlockRule(
          world,
          links.find((link) => link.id === id)!,
        ),
      ).toEqual({
        kind: 'story',
        completedAreaId,
      });
  });

  it('章間10リンクは指定地方まで順にクリアした場合だけ開く', async () => {
    const { world } = await content();
    const expected = {
      'aomori-hokkaido-seikan': 'tohoku',
      'hokkaido-ibaraki-ferry': 'hokkaido',
      'land-gunma-niigata': 'kanto',
      'land-niigata-nagano': 'hokuriku',
      'land-yamanashi-shizuoka': 'koshinetsu',
      'land-mie-shiga': 'tokai',
      'land-hyogo-tottori': 'kinki',
      'okayama-kagawa-bridge': 'chugoku',
      'hiroshima-ehime-bridge': 'shikoku',
      'yamaguchi-fukuoka-kanmon': 'shikoku',
    } as const;
    for (const [id, clearedIslandId] of Object.entries(expected)) {
      const link = links.find((candidate) => candidate.id === id)!;
      expect(interPrefectureUnlockRule(world, link)).toEqual({ kind: 'chapter', clearedIslandId });
      expect(
        interPrefectureAccess(world, link, { ...empty(), eventsDone: link.areas.map(midBossFlag) }, false)
          .open,
        id,
      ).toBe(false);
      const clearedIsland = world.islands.find((island) => island.id === clearedIslandId)!;
      const requiredIslands = world.islands
        .filter((island) => island.status === 'playable' && island.order <= clearedIsland.order)
        .map((island) => island.id);
      expect(
        interPrefectureAccess(world, link, { ...empty(), islandsCleared: requiredIslands }, false).open,
        id,
      ).toBe(true);
      if (requiredIslands.length > 1)
        expect(
          interPrefectureAccess(world, link, { ...empty(), islandsCleared: [clearedIslandId] }, false).open,
          `${id}: prefixなし`,
        ).toBe(false);
    }
  });

  it('近道47リンクは両県完了と両地方解放を要求する', async () => {
    const { world } = await content();
    const allIslands = world.islands.map((island) => island.id);
    const shortcuts = links.filter((link) => interPrefectureUnlockRule(world, link).kind === 'shortcut');
    expect(shortcuts).toHaveLength(47);
    for (const link of shortcuts) {
      const complete: LinkUnlockProgress = {
        areaSigns: [],
        eventsDone: link.areas.map(midBossFlag),
        islandsCleared: allIslands,
      };
      expect(interPrefectureAccess(world, link, complete, false).open, link.id).toBe(true);
      expect(
        interPrefectureAccess(world, link, { ...complete, eventsDone: [midBossFlag(link.areas[0])] }, false)
          .open,
        link.id,
      ).toBe(false);
      expect(
        interPrefectureAccess(world, link, { ...complete, eventsDone: [], areaSigns: [...link.areas] }, false)
          .open,
        `${link.id}: legacy`,
      ).toBe(true);
    }

    const awaji = links.find((link) => link.id === 'hyogo-tokushima-bridge')!;
    expect(
      interPrefectureAccess(
        world,
        awaji,
        { areaSigns: [...awaji.areas], eventsDone: [], islandsCleared: [] },
        false,
      ).open,
    ).toBe(false);
  });

  it('愛媛―大分だけは四国クリアと熊本完了の両方を要求する', async () => {
    const { world } = await content();
    const link = links.find((candidate) => candidate.id === 'ehime-oita-ferry')!;
    expect(interPrefectureAccess(world, link, empty(), false).open).toBe(false);
    expect(interPrefectureAccess(world, link, { ...empty(), islandsCleared: ['shikoku'] }, false).open).toBe(
      false,
    );
    expect(
      interPrefectureAccess(world, link, { ...empty(), eventsDone: [midBossFlag('kumamoto')] }, false).open,
    ).toBe(false);
    expect(
      interPrefectureAccess(
        world,
        link,
        {
          ...empty(),
          islandsCleared: world.islands
            .filter((island) => island.status === 'playable' && island.order <= 9)
            .map((island) => island.id),
          eventsDone: ['fukuoka', 'saga', 'nagasaki', 'kumamoto'].map(midBossFlag),
        },
        false,
      ).open,
    ).toBe(true);
    expect(
      interPrefectureAccess(
        world,
        link,
        {
          ...empty(),
          islandsCleared: world.islands
            .filter((island) => island.status === 'playable' && island.order <= 9)
            .map((island) => island.id),
          areaSigns: ['fukuoka', 'saga', 'nagasaki', 'kumamoto'],
        },
        false,
      ).open,
    ).toBe(true);
  });

  it('devは全95リンクを非永続の経路として開き、visit記録だけでは開かない', async () => {
    const { world } = await content();
    for (const link of links) {
      expect(interPrefectureAccess(world, link, empty(), true)).toMatchObject({
        open: true,
        via: 'dev',
      });
      const rule = interPrefectureUnlockRule(world, link);
      const normalLink =
        rule.kind === 'story'
          ? {
              ...link,
              areas: [
                rule.completedAreaId,
                link.areas.find((areaId) => areaId !== rule.completedAreaId)!,
              ] as const,
            }
          : link;
      expect(
        interPrefectureAccess(
          world,
          normalLink,
          {
            ...empty(),
            counters: { [`visit:${normalLink.areas[0]}-field`]: 1 },
          } as LinkUnlockProgress,
          false,
        ).open,
      ).toBe(false);
    }
  });

  it('入力を変更せず、不明県・章間ペア不一致・交通役割不一致を明示エラーにする', async () => {
    const { world } = await content();
    const progress = Object.freeze({
      areaSigns: Object.freeze(['aomori']),
      eventsDone: Object.freeze([midBossFlag('aomori')]),
      islandsCleared: Object.freeze(['tohoku']),
    });
    const before = JSON.stringify(progress);
    interPrefectureAccess(world, links[0]!, progress, false);
    expect(JSON.stringify(progress)).toBe(before);
    expect(() =>
      interPrefectureUnlockRule(world, { id: 'unknown', areas: ['no-such-area', 'aomori'] }),
    ).toThrow(/no-such-area/);
    expect(() =>
      interPrefectureUnlockRule(world, {
        id: 'aomori-hokkaido-seikan',
        areas: ['aomori', 'iwate'],
        unlockRole: 'chapter',
      }),
    ).toThrow(/aomori-hokkaido-seikan/);
    expect(() =>
      interPrefectureUnlockRule(world, {
        id: 'nagasaki-kumamoto-ferry',
        areas: ['nagasaki', 'kumamoto'],
        unlockRole: 'chapter',
      }),
    ).toThrow(/unlockRole/);
  });
});
