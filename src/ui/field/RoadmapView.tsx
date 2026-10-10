import { useState } from 'preact/hooks';
import type { RoadmapNode } from '../../shared/menuModel';
import { t } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';

type RoadmapTerm = 'all' | 1 | 2 | 3;

function isNodeInTerm(node: RoadmapNode, term: RoadmapTerm): boolean {
  if (term === 'all') return true;
  const terms = node.recommendedTerms;
  return !terms?.length || terms.includes('variable') || terms.includes(term);
}

function roadmapTermLabel(node: RoadmapNode): string {
  const terms = node.recommendedTerms;
  if (!terms?.length) return 'じき 未設定[みせってい]';
  if (terms.includes('variable')) return 'つうねん';
  return terms.map((term) => `${term}がっき`).join('・');
}

export function RoadmapView({
  nodes,
  onSelect,
}: {
  nodes: RoadmapNode[];
  onSelect: (unitId: string) => void;
}) {
  const subjects = [...new Map(nodes.map((node) => [node.subject, node.subjectLabel])).entries()];
  const grades = [...new Set(nodes.map((node) => node.grade))].sort((a, b) => a - b);
  const [subject, setSubject] = useState('all');
  const [grade, setGrade] = useState<number | 'all'>('all');
  const [term, setTerm] = useState<RoadmapTerm>('all');
  const gradeNodes = grade === 'all' ? nodes : nodes.filter((node) => node.grade === grade);
  const termNodes = gradeNodes.filter((node) => isNodeInTerm(node, term));
  const shown = subject === 'all' ? termNodes : termNodes.filter((node) => node.subject === subject);
  const completed = shown.filter((node) => node.state === 'cleared').length;

  return (
    <section class={`nq-roadmap nq-roadmap-subject-${subject}`} aria-label="がくしゅうロードマップ">
      <div class="nq-roadmap-grade-row">
        <RubyLabel class="nq-roadmap-filter-title" text={t('field.roadmapGrade')} />
        <div class="nq-roadmap-grades" role="group" aria-label={displayText(t('field.roadmapGradeFilter'))}>
          {(['all', ...grades] as const).map((value) => (
            <button
              key={value}
              type="button"
              data-grade={value}
              class={`nq-roadmap-grade ${grade === value ? 'nq-roadmap-filter-active' : ''}`}
              aria-pressed={grade === value}
              onClick={() => (playSfx('move'), setGrade(value))}
            >
              <RubyLabel text={value === 'all' ? t('field.roadmapAllGrades') : `${value}ねん`} />
            </button>
          ))}
        </div>
      </div>
      <div class="nq-roadmap-term-row">
        <RubyLabel class="nq-roadmap-filter-title" text={t('field.roadmapRecommendedTerm')} />
        <div class="nq-roadmap-terms" role="group" aria-label={displayText(t('field.roadmapTermFilter'))}>
          {(['all', 1, 2, 3] as const).map((value) => (
            <button
              key={value}
              type="button"
              data-term={value}
              class={`nq-roadmap-term ${term === value ? 'nq-roadmap-filter-active' : ''}`}
              aria-pressed={term === value}
              onClick={() => (playSfx('move'), setTerm(value))}
            >
              <RubyLabel text={value === 'all' ? t('field.roadmapAllTerms') : `${value}がっき`} />
            </button>
          ))}
        </div>
        <RubyLabel class="nq-roadmap-term-note" text={t('field.roadmapTermNote')} />
      </div>
      <div class="nq-roadmap-subjects" role="group" aria-label={displayText(t('field.roadmapSubjectFilter'))}>
        <button
          type="button"
          class={`nq-opt nq-roadmap-subject ${subject === 'all' ? 'nq-focus' : ''}`}
          aria-pressed={subject === 'all'}
          onClick={() => (playSfx('move'), setSubject('all'))}
        >
          <RubyLabel text={t('field.roadmapAllSubjects')} />
        </button>
        {subjects.map(([key, label]) => (
          <button
            key={key}
            type="button"
            class={`nq-opt nq-roadmap-subject ${key === subject ? 'nq-focus' : ''}`}
            aria-pressed={key === subject}
            onClick={() => (playSfx('move'), setSubject(key))}
          >
            <RubyLabel text={label} />
          </button>
        ))}
        <span class="nq-roadmap-score" role="status" aria-live="polite">
          ★ {completed}/{shown.length}
        </span>
      </div>
      {subject === 'all' ? (
        <div class="nq-roadmap-overview" role="group" aria-label={displayText(t('field.roadmapAllOverview'))}>
          {subjects.map(([key, label]) => {
            const subjectNodes = termNodes.filter((node) => node.subject === key);
            const subjectCompleted = subjectNodes.filter((node) => node.state === 'cleared').length;
            const next =
              subjectNodes.find((node) => node.state === 'current') ??
              subjectNodes.find((node) => node.state !== 'cleared');
            const progress = subjectNodes.length
              ? Math.round((subjectCompleted / subjectNodes.length) * 100)
              : 0;
            return (
              <button
                key={key}
                type="button"
                class={`nq-roadmap-summary nq-roadmap-summary-${key}`}
                aria-label={`${displayText(label)} ${subjectCompleted}/${subjectNodes.length}`}
                onClick={() => (playSfx('move'), setSubject(key))}
              >
                <span class="nq-roadmap-summary-head">
                  <RubyLabel text={label} />
                  <span>
                    ★ {subjectCompleted}/{subjectNodes.length}
                  </span>
                </span>
                <span class="nq-roadmap-summary-meter" aria-hidden>
                  <span style={{ width: `${progress}%` }} />
                </span>
                <RubyLabel
                  class="nq-roadmap-summary-current"
                  text={next ? t('field.roadmapNext', { name: next.name }) : t('field.roadmapCompleted')}
                />
              </button>
            );
          })}
        </div>
      ) : (
        <div class="nq-roadmap-map">
          <div class="nq-roadmap-path">
            {shown.map((node, index) => {
              const columns = 6;
              const row = Math.floor(index / columns);
              const offset = index % columns;
              const column = row % 2 === 0 ? offset + 1 : columns - offset;
              const turnsToNextRow = offset === columns - 1 && index < shown.length - 1;
              const roadFromPrevious =
                offset === 0 ? '' : row % 2 === 0 ? ' nq-roadmap-from-left' : ' nq-roadmap-from-right';
              return (
                <button
                  key={node.id}
                  type="button"
                  class={`nq-roadmap-node nq-roadmap-${node.state}${roadFromPrevious}${turnsToNextRow ? ' nq-roadmap-turn' : ''}`}
                  style={{ gridColumn: column, gridRow: row + 1 }}
                  aria-label={displayText(node.name)}
                  disabled={node.state === 'locked'}
                  onClick={() => {
                    playSfx('select');
                    onSelect(node.id);
                  }}
                  title={`${displayText(node.name)} ${Math.round(node.mastery * 100)}%`}
                >
                  <span class="nq-roadmap-step">
                    {node.state === 'cleared' ? '★' : node.state === 'locked' ? '－' : index + 1}
                  </span>
                  <RubyLabel text={node.name} class="nq-roadmap-node-name" />
                  <span class="nq-roadmap-node-tags">
                    <RubyLabel text={roadmapTermLabel(node)} class="nq-roadmap-node-term" />
                    {node.courseKind === 'supplementary' && (
                      <RubyLabel text="おまけ" class="nq-roadmap-node-extra" />
                    )}
                  </span>
                  <span
                    class="nq-roadmap-meter"
                    role="meter"
                    aria-label={`${displayText(node.name)} ${Math.round(node.mastery * 100)}%`}
                    aria-valuemin={0}
                    aria-valuenow={Math.round(node.mastery * 100)}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${Math.round(node.mastery * 100)}%` }} />
                  </span>
                </button>
              );
            })}
          </div>
          {!shown.length && <RubyLabel text="この じきの もんだいは じゅんびちゅう" />}
        </div>
      )}
      <RubyLabel
        class="nq-wmap-keys nq-roadmap-help"
        text="★ クリア　● いまの もくひょう　うすいマスは これから"
      />
    </section>
  );
}
