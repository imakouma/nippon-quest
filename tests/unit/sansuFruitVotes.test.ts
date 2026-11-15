import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import questions from '../../content/questions/sansu/g1/data/set-001.json';
import { choicePayloadSchema } from '../../src/questions/renderers/choice/schema';

describe('grade 1 fruit pictogram', () => {
  it('shows three apples, two oranges and one bunch of grapes, with matching answer and speech', () => {
    const question = questions.find((q) => q.id === 'sansu.g1.data.0001')!;
    const payload = choicePayloadSchema.parse(question.payload);
    expect(payload.prompt).not.toContain('●');
    expect(payload.promptImage).toBeTruthy();
    const svg = readFileSync(`assets/${payload.promptImage}`, 'utf8');
    for (const [fruit, count] of [
      ['apple', 3],
      ['orange', 2],
      ['grapes', 1],
    ] as const) {
      expect(svg.match(new RegExp(`<use href="#${fruit}"`, 'g'))).toHaveLength(count);
    }
    for (const choice of payload.choices) {
      expect(readFileSync(`assets/${choice.image}`, 'utf8')).toContain('<svg');
    }
    expect(payload.choices.find((c) => c.id === payload.answer)?.text).toBe('りんご');
    expect(payload.promptSpeech).toContain('りんごは 3にん、みかんは 2にん、ぶどうは 1にん');
  });
});
