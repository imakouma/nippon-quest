import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContent, type ContentIndex } from '../../src/core/content/loader';
import { earnAreaSign } from '../../src/core/progression/eventReward';
import { areaBossFlag } from '../../src/core/progression/route';
import { createNewGame } from '../../src/core/state/newGame';
import { STORY_COMPANION_IDS } from '../../src/core/progression/storyCompanion';
import { act, createBattle } from '../../src/core/battle/engine';
import { makeHero, makeMonster, makeParty } from '../../src/core/battle/factory';
import { content, deps, read } from './helpers';

const MAPS = fileURLToPath(new URL('../../maps/', import.meta.url));
interface Obj {
  name: string;
  type: string;
}
const objectsOf = (mapKey: string): Obj[] =>
  (
    JSON.parse(readFileSync(`${MAPS}${mapKey}.json`, 'utf8')) as { layers: { objects?: Obj[] }[] }
  ).layers.flatMap((l) => l.objects ?? []);

let c: ContentIndex;
beforeAll(async () => {
  c = await loadContent(read);
});

describe('県ボス（ダンジョンの おく）', () => {
  it('倒すと 県のしるし と ボスの しるし が つく（2 回目は ふえない。元の GameState は 書きかえない）', () => {
    const gs = createNewGame({ name: 'ハル', grade: 3 });
    const once = earnAreaSign(gs, 'aomori');
    const twice = earnAreaSign(once, 'aomori');
    expect(once.progress.areaSigns).toEqual(['aomori']);
    expect(once.progress.eventsDone).toContain(areaBossFlag('aomori'));
    expect(twice.progress.areaSigns).toEqual(['aomori']);
    expect(twice.progress.eventsDone.filter((f) => f === areaBossFlag('aomori'))).toHaveLength(1);
    expect(gs.progress.areaSigns).toEqual([]);
  });

  it('県ボスが いる 県は、ダンジョンの マップに boss_<県> が ちょうど 1 つ ある', () => {
    for (const a of c.areas.values()) {
      if (!a.boss || !a.mapKeys) continue;
      const bosses = objectsOf(a.mapKeys.dungeon).filter((o) => o.type === 'boss');
      expect(
        bosses.map((o) => o.name),
        a.id,
      ).toEqual([`boss_${a.id}`]);
    }
  });
});

describe('しんか', () => {
  it('しんかの どうぐは どれも、どこかの モンスターが 落とす', () => {
    const dropped = new Set([...c.monsters.values()].flatMap((m) => m.drops.map((d) => d.itemId)));
    for (const m of c.monsters.values())
      if (m.evolution) expect(dropped.has(m.evolution.item), `${m.id} → ${m.evolution.item}`).toBe(true);
  });

  it('どの 県の 通常モンスターも みんな しんかする（しんか先は 出現表に 出ない）', () => {
    const evolved = new Set([...c.monsters.values()].flatMap((m) => (m.evolution ? [m.evolution.to] : [])));
    const encountered = new Set(
      [...c.areas.values()].flatMap((a) => a.encounters.flatMap((e) => e.table.map((t) => t.monsterId))),
    );
    for (const m of c.monsters.values()) {
      if (!c.areas.has(m.area) || m.isBoss) continue;
      if (STORY_COMPANION_IDS.includes(m.id as (typeof STORY_COMPANION_IDS)[number])) continue;
      if (evolved.has(m.id)) expect(encountered.has(m.id), m.id).toBe(false);
      else expect(m.evolution, m.id).toBeDefined();
    }
  });
});

describe('開発者モード', () => {
  it('ふだんの ボス戦は にげられない。開発者モード（canFleeBoss）なら にげる 判定が 出る', async () => {
    const c = await content();
    const D = await deps();
    const hero = makeHero(
      {
        name: 'ハル',
        level: 5,
        baseStats: { hp: 40, mp: 10, atk: 8, def: 6, spd: 7, wis: 5 },
        growth: { hp: 6, mp: 2, atk: 1.5, def: 1.2, spd: 1.0, wis: 1.0 },
        skills: ['sk-tashizan-giri'],
        equipment: {},
      },
      c.items,
      c.sets,
    );
    const enemy = makeMonster(c.monsters.get('aomori-boss-tsugaru-no-nushi')!, 5, 'enemy');
    const party = makeParty(hero, [], {});
    const opts = { ally: party, enemy, seed: 'dev-flee', isBossBattle: true };
    const normal = act(createBattle(opts, D), { kind: 'flee' }, D);
    const dev = act(createBattle({ ...opts, canFleeBoss: true }, D), { kind: 'flee' }, D);
    expect(normal.events.some((e) => e.t === 'fleeAttempt' && !e.success && e.chance === 0)).toBe(true);
    expect(normal.state.outcome).toBe('ongoing');
    expect(dev.events.some((e) => e.t === 'fleeAttempt' && e.chance > 0)).toBe(true);
  });
});
