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
    initial: resolveSkillLoadout(
      state.player.skillLoadout,
      state.player.skills,
      granted,
      content.skills,
      bursts,
    ),
    skills: available.flatMap((id) => content.skills.get(id) ?? []),
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
