import { useEffect, useState } from 'preact/hooks';
import type { Grade } from '../../questions/contracts';
import type { NewGameOptions } from '../../core/state/newGame';
import { MVP_REGIONS, type MvpRegionId } from '../../core/regions/mvp';
import { SubjectChip } from '../chips';
import { t } from '../i18n';
import './title.css';

export function NewGameSetup({
  onCancel,
  onStart,
}: {
  onCancel: () => void;
  onStart: (options: NewGameOptions) => void;
}) {
  const [grade, setGrade] = useState<Grade>(1);
  const [startRegion, setStartRegion] = useState<MvpRegionId>('tohoku');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const submit = (event: Event) => {
    event.preventDefault();
    onStart({ grade, startRegion });
  };

  return (
    <form class="nq-win nq-new-game" onSubmit={submit}>
      <h2>{t('newGame.title')}</h2>
      <div class="nq-new-game-top nq-new-game-simple">
        <label>
          <span>{t('newGame.grade')}</span>
          <select
            autofocus
            aria-label={t('newGame.grade')}
            value={grade}
            onChange={(event) => setGrade(Number((event.target as HTMLSelectElement).value) as Grade)}
          >
            {[1, 2].map((value) => (
              <option value={value}>{t('newGame.gradeValue', { n: value })}</option>
            ))}
          </select>
        </label>
      </div>

      <section class="nq-new-game-regions nq-new-game-subjects" aria-label={t('newGame.subject')}>
        <h3>{t('newGame.subject')}</h3>
        <div>
          {MVP_REGIONS.map((entry) => (
            <button
              type="button"
              class={startRegion === entry.id ? 'nq-region-selected' : ''}
              aria-pressed={startRegion === entry.id}
              onClick={() => setStartRegion(entry.id)}
            >
              <strong>{entry.shortName}</strong>
              <span class="nq-region-check" aria-hidden="true">
                ✓
              </span>
              <span class="nq-region-subjects">
                {entry.subjects.map((subject) => (
                  <SubjectChip key={subject} subject={subject} />
                ))}
              </span>
              <small>{entry.description}</small>
            </button>
          ))}
        </div>
      </section>

      <div class="nq-new-game-actions">
        <button type="button" onClick={onCancel}>
          {t('ui.back')}
        </button>
        <button type="submit">{t('ui.start')}</button>
      </div>
    </form>
  );
}
