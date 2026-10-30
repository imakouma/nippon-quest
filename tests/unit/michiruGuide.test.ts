import { describe, expect, it } from 'vitest';
import { midBossFlag } from '../../src/core/progression/route';
import { createNewGame } from '../../src/core/state/newGame';
import {
  currentMichiruGuideKey,
  currentMichiruGuideKeyFromLinks,
  michiruGuideKey,
  type MichiruGuideInput,
} from '../../src/scenes/overworld/michiruGuide';
import type { InterPrefectureLink } from '../../src/scenes/overworld/interPrefectureLink';
import { content } from './helpers';

const base: MichiruGuideInput = {
  prologueDone: true,
  kind: 'field',
  islandBossReady: false,
  areaBossDone: false,
  lastBossDone: false,
  nextLink: null,
};

const storyLink: InterPrefectureLink = {
  id: 'land-aomori-iwate',
  currentArea: 'aomori',
  targetArea: 'iwate',
  areas: ['aomori', 'iwate'],
  targetMap: 'iwate-field',
  targetSpawn: 'from_land-aomori-iwate',
  firstTargetSpawn: 'spawn',
  infrastructure: 'landBorder',
  travelMode: 'walk',
  unlockRole: 'story',
};

const chapterLink: InterPrefectureLink = {
  id: 'aomori-hokkaido-seikan',
  currentArea: 'aomori',
  targetArea: 'hokkaido',
  areas: ['aomori', 'hokkaido'],
  targetMap: 'hokkaido-field',
  targetSpawn: 'from_aomori-hokkaido-seikan',
  firstTargetSpawn: 'spawn',
  infrastructure: 'tunnel',
  travelMode: 'rail',
  unlockRole: 'chapter',
};

function link(
  id: string,
  currentArea: string,
  targetArea: string,
  infrastructure: InterPrefectureLink['infrastructure'] = 'landBorder',
  travelMode: InterPrefectureLink['travelMode'] = 'walk',
  unlockRole: InterPrefectureLink['unlockRole'] = 'story',
): InterPrefectureLink {
  return {
    id,
    currentArea,
    targetArea,
    areas: [currentArea, targetArea],
    targetMap: `${targetArea}-field`,
    targetSpawn: `from_${id}`,
    firstTargetSpawn: 'spawn',
    infrastructure,
    travelMode,
    unlockRole,
  };
}

describe('michiruGuideKey', () => {
  it('導入前はミチルとの最初の会話を優先する', () => {
    expect(michiruGuideKey({ ...base, prologueDone: false, islandBossReady: true })).toBe('wake');
  });

  it('県のしるしがそろったら地方ボスを案内する', () => {
    expect(michiruGuideKey({ ...base, islandBossReady: true })).toBe('islandBoss');
  });

  it('場所と進行に応じて次の一歩を切り替える', () => {
    expect(michiruGuideKey({ ...base, kind: 'town' })).toBe('town');
    expect(michiruGuideKey({ ...base, kind: 'dungeon' })).toBe('dungeon');
    expect(michiruGuideKey({ ...base, kind: 'secret' })).toBe('secret');
    expect(michiruGuideKey({ ...base, kind: 'secret', lastBossDone: true })).toBe('secretDone');
    expect(michiruGuideKey(base)).toBe('explore');
  });

  it.each([
    ['県境門', { infrastructure: 'landBorder', travelMode: 'walk' }, 'gate'],
    ['橋', { infrastructure: 'bridge', travelMode: 'bicycle' }, 'bridge'],
    ['徒歩トンネル', { infrastructure: 'tunnel', travelMode: 'walk' }, 'tunnel'],
    ['鉄道', { infrastructure: 'tunnel', travelMode: 'rail' }, 'rail'],
    ['橋を渡る鉄道', { infrastructure: 'bridge', travelMode: 'rail' }, 'rail'],
    ['フェリー', { infrastructure: 'seaRoute', travelMode: 'ferry' }, 'ferry'],
  ] as const)('%s の実リンク種別を案内する', (_label, nextLink, expected) => {
    expect(michiruGuideKey({ ...base, nextLink })).toBe(expected);
  });

  it('中ボス撃破だけでは入口を推測せず、実際のリンクがあるときだけ案内する', async () => {
    const c = await content();
    const state = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    state.progress.counters['story.prologue'] = 1;
    state.progress.eventsDone.push(midBossFlag('aomori'));

    expect(currentMichiruGuideKey([state, 'field', 'aomori', c.world])).toBe('explore');
    expect(
      currentMichiruGuideKey([
        state,
        'field',
        'aomori',
        c.world,
        { infrastructure: 'landBorder', travelMode: 'walk' },
      ]),
    ).toBe('gate');
  });

  it('地方ボス後は、通常の県間リンクより開いた章間リンクを優先して案内する', async () => {
    const c = await content();
    const state = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    state.progress.counters['story.prologue'] = 1;
    state.progress.eventsDone.push(midBossFlag('aomori'));
    state.progress.islandsCleared.push('tohoku');

    expect(
      currentMichiruGuideKeyFromLinks([state, 'field', 'aomori', c.world, [storyLink, chapterLink]]),
    ).toBe('rail');
  });

  it('章間リンクが閉じている間は、開いている通常の県間リンクを案内する', async () => {
    const c = await content();
    const state = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    state.progress.counters['story.prologue'] = 1;
    state.progress.eventsDone.push(midBossFlag('aomori'));

    expect(
      currentMichiruGuideKeyFromLinks([state, 'field', 'aomori', c.world, [chapterLink, storyLink]]),
    ).toBe('gate');
  });

  it('四国クリア後は完了済みの愛媛に戻らず、広島から山口へ案内する', async () => {
    const c = await content();
    const state = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    state.progress.counters['story.prologue'] = 1;
    state.progress.islandsCleared.push(
      ...c.world.islands
        .filter((island) => island.status === 'playable' && island.order <= 9)
        .map((island) => island.id),
    );
    state.progress.areaSigns.push(...c.world.islands.find((island) => island.id === 'chugoku')!.areas);

    expect(
      currentMichiruGuideKeyFromLinks([
        state,
        'field',
        'hiroshima',
        c.world,
        [
          link('hiroshima-ehime-bridge', 'hiroshima', 'ehime', 'bridge', 'bicycle', 'chapter'),
          link('land-hiroshima-yamaguchi', 'hiroshima', 'yamaguchi'),
        ],
      ]),
    ).toBe('gate');
  });

  it('九州クリア後は、広島から攻略済みの愛媛へ逆案内しない', async () => {
    const c = await content();
    const state = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    state.progress.counters['story.prologue'] = 1;
    state.progress.islandsCleared.push(...c.world.islands.map((island) => island.id));

    expect(
      currentMichiruGuideKeyFromLinks([
        state,
        'field',
        'hiroshima',
        c.world,
        [link('hiroshima-ehime-bridge', 'hiroshima', 'ehime', 'bridge', 'bicycle', 'chapter')],
      ]),
    ).toBe('explore');
  });

  it('四国から九州への実経路を愛媛→広島→山口→福岡の順に案内する', async () => {
    const c = await content();
    const state = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    state.progress.counters['story.prologue'] = 1;
    state.progress.islandsCleared.push(
      ...c.world.islands
        .filter((island) => island.status === 'playable' && island.order <= 9)
        .map((island) => island.id),
    );
    state.progress.areaSigns.push(...c.world.islands.find((island) => island.id === 'chugoku')!.areas);

    expect(
      currentMichiruGuideKeyFromLinks([
        state,
        'field',
        'ehime',
        c.world,
        [link('hiroshima-ehime-bridge', 'ehime', 'hiroshima', 'bridge', 'bicycle', 'chapter')],
      ]),
    ).toBe('bridge');
    expect(
      currentMichiruGuideKeyFromLinks([
        state,
        'field',
        'yamaguchi',
        c.world,
        [
          link('land-hiroshima-yamaguchi', 'yamaguchi', 'hiroshima'),
          link('yamaguchi-fukuoka-kanmon', 'yamaguchi', 'fukuoka', 'tunnel', 'walk', 'chapter'),
        ],
      ]),
    ).toBe('tunnel');
  });

  it('県内の攻略順で次に未完了の県だけを案内する', async () => {
    const c = await content();
    const state = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    state.progress.counters['story.prologue'] = 1;
    state.progress.areaSigns.push('tottori', 'shimane', 'yamaguchi', 'hiroshima');

    expect(
      currentMichiruGuideKeyFromLinks([
        state,
        'field',
        'hiroshima',
        c.world,
        [
          link('land-hiroshima-yamaguchi', 'hiroshima', 'yamaguchi', 'bridge', 'bicycle'),
          link('land-okayama-hiroshima', 'hiroshima', 'okayama'),
        ],
      ]),
    ).toBe('gate');
  });

  it('旧セーブの県のしるしだけでも、次の未攻略県へ案内する', async () => {
    const c = await content();
    const state = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    state.progress.counters['story.prologue'] = 1;
    state.progress.areaSigns.push('aomori');

    expect(currentMichiruGuideKeyFromLinks([state, 'field', 'aomori', c.world, [storyLink]])).toBe('gate');
  });

  it('次の未攻略県が隣接しないときも、攻略済み県を通る最初の門へ案内する', async () => {
    const c = await content();
    const state = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    state.progress.counters['story.prologue'] = 1;
    state.progress.areaSigns.push('aomori', 'iwate');

    expect(
      currentMichiruGuideKeyFromLinks([
        state,
        'field',
        'aomori',
        c.world,
        [link('land-aomori-iwate', 'aomori', 'iwate', 'tunnel')],
      ]),
    ).toBe('tunnel');
  });

  it('地方クリア後は最終県から章間出口へ向かう最初の戻り道を案内する', async () => {
    const c = await content();
    const state = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    state.progress.counters['story.prologue'] = 1;
    state.progress.islandsCleared.push('tohoku');
    state.progress.areaSigns.push(...c.world.islands.find((island) => island.id === 'tohoku')!.areas);

    expect(
      currentMichiruGuideKeyFromLinks([
        state,
        'field',
        'fukushima',
        c.world,
        [link('land-yamagata-fukushima', 'fukushima', 'yamagata', 'bridge', 'bicycle')],
      ]),
    ).toBe('bridge');
  });

  it('旧攻略順で岐阜だけ完了済みでも、愛知を経由して静岡へ戻る', async () => {
    const c = await content();
    const state = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    state.progress.counters['story.prologue'] = 1;
    state.progress.areaSigns.push('gifu');

    expect(
      currentMichiruGuideKeyFromLinks([
        state,
        'field',
        'gifu',
        c.world,
        [
          link('land-aichi-gifu', 'gifu', 'aichi', 'tunnel'),
          link('land-gifu-mie', 'gifu', 'mie', 'bridge', 'bicycle'),
        ],
      ]),
    ).toBe('tunnel');
  });
});
