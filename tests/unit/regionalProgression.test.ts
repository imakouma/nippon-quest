import { describe, expect, it } from 'vitest';
import { content } from './helpers';

describe('全国の地域進行', () => {
  it('地理調整した地域のぬしが、その地域の文化モチーフと一致する', async () => {
    const c = await content();
    const expected = {
      kagoshima: [
        ['kagoshima-sakurajima', 'kagoshima-kurogane-boo'],
        ['kirishima-hokusatsu', 'kagoshima-shincha-dou'],
        ['nansatsu-yakushima', 'kagoshima-daikon-shogun'],
      ],
      kyoto: [['nantan-chutan', 'kyoto-hontoha-karain']],
      oita: [
        ['yufu-kuju', 'oita-hodagi-oh'],
        ['kunisaki-yabakei', 'oita-yubune-don'],
      ],
    } as const;

    for (const [areaId, regions] of Object.entries(expected)) {
      const area = c.areas.get(areaId)!;
      for (const [regionId, bossId] of regions)
        expect(area.regions.find((region) => region.id === regionId)?.boss?.monsterId).toBe(bossId);
    }
  });

  it('地域のぬしレベルが経験値表の上限内で全国の進行順に上がる', async () => {
    const c = await content();
    const areaIds = c.world.islands.flatMap((island) => island.areas);
    const aomoriLevels = c.areas.get('aomori')!.regions.map((region) => region.boss!.level);
    const nationwideLevels = areaIds
      .filter((areaId) => areaId !== 'aomori')
      .flatMap((areaId) => c.areas.get(areaId)!.regions.map((region) => region.boss!.level));

    expect(aomoriLevels, '青森の既存バランス').toEqual([3, 4, 6, 7, 8, 10, 11, 12, 13, 14]);
    expect(nationwideLevels, '青森後の全国レベル曲線').toEqual(
      Array.from({ length: 145 }, (_, index) => 15 + Math.floor((index * 36) / 144)),
    );
    expect(Math.max(...nationwideLevels), '経験値表で到達できる最高レベル').toBeLessThanOrEqual(
      Math.min(c.xp.hero.length, c.xp.monster.length),
    );
  });

  it('全都道府県に地域・ぬし・100点の地域別出現表があり、先の地域にも既出種が残る', async () => {
    const c = await content();
    const areaIds = c.world.islands.flatMap((island) => island.areas);

    expect(new Set(areaIds).size, '都道府県IDの重複').toBe(areaIds.length);
    expect(areaIds, '全国47都道府県').toHaveLength(47);

    for (const areaId of areaIds) {
      const area = c.areas.get(areaId)!;
      expect(area.regions.length, `${areaId}: regions`).toBeGreaterThanOrEqual(3);
      if (areaId !== 'aomori') expect(area.regions.length, `${areaId}: regions`).toBeLessThanOrEqual(6);
      expect(
        area.regions.filter((region) => region.start),
        `${areaId}: start region`,
      ).toHaveLength(1);
      expect(area.regions[0]?.start, `${areaId}: 最初の地域が start`).toBe(true);
      expect(area.regionGates, `${areaId}: gates`).toHaveLength(area.regions.length - 1);

      const regionIds = area.regions.map((region) => region.id);
      for (let defeatedCount = 0; defeatedCount < regionIds.length; defeatedCount++) {
        const defeated = new Set(regionIds.slice(0, defeatedCount));
        const reachable = new Set([regionIds[0]!]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const gate of area.regionGates) {
            if (!defeated.has(gate.openedBy) || !gate.between.some((regionId) => reachable.has(regionId)))
              continue;
            for (const regionId of gate.between)
              if (!reachable.has(regionId)) {
                reachable.add(regionId);
                changed = true;
              }
          }
        }
        expect(
          regionIds.filter((regionId) => reachable.has(regionId)),
          `${areaId}: 先頭${defeatedCount}地域のboss撃破後に到達できる地域`,
        ).toEqual(regionIds.slice(0, defeatedCount + 1));
      }

      const tables = new Map(
        area.encounters
          .filter((encounter) => encounter.zone === 'field' && encounter.region)
          .map((encounter) => [encounter.region!, encounter]),
      );
      expect([...tables.keys()].sort(), `${areaId}: encounter regions`).toEqual(
        area.regions.map((region) => region.id).sort(),
      );

      const seen = new Set<string>();
      const earlierFocals = new Set<string>();
      const bosses = new Set<string>();
      area.regions.forEach((region, index) => {
        expect(region.boss, `${areaId}/${region.id}: boss`).toBeDefined();
        const boss = c.monsters.get(region.boss!.monsterId)!;
        expect(boss.area, `${areaId}/${region.id}: boss area`).toBe(areaId);
        expect(boss.recruitRate, `${areaId}/${region.id}: boss recruit rate`).toBe(0);
        expect(bosses.has(boss.id), `${areaId}/${region.id}: boss の重複`).toBe(false);
        bosses.add(boss.id);

        const table = tables.get(region.id)!;
        expect(
          table.table.reduce((total, entry) => total + entry.weight, 0),
          `${areaId}/${region.id}: encounter weight`,
        ).toBe(100);
        const highestWeight = Math.max(...table.table.map((entry) => entry.weight));
        const focalEntries = table.table.filter((entry) => entry.weight === highestWeight);
        expect.soft(focalEntries, `${areaId}/${region.id}: unique focal`).toHaveLength(1);
        const focal = focalEntries[0] ?? table.table[0]!;
        if (index > 0) {
          expect(
            table.table.some((entry) => seen.has(entry.monsterId)),
            `${areaId}/${region.id}: earlier monster carryover`,
          ).toBe(true);
          const focalCarryovers = table.table.filter((entry) => earlierFocals.has(entry.monsterId));
          expect
            .soft(focalCarryovers.length, `${areaId}/${region.id}: earlier focal carryover`)
            .toBeGreaterThan(0);
          for (const entry of focalCarryovers) {
            if (entry.monsterId === focal.monsterId) continue;
            expect
              .soft(entry.weight, `${areaId}/${region.id}: ${entry.monsterId} carryover weight`)
              .toBeGreaterThanOrEqual(5);
            expect
              .soft(entry.weight, `${areaId}/${region.id}: ${entry.monsterId} carryover weight`)
              .toBeLessThanOrEqual(30);
          }
        }
        earlierFocals.add(focal.monsterId);
        table.table.forEach((entry) => seen.add(entry.monsterId));
      });

      const normalBaseMonsters = [...c.monsters.values()]
        .filter((monster) => monster.area === areaId && monster.recruitRate > 0 && monster.evolution)
        .map((monster) => monster.id)
        .sort();
      expect([...seen].sort(), `${areaId}: regional wild roster`).toEqual(normalBaseMonsters);
    }
  });
});
