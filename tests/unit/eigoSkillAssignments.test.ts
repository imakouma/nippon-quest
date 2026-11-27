import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assignments from '../../content/eigo-skill-assignments.json';
import skills from '../../content/eigo-skills.json';
import existingSkills from '../../content/skills.json';

function questionFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? questionFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

describe('English skill assignments', () => {
  it('あいさつ、好み、日課、文字、依頼を学習内容に合わせて分ける', () => {
    const table: Readonly<Record<string, string>> = assignments;
    expect(table['eigo.g3.greetings-preferences.0001']).toBe('sk-eigo-greeting');
    expect(table['eigo.g3.greetings-preferences.0009']).toBe('sk-eigo-likes');
    expect(table['eigo.g4.days-time-routines.0001']).toBe('sk-eigo-clock');
    expect(table['eigo.g4.days-time-routines.0011']).toBe('sk-eigo-routine');
    expect(table['eigo.g5.alphabet-self-introduction.0001']).toBe('sk-eigo-alphabet-g5');
    expect(table['eigo.g5.alphabet-self-introduction.0003']).toBe('sk-eigo-introduce');
    expect(table['eigo.g4.directions-requests.0010']).toBe('sk-eigo-request');
  });
  const questions = questionFiles('content/questions/eigo').flatMap(
    (path) => JSON.parse(readFileSync(path, 'utf8')) as { id: string; grade: number; unit: string }[],
  );
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const mapping: Record<string, string> = assignments;

  it('assigns every real question exactly once to a skill for its grade and unit', () => {
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length);
    expect(Object.keys(mapping).sort()).toEqual(questions.map((question) => question.id).sort());
    for (const question of questions) {
      const skill = byId.get(mapping[question.id] ?? '');
      expect(skill, question.id).toBeDefined();
      expect(skill!.gradeRange[0]).toBeLessThanOrEqual(question.grade);
      expect(skill!.gradeRange[1]).toBeGreaterThanOrEqual(question.grade);
      expect(skill!.unitHint).toContain(question.unit);
    }
  });

  it('preserves existing English IDs and gives valid, age-scaled combat values', () => {
    expect(byId.size).toBe(skills.length);
    for (const skill of existingSkills.filter((entry) => entry.subject === 'eigo')) {
      expect(byId.has(skill.id)).toBe(true);
    }
    for (const skill of skills) {
      expect(skill.subject).toBe('eigo');
      expect(skill.name && skill.flavor).toBeTruthy();
      expect(skill.mp).toBe(0);
      expect(skill.power).toBeGreaterThan(0);
      expect(skill.accuracy).toBeGreaterThan(0);
      expect(skill.accuracy).toBeLessThanOrEqual(100);
      expect([0, 50, 100]).toContain(skill.costGauge);
    }
    const assigned = skills.filter((skill) => skill.unitHint);
    for (let grade = 3; grade < 6; grade++) {
      const current = assigned.filter((skill) => skill.gradeRange[0] === grade && skill.costGauge === 0);
      const next = assigned.filter((skill) => skill.gradeRange[0] === grade + 1 && skill.costGauge === 0);
      expect(Math.max(...current.map((skill) => skill.power))).toBeLessThanOrEqual(
        Math.min(...next.map((skill) => skill.power)),
      );
    }
  });
});
