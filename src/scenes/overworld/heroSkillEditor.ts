import { mathSkillLevel, trainedMathSkill } from '../../core/progression/mathSkillLevel';
import { h, render } from 'preact';
import { HeroSkillScreen } from '../../ui/field/HeroSkillScreen';
import type { ContentIndex } from '../../core/content/loader';
import { activeEquipment } from '../../core/progression/bag';
import {
  availableLoadoutSkills,
  resolveSkillLoadout,
  setLoadoutSkill,
} from '../../core/progression/heroSkillLoadout';
import type { GameState } from '../../core/state/schema';
import type { HeroSkillEditorProps } from '../../ui/field/HeroSkillEditor';

function grantedSkills(state: GameState, content: ContentIndex): string[] {
  return Object.values(activeEquipment(state)).flatMap((id) => {
    const skill = id && content.items.get(id)?.grantsSkill;
    return skill ? [skill] : [];
  });
}

export function normalizeHeroLoadout(state: GameState, content: ContentIndex | undefined): GameState {
  if (!content || !state.player.skillLoadout) return state;
  const loadout = resolveSkillLoadout(
    state.player.skillLoadout,
    state.player.skills,
    grantedSkills(state, content),
    content.skills,
    content.settings.subjectGauge.uniqueSkills,
  );
  return JSON.stringify(loadout) === JSON.stringify(state.player.skillLoadout)
    ? state
    : { ...state, player: { ...state.player, skillLoadout: loadout } };
}

export function heroSkillEditor(
  state: GameState,
  content: ContentIndex,
  getGame: () => GameState | undefined,
  setGame: (state: GameState) => void,
): HeroSkillEditorProps {
  const granted = grantedSkills(state, content);
  const bursts = content.settings.subjectGauge.uniqueSkills;
  const available = availableLoadoutSkills(state.player.skills, granted, content.skills, bursts);
  return {
    levels: Object.fromEntries(
      available
        .filter((id) => content.skills.get(id)?.questionTags?.includes('assigned:' + id))
        .map((id) => [id, mathSkillLevel(state.progress.counters['math-training:' + id] ?? 0)]),
    ),
    initial: resolveSkillLoadout(
      state.player.skillLoadout,
      state.player.skills,
      granted,
      content.skills,
      bursts,
    ),
    skills: available
      .flatMap((id) => content.skills.get(id) ?? [])
      .map((skill) => trainedMathSkill(skill, state.progress.counters)),
    onChange: (category, index, id) => {
      const current = getGame();
      if (!current) return null;
      const active = resolveSkillLoadout(
        current.player.skillLoadout,
        current.player.skills,
        granted,
        content.skills,
        bursts,
      );
      const next = setLoadoutSkill(active, category, index, id, content.skills, available);
      if (!next) return null;
      setGame({ ...current, player: { ...current.player, skillLoadout: next } });
      return next;
    },
  };
}

export function showHeroSkillEditor(
  root: HTMLElement,
  content: ContentIndex,
  scene: { gs(): GameState | undefined; setGame(state: GameState): void },
  onClose: () => void,
): void {
  const state = scene.gs();
  if (!state) return;
  render(
    h(HeroSkillScreen, {
      ...heroSkillEditor(
        state,
        content,
        () => scene.gs(),
        (next) => scene.setGame(next),
      ),
      onClose,
    }),
    root,
  );
}
