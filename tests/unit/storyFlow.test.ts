import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { mapArrivalStory, PROLOGUE_COUNTER } from '../../src/scenes/overworld/storyFlow';
import { IWATE_ARRIVAL_COUNTER } from '../../src/core/progression/storyCompanion';
import { setDictionary, type I18nDict } from '../../src/ui/i18n';

setDictionary(
  JSON.parse(readFileSync(new URL('../../content/i18n/ja.json', import.meta.url), 'utf8')) as I18nDict,
);

describe('物語のマップ導入', () => {
  it('青森で旅の導入を一度だけ記録する', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    const story = mapArrivalStory('aomori-field', game, 200, '青森県[あおもりけん]');
    expect(story?.state.progress.counters[PROLOGUE_COUNTER]).toBe(1);
    expect(story?.state.updatedAt).toBe(200);
    expect(story?.lines.length).toBeGreaterThan(1);
    expect(story?.lines.map((line) => line.text).join('')).toContain('青森県[あおもりけん]');
    expect(story?.lines.map((line) => line.text).join('')).not.toContain('{area}');
    expect(mapArrivalStory('aomori-field', story!.state, 300)).toBeNull();
  });

  it('岩手では相棒を渡さず、社へ案内する導入だけを一度表示する', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.progress.counters[PROLOGUE_COUNTER] = 1;
    const story = mapArrivalStory('iwate-town', game, 200);
    expect(story?.state.progress.counters[IWATE_ARRIVAL_COUNTER]).toBe(1);
    expect(story?.state.party.owned).toEqual([]);
    expect(story?.lines.length).toBe(3);
    expect(mapArrivalStory('iwate-town', story!.state, 300)).toBeNull();
  });
});
