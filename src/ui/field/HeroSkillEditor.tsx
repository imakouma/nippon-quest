import { useState } from 'preact/hooks';
import type { Skill } from '../../core/content/schemas';
import type { HeroSkillLoadout } from '../../core/progression/heroSkillLoadout';
import { t } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';

export interface HeroSkillEditorProps {
  initial: HeroSkillLoadout;
  skills: Skill[];
  levels?: Record<string, number>;
  onChange: (category: keyof HeroSkillLoadout, index: number, id: string | null) => HeroSkillLoadout | null;
}

export function HeroSkillEditor({ initial, skills, levels, onChange }: HeroSkillEditorProps) {
  const [loadout, setLoadout] = useState(initial);
  const [error, setError] = useState(false);
  return (
    <section class="nq-skill-editor" aria-label={t('field.skillLoadoutTitle')}>
      {error && <p role="status">{t('field.skillEditError')}</p>}
      {(['normal', 'charge'] as const).map((category) => (
        <fieldset key={category}>
          <legend>
            <RubyLabel text={t(category === 'normal' ? 'field.skillNormal' : 'field.skillCharge')} />
          </legend>
          {Array.from({ length: category === 'normal' ? 4 : 2 }, (_, index) => {
            const selected = loadout[category][index] ?? '';
            const current = skills.find((skill) => skill.id === selected);
            return (
              <div class="nq-skill-editor-slot" key={index}>
                <label>
                  {t('field.skillSlot', { n: index + 1 })}
                  <select
                    disabled={index > loadout[category].length}
                    value={selected}
                    onChange={(event) => {
                      const value = event.currentTarget.value || null;
                      const updated = onChange(category, index, value);
                      if (updated) {
                        setLoadout(updated);
                        setError(false);
                      } else {
                        event.currentTarget.value = selected;
                        setError(true);
                      }
                    }}
                  >
                    <option value="">{t('field.skillEmpty')}</option>
                    {skills
                      .filter((skill) => (skill.costGauge === 0) === (category === 'normal'))
                      .map((skill) => (
                        <option
                          key={skill.id}
                          value={skill.id}
                          disabled={
                            skill.id !== selected && [...loadout.normal, ...loadout.charge].includes(skill.id)
                          }
                        >
                          {displayText(skill.name)}
                        </option>
                      ))}
                  </select>
                </label>
                {current && (
                  <p>
                    {levels?.[current.id] && <span>Lv.{levels[current.id]}　</span>}
                    {t('field.skillDetail', {
                      subject: t(`subjects.${current.subject}`),
                      power: current.power,
                      cost: current.costGauge,
                      accuracy: current.accuracy ?? 100,
                    })}
                    {current.additionalEffect && (
                      <span>
                        {' '}
                        {t(
                          `battle.effect${current.additionalEffect.target === 'self' ? 'Self' : 'Target'}${current.additionalEffect.stat === 'atk' ? 'Atk' : 'Def'}${current.additionalEffect.multiplier >= 1 ? 'Up' : 'Down'}`,
                          { n: current.additionalEffect.chance, turns: current.additionalEffect.turns },
                        )}
                      </span>
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </fieldset>
      ))}
    </section>
  );
}
