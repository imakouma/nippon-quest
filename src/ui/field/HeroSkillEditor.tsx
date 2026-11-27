import { useRef, useState } from 'preact/hooks';
import type { Skill } from '../../core/content/schemas';
import type { HeroSkillLoadout } from '../../core/progression/heroSkillLoadout';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import './hero-skill.css';

export interface HeroSkillEditorProps {
  initial: HeroSkillLoadout;
  skills: Skill[];
  levels?: Record<string, number>;
  onChange: (category: keyof HeroSkillLoadout, index: number, id: string | null) => HeroSkillLoadout | null;
}

const slots = { normal: 4, charge: 2 } as const;
const sortModes = ['element', 'grade', 'power', 'accuracy', 'special'] as const;
const elements = ['hino', 'mizu', 'mori', 'tsuchi', 'kaze', 'hikari', 'yami', 'none'];
type SortMode = (typeof sortModes)[number];

const orderBy: Record<SortMode, (a: Skill, b: Skill) => number> = {
  element: (a, b) => elements.indexOf(a.element) - elements.indexOf(b.element),
  grade: (a, b) => a.gradeRange[0] - b.gradeRange[0],
  power: (a, b) => b.power - a.power,
  accuracy: (a, b) => (b.accuracy ?? 100) - (a.accuracy ?? 100),
  special: () => 0,
};

export function HeroSkillEditor({ initial, skills, levels, onChange }: HeroSkillEditorProps) {
  const [loadout, setLoadout] = useState(initial);
  const [slot, setSlot] = useState<{ category: keyof HeroSkillLoadout; index: number }>({
    category: 'normal',
    index: 0,
  });
  const [previewId, setPreviewId] = useState<string>();
  const [sort, setSort] = useState<{ mode: SortMode; ascending: boolean }>({
    mode: 'element',
    ascending: false,
  });
  const [error, setError] = useState(false);
  const list = useRef<HTMLDivElement>(null);

  const current = loadout[slot.category][slot.index];
  const candidates = skills.filter((skill) => (skill.costGauge === 0) === (slot.category === 'normal'));
  const visible = candidates
    .filter((skill) => sort.mode !== 'special' || skill.effect !== 'damage' || skill.additionalEffect)
    .sort((a, b) => (sort.ascending ? -1 : 1) * orderBy[sort.mode](a, b));
  const preview = candidates.find((skill) => skill.id === (previewId ?? current)) ?? visible[0];
  const equipped = preview && (loadout.normal.includes(preview.id) || loadout.charge.includes(preview.id));
  const removable =
    current && preview?.id === current && (slot.category === 'charge' || loadout.normal.length > 1);

  function equip(id: string | null) {
    const next = onChange(slot.category, Math.min(slot.index, loadout[slot.category].length), id);
    setError(!next);
    if (!next) return;
    const index = Math.min(
      slot.index,
      id ? Math.max(0, next[slot.category].length - 1) : next[slot.category].length,
    );
    setLoadout(next);
    setSlot({ ...slot, index });
    setPreviewId(id ?? undefined);
  }

  const skillName = (skill: Skill) => (
    <>
      <RubyLabel text={skill.name} />
      {levels?.[skill.id] && <small class="nq-skill-level"> Lv.{levels[skill.id]}</small>}
    </>
  );
  const subject = (skill: Skill) => t(`subjects.${skill.subject}`);
  const group = (skill: Skill) =>
    sort.mode === 'element'
      ? t(`elements.${skill.element}`)
      : sort.mode === 'grade'
        ? t('field.skillGradeGroup', { n: skill.gradeRange[0] })
        : '';
  const secondary = (skill: Skill) =>
    sort.mode === 'power'
      ? skill.power
      : sort.mode === 'accuracy'
        ? `${skill.accuracy ?? 100}%`
        : subject(skill);

  return (
    <section class="nq-hero-skill-editor" aria-label={t('field.skillLoadoutTitle')}>
      <div class="nq-hero-skill-slots">
        {(Object.keys(slots) as (keyof HeroSkillLoadout)[]).map((category) => (
          <fieldset key={category}>
            <legend>{t(category === 'normal' ? 'field.skillNormal' : 'field.skillCharge')}</legend>
            {Array.from({ length: slots[category] }, (_, index) => {
              const skill = skills.find((item) => item.id === loadout[category][index]);
              const active = slot.category === category && slot.index === index;
              return (
                <button
                  type="button"
                  key={index}
                  data-slot={category + index}
                  aria-pressed={active}
                  onClick={() => {
                    setSlot({ category, index });
                    setPreviewId(undefined);
                    setError(false);
                    if (list.current) list.current.scrollTop = 0;
                  }}
                >
                  {skill ? (
                    <>
                      <PixelIcon name={`el-${skill.element}`} scale={2} />
                      <span>{skillName(skill)}</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">＋</span>
                      <RubyLabel text={t('field.skillOpenSlot')} />
                    </>
                  )}
                </button>
              );
            })}
          </fieldset>
        ))}
        {error && <p role="status">{t('field.skillEditError')}</p>}
      </div>

      <section class="nq-hero-skill-library">
        <h2>
          <RubyLabel text={t('field.skillLearned')} />
        </h2>
        <div class="nq-hero-skill-sort" role="group" aria-label={displayText(t('field.skillSort'))}>
          {sortModes.map((mode) => {
            const active = sort.mode === mode;
            const directional = mode === 'power' || mode === 'accuracy';
            const label = t(`field.skillSort_${mode}`);
            return (
              <button
                type="button"
                key={mode}
                aria-pressed={active}
                aria-label={
                  active && directional
                    ? displayText(
                        t(sort.ascending ? 'field.skillSortAscending' : 'field.skillSortDescending', {
                          label,
                        }),
                      )
                    : displayText(label)
                }
                onClick={() => {
                  setSort({ mode, ascending: directional && active && !sort.ascending });
                  if (list.current) list.current.scrollTop = 0;
                }}
              >
                <RubyLabel text={label} />
                {active && directional && <span aria-hidden="true">{sort.ascending ? '▲' : '▼'}</span>}
              </button>
            );
          })}
        </div>
        <div class="nq-hero-skill-list" ref={list}>
          {visible.map((skill, index) => (
            <div key={skill.id}>
              {group(skill) && (index === 0 || group(visible[index - 1]!) !== group(skill)) && (
                <h3>
                  <RubyLabel text={group(skill)} />
                </h3>
              )}
              <button
                type="button"
                aria-pressed={skill.id === preview?.id}
                onClick={() => setPreviewId(skill.id)}
              >
                <PixelIcon name={`el-${skill.element}`} scale={2} />
                <span>{skillName(skill)}</span>
                <small>{secondary(skill)}</small>
              </button>
            </div>
          ))}
          {!visible.length && (
            <RubyLabel text={t(sort.mode === 'special' ? 'field.skillNoSpecial' : 'field.skillNoChoice')} />
          )}
        </div>
      </section>

      <aside class="nq-hero-skill-detail" aria-label={displayText(t('field.skillDetails'))}>
        {preview && (
          <>
            <div class="nq-hero-skill-heading">
              <PixelIcon name={`el-${preview.element}`} scale={3} />
              <div>
                <h2>{skillName(preview)}</h2>
                <small>{subject(preview)}</small>
              </div>
            </div>
            <dl>
              <div>
                <dt>{t('field.skillSort_power')}</dt>
                <dd>{preview.power}</dd>
              </div>
              <div>
                <dt>{t('field.skillSort_accuracy')}</dt>
                <dd>{preview.accuracy ?? 100}%</dd>
              </div>
              <div>
                <dt>MP</dt>
                <dd>{preview.mp}</dd>
              </div>
              <div>
                <dt>{t('field.skillGaugeLabel')}</dt>
                <dd>{preview.costGauge ? `${preview.costGauge}%` : '—'}</dd>
              </div>
            </dl>
            <div class="nq-hero-skill-description">
              {preview.flavor && (
                <p>
                  <RubyLabel text={preview.flavor} />
                </p>
              )}
              {preview.additionalEffect && (
                <p>
                  {t(
                    `battle.effect${preview.additionalEffect.target === 'self' ? 'Self' : 'Target'}${preview.additionalEffect.stat === 'atk' ? 'Atk' : 'Def'}${preview.additionalEffect.multiplier >= 1 ? 'Up' : 'Down'}`,
                    { n: preview.additionalEffect.chance, turns: preview.additionalEffect.turns },
                  )}
                </p>
              )}
            </div>
            <div class="nq-hero-skill-actions">
              <button type="button" disabled={equipped} onClick={() => equip(preview.id)}>
                <RubyLabel text={t(equipped ? 'field.skillEquipped' : 'field.skillSetSlot')} />
              </button>
              {removable && (
                <button type="button" onClick={() => equip(null)}>
                  {t('field.skillRemove')}
                </button>
              )}
            </div>
          </>
        )}
      </aside>
    </section>
  );
}
