import { describe, expect, it } from 'vitest';
import { previewLevelCapUnlock, type LevelCapRules } from '../../src/core/progression/levelCap';

const rules: LevelCapRules = {
  heroInitial: 10,
  heroMaximum: 200,
  monsterMaximum: 100,
  standardStep: 10,
  heroPost100Step: 5,
  learningFragmentsPerUnlock: 3,
  trialCoresPerUnlock: 1,
  heroPost100GrowthRate: 0.25,
};

const enough = { learningFragments: 3, trialCores: 1 };

describe('レベル上限の解放判定', () => {
  it('Lv100までは主人公も仲間も上限を10上げる', () => {
    expect(previewLevelCapUnlock({ kind: 'hero', level: 10, levelCap: 10 }, enough, rules)).toEqual({
      ok: true,
      nextCap: 20,
      cost: enough,
    });
    expect(previewLevelCapUnlock({ kind: 'monster', level: 90, levelCap: 90 }, enough, rules)).toEqual({
      ok: true,
      nextCap: 100,
      cost: enough,
    });
  });

  it('主人公だけLv100以降は5ずつLv200まで上げる', () => {
    expect(previewLevelCapUnlock({ kind: 'hero', level: 100, levelCap: 100 }, enough, rules)).toMatchObject({
      ok: true,
      nextCap: 105,
    });
    expect(previewLevelCapUnlock({ kind: 'hero', level: 195, levelCap: 195 }, enough, rules)).toMatchObject({
      ok: true,
      nextCap: 200,
    });
  });

  it('上限へ未到達なら素材があっても解放しない', () => {
    expect(previewLevelCapUnlock({ kind: 'hero', level: 9, levelCap: 10 }, enough, rules)).toEqual({
      ok: false,
      reason: 'not-at-cap',
    });
  });

  it('素材不足を消費数と一緒に返す', () => {
    expect(
      previewLevelCapUnlock(
        { kind: 'monster', level: 20, levelCap: 20 },
        { learningFragments: 2, trialCores: 0 },
        rules,
      ),
    ).toEqual({
      ok: false,
      reason: 'insufficient-materials',
      cost: enough,
    });
  });

  it('主人公Lv200と仲間Lv100では解放しない', () => {
    expect(previewLevelCapUnlock({ kind: 'hero', level: 200, levelCap: 200 }, enough, rules)).toEqual({
      ok: false,
      reason: 'absolute-cap',
    });
    expect(previewLevelCapUnlock({ kind: 'monster', level: 100, levelCap: 100 }, enough, rules)).toEqual({
      ok: false,
      reason: 'absolute-cap',
    });
  });
});
