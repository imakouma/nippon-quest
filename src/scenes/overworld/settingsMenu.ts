import { h, render } from 'preact';
import type { GameState } from '../../core/state/schema';
import { SettingsOverlay } from '../../ui/field/SettingsOverlay';

export function showSettings(
  root: HTMLElement,
  scene: {
    gs(): GameState | undefined;
    setGame(game: GameState): void;
  },
  onClose: () => void,
): void {
  const draw = () => {
    const game = scene.gs();
    if (!game) return;
    render(
      h(SettingsOverlay, {
        game,
        onChange: (settings: Partial<GameState['settings']>) => {
          const current = scene.gs();
          if (!current) return;
          scene.setGame({
            ...current,
            updatedAt: Date.now(),
            settings: { ...current.settings, ...settings },
          });
          draw();
        },
        onClose,
      }),
      root,
    );
  };
  draw();
}
