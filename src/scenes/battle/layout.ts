import { BACKDROP_SCALE } from '../../rendering/battle/pixelArt';

export const BATTLE_SCALE = BACKDROP_SCALE;
export type BattlePresentation = 'side' | 'depth';

export interface BattleLayout {
  enemy: {
    x: number;
    y: number;
    scaleStep: number;
    referenceBodyHeight: number;
    minBodyHeight: number;
    maxBodyHeight: number;
    minBodyTop: number;
  };
  hero: { x: number; y: number; scale: number };
  partner: { x: number; y: number; scale: number };
}

const SIDE_LAYOUT: BattleLayout = {
  enemy: {
    x: 250,
    y: 380,
    scaleStep: 0,
    referenceBodyHeight: 96,
    minBodyHeight: 48,
    maxBodyHeight: 250,
    minBodyTop: 130,
  },
  hero: { x: 690, y: 388, scale: BATTLE_SCALE },
  partner: { x: 820, y: 356, scale: BATTLE_SCALE },
};

/** 敵を奥、味方を手前に置く比較用の試作レイアウト。戦闘ロジックには影響しない。 */
const DEPTH_LAYOUT: BattleLayout = {
  enemy: {
    x: 300,
    y: 286,
    scaleStep: -1,
    referenceBodyHeight: 96,
    minBodyHeight: 60,
    maxBodyHeight: 250,
    minBodyTop: 140,
  },
  hero: { x: 676, y: 432, scale: BATTLE_SCALE + 1 },
  partner: { x: 828, y: 404, scale: BATTLE_SCALE + 1 },
};

export function battleLayout(presentation: BattlePresentation = 'depth'): BattleLayout {
  return presentation === 'depth' ? DEPTH_LAYOUT : SIDE_LAYOUT;
}
export const READY_STEP = 24;
export const OFF_RIGHT = 1080;

export const LOG_BASE_MS = 350;
export const LOG_CHAR_MS = 30;
export const LOG_MAX_MS = 1300;
