// @vitest-environment jsdom
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { questionBaseSchema, type QuestionBase } from '../../src/questions/contracts';
import { getRenderer } from '../../src/questions/renderers/registry';

const questions = readdirSync('content/questions/sansu/g2').flatMap((dir) =>
  (JSON.parse(readFileSync(`content/questions/sansu/g2/${dir}/set-001.json`, 'utf8')) as unknown[]).map(
    (q) => questionBaseSchema.parse(q) as QuestionBase,
  ),
);
describe('grade 2 illustrated learning materials', () => {
  it('locks 335 identities and reviewed answers including seven grade-scope repairs', () => {
    expect(questions).toHaveLength(335);
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
          q.type === 'choice' ? p.choices!.find((c) => c.id === p.answer)!.text : p.answers,
        ];
      });
    expect(createHash('sha256').update(JSON.stringify(rows)).digest('hex')).toBe(
      '39b3b85ae11b8cb3bb5446cea3c6872a3d1a6a685c6b35054faeb84d3b993481',
    );
  });
  it('illustrates groups, measurement, time, shape and word problems without printing unknown totals', () => {
    for (const id of [
      'sansu.g2.jikan.legacy-0003',
      'sansu.g2.kasa.legacy-0001',
      'legacy.sansu.g2.math-2-13.9cd2a04a370d',
      'legacy.sansu.g2.math-2-12.43d4514f24ce',
      'legacy.sansu.g2.math-2-19.f23f64530705',
    ]) {
      expect(
        (questions.find((q) => q.id === id)!.payload as { promptImage?: string }).promptImage,
        id,
      ).toContain('sansu/g2/visuals/');
    }
    const q = questions.find((q) => q.id.endsWith('f23f64530705'))!;
    const p = q.payload as { promptImage: string };
    const doc = new DOMParser().parseFromString(
      readFileSync(`assets/${p.promptImage}`, 'utf8'),
      'image/svg+xml',
    );
    expect(doc.querySelectorAll('[data-group-count]')).toHaveLength(5);
    expect(doc.querySelectorAll('use')).toHaveLength(40);
    expect([...doc.querySelectorAll('text')].map((e) => e.textContent).join(' ')).not.toContain('40');
  });
  it('records every review decision and supplies valid local SVGs and accessible descriptions', () => {
    const review = JSON.parse(readFileSync('scripts/data/sansu-g2-visual-review.json', 'utf8')) as {
      id: string;
      decision: string;
      reason: string;
    }[];
    expect(new Set(review.map((r) => r.id))).toEqual(new Set(questions.map((q) => q.id)));
    expect(review.filter((r) => r.decision === 'illustrated')).toHaveLength(103);
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
  it('keeps the original survey votes and the table blanks while replacing circles with people', () => {
    const doc = new DOMParser().parseFromString(
      readFileSync('assets/questions/sansu/g2/visuals/meal-votes-table.svg', 'utf8'),
      'image/svg+xml',
    );
    expect(
      [...doc.querySelectorAll('[data-group-count]')].map((g) => g.querySelectorAll('use').length),
    ).toEqual([3, 4, 3, 4, 6, 5]);
    const labels = [...doc.querySelectorAll('text')].map((e) => e.textContent);
    expect(labels).toEqual(expect.arrayContaining(['ア', 'イ', 'ウ']));
    const cards = new DOMParser().parseFromString(
      readFileSync('assets/questions/sansu/g2/visuals/meal-vote-cards.svg', 'utf8'),
      'image/svg+xml',
    );
    expect(cards.querySelectorAll('use')).toHaveLength(25);
    const names = [...cards.querySelectorAll('text')].map((e) => e.textContent);
    expect(names.filter((t) => t === 'カレー')).toHaveLength(6);
    expect(names.filter((t) => t === 'やきそば')).toHaveLength(3);
  });
});
