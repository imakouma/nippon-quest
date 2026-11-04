import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { choicePayloadSchema } from '../../src/questions/renderers/choice/schema';

const questions = JSON.parse(readFileSync('content/questions/sansu/g1/tokei/set-001.json', 'utf8')) as {
  id: string;
  payload: unknown;
}[];
const payload = (id: string) => choicePayloadSchema.parse(questions.find((q) => q.id.endsWith(id))?.payload);

describe('grade 1 clock questions', () => {
  it('shows a clock for each reading question and describes it for speech', () => {
    for (const [id, clock] of [
      ['0001', '07-00'],
      ['0002', '03-30'],
      ['0004', '10-30'],
    ]) {
      const question = payload(id!);
      expect(question.promptImage).toBe(`questions/sansu/g1/tokei/clock-${clock}.svg`);
      expect(question.promptSpeech).toContain('ながい はり');
    }
  });

  it('provides an image and a description for each clock choice', () => {
    const question = payload('0003');
    expect(question.answer).toBe('a');
    expect(question.choices.map((choice) => choice.image)).toEqual([
      'questions/sansu/g1/tokei/clock-07-00.svg',
      'questions/sansu/g1/tokei/clock-12-35.svg',
      'questions/sansu/g1/tokei/clock-07-30.svg',
    ]);
    expect(question.choices.every((choice) => choice.text?.includes('ながい はり'))).toBe(true);
  });

  it('draws both hands at the angles implied by each file name', () => {
    for (const [hour, minute] of [
      [7, 0],
      [3, 30],
      [10, 30],
      [12, 35],
      [7, 30],
    ]) {
      const path = `assets/questions/sansu/g1/tokei/clock-${String(hour).padStart(2, '0')}-${String(minute).padStart(2, '0')}.svg`;
      const svg = readFileSync(path, 'utf8');
      const angles = [...svg.matchAll(/transform="rotate\(([\d.]+) 120 120\)"/g)].map((match) =>
        Number(match[1]),
      );
      expect(angles).toEqual([(hour! % 12) * 30 + minute! * 0.5, minute! * 6]);
      expect(svg.match(/<text /g)).toHaveLength(12);
    }
  });
});
