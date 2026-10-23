import { useState } from 'preact/hooks';
import type { RoadmapNode } from '../../shared/menuModel';
import { t } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';
import { RoadmapGraph } from './RoadmapGraph';

type RoadmapTerm = 'all' | 1 | 2 | 3;
const PERIODS_PER_GRADE = 3;
const PRIMARY_SCHOOL_PERIODS = 6 * PERIODS_PER_GRADE;

function periodSelection(index: number): { grade: number | 'all'; term: RoadmapTerm } {
  if (index <= 0) return { grade: 'all', term: 'all' };
  return {
    grade: Math.ceil(index / PERIODS_PER_GRADE),
    term: (((index - 1) % PERIODS_PER_GRADE) + 1) as 1 | 2 | 3,
  };
}

function isNodeInTerm(node: RoadmapNode, term: RoadmapTerm): boolean {
  if (term === 'all') return true;
  const terms = node.recommendedTerms;
  return Boolean(!terms?.length || terms.includes('variable') || terms.includes(term));
}

const isCompleted = (node: RoadmapNode) => node.state === 'cleared' || node.state === 'review';

export function RoadmapView({
  nodes,
  onSelect,
}: {
  nodes: RoadmapNode[];
  onSelect: (unitId: string) => void;
}) {
  const [subject, setSubject] = useState('all');
  const [periodIndex, setPeriodIndex] = useState(0);
  const { grade, term } = periodSelection(periodIndex);
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
      <div class="nq-roadmap-toolbar">
        <label class="nq-roadmap-period">
          <RubyLabel class="nq-roadmap-filter-title" text={t('field.roadmapLearningPeriod')} />
          <input
            class="nq-roadmap-period-range"
            type="range"
            min="0"
            max={PRIMARY_SCHOOL_PERIODS}
            step="1"
            value={periodIndex}
            aria-label={displayText(t('field.roadmapPeriodFilter'))}
            onInput={(event) => {
              playSfx('move');
              setPeriodIndex(Number((event.currentTarget as HTMLInputElement).value));
            }}
          />
          <output class="nq-roadmap-period-value" aria-live="polite">
            <RubyLabel
              text={
                grade === 'all' || term === 'all'
                  ? t('field.roadmapAllPeriods')
                  : t('field.roadmapPeriodName', { grade, term })
              }
            />
          </output>
          <span class="nq-roadmap-period-note" title={displayText(t('field.roadmapTermNote'))}>
            ⓘ
          </span>
        </label>
        <div
          class="nq-roadmap-subjects"
          role="group"
          aria-label={displayText(t('field.roadmapSubjectFilter'))}
        >
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
                  text={
                    next
                      ? t('field.roadmapNext', { name: next.name })
                      : subjectCompleted === subjectNodes.length
                        ? t('field.roadmapCompleted')
                        : t('field.roadmapFog')
                  }
                />
              </button>
            );
          })}
        </div>
      ) : (
        <RoadmapGraph nodes={shown} onSelect={onSelect} />
      )}
      <RubyLabel class="nq-wmap-keys nq-roadmap-help" text={t('field.roadmapLegend')} />
    </section>
  );
}
