import { describe, expect, it } from 'vitest';
import { cutsceneAutoWaitMs } from '../../src/ui/cutscene/timing';

describe('イベントシーンのオート待ち時間', () => {
  it('短い台詞にも読むための間を置く', () => {
    expect(cutsceneAutoWaitMs('うん。')).toBeGreaterThanOrEqual(2800);
  });

  it('長い台詞ほど長く待ち、上限を超えない', () => {
    expect(cutsceneAutoWaitMs('これは 少し長い 台詞です。')).toBeGreaterThan(cutsceneAutoWaitMs('うん。'));
    expect(cutsceneAutoWaitMs('あ'.repeat(200))).toBe(5200);
  });
});
