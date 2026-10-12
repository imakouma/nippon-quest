import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { migrateAcademicValue, scaleGrowth, scaleStat } from '../../scripts/academic-stats-migration';
import { migrateAcademicStats } from '../../scripts/migrate-academic-stats';

describe('文理ステータス変換', () => {
  it('基礎能力は正の値を最低1にするが、成長量の小数は維持する', () => {
    expect(scaleStat(0.8, 5 / 7, true)).toBe(1);
    expect(scaleStat(0.8, 5 / 7, false)).toBe(0.6);
    expect(scaleGrowth(0.8, 5 / 7, 15)).toBe(0.3);
  });

  it('旧モンスター能力を文理と節目成長へ変換する', () => {
    const monster = {
      baseStats: { hp: 28, mp: 6, atk: 7, def: 5, spd: 6, wis: 3 },
      growth: { hp: 4, mp: 1, atk: 1.2, def: 1, spd: 0.8, wis: 0.6 },
    };
    expect(migrateAcademicValue(monster)).toBe(2);
    expect(monster).toMatchObject({
      baseStats: { hp: 16.8, scienceAtk: 4.4, scienceDef: 3.3, spd: 4.3 },
      growth: {
        base: { hp: 1.7, mp: 0.3, scienceAtk: 0.4, scienceDef: 0.4, spd: 0.3, wis: 0.3 },
      },
    });
  });

  it('新形式へ再実行しても変更しない', () => {
    const monster = {
      baseStats: {
        hp: 17,
        mp: 4,
        scienceAtk: 4,
        humanitiesAtk: 4,
        scienceDef: 3,
        humanitiesDef: 3,
        spd: 4,
        wis: 2,
      },
    };
    const snapshot = structuredClone(monster);
    expect(migrateAcademicValue(monster)).toBe(0);
    expect(monster).toEqual(snapshot);
  });

  it('dry-runでは書き換えず、write後の再実行は変更0件になる', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'nihonquest-stats-'));
    await mkdir(path.join(root, 'content/monsters'), { recursive: true });
    await mkdir(path.join(root, 'content/items'), { recursive: true });
    const monsterFile = path.join(root, 'content/monsters/sample.json');
    const before = JSON.stringify({
      baseStats: { hp: 20, mp: 5, atk: 6, def: 4, spd: 5, wis: 2 },
      growth: { hp: 3, mp: 0.8, atk: 1, def: 0.8, spd: 0.6, wis: 0.4 },
    });
    await writeFile(monsterFile, before);
    await writeFile(path.join(root, 'content/items/sample.json'), '{}');
    await writeFile(path.join(root, 'content/skills.json'), JSON.stringify([{ subject: 'rika' }]));

    expect(await migrateAcademicStats(root, false)).toEqual({
      filesChanged: 1,
      objectsChanged: 2,
      skillsChanged: 1,
    });
    expect(await readFile(monsterFile, 'utf8')).toBe(before);

    expect((await migrateAcademicStats(root, true)).objectsChanged).toBe(2);
    expect(await migrateAcademicStats(root, true)).toEqual({
      filesChanged: 0,
      objectsChanged: 0,
      skillsChanged: 0,
    });
  });
});
