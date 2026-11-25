import { ChargeGaugeFrame } from './ChargeGaugeFrame';
import type { HudState, HudStore } from './store';
import { t } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { playSfx } from '../sfx';
import { PixelIcon } from '../PixelIcon';

/** 技選択に隣接するチャージ切替と教科ゲージ。切替だけではターンを消費しない。 */
export function ChargeControl({ s, store }: { s: HudState; store: HudStore }) {
  if (s.gauges.length === 0 || (s.menu !== 'commands' && s.menu !== 'skills')) return null;
  const active = s.menu === 'skills' && s.chargeSkills;
  const ready = s.gauges.some((g) => g.marks.some((cost) => g.value >= cost));
  const enabled =
    s.menu === 'skills' ||
    (s.menu === 'commands' && s.commands.some((c) => c.kind === 'skill' && !c.disabled));
  return (
    <div class="nq-charge-dock">
      <button
        type="button"
        class={`nq-charge-toggle ${ready ? 'nq-charge-ready' : ''}`}
        data-charge-toggle
        aria-pressed={active}
        aria-describedby="nq-charge-gauge-status"
        aria-controls={s.menu === 'skills' ? 'nq-battle-skills' : undefined}
        disabled={!enabled}
        onClick={() => {
          playSfx('select');
          if (s.menu === 'commands') store.dispatch({ t: 'command', kind: 'skill' });
          if (store.get().menu === 'skills') store.set({ chargeSkills: !active, cursor: 0 });
        }}
      >
        <ChargeGaugeFrame gauges={s.gauges} />
        <span class="nq-charge-subjects" aria-hidden="true">
          {s.gauges.map((g) => (
            <PixelIcon key={g.subject} name={`subj-${g.subject}`} scale={s.gauges.length > 3 ? 1 : 2} />
          ))}
        </span>
        <RubyLabel text={t('battle.chargeSkills')} class="nq-charge-label" />
      </button>
      <span id="nq-charge-gauge-status" class="nq-charge-status">
        {s.gauges.map((g) => `${t(`subjects.${g.subject}`)} ${g.value}/${g.max}`).join('、')}
      </span>
    </div>
  );
}
