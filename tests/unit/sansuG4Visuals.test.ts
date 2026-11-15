// @vitest-environment jsdom
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { questionBaseSchema, type QuestionBase } from '../../src/questions/contracts';
import { textInputPayloadSchema, textInputScore } from '../../src/questions/renderers/text-input/schema';
import { getRenderer } from '../../src/questions/renderers/registry';

const repairs: Record<string, [string[], string[]]> = {
  '235a7a59b326': [['1,2'], ['1', '2']],
  '3fc704017d2d': [['8,3'], ['3']],
  '68561e8b48be': [['4,2,1'], ['2', '1']],
  '6cf01a246af7': [['14,2'], ['2']],
  '8b14f0adbca7': [['6,2,1'], ['2', '1']],
  '95e83927566d': [['1,6,2'], ['2']],
  a78485ffaa9a: [['1,2'], ['1', '2']],
  ac518e6196db: [['2,1'], ['2', '1']],
  acb42b4e6766: [['1,1'], ['1', '1']],
  cf04e564b113: [['2,2'], ['2', '2']],
  d35715741676: [['5,1,1'], ['1', '1']],
  ff7d3a341dc8: [['10,2'], ['2']],
};

const questions = readdirSync('content/questions/sansu/g4').flatMap((dir) =>
  (JSON.parse(readFileSync(`content/questions/sansu/g4/${dir}/set-001.json`, 'utf8')) as unknown[]).map(
    (q) => questionBaseSchema.parse(q) as QuestionBase,
  ),
);
describe('grade 4 illustrated learning materials', () => {
  it('preserves all 362 identities and targets with documented fraction-input repairs', () => {
    expect(questions).toHaveLength(362);
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
            : (repairs[q.id.split('.').at(-1)!]?.[0] ?? p.answers),
        ];
      });
    expect(createHash('sha256').update(JSON.stringify(rows)).digest('hex')).toBe(
      'ed4c8b38b6bfc373a1d7f5ed0fceb8eadd4206201341d2fb0eb659287abd90a4',
    );
  });
  it('illustrates groups, measurement, time, shape and word problems without printing unknown totals', () => {
    for (const id of [
      'legacy.sansu.g4.math-4-2.67bb346e3fbb',
      'legacy.sansu.g4.math-4-11.1a320db1d80d',
      'legacy.sansu.g4.math-4-9.4e5ae6b5545c',
      'legacy.sansu.g4.math-4-14.17996dbc432c',
    ]) {
      expect(
        (questions.find((q) => q.id === id)!.payload as { promptImage?: string }).promptImage,
        id,
      ).toContain('sansu/g4/visuals/');
    }
  });
  it('records every review decision and supplies valid local SVGs and accessible descriptions', () => {
    const review = JSON.parse(readFileSync('scripts/data/sansu-g4-visual-review.json', 'utf8')) as {
      id: string;
      decision: string;
      reason: string;
    }[];
    expect(new Set(review.map((r) => r.id))).toEqual(new Set(questions.map((q) => q.id)));
    expect(review.filter((r) => r.decision === 'illustrated')).toHaveLength(101);
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
        for (const g of doc.querySelectorAll('[data-count]'))
          expect(g.querySelectorAll('use').length, path).toBe(Number(g.getAttribute('data-count')));
      }
    }
  });
  it('repairs fraction answers and preserves the shown mathematical quantities', () => {
    for (const [hash, [, expected]] of Object.entries(repairs)) {
      const p = questions.find((q) => q.id.endsWith(hash))!.payload as {
        prompt: string;
        answers: string[];
        template: string;
      };
      expect(p.answers, hash).toEqual(expected);
      const payload = textInputPayloadSchema.parse(p);
      expect(textInputScore(payload, expected)).toBe(1);
      expect(textInputScore(payload, [repairs[hash]![0][0]!.replaceAll(',', '')])).toBe(0);
      expect(p.template.match(/\{\{INPUT\}\}/g), hash).toHaveLength(expected.length);
    }
    const svg = (name: string) =>
      new DOMParser().parseFromString(
        readFileSync(`assets/questions/sansu/g4/visuals/${name}.svg`, 'utf8'),
        'image/svg+xml',
      );
    for (const [name, filled] of [
      ['fraction-3310a91b7368', [4, 2, 3]],
      ['fraction-0860a726afbb', [9, 9, 8]],
    ] as const) {
      const groups = [...svg(name).querySelectorAll('[data-fraction-whole]')];
      expect(groups.map((g) => g.querySelectorAll('rect[fill="#80c6ff"]').length)).toEqual(filled);
      for (const group of groups)
        expect(group.querySelectorAll('rect').length).toBe(Number(group.getAttribute('data-fraction-whole')));
    }
    const unit = svg('area-unit-1f3170213999').querySelector('g > rect')!;
    expect(unit.getAttribute('width')).toBe(unit.getAttribute('height'));
    const table = [...svg('heat-table-blanks').querySelectorAll('text')].map((e) => e.textContent);
    expect(table).toEqual(expect.arrayContaining(['①', '②', '③', '④']));
    expect(table).not.toContain('20');
  });
});
