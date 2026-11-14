import type { QuestionBase, QuestionRenderer } from '../../contracts';
import { createRng, freshSeed } from '../../../shared/rng';
import { t } from '../../../ui/i18n';
import { choiceRenderer } from '../choice';
import { textInputRenderer } from '../text-input';
import { generateCalculation } from './generate';
import { randomCalculationSchema, calculationProblem } from './schema';

export function createCalculationQuestion(question: QuestionBase, seed: string) {
  const problem = calculationProblem(question);
  if (problem) throw new Error(problem);
  const rule = randomCalculationSchema.parse(question.payload);
  const generated = generateCalculation(rule, createRng(seed));
  const { left, right, answer, remainder, choices } = generated;
  const symbol = { add: '＋', subtract: '−', multiply: '×', divide: '÷' }[rule.operation];
  const vars = { left, right, answer, remainder, symbol };
  const answerText = (value: { answer: number; remainder: number }) =>
    rule.remainder ? t('question.randomArithmetic.remainderAnswer', value) : String(value.answer);
  const equation = t('question.randomArithmetic.equation', vars);
  const payload =
    rule.response === 'choice'
      ? {
          prompt: equation,
          choices: choices.map((value) => ({
            id: `n${value.answer}r${value.remainder}`,
            text: answerText(value),
          })),
          answer: `n${answer}r${remainder}`,
          shuffle: false,
        }
      : {
          prompt: t('question.randomAddition.inputPrompt'),
          template: t(`question.randomArithmetic.${rule.remainder ? 'remainderTemplate' : 'template'}`, vars),
          answers: rule.remainder ? [String(answer), String(remainder)] : [String(answer)],
        };
  return {
    question: {
      ...question,
      type: rule.response,
      payload,
      explanation: t(
        `question.randomArithmetic.${rule.operation === 'divide' ? 'divisionExplanation' : 'explanation'}`,
        { ...vars, result: answerText(generated) },
      ),
    },
    detail: {
      seed,
      operation: rule.operation,
      ...generated,
      expression: `${left} ${{ add: '+', subtract: '-', multiply: '*', divide: '/' }[rule.operation]} ${right}`,
    },
  };
}

export const randomCalculationRenderer: QuestionRenderer = {
  type: 'random-calculation',
  schema: randomCalculationSchema,
  async mount(ctx) {
    const generated = createCalculationQuestion(ctx.question, freshSeed());
    // Registry applies the viewport once; delegate to the unwrapped renderer.
    const renderer = generated.question.type === 'choice' ? choiceRenderer : textInputRenderer;
    const result = await renderer.mount({ ...ctx, question: generated.question });
    return { ...result, detail: { ...result.detail, generated: generated.detail } };
  },
};
