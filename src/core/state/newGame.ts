import type { Grade } from '../content/schemas';
import { mvpRegion, type MvpRegionId } from '../regions/mvp';
import { freshSeed } from '../rng';
import { SCHEMA_VERSION, type GameState } from './schema';

export interface NewGameOptions {
  name: string;
  appearance?: { hair: number; skin: number; cloth: number };
  starterMonsterId: string;
  grade: Grade;
  startRegion?: MvpRegionId;
}

export function createNewGame(o: NewGameOptions, now = Date.now()): GameState {
  const region = mvpRegion(o.startRegion);
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    seed: freshSeed(),
    player: {
      name: o.name,
      appearance: o.appearance ?? { hair: 0, skin: 0, cloth: 0 },
      level: 1,
      xp: 0,
      gold: 100,
      baseStats: { hp: 40, mp: 10, atk: 8, def: 6, spd: 7, wis: 5 },
      bonusWis: 0,
      skills: [region.initialSkill],
      equipment: {},
      hp: 40,
      mp: 10,
    },
    party: {
      owned: [{ uid: 'starter', monsterId: o.starterMonsterId, level: 1, xp: 0 }],
      activeUid: 'starter',
      team: ['starter'],
      reserve: [],
      bagPlacements: {
        hero: { x: 0, y: 0, rotated: false },
        'mon:starter': { x: 1, y: 0, rotated: false },
      },
    },
    inventory: {},
    progress: {
      currentIsland: region.id,
      currentArea: region.startArea,
      currentMap: region.startMap,
      position: { x: 160, y: 160 },
      lastInn: null,
      areaSigns: [],
      islandsCleared: [],
      eventsDone: [],
      chestsOpened: [],
      unlockedRecipes: ['rc-nebuta-no-kabuto', 'rc-hiba-no-koshiate'],
      missions: {},
      counters: { 'story.prologue': 0 },
    },
    dex: { monsters: [], items: [], motifs: [] },
    learning: {
      grade: o.grade,
      includeLower: true,
      challengeHigher: false,
      kanjiLevel: o.grade,
      mastery: {},
      recent: [],
      mistakes: [],
      playSecondsByDate: {},
      attempts: [],
      conceptStates: {},
    },
    arena: { badges: 0, ghostParty: null },
    settings: { bgmVolume: 0.6, seVolume: 0.8, timeLimitScale: 1 },
  };
}
