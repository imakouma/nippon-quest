import { describe, expect, it } from 'vitest';
import { makeCompanion } from '../../src/core/battle/engine';
import { makeMonster } from '../../src/core/battle/factory';
import { createNewGame } from '../../src/core/state/newGame';
import { scopeQueryToGrade } from '../../src/questions/engine/gradeScope';
import { content } from './helpers';

describe('小1・小2 地方別MVP', () => {
  it('新しい旅は名前未設定・主人公ひとりで始まる', () => {
    const game = createNewGame({ grade: 1, startRegion: 'tohoku' });
    expect(game.player.name).toBe('？？？');
    expect(game.party).toMatchObject({ owned: [], activeUid: null, team: [], reserve: [] });
    expect(game.party.bagPlacements).toEqual({ hero: { x: 0, y: 0, rotated: false } });
  });

  it('東北は国語・生活科、甲信越は算数として公開される', async () => {
    const c = await content();
    expect(c.world.islands.find((x) => x.id === 'tohoku')?.featuredSubjects).toEqual(['kokugo', 'seikatsu']);
    expect(c.world.islands.find((x) => x.id === 'koshinetsu')).toMatchObject({
      status: 'playable',
      areas: ['niigata', 'yamanashi', 'nagano'],
      featuredSubjects: ['sansu'],
      recommendedGrade: [1, 2],
    });
  });

  it('甲信越を選ぶと新潟から算数の技で開始する', () => {
    const game = createNewGame({
      name: 'ハル',
      grade: 2,
      startRegion: 'koshinetsu',
      starterMonsterId: 'niigata-hisui-koro',
    });
    expect(game.progress).toMatchObject({
      currentIsland: 'koshinetsu',
      currentArea: 'niigata',
      currentMap: 'niigata-field',
    });
    expect(game.player.skills).toEqual(['sk-kazoe-giri']);
    expect(game.learning.grade).toBe(2);
  });

  it('地方限定モンスターは明示された得意教科でゲージを助ける', async () => {
    const c = await content();
    const monster = makeMonster(c.monsters.get('niigata-hisui-koro')!, 1);
    const companion = makeCompanion(monster, { skills: c.skills, settings: c.settings });
    expect(companion?.passiveSkill?.subject).toBe('sansu');
  });

  it('広い出題範囲でも選択学年だけに絞る', () => {
    expect(scopeQueryToGrade({ subject: 'kokugo', gradeRange: [1, 6] }, 2).gradeRange).toEqual([2, 2]);
    expect(scopeQueryToGrade({ subject: 'sansu', gradeRange: [1, 1] }, 2).gradeRange).toEqual([1, 1]);
  });
});
