import { useRef, useState } from 'preact/hooks';
import type { GameState } from '../../core/state/schema';
import { t } from '../i18n';
import { displayText } from '../ruby';
import { RubyLabel } from '../RubyLabel';
import { PixelIcon } from '../PixelIcon';
import { useModalFocus } from '../useModalFocus';
import { DirectionPad } from './DirectionPad';
import { VirtualStick, type VirtualStickDirection } from './VirtualStick';
import { SettingsPracticeField } from './SettingsPracticeField';

type Settings = GameState['settings'];
const idleLayout = { x: 0, y: 100, size: 100, opacity: 42 };

export function SettingsOverlay({
  game,
  onChange,
  onClose,
}: {
  game: GameState;
  onChange: (settings: Partial<Settings>) => void;
  onClose: () => void;
}) {
  const [page, setPage] = useState<'controls' | 'sound'>();
  const [playing, setPlaying] = useState(false);
  const direction = useRef<VirtualStickDirection | null>(null);
  const setDirection = (next: VirtualStickDirection | null) => {
    direction.current = next;
  };
  const pointer = useRef<number>();
  const dialogRef = useRef<HTMLElement>(null);
  useModalFocus(dialogRef, page ? '.nq-settings-back' : '.nq-settings-card');
  const back = () => {
    direction.current = null;
    setPlaying(false);
    if (page) setPage(undefined);
    else onClose();
  };
  const control = game.settings.movementControl ?? 'stick';
  const defaults = { ...idleLayout, opacity: control === 'stick' ? 42 : 100 };
  const layout = game.settings.touchLayout ?? defaults;
  const updateLayout = (key: keyof typeof layout, value: number) =>
    onChange({
      touchLayout: { ...layout, [key]: value },
    });
  const movePad = (event: PointerEvent & { currentTarget: HTMLDivElement }) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const percent = (offset: number, length: number) =>
      Math.round(Math.min(1, Math.max(0, offset / length)) * 100);
    onChange({
      touchLayout: {
        ...layout,
        x: percent(event.clientX - bounds.left, bounds.width),
        y: percent(event.clientY - bounds.top, bounds.height),
      },
    });
  };
  return (
    <div class="nq-wmap">
      <section
        ref={dialogRef}
        class="nq-win nq-wmap-box nq-menu-box nq-settings-box"
        role="dialog"
        aria-modal="true"
        aria-label={displayText(t('field.settingsMenu'))}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          event.stopPropagation();
          back();
        }}
      >
        <header class="nq-menu-head">
          <h2 class="nq-menu-title">
            <RubyLabel
              text={t(
                page === 'controls'
                  ? 'field.settingsControls'
                  : page === 'sound'
                    ? 'field.settingsSound'
                    : 'field.settingsMenu',
              )}
            />
          </h2>
          <button type="button" class="nq-back nq-menu-back nq-settings-back" onClick={back}>
            ← <RubyLabel text={t('ui.back')} />
          </button>
        </header>
        {!page && (
          <div class="nq-menu-home nq-settings-cards">
            <button type="button" class="nq-menu-card nq-settings-card" onClick={() => setPage('controls')}>
              <span class="nq-menu-card-icon">
                <span class="nq-settings-cross" aria-hidden="true" />
              </span>
              <span class="nq-menu-card-label">
                <RubyLabel text={t('field.settingsControls')} />
              </span>
            </button>
            <button
              type="button"
              class="nq-menu-card nq-settings-card nq-menu-card-monsters"
              onClick={() => setPage('sound')}
            >
              <span class="nq-menu-card-icon">
                <PixelIcon name="speaker" scale={5} />
              </span>
              <span class="nq-menu-card-label">
                <RubyLabel text={t('field.settingsSound')} />
              </span>
            </button>
          </div>
        )}
        {page === 'sound' && (
          <div class="nq-settings-options">
            {(['bgmVolume', 'seVolume'] as const).map((key) => (
              <label class="nq-settings-row" key={key}>
                <RubyLabel text={t(key === 'bgmVolume' ? 'parent.bgm' : 'parent.se')} />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={game.settings[key]}
                  onInput={(event) => onChange({ [key]: Number(event.currentTarget.value) })}
                />
                <output>{Math.round(game.settings[key] * 100)}%</output>
              </label>
            ))}
          </div>
        )}
        {page === 'controls' && (
          <div class="nq-settings-controls">
            <div class="nq-settings-practice">
              <div
                class="nq-settings-preview"
                onPointerDown={(event) => {
                  if (playing || !event.isPrimary) return;
                  pointer.current = event.pointerId;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  movePad(event);
                }}
                onPointerMove={(event) => {
                  if (event.pointerId === pointer.current) movePad(event);
                }}
                onLostPointerCapture={() => {
                  pointer.current = undefined;
                }}
                style={{
                  '--touch-x': `${layout.x}%`,
                  '--touch-y': `${layout.y}%`,
                  '--touch-size': `${(15 * layout.size) / 100}cqw`,
                  '--touch-opacity': layout.opacity / 100,
                }}
              >
                <SettingsPracticeField appearance={game.player.appearance} direction={direction} />
                <div inert={!playing}>
                  {control === 'stick' ? (
                    <VirtualStick label={t('field.moveStick')} onDirection={setDirection} />
                  ) : (
                    <DirectionPad onDirection={setDirection} />
                  )}
                </div>
              </div>
              <button
                type="button"
                class="nq-back"
                aria-pressed={playing}
                onClick={() => {
                  direction.current = null;
                  setPlaying(!playing);
                }}
              >
                <RubyLabel text={t(playing ? 'field.settingsPlacePad' : 'field.settingsTryWalking')} />
              </button>
            </div>
            <div class="nq-settings-options">
              <div class="nq-settings-pick">
                {(['stick', 'dpad'] as const).map((mode) => (
                  <button
                    type="button"
                    class="nq-back"
                    key={mode}
                    aria-pressed={control === mode}
                    onClick={() => {
                      direction.current = null;
                      onChange({ movementControl: mode });
                    }}
                  >
                    <RubyLabel text={t(mode === 'stick' ? 'field.settingsStick' : 'field.settingsDpad')} />
                  </button>
                ))}
              </div>
              {(
                [
                  ['x', 'field.settingsHorizontal', 0, 100],
                  ['y', 'field.settingsVertical', 0, 100],
                  ['size', 'field.settingsSize', 70, 150],
                  ['opacity', 'field.settingsOpacity', 2, 100],
                ] as const
              ).map(([key, label, min, max]) => (
                <label class="nq-settings-row" key={key}>
                  <RubyLabel text={t(label)} />
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={layout[key]}
                    onInput={(event) => updateLayout(key, Number(event.currentTarget.value))}
                  />
                  <output>{layout[key]}%</output>
                </label>
              ))}
              <div class="nq-settings-pick">
                <select
                  aria-label={displayText(t('field.movementSettings'))}
                  value={game.settings.movementKeys ?? 'both'}
                  onChange={(event) =>
                    onChange({ movementKeys: event.currentTarget.value as Settings['movementKeys'] })
                  }
                >
                  <option value="both">{displayText(t('field.movementBoth'))}</option>
                  <option value="arrows">{displayText(t('field.movementArrows'))}</option>
                  <option value="wasd">{displayText(t('field.movementWasd'))}</option>
                </select>
                <button type="button" class="nq-back" onClick={() => onChange({ touchLayout: undefined })}>
                  <RubyLabel text={t('field.settingsReset')} />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
