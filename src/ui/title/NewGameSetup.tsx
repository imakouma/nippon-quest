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
  // 保存前のプレイヤー情報に見えないよう、名前・学年・相棒は未選択で始める。
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade | undefined>();
  const [appearance, setAppearance] = useState<Appearance>({ hair: 0, skin: 0, cloth: 0 });
  const [starter, setStarter] = useState<(typeof STARTERS)[number]['id']>();

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
    if (!cleanName || !grade || !starter) return;
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
            placeholder={t('newGame.namePlaceholder')}
            onInput={(event) => setName((event.target as HTMLInputElement).value)}
          />
        </label>
        <label>
          <span>{t('newGame.grade')}</span>
          <select
            aria-label={t('newGame.grade')}
            value={grade ?? ''}
            onChange={(event) => setGrade(Number((event.target as HTMLSelectElement).value) as Grade)}
          >
            <option value="" disabled>
              {t('newGame.gradePlaceholder')}
            </option>
            {[1, 2, 3, 4, 5, 6].map((value) => (
              <option value={value}>{t('newGame.gradeValue', { n: value })}</option>
            ))}
          </select>
        </label>
      </div>

      <section class="nq-new-game-look">
        <h3>{t('newGame.look')}</h3>
        <div class="nq-look-preview">
          <div
            class={`nq-avatar nq-avatar-hair-${appearance.hair} nq-avatar-skin-${appearance.skin} nq-avatar-cloth-${appearance.cloth}`}
            aria-label={t('newGame.lookPreview')}
          >
            <span class="nq-avatar-shadow" />
            <span class="nq-avatar-bag" />
            <span class="nq-avatar-legs" />
            <span class="nq-avatar-cloth" />
            <span class="nq-avatar-neck" />
            <span class="nq-avatar-face" />
            <span class="nq-avatar-ear" />
            <span class="nq-avatar-eye nq-avatar-eye-left" />
            <span class="nq-avatar-eye nq-avatar-eye-right" />
            <span class="nq-avatar-hair nq-avatar-hair-back" />
            <span class="nq-avatar-hair nq-avatar-hair-front" />
            <span class="nq-avatar-cap" />
            <span class="nq-avatar-badge" />
          </div>
        </div>
        <div class="nq-look-controls">
          {(['hair', 'skin', 'cloth'] as const).map((part) => (
            <div>
              <span>{t(`newGame.${part}`)}</span>
              <div class="nq-look-picker">
                <button
                  type="button"
                  class="nq-look-arrow nq-look-arrow-prev"
                  aria-label={t('newGame.previous', { part: t(`newGame.${part}`) })}
                  onClick={() => cycle(part, -1)}
                />
                <span class="nq-look-dots" aria-hidden="true">
                  {[0, 1, 2].map((value) => (
                    <i
                      class={appearance[part] === value ? 'nq-look-dot nq-look-dot-active' : 'nq-look-dot'}
                    />
                  ))}
                </span>
                <button
                  type="button"
                  class="nq-look-arrow nq-look-arrow-next"
                  aria-label={t('newGame.next', { part: t(`newGame.${part}`) })}
                  onClick={() => cycle(part, 1)}
                />
              </div>
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
        <button type="submit" disabled={!name.trim() || !grade || !starter}>
          {t('ui.start')}
        </button>
      </div>
    </form>
  );
}
