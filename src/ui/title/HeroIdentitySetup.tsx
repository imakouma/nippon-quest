import { useState } from 'preact/hooks';
import { t } from '../i18n';
import './title.css';

export interface HeroIdentity {
  name: string;
  appearance: { hair: number; skin: number; cloth: number };
}

export function HeroIdentitySetup({
  initialAppearance,
  onComplete,
}: {
  initialAppearance: HeroIdentity['appearance'];
  onComplete: (identity: HeroIdentity) => void;
}) {
  const [name, setName] = useState('');
  const [appearance, setAppearance] = useState(initialAppearance);
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
          <div class="nq-avatar-stage">
            <div
              class={`nq-avatar nq-avatar-hair-${appearance.hair} nq-avatar-skin-${appearance.skin} nq-avatar-cloth-${appearance.cloth}`}
              role="img"
              aria-label={t('newGame.lookPreview')}
            >
              <span class="nq-avatar-shadow" />
              <span class="nq-avatar-leg nq-avatar-leg-left" />
              <span class="nq-avatar-leg nq-avatar-leg-right" />
              <span class="nq-avatar-body" />
              <span class="nq-avatar-arm nq-avatar-arm-left" />
              <span class="nq-avatar-arm nq-avatar-arm-right" />
              <span class="nq-avatar-head" />
              <span class="nq-avatar-hair" />
              <span class="nq-avatar-eye nq-avatar-eye-left" />
              <span class="nq-avatar-eye nq-avatar-eye-right" />
              <span class="nq-avatar-scarf" />
            </div>
            <small>{t('newGame.lookPreview')}</small>
          </div>
          <div class="nq-look-controls">
            {(['hair', 'skin', 'cloth'] as const).map((part) => (
              <fieldset>
                <legend>{t(`newGame.${part}`)}</legend>
                {[0, 1, 2].map((value) => (
                  <button
                    type="button"
                    class={`nq-look-choice nq-look-${part}-${value}`}
                    aria-label={`${t(`newGame.${part}`)} ${value + 1}`}
                    aria-pressed={appearance[part] === value}
                    onClick={() => setAppearance({ ...appearance, [part]: value })}
                  >
                    <span aria-hidden="true" />
                    {appearance[part] === value && <b aria-hidden="true">✓</b>}
                  </button>
                ))}
              </fieldset>
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
