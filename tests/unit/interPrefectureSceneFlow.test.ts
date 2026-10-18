import { readFileSync } from 'node:fs';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { midBossFlag } from '../../src/core/progression/route';
import type { InterPrefectureLink } from '../../src/scenes/overworld/interPrefectureLink';
import {
  interactWithInterPrefectureLink,
  interPrefectureIsOpen,
  storyInterPrefectureLink,
} from '../../src/scenes/overworld/interPrefectureSceneFlow';
import { presentInterPrefectureTravel } from '../../src/scenes/overworld/interPrefectureTravelFlow';
import type { DialogueLine } from '../../src/ui/dialogue';
import { setDictionary, type I18nDict } from '../../src/ui/i18n';
import { playSfx } from '../../src/ui/sfx';
import { content } from './helpers';

vi.mock('../../src/ui/sfx', () => ({ playSfx: vi.fn() }));
vi.mock('../../src/scenes/overworld/interPrefectureTravelFlow', () => ({
  presentInterPrefectureTravel: vi.fn(),
}));

beforeAll(() => {
  setDictionary(JSON.parse(readFileSync('content/i18n/ja.json', 'utf8')) as I18nDict);
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(presentInterPrefectureTravel).mockResolvedValue(true);
});

const landLink = (): InterPrefectureLink => ({
  id: 'land-aomori-iwate',
  currentArea: 'aomori',
  targetArea: 'iwate',
  areas: ['aomori', 'iwate'],
  targetMap: 'iwate-field',
  targetSpawn: 'from_land-aomori-iwate',
  firstTargetSpawn: 'spawn',
  infrastructure: 'landBorder',
  travelMode: 'walk',
});

const transportLink = (): InterPrefectureLink => ({
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
});

const emptyProgress = () => ({
  areaSigns: [] as string[],
  eventsDone: [] as string[],
  islandsCleared: [] as string[],
  counters: {} as Record<string, number>,
});

describe('県境リンクのSceneフロー', () => {
  it('同じマップの近道ではなく、今倒した県から次へ進む物語リンクを選ぶ', async () => {
    const { world } = await content();
    const shortcut: InterPrefectureLink = {
      ...landLink(),
      id: 'land-aomori-akita',
      targetArea: 'akita',
      areas: ['aomori', 'akita'],
      targetMap: 'akita-field',
      targetSpawn: 'from_land-aomori-akita',
    };
    const story = landLink();

    expect(storyInterPrefectureLink(world, [shortcut, story], 'aomori')).toBe(story);
    expect(storyInterPrefectureLink(world, [shortcut, story], 'iwate')).toBeNull();
    expect(interPrefectureIsOpen(world, story, emptyProgress(), false)).toBe(false);
    expect(
      interPrefectureIsOpen(world, story, { ...emptyProgress(), eventsDone: [midBossFlag('aomori')] }, false),
    ).toBe(true);
  });

  it('閉門中は行き先と不足条件を伝え、移動と交通演出を始めない', async () => {
    const { world, areas } = await content();
    const talk = vi.fn(async (_lines: DialogueLine[]) => undefined);

    const result = await interactWithInterPrefectureLink({
      world,
      link: landLink(),
      progress: emptyProgress(),
      devAll: false,
      areas,
      travelRoot: {} as HTMLElement,
      talk,
    });

    expect(result).toBeNull();
    expect(playSfx).toHaveBeenCalledExactlyOnceWith('miss');
    expect(presentInterPrefectureTravel).not.toHaveBeenCalled();
    expect(talk).toHaveBeenCalledTimes(1);
    const line = talk.mock.calls[0]![0][0]!;
    expect(line.speaker).toContain('門番');
    expect(line.text).toContain(areas.get('iwate')!.name);
    expect(line.text).toContain(areas.get('aomori')!.name);
  });

  it('開いた陸上県境は確認会話後に初回入口へ進む', async () => {
    const { world, areas } = await content();
    const talk = vi.fn(async (_lines: DialogueLine[]) => undefined);

    const result = await interactWithInterPrefectureLink({
      world,
      link: landLink(),
      progress: { ...emptyProgress(), eventsDone: [midBossFlag('aomori')] },
      devAll: false,
      areas,
      travelRoot: {} as HTMLElement,
      talk,
    });

    expect(result).toEqual({ targetMap: 'iwate-field', targetSpawn: 'spawn' });
    expect(playSfx).toHaveBeenCalledExactlyOnceWith('select');
    expect(presentInterPrefectureTravel).not.toHaveBeenCalled();
    expect(talk.mock.calls[0]![0][0]!.text).toContain(areas.get('iwate')!.name);
    expect(talk.mock.calls[1]![0][0]!.text).toContain('最初');
  });

  it('実在交通は取消したら移動せず、承認したときだけ到着先を返す', async () => {
    const { world, areas } = await content();
    const input = {
      world,
      link: transportLink(),
      progress: { ...emptyProgress(), islandsCleared: ['tohoku'] },
      devAll: false,
      areas,
      travelRoot: {} as HTMLElement,
      talk: vi.fn(async (_lines: DialogueLine[]) => undefined),
    };
    vi.mocked(presentInterPrefectureTravel).mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    expect(await interactWithInterPrefectureLink(input)).toBeNull();
    expect(await interactWithInterPrefectureLink(input)).toEqual({
      targetMap: 'hokkaido-field',
      targetSpawn: 'spawn',
    });
    expect(playSfx).toHaveBeenNthCalledWith(1, 'warp');
    expect(playSfx).toHaveBeenNthCalledWith(2, 'warp');
    expect(presentInterPrefectureTravel).toHaveBeenCalledTimes(2);
    expect(input.talk).toHaveBeenCalledTimes(1);
    expect(input.talk.mock.calls[0]![0][0]!.text).toContain('最初');
  });
});
