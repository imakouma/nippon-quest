import type { Skill } from '../content/schemas';
import { STARTER_SKILL_IDS } from '../state/starter';

type SkillData = Pick<Skill, 'id' | 'subject' | 'costGauge'>;
export interface HeroSkillLoadout {
  normal: string[];
  charge: string[];
}

export function defaultSkillLoadout(
  learned: readonly string[],
  skills: ReadonlyMap<string, SkillData>,
  bursts: Partial<Record<Skill['subject'], string>>,
): HeroSkillLoadout {
  const normal = [...new Set(learned)].filter((id) => skills.get(id)?.costGauge === 0).slice(0, 4);
  if (!normal.length && skills.get(STARTER_SKILL_IDS[0])?.costGauge === 0) normal.push(STARTER_SKILL_IDS[0]);
  const subjects = new Set([...learned, ...normal].flatMap((id) => skills.get(id)?.subject ?? []));
  const charge = [
    ...new Set(
      Object.entries(bursts).flatMap(([subject, id]) =>
        id && subjects.has(subject as Skill['subject']) && (skills.get(id)?.costGauge ?? 0) > 0 ? [id] : [],
      ),
    ),
  ].slice(0, 2);
  return { normal, charge };
}

export function setLoadoutSkill(
  loadout: HeroSkillLoadout,
  category: keyof HeroSkillLoadout,
  index: number,
  skillId: string | null,
  skills: ReadonlyMap<string, SkillData>,
  available: readonly string[],
): HeroSkillLoadout | null {
  const current = loadout[category];
  const limit = category === 'normal' ? 4 : 2;
  if (!Number.isInteger(index) || index < 0 || index >= limit || index > current.length) return null;
  if (skillId === null && (index >= current.length || (category === 'normal' && current.length === 1)))
    return null;
  const skill = skillId && skills.get(skillId);
  if (
    skillId &&
    (!skill ||
      !available.includes(skillId) ||
      (skill.costGauge === 0) !== (category === 'normal') ||
      [...loadout.normal, ...loadout.charge].some(
        (id, i) =>
          id === skillId && !(category === 'normal' ? i === index : i === loadout.normal.length + index),
      ))
  )
    return null;
  const next = [...current];
  if (skillId === null) next.splice(index, 1);
  else next[index] = skillId;
  return { ...loadout, [category]: next };
}

export function availableLoadoutSkills(
  learned: readonly string[],
  granted: readonly string[],
  skills: ReadonlyMap<string, SkillData>,
  bursts: Partial<Record<Skill['subject'], string>>,
): string[] {
  const base = [...new Set([...learned, ...granted])].filter((id) => skills.has(id));
  if (
    !base.some((id) => skills.get(id)?.costGauge === 0) &&
    skills.get(STARTER_SKILL_IDS[0])?.costGauge === 0
  )
    base.push(STARTER_SKILL_IDS[0]);
  const subjects = new Set(base.flatMap((id) => skills.get(id)?.subject ?? []));
  return [
    ...new Set([
      ...base,
      ...Object.entries(bursts).flatMap(([subject, id]) =>
        id && subjects.has(subject as Skill['subject']) && skills.has(id) ? [id] : [],
      ),
    ]),
  ];
}

export function resolveSkillLoadout(
  saved: HeroSkillLoadout | null | undefined,
  learned: readonly string[],
  granted: readonly string[],
  skills: ReadonlyMap<string, SkillData>,
  bursts: Partial<Record<Skill['subject'], string>>,
): HeroSkillLoadout {
  if (!saved) return defaultSkillLoadout(learned, skills, bursts);
  const available = availableLoadoutSkills(learned, granted, skills, bursts);
  const normal = [...new Set(saved.normal)]
    .filter((id) => available.includes(id) && skills.get(id)?.costGauge === 0)
    .slice(0, 4);
  const charge = [...new Set(saved.charge)]
    .filter((id) => available.includes(id) && (skills.get(id)?.costGauge ?? 0) > 0)
    .slice(0, 2);
  if (!normal.length) {
    const fallback = available.find((id) => skills.get(id)?.costGauge === 0);
    if (fallback) normal.push(fallback);
  }
  return { normal, charge };
}
