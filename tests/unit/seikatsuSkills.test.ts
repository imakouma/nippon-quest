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
