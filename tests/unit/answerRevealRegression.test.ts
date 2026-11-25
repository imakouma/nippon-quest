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

it('asks for the mass of a solution without printing it in the prompt or illustration', () => {
  const questions = JSON.parse(
    readFileSync('content/questions/rika/g5/legacy-sci-5-8/set-001.json', 'utf8'),
  ) as {
    id: string;
    payload: { prompt: string; promptImage: string; promptImageAlt: string; answers: string[] };
  }[];
  const question = questions.find((item) => item.id === 'legacy.rika.g5.sci-5-8.143d35c53ce7')!;
  const answer = question.payload.answers[0]!;
  const illustration = readFileSync(`assets/${question.payload.promptImage}`, 'utf8');
  expect(answer).toBe('115');
  expect(question.payload.prompt).toContain('100 g');
  expect(question.payload.prompt).toContain('15 g');
  expect(question.payload.prompt).not.toContain(answer);
  expect(question.payload.promptImageAlt).not.toContain(answer);
  expect(illustration).not.toMatch(/>\s*115\s*g\s*</i);
  expect(illustration).toContain('100 g');
  expect(illustration).toContain('15 g');
});

it('describes clock hands without revealing the answer in accessible image text', () => {
  const questions = JSON.parse(
    readFileSync('content/questions/sansu/g2/legacy-math-2-5/set-001.json', 'utf8'),
  ) as { id: string; payload: { promptImage: string; promptImageAlt: string; answers: string[] } }[];
  const question = questions.find((item) => item.id === 'legacy.sansu.g2.math-2-5.c7023dee205f')!;
  const illustration = readFileSync(`assets/${question.payload.promptImage}`, 'utf8');
  expect(question.payload.promptImageAlt).toContain('長い針は9');
  expect(question.payload.promptImageAlt).not.toContain(question.payload.answers[0]);
  expect(illustration).toContain('<title>短い針は3と4の間、長い針は9を指している時計</title>');
});

it('describes the groups of circles without stating the total', () => {
  const questions = JSON.parse(
    readFileSync('content/questions/sansu/g1/kazu-100/balance-001.json', 'utf8'),
  ) as {
    id: string;
    payload: { promptImage: string; promptImageAlt: string; answers: string[] };
  }[];
  const question = questions.find((item) => item.id === 'sansu.g1.balance.count-10')!;
  const illustration = readFileSync(`assets/${question.payload.promptImage}`, 'utf8');
  expect(question.payload.promptImageAlt).toContain('５こずつ');
  expect(question.payload.promptImageAlt).not.toMatch(/10|１０/);
  expect(illustration).not.toContain('まるが 10こ あります');
  expect(illustration.match(/<circle\b/g)).toHaveLength(10);
  expect(question.payload.answers).toEqual(['10']);
});
