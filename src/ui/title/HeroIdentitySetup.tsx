import { useState } from 'preact/hooks';
import { t } from '../i18n';
import './title.css';

export interface HeroIdentity {
  name: string;
  appearance: { hair: number; skin: number; cloth: number };
}

type LookPart = keyof HeroIdentity['appearance'];

export function HeroIdentitySetup({
  initialAppearance,
  onComplete,
}: {
  initialAppearance: HeroIdentity['appearance'];
  onComplete: (identity: HeroIdentity) => void;
}) {
  const [name, setName] = useState('');
  const [appearance, setAppearance] = useState(initialAppearance);
  const cycle = (part: LookPart, direction: number) =>
    setAppearance({ ...appearance, [part]: (appearance[part] + direction + 3) % 3 });
  const submit = (event: Event) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (cleanName) onComplete({ name: cleanName, appearance });
  };

  return (
    <div class="nq-identity-backdrop">
      <form class="nq-win nq-identity" aria-label={t('newGame.identityTitle')} onSubmit={submit}>
        <p class="nq-identity-fairy">{t('newGame.identityAsk')}</p>
        <label class="nq-identity-name">
          <span>{t('newGame.name')}</span>
          <input
            autofocus
            aria-label={t('newGame.name')}
            value={name}
            maxlength={6}
            onInput={(event) => setName((event.target as HTMLInputElement).value)}
          />
        </label>
        <div class="nq-identity-look">
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
                <button type="button" onClick={() => cycle(part, -1)}>
                  ◀
                </button>
                <output>{appearance[part] + 1}/3</output>
                <button type="button" onClick={() => cycle(part, 1)}>
                  ▶
                </button>
              </div>
            ))}
          </div>
        </div>
        <button type="submit" disabled={!name.trim()}>
          {t('newGame.identityConfirm')}
        </button>
      </form>
    </div>
  );
}
