import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Unit } from '../../src/core/content/schemas';
import { buildRoadmapNodes } from '../../src/scenes/overworld/roadmap';
import { readUnitQuestionSets } from './questionSetFixture';

type Question = {
  id: string;
  unit: string;
  payload: { prompt: string };
  explanation?: string;
};

const root = process.cwd();
const units = JSON.parse(readFileSync(join(root, 'content/units.json'), 'utf8')) as Array<{
  id: string;
  placement?: { terms?: Array<number | 'variable'> };
}>;

function questions(unitSlug: string): Question[] {
  return readUnitQuestionSets<Question>('sansu', 'g1', unitSlug);
}

describe('小学1年2学期の算数教材', () => {
  const expectedUnits = [
    ['sansu.g1.kazu-20', 'kazu-20'],
    ['sansu.g1.kuriagari-kurisagari', 'kuriagari-kurisagari'],
    ['sansu.g1.tokei', 'tokei'],
  ] as const;

  it.each(expectedUnits)('%s は2学期の現行単元として6問以上を持つ', (unitId, file) => {
    const unit = units.find((entry) => entry.id === unitId);
    const items = questions(file);

    expect(unit?.placement?.terms).toContain(2);
    expect(items.length).toBeGreaterThanOrEqual(6);
    expect(items.every((item) => item.unit === unitId)).toBe(true);
  });

  it.each(expectedUnits)('%s の問題は画像がなくても問いが分かり、解説を持つ', (_unitId, file) => {
    for (const item of questions(file)) {
      expect(item.payload.prompt).not.toMatch(/^(ずをみて|○は、いくつ)/);
      expect(item.explanation?.trim()).toBeTruthy();
    }
  });

  it('繰り上がり・繰り下がりは10のまとまりを使う考え方を扱う', () => {
    const text = JSON.stringify(questions('kuriagari-kurisagari'));
    expect(text).toContain('10の まとまり');
    expect(text).toContain('わけ');
  });

  it('時計は正時・30分・生活場面を中心に扱う', () => {
    const items = questions('tokei');
    const text = JSON.stringify(items);
    expect(text).toContain('30ぷん');
    expect(text).toContain('せいかつ');
    expect(text).not.toMatch(/47ふん|33ぷん/);
  });

  it('ロードマップでは旧移行単元を現行3単元へ置き換える', () => {
    const term2Units = (units as Unit[]).filter(
      (unit) =>
        unit.id.startsWith('sansu.g1.') &&
        (unit.id.includes('kazu-20') ||
          unit.id.includes('kuriagari-kurisagari') ||
          unit.id.includes('tokei') ||
          ['math_1_4', 'math_1_5', 'math_1_8'].includes(unit.legacyNode ?? '')),
    );
    const ids = buildRoadmapNodes({
      units: term2Units,
      mastery: {},
      playerGrade: 1,
      challengeHigher: false,
      subjectLabel: () => '算数[さんすう]',
    }).map((node) => node.id);

    expect(ids).toEqual(['sansu.g1.kazu-20', 'sansu.g1.kuriagari-kurisagari', 'sansu.g1.tokei']);
  });
});
