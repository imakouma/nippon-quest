import type { QuestionCatalog } from '../core/content/manifest';
import { tOpt } from '../ui/i18n';
import { stripRuby } from '../ui/ruby';

interface QuestionTreeProps {
  catalog: QuestionCatalog;
  units: ReadonlyMap<string, string>;
  subjects: ReadonlyMap<string, string>;
  selectedFile: string | null | undefined;
  onSelectFile: (file: string | null | undefined) => void;
}

const fileName = (file: string) => file.slice(file.lastIndexOf('/') + 1);
const pgText = (key: string) => stripRuby(tOpt(`tools.playground.${key}`) ?? '', 'kanji');
const closeChildren = (folder: HTMLDetailsElement) => {
  if (!folder.open)
    folder.querySelectorAll('details[open]').forEach((child) => child.removeAttribute('open'));
};

export function QuestionTree({ catalog, units, subjects, selectedFile, onSelectFile }: QuestionTreeProps) {
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
          aria-pressed={selectedFile === null}
          onClick={() => onSelectFile(null)}
        >
          <span class="pg-tree-label">{pgText('all')}</span>
          <span class="pg-tree-count">
            {catalog.totalQuestions}
            {pgText('questionSuffix')}
          </span>
        </button>
        {catalog.subjects.map((subject) => (
          <details
            name="question-tree-subject"
            data-subject={subject.subject}
            onToggle={(event) => {
              closeChildren(event.currentTarget as HTMLDetailsElement);
              if (
                !(event.currentTarget as HTMLDetailsElement).open &&
                selectedFile?.startsWith(`questions/${subject.subject}/`)
              )
                onSelectFile(undefined);
            }}
          >
            <summary>
              <span class="pg-tree-label">
                {stripRuby(subjects.get(subject.subject) ?? subject.subject, 'kanji')}
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
                    selectedFile?.startsWith(`questions/${subject.subject}/g${grade.grade}/`)
                  )
                    onSelectFile(undefined);
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
                  <details
                    data-unit={unit.unit}
                    onToggle={(event) => {
                      if (
                        !(event.currentTarget as HTMLDetailsElement).open &&
                        unit.sets.some((set) => set.file === selectedFile)
                      )
                        onSelectFile(undefined);
                    }}
                  >
                    <summary>
                      <span class="pg-tree-label">
                        {stripRuby(units.get(unit.unit) ?? unit.unit, 'kanji')}
                      </span>
                      <span class="pg-tree-count">
                        {unit.count}
                        {pgText('questionSuffix')}
                      </span>
                    </summary>
                    <ul>
                      {unit.sets.map((set) => (
                        <li>
                          <button
                            type="button"
                            aria-pressed={selectedFile === set.file}
                            title={set.file}
                            onClick={() => onSelectFile(set.file)}
                          >
                            <span class="pg-tree-label">{fileName(set.file)}</span>
                            <span class="pg-tree-count">
                              {set.count}
                              {pgText('questionSuffix')}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </details>
            ))}
          </details>
        ))}
      </section>
    </details>
  );
}
