import type { Grade } from '../content/schemas';
import { freshSeed } from '../rng';
import { SCHEMA_VERSION, type GameState } from './schema';
import { STARTER_EQUIPMENT_ID } from './starter';

export interface NewGameOptions {
  name: string;
  appearance?: { hair: number; skin: number; cloth: number; hairStyle?: number; eyes?: number };
  grade: Grade;
}

export const UNNAMED_HERO = '？？？';

export function createNewGame(o: NewGameOptions, now = Date.now()): GameState {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    seed: freshSeed(),
    player: {
      name: o.name,
      appearance: { hair: 0, skin: 0, cloth: 0, hairStyle: 0, eyes: 0, ...o.appearance },
      level: 1,
      xp: 0,
      gold: 100,
      baseStats: { hp: 40, mp: 10, atk: 8, def: 6, spd: 7, wis: 5 },
      bonusWis: 0,
      skills: ['sk-tashizan-giri'],
      equipment: {},
      hp: 40,
      mp: 10,
    },
    party: {
      owned: [],
      activeUid: null,
      team: [],
      reserve: [],
      bagPlacements: {
        hero: { x: 1, y: 1, rotated: false },
      },
    },
    inventory: { [STARTER_EQUIPMENT_ID]: 1 },
    progress: {
      currentIsland: 'tohoku',
      currentArea: 'aomori',
      currentMap: 'aomori-field',
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
