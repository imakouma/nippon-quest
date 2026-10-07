import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lookup, type I18nDict } from '../../src/ui/i18n';

const ja = JSON.parse(
  readFileSync(new URL('../../content/i18n/ja.json', import.meta.url), 'utf8'),
) as I18nDict;
const AREAS = ['tokushima', 'kagawa', 'ehime', 'kochi'] as const;

describe('四国編の物語', () => {
  it.each(AREAS)('%s の町にシオリがいる', (area) => {
    expect(readFileSync(new URL(`../../maps/${area}-town.json`, import.meta.url), 'utf8')).toContain(
      `"name": "npc-${area}-haru"`,
    );
    expect(lookup(ja, `field.townStory.${area}.page`)).toEqual(expect.any(String));
  });

  it.each(AREAS)('%s の名所に判断調査の前後会話がある', (area) => {
    const data = JSON.parse(
      readFileSync(new URL(`../../content/prefectures/${area}.json`, import.meta.url), 'utf8'),
    ) as { events: Array<{ dialogue: unknown[]; afterDialogue?: unknown[] }> };
    for (const event of data.events) {
      expect(event.dialogue.length).toBeGreaterThanOrEqual(2);
      expect(event.afterDialogue?.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('第九章の導入・地方ボス・終幕がそろう', () => {
    for (const key of ['scales', 'haru', 'michiru', 'hero', 'title'])
      expect(lookup(ja, `field.shikokuChapterArrival.${key}`)).toEqual(expect.any(String));
    for (const key of ['ask', 'michiru', 'boss', 'hero'])
      expect(lookup(ja, `field.islandStory.shikoku.intro.${key}`)).toEqual(expect.any(String));
    for (const key of ['bossTruth', 'bossClue', 'michiru', 'hero', 'restored', 'haru', 'next', 'chapterEnd'])
      expect(lookup(ja, `field.islandStory.shikoku.epilogue.${key}`)).toEqual(expect.any(String));
  });
});
