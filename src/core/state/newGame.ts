import type { Grade } from '../content/schemas';
import { freshSeed } from '../rng';
import { SCHEMA_VERSION, type GameState } from './schema';

export interface NewGameOptions {
  name: string;
  appearance?: { hair: number; skin: number; cloth: number };
  starterMonsterId: string;
  grade: Grade;
}

export function createNewGame(o: NewGameOptions, now = Date.now()): GameState {
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
      skills: ['sk-tashizan-giri'],
      equipment: {},
      hp: 40,
      mp: 10,
    },
    party: {
      owned: [{ uid: 'starter', monsterId: o.starterMonsterId, level: 1, xp: 0 }],
      activeUid: 'starter',
      team: ['starter'],
    },
    inventory: { 'common-yakusou': 3 },
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
      counters: {},
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
    },
    arena: { badges: 0, ghostParty: null },
    settings: { bgmVolume: 0.6, seVolume: 0.8, timeLimitScale: 1 },
  };
}
