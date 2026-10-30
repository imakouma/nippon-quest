import type { QuestionCatalog } from '../core/content/manifest';
import type { ComponentChildren } from 'preact';
import { tOpt } from '../ui/i18n';
import { stripRuby } from '../ui/ruby';
import type { QuestionBase } from '../questions/contracts';
import { FIRST_GRADE_READING_UNITS, kanjiCategory, type KanjiCategory } from './kanjiCategory';

interface QuestionTreeProps {
  catalog: QuestionCatalog;
  units: ReadonlyMap<string, string>;
  subjects: ReadonlyMap<string, string>;
  selectedUnit: string | null | undefined;
  selectedCategory: KanjiCategory | undefined;
  onSelectUnit: (unit: string | null | undefined, category?: KanjiCategory) => void;
  entries: { file: string; q: QuestionBase | null }[];
  questions: ComponentChildren;
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
}: QuestionTreeProps) {
  const isKanji = (unit: { unit: string }) =>
    /漢字|かんじ|おんよみ・くんよみ|へんとつくり/.test(units.get(unit.unit) ?? '') ||
    unit.unit.includes('kanji');
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
                subject.grades.some((grade) => grade.units.some((unit) => unit.unit === selectedUnit))
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
                    grade.units.some((unit) => unit.unit === selectedUnit)
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
                  ? (['reading', 'writing', 'review'] as const).map((category) => {
                      let categoryUnits = grade.units
                        .map((unit) => {
                          const files = new Set(unit.sets.map((set) => set.file));
                          const count = entries.filter(
                            (entry) => files.has(entry.file) && kanjiCategory(entry.q) === category,
                          ).length;
                          return { ...unit, count };
                        })
                        .filter((unit) => unit.count > 0);
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
                      return (
                        <details
                          name="question-tree-kanji-category"
                          data-kanji-category={category}
                          onToggle={(event) => {
                            if (
                              !(event.currentTarget as HTMLDetailsElement).open &&
                              selectedCategory === category &&
                              grade.units.some((unit) => unit.unit === selectedUnit)
                            )
                              onSelectUnit(undefined);
                          }}
                        >
                          <summary>
                            <span class="pg-tree-label">
                              {pgText(`kanjiCategory${category[0]!.toUpperCase()}${category.slice(1)}`)}
                            </span>
                            <span class="pg-tree-count">
                              {categoryUnits.reduce((sum, unit) => sum + unit.count, 0)}
                              {pgText('questionSuffix')}
                            </span>
                          </summary>
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
                              {selectedUnit === unit.unit && selectedCategory === category && questions}
                            </div>
                          ))}
                        </details>
                      );
                    })
                  : grade.units.map((unit) => (
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
                            {unit.count}
                            {pgText('questionSuffix')}
                          </span>
                        </button>
                        {selectedUnit === unit.unit && questions}
                      </div>
                    ))}
              </details>
            ))}
          </details>
        ))}
      </section>
    </details>
  );
}
