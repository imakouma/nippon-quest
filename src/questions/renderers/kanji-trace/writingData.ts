import { z } from 'zod/v3';
import grades from '../../../../content/i18n/kanji-grades.json';
import { gradeOneWriting, type WritingData } from './writingAssessment';

const coordinate = z.number().int().min(-10000).max(10000);
const packedSchema = z.object({
  coordinateScale: z.literal(10000),
  characters: z.record(
    z
      .array(
        z.object({
          type: z.string(),
          points: z.array(z.tuple([coordinate, coordinate])).length(64),
        }),
      )
      .min(1),
  ),
});
const loaded = new Map<string, WritingData>();

export async function loadWriting(kanji: string): Promise<WritingData> {
  const assigned = Object.entries(grades.byGrade).find(([, characters]) => characters.includes(kanji));
  if (!assigned || assigned[0] === '1') return gradeOneWriting;
  const [grade, characters] = assigned;
  const cached = loaded.get(grade);
  if (cached) return cached;
  const urls = import.meta.glob<string>('../../../../content/kanji/grade-[2-6]-strokes.json', {
    eager: true,
    query: '?url',
    import: 'default',
  });
  const url = urls[`../../../../content/kanji/grade-${grade}-strokes.json`];
  if (!url) throw new Error(`Missing handwriting asset for grade ${grade}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Handwriting data: HTTP ${response.status}`);
  const data = packedSchema.parse(await response.json());
  if (
    Object.keys(data.characters).length !== characters.length ||
    [...characters].some((c) => !Object.hasOwn(data.characters, c))
  )
    throw new Error(`Incomplete handwriting data for grade ${grade}`);
  const writing = Object.fromEntries(
    Object.entries(data.characters).map(([character, strokes]) => [
      character,
      strokes.map((stroke) => {
        let x = 0,
          y = 0;
        return {
          type: stroke.type,
          points: stroke.points.map((point) => {
            x += point[0];
            y += point[1];
            if (x < 0 || y < 0 || x > data.coordinateScale || y > data.coordinateScale)
              throw new Error(`Invalid handwriting coordinates: ${character}`);
            return { x: x / data.coordinateScale, y: y / data.coordinateScale };
          }),
        };
      }),
    ]),
  );
  loaded.set(grade, writing);
  return writing;
}
