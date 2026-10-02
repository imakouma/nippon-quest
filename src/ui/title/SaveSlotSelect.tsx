import { useEffect } from 'preact/hooks';
import type { SlotId, SlotSummary } from '../../core/state/save';
import { t } from '../i18n';
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
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <section class="nq-win nq-save-slots" aria-label={t('saveSlots.title')}>
      <h2>{t(mode === 'new' ? 'saveSlots.newTitle' : 'saveSlots.continueTitle')}</h2>
      <div>
        {slots.map((slot) => (
          <button
            type="button"
            disabled={mode === 'continue' && !slot.exists}
            onClick={() => onPick(slot.slot)}
          >
            <strong>{t('saveSlots.slot', { n: slot.slot })}</strong>
            {slot.corrupted ? (
              <span>{t('saveSlots.corrupted')}</span>
            ) : slot.exists ? (
              <span>
                {slot.name} ・ Lv{slot.level} ・ ★{slot.signs ?? 0}
              </span>
            ) : (
              <span>{t('saveSlots.empty')}</span>
            )}
            {slot.recovered && <small>{t('saveSlots.recovered')}</small>}
            {mode === 'new' && (slot.exists || slot.corrupted) && <small>{t('saveSlots.overwrite')}</small>}
          </button>
        ))}
      </div>
      <button type="button" class="nq-save-slots-back" onClick={onCancel}>
        {t('ui.back')}
      </button>
    </section>
  );
}
