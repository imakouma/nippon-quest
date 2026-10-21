import type { Item, Skill } from '../../core/content/schemas';
import type { ActionResult, Command } from '../../core/battle/types';
import type { Grade, QuestionQuery, Subject } from '../../questions/contracts';
import { musubiDamaQuestionQuery } from './questionQueries';

const SUBJECTS: readonly Subject[] = ['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo'];

export function selectMusubiDamaQuestion(input: {
  skillIds: readonly string[];
  skills: ReadonlyMap<string, Skill>;
  grade: Grade;
  areaId: string;
  hasCandidate(query: QuestionQuery): boolean;
}): QuestionQuery | null {
  const learned = input.skillIds.flatMap((id) => {
    const subject = input.skills.get(id)?.subject;
    return subject ? [subject] : [];
  });
  const subjects = [...new Set<Subject>([...learned, ...SUBJECTS])];
  return (
    subjects
      .map((subject) => musubiDamaQuestionQuery(subject, input.grade, input.areaId))
      .find(input.hasCandidate) ?? null
  );
}

export async function prepareMusubiDamaCommand(
  item: Item,
  skillIds: readonly string[],
  skills: ReadonlyMap<string, Skill>,
  grade: Grade,
  areaId: string,
  timeLimitScale: number,
  hint: string,
  hasCandidate: (query: QuestionQuery) => boolean,
  ask: (query: QuestionQuery, title: string, subject: Subject, hint: string) => Promise<ActionResult>,
): Promise<Command | null> {
  const query = selectMusubiDamaQuestion({ skillIds, skills, grade, areaId, hasCandidate });
  if (!query) return null;
  const result = await ask(query, item.name, query.subject, hint);
  return result.attempts > 0 ? { kind: 'item', itemId: item.id, result, timeLimitScale } : null;
}
