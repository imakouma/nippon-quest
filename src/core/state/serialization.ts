/** セーブ内容のJSON交換。IndexedDBなどの保存先には依存しない純粋な変換層。 */
import { migrate } from './migrations';
import type { GameState } from './schema';

export function exportGameJson(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

export function importGameJson(text: string): GameState {
  return migrate(JSON.parse(text)).state;
}
