import { describe, expect, it } from 'vitest';
import {
  chooseStoryCompanion,
  hasStoryCompanion,
  STORY_COMPANION_EVENT,
  STORY_COMPANION_IDS,
  storyCompanionId,
} from '../../src/core/progression/storyCompanion';
import { createNewGame } from '../../src/core/state/newGame';
import { content } from './helpers';

describe('物語の相棒選択', () => {
  it('新規ゲームは主人公ひとりで始まる', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    expect(game.party).toMatchObject({ owned: [], activeUid: null, team: [], reserve: [] });
    expect(game.party.bagPlacements).toEqual({ hero: { x: 1, y: 1, rotated: false } });
  });

  it.each(STORY_COMPANION_IDS)('%s を選ぶと最初の相棒として加入する', (monsterId) => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    const chosen = chooseStoryCompanion(game, monsterId, 200);
    expect(chosen.party.owned).toEqual([{ uid: 'story-companion', monsterId, level: 1, xp: 0 }]);
    expect(chosen.party.activeUid).toBe('story-companion');
    expect(chosen.party.team).toEqual(['story-companion']);
    expect(chosen.party.bagPlacements['mon:story-companion']).toMatchObject({ x: 1, y: 0 });
    expect(chosen.progress.eventsDone).toContain(STORY_COMPANION_EVENT);
    expect(chosen.dex.monsters).toContain(monsterId);
    expect(game.party.owned).toEqual([]);
  });

  it('選択済みデータや既存の相棒がいるデータを上書きしない', () => {
    const first = chooseStoryCompanion(createNewGame({ name: 'ハル', grade: 1 }), 'iwate-kagurabi');
    expect(chooseStoryCompanion(first, 'iwate-izumiko')).toBe(first);
  });

  it('旧セーブに通常の仲間がいても、限定相棒を選べる', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.party.owned.push({ uid: 'legacy-pal', monsterId: 'aomori-ringoron', level: 2, xp: 0 });
    game.party.team.push('legacy-pal');
    game.party.activeUid = 'legacy-pal';
    game.party.bagPlacements['mon:legacy-pal'] = { x: 1, y: 0, rotated: false };

    expect(hasStoryCompanion(game)).toBe(false);
    const chosen = chooseStoryCompanion(game, 'iwate-izumiko', 200);
    expect(storyCompanionId(chosen)).toBe('iwate-izumiko');
    expect(chosen.party.activeUid).toBe('story-companion');
    expect(chosen.party.owned.map((monster) => monster.monsterId)).toEqual([
      'aomori-ringoron',
      'iwate-izumiko',
    ]);
    expect(chosen.progress.eventsDone).toContain(STORY_COMPANION_EVENT);
  });

  it('相棒は仲間一覧の先頭でなくても正しく見つける', () => {
    const chosen = chooseStoryCompanion(createNewGame({ name: 'ハル', grade: 1 }), 'iwate-kodamaru');
    chosen.party.owned.unshift({ uid: 'other', monsterId: 'aomori-ringoron', level: 1, xp: 0 });
    expect(storyCompanionId(chosen)).toBe('iwate-kodamaru');
  });

  it('旧セーブの編成が満員でも、既存の仲間を消さず相棒を控えへ加える', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    for (let index = 0; index < 7; index += 1) {
      const uid = `legacy-${index}`;
      game.party.owned.push({ uid, monsterId: 'aomori-ringoron', level: 1, xp: 0 });
      game.party.team.push(uid);
    }
    game.party.reserve.push('old-reserve');

    const chosen = chooseStoryCompanion(game, 'iwate-kagurabi', 200);
    expect(chosen.party.team).toEqual(game.party.team);
    expect(chosen.party.reserve).toEqual(['story-companion', 'old-reserve']);
    expect(chosen.party.owned).toHaveLength(8);
  });

  it('限定3体は本編の遭遇・ボス・通常イベントへ登録されない', async () => {
    const loaded = await content();
    for (const id of STORY_COMPANION_IDS) {
      expect(loaded.monsters.get(id)?.recruitRate).toBe(0);
      for (const area of loaded.areas.values()) {
        expect(area.encounters.flatMap((table) => table.table).some((entry) => entry.monsterId === id)).toBe(
          false,
        );
        expect(area.boss).not.toBe(id);
        expect(area.midBoss).not.toBe(id);
        expect(area.secret?.boss).not.toBe(id);
        expect(area.regions.some((region) => region.boss?.monsterId === id)).toBe(false);
      }
    }
  });
});
