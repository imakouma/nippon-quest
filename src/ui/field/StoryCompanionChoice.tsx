import { useEffect, useRef, useState } from 'preact/hooks';
import type { StoryCompanionId } from '../../core/progression/storyCompanion';
import { RubyLabel } from '../RubyLabel';
import { t } from '../i18n';
import { useModalFocus } from '../useModalFocus';

export interface StoryCompanionOption {
  id: StoryCompanionId;
  name: string;
  element: string;
  description: string;
  art: string;
}

export function StoryCompanionChoice({
  options,
  onChoose,
  onCancel,
}: {
  options: StoryCompanionOption[];
  onChoose: (id: StoryCompanionId) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<StoryCompanionId | null>(null);
  const current = options.find((option) => option.id === selected);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocus(dialogRef, '.nq-musubi-card');
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!['Escape', 'x', 'X'].includes(event.key)) return;
      event.preventDefault();
      onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      ref={dialogRef}
      class="nq-story-choice"
      role="dialog"
      aria-modal="true"
      aria-label={t('field.musubiTitle')}
      tabindex={-1}
    >
      <div class="nq-win nq-story-choice-panel">
        <h2>{t('field.musubiTitle')}</h2>
        <p>{t('field.musubiHint')}</p>
        <div class="nq-musubi-list" role="group" aria-label={t('field.musubiList')}>
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              class={`nq-musubi-card nq-musubi-${option.element}${selected === option.id ? ' nq-musubi-selected' : ''}`}
              aria-pressed={selected === option.id}
              onClick={() => setSelected(option.id)}
            >
              <span class="nq-musubi-orb" aria-hidden="true">
                <i />
              </span>
              <img src={option.art} alt="" />
              <strong>
                <RubyLabel text={option.name} />
              </strong>
              <small>{t(`elements.${option.element}`)}</small>
            </button>
          ))}
        </div>
        <div class="nq-musubi-detail" aria-live="polite">
          {current ? <RubyLabel text={current.description} /> : t('field.musubiSelectHint')}
        </div>
        <div class="nq-story-choice-actions">
          <button type="button" onClick={onCancel}>
            {t('ui.back')}
          </button>
          <button type="button" disabled={!selected} onClick={() => selected && onChoose(selected)}>
            {t('field.musubiChoose')}
          </button>
        </div>
      </div>
    </div>
  );
}
