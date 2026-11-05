import type { QuestionCatalog } from '../core/content/manifest';
import type { ComponentChildren } from 'preact';
import { tOpt } from '../ui/i18n';
import { stripRuby } from '../ui/ruby';
import type { QuestionBase } from '../questions/contracts';
import {
  FIRST_GRADE_READING_UNITS,
  kanjiCategory,
  kanjiScope,
  kanjiScopeMatches,
  type KanjiCategory,
  type KanjiScopeKind,
} from './kanjiCategory';
import { CustomFolders, FolderControls } from './FolderControls';
import { defaultFolderKey, folderSubject, isKanjiUnit, isUnfiled, removeFolder } from './folderLayout';
import type { useFolderState } from './useFolderState';

interface QuestionTreeProps {
  catalog: QuestionCatalog;
  units: ReadonlyMap<string, string>;
  subjects: ReadonlyMap<string, string>;
  selectedUnit: string | null | undefined;
  selectedCategory: KanjiCategory | undefined;
  onSelectUnit: (unit: string | null | undefined, category?: KanjiCategory) => void;
  entries: { file: string; q: QuestionBase | null; problem: string | null }[];
  questions: ComponentChildren;
  folderTools: ReturnType<typeof useFolderState>;
}

const pgText = (key: string) => stripRuby(tOpt(`tools.playground.${key}`) ?? '', 'kanji');
const closeChildren = (folder: HTMLDetailsElement) => {
  if (!folder.open)
    folder.querySelectorAll('details[open]').forEach((child) => child.removeAttribute('open'));
};

export function QuestionTree({
  catalog,
  units,
  subjects,
  selectedUnit,
  selectedCategory,
  onSelectUnit,
  entries,
  questions,
  folderTools,
}: QuestionTreeProps) {
  const isKanji = (unit: { unit: string }) => isKanjiUnit(unit.unit, units);
  const splitKokugo = (subject: QuestionCatalog['subjects'][number], kanji: boolean) => {
    const grades = subject.grades.flatMap((grade) => {
      const matchingUnits = grade.units.filter((unit) => isKanji(unit) === kanji);
      return matchingUnits.length
        ? [
            {
              ...grade,
              units: matchingUnits,
              count: matchingUnits.reduce((sum, unit) => sum + unit.count, 0),
            },
          ]
        : [];
    });
    return {
      ...subject,
      subject: kanji ? 'kanji' : subject.subject,
      grades,
      count: grades.reduce((sum, grade) => sum + grade.count, 0),
    };
  };
  const treeSubjects = catalog.subjects.flatMap((subject) =>
    subject.subject === 'kokugo' ? [splitKokugo(subject, false), splitKokugo(subject, true)] : [subject],
  );
  const selectionIn = (subject: string, grade?: number) => {
    if (!selectedUnit) return false;
    if (selectedUnit.startsWith('kanji-scope:')) {
      const selectedGrade = Number(selectedUnit.split(':')[1]);
      return subject === 'kanji' && (grade === undefined || grade === selectedGrade);
    }
    if (selectedUnit.startsWith('unfiled:'))
      return (
        selectedUnit.startsWith(`unfiled:${subject}:`) &&
        (grade === undefined || selectedUnit === `unfiled:${subject}:${grade}`)
      );
    if (!selectedUnit.startsWith('custom:')) return false;
    return !!folderTools.state?.layout.folders.some(
      (folder) =>
        folder.id === selectedUnit.slice(7) &&
        folder.subject === subject &&
        (grade === undefined || folder.grade === grade),
    );
  };
  const deleteUnit = (key: string, name: string) => {
    const layout = folderTools.state?.layout;
    if (!layout) return;
    const [, , category, unitId] = key.split(':');
    const sourceUnits: readonly (string | undefined)[] =
      unitId === FIRST_GRADE_READING_UNITS[0] && category === 'reading'
        ? FIRST_GRADE_READING_UNITS
        : [unitId];
    const sourceFiles = new Set(
      catalog.subjects.flatMap((subject) =>
        subject.grades.flatMap((grade) =>
          grade.units
            .filter((unit) => sourceUnits.includes(unit.unit))
            .flatMap((unit) => unit.sets.map((set) => set.file)),
        ),
      ),
    );
    if (entries.some((entry) => sourceFiles.has(entry.file) && !entry.q)) {
      window.alert(pgText('folderInvalid'));
      return;
    }
    const affected = entries.filter(
      ({ file, q }) =>
        sourceFiles.has(file) &&
        q &&
        defaultFolderKey(q, units) === key &&
        !Object.hasOwn(layout.assignments, q.id),
    );
    if (affected.some((entry) => entry.problem)) {
      window.alert(pgText('folderInvalid'));
      return;
    }
    if (
      !window.confirm(
        `${name}（${affected.length}${pgText('questionSuffix')}）\n${pgText('folderDeleteConfirm')}`,
      )
    )
      return;
    const assignments = { ...layout.assignments };
    for (const entry of affected) if (entry.q) assignments[entry.q.id] = null;
    void folderTools.change({ ...layout, assignments, hidden: [...layout.hidden, key] });
    onSelectUnit(undefined);
  };
  const deleteCategory = (grade: number, category: KanjiCategory, name: string) => {
    const layout = folderTools.state?.layout;
    if (!layout) return;
    if (
      category === 'review' &&
      entries.some(
        ({ file, q }) =>
          !q &&
          catalog.subjects.some((subject) =>
            subject.grades.some(
              (item) =>
                item.grade === grade &&
                item.units.some((unit) => isKanji(unit) && unit.sets.some((set) => set.file === file)),
            ),
          ),
      )
    ) {
      window.alert(pgText('folderInvalid'));
      return;
    }
    const folderIds = new Set(
      layout.folders
        .filter(
          (folder) => folder.subject === 'kanji' && folder.grade === grade && folder.category === category,
        )
        .map((folder) => folder.id),
    );
    const affected = entries.filter(
      ({ file, q }) =>
        !file.startsWith('questions/_samples/') &&
        q &&
        q.grade === grade &&
        folderSubject(q, units) === 'kanji' &&
        kanjiCategory(q) === category &&
        (!Object.hasOwn(layout.assignments, q.id) || folderIds.has(layout.assignments[q.id] ?? '')),
    );
    if (affected.some((entry) => entry.problem)) {
      window.alert(pgText('folderInvalid'));
      return;
    }
    if (
      !window.confirm(
        `${name}（${affected.length}${pgText('questionSuffix')}）\n${pgText('folderDeleteConfirm')}`,
      )
    )
      return;
    let next = layout;
    for (const id of folderIds) next = removeFolder(next, id);
    const assignments = { ...next.assignments };
    for (const entry of affected) if (entry.q) assignments[entry.q.id] = null;
    void folderTools.change({
      ...next,
      assignments,
      hidden: [...next.hidden, `kanji:${grade}:${category}:*`],
    });
    onSelectUnit(undefined);
  };
  return (
    <details class="pg-tree-details" open>
      <summary>
        <strong>{pgText('folder')}</strong>
        <span class="pg-tree-count">
          {catalog.totalQuestions}
          {pgText('questionSuffix')}
        </span>
      </summary>
      <section class="pg-tree" aria-label={pgText('folder')}>
        <FolderControls tools={folderTools} />
        <button
          type="button"
          class="pg-tree-all"
          aria-pressed={selectedUnit === null}
          onClick={() => onSelectUnit(selectedUnit === null ? undefined : null)}
        >
          <span class="pg-tree-label">{pgText('all')}</span>
          <span class="pg-tree-count">
            {catalog.totalQuestions}
            {pgText('questionSuffix')}
          </span>
        </button>
        {selectedUnit === null && questions}
        {treeSubjects.map((subject) => (
          <details
            name="question-tree-subject"
            data-subject={subject.subject}
            onToggle={(event) => {
              closeChildren(event.currentTarget as HTMLDetailsElement);
              if (
                !(event.currentTarget as HTMLDetailsElement).open &&
                (subject.grades.some((grade) => grade.units.some((unit) => unit.unit === selectedUnit)) ||
                  selectionIn(subject.subject))
              )
                onSelectUnit(undefined);
            }}
          >
            <summary>
              <span class="pg-tree-label">
                {subject.subject === 'kanji'
                  ? pgText('kanjiFolder')
                  : stripRuby(
                      tOpt(`field.roadmapSubjectLong.${subject.subject}`) ??
                        subjects.get(subject.subject) ??
                        subject.subject,
                      'kanji',
                    )}
              </span>
              <span class="pg-tree-count">
                {subject.count}
                {pgText('questionSuffix')}
              </span>
            </summary>
            {subject.grades.map((grade) => (
              <details
                name="question-tree-grade"
                data-grade={grade.grade}
                onToggle={(event) => {
                  closeChildren(event.currentTarget as HTMLDetailsElement);
                  if (
                    !(event.currentTarget as HTMLDetailsElement).open &&
                    (grade.units.some((unit) => unit.unit === selectedUnit) ||
                      selectionIn(subject.subject, grade.grade))
                  )
                    onSelectUnit(undefined);
                }}
              >
                <summary>
                  <span class="pg-tree-label">
                    {pgText('gradePrefix')}
                    {grade.grade}
                  </span>
                  <span class="pg-tree-count">
                    {grade.count}
                    {pgText('questionSuffix')}
                  </span>
                </summary>
                {subject.subject === 'kanji'
                  ? (['reading', 'writing', 'review'] as const)
                      .filter(
                        (category) =>
                          !folderTools.state?.layout.hidden.includes(`kanji:${grade.grade}:${category}:*`),
                      )
                      .map((category) => {
                        const defaultEntries = entries.filter(
                          ({ file, q }) =>
                            !file.startsWith('questions/_samples/') &&
                            q &&
                            q.grade === grade.grade &&
                            folderSubject(q, units) === 'kanji' &&
                            kanjiCategory(q) === category &&
                            !Object.hasOwn(folderTools.state?.layout.assignments ?? {}, q.id),
                        );
                        const assignedCount = entries.filter(
                          ({ file, q }) =>
                            !file.startsWith('questions/_samples/') &&
                            q &&
                            q.grade === grade.grade &&
                            folderSubject(q, units) === 'kanji' &&
                            folderTools.state?.layout.folders.some(
                              (folder) =>
                                folder.id === folderTools.state?.layout.assignments[q.id] &&
                                folder.category === category,
                            ),
                        ).length;
                        const categoryName = pgText(
                          `kanjiCategory${category[0]!.toUpperCase()}${category.slice(1)}`,
                        );
                        const directKind: KanjiScopeKind | undefined =
                          category === 'writing' ? 'writing' : category === 'review' ? 'misc' : undefined;
                        const directScope = directKind ? kanjiScope(grade.grade, directKind) : undefined;
                        const scopeFolder = (
                          kind: KanjiScopeKind,
                          label: string,
                          attribute: 'reading' | 'other',
                        ) => {
                          const scope = kanjiScope(grade.grade, kind);
                          const count = defaultEntries.filter(
                            ({ q }) => q && kanjiScopeMatches(q, scope),
                          ).length;
                          return (
                            <details
                              name="question-tree-kanji-subcategory"
                              data-kanji-reading-kind={attribute === 'reading' ? kind : undefined}
                              data-kanji-other-kind={attribute === 'other' ? kind : undefined}
                              onToggle={(event) => {
                                const open = (event.currentTarget as HTMLDetailsElement).open;
                                if (open) onSelectUnit(scope, category);
                                else if (selectedUnit === scope) onSelectUnit(undefined);
                              }}
                            >
                              <summary>
                                <span class="pg-tree-label">{label}</span>
                                <span class="pg-tree-count">
                                  {count}
                                  {pgText('questionSuffix')}
                                </span>
                              </summary>
                              {selectedUnit === scope && questions}
                            </details>
                          );
                        };
                        return (
                          <details
                            name="question-tree-kanji-category"
                            data-kanji-category={category}
                            onToggle={(event) => {
                              const open = (event.currentTarget as HTMLDetailsElement).open;
                              if (open && directScope) onSelectUnit(directScope, category);
                              else if (!open && selectedCategory === category) onSelectUnit(undefined);
                            }}
                          >
                            <summary>
                              <span class="pg-tree-label">{categoryName}</span>
                              <span class="pg-tree-count">
                                {defaultEntries.length + assignedCount}
                                {pgText('questionSuffix')}
                              </span>
                            </summary>
                            {folderTools.state && (
                              <div class="pg-folder-actions">
                                <button
                                  type="button"
                                  disabled={folderTools.busy}
                                  onClick={() => deleteCategory(grade.grade, category, categoryName)}
                                >
                                  {pgText('folderDelete')}
                                </button>
                              </div>
                            )}
                            {category === 'reading' && (
                              <div class="pg-kanji-subfolders">
                                {scopeFolder('on', pgText('kanjiReadingOn'), 'reading')}
                                {scopeFolder('kun', pgText('kanjiReadingKun'), 'reading')}
                              </div>
                            )}
                            {category === 'review' && (
                              <div class="pg-kanji-subfolders">
                                {scopeFolder('idiom', pgText('kanjiOtherIdioms'), 'other')}
                                {scopeFolder('relation', pgText('kanjiOtherRelations'), 'other')}
                              </div>
                            )}
                            {directScope && selectedUnit === directScope && questions}
                            <CustomFolders
                              tools={folderTools}
                              subject={subject.subject}
                              grade={grade.grade}
                              category={category}
                              selected={selectedUnit}
                              onSelect={(id) => onSelectUnit(id)}
                              questions={questions}
                              count={(id) =>
                                entries.filter(
                                  ({ file, q }) =>
                                    !file.startsWith('questions/_samples/') &&
                                    q &&
                                    q.grade === grade.grade &&
                                    folderSubject(q, units) === subject.subject &&
                                    folderTools.state?.layout.assignments[q.id] === id,
                                ).length
                              }
                            />
                          </details>
                        );
                      })
                  : grade.units
                      .filter(
                        (unit) =>
                          !folderTools.state?.layout.hidden.includes(
                            `${subject.subject}:${grade.grade}::${unit.unit}`,
                          ),
                      )
                      .map((unit) => (
                        <div>
                          <button
                            type="button"
                            data-unit={unit.unit}
                            aria-describedby={`pg-unit-count-${unit.unit}`}
                            aria-pressed={selectedUnit === unit.unit}
                            onClick={() => onSelectUnit(selectedUnit === unit.unit ? undefined : unit.unit)}
                          >
                            <span class="pg-tree-label">
                              {stripRuby(units.get(unit.unit) ?? unit.unit, 'kanji')}
                            </span>
                          </button>
                          <div class="pg-unit-meta">
                            <span class="pg-tree-count" id={`pg-unit-count-${unit.unit}`}>
                              {unit.count -
                                entries.filter(
                                  ({ file, q }) =>
                                    unit.sets.some((set) => set.file === file) &&
                                    q &&
                                    Object.hasOwn(folderTools.state?.layout.assignments ?? {}, q.id),
                                ).length}
                              {pgText('questionSuffix')}
                            </span>
                            {folderTools.state && (
                              <button
                                type="button"
                                class="pg-folder-delete"
                                disabled={folderTools.busy}
                                aria-label={`${stripRuby(units.get(unit.unit) ?? unit.unit, 'kanji')} ${pgText('folderDelete')}`}
                                onClick={() =>
                                  deleteUnit(
                                    `${subject.subject}:${grade.grade}::${unit.unit}`,
                                    stripRuby(units.get(unit.unit) ?? unit.unit, 'kanji'),
                                  )
                                }
                              >
                                {pgText('folderDelete')}
                              </button>
                            )}
                          </div>
                          {selectedUnit === unit.unit && questions}
                        </div>
                      ))}
                <CustomFolders
                  tools={folderTools}
                  subject={subject.subject}
                  grade={grade.grade}
                  selected={selectedUnit}
                  onSelect={(id) => onSelectUnit(id)}
                  questions={questions}
                  count={(id) =>
                    entries.filter(
                      ({ file, q }) =>
                        !file.startsWith('questions/_samples/') &&
                        q &&
                        q.grade === grade.grade &&
                        folderSubject(q, units) === subject.subject &&
                        (id === null && folderTools.state
                          ? isUnfiled(q, units, folderTools.state.layout)
                          : folderTools.state?.layout.assignments[q.id] === id),
                    ).length
                  }
                />
              </details>
            ))}
          </details>
        ))}
      </section>
    </details>
  );
}
