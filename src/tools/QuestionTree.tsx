import type { QuestionCatalog } from '../core/content/manifest';
import { RubyLabel } from '../ui/RubyLabel';

interface QuestionTreeProps {
  catalog: QuestionCatalog;
  units: ReadonlyMap<string, string>;
  subjects: ReadonlyMap<string, string>;
  selectedFile: string | null;
  onSelectFile: (file: string | null) => void;
}

const fileName = (file: string) => file.slice(file.lastIndexOf('/') + 1);

export function QuestionTree({ catalog, units, subjects, selectedFile, onSelectFile }: QuestionTreeProps) {
  return (
    <nav class="pg-tree" aria-label="問題フォルダ">
      <strong>問題フォルダ</strong>
      <button
        type="button"
        class="pg-tree-all"
        aria-pressed={selectedFile === null}
        onClick={() => onSelectFile(null)}
      >
        すべて <span class="pg-tree-count">{catalog.totalQuestions}問</span>
      </button>
      {catalog.subjects.map((subject) => (
        <details data-subject={subject.subject}>
          <summary>
            <RubyLabel text={subjects.get(subject.subject) ?? subject.subject} />
            <span class="pg-tree-count">{subject.count}問</span>
          </summary>
          {subject.grades.map((grade) => (
            <details data-grade={grade.grade}>
              <summary>
                小{grade.grade}
                <span class="pg-tree-count">{grade.count}問</span>
              </summary>
              {grade.units.map((unit) => (
                <details data-unit={unit.unit}>
                  <summary>
                    <RubyLabel text={units.get(unit.unit) ?? unit.unit} />
                    <span class="pg-tree-count">{unit.count}問</span>
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
                          {fileName(set.file)} <span class="pg-tree-count">{set.count}問</span>
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
    </nav>
  );
}
