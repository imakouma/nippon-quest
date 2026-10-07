import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { BARBER_PRICE, openBarberFlow } from '../../src/scenes/overworld/barberFlow';
import { setDictionary, type I18nDict } from '../../src/ui/i18n';

beforeAll(() => {
  setDictionary(
    JSON.parse(readFileSync(new URL('../../content/i18n/ja.json', import.meta.url), 'utf8')) as I18nDict,
  );
});

describe('町の床屋', () => {
  it('料金を払ったときだけ見た目を変更する', async () => {
    let game = createNewGame({ name: 'テスト', grade: 3 }, 1_000);
    game.player.gold = BARBER_PRICE;
    await openBarberFlow({
      speaker: 'とこや',
      getGame: () => game,
      setGame: (next) => (game = next),
      heroArt: (look) => `hair:${look.hair}`,
      townMenu: async (make, act) => {
        expect(make().rows).toHaveLength(32);
        expect(act('look:hair:1')).toContain('かえました');
        expect(act('look:hair:2')).toContain('おかね');
      },
      talk: async () => undefined,
    });
    expect(game.player.appearance.hair).toBe(1);
    expect(game.player.gold).toBe(0);
  });
});
