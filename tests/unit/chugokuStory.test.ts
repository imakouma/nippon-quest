import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lookup, type I18nDict } from '../../src/ui/i18n';

const ja = JSON.parse(
  readFileSync(new URL('../../content/i18n/ja.json', import.meta.url), 'utf8'),
) as I18nDict;
const AREAS = ['tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi'] as const;

describe('中国地方編の物語', () => {
  it.each(AREAS)('%s の町にシオリがいる', (area) => {
    expect(readFileSync(new URL(`../../maps/${area}-town.json`, import.meta.url), 'utf8')).toContain(
      `"name": "npc-${area}-haru"`,
    );
    expect(lookup(ja, `field.townStory.${area}.page`)).toEqual(expect.any(String));
  });

  it.each(AREAS)('%s の名所に証言調査の前後会話がある', (area) => {
    const data = JSON.parse(
      readFileSync(new URL(`../../content/prefectures/${area}.json`, import.meta.url), 'utf8'),
    ) as { events: Array<{ dialogue: unknown[]; afterDialogue?: unknown[] }> };
    for (const event of data.events) {
      expect(event.dialogue.length).toBeGreaterThanOrEqual(2);
      expect(event.afterDialogue?.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('第八章の導入・地方ボス・終幕がそろう', () => {
    for (const key of ['voices', 'haru', 'michiru', 'hero', 'title'])
      expect(lookup(ja, `field.chugokuChapterArrival.${key}`)).toEqual(expect.any(String));
    for (const key of ['ask', 'michiru', 'boss', 'hero'])
      expect(lookup(ja, `field.islandStory.chugoku.intro.${key}`)).toEqual(expect.any(String));
    for (const key of ['bossTruth', 'bossClue', 'michiru', 'hero', 'restored', 'haru', 'next', 'chapterEnd'])
      expect(lookup(ja, `field.islandStory.chugoku.epilogue.${key}`)).toEqual(expect.any(String));
  });
});
