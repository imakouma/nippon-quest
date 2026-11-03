import { z } from 'zod';

const exampleSchema = z.object({ word: z.string(), reading: z.string() }).strict();
const readingSchema = z.object({ reading: z.string(), examples: z.array(exampleSchema).min(1) }).strict();
const recordSchema = z
  .object({
    character: z.string().regex(/^\p{Script=Han}$/u, 'character は漢字1字にしてください'),
    grade: z.number().int().min(1, 'grade は1から6にしてください').max(6, 'grade は1から6にしてください'),
    onyomi: z.array(readingSchema),
    kunyomi: z.array(readingSchema),
    sourceIds: z.array(z.string().min(1)).min(1),
  })
  .strict();

export interface KanjiCanonicalValidationOptions {
  expectedByGrade: Record<string, string>;
  knownSourceIds: ReadonlySet<string>;
}

export function validateKanjiCanonicalData(
  input: unknown,
  options: KanjiCanonicalValidationOptions,
): string[] {
  const parsed = z.array(recordSchema).safeParse(input);
  if (!parsed.success) {
    return parsed.error.issues.map(
      (issue) => `${issue.path.length ? issue.path.join('.') : 'root'}: ${issue.message}`,
    );
  }

  const errors: string[] = [];
  const seen = new Set<string>();
  const expectedGrades = new Map<string, number>();
  for (const [grade, characters] of Object.entries(options.expectedByGrade)) {
    for (const character of characters) expectedGrades.set(character, Number(grade));
  }

  for (const record of parsed.data) {
    if (seen.has(record.character)) errors.push(`漢字「${record.character}」が重複しています`);
    seen.add(record.character);

    const expectedGrade = expectedGrades.get(record.character);
    if (expectedGrade === undefined) {
      errors.push(`漢字「${record.character}」が配当表にありません`);
    } else if (record.grade !== expectedGrade) {
      errors.push(`漢字「${record.character}」の学年は${record.grade}ですが、配当表では${expectedGrade}です`);
    }

    if (record.onyomi.length === 0 && record.kunyomi.length === 0) {
      errors.push(`漢字「${record.character}」には音読みか訓読みが必要です`);
    }

    for (const sourceId of record.sourceIds) {
      if (!options.knownSourceIds.has(sourceId)) {
        errors.push(`漢字「${record.character}」が未登録の出典「${sourceId}」を参照しています`);
      }
    }

    for (const [kind, readings] of [
      ['音読み', record.onyomi],
      ['訓読み', record.kunyomi],
    ] as const) {
      const pattern = kind === '音読み' ? /^[ァ-ヶー]+$/u : /^[ぁ-ゖー.]+$/u;
      const script = kind === '音読み' ? '片仮名' : '平仮名';
      for (const reading of readings) {
        if (!pattern.test(reading.reading)) {
          errors.push(`${kind}「${reading.reading}」は${script}で記録してください`);
        }
        for (const example of reading.examples) {
          if (!example.word.includes(record.character)) {
            errors.push(`用例「${example.word}」に対象漢字がありません`);
          }
          if (example.reading.trim() === '') errors.push(`用例「${example.word}」の読みが空です`);
          else if (example.reading !== reading.reading) {
            errors.push(`用例「${example.word}」の対象漢字の読みは「${reading.reading}」にしてください`);
          }
        }
      }
    }
  }

  for (const character of expectedGrades.keys()) {
    if (!seen.has(character)) errors.push(`配当表の漢字「${character}」が正規データにありません`);
  }
  return errors;
}
