import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { QuestionBase } from '../../src/questions/contracts';
import { questionHasAnswerContext } from '../../src/questions/engine/questionQuality';

function choice(prompt: string, promptImage?: string): QuestionBase {
  return {
    id: 'test.choice',
    type: 'choice',
    subject: 'sansu',
    grade: 3,
    unit: 'test',
    payload: {
      prompt,
      promptImage,
      choices: [
        { id: 'a', text: '1km' },
        { id: 'b', text: '100m' },
      ],
      answer: 'a',
    },
  } as QuestionBase;
}

describe('choice answer context', () => {
  it('rejects a bare instruction that refers to a missing calculation', () => {
    expect(questionHasAnswerContext(choice('次の長さの計算を しましょう。'))).toBe(false);
  });
  it('restores both length calculations from their explanations', () => {
    const questions = JSON.parse(
      readFileSync('content/questions/sansu/g3/legacy-math-3-9/set-001.json', 'utf8'),
    ) as QuestionBase[];
    for (const [id, expression] of [
      ['2d54955c2bba', '3km200m + 800m'],
      ['fe60b183f57a', '600m + 400m'],
    ] as const) {
      const question = questions.find((item) => item.id.endsWith(id))!;
      expect(question.payload).toMatchObject({ prompt: expect.stringContaining(expression) });
      expect(questionHasAnswerContext(question)).toBe(true);
    }
  });
  it('accepts a restored expression, a prompt image, and a concept question', () => {
    expect(questionHasAnswerContext(choice('次の長さの計算を しましょう。 600m + 400m'))).toBe(true);
    expect(questionHasAnswerContext(choice('次の長さの計算を しましょう。', 'questions/example.png'))).toBe(
      true,
    );
    expect(questionHasAnswerContext(choice('キロメートルを あらわしているものは、どれでしょう。'))).toBe(
      true,
    );
  });
});
