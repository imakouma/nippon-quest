import { describe, expect, it } from 'vitest';
import { recordPlayMinute } from '../../src/core/state/playTime';
import { createNewGame } from '../../src/core/state/newGame';
import { commitInnStay } from '../../src/scenes/overworld/innFlow';

describe('宿屋の宿泊フロー', () => {
  it('無料宿泊の案内中に更新されたプレイ時間を上書きしない', async () => {
    let game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.player.gold = 0;
    game.player.hp = 1;

    await commitInnStay({
      getGame: () => game,
      setGame: (next) => (game = next),
      max: () => ({ hp: 40, mp: 10 }),
      inn: { map: 'aomori-town', x: 8, y: 8 },
      reviewed: 0,
      onFree: async () => {
        game = recordPlayMinute(game, '2026-10-08', 300);
      },
    });

    expect(game.player.hp).toBe(40);
    expect(game.learning.playSecondsByDate['2026-10-08']).toBe(60);
  });
});
