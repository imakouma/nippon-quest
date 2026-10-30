import type { QuestionCatalog } from '../core/content/manifest';
import type { ComponentChildren } from 'preact';
import { tOpt } from '../ui/i18n';
import { stripRuby } from '../ui/ruby';

interface QuestionTreeProps {
  catalog: QuestionCatalog;
  units: ReadonlyMap<string, string>;
  subjects: ReadonlyMap<string, string>;
  selectedUnit: string | null | undefined;
  onSelectUnit: (unit: string | null | undefined) => void;
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
  onSelectUnit,
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
                  : stripRuby(subjects.get(subject.subject) ?? subject.subject, 'kanji')}
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
                {grade.units.map((unit) => (
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
