// @vitest-environment jsdom
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import audit from '../../tasks/sansu-g1-balance-20261117.json';
import { mathReviewGroupsByGrade } from '../../src/tools/mathReviewOrder';
import { questionBaseSchema } from '../../src/questions/contracts';
import { getRenderer } from '../../src/questions/renderers/registry';

const questions = readdirSync('content/questions/sansu/g1')
  .flatMap((unit) => {
    const dir = `content/questions/sansu/g1/${unit}`;
    return readdirSync(dir).flatMap(
      (file) => JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')) as unknown[],
    );
  })
  .map((q) => questionBaseSchema.parse(q));
const additions = questions.filter((q) => q.id.startsWith('sansu.g1.balance.'));

describe('小1の問題量と難度の補強', () => {
  it('全問題を監査し、追加問題が学習順に一度ずつ含まれる', () => {
    expect(Object.keys(audit.levels).sort()).toEqual(questions.map((q) => q.id).sort());
    expect(additions).toHaveLength(16);
    const ids = mathReviewGroupsByGrade[1]!.flatMap((g) => g.questionIds);
    for (const q of additions) {
      expect(ids.filter((id) => id === q.id)).toHaveLength(1);
      expect(q.explanation).toMatch(/\S/);
      expect(getRenderer(q.type)!.schema.safeParse(q.payload).success, q.id).toBe(true);
      const payload = getRenderer(q.type)!.schema.parse(q.payload) as {
        promptImage?: string;
        promptImageAlt?: string;
        promptSpeech?: string;
      };
      if (payload.promptImage) expect(payload.promptImageAlt ?? payload.promptSpeech, q.id).toBeTruthy();
    }
  });
  it('新しい計数図と分解図の数量が回答と一致する', () => {
    for (const q of additions.filter((q) => /\.(count|split)-\d+$/.test(q.id))) {
      const p = q.payload as { promptImage: string; answers: string[] };
      const svg = new DOMParser().parseFromString(
        readFileSync(`assets/${p.promptImage}`, 'utf8'),
        'image/svg+xml',
      );
      expect(svg.querySelector('parsererror')).toBeNull();
      const count = svg.querySelectorAll('circle').length;
      expect(Number(p.answers[0])).toBe(q.id.includes('.split-') ? count - 5 : count);
      expect(svg.querySelector('title')?.textContent).toBeTruthy();
      expect(svg.querySelector('script, image')).toBeNull();
    }
  });
  it('10をつくる図は10枠に9個、対応図は両側5個を持つ', () => {
    const read = (name: string) =>
      new DOMParser().parseFromString(
        readFileSync(`assets/questions/sansu/g1/balance/${name}.svg`, 'utf8'),
        'image/svg+xml',
      );
    const frame = read('ten-frame-nine');
    expect(frame.querySelectorAll('rect[width="90"]')).toHaveLength(10);
    expect(frame.querySelectorAll('circle')).toHaveLength(9);
    const pairs = read('one-to-one-spacing');
    expect(pairs.querySelectorAll('circle')).toHaveLength(5);
    expect(pairs.querySelectorAll('path')).toHaveLength(5);
  });
});
