import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { earnAreaSign } from '../../src/core/progression/eventReward';
import { canChallengeIslandBoss, completeIsland } from '../../src/core/progression/island';
import { areaBossFlag, midBossFlag, nextStop } from '../../src/core/progression/route';
import { content } from './helpers';

const TOHOKU = ['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima'] as const;
const MAPS = new URL('../../maps/', import.meta.url);

interface MapObject {
  name: string;
  type: string;
  properties?: { name: string; value: unknown }[];
}

interface TiledMap {
  layers: { objects?: MapObject[] }[];
}

const map = (key: string): TiledMap =>
  JSON.parse(readFileSync(new URL(`${key}.json`, MAPS), 'utf8')) as TiledMap;
const objects = (key: string): MapObject[] => map(key).layers.flatMap((layer) => layer.objects ?? []);
const prop = (object: MapObject, name: string): unknown =>
  object.properties?.find((candidate) => candidate.name === name)?.value;

describe('東北章の進行契約', () => {
  it('新規ゲームは青森入口から始まり、限定テスト対象だけが公開されている', async () => {
    const c = await content();
    const gs = createNewGame({ name: 'ハル', starterMonsterId: 'aomori-nebutan', grade: 1 }, 0);
    const tohoku = c.world.islands.find((island) => island.id === 'tohoku');

    expect(tohoku?.areas).toEqual(TOHOKU);
    expect(tohoku?.status).toBe('playable');
    expect(c.world.islands.find((island) => island.id === 'koshinetsu')?.status).toBe('playable');
    expect(c.world.islands.find((island) => island.id === 'hokkaido')?.status).toBe('stub');
    expect(gs.progress).toMatchObject({
      currentIsland: 'tohoku',
      currentArea: 'aomori',
      currentMap: 'aomori-field',
      areaSigns: [],
      islandsCleared: [],
    });
  });

  it.each(TOHOKU)('%s はフィールド・町・ダンジョンを往復でき、中ボスと県ボスが1体ずついる', async (id) => {
    const c = await content();
    const area = c.areas.get(id)!;
    const keys = area.mapKeys!;
    const field = objects(keys.field);
    const town = objects(keys.town);
    const dungeon = objects(keys.dungeon);

    expect(field.filter((object) => object.type === 'midboss').map((object) => object.name)).toEqual([
      `midboss_${id}`,
    ]);
    expect(dungeon.filter((object) => object.type === 'boss').map((object) => object.name)).toEqual([
      `boss_${id}`,
    ]);
    expect(new Set(field.map((object) => object.name)).size).toBe(field.length);

    const fieldTargets = field
      .filter((object) => object.type === 'transition')
      .map((object) => [prop(object, 'targetMap'), prop(object, 'targetSpawn')]);
    expect(fieldTargets).toContainEqual([keys.town, 'from_field']);
    expect(fieldTargets).toContainEqual([keys.dungeon, 'from_field']);
    expect(
      town.find((object) => object.type === 'transition' && prop(object, 'targetMap') === keys.field),
    ).toBeDefined();
    expect(
      dungeon.find((object) => object.type === 'transition' && prop(object, 'targetMap') === keys.field),
    ).toBeDefined();

    expect(area.midBoss).toBeTruthy();
    expect(c.monsters.get(area.midBoss!)?.isBoss).toBe(true);
    expect(c.monsters.get(area.midBoss!)?.area).toBe(id);
    expect(area.boss).toBeTruthy();
    expect(c.monsters.get(area.boss!)?.isBoss).toBe(true);
    expect(c.monsters.get(area.boss!)?.area).toBe(id);
  });

  it('中ボスのワープは青森から福島まで順番どおりで、地方を飛び越えない', async () => {
    const c = await content();
    const destinations = TOHOKU.map((id) => nextStop(c.world, id));
    expect(destinations).toEqual([
      { id: 'iwate', mapKey: 'iwate-field' },
      { id: 'miyagi', mapKey: 'miyagi-field' },
      { id: 'akita', mapKey: 'akita-field' },
      { id: 'yamagata', mapKey: 'yamagata-field' },
      { id: 'fukushima', mapKey: 'fukushima-field' },
      null,
    ]);
  });

  it('6県の県ボス報酬を一度ずつ受け取った場合だけ、東北地方ボスを解放できる', async () => {
    const c = await content();
    let gs = createNewGame({ name: 'ハル', starterMonsterId: 'aomori-nebutan', grade: 1 }, 0);

    for (const id of TOHOKU.slice(0, -1)) {
      gs = earnAreaSign(gs, id, 1);
      expect(gs.progress.eventsDone).toContain(areaBossFlag(id));
      expect(canChallengeIslandBoss(c.world, 'tohoku', gs.progress)).toBe(false);
    }

    gs = earnAreaSign(gs, 'fukushima', 2);
    gs = earnAreaSign(gs, 'fukushima', 3);
    expect(gs.progress.areaSigns).toEqual(TOHOKU);
    expect(canChallengeIslandBoss(c.world, 'tohoku', gs.progress)).toBe(true);
  });

  it('中ボス撃破印・県のしるし・地方クリアは重複せず、北海道は結界のまま', async () => {
    const c = await content();
    let gs = createNewGame({ name: 'ハル', starterMonsterId: 'aomori-nebutan', grade: 1 }, 0);
    for (const id of TOHOKU) gs = earnAreaSign(gs, id, 1);

    const cleared = completeIsland(gs, c.world, 'tohoku', 2);
    const repeated = completeIsland(cleared, c.world, 'tohoku', 3);
    expect(cleared.progress.islandsCleared).toEqual(['tohoku']);
    expect(repeated).toBe(cleared);
    expect(canChallengeIslandBoss(c.world, 'hokkaido', cleared.progress)).toBe(false);
    expect(c.world.islands.find((island) => island.id === 'hokkaido')?.status).toBe('stub');
    for (const id of TOHOKU) expect(midBossFlag(id)).toBe(`midboss.${id}`);
  });
});
