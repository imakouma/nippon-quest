// @vitest-environment jsdom
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
import { questionBaseSchema } from '../../src/questions/contracts';
import { getRenderer } from '../../src/questions/renderers/registry';
import { textInputPayloadSchema, textInputScore } from '../../src/questions/renderers/text-input/schema';

const questions = readdirSync('content/questions/sansu/g5').flatMap((d) =>
  (JSON.parse(readFileSync(`content/questions/sansu/g5/${d}/set-001.json`, 'utf8')) as unknown[]).map((q) =>
    questionBaseSchema.parse(q),
  ),
);
const repairs = [
  '1017a8c9d218',
  '1dac15f6e8d7',
  '371c1b00d1d1',
  '443bea2dbd1c',
  '5a643e829ba8',
  '6463f2e7fd7b',
  '6f72f9be4857',
  '81ea94966799',
  'a590fbd0011d',
  'a914e1f7fec4',
  'cb5bb00c2add',
  'd67ff00c4f69',
];
it('preserves all 359 learning targets, with separated fraction input fields', () => {
  expect(questions).toHaveLength(359);
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
    'b583d524f92057a60f6f6461a2dfc9eb24d8373f6dc288b6adc9c64e2d88002f',
  );
});
it('illustrates volume, proportion, averages, speed, percentages and changing quantities', () => {
  for (const hash of [
    '5967becf37cd',
    '04bce993b920',
    '5963dffdc599',
    '307c89d215d6',
    'f2d756162508',
    '6620188ba713',
  ])
    expect(
      (questions.find((q) => q.id.endsWith(hash))!.payload as { promptImage?: string }).promptImage,
      hash,
    ).toContain('sansu/g5/visuals/');
});
it('covers every question in the review and validates local image structure and descriptions', () => {
  const review = JSON.parse(readFileSync('scripts/data/sansu-g5-visual-review.json', 'utf8')) as {
    id: string;
    decision: string;
    reason: string;
  }[];
  expect(new Set(review.map((r) => r.id))).toEqual(new Set(questions.map((q) => q.id)));
  expect(review.filter((r) => r.decision === 'illustrated').length).toBeGreaterThan(100);
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
  const doc = new DOMParser().parseFromString(
    readFileSync('assets/questions/sansu/g5/visuals/fraction-1017a8c9d218.svg', 'utf8'),
    'image/svg+xml',
  );
  const strips = [...doc.querySelectorAll('[data-denominator]')];
  expect(strips.map((g) => g.querySelectorAll('rect[fill="#80c6ff"]').length)).toEqual([1, 1]);
  expect(strips.map((g) => g.querySelectorAll('rect').length)).toEqual([2, 3]);
  expect(strips.map((g) => g.getAttribute('data-whole-width'))).toEqual(['540', '540']);
  const classDoc = new DOMParser().parseFromString(
    readFileSync('assets/questions/sansu/g5/visuals/class-volunteers.svg', 'utf8'),
    'image/svg+xml',
  );
  expect(classDoc.querySelectorAll('[data-participates="yes"] use')).toHaveLength(15);
  expect(classDoc.querySelectorAll('[data-participates="no"] use')).toHaveLength(10);
});

it('keeps changing-quantity tables aligned with six numbered inputs', () => {
  for (const hash of ['56bfabb620fb', 'e95e8416b48d']) {
    const p = textInputPayloadSchema.parse(questions.find((q) => q.id.endsWith(hash))!.payload);
    const svg = readFileSync(`assets/${p.promptImage}`, 'utf8');
    for (const label of ['①', '②', '③', '④', '⑤', '⑥']) expect(svg).toContain(label);
    expect(p.answers).toHaveLength(6);
    expect(p.template?.match(/\{\{INPUT\}\}/g)).toHaveLength(6);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect([...doc.querySelectorAll('text[y="225"]')].map((el) => el.textContent)).toEqual([
      '①',
      '②',
      '③',
      '④',
      '⑤',
      '⑥',
    ]);
  }
});

it('keeps every fractional whole the same width in both rows', () => {
  for (const hash of repairs) {
    const doc = new DOMParser().parseFromString(
      readFileSync(`assets/questions/sansu/g5/visuals/fraction-${hash}.svg`, 'utf8'),
      'image/svg+xml',
    );
    const groups = [...doc.querySelectorAll('[data-denominator]')];
    const widths = groups.map((g) =>
      [...g.querySelectorAll('rect')].reduce((sum, r) => sum + Number(r.getAttribute('width')), 0),
    );
    for (const width of widths) expect(width, hash).toBeCloseTo(widths[0]!, 6);
  }
});
it('shows all nine place-value columns and a geometric regular hexagon', () => {
  const parse = (name: string) =>
    new DOMParser().parseFromString(
      readFileSync(`assets/questions/sansu/g5/visuals/${name}.svg`, 'utf8'),
      'image/svg+xml',
    );
  const place = parse('place-1cc857d26ba7');
  expect([...place.querySelectorAll('text[y="58"]')].map((e) => e.textContent)).toEqual([
    '万',
    '千',
    '百',
    '十',
    '一',
    '0.1',
    '0.01',
    '0.001',
    '0.0001',
  ]);
  expect([...place.querySelectorAll('text[y="112"]')].map((e) => e.textContent)).toEqual([
    '',
    '',
    '',
    '',
    '0',
    '0',
    '3',
    '1',
    '4',
  ]);
  expect([...place.querySelectorAll('text[y="177"]')].map((e) => e.textContent)).toEqual([
    '',
    '',
    '',
    '3',
    '1',
    '4',
    '',
    '',
    '',
  ]);
  for (const rect of place.querySelectorAll('rect[x]'))
    expect(Number(rect.getAttribute('x')) + Number(rect.getAttribute('width'))).toBeLessThan(800);
  const points = parse('regular-hexagon-outline')
    .querySelector('polygon')!
    .getAttribute('points')!
    .split(' ')
    .map((p) => p.split(',').map(Number));
  expect(points).toHaveLength(6);
  for (let i = 0; i < 6; i++) {
    const [x, y] = points[i]!,
      [nx, ny] = points[(i + 1) % 6]!;
    expect(Math.hypot(nx! - x!, ny! - y!)).toBeCloseTo(100, 6);
    expect(Math.hypot(x! - 400, y! - 130)).toBeCloseTo(100, 6);
  }
});
