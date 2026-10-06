import { useEffect, useRef, useState } from 'preact/hooks';
import type { Grade } from '../../questions/contracts';
import type { NewGameOptions } from '../../core/state/newGame';
import {
  HERO_CLOTH,
  HERO_H,
  HERO_HAIR,
  HERO_SKIN,
  HERO_W,
  heroLook,
  walkFrame,
  walkSheet,
} from '../../rendering/characters';
import { t } from '../i18n';
import './title.css';

type Appearance = NonNullable<NewGameOptions['appearance']>;
type LookPart = keyof Appearance;

const LOOK_COLORS = { hair: HERO_HAIR, skin: HERO_SKIN, cloth: HERO_CLOTH } as const;

function AvatarPreview({ appearance }: { appearance: Appearance }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const sheet = walkSheet(heroLook(appearance), true);
    const frame = walkFrame('down', 1);
    context.clearRect(0, 0, HERO_W, HERO_H);
    context.imageSmoothingEnabled = false;
    context.drawImage(
      sheet,
      (frame % 3) * HERO_W,
      Math.floor(frame / 3) * HERO_H,
      HERO_W,
      HERO_H,
      0,
      0,
      HERO_W,
      HERO_H,
    );
  }, [appearance.hair, appearance.skin, appearance.cloth]);

  return (
    <canvas
      ref={canvasRef}
      class="nq-avatar-preview"
      width={HERO_W}
      height={HERO_H}
      aria-label={t('newGame.lookPreview')}
    />
  );
}

export function NewGameSetup({
  onCancel,
  onStart,
}: {
  onCancel: () => void;
  onStart: (options: NewGameOptions) => void;
}) {
  // 保存前のプレイヤー情報に見えないよう、名前・学年は未選択で始める。
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade | undefined>();
  const [appearance, setAppearance] = useState<Appearance>({ hair: 0, skin: 0, cloth: 0 });

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
    setAppearance((current) => ({
      ...current,
      [part]: (current[part] + direction + 3) % 3,
    }));

  const submit = (event: Event) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || !grade) return;
    onStart({ name: cleanName, grade, appearance });
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
              <option key={value} value={value}>
                {t('newGame.gradeValue', { n: value })}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section class="nq-new-game-look">
        <h3>{t('newGame.look')}</h3>
        <div class="nq-look-preview">
          <AvatarPreview appearance={appearance} />
        </div>
        <div class="nq-look-controls">
          {(['hair', 'skin', 'cloth'] as const).map((part) => (
            <div key={part}>
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
                      key={value}
                      class={appearance[part] === value ? 'nq-look-dot nq-look-dot-active' : 'nq-look-dot'}
                      style={{ backgroundColor: LOOK_COLORS[part][value] }}
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

      <div class="nq-new-game-actions">
        <button type="button" onClick={onCancel}>
          {t('ui.back')}
        </button>
        <button type="submit" disabled={!name.trim() || !grade}>
          {t('ui.start')}
        </button>
      </div>
    </form>
  );
}
