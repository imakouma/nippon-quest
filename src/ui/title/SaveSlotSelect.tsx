import { useEffect } from 'preact/hooks';
import type { SlotId, SlotSummary } from '../../core/state/slots';
import { useRef } from 'preact/hooks';
import { t } from '../i18n';
import { useModalFocus } from '../useModalFocus';
import './title.css';

export function SaveSlotSelect({
  mode,
  slots,
  onPick,
  onCancel,
}: {
  mode: 'new' | 'continue';
  slots: SlotSummary[];
  onPick: (slot: SlotId) => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useModalFocus(dialogRef, 'button:not([disabled])');
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      const buttons = [
        ...(dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? []),
      ];
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (current < 0 || buttons.length < 2) return;
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? buttons.length - 1
            : Math.min(buttons.length - 1, Math.max(0, current + (event.key === 'ArrowUp' ? -1 : 1)));
      if (next !== current) {
        event.preventDefault();
        buttons[next]?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <section
      ref={dialogRef}
      class="nq-win nq-save-slots"
      role="dialog"
      aria-modal="true"
      aria-label={t('saveSlots.title')}
      tabindex={-1}
    >
      <h2>{t(mode === 'new' ? 'saveSlots.newTitle' : 'saveSlots.continueTitle')}</h2>
      <div>
        {slots.map((slot) => (
          <button
            key={slot.slot}
            type="button"
            disabled={mode === 'continue' && !slot.exists}
            onClick={() => onPick(slot.slot)}
          >
            <strong>{t('saveSlots.slot', { n: slot.slot })}</strong>
            {slot.corrupted ? (
              <span>{t('saveSlots.corrupted')}</span>
            ) : slot.exists ? (
              <span>
                Lv{slot.level} ・ ★{slot.signs ?? 0}
              </span>
            ) : (
              <span>{t('saveSlots.empty')}</span>
            )}
            {slot.recovered && <small>{t('saveSlots.recovered')}</small>}
            {mode === 'new' && (slot.exists || slot.corrupted) && <small>{t('saveSlots.overwrite')}</small>}
          </button>
        ))}
      </div>
      <p class="nq-save-slots-hint">{t('saveSlots.keyboardHint')}</p>
      <button type="button" class="nq-save-slots-back" onClick={onCancel}>
        {t('ui.back')}
      </button>
    </section>
  );
}
