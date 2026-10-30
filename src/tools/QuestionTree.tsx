import type { QuestionCatalog } from '../core/content/manifest';
import type { ComponentChildren } from 'preact';
import { tOpt } from '../ui/i18n';
import { stripRuby } from '../ui/ruby';
import type { QuestionBase } from '../questions/contracts';
import { FIRST_GRADE_READING_UNITS, kanjiCategory, type KanjiCategory } from './kanjiCategory';
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
                        let categoryUnits = grade.units.map((unit) => {
                          const files = new Set(unit.sets.map((set) => set.file));
                          const count = entries.filter(
                            (entry) =>
                              files.has(entry.file) &&
                              kanjiCategory(entry.q) === category &&
                              (!entry.q ||
                                !Object.hasOwn(folderTools.state?.layout.assignments ?? {}, entry.q.id)),
                          ).length;
                          return { ...unit, count };
                        });
                        if (grade.grade === 1 && category === 'reading') {
                          const primary = categoryUnits.find(
                            (unit) => unit.unit === FIRST_GRADE_READING_UNITS[0],
                          );
                          const extra = categoryUnits.find(
                            (unit) => unit.unit === FIRST_GRADE_READING_UNITS[1],
                          );
                          if (primary && extra) {
                            categoryUnits = categoryUnits
                              .filter((unit) => unit !== extra)
                              .map((unit) =>
                                unit === primary ? { ...unit, count: unit.count + extra.count } : unit,
                              );
                          }
                        }
                        categoryUnits = categoryUnits.filter(
                          (unit) =>
                            unit.count > 0 &&
                            !folderTools.state?.layout.hidden.includes(
                              `${subject.subject}:${grade.grade}:${category}:${unit.unit}`,
                            ),
                        );
                        return (
                          <details
                            name="question-tree-kanji-category"
                            data-kanji-category={category}
                            onToggle={(event) => {
                              if (
                                !(event.currentTarget as HTMLDetailsElement).open &&
                                ((selectedCategory === category &&
                                  grade.units.some((unit) => unit.unit === selectedUnit)) ||
                                  (selectionIn(subject.subject, grade.grade) &&
                                    folderTools.state?.layout.folders.some(
                                      (folder) =>
                                        selectedUnit === `custom:${folder.id}` &&
                                        folder.category === category,
                                    )))
                              )
                                onSelectUnit(undefined);
                            }}
                          >
                            <summary>
                              <span class="pg-tree-label">
                                {pgText(`kanjiCategory${category[0]!.toUpperCase()}${category.slice(1)}`)}
                              </span>
                              <span class="pg-tree-count">
                                {categoryUnits.reduce((sum, unit) => sum + unit.count, 0) +
                                  entries.filter(
                                    ({ file, q }) =>
                                      !file.startsWith('questions/_samples/') &&
                                      q &&
                                      q.grade === grade.grade &&
                                      folderSubject(q, units) === 'kanji' &&
                                      kanjiCategory(q) === category &&
                                      folderTools.state?.layout.folders.some(
                                        (folder) =>
                                          folder.id === folderTools.state?.layout.assignments[q.id] &&
                                          folder.category === category,
                                      ),
                                  ).length}
                                {pgText('questionSuffix')}
                              </span>
                            </summary>
                            {folderTools.state && (
                              <div class="pg-folder-actions">
                                <button
                                  type="button"
                                  disabled={folderTools.busy}
                                  onClick={() =>
                                    deleteCategory(
                                      grade.grade,
                                      category,
                                      pgText(
                                        `kanjiCategory${category[0]!.toUpperCase()}${category.slice(1)}`,
                                      ),
                                    )
                                  }
                                >
                                  {pgText('folderDelete')}
                                </button>
                              </div>
                            )}
                            {categoryUnits.map((unit) => (
                              <div>
                                <button
                                  type="button"
                                  data-unit={unit.unit}
                                  aria-pressed={selectedUnit === unit.unit && selectedCategory === category}
                                  onClick={() =>
                                    onSelectUnit(
                                      selectedUnit === unit.unit && selectedCategory === category
                                        ? undefined
                                        : unit.unit,
                                      selectedUnit === unit.unit && selectedCategory === category
                                        ? undefined
                                        : category,
                                    )
                                  }
                                >
                                  <span class="pg-tree-label">
                                    {stripRuby(units.get(unit.unit) ?? unit.unit, 'kanji')}
                                  </span>
                                  <span class="pg-tree-count">
                                    {unit.count}
                                    {pgText('questionSuffix')}
                                  </span>
                                </button>
                                {folderTools.state && (
                                  <button
                                    type="button"
                                    class="pg-folder-delete"
                                    disabled={folderTools.busy}
                                    aria-label={`${stripRuby(units.get(unit.unit) ?? unit.unit, 'kanji')} ${pgText('folderDelete')}`}
                                    onClick={() =>
                                      deleteUnit(
                                        `${subject.subject}:${grade.grade}:${category}:${unit.unit}`,
                                        stripRuby(units.get(unit.unit) ?? unit.unit, 'kanji'),
                                      )
                                    }
                                  >
                                    {pgText('folderDelete')}
                                  </button>
                                )}
                                {selectedUnit === unit.unit && selectedCategory === category && questions}
                              </div>
                            ))}
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
                            aria-pressed={selectedUnit === unit.unit}
                            onClick={() => onSelectUnit(selectedUnit === unit.unit ? undefined : unit.unit)}
                          >
                            <span class="pg-tree-label">
                              {stripRuby(units.get(unit.unit) ?? unit.unit, 'kanji')}
                            </span>
                            <span class="pg-tree-count">
                              {unit.count -
                                entries.filter(
                                  ({ file, q }) =>
                                    unit.sets.some((set) => set.file === file) &&
                                    q &&
                                    Object.hasOwn(folderTools.state?.layout.assignments ?? {}, q.id),
                                ).length}
                              {pgText('questionSuffix')}
                            </span>
                          </button>
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
