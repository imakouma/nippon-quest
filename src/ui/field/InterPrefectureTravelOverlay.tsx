import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { useModalFocus } from '../useModalFocus';
import './interPrefectureTravel.css';

type TravelPhase = 'confirm' | 'moving' | 'arrived';

/** UI は Scene 実装へ依存せず、表示に必要な読み取り専用モデルだけを受け取る。 */
export interface InterPrefectureTravelView {
  icon: string;
  title: string;
  routeLabel: string;
  departureLabel: string;
  destinationLabel: string;
  confirm: string;
  depart: string;
  arrive: string;
  skip: string;
}

export interface InterPrefectureTravelOverlayProps {
  presentation: InterPrefectureTravelView;
  onComplete: () => void;
  onCancel: () => void;
  durationMs?: number;
}

const DEFAULT_DURATION_MS = 1_400;
const ARRIVAL_HOLD_MS = 480;
const REDUCED_PHASE_MS = 180;

/** 実在交通の確認と短い移動を、描画負荷の小さい共通オーバーレイで見せる。 */
export function InterPrefectureTravelOverlay({
  presentation,
  onComplete,
  onCancel,
  durationMs = DEFAULT_DURATION_MS,
}: InterPrefectureTravelOverlayProps) {
  const [phase, setPhase] = useState<TravelPhase>('confirm');
  const dialogRef = useRef<HTMLElement>(null);
  const doneRef = useRef(false);
  const callbacks = useRef({ onComplete, onCancel });
  callbacks.current = { onComplete, onCancel };

  const finish = (result: 'complete' | 'cancel') => {
    if (doneRef.current) return;
    doneRef.current = true;
    callbacks.current[result === 'complete' ? 'onComplete' : 'onCancel']();
  };
  const start = () => {
    if (!doneRef.current) setPhase('moving');
  };

  const live = useRef({ phase, start, finish });
  live.current = { phase, start, finish };

  useEffect(() => {
    if (phase === 'confirm') return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const delay = reduced ? REDUCED_PHASE_MS : phase === 'moving' ? Math.max(0, durationMs) : ARRIVAL_HOLD_MS;
    const timer = window.setTimeout(() => {
      if (phase === 'moving') setPhase('arrived');
      else live.current.finish('complete');
    }, delay);
    return () => window.clearTimeout(timer);
  }, [durationMs, phase]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const state = live.current;
      const nativeControl =
        event.target instanceof HTMLElement &&
        event.target.closest('button, input, select, textarea, [contenteditable="true"]');
      const decide = event.key === 'Enter' || event.key === ' ' || event.key === 'z' || event.key === 'Z';
      const back = event.key === 'Escape' || event.key === 'x' || event.key === 'X';
      if (nativeControl && (event.key === 'Enter' || event.key === ' ')) return;
      if (!decide && !back) return;

      if (state.phase === 'confirm') {
        if (back) state.finish('cancel');
        else state.start();
      } else {
        state.finish('complete');
      }
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useModalFocus(dialogRef, phase === 'confirm' ? '.nq-travel-confirm' : '.nq-travel-skip');

  const inMotion = phase !== 'confirm';
  const status = phase === 'arrived' ? presentation.arrive : presentation.depart;
  return (
    <section
      ref={dialogRef}
      class={`nq-interpref-travel nq-interpref-travel-${phase}`}
      role="dialog"
      aria-modal="true"
      aria-label={displayText(presentation.title)}
      aria-describedby="nq-travel-status"
      tabIndex={-1}
      data-phase={phase}
      onClick={inMotion ? () => finish('complete') : undefined}
    >
      <div class="nq-win nq-travel-panel" onClick={(event) => phase === 'confirm' && event.stopPropagation()}>
        <div
          class={`nq-travel-icon nq-travel-icon-${presentation.icon}`}
          data-travel-icon={presentation.icon}
          aria-hidden="true"
        >
          <i class="nq-travel-structure" />
          <i class="nq-travel-vehicle" />
        </div>

        <div class="nq-travel-copy">
          <h2 aria-label={displayText(presentation.title)}>
            <RubyLabel text={presentation.title} />
          </h2>
          <p class="nq-travel-route" aria-label={displayText(presentation.routeLabel)}>
            <RubyLabel text={presentation.routeLabel} />
          </p>
          <div
            class="nq-travel-endpoints"
            aria-label={`${displayText(presentation.departureLabel)} から ${displayText(presentation.destinationLabel)}`}
          >
            <RubyLabel text={presentation.departureLabel} />
            <span class="nq-travel-arrow" aria-hidden="true">
              →
            </span>
            <RubyLabel text={presentation.destinationLabel} />
          </div>
        </div>

        {phase === 'confirm' ? (
          <>
            <p
              id="nq-travel-status"
              class="nq-travel-status"
              aria-label={displayText(presentation.confirm)}
              aria-live="polite"
            >
              <RubyLabel text={presentation.confirm} />
            </p>
            <div class="nq-travel-actions">
              <button type="button" class="nq-travel-cancel" onClick={() => finish('cancel')}>
                {t('ui.no')}
              </button>
              <button type="button" class="nq-travel-confirm nq-focus" onClick={start}>
                {t('ui.yes')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              class="nq-travel-progress"
              role="progressbar"
              aria-label={displayText(status)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={phase === 'arrived' ? 100 : 50}
            >
              <i />
            </div>
            <p
              id="nq-travel-status"
              class="nq-travel-status"
              aria-label={displayText(status)}
              aria-live="polite"
            >
              <RubyLabel text={status} />
            </p>
            <button type="button" class="nq-travel-skip" onClick={() => finish('complete')}>
              <RubyLabel text={presentation.skip} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
