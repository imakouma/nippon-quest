import { z } from 'zod';
export const mapTapPayloadSchema = z
  .object({
    prompt: z.string().min(1),
    image: z.string().min(1),
    hotspots: z
      .array(
        z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100), label: z.string().min(1) }),
      )
      .min(2),
    answerIndex: z.number().int().nonnegative(),
    radius: z.number().positive().max(20).default(9),
  })
  .refine((p) => p.answerIndex < p.hotspots.length, 'answerIndex が範囲外');
export type MapTapPayload = z.infer<typeof mapTapPayloadSchema>;
export const mapTapScore = (p: MapTapPayload, x: number, y: number) => {
  const h = p.hotspots[p.answerIndex]!;
  return Math.hypot(x - h.x, y - h.y) <= p.radius ? 1 : 0;
};
