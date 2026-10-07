import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import {
  HOKKAIDO_CHAPTER_COUNTER,
  HOKURIKU_CHAPTER_COUNTER,
  KOSHINETSU_CHAPTER_COUNTER,
  TOKAI_CHAPTER_COUNTER,
  KINKI_CHAPTER_COUNTER,
  CHUGOKU_CHAPTER_COUNTER,
  SHIKOKU_CHAPTER_COUNTER,
  KYUSHU_OKINAWA_CHAPTER_COUNTER,
  KANTO_CHAPTER_COUNTER,
  mapArrivalStory,
  PROLOGUE_COUNTER,
  townStoryCounter,
} from '../../src/scenes/overworld/storyFlow';
import { IWATE_ARRIVAL_COUNTER } from '../../src/core/progression/storyCompanion';
import { setDictionary, type I18nDict } from '../../src/ui/i18n';

describe('物語のマップ導入', () => {
  beforeAll(() => {
    setDictionary(
      JSON.parse(readFileSync(new URL('../../content/i18n/ja.json', import.meta.url), 'utf8')) as I18nDict,
    );
  });
  it('青森で旅の導入を一度だけ記録する', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    const story = mapArrivalStory('aomori-field', game, 200);
    expect(story?.state.progress.counters[PROLOGUE_COUNTER]).toBe(1);
    expect(story?.state.updatedAt).toBe(200);
    expect(story?.lines.length).toBeGreaterThan(1);
    expect(story?.presentation).toBe('opening');
    expect(mapArrivalStory('aomori-field', story!.state, 300)).toBeNull();
  });

  it('岩手では相棒を渡さず、社へ案内する導入だけを一度表示する', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.progress.counters[PROLOGUE_COUNTER] = 1;
    const story = mapArrivalStory('iwate-town', game, 200);
    expect(story?.state.progress.counters[IWATE_ARRIVAL_COUNTER]).toBe(1);
    expect(story?.state.party.owned).toEqual([]);
    expect(story?.lines.length).toBe(3);
    expect(story?.presentation).toBe('arrival');
    expect(mapArrivalStory('iwate-town', story!.state, 300)).toBeNull();
  });

  it('旧セーブに通常の仲間がいても、岩手の相棒イベントを飛ばさない', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.party.owned.push({ uid: 'legacy-pal', monsterId: 'aomori-ringoron', level: 1, xp: 0 });
    game.party.team.push('legacy-pal');
    game.party.activeUid = 'legacy-pal';
    const story = mapArrivalStory('iwate-town', game, 200);
    expect(story?.state.progress.counters[IWATE_ARRIVAL_COUNTER]).toBe(1);
    expect(story?.lines).toHaveLength(3);
  });

  it.each(['aomori', 'miyagi', 'akita', 'yamagata', 'fukushima'] as const)(
    '%s の町で見聞帳の章を一度だけ進める',
    (area) => {
      const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
      game.progress.counters[PROLOGUE_COUNTER] = 1;
      const story = mapArrivalStory(`${area}-town`, game, 200);
      expect(story?.state.progress.counters[townStoryCounter(area)]).toBe(1);
      expect(story?.lines).toHaveLength(5);
      expect(story?.lines.some((line) => line.speaker === 'コウ')).toBe(true);
      expect(mapArrivalStory(`${area}-town`, story!.state, 300)).toBeNull();
    },
  );

  it('東北クリア後の北海道上陸で第二章を一度だけ始める', () => {
    const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
    game.progress.islandsCleared.push('tohoku');
    const story = mapArrivalStory('hokkaido-field', game, 200);
    expect(story?.state.progress.counters[HOKKAIDO_CHAPTER_COUNTER]).toBe(1);
    expect(story?.lines).toHaveLength(5);
    expect(story?.lines.at(-1)?.text).toContain('第二章');
    expect(story?.presentation).toBe('chapter');
    expect(mapArrivalStory('hokkaido-field', story!.state, 300)).toBeNull();
  });

  it('東北クリア前には北海道編を開始しない', () => {
    const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
    expect(mapArrivalStory('hokkaido-field', game, 200)).toBeNull();
  });

  it('北海道クリア後の茨城上陸で第三章を一度だけ始める', () => {
    const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
    game.progress.islandsCleared.push('tohoku', 'hokkaido');
    const story = mapArrivalStory('ibaraki-field', game, 200);
    expect(story?.state.progress.counters[KANTO_CHAPTER_COUNTER]).toBe(1);
    expect(story?.lines.at(-1)?.text).toContain('第三章');
    expect(mapArrivalStory('ibaraki-field', story!.state, 300)).toBeNull();
  });

  it.each(['ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa'] as const)(
    '%s の町で関東編の調査を一度だけ進める',
    (area) => {
      const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
      const story = mapArrivalStory(`${area}-town`, game, 200);
      expect(story?.state.progress.counters[townStoryCounter(area)]).toBe(1);
      expect(story?.lines).toHaveLength(5);
    },
  );

  it('関東クリア後の新潟上陸で第四章を一度だけ始める', () => {
    const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
    game.progress.islandsCleared.push('tohoku', 'hokkaido', 'kanto');
    const story = mapArrivalStory('niigata-field', game, 200);
    expect(story?.state.progress.counters[HOKURIKU_CHAPTER_COUNTER]).toBe(1);
    expect(story?.lines.at(-1)?.text).toContain('第四章');
    expect(mapArrivalStory('niigata-field', story!.state, 300)).toBeNull();
  });

  it.each(['niigata', 'toyama', 'ishikawa', 'fukui'] as const)(
    '%s の町で北陸編の復元調査を一度だけ進める',
    (area) => {
      const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
      const story = mapArrivalStory(`${area}-town`, game, 200);
      expect(story?.state.progress.counters[townStoryCounter(area)]).toBe(1);
      expect(story?.lines).toHaveLength(5);
    },
  );

  it('北陸クリア後の山梨上陸で第五章を一度だけ始める', () => {
    const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
    game.progress.islandsCleared.push('tohoku', 'hokkaido', 'kanto', 'hokuriku');
    const story = mapArrivalStory('yamanashi-field', game, 200);
    expect(story?.state.progress.counters[KOSHINETSU_CHAPTER_COUNTER]).toBe(1);
    expect(story?.lines.at(-1)?.text).toContain('第五章');
    expect(mapArrivalStory('yamanashi-field', story!.state, 300)).toBeNull();
  });

  it.each(['yamanashi', 'nagano'] as const)('%s の町で甲信編の観測調査を一度だけ進める', (area) => {
    const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
    const story = mapArrivalStory(`${area}-town`, game, 200);
    expect(story?.state.progress.counters[townStoryCounter(area)]).toBe(1);
    expect(story?.lines).toHaveLength(5);
  });

  it('甲信クリア後の岐阜上陸で第六章を一度だけ始める', () => {
    const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
    game.progress.islandsCleared.push('tohoku', 'hokkaido', 'kanto', 'hokuriku', 'koshinetsu');
    const story = mapArrivalStory('gifu-field', game, 200);
    expect(story?.state.progress.counters[TOKAI_CHAPTER_COUNTER]).toBe(1);
    expect(story?.lines.at(-1)?.text).toContain('第六章');
    expect(mapArrivalStory('gifu-field', story!.state, 300)).toBeNull();
  });

  it.each(['gifu', 'shizuoka', 'aichi', 'mie'] as const)(
    '%s の町で東海編の因果調査を一度だけ進める',
    (area) => {
      const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
      const story = mapArrivalStory(`${area}-town`, game, 200);
      expect(story?.state.progress.counters[townStoryCounter(area)]).toBe(1);
      expect(story?.lines).toHaveLength(5);
    },
  );

  it('東海クリア後の滋賀上陸で第七章を一度だけ始める', () => {
    const game = createNewGame({ name: 'コウ', grade: 4 }, 100);
    game.progress.islandsCleared.push('tohoku', 'hokkaido', 'kanto', 'hokuriku', 'koshinetsu', 'tokai');
    const story = mapArrivalStory('shiga-field', game, 200);
    expect(story?.state.progress.counters[KINKI_CHAPTER_COUNTER]).toBe(1);
    expect(story?.lines.at(-1)?.text).toContain('第七章');
  });

  it.each(['shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama'] as const)(
    '%s の町で近畿編の相互参照調査を進める',
    (area) => {
      const game = createNewGame({ name: 'コウ', grade: 4 }, 100);
      expect(mapArrivalStory(`${area}-town`, game, 200)?.lines).toHaveLength(5);
    },
  );

  it('近畿クリア後の鳥取上陸で第八章を一度だけ始める', () => {
    const game = createNewGame({ name: 'コウ', grade: 4 }, 100);
    game.progress.islandsCleared.push(
      'tohoku',
      'hokkaido',
      'kanto',
      'hokuriku',
      'koshinetsu',
      'tokai',
      'kinki',
    );
    const story = mapArrivalStory('tottori-field', game, 200);
    expect(story?.state.progress.counters[CHUGOKU_CHAPTER_COUNTER]).toBe(1);
    expect(story?.lines.at(-1)?.text).toContain('第八章');
    expect(mapArrivalStory('tottori-field', story!.state, 300)).toBeNull();
  });

  it.each(['tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi'] as const)(
    '%s の町で中国編の証言調査を進める',
    (area) => {
      const game = createNewGame({ name: 'コウ', grade: 4 }, 100);
      expect(mapArrivalStory(`${area}-town`, game, 200)?.lines).toHaveLength(5);
    },
  );

  it('中国地方クリア後の徳島上陸で第九章を一度だけ始める', () => {
    const game = createNewGame({ name: 'コウ', grade: 5 }, 100);
    game.progress.islandsCleared.push(
      'tohoku',
      'hokkaido',
      'kanto',
      'hokuriku',
      'koshinetsu',
      'tokai',
      'kinki',
      'chugoku',
    );
    const story = mapArrivalStory('tokushima-field', game, 200);
    expect(story?.state.progress.counters[SHIKOKU_CHAPTER_COUNTER]).toBe(1);
    expect(story?.lines.at(-1)?.text).toContain('第九章');
    expect(mapArrivalStory('tokushima-field', story!.state, 300)).toBeNull();
  });

  it.each(['tokushima', 'kagawa', 'ehime', 'kochi'] as const)('%s の町で四国編の判断調査を進める', (area) => {
    const game = createNewGame({ name: 'コウ', grade: 5 }, 100);
    expect(mapArrivalStory(`${area}-town`, game, 200)?.lines).toHaveLength(5);
  });

  it('四国クリア後の福岡上陸で最終章を一度だけ始める', () => {
    const game = createNewGame({ name: 'コウ', grade: 5 }, 100);
    game.progress.islandsCleared.push(
      'tohoku',
      'hokkaido',
      'kanto',
      'hokuriku',
      'koshinetsu',
      'tokai',
      'kinki',
      'chugoku',
      'shikoku',
    );
    const story = mapArrivalStory('fukuoka-field', game, 200);
    expect(story?.state.progress.counters[KYUSHU_OKINAWA_CHAPTER_COUNTER]).toBe(1);
    expect(story?.lines.at(-1)?.text).toContain('最終章');
    expect(mapArrivalStory('fukuoka-field', story!.state, 300)).toBeNull();
  });

  it.each(['fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa'] as const)(
    '%s の町で最終章のカギ調査を進める',
    (area) => {
      const game = createNewGame({ name: 'コウ', grade: 5 }, 100);
      expect(mapArrivalStory(`${area}-town`, game, 200)?.lines).toHaveLength(5);
    },
  );
});
