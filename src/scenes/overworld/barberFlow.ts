import type { GameState } from '../../core/state/schema';
import type { TownOverlayProps } from '../../ui/field/TownOverlay';
import { t } from '../../ui/i18n';
import { playSfx } from '../../ui/sfx';
import { barberRows, LOOK_PARTS } from './menuEntries';

export const BARBER_PRICE = 30;

type TownMenu = (
  make: () => Omit<TownOverlayProps, 'message' | 'onClose' | 'focusKey' | 'onAct'>,
  act: (key: string) => string,
) => Promise<void>;

/** 床屋の候補表示・支払い・見た目変更を Scene 本体から分離する。 */
export async function openBarberFlow(options: {
  speaker: string;
  getGame: () => GameState;
  setGame: (game: GameState) => void;
  heroArt: (look: GameState['player']['appearance']) => string;
  townMenu: TownMenu;
  talk: (lines: { speaker: string; text: string }[]) => Promise<unknown>;
}): Promise<void> {
  const { speaker, getGame, setGame, heroArt, townMenu, talk } = options;
  await townMenu(
    () => {
      const game = getGame();
      return {
        title: t('field.roleBarber'),
        icon: 'role-barber',
        gold: game.player.gold,
        rows: barberRows(game, heroArt, BARBER_PRICE),
        empty: t('field.barberEmpty'),
        keys: t('field.barberKeys'),
      };
    },
    (key) => {
      const game = getGame();
      const [, part, rawIndex] = key.split(':');
      const lookPart = LOOK_PARTS.find((candidate) => candidate.part === part);
      const index = Number(rawIndex);
      const optionCount = lookPart ? t(`field.${lookPart.key}Names`).split(',').length : 0;
      if (
        !lookPart ||
        !Number.isInteger(index) ||
        index < 0 ||
        index >= optionCount ||
        game.player.appearance[lookPart.part] === index ||
        game.player.gold < BARBER_PRICE
      ) {
        playSfx('miss');
        return t('field.townPoor');
      }
      setGame({
        ...game,
        updatedAt: Date.now(),
        player: {
          ...game.player,
          gold: game.player.gold - BARBER_PRICE,
          appearance: { ...game.player.appearance, [lookPart.part]: index },
        },
      });
      playSfx('select');
      return t('field.barberDone');
    },
  );
  await talk([{ speaker, text: t('field.barberBye') }]);
}
