/** セーブ内容のJSON交換。IndexedDBなどの保存先には依存しない純粋な変換層。 */
import { migrate } from './migrations';
import type { GameState } from './schema';

// JSON.parse はメインスレッドで同期実行される。通常のセーブに十分な余裕を持たせつつ、
// 保護者画面への巨大な貼り付けでUIが長時間停止するのを防ぐ。
export const MAX_GAME_IMPORT_CHARS = 5 * 1024 * 1024;

export function exportGameJson(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

export function importGameJson(text: string): GameState {
  if (text.length > MAX_GAME_IMPORT_CHARS) {
    throw new Error('セーブデータが大きすぎます');
  }
  return migrate(JSON.parse(text)).state;
}
