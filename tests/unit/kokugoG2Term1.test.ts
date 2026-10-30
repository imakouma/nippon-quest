import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Unit } from '../../src/core/content/schemas';
import { buildRoadmapNodes } from '../../src/scenes/overworld/roadmap';
import { readUnitQuestionSets } from './questionSetFixture';

type Question = {
  id: string;
  unit: string;
  type: string;
  payload: { prompt: string; choices?: Array<{ text: string }>; cards?: Array<{ text: string }> };
  explanation?: string;
};

const root = process.cwd();
const units = JSON.parse(readFileSync(join(root, 'content/units.json'), 'utf8')) as Unit[];
const questions = (unitSlug: string) => readUnitQuestionSets<Question>('kokugo', 'g2', unitSlug);

describe('小学2年1学期の国語教材', () => {
  const newUnits = [
    ['kokugo.g2.reading-sequence', 'reading-sequence'],
    ['kokugo.g2.speaking-listening', 'speaking-listening'],
    ['kokugo.g2.observation-writing', 'observation-writing'],
  ] as const;

  it.each(newUnits)('%s は1学期の現行単元として6問以上を持つ', (unitId, file) => {
    const unit = units.find((entry) => entry.id === unitId);
    const items = questions(file);
    expect(unit?.placement?.terms).toEqual([1]);
    expect(items.length).toBeGreaterThanOrEqual(6);
    expect(items.every((item) => item.unit === unitId)).toBe(true);
    expect(items.every((item) => item.explanation?.trim())).toBe(true);
  });

  it('読む問題は時間や出来事の順序と、根拠になる言葉を扱う', () => {
    const text = JSON.stringify(questions('reading-sequence'));
    expect(text).toContain('じゅん');
    expect(text).toContain('ことば');
    expect(text).toContain('はじめ');
  });

  it('話す・聞く問題は要点を落とさず、聞き返して伝える活動を扱う', () => {
    const text = JSON.stringify(questions('speaking-listening'));
    expect(text).toContain('だいじ');
    expect(text).toContain('ききかえ');
    expect(text).toContain('つたえ');
  });

  it('観察文は対象・様子・変化を順序立て、見た事実を書く', () => {
    const text = JSON.stringify(questions('observation-writing'));
    expect(text).toContain('かんさつ');
    expect(text).toContain('ようす');
    expect(text).toContain('じゅん');
    expect(text).not.toContain('すごいと おもう');
  });

  it('ロードマップを言語活動から語彙・漢字へ5単元に整理し、旧重複を隠す', () => {
    const ids = buildRoadmapNodes({
      units: units.filter(
        (unit) =>
          unit.subject === 'kokugo' && unit.grade === 2 && unit.placement?.terms.some((term) => term === 1),
      ),
      mastery: {},
      playerGrade: 2,
      challengeHigher: false,
      subjectLabel: () => '国語[こくご]',
    }).map((node) => node.id);

    expect(ids).toEqual([
      'kokugo.g2.reading-sequence',
      'kokugo.g2.speaking-listening',
      'kokugo.g2.observation-writing',
      'kokugo.g2.vocabulary',
      'kokugo.g2.kanji',
    ]);
  });
});
