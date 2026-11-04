import type { QuestionBase } from '../contracts';

export function questionTimeLimitMs(
  question: QuestionBase,
  defaultSeconds: number,
  battle: boolean,
  unlimited: boolean,
): number {
  if (unlimited) return 0;
  if (question.timeLimitSec !== undefined) return question.timeLimitSec * 1000;
  if (!battle || question.subject !== 'sansu' || question.grade > 3) return defaultSeconds * 1000;
  const payload =
    question.payload && typeof question.payload === 'object'
      ? (question.payload as Record<string, unknown>)
      : {};
  const prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
  const template = typeof payload.template === 'string' ? payload.template : '';
  const length = Math.max(prompt.length, template.replace(/\{\{INPUT\}\}/g, '').length);
  const inputs = Array.isArray(payload.answers) ? payload.answers.length : 1;
  return (defaultSeconds + Math.ceil(Math.max(0, length - 30) / 10) * 2 + Math.max(0, inputs - 1) * 5) * 1000;
}
