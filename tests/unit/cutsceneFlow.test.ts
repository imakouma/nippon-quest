import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { recordPlayDuration } from '../../src/core/state/playTime';
import { applyOpeningHeroName } from '../../src/scenes/overworld/cutsceneFlow';

describe('オープニングの名前設定', () => {
  it('入力待ち中に更新された状態へ名前を反映する', () => {
    const started = createNewGame({ name: '？？？', grade: 1 }, 100);
    const latest = recordPlayDuration(started, '2026-10-08', 45, 200);

    const named = applyOpeningHeroName(latest, 'ハル', 300);

    expect(named.player.name).toBe('ハル');
    expect(named.learning.playSecondsByDate['2026-10-08']).toBe(45);
    expect(named.updatedAt).toBe(300);
  });
});
