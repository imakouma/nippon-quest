import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lookup, type I18nDict } from '../../src/ui/i18n';

const ja = JSON.parse(
  readFileSync(new URL('../../content/i18n/ja.json', import.meta.url), 'utf8'),
) as I18nDict;

const TOHOKU_AREAS = ['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima'] as const;

describe('東北編の節目会話', () => {
  it.each(TOHOKU_AREAS)('%s の町でハルの見聞帳会話を読める', (areaId) => {
    const area = JSON.parse(
      readFileSync(new URL(`../../content/prefectures/${areaId}.json`, import.meta.url), 'utf8'),
    ) as { town?: { npcs?: Array<{ id: string; name: string; role: string; dialogue: unknown[] }> } };
    const haru = area.town?.npcs?.find((npc) => npc.id === `npc-${areaId}-haru`);
    expect(haru).toMatchObject({ name: '見聞帳[けんぶんちょう]の ハル', role: 'talk' });
    expect(haru?.dialogue.length).toBeGreaterThan(0);
    const townMap = readFileSync(new URL(`../../maps/${areaId}-town.json`, import.meta.url), 'utf8');
    expect(townMap).toContain(`"name": "npc-${areaId}-haru"`);
  });

  it.each(TOHOKU_AREAS)('%s の県ボス後に、しるしを渡す固有台詞がある', (areaId) => {
    expect(lookup(ja, `field.areaBossAfter.${areaId}`)).toEqual(expect.any(String));
  });

  it.each(TOHOKU_AREAS)('%s の歴史人物戦後に、試練を締める固有台詞がある', (areaId) => {
    expect(lookup(ja, `field.lastBossAfter.${areaId}`)).toEqual(expect.any(String));
  });

  it('序章で主人公・相棒・ミチルの役割を提示する台詞がそろっている', () => {
    for (const key of [
      'field.prologueCompanion.default',
      'field.prologueFairyName',
      'field.prologueKnowledge',
      'field.prologueQuest',
      'field.prologueResolve',
    ]) {
      expect(lookup(ja, key), key).toEqual(expect.any(String));
    }
  });

  it.each(['aomori-nebutan', 'aomori-maguroad', 'aomori-ringoron'])(
    '%s に序章と東北終幕の性格別リアクションがある',
    (monsterId) => {
      expect(lookup(ja, `field.prologueCompanion.${monsterId}`)).toEqual(expect.any(String));
      expect(lookup(ja, `field.islandCompanion.${monsterId}`)).toEqual(expect.any(String));
    },
  );

  it('東北終幕に勝利・疑問・次章への導線がそろっている', () => {
    for (const key of [
      'field.islandBossWarning',
      'field.islandHeroDoubt',
      'field.islandFairyMemory',
      'field.islandPeopleReturn',
      'field.islandFairyNext',
    ]) {
      expect(lookup(ja, key), key).toEqual(expect.any(String));
    }
  });
});
