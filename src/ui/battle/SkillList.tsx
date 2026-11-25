import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { visibleBattleSkills, type HudState, type HudStore, type SkillOption } from './store';
import { pickBattleHudOption, toggleSkillDetails } from './useBattleHudInput';

const EFFECT_HINT = {
  damage: 'battle.powerUpHint',
  scan: 'battle.scanHint',
  heal: 'battle.healHint',
  buff: 'battle.buffHint',
  debuff: 'battle.debuffHint',
  status: 'battle.statusHint',
} as const;

/** 必殺技に 必要な 教科ゲージを 最大量に 対する 割合で 示す */
function GaugeCost({ k, max }: { k: SkillOption; max: number }) {
  const r = Math.min(1, k.cost / max);
  return (
    <span
      class={`nq-opt-cost ${k.have >= k.cost ? 'nq-opt-cost-ok' : ''}`}
      aria-label={t('battle.gaugeCostStatus', { cost: k.cost })}
    >
      <span class="nq-opt-costbar">
        <i class={`nq-subj-${k.subject}`} style={{ width: `${r * 100}%` }} />
      </span>
      <span class="nq-opt-cost-value" aria-hidden="true">
        {k.cost}
      </span>
    </span>
  );
}

export function SkillList({ s, store }: { s: HudState; store: HudStore }) {
  const skills = visibleBattleSkills(s);
  const focus = skills[s.cursor];
  const subject = focus ? t(`subjects.${focus.subject}`) : '';
  return (
    <div class={`nq-win nq-menu nq-menu-skill ${s.skillDetails ? 'nq-skill-details-open' : ''}`}>
      <div class="nq-menu-layout">
        <div
          id="nq-battle-skills"
          class="nq-menu-grid"
          role="group"
          aria-label={displayText(t(s.chargeSkills ? 'battle.chargeSkills' : 'battle.normalSkills'))}
        >
          {skills.length === 0 && <p class="nq-menu-empty">{t('battle.noChargeSkills')}</p>}
          {skills.map((k, i) => (
            <button
              key={k.key}
              type="button"
              class={`nq-opt ${s.cursor === i ? 'nq-focus' : ''} ${k.disabled ? 'nq-opt-off' : ''}`}
              aria-current={s.cursor === i ? 'true' : undefined}
              aria-disabled={k.disabled}
              data-skill={k.id}
              data-actor={k.actorId}
              onFocus={() => s.cursor !== i && store.set({ cursor: i })}
              onPointerMove={() => s.cursor !== i && store.set({ cursor: i })}
              onClick={() =>
                pickBattleHudOption({
                  key: k.key,
                  disabled: k.disabled,
                  action: () => store.dispatch({ t: 'skill', key: k.key }),
                })
              }
            >
              {/* 教科は色・ピクトだけで示す。狭い技一覧で「さんすう」等の文字を重ねない。 */}
              <PixelIcon name={`subj-${k.subject}`} scale={2} />
              <RubyLabel text={k.name} class="nq-opt-name" />
              <span class="nq-opt-side">
                {k.reason ? (
                  <span class="nq-opt-reason">{k.reason}</span>
                ) : (
                  <>
                    <PixelIcon name={`el-${k.element}`} scale={2} />
                    {k.cost > 0 ? (
                      <GaugeCost k={k} max={s.gauges.find((g) => g.subject === k.subject)?.max ?? k.cost} />
                    ) : (
                      <span class="nq-opt-charge">
                        {t('battle.chargeAmount', {
                          n:
                            k.chargeGain[0] === k.chargeGain[1]
                              ? k.chargeGain[0]
                              : `${k.chargeGain[0]}〜${k.chargeGain[1]}`,
                        })}
                      </span>
                    )}
                  </>
                )}
              </span>
            </button>
          ))}
        </div>
        {focus && s.skillDetails && (
          <div
            id="nq-skill-details"
            class="nq-menu-foot nq-menu-foot-skill"
            role="region"
            tabIndex={0}
            onKeyDown={(event) => {
              // 長い説明をスクロールしても、技の選択や発動は行わない。
              if (!['q', 'Q', 'Escape', 'x', 'X', 'Backspace'].includes(event.key)) event.stopPropagation();
            }}
            aria-label={displayText(t('battle.skillDetails'))}
          >
            <div class="nq-menu-foot-row">
              {focus.by && <RubyLabel text={t('battle.skillBy', { name: focus.by })} class="nq-opt-by" />}
              <RubyLabel text={focus.flavor ?? t(EFFECT_HINT[focus.effect])} />
            </div>
            <div class="nq-menu-foot-row">
              {t('battle.skillAccuracy', { n: focus.accuracy ?? 100 })}
              {focus.additionalEffect && (
                <span>
                  {t(
                    `battle.effect${focus.additionalEffect.target === 'self' ? 'Self' : 'Target'}${focus.additionalEffect.stat === 'atk' ? 'Atk' : 'Def'}${focus.additionalEffect.multiplier >= 1 ? 'Up' : 'Down'}`,
                    { n: focus.additionalEffect.chance, turns: focus.additionalEffect.turns },
                  )}
                </span>
              )}
            </div>
            <span class="nq-menu-grade">
              <span class="nq-menu-stars">{'★'.repeat(focus.stars)}</span>
              {focus.gradeRange[0] === focus.gradeRange[1]
                ? t('battle.gradeOne', { a: focus.gradeRange[0] })
                : t('battle.gradeRange', { a: focus.gradeRange[0], b: focus.gradeRange[1] })}
            </span>
            {focus.cost === 0 && <RubyLabel text={t('battle.chargeAmountHint')} />}
            {focus.cost > 0 && (
              <span class="nq-menu-cost">{t('battle.costHint', { subject, n: focus.cost })}</span>
            )}
          </div>
        )}
      </div>
      {focus && (
        <button
          type="button"
          class="nq-skill-details-toggle"
          aria-expanded={s.skillDetails}
          aria-controls={s.skillDetails ? 'nq-skill-details' : undefined}
          aria-keyshortcuts="Q"
          onClick={() => toggleSkillDetails(store)}
        >
          <kbd>Q</kbd>{' '}
          <RubyLabel text={t(s.skillDetails ? 'battle.closeSkillDetails' : 'battle.skillDetails')} />
        </button>
      )}
    </div>
  );
}
