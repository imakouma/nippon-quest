import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { RendererContext } from '../../contracts';
import { t } from '../../../ui/i18n';
import { RubyLabel } from '../../../ui/RubyLabel';
import { stripRuby } from '../../../ui/ruby';
import { TimerBar } from '../shared/TimerBar';
import { Feedback } from '../shared/Feedback';
import type { ChoicePayload } from './schema';

export interface ChoiceViewProps {
  ctx: RendererContext;
  payload: ChoicePayload;
  /** 選択肢の並び順（レンダラー側で決定論的にシャッフル済み） */
  order: string[];
  onDone: (r: { score: number; attempts: number; timedOut: boolean; chosen: string | null }) => void;
}

export function ChoiceView({ ctx, payload, order, onDone }: ChoiceViewProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [phase, setPhase] = useState<'answering' | 'feedback'>('answering');
  const doneRef = useRef(false);
  const completionTimer = useRef<number | null>(null);
  const choices = useMemo(
    () => order.map((id) => payload.choices.find((c) => c.id === id)!),
    [order, payload.choices],
  );

  const finish = (id: string | null, timedOut: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setChosen(id);
    setPhase('feedback');
    const score = id === payload.answer ? 1 : 0;
    // 演出を見せてから閉じる（「おしい！」を読む時間）
    completionTimer.current = window.setTimeout(() => {
      completionTimer.current = null;
      onDone({ score, attempts: 1, timedOut, chosen: id });
    }, 900);
  };

  const cancel = () => {
    if (completionTimer.current !== null) window.clearTimeout(completionTimer.current);
    else if (doneRef.current) return;
    doneRef.current = true;
    completionTimer.current = null;
    onDone({ score: 0, attempts: 1, timedOut: true, chosen: null });
  };

  // キーボード 1〜4
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'answering') return;
      const n = Number(e.key);
      if (n >= 1 && n <= choices.length) finish(choices[n - 1]!.id, false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    const onAbort = () => cancel();
    ctx.signal?.addEventListener('abort', onAbort);
    if (ctx.signal?.aborted) onAbort();
    return () => ctx.signal?.removeEventListener('abort', onAbort);
  });

  const correct = chosen === payload.answer;
  // アルファベット 1〜2 もじ だけの 選択肢は、形が 見やすいよう 大きく
  const big = choices.every((c) => !c.image && /^[A-Za-z]{1,2}$/.test(c.text ?? ''));

  return (
    <div class="nq-q nq-q-choice">
      <TimerBar ms={ctx.timeLimitMs} running={phase === 'answering'} onTimeout={() => finish(null, true)} />
      <div id="nq-question-prompt" class="nq-q-prompt">
        {payload.promptImage && (
          <img class="nq-q-prompt-img" src={ctx.assets.image(payload.promptImage)} alt="" />
        )}
        <RubyLabel text={payload.prompt} grade={ctx.grade} as="p" />
        <button
          type="button"
          class="nq-btn nq-btn-speak"
          aria-label={t('question.speak')}
          onClick={() => {
            if (payload.promptAudio)
              new Audio(ctx.assets.audio(payload.promptAudio))
                .play()
                .catch(() => ctx.speak(stripRuby(payload.prompt, 'kana')));
            else ctx.speak(stripRuby(payload.prompt, 'kana'));
          }}
        >
          🔊
        </button>
      </div>
      <div class={`nq-q-choices nq-q-choices-${choices.length}${big ? ' nq-q-choices-big' : ''}`}>
        {choices.map((c, i) => {
          const state =
            phase === 'feedback'
              ? c.id === payload.answer
                ? 'correct'
                : c.id === chosen
                  ? 'chosen'
                  : 'dim'
              : 'idle';
          return (
            <button
              key={c.id}
              type="button"
              class={`nq-btn nq-choice nq-choice-${state}`}
              aria-label={!c.text ? t('question.choiceNumber', { n: i + 1 }) : undefined}
              aria-keyshortcuts={String(i + 1)}
              aria-describedby="nq-question-prompt"
              disabled={phase !== 'answering'}
              onClick={() => finish(c.id, false)}
            >
              <span class="nq-choice-key">{i + 1}</span>
              {c.image && <img src={ctx.assets.image(c.image)} alt="" />}
              {c.text && <RubyLabel text={c.text} grade={ctx.grade} />}
            </button>
          );
        })}
      </div>
      {phase === 'feedback' && (
        <Feedback kind={correct ? 'correct' : chosen === null ? 'timeout' : 'wrong'} />
      )}
    </div>
  );
}
