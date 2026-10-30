import { useEffect, useRef, useState } from 'preact/hooks';

import { t } from '../../../ui/i18n';
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
  payload: KanjiTracePayload;
  ctx: RendererContext;
  disabled: boolean;
  onSubmit: (score: number, match: number) => void;
}

export function TraceCanvas({ payload, ctx, disabled, onSubmit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<TracePoint[][]>([]);
  const drawing = useRef(false);
  const image = useRef<HTMLImageElement | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const paint = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(42, 26, 5, 0.22)';
    drawGuide(context, canvas.width, payload.kanji, image.current);
    context.strokeStyle = '#1d3f8f';
    context.lineWidth = canvas.width / 10;
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
    strokes.current = [];
    setHasInk(false);
    paint();
  };
  const submit = () => {
    const guide = guideMask(payload.kanji, image.current);
    const match = guide ? traceMatch(guide, rasterizeStrokes(strokes.current)).match : 1;
    onSubmit(traceScore(match), match);
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
          if (disabled) return;
          drawing.current = true;
          canvasRef.current?.setPointerCapture?.(event.pointerId);
          strokes.current.push([point(event)]);
          setHasInk(true);
          paint();
        }}
        onPointerMove={(event) => {
          if (!drawing.current || disabled) return;
          strokes.current.at(-1)!.push(point(event));
          paint();
        }}
        onPointerUp={() => (drawing.current = false)}
        onPointerCancel={() => (drawing.current = false)}
        onPointerLeave={() => (drawing.current = false)}
      />
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
