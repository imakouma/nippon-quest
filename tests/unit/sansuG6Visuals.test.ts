// @vitest-environment jsdom
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
import { questionBaseSchema } from '../../src/questions/contracts';
import { getRenderer } from '../../src/questions/renderers/registry';
import { textInputPayloadSchema, textInputScore } from '../../src/questions/renderers/text-input/schema';

const questions = readdirSync('content/questions/sansu/g6').flatMap((d) =>
  (JSON.parse(readFileSync(`content/questions/sansu/g6/${d}/set-001.json`, 'utf8')) as unknown[]).map((q) =>
    questionBaseSchema.parse(q),
  ),
);
const repairs = [
  '1e40bc4dec54',
  '2911de821182',
  '4b0aeb8bd013',
  '4f3f00f1f4e1',
  '6a29ee48837e',
  '6d8e2bb16cb0',
  '8db0971fa074',
  '93498e7e14df',
  '9e50035c8b6d',
  'a676bbefc5aa',
  'd88bef6ff10c',
  'e26c0a21801b',
  '05cb6d155eb3',
  '16f378313dac',
  '1e510081ff3f',
  '60aaa7d61cf6',
  '763c0aa897df',
  '9683fdb57e2f',
  '9d3dd713ec78',
  'b1f05e9a9a83',
  'd7653c3482cc',
  '22ce312d446f',
  '34776e601258',
  '59343703e0ea',
  '9b34c0cc97ee',
];
it('preserves all 193 learning targets, with separated fraction input fields', () => {
  expect(questions).toHaveLength(193);
  const rows = questions
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((q) => {
      const p = getRenderer(q.type)!.schema.parse(q.payload) as {
        choices?: { id: string; text: string }[];
        answer?: string;
        answers?: string[];
      };
      return [
        q.id,
        q.type,
        q.grade,
        q.unit,
        q.type === 'choice'
          ? p.choices!.find((c) => c.id === p.answer)!.text
          : repairs.some((h) => q.id.endsWith(h))
            ? [p.answers!.join(',')]
            : p.answers,
      ];
    });
  expect(createHash('sha256').update(JSON.stringify(rows)).digest('hex')).toBe(
    '131caee06318ea9a687949f06c756c51580e78b5fecc500eecf42ab0d842f5b6',
  );
});
it('illustrates volume, proportion, averages, speed, percentages and changing quantities', () => {
  for (const hash of [
    '6a2c98a49876',
    'b21487bbe77b',
    '279fa37becfc',
    '9dfc941fa652',
    '146ac196a443',
    '22ce312d446f',
  ])
    expect(
      (questions.find((q) => q.id.endsWith(hash))!.payload as { promptImage?: string }).promptImage,
      hash,
    ).toContain('sansu/g6/visuals/');
});
it('covers every question in the review and validates local image structure and descriptions', () => {
  const review = JSON.parse(readFileSync('scripts/data/sansu-g6-visual-review.json', 'utf8')) as {
    id: string;
    decision: string;
    reason: string;
  }[];
  expect(new Set(review.map((r) => r.id))).toEqual(new Set(questions.map((q) => q.id)));
  expect(review.filter((r) => r.decision === 'illustrated').length).toBeGreaterThan(70);
  for (const r of review) {
    expect(r.reason).toBeTruthy();
    if (r.decision !== 'illustrated') continue;
    const p = questions.find((q) => q.id === r.id)!.payload as {
      promptImage: string;
      promptSpeech?: string;
      promptImageAlt?: string;
    };
    expect(p.promptImageAlt ?? p.promptSpeech, r.id).toBeTruthy();
    const doc = new DOMParser().parseFromString(
      readFileSync(`assets/${p.promptImage}`, 'utf8'),
      'image/svg+xml',
    );
    expect(doc.querySelector('parsererror, script, image'), r.id).toBeNull();
    expect(doc.querySelector('title')?.textContent).toBeTruthy();
    const height = Number(doc.documentElement.getAttribute('height'));
    for (const label of doc.querySelectorAll('text')) {
      if (!label.textContent) continue;
      const y = Number(label.getAttribute('y')),
        font = Number(label.getAttribute('font-size'));
      expect(y - font, p.promptImage).toBeGreaterThanOrEqual(0);
      expect(y, p.promptImage).toBeLessThanOrEqual(height);
    }

    for (const u of doc.querySelectorAll('use'))
      expect(doc.getElementById(u.getAttribute('href')!.slice(1))).not.toBeNull();
    for (const g of doc.querySelectorAll('[data-count]'))
      expect(g.querySelectorAll('use').length).toBe(Number(g.getAttribute('data-count')));
  }
});
it('grades fractions separately and represents equal wholes without changing their values', () => {
  for (const hash of repairs) {
    const p = textInputPayloadSchema.parse(questions.find((q) => q.id.endsWith(hash))!.payload);
    expect(p.answers.length).toBeGreaterThan(1);
    expect(p.template?.match(/\{\{INPUT\}\}/g)).toHaveLength(p.answers.length);
    expect(textInputScore(p, p.answers)).toBe(1);
    expect(textInputScore(p, [p.answers.join('')])).toBe(0);
  }
  const svg = (name: string) =>
    new DOMParser().parseFromString(
      readFileSync(`assets/questions/sansu/g6/visuals/${name}.svg`, 'utf8'),
      'image/svg+xml',
    );
  const plot = svg('fraction-1e40bc4dec54');
  expect(
    [...plot.querySelectorAll('[data-denominator]')].map(
      (g) => g.querySelectorAll('rect[fill="#80c6ff"]').length,
    ),
  ).toEqual([1, 1]);
  expect(
    [...plot.querySelectorAll('[data-denominator]')].map((g) => g.querySelectorAll('rect').length),
  ).toEqual([2, 4]);
  const chocolate = svg('ratio-chocolate');
  expect(chocolate.querySelector('[data-count="42"]')?.querySelectorAll('use')).toHaveLength(42);
  expect(chocolate.querySelectorAll('[data-ratio-part="takuma"]')).toHaveLength(4);
  expect(chocolate.querySelectorAll('[data-ratio-part="brother"]')).toHaveLength(3);
  expect([...svg('cards-279fa37becfc').querySelectorAll('[data-digit]')].map((el) => el.textContent)).toEqual(
    ['0', '1', '2'],
  );
});
