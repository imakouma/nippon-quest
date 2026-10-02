import { useEffect, useState } from 'preact/hooks';
import type { Grade } from '../../questions/contracts';
import type { NewGameOptions } from '../../core/state/newGame';
import { t } from '../i18n';
import './title.css';

const STARTERS = [
  { id: 'aomori-nebutan', name: 'ネブタン', element: 'hino', mark: '炎' },
  { id: 'aomori-magurodo', name: 'マグロード', element: 'mizu', mark: '波' },
  { id: 'aomori-ringoron', name: 'リンゴロン', element: 'mori', mark: '葉' },
] as const;

type Appearance = NonNullable<NewGameOptions['appearance']>;
type LookPart = keyof Appearance;

export function NewGameSetup({
  onCancel,
  onStart,
}: {
  onCancel: () => void;
  onStart: (options: NewGameOptions) => void;
}) {
  const [name, setName] = useState('ハル');
  const [grade, setGrade] = useState<Grade>(1);
  const [appearance, setAppearance] = useState<Appearance>({ hair: 0, skin: 0, cloth: 0 });
  const [starter, setStarter] = useState<(typeof STARTERS)[number]['id']>('aomori-nebutan');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const cycle = (part: LookPart, direction: number) =>
    setAppearance({ ...appearance, [part]: (appearance[part] + direction + 3) % 3 });

  const submit = (event: Event) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    onStart({ name: cleanName, grade, appearance, starterMonsterId: starter });
  };

  return (
    <form class="nq-win nq-new-game" onSubmit={submit}>
      <h2>{t('newGame.title')}</h2>
      <div class="nq-new-game-top">
        <label>
          <span>{t('newGame.name')}</span>
          <input
            aria-label={t('newGame.name')}
            autofocus
            value={name}
            maxlength={6}
            onInput={(event) => setName((event.target as HTMLInputElement).value)}
          />
        </label>
        <label>
          <span>{t('newGame.grade')}</span>
          <select
            aria-label={t('newGame.grade')}
            value={grade}
            onChange={(event) => setGrade(Number((event.target as HTMLSelectElement).value) as Grade)}
          >
            {[1, 2, 3, 4, 5, 6].map((value) => (
              <option value={value}>{t('newGame.gradeValue', { n: value })}</option>
            ))}
          </select>
        </label>
      </div>

      <section class="nq-new-game-look">
        <h3>{t('newGame.look')}</h3>
        <div
          class={`nq-avatar nq-avatar-hair-${appearance.hair} nq-avatar-skin-${appearance.skin} nq-avatar-cloth-${appearance.cloth}`}
          aria-label={t('newGame.lookPreview')}
        >
          <span class="nq-avatar-hair" />
          <span class="nq-avatar-face" />
          <span class="nq-avatar-cloth" />
        </div>
        <div class="nq-look-controls">
          {(['hair', 'skin', 'cloth'] as const).map((part) => (
            <div>
              <span>{t(`newGame.${part}`)}</span>
              <button
                type="button"
                aria-label={t('newGame.previous', { part: t(`newGame.${part}`) })}
                onClick={() => cycle(part, -1)}
              >
                ◀
              </button>
              <output>{appearance[part] + 1}/3</output>
              <button
                type="button"
                aria-label={t('newGame.next', { part: t(`newGame.${part}`) })}
                onClick={() => cycle(part, 1)}
              >
                ▶
              </button>
            </div>
          ))}
        </div>
      </section>

      <section class="nq-new-game-starters">
        <h3>{t('newGame.starter')}</h3>
        <div>
          {STARTERS.map((monster) => (
            <button
              type="button"
              class={`nq-starter nq-starter-${monster.element}${starter === monster.id ? ' nq-starter-selected' : ''}`}
              aria-pressed={starter === monster.id}
              onClick={() => setStarter(monster.id)}
            >
              <span class="nq-starter-mark">{monster.mark}</span>
              <strong>{monster.name}</strong>
              <small>{t(`elements.${monster.element}`)}</small>
            </button>
          ))}
        </div>
      </section>

      <div class="nq-new-game-actions">
        <button type="button" onClick={onCancel}>
          {t('ui.back')}
        </button>
        <button type="submit" disabled={!name.trim()}>
          {t('ui.start')}
        </button>
      </div>
    </form>
  );
}
