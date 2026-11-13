import type { QuestionBase, QuestionRenderer } from '../../contracts';
import { createRng, freshSeed } from '../../../core/rng';
import { t } from '../../../ui/i18n';
import { choiceRenderer } from '../choice';
import { textInputRenderer } from '../text-input';
import { generateAddition } from './generate';
import { randomCalculationSchema } from './schema';

export function createAdditionQuestion(question: QuestionBase, seed: string) {
  const rule = randomCalculationSchema.parse(question.payload);
  const generated = generateAddition(rule, createRng(seed));
  const { left, right, answer, choices } = generated;
  const payload =
    rule.response === 'choice'
      ? {
          prompt: t('question.randomAddition.equation', { left, right }),
          choices: choices.map((value) => ({ id: `n${value}`, text: String(value) })),
          answer: `n${answer}`,
          shuffle: false,
        }
      : {
          prompt: t('question.randomAddition.inputPrompt'),
          template: t('question.randomAddition.template', { left, right }),
          answers: [String(answer)],
        };
  return {
    question: {
      ...question,
      type: rule.response,
      payload,
      explanation: t('question.randomAddition.explanation', { left, right, answer }),
    },
    detail: { seed, operation: rule.operation, ...generated, expression: `${left} + ${right}` },
  };
}

export const randomCalculationRenderer: QuestionRenderer = {
  type: 'random-calculation',
  schema: randomCalculationSchema,
  async mount(ctx) {
    const generated = createAdditionQuestion(ctx.question, freshSeed());
    // Registry applies the viewport once; delegate to the unwrapped renderer.
    const renderer = generated.question.type === 'choice' ? choiceRenderer : textInputRenderer;
    const result = await renderer.mount({ ...ctx, question: generated.question });
    return { ...result, detail: { ...result.detail, generated: generated.detail } };
  },
};
