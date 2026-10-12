import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Unit } from '../../src/core/content/schemas';
import { buildRoadmapNodes } from '../../src/scenes/overworld/roadmap';

type Question = {
  id: string;
  unit: string;
  payload: { prompt: string; choices?: Array<{ text: string }> };
  explanation?: string;
};

const root = process.cwd();
const units = JSON.parse(readFileSync(join(root, 'content/units.json'), 'utf8')) as Unit[];

function questions(file: string): Question[] {
  return JSON.parse(readFileSync(join(root, 'content/questions/seikatsu/g1', file), 'utf8')) as Question[];
}

describe('小学1年2学期の生活科教材', () => {
  const expectedUnits = [
    ['seikatsu.g1.home-life', 'home-life.json'],
    ['seikatsu.g1.living-things', 'living-things.json'],
  ] as const;

  it.each(expectedUnits)('%s は2学期の現行単元として6問以上を持つ', (unitId, file) => {
    const unit = units.find((entry) => entry.id === unitId);
    const items = questions(file);

    expect(unit?.placement?.terms).toContain(2);
    expect(items.length).toBeGreaterThanOrEqual(6);
    expect(items.every((item) => item.unit === unitId)).toBe(true);
  });

  it.each(expectedUnits)('%s は画像なしで活動を判断でき、理由の解説を持つ', (_unitId, file) => {
    for (const item of questions(file)) {
      expect(item.payload.prompt).not.toContain('写真を見て');
      expect(item.explanation?.trim()).toBeTruthy();
      expect(item.payload.choices?.every((choice) => choice.text.trim().length > 0)).toBe(true);
    }
  });

  it('家庭生活は家庭の形を決め付けず、自分で試して振り返る活動を扱う', () => {
    const text = JSON.stringify(questions('home-life.json'));
    expect(text).toContain('じぶんに できる');
    expect(text).toContain('ふりかえる');
    expect(text).not.toContain('いっしょに しょくじ');
  });

  it('生き物の世話は観察・継続・安全な相談を扱う', () => {
    const text = JSON.stringify(questions('living-things.json'));
    expect(text).toContain('かんさつ');
    expect(text).toContain('つづけ');
    expect(text).toContain('そうだん');
  });

  it('ロードマップでは旧移行単元を現行2単元へ置き換える', () => {
    const targetUnits = units.filter(
      (unit) =>
        unit.id === 'seikatsu.g1.home-life' ||
        unit.id === 'seikatsu.g1.living-things' ||
        ['cur-1801-02', 'cur-1801-03'].includes(unit.legacyNode ?? ''),
    );
    const ids = buildRoadmapNodes({
      units: targetUnits,
      mastery: {},
      playerGrade: 1,
      challengeHigher: false,
      subjectLabel: () => '生活[せいかつ]',
    }).map((node) => node.id);

    expect(ids).toEqual(['seikatsu.g1.home-life', 'seikatsu.g1.living-things']);
  });
});
