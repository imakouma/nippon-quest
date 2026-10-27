import type { GameState } from './schema';

export const GAME_PERSISTENCE_PORT_KEY = 'gamePersistence';

/** Sceneから保存先を隠し、registry更新と永続化完了を1つのawait境界にする。 */
export interface GamePersistencePort {
  commit(state: GameState): Promise<void>;
}
