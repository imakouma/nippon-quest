// @vitest-environment jsdom
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
import { questionBaseSchema } from '../../src/questions/contracts';
import { getRenderer } from '../../src/questions/renderers/registry';
import { textInputPayloadSchema, textInputScore } from '../../src/questions/renderers/text-input/schema';

const questions = readdirSync('content/questions/sansu/g6').flatMap((d) =>
  readdirSync(`content/questions/sansu/g6/${d}`).flatMap((file) =>
    (JSON.parse(readFileSync(`content/questions/sansu/g6/${d}/${file}`, 'utf8')) as unknown[]).map((q) =>
      questionBaseSchema.parse(q),
    ),
  ),
);
const repairs = [
  '350742bfbbc4',
  '3f37cc35e0f6',
  'ba6d3d429270',
  '7af63ede6c3e',
  'b46ba27c2b46',
  'c7e70d5bef36',
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
it('covers all 226 learning targets, with separated fraction input fields', () => {
  expect(questions).toHaveLength(226);
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
    'b2b98aafd91d95dea3238b63d5eab0850cafb61521779cb3b957fce828654517',
  );
});
it('illustrates symmetry, ratios, fractions, volume, data and combinations', () => {
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
  expect(review.filter((r) => r.decision === 'illustrated')).toHaveLength(139);
  expect(
    review.filter((r) => r.decision.includes('missing') || r.decision.includes('source-expression')),
  ).toEqual([]);
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

it('restores source conditions and preserves the mathematical answers of the six fraction repairs', () => {
  for (const [hash, value] of [
    ['350742bfbbc4', (2 + 1 / 2) * (1 + 3 / 4)],
    ['3f37cc35e0f6', (1 + 7 / 8) / (3 + 4 / 7) / (7 / 16)],
    ['ba6d3d429270', (1 + 2 / 5) / (2 + 1 / 10)],
    ['7af63ede6c3e', 15 / 60],
    ['b46ba27c2b46', 10 / 60],
    ['c7e70d5bef36', 24 / 60],
  ] as const) {
    const p = textInputPayloadSchema.parse(questions.find((q) => q.id.endsWith(hash))!.payload);
    expect(p.answers).toHaveLength(2);
    expect(Number(p.answers[0]) / Number(p.answers[1])).toBeCloseTo(value);
    expect(textInputScore(p, p.answers)).toBe(1);
    expect(textInputScore(p, [p.answers[0]!, '99'])).toBeLessThan(1);
    expect(textInputScore(p, ['99', '99'])).toBe(0);
  }
  for (const [hash, condition] of [
    ['350742bfbbc4', '2\\dfrac{1}{2} × 1\\dfrac{3}{4}'],
    ['3f37cc35e0f6', '1\\dfrac{7}{8} ÷ 3\\dfrac{4}{7}'],
    ['ba6d3d429270', '1\\dfrac{2}{5} ÷ 2\\dfrac{1}{10}'],
    ['7af63ede6c3e', '15分'],
    ['b46ba27c2b46', '10分'],
    ['c7e70d5bef36', '24分'],
    ['0003f834b146', '0.3 : 6'],
    ['0475b7014f1e', '40 : 10'],
    ['2c2ebe308727', '\\dfrac{1}{3} : \\dfrac{1}{9}'],
    ['6b550af8178d', '15 : 21'],
    ['84d190bf58bf', '68 : 17'],
    ['97ac545842e7', '40 : 50'],
    ['c610a527fcd1', '4 : 10'],
    ['5b5250351724', '2kg'],
    ['a7a24237e6f2', '3cm'],
    ['aa7dcca63249', '12cm²'],
    ['d4f604baf9f3', '30km'],
  ]) {
    const p = questions.find((q) => q.id.endsWith(hash!))!.payload as { prompt: string };
    expect(p.prompt, hash).toContain(condition);
  }
  for (const hash of ['064f0be02d26', '5c7bc62997cc', 'e5da9f91183c']) {
    const p = questions.find((q) => q.id.endsWith(hash))!.payload as {
      prompt: string;
      choices: { text: string }[];
    };
    expect(p.prompt).toContain('（①）');
    expect(p.prompt).toContain('（②）');
    expect(p.choices.every((c) => c.text.split('・').length === 2)).toBe(true);
    expect(new Set(p.choices.map((c) => c.text)).size).toBe(4);
  }
});

it('draws the restored minute counts and ratios to scale without displaying the answers', () => {
  for (const minutes of [10, 15, 24]) {
    const doc = new DOMParser().parseFromString(
      readFileSync(`assets/questions/sansu/g6/visuals/time-${minutes}-minutes.svg`, 'utf8'),
      'image/svg+xml',
    );
    expect(doc.querySelectorAll('[data-minute]')).toHaveLength(60);
    expect(doc.querySelectorAll('[data-minute][fill="#80c6ff"]')).toHaveLength(minutes);
  }
  const doc = new DOMParser().parseFromString(
    readFileSync('assets/questions/sansu/g6/visuals/restored-ratio-0003f834b146.svg', 'utf8'),
    'image/svg+xml',
  );
  const bars = [...doc.querySelectorAll('[data-ratio-value]')];
  expect(bars.map((b) => Number(b.getAttribute('data-ratio-value')))).toEqual([0.3, 6]);
  expect(Number(bars[0]!.getAttribute('width')) / Number(bars[1]!.getAttribute('width'))).toBeCloseTo(0.05);
  expect(doc.querySelector('text')?.textContent).not.toContain('0.05');
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

it('matches the map unit to its question and marks each whole in mixed fractions', () => {
  const map = readFileSync('assets/questions/sansu/g6/visuals/map-scale-45ef7b9abd0f.svg', 'utf8');
  expect(map).toContain('？cm');
  expect(map).not.toContain('？m');
  for (const hash of ['350742bfbbc4', '3f37cc35e0f6', 'ba6d3d429270']) {
    const doc = new DOMParser().parseFromString(
      readFileSync(`assets/questions/sansu/g6/visuals/restored-mixed-${hash}.svg`, 'utf8'),
      'image/svg+xml',
    );
    for (const group of doc.querySelectorAll('[data-whole-width]')) {
      expect(group.querySelectorAll('[data-whole-outline]')).toHaveLength(1);
      const parts = [...group.querySelectorAll('rect')];
      expect(parts).toHaveLength(Number(group.getAttribute('data-denominator')));
      expect(parts.reduce((sum, part) => sum + Number(part.getAttribute('width')), 0)).toBeCloseTo(
        Number(group.getAttribute('data-whole-width')),
      );
    }
  }
});
