import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { RendererContext } from '../../contracts';
import { t } from '../../../ui/i18n';
import { RubyLabel } from '../../../ui/RubyLabel';
import { fractionSpeech } from '../../../ui/fraction';
import { stripRuby } from '../../../ui/ruby';
import { TimerBar } from '../shared/TimerBar';
import { Feedback } from '../shared/Feedback';
import { ReviewFeedback } from '../shared/ReviewFeedback';
import type { ChoicePayload } from './schema';

export interface ChoiceViewProps {
  ctx: RendererContext;
  payload: ChoicePayload;
  /** 選択肢の並び順（レンダラー側で決定論的にシャッフル済み） */
  order: string[];
  onDone: (r: {
    score: number;
    attempts: number;
    timedOut: boolean;
    chosen: string | null;
    answeredAt?: number;
  }) => void;
}

export function getChoicePromptSpeech(payload: ChoicePayload): string {
  return payload.promptSpeech ?? fractionSpeech(stripRuby(payload.prompt, 'kana'));
}

export function ChoiceView({ ctx, payload, order, onDone }: ChoiceViewProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [phase, setPhase] = useState<'answering' | 'feedback'>('answering');
  const doneRef = useRef(false);
  const completionTimer = useRef<number | null>(null);
  const completed = useRef(false);
  const answer = useRef<{
    score: number;
    attempts: number;
    timedOut: boolean;
    chosen: string | null;
    answeredAt?: number;
  } | null>(null);
  const review = ctx.question.subject === 'sansu' && ctx.question.grade <= 3;
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
    answer.current = {
      score,
      attempts: 1,
      timedOut,
      chosen: id,
      ...(review ? { answeredAt: performance.now() } : {}),
    };
    if (!review)
      completionTimer.current = window.setTimeout(() => {
        completionTimer.current = null;
        completed.current = true;
        onDone(answer.current!);
      }, 900);
  };

  const cancel = () => {
    if (completed.current) return;
    if (completionTimer.current !== null) window.clearTimeout(completionTimer.current);
    completed.current = true;
    doneRef.current = true;
    completionTimer.current = null;
    onDone({ score: 0, attempts: 1, timedOut: true, chosen: null });
  };

  // 表示順の数字キーで選択
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

  if (review && phase === 'feedback')
    return (
      <ReviewFeedback
        kind={correct ? 'correct' : chosen === null ? 'timeout' : 'wrong'}
        explanation={ctx.question.explanation}
        grade={ctx.grade}
        onNext={() => {
          if (completed.current) return;
          completed.current = true;
          onDone(answer.current!);
        }}
      />
    );

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
            const speech = getChoicePromptSpeech(payload);
            if (payload.promptAudio)
              new Audio(ctx.assets.audio(payload.promptAudio)).play().catch(() => ctx.speak(speech));
            else ctx.speak(speech);
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
              <span class="nq-choice-content">
                {c.image && <img src={ctx.assets.image(c.image)} alt="" />}
                {c.text && <RubyLabel text={c.text} grade={ctx.grade} />}
              </span>
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
