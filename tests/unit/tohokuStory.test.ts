import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lookup, type I18nDict } from '../../src/ui/i18n';

const ja = JSON.parse(
  readFileSync(new URL('../../content/i18n/ja.json', import.meta.url), 'utf8'),
) as I18nDict;

const TOHOKU_AREAS = ['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima'] as const;

describe('東北編の節目会話', () => {
  it.each(TOHOKU_AREAS)('%s の町でシオリの見聞帳会話を読める', (areaId) => {
    const area = JSON.parse(
      readFileSync(new URL(`../../content/prefectures/${areaId}.json`, import.meta.url), 'utf8'),
    ) as { town?: { npcs?: Array<{ id: string; name: string; role: string; dialogue: unknown[] }> } };
    const haru = area.town?.npcs?.find((npc) => npc.id === `npc-${areaId}-haru`);
    expect(haru).toMatchObject({ name: '見聞帳[けんぶんちょう]の シオリ', role: 'talk' });
    expect(haru?.dialogue.length).toBeGreaterThan(0);
    const townMap = readFileSync(new URL(`../../maps/${areaId}-town.json`, import.meta.url), 'utf8');
    expect(townMap).toContain(`"name": "npc-${areaId}-haru"`);
  });

  it.each(TOHOKU_AREAS)('%s のシオリに攻略前・中盤・攻略後の会話がある', (areaId) => {
    for (const phase of ['arrival', 'mid', 'complete']) {
      for (const part of ['first', 'second']) {
        expect(lookup(ja, `field.haruProgress.${areaId}.${phase}.${part}`)).toEqual(expect.any(String));
      }
    }
  });

  it('青森の全名所イベントが、序章と見聞帳へつながる前後会話を持つ', () => {
    const aomori = JSON.parse(
      readFileSync(new URL('../../content/prefectures/aomori.json', import.meta.url), 'utf8'),
    ) as {
      events: Array<{
        dialogue: Array<{ speaker?: string }>;
        afterDialogue?: Array<{ speaker?: string }>;
      }>;
    };
    expect(aomori.events).toHaveLength(5);
    for (const event of aomori.events) {
      expect(event.dialogue.length).toBeGreaterThanOrEqual(2);
      expect(event.afterDialogue?.length).toBeGreaterThanOrEqual(2);
    }
    expect(
      aomori.events.some((event) => event.afterDialogue?.some((line) => line.speaker?.includes('シオリ'))),
    ).toBe(true);
  });

  it.each(['sannai', 'hirosaki', 'shirakami', 'towada', 'hachinohe', 'shimokita'])(
    '青森の地域ボス %s が本来の役目を思い出す',
    (regionId) => {
      for (const part of ['boss', 'michiru', 'journal']) {
        expect(lookup(ja, `field.regionMilestone.aomori.${regionId}.${part}`)).toEqual(expect.any(String));
      }
    },
  );

  it.each(TOHOKU_AREAS)('%s の県ボス後に、しるしを渡す固有台詞がある', (areaId) => {
    expect(lookup(ja, `field.areaBossAfter.${areaId}`)).toEqual(expect.any(String));
    for (const key of ['hero', 'michiru', 'journal']) {
      expect(lookup(ja, `field.chapterMilestone.sign.${areaId}.${key}`)).toEqual(expect.any(String));
    }
  });

  it.each(TOHOKU_AREAS)('%s の中ボス後に、章を進める固有台詞がある', (areaId) => {
    for (const key of ['hero', 'michiru', 'journal']) {
      expect(lookup(ja, `field.chapterMilestone.mid.${areaId}.${key}`)).toEqual(expect.any(String));
    }
  });

  it.each(TOHOKU_AREAS)('%s の歴史人物戦後に、試練を締める固有台詞がある', (areaId) => {
    expect(lookup(ja, `field.lastBossAfter.${areaId}`)).toEqual(expect.any(String));
    for (const part of ['hero', 'michiru', 'journal', 'memory']) {
      expect(lookup(ja, `field.historyLegacy.${areaId}.${part}`)).toEqual(expect.any(String));
    }
  });

  it('序章で主人公とミチルの役割を提示する台詞がそろっている', () => {
    for (const key of [
      'field.prologueFairyName',
      'field.prologueKnowledge',
      'field.prologueQuest',
      'field.prologueResolve',
    ]) {
      expect(lookup(ja, key), key).toEqual(expect.any(String));
    }
  });

  it.each(['iwate-kagurabi', 'iwate-izumiko', 'iwate-kodamaru'])(
    '%s に加入時と東北終幕の性格別リアクションがある',
    (monsterId) => {
      expect(lookup(ja, `field.companionVoice.${monsterId}`)).toEqual(expect.any(String));
      expect(lookup(ja, `field.companionPromise.${monsterId}`)).toEqual(expect.any(String));
      expect(lookup(ja, `field.islandCompanion.${monsterId}`)).toEqual(expect.any(String));
    },
  );

  it.each([
    ['aomori', ['meet', 'blank', 'journal', 'promise', 'page']],
    ['miyagi', ['reunion', 'route', 'delivery', 'resolve', 'page']],
    ['akita', ['snow', 'share', 'knowledge', 'shadow', 'page']],
    ['yamagata', ['words', 'memory', 'listen', 'record', 'page']],
    ['fukushima', ['pages', 'history', 'future', 'castle', 'page']],
  ] as const)('%s の初到着に見聞帳の連続イベントがある', (areaId, keys) => {
    for (const key of keys) {
      expect(lookup(ja, `field.townStory.${areaId}.${key}`)).toEqual(expect.any(String));
    }
  });

  it('東北終幕に勝利・疑問・次章への導線がそろっている', () => {
    for (const key of [
      'field.islandBossWarning',
      'field.islandHeroDoubt',
      'field.islandFairyMemory',
      'field.islandPeopleReturn',
      'field.islandHaruFinal',
      'field.islandFairyNext',
    ]) {
      expect(lookup(ja, key), key).toEqual(expect.any(String));
    }
  });
});
