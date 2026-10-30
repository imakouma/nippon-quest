import { z } from 'zod/v3';

export const kanjiTracePayloadSchema = z
  .object({
    mode: z.enum(['trace', 'reading']).default('trace'),
    kanji: z.string().length(1).describe('1文字の漢字'),
    reading: z.string().min(1).describe('読み（ひらがな）'),
    hintWord: z.string().min(1).optional().describe('ことばの例（RubyText）'),
    strokeCount: z.number().int().positive().optional().describe('画数（表示のみ）'),
    guideImage: z.string().min(1).optional().describe('お手本画像。省略時はフォントで描く'),
    choices: z.array(z.string().min(1)).min(2).max(6).optional(),
    answer: z.string().min(1).optional(),
  })
  .refine(
    (payload) =>
      payload.mode !== 'reading' || Boolean(payload.answer && payload.choices?.includes(payload.answer)),
    {
      path: ['answer'],
      message: 'reading では choices と、その中にある answer が ひつようです',
    },
  )
  .refine((payload) => !payload.choices || new Set(payload.choices).size === payload.choices.length, {
    path: ['choices'],
    message: 'choices が重複しています',
  });

export type KanjiTracePayload = z.infer<typeof kanjiTracePayloadSchema>;

export const TRACE_GRID = 48;
export const TRACE_FULL = 0.7;
export const TRACE_ZERO = 0.3;

export interface TracePoint {
  x: number;
  y: number;
}

export function rasterizeStrokes(strokes: TracePoint[][], grid = TRACE_GRID, radius = 2.5): Uint8Array {
  const mask = new Uint8Array(grid * grid);
  const stamp = (centerX: number, centerY: number) => {
    const edge = Math.ceil(radius);
    for (let y = Math.floor(centerY) - edge; y <= Math.ceil(centerY) + edge; y += 1) {
      for (let x = Math.floor(centerX) - edge; x <= Math.ceil(centerX) + edge; x += 1) {
        if (x < 0 || y < 0 || x >= grid || y >= grid) continue;
        if ((x + 0.5 - centerX) ** 2 + (y + 0.5 - centerY) ** 2 <= radius ** 2) mask[y * grid + x] = 1;
      }
    }
  };
  for (const stroke of strokes) {
    stroke.forEach((point, index) => {
      const previous = stroke[index - 1] ?? point;
      const steps = Math.max(1, Math.ceil(Math.hypot(point.x - previous.x, point.y - previous.y) * grid * 2));
      for (let step = 0; step <= steps; step += 1) {
        const progress = step / steps;
        stamp(
          (previous.x + (point.x - previous.x) * progress) * grid,
          (previous.y + (point.y - previous.y) * progress) * grid,
        );
      }
    });
  }
  return mask;
}

export function dilate(mask: Uint8Array, grid = TRACE_GRID, radius = 2): Uint8Array {
  const expanded = new Uint8Array(mask.length);
  for (let y = 0; y < grid; y += 1) {
    for (let x = 0; x < grid; x += 1) {
      if (!mask[y * grid + x]) continue;
      for (let deltaY = -radius; deltaY <= radius; deltaY += 1) {
        for (let deltaX = -radius; deltaX <= radius; deltaX += 1) {
          const nextX = x + deltaX;
          const nextY = y + deltaY;
          if (nextX >= 0 && nextY >= 0 && nextX < grid && nextY < grid) expanded[nextY * grid + nextX] = 1;
        }
      }
    }
  }
  return expanded;
}

export function coverage(source: Uint8Array, target: Uint8Array): number {
  let sourcePixels = 0;
  let coveredPixels = 0;
  for (let index = 0; index < source.length; index += 1) {
    if (!source[index]) continue;
    sourcePixels += 1;
    if (target[index]) coveredPixels += 1;
  }
  return sourcePixels === 0 ? 0 : coveredPixels / sourcePixels;
}

export function traceMatch(guide: Uint8Array, drawn: Uint8Array, grid = TRACE_GRID) {
  const precision = coverage(drawn, dilate(guide, grid));
  const recall = coverage(guide, dilate(drawn, grid));
  return { precision, recall, match: Math.min(precision, recall) };
}

export const traceScore = (match: number) =>
  Math.min(1, Math.max(0, (match - TRACE_ZERO) / (TRACE_FULL - TRACE_ZERO)));
