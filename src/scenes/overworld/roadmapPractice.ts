import { h, render } from 'preact';
import type { ContentIndex } from '../../core/content/loader';
import { curriculumGraph } from '../../core/learning/catalog';
import * as learningPlanProvider from '../../core/learning/learningPlan';
import {
  recommendationReasonToAttemptReason,
  type LearningRecommendation,
} from '../../core/learning/recommendationPolicy';
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
): RoadmapPracticeSelection | null {
  const selection = learningPlanProvider.buildLearningPlan(input).find((item) => !item.completed);
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
  _unitId: string,
): Promise<RoadmapPracticeSelection | null> {
  const content = hostScene.content();
  const bank = hostScene.registry.get('bank') as QuestionBank | undefined;
  const game = hostScene.gs();
  if (!content || !bank || !game) return null;
  const selection = selectRoadmapPracticeQuestion({
    graph: curriculumGraph,
    questionBank: bank,
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
  });
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
