import { GaugeColumn } from './BattleStatus';
import type { HudState, HudStore } from './store';
import { t } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { playSfx } from '../sfx';

/** 技選択に隣接するチャージ切替と教科ゲージ。切替だけではターンを消費しない。 */
export function ChargeControl({ s, store }: { s: HudState; store: HudStore }) {
  if (s.gauges.length === 0 || (s.menu !== 'commands' && s.menu !== 'skills')) return null;
  const active = s.menu === 'skills' && s.chargeSkills;
  const ready = s.skills.some(
    (skill) => skill.cost > 0 && s.gauges.some((g) => g.subject === skill.subject && g.value >= skill.cost),
  );
  const enabled =
    s.menu === 'skills' ||
    (s.menu === 'commands' && s.commands.some((c) => c.kind === 'skill' && !c.disabled));
  return (
    <div class={`nq-charge-dock ${s.menu === 'skills' ? 'nq-charge-dock-skills' : ''}`}>
      <button
        type="button"
        class={`nq-charge-toggle ${ready ? 'nq-charge-ready' : ''}`}
        data-charge-toggle
        aria-pressed={active}
        aria-controls={s.menu === 'skills' ? 'nq-battle-skills' : undefined}
        disabled={!enabled}
        onClick={() => {
          playSfx('select');
          if (s.menu === 'commands') store.dispatch({ t: 'command', kind: 'skill' });
          if (store.get().menu === 'skills') store.set({ chargeSkills: !active, cursor: 0 });
        }}
      >
        <span class="nq-charge-star" aria-hidden="true">
          ✦
        </span>
        <RubyLabel text={t('battle.gaugeCharge')} />
        {s.menu === 'commands' && (
          <span class="nq-charge-hint">{t(ready ? 'battle.chargeReady' : 'battle.chargeBuild')}</span>
        )}
      </button>
      {s.menu === 'commands' && <GaugeColumn list={s.gauges} />}
    </div>
  );
}
