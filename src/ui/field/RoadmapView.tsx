import { useState } from 'preact/hooks';
import type { RoadmapNode } from '../../shared/menuModel';
import { t } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';
import { RoadmapGraph } from './RoadmapGraph';

type RoadmapTerm = 'all' | 1 | 2 | 3;

function isNodeInTerm(node: RoadmapNode, term: RoadmapTerm): boolean {
  if (term === 'all') return true;
  const terms = node.recommendedTerms;
  return Boolean(terms?.includes('variable') || terms?.includes(term));
}

const isCompleted = (node: RoadmapNode) => node.state === 'cleared' || node.state === 'review';

export function RoadmapView({
  nodes,
  onSelect,
}: {
  nodes: RoadmapNode[];
  onSelect: (unitId: string) => void;
}) {
  const grades = [...new Set(nodes.map((node) => node.grade))].sort((a, b) => a - b);
  const [subject, setSubject] = useState('all');
  const [grade, setGrade] = useState<number | 'all'>('all');
  const [term, setTerm] = useState<RoadmapTerm>('all');
  const gradeNodes = grade === 'all' ? nodes : nodes.filter((node) => node.grade === grade);
  const termNodes = gradeNodes.filter((node) => isNodeInTerm(node, term));
  const subjects = [...new Map(termNodes.map((node) => [node.subject, node.subjectLabel])).entries()];
  const activeSubject = subjects.some(([key]) => key === subject) ? subject : 'all';
  const shown =
    activeSubject === 'all' ? termNodes : termNodes.filter((node) => node.subject === activeSubject);
  const progressNodes =
    activeSubject === 'all' ? shown.filter((node) => node.courseKind !== 'supplementary') : shown;
  const completed = progressNodes.filter(isCompleted).length;

  return (
    <section
      class={`nq-roadmap nq-roadmap-subject-${activeSubject}`}
      aria-label={displayText(t('field.roadmapAria'))}
    >
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
              <RubyLabel
                text={
                  value === 'all' ? t('field.roadmapAllGrades') : t('field.roadmapGradeName', { n: value })
                }
              />
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
              <RubyLabel
                text={value === 'all' ? t('field.roadmapAllTerms') : t('field.roadmapTermName', { n: value })}
              />
            </button>
          ))}
        </div>
        <RubyLabel class="nq-roadmap-term-note" text={t('field.roadmapTermNote')} />
      </div>
      <div class="nq-roadmap-subjects" role="group" aria-label={displayText(t('field.roadmapSubjectFilter'))}>
        <button
          type="button"
          class={`nq-opt nq-roadmap-subject ${activeSubject === 'all' ? 'nq-focus' : ''}`}
          aria-pressed={activeSubject === 'all'}
          onClick={() => (playSfx('move'), setSubject('all'))}
        >
          <RubyLabel text={t('field.roadmapAllSubjects')} />
        </button>
        {subjects.map(([key, label]) => (
          <button
            key={key}
            type="button"
            class={`nq-opt nq-roadmap-subject ${key === activeSubject ? 'nq-focus' : ''}`}
            aria-pressed={key === activeSubject}
            onClick={() => (playSfx('move'), setSubject(key))}
          >
            <RubyLabel text={label} />
          </button>
        ))}
        <span class="nq-roadmap-score" role="status" aria-live="polite">
          ★ {completed}/{progressNodes.length}
        </span>
      </div>
      {activeSubject === 'all' ? (
        <div class="nq-roadmap-overview" role="group" aria-label={displayText(t('field.roadmapAllOverview'))}>
          {subjects.map(([key, label]) => {
            const subjectNodes = termNodes.filter((node) => node.subject === key);
            const subjectCompleted = subjectNodes.filter(isCompleted).length;
            const next =
              subjectNodes.find((node) => node.state === 'current') ??
              subjectNodes.find((node) => node.visibility === 'revealed' && !isCompleted(node));
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
                  <span class="nq-roadmap-summary-label">
                    <RubyLabel text={label} />
                    {subjectNodes.every((node) => node.courseKind === 'supplementary') && (
                      <RubyLabel text={t('field.roadmapSupplementary')} class="nq-roadmap-summary-extra" />
                    )}
                  </span>
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
          <RoadmapGraph nodes={shown} onSelect={onSelect} />
        </div>
      )}
      <RubyLabel class="nq-wmap-keys nq-roadmap-help" text={t('field.roadmapLegend')} />
    </section>
  );
}
