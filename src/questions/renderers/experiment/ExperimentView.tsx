import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { RendererContext } from '../../contracts';
import { t } from '../../../ui/i18n';
import { RubyLabel } from '../../../ui/RubyLabel';
import { stripRuby } from '../../../ui/ruby';
import { Feedback } from '../shared/Feedback';
import { TimerBar } from '../shared/TimerBar';
import { evaluateExpression } from './expression';
import type { ExperimentPayload } from './schema';

interface Props {
  ctx: RendererContext;
  payload: ExperimentPayload;
  onDone: (result: { score: number; timedOut: boolean; prediction: string | null; runs: number }) => void;
}

type Phase = 'predict' | 'operate' | 'result' | 'done';

export function ExperimentView({ ctx, payload, onDone }: Props) {
  const initialValues = useMemo(
    () =>
      Object.fromEntries(
        payload.controls.map((control) => [control.id, control.type === 'slider' ? control.min : 0]),
      ),
    [payload.controls],
  );
  const [phase, setPhase] = useState<Phase>('predict');
  const [prediction, setPrediction] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, number>>(initialValues);
  const [runs, setRuns] = useState<number[]>([]);
  const runsRef = useRef<number[]>([]);
  const doneRef = useRef(false);
  const timers = useRef<number[]>([]);
  const outcome = runs[runs.length - 1];
  const predictionCorrect = prediction === payload.predict.answer;

  useEffect(() => () => timers.current.forEach((timer) => clearTimeout(timer)), []);
  const finish = (timedOut: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase('done');
    const score = timedOut ? 0 : predictionCorrect ? 1 : 0.5;
    timers.current.push(
      window.setTimeout(() => onDone({ score, timedOut, prediction, runs: runsRef.current.length }), 1100),
    );
  };

  const cancel = () => {
    doneRef.current = true;
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current = [];
    onDone({ score: 0, timedOut: true, prediction, runs: runsRef.current.length });
  };

  const run = () => {
    let result: number;
    try {
      result = evaluateExpression(payload.outcome.formula, values);
    } catch {
      finish(true);
      return;
    }
    const nextRuns = [...runs, Math.round(result * 100) / 100];
    runsRef.current = nextRuns;
    setRuns(nextRuns);
    setPhase('result');
    if (nextRuns.length >= payload.requiredRuns)
      timers.current.push(window.setTimeout(() => finish(false), 1500));
  };

  useEffect(() => {
    const onAbort = () => cancel();
    ctx.signal?.addEventListener('abort', onAbort);
    if (ctx.signal?.aborted) onAbort();
    return () => ctx.signal?.removeEventListener('abort', onAbort);
  });

  const [visualMin, visualMax] = payload.outcome.visualRange;
  const visualPercent =
    outcome === undefined
      ? 0
      : Math.max(0, Math.min(100, ((outcome - visualMin) / (visualMax - visualMin)) * 100));

  return (
    <div class="nq-q nq-q-experiment">
      <TimerBar ms={ctx.timeLimitMs} running={phase !== 'done'} onTimeout={() => finish(true)} />
      <div id="nq-question-prompt" class="nq-q-prompt">
        <RubyLabel text={payload.title} grade={ctx.grade} as="p" />
        <button
          type="button"
          class="nq-btn nq-btn-speak"
          aria-label={t('question.speak')}
          onClick={() => ctx.speak(stripRuby(payload.title, 'kana'))}
        >
          🔊
        </button>
      </div>

      {phase === 'predict' && (
        <section class="nq-exp-panel" aria-labelledby="nq-exp-step">
          <span id="nq-exp-step" class="nq-exp-step">
            1/3 {t('question.experimentPredict')}
          </span>
          <RubyLabel id="nq-exp-predict-prompt" text={payload.predict.prompt} grade={ctx.grade} as="p" />
          <div class="nq-exp-choices">
            {payload.predict.choices.map((choice) => (
              <button
                type="button"
                class={`nq-btn${prediction === choice.id ? ' nq-exp-selected' : ''}`}
                aria-pressed={prediction === choice.id}
                aria-describedby="nq-exp-predict-prompt"
                onClick={() => setPrediction(choice.id)}
              >
                <RubyLabel text={choice.text} grade={ctx.grade} />
              </button>
            ))}
          </div>
          <button
            type="button"
            class="nq-btn nq-exp-next"
            disabled={!prediction}
            onClick={() => setPhase('operate')}
          >
            {t('question.experimentTry')}
          </button>
        </section>
      )}

      {phase === 'operate' && (
        <section class="nq-exp-panel" aria-labelledby="nq-exp-step">
          <span id="nq-exp-step" class="nq-exp-step">
            2/3 {t('question.experimentOperate')}
          </span>
          <div class="nq-exp-controls">
            {payload.controls.map((control) => (
              <label class="nq-exp-control">
                <RubyLabel text={control.label} grade={ctx.grade} />
                {control.type === 'slider' ? (
                  <>
                    <input
                      type="range"
                      aria-label={stripRuby(control.label, 'kana')}
                      aria-describedby="nq-question-prompt"
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      value={values[control.id]}
                      onInput={(event) =>
                        setValues({
                          ...values,
                          [control.id]: Number((event.target as HTMLInputElement).value),
                        })
                      }
                    />
                    <output
                      aria-live="polite"
                      aria-label={`${stripRuby(control.label, 'kana')} ${values[control.id]}${control.unit ?? ''}`}
                    >
                      {values[control.id]}
                      {control.unit ?? ''}
                    </output>
                  </>
                ) : (
                  <button
                    type="button"
                    class={`nq-btn nq-exp-toggle${values[control.id] ? ' nq-exp-toggle-on' : ''}`}
                    aria-pressed={Boolean(values[control.id])}
                    aria-describedby="nq-question-prompt"
                    onClick={() => setValues({ ...values, [control.id]: values[control.id] ? 0 : 1 })}
                  >
                    {values[control.id]
                      ? (control.onLabel ?? t('question.experimentOn'))
                      : (control.offLabel ?? t('question.experimentOff'))}
                  </button>
                )}
              </label>
            ))}
          </div>
          <button type="button" class="nq-btn nq-exp-next" onClick={run}>
            {t('question.experimentRun')}
          </button>
        </section>
      )}

      {(phase === 'result' || phase === 'done') && outcome !== undefined && (
        <section class="nq-exp-panel" aria-labelledby="nq-exp-step">
          <span id="nq-exp-step" class="nq-exp-step">
            3/3 {t('question.experimentResult')}
          </span>
          <div class={`nq-exp-visual nq-exp-${payload.outcome.visual}`} aria-hidden="true">
            <span style={{ height: `${visualPercent}%` }} />
          </div>
          <RubyLabel text={payload.outcome.label} grade={ctx.grade} as="p" />
          <output
            class="nq-exp-outcome"
            role="status"
            aria-live="polite"
            aria-label={`${stripRuby(payload.outcome.label, 'kana')} ${outcome}${payload.outcome.unit}`}
          >
            {outcome}
            {payload.outcome.unit}
          </output>
          {phase === 'result' && runs.length < payload.requiredRuns && (
            <button type="button" class="nq-btn nq-exp-next" onClick={() => setPhase('operate')}>
              {t('question.experimentAgain')}（{runs.length}/{payload.requiredRuns}）
            </button>
          )}
        </section>
      )}
      {phase === 'done' && <Feedback kind={predictionCorrect ? 'correct' : 'partial'} />}
    </div>
  );
}
