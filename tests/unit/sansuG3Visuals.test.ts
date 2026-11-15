// @vitest-environment jsdom
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { questionBaseSchema, type QuestionBase } from '../../src/questions/contracts';
import { getRenderer } from '../../src/questions/renderers/registry';
import { textInputPayloadSchema, textInputScore } from '../../src/questions/renderers/text-input/schema';

const fractions = [
  ['08d029c598af', '3,8', ['3', '8']],
  ['1ed3374f6fe6', '4,10', ['4', '10']],
  ['455b0e61dc70', '3,5', ['3', '5']],
  ['b7adf66adfaa', '3,4', ['3', '4']],
  ['f75a7758496a', '3,5', ['3', '5']],
  ['7f541118ffea', '7,1', ['1']],
] as const;

const questions = readdirSync('content/questions/sansu/g3').flatMap((dir) =>
  (JSON.parse(readFileSync(`content/questions/sansu/g3/${dir}/set-001.json`, 'utf8')) as unknown[]).map(
    (q) => questionBaseSchema.parse(q) as QuestionBase,
  ),
);
describe('grade 3 illustrated learning materials', () => {
  it('preserves all 345 identities and targets, with only six explicit fraction-input repairs', () => {
    expect(questions).toHaveLength(345);
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
            : fractions.some(([hash]) => q.id.endsWith(hash))
              ? [fractions.find(([hash]) => q.id.endsWith(hash))![1]]
              : p.answers,
        ];
      });
    expect(createHash('sha256').update(JSON.stringify(rows)).digest('hex')).toBe(
      '8e33c01f02ee318d46c7df6bdd50146ad80af91fed8a6ca53df7a19bc0dc476f',
    );
  });
  it('accepts fractions through numerator/denominator fields and rejects concatenated digits', () => {
    for (const [hash, old, answer] of fractions) {
      const p = textInputPayloadSchema.parse(questions.find((q) => q.id.endsWith(hash))!.payload);
      expect(p.answers, hash).toEqual(answer);
      expect(p.template?.match(/\{\{INPUT\}\}/g), hash).toHaveLength(answer.length);
      expect(textInputScore(p, [...answer]), hash).toBe(1);
      expect(textInputScore(p, [old.replace(',', '')]), hash).toBe(0);
    }
  });
  it('illustrates groups, measurement, time, shape and word problems without printing unknown totals', () => {
    for (const id of [
      'legacy.sansu.g3.math-3-2.595d3afaa121',
      'legacy.sansu.g3.math-3-5.04ffc8e1c045',
      'legacy.sansu.g3.math-3-14.28b9d4da9499',
      'legacy.sansu.g3.math-3-15.2c7a41ca61a6',
      'legacy.sansu.g3.math-3-19.a6a8f3b0cb36',
    ]) {
      expect(
        (questions.find((q) => q.id === id)!.payload as { promptImage?: string }).promptImage,
        id,
      ).toContain('sansu/g3/visuals/');
    }
    const q = questions.find((q) => q.id.endsWith('a6a8f3b0cb36'))!;
    const p = q.payload as { promptImage: string };
    const doc = new DOMParser().parseFromString(
      readFileSync(`assets/${p.promptImage}`, 'utf8'),
      'image/svg+xml',
    );
    expect(doc.querySelectorAll('[data-group-count]')).toHaveLength(7);
    expect(doc.querySelectorAll('use')).toHaveLength(53);
    expect([...doc.querySelectorAll('text')].map((e) => e.textContent).join(' ')).not.toContain('53');
  });
  it('records every review decision and supplies valid local SVGs and accessible descriptions', () => {
    const review = JSON.parse(readFileSync('scripts/data/sansu-g3-visual-review.json', 'utf8')) as {
      id: string;
      decision: string;
      reason: string;
    }[];
    expect(new Set(review.map((r) => r.id))).toEqual(new Set(questions.map((q) => q.id)));
    expect(review.filter((r) => r.decision === 'illustrated')).toHaveLength(90);
    for (const r of review) {
      expect(r.reason).toBeTruthy();
      if (r.decision !== 'illustrated') continue;
      const q = questions.find((q) => q.id === r.id)!;
      const p = getRenderer(q.type)!.schema.parse(q.payload) as {
        promptImage?: string;
        promptImageAlt?: string;
        promptSpeech?: string;
        choices?: { image?: string }[];
      };
      if (p.promptImage) expect(p.promptImageAlt ?? p.promptSpeech, r.id).toBeTruthy();
      const paths = [p.promptImage, ...(p.choices ?? []).map((c) => c.image)].filter((p): p is string => !!p);
      expect(paths.length).toBeGreaterThan(0);
      for (const path of paths) {
        const doc = new DOMParser().parseFromString(readFileSync(`assets/${path}`, 'utf8'), 'image/svg+xml');
        expect(doc.querySelector('parsererror, script, image'), path).toBeNull();
        expect(doc.querySelector('title')?.textContent, path).toBeTruthy();
        for (const use of doc.querySelectorAll('use'))
          expect(doc.getElementById(use.getAttribute('href')!.slice(1)), path).not.toBeNull();
        for (const g of doc.querySelectorAll('[data-group-count]'))
          expect(g.querySelectorAll('use').length, path).toBe(Number(g.getAttribute('data-group-count')));
      }
    }
  });
  it('uses equal wholes for fraction comparisons and only shows the known time', () => {
    const svg = (name: string) =>
      new DOMParser().parseFromString(
        readFileSync(`assets/questions/sansu/g3/visuals/${name}.svg`, 'utf8'),
        'image/svg+xml',
      );
    const bars = svg('compare-28b9d4da9499').querySelectorAll('[data-parts]');
    expect(bars).toHaveLength(2);
    expect([...bars].map((b) => b.querySelectorAll('rect[fill="#80c6ff"]').length)).toEqual([4, 2]);
    for (const b of bars) {
      const cells = [...b.querySelectorAll('rect')];
      expect(cells).toHaveLength(5);
      expect(cells.every((c) => c.getAttribute('width') === '104')).toBe(true);
    }
    const clock = svg('time-269206acfb8e');
    const hours = clock.querySelectorAll('path[stroke-width="8"]');
    expect(hours).toHaveLength(1); // Departure time must remain unknown.
    const end = hours[0]!.getAttribute('d')!.split('L')[1]!.split(' ').map(Number);
    expect(end[0]).toBeCloseTo(620 + Math.sin((8.25 * Math.PI) / 6) * 88 * 0.44);
    expect(end[1]).toBeCloseTo(120 - Math.cos((8.25 * Math.PI) / 6) * 88 * 0.44);
    expect([...clock.querySelectorAll('text')].map((e) => e.textContent)).toContain('？じ ？ふん');
  });
});
