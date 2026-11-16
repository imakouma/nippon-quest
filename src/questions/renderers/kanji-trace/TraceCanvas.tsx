import { useEffect, useRef, useState } from 'preact/hooks';

import { t } from '../../../ui/i18n';
import { RubyLabel } from '../../../ui/RubyLabel';
import {
  assessWriting,
  gradeOneWriting,
  type WritingAssessment,
  type WritingData,
} from './writingAssessment';
import type { RendererContext } from '../../contracts';
import {
  rasterizeStrokes,
  traceMatch,
  traceScore,
  TRACE_GRID,
  type KanjiTracePayload,
  type TracePoint,
} from './schema';

const FONT = "'UD Digi Kyokasho N-R', 'YuKyokasho', 'Hiragino Mincho ProN', 'Yu Mincho', serif";
const CANVAS_SIZE = 240;

function drawGuide(
  context: CanvasRenderingContext2D,
  size: number,
  kanji: string,
  image: HTMLImageElement | null,
) {
  if (image?.complete && image.naturalWidth > 0) {
    context.drawImage(image, 0, 0, size, size);
    return;
  }
  context.font = `${Math.round(size * 0.82)}px ${FONT}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(kanji, size / 2, size * 0.53);
}

function guideMask(kanji: string, image: HTMLImageElement | null): Uint8Array | null {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = TRACE_GRID;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = '#000';
  drawGuide(context, TRACE_GRID, kanji, image);
  const pixels = context.getImageData(0, 0, TRACE_GRID, TRACE_GRID).data;
  return Uint8Array.from({ length: TRACE_GRID * TRACE_GRID }, (_, index) =>
    pixels[index * 4 + 3]! > 64 ? 1 : 0,
  );
}

interface Props {
  writing?: WritingData;
  payload: KanjiTracePayload;
  ctx: RendererContext;
  disabled: boolean;
  onAttempt: () => void;
  onSubmit: (score: number, match: number) => void;
}

export function TraceCanvas({
  payload,
  ctx,
  disabled,
  onAttempt,
  onSubmit,
  writing = gradeOneWriting,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<TracePoint[][]>([]);
  const pointer = useRef<number | null>(null);
  const [assessment, setAssessment] = useState<WritingAssessment | null>(null);
  const reference = writing[payload.kanji];
  const image = useRef<HTMLImageElement | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const paint = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(42, 26, 5, 0.22)';
    if (reference) {
      context.strokeStyle = 'rgba(42, 26, 5, 0.28)';
      context.lineWidth = canvas.width / 40;
      context.lineCap = context.lineJoin = 'round';
      for (const stroke of reference) {
        context.beginPath();
        stroke.points.forEach((point, index) =>
          index
            ? context.lineTo(point.x * canvas.width, point.y * canvas.height)
            : context.moveTo(point.x * canvas.width, point.y * canvas.height),
        );
        context.stroke();
      }
    } else drawGuide(context, canvas.width, payload.kanji, image.current);
    context.strokeStyle = '#1d3f8f';
    context.lineWidth = canvas.width / 30;
    context.lineCap = context.lineJoin = 'round';
    for (const stroke of strokes.current) {
      context.beginPath();
      stroke.forEach((point, index) =>
        index
          ? context.lineTo(point.x * canvas.width, point.y * canvas.height)
          : context.moveTo(point.x * canvas.width, point.y * canvas.height),
      );
      if (stroke.length === 1)
        context.lineTo(stroke[0]!.x * canvas.width + 0.1, stroke[0]!.y * canvas.height);
      context.stroke();
    }
  };

  useEffect(() => {
    if (!payload.guideImage) {
      paint();
      return;
    }
    const nextImage = new Image();
    nextImage.onload = nextImage.onerror = paint;
    nextImage.src = ctx.assets.image(payload.guideImage);
    image.current = nextImage;
    paint();
    return () => {
      nextImage.onload = null;
      nextImage.onerror = null;
    };
  }, []);

  const point = (event: PointerEvent): TracePoint => {
    const bounds = canvasRef.current!.getBoundingClientRect();
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    return {
      x: clamp((event.clientX - bounds.left) / (bounds.width || 1)),
      y: clamp((event.clientY - bounds.top) / (bounds.height || 1)),
    };
  };

  const clear = () => {
    pointer.current = null;
    setAssessment(null);
    strokes.current = [];
    setHasInk(false);
    paint();
  };
  const submit = () => {
    if (pointer.current !== null) return;
    onAttempt();
    if (reference) {
      const next = assessWriting(payload.kanji, strokes.current, writing);
      setAssessment(next);
      if (next.score === 1) onSubmit(1, 1);
      return;
    }
    const guide = guideMask(payload.kanji, image.current);
    const match = guide ? traceMatch(guide, rasterizeStrokes(strokes.current)).match : 0;
    onSubmit(traceScore(match), match);
  };

  const cancelStroke = (event: PointerEvent) => {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    strokes.current.pop();
    setHasInk(strokes.current.length > 0);
    paint();
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        class="nq-kt-canvas"
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        aria-label={t('question.kanjiTraceCanvas', { kanji: payload.kanji })}
        aria-describedby="nq-question-prompt"
        onPointerDown={(event) => {
          if (disabled || pointer.current !== null || event.button !== 0) return;
          pointer.current = event.pointerId;
          setAssessment(null);
          canvasRef.current?.setPointerCapture?.(event.pointerId);
          strokes.current.push([point(event)]);
          setHasInk(true);
          paint();
        }}
        onPointerMove={(event) => {
          if (pointer.current !== event.pointerId || disabled) return;
          const samples = event.getCoalescedEvents?.();
          strokes.current.at(-1)!.push(...(samples?.length ? samples : [event]).map(point));
          paint();
        }}
        onPointerUp={(event) => {
          if (pointer.current !== event.pointerId) return;
          strokes.current.at(-1)?.push(point(event));
          pointer.current = null;
          paint();
        }}
        onPointerCancel={cancelStroke}
        onLostPointerCapture={cancelStroke}
      />
      {reference && (
        <div role="status" aria-live="polite">
          <RubyLabel
            as="p"
            class="nq-kt-hint"
            grade={ctx.grade}
            text={
              assessment?.issue
                ? t(`question.kanjiWriting.${assessment.issue}`, {
                    n: assessment.stroke ?? 1,
                    count: reference.length,
                  })
                : t('question.kanjiWriting.guide', { count: reference.length })
            }
          />
        </div>
      )}
      <div class="nq-kt-actions">
        <button type="button" class="nq-btn" disabled={disabled || !hasInk} onClick={clear}>
          {t('question.kanjiTraceClear')}
        </button>
        <button type="button" class="nq-btn nq-kt-submit" disabled={disabled || !hasInk} onClick={submit}>
          {t('question.kanjiTraceDone')}
        </button>
      </div>
    </>
  );
}
