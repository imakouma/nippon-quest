import { useEffect, useRef, useState } from 'preact/hooks';
import { availableRoadmapSubjects, ROADMAP_SUBJECT_ORDER } from '../../core/learning/subjectUnlocks';
import type {
  RoadmapCompletedReason,
  RoadmapNode,
  RoadmapPendingReason,
  RoadmapTodayPlanView,
} from '../../shared/menuModel';
import { t, tOpt } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';
import { RoadmapGraph } from './RoadmapGraph';

type RoadmapTerm = 'all' | 1 | 2 | 3;
type RoadmapGrade = 'all' | 1 | 2 | 3 | 4 | 5 | 6;
const GRADES: RoadmapGrade[] = ['all', 1, 2, 3, 4, 5, 6];
const TERMS: RoadmapTerm[] = ['all', 1, 2, 3];
function isNodeInTerm(node: RoadmapNode, term: RoadmapTerm): boolean {
  if (term === 'all') return true;
  const terms = node.recommendedTerms;
  return Boolean(!terms?.length || terms.includes('variable') || terms.includes(term));
}

const isCompleted = (node: RoadmapNode) => node.state === 'cleared' || node.state === 'review';

const pendingReasonKeys: Record<RoadmapPendingReason, string> = {
  'due-review': 'field.roadmapTodayDueReview',
  'weak-prerequisite': 'field.roadmapTodayWeakPrerequisite',
  'unseen-primary': 'field.roadmapTodayUnseenPrimary',
  'unseen-question': 'field.roadmapTodayUnseenQuestion',
};

const completedReasonKeys: Record<RoadmapCompletedReason, string> = {
  review: 'field.roadmapTodayReviewComplete',
  diagnosis: 'field.roadmapTodayDiagnosisComplete',
};

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

function TodayPlan({
  plan,
  onSelect,
  returnQuestionId,
}: {
  plan: RoadmapTodayPlanView;
  onSelect: (questionId: string) => void;
  returnQuestionId?: string;
}) {
  const completed = plan.items.filter((item) => item.completed).length;
  const rootRef = useRef<HTMLElement>(null);
  const initialFocusDone = useRef(false);
  const lastReturnQuestionId = useRef<string>();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const heading = root.querySelector<HTMLElement>('.nq-roadmap-today-title');
    const findItem = (questionId: string) =>
      [...root.querySelectorAll<HTMLElement>('[data-roadmap-focus-target]')].find(
        (target) => target.dataset.roadmapQuestionId === questionId,
      );
    let target: HTMLElement | null | undefined;

    if (returnQuestionId) {
      if (lastReturnQuestionId.current === returnQuestionId) return;
      lastReturnQuestionId.current = returnQuestionId;
      initialFocusDone.current = true;
      target = findItem(returnQuestionId) ?? heading;
      const returnedItem = plan.items.find((item) => item.questionId === returnQuestionId);
      if (returnedItem?.completed)
        setAnnouncement(
          t('field.roadmapTodayNotice', {
            name: displayText(returnedItem.unitName),
            done: completed,
            total: plan.items.length,
          }),
        );
    } else {
      lastReturnQuestionId.current = undefined;
      if (initialFocusDone.current) return;
      initialFocusDone.current = true;
      target = root.querySelector<HTMLElement>('.nq-roadmap-today-start') ?? heading;
    }

    if (!target) return;
    const focusTarget = () => target?.focus();
    focusTarget();
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(focusTarget);
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [completed, plan, returnQuestionId]);

  return (
    <section ref={rootRef} class="nq-roadmap-today" aria-labelledby="nq-roadmap-today-title">
      <div class="nq-roadmap-today-head">
        <h2 id="nq-roadmap-today-title" class="nq-roadmap-today-title" tabIndex={-1}>
          <RubyLabel text={t('field.roadmapTodayTitle')} />
        </h2>
        <RubyLabel
          class="nq-roadmap-today-progress"
          text={t('field.roadmapTodayProgress', { done: completed, total: plan.items.length })}
        />
      </div>
      {plan.items.length > 0 ? (
        <ol class="nq-roadmap-today-list">
          {plan.items.map((item) => (
            <li
              key={item.questionId}
              class={`nq-roadmap-today-item nq-roadmap-summary-${item.subject}`}
              data-roadmap-question-id={item.questionId}
            >
              <span class="nq-roadmap-today-copy">
                <RubyLabel class="nq-roadmap-today-subject" text={item.subjectLabel} />
                <RubyLabel class="nq-roadmap-today-unit" text={item.unitName} />
                <RubyLabel
                  class="nq-roadmap-today-reason"
                  text={t(item.completed ? completedReasonKeys[item.reason] : pendingReasonKeys[item.reason])}
                />
              </span>
              {item.completed ? (
                <span
                  class="nq-roadmap-today-done"
                  data-roadmap-focus-target
                  data-roadmap-question-id={item.questionId}
                  tabIndex={-1}
                >
                  <span aria-hidden="true">✓</span>
                  <RubyLabel text={t('field.roadmapTodayDone')} />
                </span>
              ) : (
                <button
                  type="button"
                  class="nq-roadmap-today-start"
                  data-roadmap-focus-target
                  data-roadmap-question-id={item.questionId}
                  onClick={() => {
                    playSfx('select');
                    onSelect(item.questionId);
                  }}
                >
                  <RubyLabel text={t('field.roadmapTodayStart')} />
                </button>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <RubyLabel as="p" class="nq-roadmap-today-empty" text={t('field.roadmapTodayEmpty')} />
      )}
      {plan.allComplete && (
        <RubyLabel as="p" class="nq-roadmap-today-complete" text={t('field.roadmapTodayAllComplete')} />
      )}
      <div class="nq-roadmap-today-status" role="status" aria-live="polite" aria-atomic="true">
        {announcement && <RubyLabel text={announcement} />}
      </div>
    </section>
  );
}

export function RoadmapView({
  nodes,
  todayPlan,
  onTodaySelect,
  returnQuestionId,
  onSelect,
  developerMode = false,
}: {
  nodes: RoadmapNode[];
  todayPlan?: RoadmapTodayPlanView;
  onTodaySelect?: (questionId: string) => void;
  returnQuestionId?: string;
  onSelect: (unitId: string) => void;
  developerMode?: boolean;
}) {
  const [subject, setSubject] = useState('all');
  const [grade, setGrade] = useState<RoadmapGrade>('all');
  const [term, setTerm] = useState<RoadmapTerm>('all');
  const [showTermNote, setShowTermNote] = useState(false);
  const availableSubjects = availableRoadmapSubjects(nodes, developerMode);
  const availableNodes = nodes.filter((node) => availableSubjects.has(node.subject));
  const gradeNodes = grade === 'all' ? availableNodes : availableNodes.filter((node) => node.grade === grade);
  const subjectGradeNodes =
    grade !== 'all' && grade <= 2
      ? gradeNodes.filter((node) => node.courseKind !== 'supplementary')
      : gradeNodes;
  const termNodes = subjectGradeNodes.filter((node) => isNodeInTerm(node, term));
  const subjects = [
    ...new Map(subjectGradeNodes.map((node) => [node.subject, node.subjectLabel])).entries(),
  ].sort(
    ([left], [right]) =>
      ROADMAP_SUBJECT_ORDER.indexOf(left as (typeof ROADMAP_SUBJECT_ORDER)[number]) -
        ROADMAP_SUBJECT_ORDER.indexOf(right as (typeof ROADMAP_SUBJECT_ORDER)[number]) ||
      left.localeCompare(right),
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
          ...availableNodes.filter(
            (node) =>
              node.subject === activeSubject &&
              !shownIds.has(node.id) &&
              shown.some((target) => target.prerequisiteIds.includes(node.id)),
          ),
        ];
  const progressNodes =
    activeSubject === 'all' ? shown.filter((node) => node.courseKind !== 'supplementary') : shown;
  const completed = progressNodes.filter(isCompleted).length;
  const recommendationCandidates = ROADMAP_SUBJECT_ORDER.flatMap((key) =>
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
      <div class={`nq-roadmap-toolbar${developerMode ? '' : ' nq-roadmap-toolbar-compact'}`}>
        {developerMode && (
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
                      value === 'all'
                        ? t('field.roadmapAllGrades')
                        : t('field.roadmapGradeName', { n: value })
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
        )}
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
            const levelGrade = currentLearningGrade(availableNodes.filter((node) => node.subject === key));
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
          {todayPlan && onTodaySelect && (
            <TodayPlan plan={todayPlan} onSelect={onTodaySelect} returnQuestionId={returnQuestionId} />
          )}
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
