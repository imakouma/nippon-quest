import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { areaBossFlag, midBossFlag } from '../../src/core/progression/route';
import { createNewGame } from '../../src/core/state/newGame';
import { haruDialogue } from '../../src/scenes/overworld/haruDialogue';
import { setDictionary, type I18nDict } from '../../src/ui/i18n';

describe('シオリの進行別会話', () => {
  beforeAll(() => {
    setDictionary(
      JSON.parse(readFileSync(new URL('../../content/i18n/ja.json', import.meta.url), 'utf8')) as I18nDict,
    );
  });

  it('未攻略・中ボス後・県ボス後で別の会話になる', () => {
    const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
    const arrival = haruDialogue('npc-miyagi-haru', game);
    game.progress.eventsDone.push(midBossFlag('miyagi'));
    const mid = haruDialogue('npc-miyagi-haru', game);
    game.progress.eventsDone.push(areaBossFlag('miyagi'));
    const complete = haruDialogue('npc-miyagi-haru', game);
    expect(arrival).toHaveLength(2);
    expect(mid).toHaveLength(2);
    expect(complete).toHaveLength(2);
    expect(new Set([arrival?.[0]?.text, mid?.[0]?.text, complete?.[0]?.text]).size).toBe(3);
  });

  it('シオリ以外のNPC会話には介入しない', () => {
    const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
    expect(haruDialogue('npc-miyagi-shop', game)).toBeNull();
  });

  it('関東のシオリは7県で共通テーマの進行別会話をする', () => {
    const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
    for (const area of ['ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa']) {
      const lines = haruDialogue(`npc-${area}-haru`, game);
      expect(lines).toHaveLength(2);
      expect(lines?.every((line) => line.speaker?.includes('シオリ'))).toBe(true);
    }
  });

  it('北陸のシオリは4県で復元テーマの進行別会話をする', () => {
    const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
    for (const area of ['niigata', 'toyama', 'ishikawa', 'fukui']) {
      const arrival = haruDialogue(`npc-${area}-haru`, game);
      game.progress.eventsDone.push(midBossFlag(area));
      const mid = haruDialogue(`npc-${area}-haru`, game);
      expect(arrival).toHaveLength(2);
      expect(mid).toHaveLength(2);
      expect(arrival?.[0]?.text).not.toBe(mid?.[0]?.text);
    }
  });

  it('甲信のシオリは2県で視点と縮尺の進行別会話をする', () => {
    const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
    for (const area of ['yamanashi', 'nagano']) {
      expect(haruDialogue(`npc-${area}-haru`, game)).toHaveLength(2);
    }
  });

  it('東海のシオリは4県で因果の流れの進行別会話をする', () => {
    const game = createNewGame({ name: 'コウ', grade: 3 }, 100);
    for (const area of ['gifu', 'shizuoka', 'aichi', 'mie']) {
      expect(haruDialogue(`npc-${area}-haru`, game)).toHaveLength(2);
    }
  });

  it('近畿のシオリは6府県で分類と関係の進行別会話をする', () => {
    const game = createNewGame({ name: 'コウ', grade: 4 }, 100);
    for (const area of ['shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama'])
      expect(haruDialogue(`npc-${area}-haru`, game)).toHaveLength(2);
  });

  it('中国地方のシオリは5県で証言照合の進行別会話をする', () => {
    const game = createNewGame({ name: 'コウ', grade: 4 }, 100);
    for (const area of ['tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi'])
      expect(haruDialogue(`npc-${area}-haru`, game)).toHaveLength(2);
  });

  it('四国のシオリは4県で判断の四軸を扱う', () => {
    const game = createNewGame({ name: 'コウ', grade: 5 }, 100);
    for (const area of ['tokushima', 'kagawa', 'ehime', 'kochi'])
      expect(haruDialogue(`npc-${area}-haru`, game)).toHaveLength(2);
  });

  it('九州・沖縄のシオリは8県で知識をかえすカギを扱う', () => {
    const game = createNewGame({ name: 'コウ', grade: 5 }, 100);
    for (const area of [
      'fukuoka',
      'saga',
      'nagasaki',
      'kumamoto',
      'oita',
      'miyazaki',
      'kagoshima',
      'okinawa',
    ])
      expect(haruDialogue(`npc-${area}-haru`, game)).toHaveLength(2);
  });
});
