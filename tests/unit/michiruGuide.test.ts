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
});
