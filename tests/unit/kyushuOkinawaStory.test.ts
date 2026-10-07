import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lookup, type I18nDict } from '../../src/ui/i18n';

const ja = JSON.parse(
  readFileSync(new URL('../../content/i18n/ja.json', import.meta.url), 'utf8'),
) as I18nDict;
const AREAS = [
  'fukuoka',
  'saga',
  'nagasaki',
  'kumamoto',
  'oita',
  'miyazaki',
  'kagoshima',
  'okinawa',
] as const;

describe('九州・沖縄編の物語', () => {
  it.each(AREAS)('%s の町にシオリがいる', (area) => {
    expect(readFileSync(new URL(`../../maps/${area}-town.json`, import.meta.url), 'utf8')).toContain(
      `"name": "npc-${area}-haru"`,
    );
    expect(lookup(ja, `field.townStory.${area}.page`)).toEqual(expect.any(String));
  });

  it.each(AREAS)('%s の名所にカギ調査の前後会話がある', (area) => {
    const data = JSON.parse(
      readFileSync(new URL(`../../content/prefectures/${area}.json`, import.meta.url), 'utf8'),
    ) as {
      events: Array<{ dialogue: unknown[]; afterDialogue?: unknown[] }>;
    };
    for (const event of data.events) {
      expect(event.dialogue.length).toBeGreaterThanOrEqual(2);
      expect(event.afterDialogue?.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('最終章の導入・魔王戦・日本編終幕がそろう', () => {
    for (const key of ['castle', 'haru', 'michiru', 'hero', 'title'])
      expect(lookup(ja, `field.kyushuOkinawaChapterArrival.${key}`)).toEqual(expect.any(String));
    for (const key of ['ask', 'michiru', 'boss', 'hero'])
      expect(lookup(ja, `field.islandStory.kyushuOkinawa.intro.${key}`)).toEqual(expect.any(String));
    for (const key of [
      'bossTruth',
      'bossMichiru',
      'michiru',
      'hero',
      'haru',
      'kanae',
      'vessel',
      'people',
      'michiruClue',
      'promise',
      'chapterEnd',
    ])
      expect(lookup(ja, `field.islandStory.kyushuOkinawa.epilogue.${key}`)).toEqual(expect.any(String));
  });

  it('島はプレイ可能で専用ボスを参照する', () => {
    const world = JSON.parse(
      readFileSync(new URL('../../content/world/japan.json', import.meta.url), 'utf8'),
    ) as { islands: Array<{ id: string; status: string; bossId?: string }> };
    const island = world.islands.find((candidate) => candidate.id === 'kyushu-okinawa');
    expect(island?.status).toBe('playable');
    expect(island?.bossId).toBe('kyushu-okinawa-islandboss-chishikigui');
  });
});
