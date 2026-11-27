import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import assignments from '../../content/seikatsu-skill-assignments.json';
import skills from '../../content/seikatsu-skills.json';
import existingSkills from '../../content/skills.json';

function questionFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? questionFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

const questions = questionFiles('content/questions/seikatsu').flatMap(
  (file) =>
    JSON.parse(readFileSync(file, 'utf8')) as { id: string; grade: number; unit: string; type: string }[],
);
const byId = new Map(skills.map((skill) => [skill.id, skill]));
const mapping: Record<string, string> = assignments;

describe('生活科の技データ', () => {
  it('身支度と家族の手伝いを別の技に分ける', () => {
    expect(mapping['seikatsu.g1.home-life.0006']).toBe('sk-seikatsu-health');
    expect(mapping['seikatsu.g1.home-life.0001']).toBe('sk-seikatsu-home');
  });
  it('季節の観察・自然遊び・安全な外出を内容に合う技に分ける', () => {
    expect(mapping['seikatsu.g1.kisetsu.0007']).toBe('sk-happa-cutter');
    expect(mapping['seikatsu.g1.kisetsu.0003']).toBe('sk-seikatsu-health');
    expect(mapping['legacy.seikatsu.g1.cur-1801-04.7ef27b5e5fc6']).toBe('sk-happa-tobashi');
    expect(mapping['seikatsu.g2.spring.0003']).toBe('sk-seikatsu-town');
  });
  it('サンプルを除く全問題を重複なく適切な学年の技に割り当てる', () => {
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    expect(Object.keys(mapping).sort()).toEqual(questions.map((q) => q.id).sort());
    expect(new Set(questions.map((q) => q.type))).toEqual(new Set(['choice', 'sort-order']));
    for (const question of questions) {
      const skill = byId.get(mapping[question.id] ?? '');
      expect(skill, question.id).toBeDefined();
      expect(skill!.gradeRange[0]).toBeLessThanOrEqual(question.grade);
      expect(skill!.gradeRange[1]).toBeGreaterThanOrEqual(question.grade);
      expect(skill!.unitHint).toContain(question.unit);
    }
  });

  it('既存IDを維持し、技の性能と表示情報を定義する', () => {
    expect(byId.size).toBe(skills.length);
    for (const old of existingSkills.filter((skill) => skill.subject === 'seikatsu')) {
      expect(byId.has(old.id), old.id).toBe(true);
    }
    for (const skill of skills) {
      expect(skill.subject).toBe('seikatsu');
      expect(skill.name).toBeTruthy();
      expect(skill.flavor).toBeTruthy();
      expect(skill.effect).toBe('damage');
      expect(skill.mp).toBe(0);
      expect(skill.power).toBeGreaterThanOrEqual(1);
      expect(skill.power).toBeLessThanOrEqual(120);
      expect(skill.accuracy).toBeGreaterThanOrEqual(1);
      expect(skill.accuracy).toBeLessThanOrEqual(100);
      expect([0, 50, 100]).toContain(skill.costGauge);
      if (skill.gradeRange[1] === 1) expect(skill.power).toBeLessThanOrEqual(80);
    }
  });
});

it('各問題が実際のバトルの技選択から候補になる', async () => {
  const { QuestionBank } = await import('../../src/questions/engine/bank');
  const { filterCandidates } = await import('../../src/questions/engine/pick');
  const { battleQuestionQuery } = await import('../../src/scenes/battle/questionQuery');
  const { loadContent } = await import('../../src/core/content/loader');
  const { bank, report } = await QuestionBank.load(
    questionFiles('content/questions/seikatsu'),
    async (file) => JSON.parse(readFileSync(file, 'utf8')),
  );
  expect(report).toEqual({ loaded: questions.length, omitted: 0, quarantined: 0, skipped: [] });
  const content = await loadContent(async (path) => JSON.parse(readFileSync(`content/${path}`, 'utf8')));
  for (const question of bank.all()) {
    const skill = content.skills.get(mapping[question.id]!);
    expect(skill, question.id).toBeDefined();
    const query = battleQuestionQuery(skill!, false, question.grade, bank);
    expect(
      filterCandidates(bank, query).map((candidate) => candidate.id),
      question.id,
    ).toContain(question.id);
  }
});

it('各割当技を満点で習得し、育成と編成に使える', async () => {
  const { QuestionBank } = await import('../../src/questions/engine/bank');
  const { loadContent } = await import('../../src/core/content/loader');
  const { createNewGame } = await import('../../src/core/state/newGame');
  const { recordLearningResult } = await import('../../src/scenes/shared/askEnv');
  const { assignedSkillLevel } = await import('../../src/core/progression/assignedSkillTraining');
  const { availableLoadoutSkills, setLoadoutSkill } =
    await import('../../src/core/progression/heroSkillLoadout');
  const { bank } = await QuestionBank.load(questionFiles('content/questions/seikatsu'), async (file) =>
    JSON.parse(readFileSync(file, 'utf8')),
  );
  const content = await loadContent(async (path) => JSON.parse(readFileSync(`content/${path}`, 'utf8')));
  for (const id of new Set(Object.values(mapping))) {
    const question = bank.all().find((q) => mapping[q.id] === id)!;
    const skill = content.skills.get(id)!;
    const game = createNewGame({ name: 'ハル', grade: question.grade }, 100);
    const result = { questionId: question.id, score: 0.5, timeMs: 100, attempts: 1 };
    recordLearningResult(game, question, result, 1, 2, 'battle');
    expect(game.player.skills).not.toContain(id);
    for (let count = 1; count <= 8; count++) {
      recordLearningResult(game, question, { ...result, score: 1 }, 1, 2, 'battle');
      expect(assignedSkillLevel(game.progress.counters[`seikatsu-training:${id}`] ?? 0)).toBe(
        count >= 8 ? 4 : count >= 4 ? 3 : count >= 2 ? 2 : 1,
      );
    }
    expect(game.player.skills.filter((value) => value === id)).toHaveLength(1);
    const available = availableLoadoutSkills(
      game.player.skills,
      [],
      content.skills,
      content.settings.subjectGauge.uniqueSkills,
    );
    const category = skill.costGauge > 0 ? 'charge' : 'normal';
    expect(
      setLoadoutSkill({ normal: [], charge: [] }, category, 0, id, content.skills, available)?.[category],
    ).toEqual([id]);
  }
});

it('未習得でも学習ロードマップの候補から全問題に到達できる', async () => {
  const { QuestionBank } = await import('../../src/questions/engine/bank');
  const { curriculumGraph } = await import('../../src/core/learning/catalog');
  const { rankLearningRecommendations } = await import('../../src/core/learning/recommendationPolicy');
  const { bank } = await QuestionBank.load(questionFiles('content/questions/seikatsu'), async (file) =>
    JSON.parse(readFileSync(file, 'utf8')),
  );
  for (const grade of [1, 2] as const) {
    const ranked = rankLearningRecommendations({
      graph: curriculumGraph,
      questionBank: bank,
      conceptStates: {},
      attempts: [],
      recentQuestionIds: [],
      unitMastery: {},
      grandfatheredUnitIds: [],
      gradeScope: { grade, includeLower: false, challengeHigher: false },
      evaluationNow: 0,
    });
    expect(ranked.map((item) => item.questionId).sort()).toEqual(
      bank
        .all()
        .filter((question) => question.grade === grade)
        .map((question) => question.id)
        .sort(),
    );
  }
});

it('画像と内容が食い違った問題は写真に依存せずに解ける', () => {
  const ids = ['3b67be132f8a', '4cefc3ecf7c1', 'b136e1814085', 'd6bf3053e390', 'da56ff58ce6b'];
  for (const id of ids) {
    const question = questionFiles('content/questions/seikatsu')
      .flatMap(
        (file) =>
          JSON.parse(readFileSync(file, 'utf8')) as {
            id: string;
            payload: { prompt: string; promptImage?: string };
          }[],
      )
      .find((item) => item.id.endsWith(id));
    expect(question, id).toBeDefined();
    expect(question!.payload.promptImage, id).toBeUndefined();
    expect(question!.payload.prompt, id).not.toContain('写真');
  }
});
