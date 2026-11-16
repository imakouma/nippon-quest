import type { ComponentChildren } from 'preact';
import type { QuestionBase } from '../questions/contracts';
import { stripRuby } from '../ui/ruby';
import { tOpt } from '../ui/i18n';
import { mathReviewGroupsByGrade, mathReviewMatches } from './mathReviewOrder';

const text = (key: string) => stripRuby(tOpt(`tools.playground.${key}`) ?? '', 'kanji');

export function MathReviewFolders({
  grade,
  entries,
  selected,
  onSelect,
  questions,
}: {
  grade: number;
  entries: { file: string; q: QuestionBase | null }[];
  selected: string | null | undefined;
  onSelect: (scope: string | undefined) => void;
  questions: ComponentChildren;
}) {
  const groups = [
    ...(mathReviewGroupsByGrade[grade] ?? []),
    { id: 'unclassified', name: text('mathUnclassified'), questionIds: [] },
  ];
  return (
    <section aria-label={text('mathLearningOrder')}>
      <p class="pg-review-note">{text('mathLearningOrderNote')}</p>
      {groups.map((group) => {
        const scope = `math-review:${grade}:${group.id}`;
        const count = entries.filter(
          (entry) => !entry.file.startsWith('questions/_samples/') && mathReviewMatches(entry.q, scope),
        ).length;
        if (!count) return null;
        return (
          <div key={group.id}>
            <div class="pg-unit-card">
              <button
                type="button"
                data-math-scope={group.id}
                aria-pressed={selected === scope}
                aria-describedby={`pg-math-count-${grade}-${group.id}`}
                onClick={() => onSelect(selected === scope ? undefined : scope)}
              >
                <span class="pg-tree-label">{stripRuby(group.name, 'kanji')}</span>
              </button>
              <span class="pg-tree-count" id={`pg-math-count-${grade}-${group.id}`}>
                {count}
                {text('questionSuffix')}
              </span>
            </div>
            {selected === scope && questions}
          </div>
        );
      })}
    </section>
  );
}

export function OriginalMathFolders({ active, children }: { active: boolean; children: ComponentChildren }) {
  return active ? (
    <details class="pg-original-math-folders">
      <summary>{text('mathOriginalFolders')}</summary>
      {children}
    </details>
  ) : (
    <>{children}</>
  );
}
