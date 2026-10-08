import { useEffect, useRef, useState } from 'preact/hooks';
import type { Grade } from '../../questions/contracts';
import type { NewGameOptions } from '../../core/state/newGame';
import { UNNAMED_HERO } from '../../core/state/newGame';
import {
  HERO_CLOTH,
  HERO_H,
  HERO_HAIR,
  HERO_HAIR_STYLES,
  HERO_EYE_STYLES,
  HERO_SKIN,
  HERO_W,
  heroLook,
  walkFrame,
  walkSheet,
} from '../../rendering/characters';
import { t } from '../i18n';
import { useModalFocus } from '../useModalFocus';
import './title.css';

type Appearance = NonNullable<NewGameOptions['appearance']>;
type LookPart = keyof Appearance;

const LOOK_COLORS = { hair: HERO_HAIR, skin: HERO_SKIN, cloth: HERO_CLOTH } as const;
const COLOR_PARTS = ['hair', 'skin', 'cloth'] as const;
const SHAPE_PARTS = [
  { part: 'hairStyle', count: HERO_HAIR_STYLES },
  { part: 'eyes', count: HERO_EYE_STYLES },
] as const;

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
  }, [appearance.hair, appearance.skin, appearance.cloth, appearance.hairStyle, appearance.eyes]);

  return (
    <canvas
      ref={canvasRef}
      class="nq-avatar-preview"
      width={HERO_W}
      height={HERO_H}
      role="img"
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
  const [grade, setGrade] = useState<Grade>(1);
  const [appearance, setAppearance] = useState<Appearance>({
    hair: 0,
    skin: 0,
    cloth: 0,
    hairStyle: 0,
    eyes: 0,
  });
  const dialogRef = useRef<HTMLFormElement>(null);
  useModalFocus(dialogRef, 'select');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const optionCount = (part: LookPart) =>
    part === 'hairStyle' ? HERO_HAIR_STYLES : part === 'eyes' ? HERO_EYE_STYLES : LOOK_COLORS[part].length;
  const cycle = (part: LookPart, direction: number) =>
    setAppearance((current) => ({
      ...current,
      [part]: ((current[part] ?? 0) + direction + optionCount(part)) % optionCount(part),
    }));
  const choose = (part: LookPart, value: number) =>
    setAppearance((current) => ({ ...current, [part]: value }));

  const submit = (event: Event) => {
    event.preventDefault();
    onStart({ name: UNNAMED_HERO, grade, appearance });
  };

  return (
    <form
      ref={dialogRef}
      class="nq-win nq-new-game"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nq-new-game-title"
      onSubmit={submit}
    >
      <h2 id="nq-new-game-title">{t('newGame.title')}</h2>
      <div class="nq-new-game-top">
        <label>
          <span>{t('newGame.grade')}</span>
          <select
            aria-label={t('newGame.grade')}
            value={grade}
            onChange={(event) => setGrade(Number((event.target as HTMLSelectElement).value) as Grade)}
          >
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
          {COLOR_PARTS.map((part) => (
            <div key={part}>
              <span>{t(`newGame.${part}`)}</span>
              <div class="nq-look-picker">
                <button
                  type="button"
                  class="nq-look-arrow nq-look-arrow-prev"
                  aria-label={t('newGame.previous', { part: t(`newGame.${part}`) })}
                  onClick={() => cycle(part, -1)}
                />
                <span class="nq-look-options">
                  {LOOK_COLORS[part].map((color, value) => (
                    <button
                      type="button"
                      key={value}
                      class={
                        appearance[part] === value ? 'nq-look-choice nq-look-choice-active' : 'nq-look-choice'
                      }
                      style={{ backgroundColor: color }}
                      aria-label={t('newGame.option', { part: t(`newGame.${part}`), n: value + 1 })}
                      aria-pressed={appearance[part] === value}
                      onClick={() => choose(part, value)}
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
          <div class="nq-look-shapes">
            {SHAPE_PARTS.map(({ part, count }) => (
              <div key={part}>
                <span>{t(`newGame.${part}`)}</span>
                <div class="nq-look-picker">
                  <button
                    type="button"
                    class="nq-look-arrow nq-look-arrow-prev"
                    aria-label={t('newGame.previous', { part: t(`newGame.${part}`) })}
                    onClick={() => cycle(part, -1)}
                  />
                  <span class="nq-look-options">
                    {Array.from({ length: count }, (_, value) => (
                      <button
                        type="button"
                        key={value}
                        class={
                          (appearance[part] ?? 0) === value
                            ? 'nq-look-shape nq-look-choice-active'
                            : 'nq-look-shape'
                        }
                        aria-label={t('newGame.option', { part: t(`newGame.${part}`), n: value + 1 })}
                        aria-pressed={(appearance[part] ?? 0) === value}
                        onClick={() => choose(part, value)}
                      >
                        {value + 1}
                      </button>
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
