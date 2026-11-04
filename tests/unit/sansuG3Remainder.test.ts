import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('小学3年のあまりのあるわり算', () => {
  it.each(['warizan', 'legacy-math-3-10'])('%s の答えのたしかめにあまりの条件を含む', (unit) => {
    const questions = JSON.parse(
      readFileSync(join(process.cwd(), `content/questions/sansu/g3/${unit}/set-001.json`), 'utf8'),
    ) as Array<{ explanation: string }>;
    const checks = questions.filter((question) => question.explanation.includes('× こたえ + あまり ='));

    expect(checks).toHaveLength(3);
    for (const question of checks) {
      expect(question.explanation).toContain('あまりが わる数[すう]より 小[ちい]さい');
    }
  });
});
