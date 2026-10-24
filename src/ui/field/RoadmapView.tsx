import { useState } from 'preact/hooks';
import type { RoadmapNode } from '../../shared/menuModel';
import { t, tOpt } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';
import { RoadmapGraph } from './RoadmapGraph';

type RoadmapTerm = 'all' | 1 | 2 | 3;
const PERIODS_PER_GRADE = 3;
const PRIMARY_SCHOOL_PERIODS = 6 * PERIODS_PER_GRADE;
const SUBJECT_ORDER = ['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo'];

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

function subjectIcon(subject: string, label: string): string {
  return tOpt(`field.roadmapSubjectShort.${subject}`) ?? displayText(label).slice(0, 1);
}

function subjectLongLabel(subject: string, label: string): string {
  return tOpt(`field.roadmapSubjectLong.${subject}`) ?? label;
}

function currentLearningGrade(nodes: RoadmapNode[]): number {
  const current = nodes.find((node) => node.state === 'current');
  if (current) return current.grade;
  const open = nodes.find((node) => node.state === 'open' && node.visibility === 'revealed');
  if (open) return open.grade;
  const completedGrades = nodes.filter(isCompleted).map((node) => node.grade);
  if (completedGrades.length) return Math.max(...completedGrades);
  return Math.min(...nodes.map((node) => node.grade));
}

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
  const showLongSubjectNames = grade !== 'all' && grade <= 2;
  const subjectGradeNodes = showLongSubjectNames
    ? gradeNodes.filter((node) => node.courseKind !== 'supplementary')
    : gradeNodes;
  const termNodes = subjectGradeNodes.filter((node) => isNodeInTerm(node, term));
  const subjects = [
    ...new Map(subjectGradeNodes.map((node) => [node.subject, node.subjectLabel])).entries(),
  ].sort(
    ([left], [right]) =>
      SUBJECT_ORDER.indexOf(left) - SUBJECT_ORDER.indexOf(right) || left.localeCompare(right),
  );
  const activeSubject = subjects.some(([key]) => key === subject) ? subject : 'all';
  const shown =
    activeSubject === 'all' ? termNodes : termNodes.filter((node) => node.subject === activeSubject);
  const shownIds = new Set(shown.map((node) => node.id));
  const graphNodes =
    activeSubject === 'all'
      ? shown
      : [
          ...shown,
          ...nodes.filter(
            (node) =>
              node.subject === activeSubject &&
              !shownIds.has(node.id) &&
              shown.some((target) => target.prerequisiteIds.includes(node.id)),
          ),
        ];
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
          class={`nq-roadmap-subjects ${showLongSubjectNames ? 'nq-roadmap-subjects-lower' : ''}`}
          role="group"
          aria-label={displayText(t('field.roadmapSubjectFilter'))}
        >
          <button
            type="button"
            class={`nq-opt nq-roadmap-subject ${activeSubject === 'all' ? 'nq-focus' : ''}`}
            aria-label={displayText(t('field.roadmapAllSubjects'))}
            aria-pressed={activeSubject === 'all'}
            data-subject="all"
            data-subject-icon={displayText(t('field.roadmapSubjectShort.all'))}
            title={displayText(t('field.roadmapAllSubjects'))}
            onClick={() => (playSfx('move'), setSubject('all'))}
          >
            <span class="nq-roadmap-subject-name" aria-hidden="true">
              {displayText(t('field.roadmapSubjectShort.all'))}
            </span>
          </button>
          {subjects.map(([key, label]) => {
            const longLabel = subjectLongLabel(key, label);
            const levelGrade = currentLearningGrade(nodes.filter((node) => node.subject === key));
            const buttonLabel = t('field.roadmapSubjectCurrentGrade', {
              subject: displayText(longLabel),
              grade: levelGrade,
            });
            return (
              <button
                key={key}
                type="button"
                class={`nq-opt nq-roadmap-subject ${showLongSubjectNames ? 'nq-roadmap-subject-long' : ''} ${key === activeSubject ? 'nq-focus' : ''}`}
                aria-label={displayText(buttonLabel)}
                aria-pressed={key === activeSubject}
                data-current-grade={levelGrade}
                data-subject={key}
                data-subject-icon={displayText(subjectIcon(key, label))}
                title={displayText(buttonLabel)}
                onClick={() => (playSfx('move'), setSubject(key))}
              >
                <span class="nq-roadmap-subject-name" aria-hidden="true">
                  {displayText(showLongSubjectNames ? longLabel : subjectIcon(key, label))}
                </span>
                <span class="nq-roadmap-subject-grade" aria-hidden="true">
                  {displayText(t('field.roadmapSubjectGradeShort', { grade: levelGrade }))}
                </span>
              </button>
            );
          })}
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
        <RoadmapGraph nodes={graphNodes} onSelect={onSelect} />
      )}
    </section>
  );
}
