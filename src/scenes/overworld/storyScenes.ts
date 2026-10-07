import type { GameState } from '../../core/state/schema';
import type { StoryCompanionId } from '../../core/progression/storyCompanion';
import type { DialogueLine } from '../../ui/dialogue';
import { t } from '../../ui/i18n';

export function prologueLines(game: GameState): DialogueLine[] {
  return [
    { speaker: t('field.prologueNarrator'), text: t('field.prologueWake') },
    { speaker: game.player.name, text: t('field.prologueLost') },
    { speaker: t('field.prologueFairy'), text: t('field.prologueFairyArrives') },
    { speaker: t('field.prologueFairy'), text: t('field.prologueFairyName') },
    { speaker: t('field.prologueFairy'), text: t('field.prologueKnowledge') },
    { speaker: t('field.prologueFairy'), text: t('field.prologueWasuremono') },
    { speaker: t('field.prologueFairy'), text: t('field.prologueQuest') },
    { speaker: game.player.name, text: t('field.prologueResolve') },
    { text: t('field.prologueStart') },
  ];
}

export function companionChoiceLines(): DialogueLine[] {
  return [
    { speaker: t('field.musubiKeeper'), text: t('field.manabimonoExplain') },
    { speaker: t('field.prologueFairy'), text: t('field.wasuremonoExplain') },
    { speaker: t('field.musubiKeeper'), text: t('field.musubiExplain') },
    { speaker: t('field.musubiKeeper'), text: t('field.companionChoose') },
  ];
}

export function iwateArrivalLines(): DialogueLine[] {
  return [
    { speaker: t('field.prologueFairy'), text: t('field.iwateArrival') },
    { speaker: t('field.prologueFairy'), text: t('field.iwateStone') },
    { speaker: t('field.prologueFairy'), text: t('field.iwateShrineGuide') },
  ];
}

export function companionJoinedLines(monsterId: StoryCompanionId, name: string): DialogueLine[] {
  return [
    { speaker: name, text: t(`field.companionVoice.${monsterId}`) },
    { text: t('field.companionJoined', { name }) },
    { speaker: t('field.prologueFairy'), text: t('field.companionJourney') },
  ];
}
