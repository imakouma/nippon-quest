import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lookup, type I18nDict } from '../../src/ui/i18n';

const ja = JSON.parse(
  readFileSync(new URL('../../content/i18n/ja.json', import.meta.url), 'utf8'),
) as I18nDict;
const AREAS = ['gifu', 'shizuoka', 'aichi', 'mie'] as const;

describe('東海編の物語', () => {
  it.each(AREAS)('%s の町にシオリがいて、初到着の連続イベントがある', (areaId) => {
    const townMap = readFileSync(new URL(`../../maps/${areaId}-town.json`, import.meta.url), 'utf8');
    expect(townMap).toContain(`"name": "npc-${areaId}-haru"`);
    expect(lookup(ja, `field.townStory.${areaId}.page`)).toEqual(expect.any(String));
  });

  it.each(AREAS)('%s の名所イベントが因果調査の前後会話を持つ', (areaId) => {
    const area = JSON.parse(
      readFileSync(new URL(`../../content/prefectures/${areaId}.json`, import.meta.url), 'utf8'),
    ) as {
      events: Array<{ dialogue: unknown[]; afterDialogue?: unknown[] }>;
    };
    for (const event of area.events) {
      expect(event.dialogue.length).toBeGreaterThanOrEqual(2);
      expect(event.afterDialogue?.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('第六章の導入・地方ボス戦・終幕がそろっている', () => {
    for (const key of ['water', 'haru', 'michiru', 'hero', 'title'])
      expect(lookup(ja, `field.tokaiChapterArrival.${key}`), key).toEqual(expect.any(String));
    for (const key of ['ask', 'michiru', 'boss', 'hero'])
      expect(lookup(ja, `field.islandStory.tokai.intro.${key}`), key).toEqual(expect.any(String));
    for (const key of ['bossTruth', 'bossClue', 'michiru', 'hero', 'restored', 'haru', 'next', 'chapterEnd'])
      expect(lookup(ja, `field.islandStory.tokai.epilogue.${key}`), key).toEqual(expect.any(String));
  });
});
