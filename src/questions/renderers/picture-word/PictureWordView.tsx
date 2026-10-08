import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { RendererContext } from '../../contracts';
import { t } from '../../../ui/i18n';
import { RubyLabel } from '../../../ui/RubyLabel';
import { stripRuby } from '../../../ui/ruby';
import { Feedback } from '../shared/Feedback';
import { pictureUrl } from '../shared/pictures';
import { TimerBar } from '../shared/TimerBar';
import { MAX_MISSES, pictureWordScore, type PictureWordPayload } from './schema';

export interface PictureWordViewProps {
  ctx: RendererContext;
  payload: PictureWordPayload;
  /** カードの並び順（レンダラー側で決定論的にシャッフル済み） */
  order: string[];
  onDone: (r: { score: number; attempts: number; timedOut: boolean; picks: string[] }) => void;
}

type Phase = 'answering' | 'miss' | 'done';
type Ending = 'correct' | 'wrong' | 'timeout';

/** 絵を 見て、下の わくに 入る 英単語の カードを えらぶ。日本語訳は 出さない（GDD §4.2） */
export function PictureWordView({ ctx, payload, order, onDone }: PictureWordViewProps) {
  const words = useMemo(
    () => order.map((id) => payload.words.find((w) => w.id === id)!),
    [order, payload.words],
  );
  const answer = payload.words.find((w) => w.id === payload.answer)!;
  const prompt = payload.prompt ?? t('question.pictureWordPrompt');
  const [picks, setPicks] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('answering');
  const [ending, setEnding] = useState<Ending | null>(null);
  const [src, setSrc] = useState(() =>
    payload.image ? ctx.assets.image(payload.image) : pictureUrl(payload.picture!),
  );
  const picksRef = useRef<string[]>([]);
  const doneRef = useRef(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((id) => clearTimeout(id)), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const sayWord = () => {
    if (answer.audio) new Audio(ctx.assets.audio(answer.audio)).play().catch(() => ctx.speak(answer.text));
    else ctx.speak(answer.text);
  };

  const finish = (score: number, timedOut: boolean, kind: Ending) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase('done');
    setEnding(kind);
    const all = picksRef.current;
    // 正解の 単語を 見て・聞いてから 閉じる
    later(
      () => onDone({ score, attempts: all.length, timedOut, picks: all }),
      kind === 'correct' ? 1200 : 1600,
    );
  };

  const cancel = () => {
    doneRef.current = true;
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
    const all = picksRef.current;
    onDone({ score: 0, attempts: all.length, timedOut: true, picks: all });
  };

  const pick = (id: string) => {
    if (doneRef.current || phase !== 'answering' || picksRef.current.includes(id)) return;
    const all = [...picksRef.current, id];
    picksRef.current = all;
    setPicks(all);
    if (id === payload.answer) {
      sayWord();
      finish(pictureWordScore(all.length - 1), false, 'correct');
    } else if (all.length >= MAX_MISSES) {
      finish(0, false, 'wrong');
    } else {
      setPhase('miss');
      later(() => setPhase((p) => (p === 'miss' ? 'answering' : p)), 700);
    }
  };

  // キーボード 1〜4
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= words.length) pick(words[n - 1]!.id);
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

  const last = picks[picks.length - 1];
  const slot =
    phase === 'done'
      ? { state: ending === 'correct' ? 'correct' : 'reveal', text: answer.text }
      : phase === 'miss'
        ? { state: 'miss', text: payload.words.find((w) => w.id === last)?.text ?? '' }
        : { state: 'empty', text: '？' };

  return (
    <div class="nq-q nq-q-pw">
      <TimerBar
        ms={ctx.timeLimitMs}
        running={phase !== 'done'}
        onTimeout={() => finish(0, true, 'timeout')}
      />
      <div id="nq-question-prompt" class="nq-q-prompt">
        <RubyLabel text={prompt} grade={ctx.grade} as="p" />
        <button
          type="button"
          class="nq-btn nq-btn-speak"
          aria-label={t('question.speak')}
          onClick={() => ctx.speak(stripRuby(prompt, 'kana'))}
        >
          🔊
        </button>
      </div>
      <div class="nq-pw-stage">
        <div class="nq-pw-frame">
          <img
            class="nq-pw-picture"
            src={src}
            alt={t('question.pictureAlt')}
            onError={() => payload.picture && setSrc(pictureUrl(payload.picture))}
          />
        </div>
        <div class={`nq-pw-slot nq-pw-slot-${slot.state}`} lang="en" role="status" aria-live="polite">
          {slot.text}
        </div>
      </div>
      <div class={`nq-pw-words nq-pw-words-${words.length}`}>
        {words.map((w, i) => {
          const state =
            phase === 'done'
              ? w.id === payload.answer
                ? 'correct'
                : 'dim'
              : picks.includes(w.id)
                ? 'miss'
                : 'idle';
          return (
            <button
              key={w.id}
              type="button"
              class={`nq-btn nq-pw-card nq-pw-card-${state}`}
              aria-describedby="nq-question-prompt"
              disabled={phase !== 'answering' || picks.includes(w.id)}
              onClick={() => pick(w.id)}
            >
              <span class="nq-choice-key">{i + 1}</span>
              <span lang="en">{w.text}</span>
            </button>
          );
        })}
      </div>
      {phase === 'miss' && <Feedback kind="partial" />}
      {ending && <Feedback kind={ending} />}
    </div>
  );
}
