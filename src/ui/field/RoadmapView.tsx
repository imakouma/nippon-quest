import { useState } from 'preact/hooks';
import type { RoadmapNode } from '../../shared/menuModel';
import { t, tOpt } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';
import { RoadmapGraph } from './RoadmapGraph';

type RoadmapTerm = 'all' | 1 | 2 | 3;
type RoadmapGrade = 'all' | 1 | 2 | 3 | 4 | 5 | 6;
const GRADES: RoadmapGrade[] = ['all', 1, 2, 3, 4, 5, 6];
const TERMS: RoadmapTerm[] = ['all', 1, 2, 3];
const SUBJECT_ORDER = ['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo'];

function isNodeInTerm(node: RoadmapNode, term: RoadmapTerm): boolean {
  if (term === 'all') return true;
  const terms = node.recommendedTerms;
  return Boolean(!terms?.length || terms.includes('variable') || terms.includes(term));
}

const isCompleted = (node: RoadmapNode) => node.state === 'cleared' || node.state === 'review';

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
  const [grade, setGrade] = useState<RoadmapGrade>('all');
  const [term, setTerm] = useState<RoadmapTerm>('all');
  const [showTermNote, setShowTermNote] = useState(false);
  const gradeNodes = grade === 'all' ? nodes : nodes.filter((node) => node.grade === grade);
  const subjectGradeNodes =
    grade !== 'all' && grade <= 2
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
  const recommendationCandidates = SUBJECT_ORDER.flatMap((key) =>
    termNodes.filter((node) => node.subject === key),
  );
  const recommendation =
    recommendationCandidates.find((node) => node.visibility === 'revealed' && node.state === 'current') ??
    recommendationCandidates.find(
      (node) => node.visibility === 'revealed' && node.state === 'open' && !isCompleted(node),
    );
  const recommendationSubject = recommendation
    ? (subjects.find(([key]) => key === recommendation.subject)?.[1] ?? recommendation.subjectLabel)
    : undefined;

  return (
    <section
      class={`nq-roadmap nq-roadmap-subject-${activeSubject}`}
      aria-label={displayText(t('field.roadmapAria'))}
    >
      <div class="nq-roadmap-toolbar">
        <div class="nq-roadmap-filter-row">
          <div
            class="nq-roadmap-filter-group nq-roadmap-grade-row"
            role="group"
            aria-label={displayText(t('field.roadmapGradeFilter'))}
          >
            <RubyLabel class="nq-roadmap-filter-title" text={t('field.roadmapGrade')} />
            {GRADES.map((value) => (
              <button
                key={value}
                type="button"
                class={`nq-roadmap-filter-option nq-roadmap-grade${grade === value ? ' nq-focus' : ''}`}
                data-grade={value}
                aria-pressed={grade === value}
                onClick={() => {
                  playSfx('move');
                  setGrade(value);
                }}
              >
                <RubyLabel
                  text={
                    value === 'all' ? t('field.roadmapAllGrades') : t('field.roadmapGradeName', { n: value })
                  }
                />
              </button>
            ))}
          </div>
          <div
            class="nq-roadmap-filter-group nq-roadmap-term-row"
            role="group"
            aria-label={displayText(t('field.roadmapTermFilter'))}
          >
            <RubyLabel class="nq-roadmap-filter-title" text={t('field.roadmapRecommendedTerm')} />
            {TERMS.map((value) => (
              <button
                key={value}
                type="button"
                class={`nq-roadmap-filter-option nq-roadmap-term${term === value ? ' nq-focus' : ''}`}
                data-term={value}
                aria-pressed={term === value}
                onClick={() => {
                  playSfx('move');
                  setTerm(value);
                }}
              >
                <RubyLabel
                  text={
                    value === 'all' ? t('field.roadmapAllTerms') : t('field.roadmapTermName', { n: value })
                  }
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            class="nq-roadmap-period-note"
            aria-label={displayText(t('field.roadmapTermHelp'))}
            aria-expanded={showTermNote}
            aria-controls="nq-roadmap-period-help"
            onClick={() => setShowTermNote((shown) => !shown)}
          >
            ⓘ
          </button>
          {showTermNote && (
            <div id="nq-roadmap-period-help" class="nq-roadmap-period-help" role="note">
              <RubyLabel text={t('field.roadmapTermNote')} />
            </div>
          )}
        </div>
        <div
          class="nq-roadmap-subjects"
          role="group"
          aria-label={displayText(t('field.roadmapSubjectFilter'))}
        >
          <button
            type="button"
            class={`nq-opt nq-roadmap-subject ${activeSubject === 'all' ? 'nq-focus' : ''}`}
            aria-label={displayText(t('field.roadmapAllSubjects'))}
            aria-pressed={activeSubject === 'all'}
            data-subject="all"
            title={displayText(t('field.roadmapAllSubjects'))}
            onClick={() => (playSfx('move'), setSubject('all'))}
          >
            <span class="nq-roadmap-subject-name" aria-hidden="true">
              {displayText(t('field.roadmapAllSubjects'))}
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
                class={`nq-opt nq-roadmap-subject nq-roadmap-subject-long ${key === activeSubject ? 'nq-focus' : ''}`}
                aria-label={displayText(buttonLabel)}
                aria-pressed={key === activeSubject}
                data-current-grade={levelGrade}
                data-subject={key}
                title={displayText(buttonLabel)}
                onClick={() => (playSfx('move'), setSubject(key))}
              >
                <span class="nq-roadmap-subject-name" aria-hidden="true">
                  {displayText(longLabel)}
                </span>
                <span class="nq-roadmap-subject-grade" aria-hidden="true">
                  {displayText(t('field.roadmapSubjectGradeShort', { grade: levelGrade }))}
                </span>
              </button>
            );
          })}
          <span class="nq-roadmap-score" role="status" aria-live="polite">
            <RubyLabel text={t('field.roadmapProgress', { done: completed, total: progressNodes.length })} />
          </span>
        </div>
      </div>
      {activeSubject === 'all' ? (
        <div class="nq-roadmap-overview" role="group" aria-label={displayText(t('field.roadmapAllOverview'))}>
          {recommendation && recommendationSubject && (
            <button
              type="button"
              class={`nq-roadmap-recommendation nq-roadmap-summary-${recommendation.subject}`}
              onClick={() => {
                playSfx('select');
                setSubject(recommendation.subject);
              }}
            >
              <span class="nq-roadmap-recommendation-kicker">
                <RubyLabel text={t('field.roadmapRecommendation')} />
              </span>
              <span class="nq-roadmap-recommendation-main">
                <RubyLabel text={recommendationSubject} />
                <span aria-hidden="true">・</span>
                <RubyLabel text={recommendation.name} />
              </span>
              <span class="nq-roadmap-recommendation-arrow" aria-hidden="true">
                ▶
              </span>
            </button>
          )}
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
