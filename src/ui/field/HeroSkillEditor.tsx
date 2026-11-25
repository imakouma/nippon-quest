import { useRef, useState } from 'preact/hooks';
import type { Skill } from '../../core/content/schemas';
import type { HeroSkillLoadout } from '../../core/progression/heroSkillLoadout';
import ja from '../../../content/i18n/ja.json';
import { format, t, type I18nVars } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';

// Keep editor labels in the same build as the controls that use them.
function fieldLabel(key: keyof typeof ja.field, vars?: I18nVars): string {
  return format(ja.field[key] as string, vars);
}

export interface HeroSkillEditorProps {
  initial: HeroSkillLoadout;
  skills: Skill[];
  levels?: Record<string, number>;
  onChange: (category: keyof HeroSkillLoadout, index: number, id: string | null) => HeroSkillLoadout | null;
}

export function HeroSkillEditor({ initial, skills, levels, onChange }: HeroSkillEditorProps) {
  const [loadout, setLoadout] = useState(initial);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<{ category: keyof HeroSkillLoadout; index: number } | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const region = useRef<HTMLElement>(null);
  const closePicker = () => {
    if (!editing) return;
    const key = editing.category + editing.index;
    setEditing(null);
    setPreviewId(null);
    requestAnimationFrame(() =>
      region.current?.querySelector<HTMLButtonElement>(`[data-slot="${key}"]`)?.focus(),
    );
  };
  function equip(id: string | null) {
    if (!editing) return;
    const next = onChange(editing.category, Math.min(editing.index, loadout[editing.category].length), id);
    setError(!next);
    if (next) {
      setLoadout(next);
      closePicker();
    }
  }
  const equipped = [...loadout.normal, ...loadout.charge];
  const current = editing ? loadout[editing.category][editing.index] : undefined;
  const candidates = editing
    ? skills
        .filter((s) => (s.costGauge === 0) === (editing.category === 'normal') && !equipped.includes(s.id))
        .sort((a, b) => a.power - b.power)
    : [];
  const preview = candidates.find((s) => s.id === previewId) ?? candidates[0];
  const skillName = (skill: Skill) => (
    <>
      <RubyLabel text={skill.name} />
      {levels?.[skill.id] && <span class="nq-skill-level"> Lv.{levels[skill.id]}</span>}
    </>
  );
  const subject = (skill: Skill) => (
    <small class="nq-skill-school" data-subject={skill.subject}>
      {t(`subjects.${skill.subject}`)}
    </small>
  );
  return (
    <section
      ref={region}
      class={editing ? 'nq-skill-editor nq-skill-picking' : 'nq-skill-editor'}
      aria-label={fieldLabel('skillLoadoutTitle')}
      onKeyDown={(e) => {
        if (editing && e.key === 'Escape') {
          e.stopPropagation();
          e.preventDefault();
          closePicker();
        }
      }}
    >
      {error && <p role="status">{fieldLabel('skillEditError')}</p>}
      {editing ? (
        <>
          <header class="nq-skill-picker-head">
            <strong>
              {current
                ? fieldLabel('skillReplace', {
                    name: displayText(skills.find((s) => s.id === current)!.name),
                  })
                : fieldLabel('skillAdd')}
            </strong>
            <button type="button" autoFocus onClick={closePicker}>
              {t('ui.back')}
            </button>
          </header>
          <div class="nq-skill-choices">
            {candidates.map((s) => (
              <button
                type="button"
                key={s.id}
                aria-pressed={s.id === preview?.id}
                onClick={() => setPreviewId(s.id)}
              >
                <b>{skillName(s)}</b>
                {subject(s)}
              </button>
            ))}
            {!candidates.length && <p>{fieldLabel('skillNoChoice')}</p>}
            {current && (editing.category === 'charge' || loadout.normal.length > 1) && (
              <button type="button" onClick={() => equip(null)}>
                {fieldLabel('skillRemove')}
              </button>
            )}
          </div>
          {preview && (
            <aside class="nq-skill-detail">
              <div class="nq-skill-description" aria-live="polite">
                <strong>{skillName(preview)}</strong>
                {subject(preview)}
                {preview.flavor && (
                  <p>
                    <RubyLabel text={preview.flavor} />
                  </p>
                )}
                <small>
                  {fieldLabel('skillPower', { n: preview.power })}{' '}
                  {fieldLabel('skillAccuracy', { n: preview.accuracy ?? 100 })}{' '}
                  {preview.costGauge > 0 && fieldLabel('skillGauge', { n: preview.costGauge })}
                </small>
                {preview.additionalEffect && (
                  <small>
                    {t(
                      `battle.effect${preview.additionalEffect.target === 'self' ? 'Self' : 'Target'}${preview.additionalEffect.stat === 'atk' ? 'Atk' : 'Def'}${preview.additionalEffect.multiplier >= 1 ? 'Up' : 'Down'}`,
                      { n: preview.additionalEffect.chance, turns: preview.additionalEffect.turns },
                    )}
                  </small>
                )}
              </div>
              <button type="button" onClick={() => equip(preview.id)}>
                {fieldLabel('skillEquipSelected')}
              </button>
            </aside>
          )}
        </>
      ) : (
        <>
          <p class="nq-skill-hint">
            <RubyLabel text={fieldLabel('skillEditHint')} />
          </p>
          {(['normal', 'charge'] as const).map((category) => (
            <fieldset key={category} class={'nq-skill-' + category}>
              <legend>
                {fieldLabel(category === 'normal' ? 'skillNormal' : 'skillCharge')} {loadout[category].length}
                /{category === 'normal' ? 4 : 2}
              </legend>
              {Array.from({ length: category === 'normal' ? 4 : 2 }, (_, index) => {
                const skill = skills.find((s) => s.id === loadout[category][index]);
                return (
                  <button
                    type="button"
                    key={index}
                    data-slot={category + index}
                    aria-label={skill ? undefined : fieldLabel('skillAdd') + ' ' + (index + 1)}
                    onClick={() => {
                      setError(false);
                      setEditing({ category, index });
                    }}
                  >
                    {skill && <b>{skillName(skill)}</b>}
                    {skill && subject(skill)}
                  </button>
                );
              })}
            </fieldset>
          ))}
        </>
      )}
    </section>
  );
}
