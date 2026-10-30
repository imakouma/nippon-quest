import { z } from 'zod/v3';
import type { QuestionBase } from '../questions/contracts';
import { FIRST_GRADE_READING_UNITS, kanjiCategory } from './kanjiCategory';

export function isKanjiUnit(unit: string, units: ReadonlyMap<string, string>): boolean {
  return /漢字|かんじ|おんよみ・くんよみ|へんとつくり/.test(units.get(unit) ?? '') || unit.includes('kanji');
}

export function folderSubject(question: QuestionBase, units: ReadonlyMap<string, string>): string {
  return question.subject === 'kokugo' && isKanjiUnit(question.unit, units) ? 'kanji' : question.subject;
}

export function defaultFolderKey(question: QuestionBase, units: ReadonlyMap<string, string>): string {
  const subject = folderSubject(question, units);
  const category = subject === 'kanji' ? kanjiCategory(question) : '';
  const unit =
    question.grade === 1 && category === 'reading' && question.unit === FIRST_GRADE_READING_UNITS[1]
      ? FIRST_GRADE_READING_UNITS[0]
      : question.unit;
  return `${subject}:${question.grade}:${category}:${unit}`;
}

const folderSchema = z.object({
  id: z.string().min(1).max(160),
  name: z.string().trim().min(1).max(80),
  subject: z.enum(['kokugo', 'kanji', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo']),
  grade: z.number().int().min(1).max(6),
  parent: z.string().min(1).max(160).nullable(),
  category: z.enum(['reading', 'writing', 'review']).optional(),
});

export const folderLayoutSchema = z
  .object({
    folders: z.array(folderSchema).max(5000),
    assignments: z.record(z.string().max(160).nullable()),
    hidden: z.array(z.string().min(1).max(160)).max(5000),
  })
  .superRefine((layout, context) => {
    const folders = new Map(layout.folders.map((folder) => [folder.id, folder]));
    if (folders.size !== layout.folders.length)
      context.addIssue({ code: 'custom', message: 'フォルダ ID が重複しています' });
    for (const folder of layout.folders) {
      if (folder.category && folder.subject !== 'kanji')
        context.addIssue({ code: 'custom', message: '漢字以外に読み書きの分類は指定できません' });
      const visited = new Set([folder.id]);
      let parent = folder.parent;
      while (parent) {
        const next = folders.get(parent);
        if (
          !next ||
          visited.has(parent) ||
          next.subject !== folder.subject ||
          next.grade !== folder.grade ||
          next.category !== folder.category
        ) {
          context.addIssue({ code: 'custom', message: 'フォルダの親が不正です' });
          break;
        }
        visited.add(parent);
        parent = next.parent;
      }
    }
    for (const id of Object.values(layout.assignments)) {
      if (id !== null && !folders.has(id))
        context.addIssue({ code: 'custom', message: '問題の移動先がありません' });
    }
  });

export type FolderLayout = z.infer<typeof folderLayoutSchema>;

export function defaultFolderHidden(layout: FolderLayout, key: string): boolean {
  const [subject, grade, category] = key.split(':');
  return layout.hidden.includes(key) || layout.hidden.includes(`${subject}:${grade}:${category}:*`);
}

export function isUnfiled(
  question: QuestionBase,
  units: ReadonlyMap<string, string>,
  layout: FolderLayout,
): boolean {
  if (!Object.hasOwn(layout.assignments, question.id))
    return defaultFolderHidden(layout, defaultFolderKey(question, units));
  const id = layout.assignments[question.id];
  if (id === null) return true;
  const folder = layout.folders.find((item) => item.id === id);
  return (
    !folder ||
    folder.subject !== folderSubject(question, units) ||
    folder.grade !== question.grade ||
    (folder.category !== undefined && folder.category !== kanjiCategory(question))
  );
}

export const folderStateSchema = z.object({
  revision: z.number().int().nonnegative(),
  layout: folderLayoutSchema,
  snapshots: z
    .array(z.object({ id: z.string().uuid(), createdAt: z.string().datetime(), layout: folderLayoutSchema }))
    .max(1000),
});
export type FolderState = z.infer<typeof folderStateSchema>;

export function removeFolder(layout: FolderLayout, id: string): FolderLayout {
  const removed = new Set([id]);
  for (let changed = true; changed;) {
    changed = false;
    for (const folder of layout.folders) {
      if (folder.parent && removed.has(folder.parent) && !removed.has(folder.id)) {
        removed.add(folder.id);
        changed = true;
      }
    }
  }
  return {
    ...layout,
    folders: layout.folders.filter((folder) => !removed.has(folder.id)),
    assignments: Object.fromEntries(
      Object.entries(layout.assignments).map(([question, folder]) => [
        question,
        folder && removed.has(folder) ? null : folder,
      ]),
    ),
  };
}
