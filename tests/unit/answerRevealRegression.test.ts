import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';

const readingIds = [
  'kokugo.g1.kanji-onyomi.0060',
  'kokugo.g2.kanji-kunyomi.0009',
  'kokugo.g2.kanji-onyomi.0131',
  'kokugo.g2.kanji-onyomi.0120',
  'kokugo.g2.kanji-onyomi.0155',
  'kokugo.g3.kanji-kunyomi.0192',
  'kokugo.g3.kanji-onyomi.0075',
  'kokugo.g3.kanji-onyomi.0087',
  'kokugo.g3.kanji-onyomi.0056',
  'kokugo.g4.kanji-kunyomi.0025',
  'kokugo.g4.kanji-onyomi.0041',
  'kokugo.g4.kanji-onyomi.0167',
  'kokugo.g5.kanji-onyomi.0116',
  'kokugo.g5.kanji-onyomi.0039',
  'kokugo.g5.kanji-onyomi.0051',
  'kokugo.g6.kanji-onyomi.0085',
  'kokugo.g6.kanji-onyomi.0047',
  'kokugo.g6.kanji-onyomi.0179',
];

it('does not reveal the answer or highlight extra kanji in the reviewed reading questions', () => {
  const questions = readdirSync('content/questions/kokugo', { recursive: true })
    .filter((file) => String(file).endsWith('.json'))
    .flatMap(
      (file) =>
        JSON.parse(readFileSync(`content/questions/kokugo/${file}`, 'utf8')) as {
          id: string;
          payload: { prompt: string; answers?: string[] };
        }[],
    )
    .filter((question) => readingIds.includes(question.id));

  expect(questions).toHaveLength(readingIds.length);
  for (const question of questions) {
    expect(question.payload.prompt, question.id).not.toContain(question.payload.answers![0]);
    expect(question.payload.prompt.match(/\p{Script=Han}/gu), question.id).toHaveLength(1);
  }
});
