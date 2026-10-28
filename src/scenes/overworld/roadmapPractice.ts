import { h, render } from 'preact';
import type { ContentIndex } from '../../core/content/loader';
import { curriculumGraph } from '../../core/learning/catalog';
import * as learningPlanProvider from '../../core/learning/learningPlan';
import { projectRoadmapRelations } from '../../core/learning/roadmapRelations';
import {
  recommendationReasonToAttemptReason,
  type LearningRecommendation,
} from '../../core/learning/recommendationPolicy';
import { canonicalUnitId } from '../../core/learning/unitAliases';
import { roadmapGrandfatheredUnitIds } from '../../core/state/roadmapSnapshot';
import type { GameState } from '../../core/state/schema';
import { QuestionFrame } from '../../ui/QuestionFrame';
import { t } from '../../ui/i18n';
import type { QuestionBank } from '../../questions/engine';
import { askById, MasteryStore } from '../../questions/engine';
import { buildAskEnv } from '../shared/askEnv';

export type RoadmapPracticeSelection = Pick<
  LearningRecommendation,
  'questionId' | 'actualUnitId' | 'reason' | 'conceptIds'
>;

export function selectRoadmapPracticeQuestion(
  input: Readonly<learningPlanProvider.LearningPlanInput>,
  preferredQuestionId?: string,
): RoadmapPracticeSelection | null {
  const selection = learningPlanProvider
    .buildLearningPlan(input)
    .find(
      (item) =>
        !item.completed && (preferredQuestionId === undefined || item.questionId === preferredQuestionId),
    );
  if (!selection || selection.completed) return null;
  return {
    questionId: selection.questionId,
    actualUnitId: selection.actualUnitId,
    reason: selection.reason,
    conceptIds: [...selection.conceptIds],
  };
}

export interface RoadmapPracticeHost {
  registry: { get(key: string): unknown };
  rng: { next(): number };
  speak: (text: string) => void;
  content(): ContentIndex | undefined;
  gs(): GameState | undefined;
  root(name: 'fx'): HTMLElement;
  talk(lines: { text: string }[]): Promise<void>;
  renderHud(): void;
}

export async function runRoadmapPractice(
  hostScene: RoadmapPracticeHost,
  unitId: string,
): Promise<RoadmapPracticeSelection | null> {
  return runRoadmapPracticeSelection(hostScene, undefined, unitId);
}

/** 「きょうの3つ」の安定IDから、表示した項目と同じ問題を実行する。 */
export async function runRoadmapPracticeByQuestionId(
  hostScene: RoadmapPracticeHost,
  questionId: string,
): Promise<RoadmapPracticeSelection | null> {
  return runRoadmapPracticeSelection(hostScene, questionId);
}

async function runRoadmapPracticeSelection(
  hostScene: RoadmapPracticeHost,
  preferredQuestionId?: string,
  targetUnitId?: string,
): Promise<RoadmapPracticeSelection | null> {
  const content = hostScene.content();
  const bank = hostScene.registry.get('bank') as QuestionBank | undefined;
  const game = hostScene.gs();
  if (!content || !bank || !game) return null;
  const selection = selectRoadmapPracticeQuestion(
    {
      graph: curriculumGraph,
      questionBank: targetUnitId ? roadmapUnitQuestionBank(bank, targetUnitId) : bank,
      conceptStates: game.learning.conceptStates,
      attempts: game.learning.attempts,
      recentQuestionIds: game.learning.recent,
      unitMastery: game.learning.mastery,
      grandfatheredUnitIds: roadmapGrandfatheredUnitIds(game),
      gradeScope: {
        grade: game.learning.grade,
        includeLower: game.learning.includeLower,
        challengeHigher: game.learning.challengeHigher,
      },
      now: Date.now(),
    },
    preferredQuestionId,
  );
  if (!selection) {
    await hostScene.talk([{ text: t('field.roadmapNoQuestion') }]);
    return null;
  }
  const question = bank.get(selection.questionId);
  if (!question) {
    await hostScene.talk([{ text: t('field.roadmapNoQuestion') }]);
    return null;
  }
  const questionHost = document.createElement('div');
  questionHost.className = 'nq-bq-slot';
  const root = hostScene.root('fx');
  render(
    h(QuestionFrame, {
      host: questionHost,
      title: content.units.get(selection.actualUnitId)?.name ?? selection.actualUnitId,
      subject: question.subject,
      hint: t('field.roadmapQuestionHint'),
    }),
    root,
  );
  try {
    await askById(
      buildAskEnv({
        host: questionHost,
        gs: game,
        content,
        bank,
        mastery: new MasteryStore(game.learning.mastery),
        rng: hostScene.rng,
        speak: hostScene.speak,
        reason: recommendationReasonToAttemptReason(selection.reason),
        getGame: () => hostScene.gs() ?? game,
      }),
      selection.questionId,
    );
    hostScene.renderHud();
    return selection;
  } finally {
    render(null, root);
  }
}

function roadmapUnitQuestionBank(
  bank: QuestionBank,
  targetUnitId: string,
): Pick<QuestionBank, 'get' | 'all'> {
  const canonicalTargetId = canonicalUnitId(targetUnitId);
  const displayedUnitIds = new Set(
    curriculumGraph.concepts
      .filter((concept) => concept.kind !== 'misconception')
      .map((concept) => canonicalUnitId(concept.unit)),
  );
  displayedUnitIds.add(canonicalTargetId);
  const relations = projectRoadmapRelations(curriculumGraph, displayedUnitIds);
  const allowedUnitIds = new Set([
    canonicalTargetId,
    ...(relations.prerequisiteIdsByTarget.get(canonicalTargetId) ?? []),
  ]);
  const questions = bank.all().filter((question) => allowedUnitIds.has(canonicalUnitId(question.unit)));
  const byId = new Map(questions.map((question) => [question.id, question]));
  return {
    all: () => [...questions],
    get: (questionId) => byId.get(questionId),
  };
}
