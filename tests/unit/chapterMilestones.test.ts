import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import {
  areaBossStoryLines,
  islandBossIntroLines,
  islandEpilogueLines,
  lastBossStoryLines,
  midBossStoryLines,
  regionBossStoryLines,
  tohokuIslandEpilogueLines,
} from '../../src/scenes/overworld/chapterMilestones';
import { setDictionary, type I18nDict } from '../../src/ui/i18n';

describe('東北編の攻略節目', () => {
  beforeAll(() => {
    setDictionary(
      JSON.parse(readFileSync(new URL('../../content/i18n/ja.json', import.meta.url), 'utf8')) as I18nDict,
    );
  });
  const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
  const companion = { id: 'iwate-kagurabi', name: 'カグラビ' };

  it('青森の中ボス後は、相棒がいなくても主人公・ミチル・見聞帳で物語を進める', () => {
    const lines = midBossStoryLines('aomori', game);
    expect(lines).toHaveLength(3);
    expect(lines[0]?.speaker).toBe('コウ');
  });

  it('相棒がいる県では、選んだ相棒の反応を節目へ加える', () => {
    expect(midBossStoryLines('iwate', game, companion)).toHaveLength(4);
    expect(areaBossStoryLines('iwate', game, companion)).toHaveLength(4);
  });

  it('物語対象外の県には節目会話を差し込まない', () => {
    expect(midBossStoryLines('unknown', game, companion)).toEqual([]);
    expect(areaBossStoryLines('unknown', game, companion)).toEqual([]);
  });

  it('未知の地方IDでは別の章の導入・終幕へ誤ってフォールバックしない', () => {
    expect(islandBossIntroLines('unknown', 'なぞのボス', 'コウ')).toEqual([]);
    expect(islandEpilogueLines('unknown', { bossName: 'なぞのボス', playerName: 'コウ' })).toEqual([]);
  });

  it('青森の地域ボス後は、ぬし・ミチル・見聞帳で土地の記憶を回復する', () => {
    const lines = regionBossStoryLines('aomori', 'sannai', 'ドグウジン');
    expect(lines).toHaveLength(3);
    expect(lines[0]?.speaker).toBe('ドグウジン');
    expect(regionBossStoryLines('iwate', 'sannai', 'ドグウジン')).toEqual([]);
  });

  it('歴史人物の試練後は、主人公・ミチル・見聞帳で受け継いだ意味を残す', () => {
    expect(lastBossStoryLines('fukushima', 'コウ')).toHaveLength(4);
    expect(lastBossStoryLines('fukushima', 'コウ')[0]?.speaker).toBe('コウ');
    expect(lastBossStoryLines('unknown', 'コウ')).toEqual([]);
  });

  it('東北終幕でボスの伏線・シオリ・選んだ相棒・次章を回収する', () => {
    const lines = tohokuIslandEpilogueLines({
      bossName: 'ロクフユノオウ',
      playerName: 'コウ',
      companion,
    });
    expect(lines.some((line) => line.speaker === '見聞帳[けんぶんちょう]の シオリ')).toBe(true);
    expect(lines.some((line) => line.speaker === 'カグラビ')).toBe(true);
    expect(lines.at(-1)?.text).toContain('第一章');
  });

  it('北海道の各攻略段階にも固有の節目会話がある', () => {
    expect(midBossStoryLines('hokkaido', game, companion)).toHaveLength(4);
    expect(areaBossStoryLines('hokkaido', game, companion)).toHaveLength(4);
    expect(lastBossStoryLines('hokkaido', 'コウ')).toHaveLength(4);
  });

  it('北海道地方ボスは専用の導入と第二章終幕を使う', () => {
    const intro = islandBossIntroLines('hokkaido', 'シロガネオオワシ', 'コウ');
    expect(intro).toHaveLength(4);
    expect(intro[2]?.speaker).toBe('シロガネオオワシ');
    const ending = islandEpilogueLines('hokkaido', {
      bossName: 'シロガネオオワシ',
      playerName: 'コウ',
      companion,
    });
    expect(ending.some((line) => line.speaker === 'カグラビ')).toBe(true);
    expect(ending.at(-1)?.text).toContain('第二章');
  });

  it('関東7県は共通テーマの節目会話を持ち、地方ボス後に第三章を閉じる', () => {
    for (const area of ['ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa']) {
      expect(midBossStoryLines(area, game, companion)).toHaveLength(4);
      expect(areaBossStoryLines(area, game, companion)).toHaveLength(4);
      expect(lastBossStoryLines(area, 'コウ')).toHaveLength(4);
    }
    expect(islandBossIntroLines('kanto', 'ナナツカゲノミコト', 'コウ')).toHaveLength(4);
    expect(
      islandEpilogueLines('kanto', {
        bossName: 'ナナツカゲノミコト',
        playerName: 'コウ',
        companion,
      }).at(-1)?.text,
    ).toContain('第三章');
  });

  it('北陸4県は復元テーマの節目会話を持ち、地方ボス後に第四章を閉じる', () => {
    for (const area of ['niigata', 'toyama', 'ishikawa', 'fukui']) {
      expect(midBossStoryLines(area, game, companion)).toHaveLength(4);
      expect(areaBossStoryLines(area, game, companion)).toHaveLength(4);
      expect(lastBossStoryLines(area, 'コウ')).toHaveLength(4);
    }
    expect(islandBossIntroLines('hokuriku', 'カガミウツシノミコト', 'コウ')).toHaveLength(4);
    expect(
      islandEpilogueLines('hokuriku', {
        bossName: 'カガミウツシノミコト',
        playerName: 'コウ',
        companion,
      }).at(-1)?.text,
    ).toContain('第四章');
  });

  it('甲信2県は視点と縮尺の節目会話を持ち、地方ボス後に第五章を閉じる', () => {
    for (const area of ['yamanashi', 'nagano']) {
      expect(midBossStoryLines(area, game, companion)).toHaveLength(4);
      expect(areaBossStoryLines(area, game, companion)).toHaveLength(4);
      expect(lastBossStoryLines(area, 'コウ')).toHaveLength(4);
    }
    expect(islandBossIntroLines('koshinetsu', 'センリンウツロ', 'コウ')).toHaveLength(4);
    expect(
      islandEpilogueLines('koshinetsu', {
        bossName: 'センリンウツロ',
        playerName: 'コウ',
        companion,
      }).at(-1)?.text,
    ).toContain('第五章');
  });

  it('東海4県は因果の流れの節目会話を持ち、地方ボス後に第六章を閉じる', () => {
    for (const area of ['gifu', 'shizuoka', 'aichi', 'mie']) {
      expect(midBossStoryLines(area, game, companion)).toHaveLength(4);
      expect(areaBossStoryLines(area, game, companion)).toHaveLength(4);
      expect(lastBossStoryLines(area, 'コウ')).toHaveLength(4);
    }
    expect(islandBossIntroLines('tokai', 'ナガレタエノミコト', 'コウ')).toHaveLength(4);
    expect(
      islandEpilogueLines('tokai', {
        bossName: 'ナガレタエノミコト',
        playerName: 'コウ',
        companion,
      }).at(-1)?.text,
    ).toContain('第六章');
  });

  it('近畿6府県は分類と関係の節目会話を持ち、地方ボス後に第七章を閉じる', () => {
    for (const area of ['shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama']) {
      expect(midBossStoryLines(area, game, companion)).toHaveLength(4);
      expect(areaBossStoryLines(area, game, companion)).toHaveLength(4);
      expect(lastBossStoryLines(area, 'コウ')).toHaveLength(4);
    }
    expect(islandBossIntroLines('kinki', 'ロッカギノオリ', 'コウ')).toHaveLength(4);
    expect(
      islandEpilogueLines('kinki', { bossName: 'ロッカギノオリ', playerName: 'コウ', companion }).at(-1)
        ?.text,
    ).toContain('第七章');
  });

  it('中国5県は証言照合の節目会話を持ち、地方ボス後に第八章を閉じる', () => {
    for (const area of ['tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi']) {
      expect(midBossStoryLines(area, game, companion)).toHaveLength(4);
      expect(areaBossStoryLines(area, game, companion)).toHaveLength(4);
      expect(lastBossStoryLines(area, 'コウ')).toHaveLength(4);
    }
    expect(islandBossIntroLines('chugoku', 'イツツノカタリベ', 'コウ')).toHaveLength(4);
    expect(
      islandEpilogueLines('chugoku', { bossName: 'イツツノカタリベ', playerName: 'コウ', companion }).at(-1)
        ?.text,
    ).toContain('第八章');
  });

  it('四国4県は判断の四軸を持ち、地方ボス後に第九章を閉じる', () => {
    for (const area of ['tokushima', 'kagawa', 'ehime', 'kochi']) {
      expect(midBossStoryLines(area, game, companion)).toHaveLength(4);
      expect(areaBossStoryLines(area, game, companion)).toHaveLength(4);
      expect(lastBossStoryLines(area, 'コウ')).toHaveLength(4);
    }
    expect(islandBossIntroLines('shikoku', 'ヨツノテンビン', 'コウ')).toHaveLength(4);
    expect(
      islandEpilogueLines('shikoku', { bossName: 'ヨツノテンビン', playerName: 'コウ', companion }).at(-1)
        ?.text,
    ).toContain('第九章');
  });

  it('九州・沖縄8県はカギの節目を持ち、地方ボス後に日本編を閉じる', () => {
    for (const area of [
      'fukuoka',
      'saga',
      'nagasaki',
      'kumamoto',
      'oita',
      'miyazaki',
      'kagoshima',
      'okinawa',
    ]) {
      expect(midBossStoryLines(area, game, companion)).toHaveLength(4);
      expect(areaBossStoryLines(area, game, companion)).toHaveLength(4);
      expect(lastBossStoryLines(area, 'コウ')).toHaveLength(4);
    }
    expect(islandBossIntroLines('kyushu-okinawa', 'チシキグイノマオウ', 'コウ')).toHaveLength(4);
    const ending = islandEpilogueLines('kyushu-okinawa', {
      bossName: 'チシキグイノマオウ',
      playerName: 'コウ',
      companion,
    });
    expect(ending).toHaveLength(12);
    expect(ending.at(-1)?.text).toContain('世界編');
    expect(ending.some((line) => line.text.includes('カナエ'))).toBe(true);
  });
});
