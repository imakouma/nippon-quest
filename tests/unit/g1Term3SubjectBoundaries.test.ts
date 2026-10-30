import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Unit } from '../../src/core/content/schemas';
import { readUnitQuestionSets } from './questionSetFixture';

type ChoiceQuestion = {
  id: string;
  grade: number;
  subject: string;
  unit: string;
  type: string;
  payload: {
    prompt: string;
    promptSpeech?: string;
    choices: Array<{ text?: string; image?: string }>;
  };
  explanation?: string;
};

const root = process.cwd();
const units = JSON.parse(readFileSync(join(root, 'content/units.json'), 'utf8')) as Unit[];
const load = (unitSlug: string) => readUnitQuestionSets<ChoiceQuestion>('eigo', 'g1', unitSlug);

describe('小学1年3学期の理科・社会・英語の境界', () => {
  it('理科と社会は1年生の独立した必修単元にしない', () => {
    const invalid = units.filter(
      (unit) =>
        unit.grade === 1 && ['rika', 'shakai'].includes(unit.subject) && unit.courseKind !== 'supplementary',
    );
    expect(invalid).toEqual([]);
  });

  it('1年生英語は必修進捗から分離された補助教材だけにする', () => {
    const english = units.filter((unit) => unit.grade === 1 && unit.subject === 'eigo');
    expect(english.length).toBeGreaterThan(0);
    expect(english.every((unit) => unit.courseKind === 'supplementary')).toBe(true);
    expect(english.every((unit) => unit.placement?.terms.some((term) => term === 'variable'))).toBe(true);
    expect(english.every((unit) => unit.curriculumCodes === undefined)).toBe(true);
  });

  it.each(['alphabet', 'fruits'])('%s は英字を読ませず、英語の音から絵や場面を選ばせる', (unitSlug) => {
    const questions = load(unitSlug);
    expect(questions.length).toBeGreaterThanOrEqual(6);

    for (const question of questions) {
      expect(question.grade).toBe(1);
      expect(question.subject).toBe('eigo');
      expect(question.type).toBe('choice');
      expect(question.payload.promptSpeech).toMatch(/^[A-Za-z' ]+$/);
      expect(question.payload.prompt).not.toMatch(/[A-Za-z]/);
      expect(question.explanation ?? '').not.toMatch(/[A-Za-z]/);
      expect(
        question.payload.choices.every(
          (choice) => Boolean(choice.image) || Boolean(choice.text && !/[A-Za-z]/.test(choice.text)),
        ),
      ).toBe(true);
    }
  });
});
