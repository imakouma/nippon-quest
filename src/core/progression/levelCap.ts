export interface LevelCapRules {
  heroInitial: number;
  heroMaximum: number;
  monsterMaximum: number;
  standardStep: number;
  heroPost100Step: number;
  learningFragmentsPerUnlock: number;
  trialCoresPerUnlock: number;
  heroPost100GrowthRate: number;
}

export interface LevelCapTarget {
  kind: 'hero' | 'monster';
  level: number;
  levelCap: number;
}

export interface LevelCapMaterials {
  learningFragments: number;
  trialCores: number;
}

export type LevelCapUnlockPreview =
  | { ok: true; nextCap: number; cost: LevelCapMaterials }
  | { ok: false; reason: 'not-at-cap' | 'insufficient-materials' | 'absolute-cap'; cost?: LevelCapMaterials };

export function previewLevelCapUnlock(
  target: LevelCapTarget,
  materials: LevelCapMaterials,
  rules: LevelCapRules,
): LevelCapUnlockPreview {
  const maximum = target.kind === 'hero' ? rules.heroMaximum : rules.monsterMaximum;
  if (target.levelCap >= maximum) return { ok: false, reason: 'absolute-cap' };
  if (target.level < target.levelCap) return { ok: false, reason: 'not-at-cap' };

  const cost = {
    learningFragments: rules.learningFragmentsPerUnlock,
    trialCores: rules.trialCoresPerUnlock,
  };
  if (materials.learningFragments < cost.learningFragments || materials.trialCores < cost.trialCores) {
    return { ok: false, reason: 'insufficient-materials', cost };
  }

  const step = target.kind === 'hero' && target.levelCap >= 100 ? rules.heroPost100Step : rules.standardStep;
  return { ok: true, nextCap: Math.min(maximum, target.levelCap + step), cost };
}
