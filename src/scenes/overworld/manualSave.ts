import { GAME_PERSISTENCE_PORT_KEY, type GamePersistencePort } from '../../core/state/persistence';
import type { GameState } from '../../core/state/schema';
import { t } from '../../ui/i18n';
import { playSfx } from '../../ui/sfx';

export async function saveFromFieldMenu(
  registry: { get(key: string): unknown },
  state: GameState | undefined,
  hideMenu: () => void,
  ask: (text: string, choices: string[]) => Promise<number>,
  close: () => void,
): Promise<void> {
  const persistence = registry.get(GAME_PERSISTENCE_PORT_KEY) as GamePersistencePort | undefined;
  if (!state || !persistence) return;
  hideMenu();
  await persistence.commit(state);
  playSfx('recruit');
  if ((await ask(t('field.saveDone'), [t('ui.yes'), t('ui.no')])) === 0)
    location.assign(import.meta.env.BASE_URL);
  else close();
}
