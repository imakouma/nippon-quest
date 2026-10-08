import type { GameState } from './schema';

/** 表示中のプレイ時間を秒単位で加算する。 */
export function recordPlayDuration(
  prev: GameState,
  date: string,
  seconds: number,
  now = Date.now(),
): GameState {
  if (!Number.isSafeInteger(seconds) || seconds <= 0) return prev;
  return {
    ...prev,
    updatedAt: now,
    learning: {
      ...prev.learning,
      playSecondsByDate: {
        ...prev.learning.playSecondsByDate,
        [date]: (prev.learning.playSecondsByDate[date] ?? 0) + seconds,
      },
    },
  };
}

/** 互換用：表示中のプレイ時間を1分加算する。 */
export function recordPlayMinute(prev: GameState, date: string, now = Date.now()): GameState {
  return recordPlayDuration(prev, date, 60, now);
}
