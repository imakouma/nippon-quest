import { useState } from 'preact/hooks';
import type { StoryCompanionId } from '../../core/progression/storyCompanion';
import { RubyLabel } from '../RubyLabel';
import { t } from '../i18n';

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

  return (
    <div class="nq-story-choice" role="dialog" aria-label={t('field.musubiTitle')}>
      <div class="nq-win nq-story-choice-panel">
        <h2>{t('field.musubiTitle')}</h2>
        <p>{t('field.musubiHint')}</p>
        <div class="nq-musubi-list" role="list" aria-label={t('field.musubiList')}>
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
