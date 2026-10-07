import { useEffect, useRef, useState } from 'preact/hooks';
import type { DialogueLine } from '../dialogue';
import { t } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { TypedText, useTypewriter } from '../typewriter';
import { cutsceneAutoWaitMs } from './timing';
import './cutscene.css';

export type CutsceneKind = 'opening' | 'chapter' | 'arrival';

export interface CutsceneOverlayProps {
  lines: DialogueLine[];
  kind: CutsceneKind;
  heroName: string;
  fairyName: string;
  heroArt: string;
  fairyArt: string;
  onComplete: () => void;
}

export function CutsceneOverlay({
  lines,
  kind,
  heroName,
  fairyName,
  heroArt,
  fairyArt,
  onComplete,
}: CutsceneOverlayProps) {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const doneRef = useRef(false);
  const line = lines[Math.min(index, lines.length - 1)];
  const lineText = line?.text ?? '';
  const tw = useTypewriter(line ? index : null, lineText);
  const isLast = index >= lines.length - 1;
  const fairyActive = line?.speaker === fairyName;
  const heroActive = line?.speaker === heroName;

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete();
  };
  const advance = () => {
    if (!tw.done) {
      tw.complete();
      return;
    }
    if (isLast) finish();
    else setIndex((value) => value + 1);
  };

  const live = useRef({ advance, finish });
  live.current = { advance, finish };

  useEffect(() => {
    if (!auto || !tw.done) return;
    const timer = window.setTimeout(() => live.current.advance(), cutsceneAutoWaitMs(lineText));
    return () => window.clearTimeout(timer);
  }, [auto, index, lineText, tw.done]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ' || event.key.toLowerCase() === 'z') {
        live.current.advance();
        event.preventDefault();
      }
      if (event.key === 'Escape') {
        live.current.finish();
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!line) return null;
  const phase = Math.min(5, Math.floor((index / Math.max(1, lines.length - 1)) * 6));
  return (
    <section
      class={`nq-cutscene nq-cutscene-${kind} nq-cutscene-phase-${phase}`}
      aria-label={t('cutscene.sceneLabel')}
      data-cutscene-kind={kind}
      data-scene-index={index}
    >
      <div class="nq-cutscene-sky" aria-hidden="true">
        <i class="nq-cutscene-moon" />
        <i class="nq-cutscene-island nq-cutscene-island-a" />
        <i class="nq-cutscene-island nq-cutscene-island-b" />
        <i class="nq-cutscene-island nq-cutscene-island-c" />
        <span class="nq-cutscene-shards">✦ ◇ ✧ □ ✦ △</span>
        <span class={`nq-cutscene-character nq-cutscene-hero ${heroActive ? 'is-speaking' : ''}`}>
          <span class="nq-cutscene-character-light" />
          <span class="nq-cutscene-hero-sprite" style={{ backgroundImage: `url(${heroArt})` }} />
        </span>
        <span class={`nq-cutscene-character nq-cutscene-fairy ${fairyActive ? 'is-speaking' : ''}`}>
          <span class="nq-cutscene-character-light" />
          <img src={fairyArt} alt="" draggable={false} />
        </span>
        <span class="nq-cutscene-ground" />
        <span class="nq-cutscene-vignette" />
      </div>

      <div class="nq-cutscene-topbar">
        <span
          class="nq-cutscene-progress"
          aria-label={t('cutscene.progress', { now: index + 1, total: lines.length })}
        >
          {Array.from({ length: lines.length }, (_, i) => (
            <i key={i} class={i <= index ? 'is-on' : ''} />
          ))}
        </span>
        <button type="button" onClick={() => setAuto((value) => !value)}>
          {t(auto ? 'cutscene.autoOn' : 'cutscene.autoOff')}
        </button>
        <button type="button" onClick={finish}>
          {t('cutscene.skip')}
        </button>
      </div>

      <button
        type="button"
        class="nq-cutscene-advance"
        aria-label={t('cutscene.advance')}
        onClick={advance}
      />
      <div class={`nq-cutscene-dialogue ${!line.speaker ? 'is-narration' : ''}`}>
        {line.speaker && (
          <div class="nq-cutscene-name">
            <RubyLabel text={line.speaker} />
          </div>
        )}
        <p>
          <TypedText text={line.text} n={tw.n} />
        </p>
        <span class="nq-cutscene-mode">{auto ? t('cutscene.auto') : t('cutscene.manual')}</span>
        {tw.done && <span class="nq-cutscene-next">{isLast ? t('cutscene.begin') : '▼'}</span>}
      </div>
    </section>
  );
}
