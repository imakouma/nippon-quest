import type { QuestionCatalog } from '../core/content/manifest';
import { tOpt } from '../ui/i18n';
import { RubyLabel } from '../ui/RubyLabel';
import { stripRuby } from '../ui/ruby';

interface QuestionTreeProps {
  catalog: QuestionCatalog;
  units: ReadonlyMap<string, string>;
  subjects: ReadonlyMap<string, string>;
  selectedFile: string | null;
  onSelectFile: (file: string | null) => void;
}

const fileName = (file: string) => file.slice(file.lastIndexOf('/') + 1);
const pgText = (key: string) => stripRuby(tOpt(`tools.playground.${key}`) ?? '', 'kanji');

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
          {pgText('all')}{' '}
          <span class="pg-tree-count">
            {catalog.totalQuestions}
            {pgText('questionSuffix')}
          </span>
        </button>
        {catalog.subjects.map((subject) => (
          <details data-subject={subject.subject}>
            <summary>
              <RubyLabel text={subjects.get(subject.subject) ?? subject.subject} />
              <span class="pg-tree-count">
                {subject.count}
                {pgText('questionSuffix')}
              </span>
            </summary>
            {subject.grades.map((grade) => (
              <details data-grade={grade.grade}>
                <summary>
                  {pgText('gradePrefix')}
                  {grade.grade}
                  <span class="pg-tree-count">
                    {grade.count}
                    {pgText('questionSuffix')}
                  </span>
                </summary>
                {grade.units.map((unit) => (
                  <details data-unit={unit.unit}>
                    <summary>
                      <RubyLabel text={units.get(unit.unit) ?? unit.unit} />
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
                            {fileName(set.file)}{' '}
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
