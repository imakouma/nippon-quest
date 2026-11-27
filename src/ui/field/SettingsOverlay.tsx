import { useRef } from 'preact/hooks';
import type { GameState } from '../../core/state/schema';
import { t } from '../i18n';
import { displayText } from '../ruby';
import { RubyLabel } from '../RubyLabel';
import { useModalFocus } from '../useModalFocus';

export function SettingsOverlay({
  game,
  onChange,
  onClose,
}: {
  game: GameState;
  onChange: (settings: Partial<GameState['settings']>) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useModalFocus(dialogRef, 'input');
  return (
    <div class="nq-wmap">
      <section
        ref={dialogRef}
        class="nq-win nq-wmap-box nq-menu-box nq-settings-box"
        role="dialog"
        aria-modal="true"
        aria-label={displayText(t('field.settingsMenu'))}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            onClose();
          }
        }}
      >
        <header class="nq-menu-head">
          <h2 class="nq-menu-title">
            <RubyLabel text={t('field.settingsMenu')} />
          </h2>
          <button type="button" class="nq-back nq-menu-back" onClick={onClose}>
            ← <RubyLabel text={t('ui.back')} />
          </button>
        </header>
        {(['bgmVolume', 'seVolume'] as const).map((key) => (
          <label style={{ display: 'block', margin: '1rem 0' }}>
            <RubyLabel text={t(key === 'bgmVolume' ? 'parent.bgm' : 'parent.se')} />{' '}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={game.settings[key]}
              onInput={(event) => onChange({ [key]: Number(event.currentTarget.value) })}
            />{' '}
            {Math.round(game.settings[key] * 100)}%
          </label>
        ))}
        <label>
          <RubyLabel text={t('field.movementSettings')} />{' '}
          <select
            value={game.settings.movementKeys ?? 'both'}
            onChange={(event) =>
              onChange({ movementKeys: event.currentTarget.value as 'both' | 'arrows' | 'wasd' })
            }
          >
            <option value="both">{displayText(t('field.movementBoth'))}</option>
            <option value="arrows">{displayText(t('field.movementArrows'))}</option>
            <option value="wasd">{displayText(t('field.movementWasd'))}</option>
          </select>
        </label>
      </section>
    </div>
  );
}
