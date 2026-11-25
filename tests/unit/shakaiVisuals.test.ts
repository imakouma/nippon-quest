// @vitest-environment jsdom
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
import { questionBaseSchema } from '../../src/questions/contracts';
import { mapTapPayloadSchema, mapTapScore } from '../../src/questions/renderers/map-tap/schema';
import { getRenderer } from '../../src/questions/renderers/registry';

const questions = readdirSync('content/questions/shakai', { recursive: true })
  .filter((file) => String(file).endsWith('.json'))
  .flatMap((file) => JSON.parse(readFileSync(`content/questions/shakai/${file}`, 'utf8')) as unknown[])
  .map((q) => questionBaseSchema.parse(q))
  .sort((a, b) => a.id.localeCompare(b.id));

it('preserves all 469 targets and answers, with documented wording corrections', () => {
  expect(questions).toHaveLength(469);
  const rows = questions.map((q) => {
    const p = getRenderer(q.type)!.schema.parse(q.payload) as Record<string, unknown>;
    let choices = p.choices;
    if (q.id.endsWith('b3865ab0c192')) {
      const source = p.choices as { id: string; text: string }[];
      expect(source.find((c) => c.id === 'c1')!.text).toBe('炭火[すみび]アイロン');
      choices = source.map((c) => (c.id === 'c1' ? { ...c, text: '炭火[すみび]アイロン（火のし）' } : c));
    }
    const repairs = JSON.parse(readFileSync('scripts/data/shakai-source-repairs.json', 'utf8')) as {
      hash: string;
      choiceTexts?: unknown;
      sourceChoices?: unknown;
    }[];
    const repair = repairs.find((r) => q.id.endsWith(r.hash) && r.choiceTexts);
    if (repair) {
      expect(p.choices).toEqual(repair.choiceTexts);
      choices = repair.sourceChoices;
    }
    return [q.id, q.type, q.grade, q.unit, p.answer, p.answers, choices];
  });
  // Reviewed content corrections: tasks/nonmath-audit-repair-20261124-result.md.
  expect(createHash('sha256').update(JSON.stringify(rows)).digest('hex')).toBe(
    'bb604e8a76f85f551e7abe2a4cb6041d28708b543b1305fa839b073270eec364',
  );
});

it('illustrates symbols, old tools, infrastructure, trade and civic relationships', () => {
  for (const hash of ['291a649587ad', '0547e5f3c29a', 'b7b25c6bf36e', '27a4c2358cd2', '38e654ff9d87']) {
    const q = questions.find((q) => q.id.endsWith(hash))!;
    expect((q.payload as { promptImage?: string }).promptImage, q.id).toContain('questions/shakai/visuals/');
  }
});

it('records every review and provides safe, accessible, readable diagrams', () => {
  const review = JSON.parse(readFileSync('scripts/data/shakai-visual-review.json', 'utf8')) as {
    id: string;
    decision: string;
    reason: string;
  }[];
  expect(review.map((r) => r.id).sort()).toEqual(questions.map((q) => q.id).sort());
  for (const r of review) {
    expect(r.reason.length).toBeGreaterThan(8);
    if (r.decision !== 'illustrated') continue;
    const q = questions.find((q) => q.id === r.id)!;
    const p = getRenderer(q.type)!.schema.parse(q.payload) as {
      promptImage?: string;
      image?: string;
      prompt?: string;
      promptSpeech?: string;
      promptImageAlt?: string;
    };
    expect(q.type === 'map-tap' ? p.prompt : (p.promptSpeech ?? p.promptImageAlt)).toBeTruthy();
    const svg = readFileSync(`assets/${p.promptImage ?? p.image}`, 'utf8');
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.querySelector('parsererror'), q.id).toBeNull();
    expect(doc.querySelector('title')?.textContent, q.id).toBeTruthy();
    expect(svg).not.toMatch(/<script|<foreignObject|href="https?:|undefined/);
    for (const label of doc.querySelectorAll('text')) {
      expect(Number(label.getAttribute('font-size')), q.id).toBeGreaterThanOrEqual(24);
    }
  }
});

it('replaces every incorrect legacy illustration and retains map scoring coordinates', () => {
  const replacements = JSON.parse(
    readFileSync('scripts/data/shakai-image-replacements.json', 'utf8'),
  ) as string[];
  for (const hash of replacements) {
    const q = questions.find((q) => q.id.endsWith(hash))!;
    const p = q.payload as { promptImage?: string; image?: string };
    expect(p.promptImage ?? p.image, q.id).toMatch(/^questions\/shakai\/visuals\//);
  }
  for (const q of questions.filter((q) => q.type === 'map-tap')) {
    const p = q.payload as { hotspots: { x: number; y: number }[]; answerIndex: number; radius: number };
    expect(p.answerIndex).toBe(0);
    expect(p.radius).toBe(q.id.endsWith('e2f89bc12f06') ? 20 : 9);
    const centers: Record<string, [number, number]> = {
      '6d0e031ce36a': [45, 70],
      ac17d998e6b9: [28, 35],
      c1db6b8cc38e: [68, 25],
      e2f89bc12f06: [70.8333, 34.6154],
      ffeb4560d45d: [75, 75],
    };
    expect([p.hotspots[0]!.x, p.hotspots[0]!.y]).toEqual(centers[q.id.split('.').at(-1)!]);
  }
});

it('restores the treaty premises and keeps answer names out of new identification diagrams', () => {
  const p = questions.find((q) => q.id.endsWith('44e88fffaa62'))!.payload as { prompt: string };
  for (const label of ['①', '②', '③', '④']) expect(p.prompt).toContain(label);
  for (const [hash, answer] of [
    ['291a649587ad', '果樹園'],
    ['0547e5f3c29a', '洗濯板'],
    ['38e654ff9d87', '三権分立'],
    ['27a4c2358cd2', '加工貿易'],
  ]) {
    const p = questions.find((q) => q.id.endsWith(hash!))!.payload as {
      prompt: string;
      promptSpeech: string;
      promptImage: string;
    };
    expect(p.promptSpeech.slice(p.prompt.length)).not.toContain(answer);
    expect(readFileSync(`assets/${p.promptImage}`, 'utf8')).not.toContain(answer);
  }
});

it('accepts every corner of the correct ward card and rejects the other cards', () => {
  const q = questions.find((q) => q.id.endsWith('e2f89bc12f06'))!;
  const p = mapTapPayloadSchema.parse(q.payload);
  for (const [cx, cy, correct] of [
    [340, 90, 1],
    [140, 90, 0],
    [140, 200, 0],
    [340, 200, 0],
  ]) {
    for (const dx of [-70, 0, 70])
      for (const dy of [-30, 0, 30]) {
        expect(mapTapScore(p, ((cx! + dx) / 480) * 100, ((cy! + dy) / 260) * 100)).toBe(correct);
      }
  }
});
