import { displayText } from '../ruby';

const AUTO_MIN_WAIT_MS = 2800;
const AUTO_PER_CHARACTER_MS = 55;
const AUTO_MAX_WAIT_MS = 5200;

/** 全文表示後のオート待ち時間。短文にも間を置き、長文は読む時間を増やす。 */
export function cutsceneAutoWaitMs(text: string): number {
  return Math.min(AUTO_MAX_WAIT_MS, AUTO_MIN_WAIT_MS + displayText(text).length * AUTO_PER_CHARACTER_MS);
}
