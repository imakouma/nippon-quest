import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import type { AllyView, EnemyView, HudState, StatusEffectView } from './store';

export type BarKind = 'hp' | 'mp' | 'xp' | 'cmd' | 'time';

export function Bar({
  value,
  max,
  kind,
  label,
  showValue = false,
}: {
  value: number;
  max: number;
  kind: BarKind;
  label: string;
  showValue?: boolean;
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const tone = kind !== 'hp' ? kind : ratio > 0.5 ? 'hp' : ratio > 0.2 ? 'hp-mid' : 'hp-low';
  return (
    <div
      class={`nq-bar nq-bar-${kind}`}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuenow={value}
      aria-valuemax={max}
    >
      <i class={`nq-fill-${tone}`} style={{ width: `${ratio * 100}%` }} />
      {showValue && (
        <span class="nq-bar-value" aria-hidden="true">
          {value}/{max}
        </span>
      )}
    </div>
  );
}

export function TurnBadge({ turn, class: cls }: { turn: number; class: string }) {
  return <span class={`nq-turn ${cls}`}>{t('battle.turn', { n: turn })}</span>;
}

function StatusEffects({ effects }: { effects: StatusEffectView[] }) {
  if (effects.length === 0) return null;
  return (
    <div class="nq-effects" aria-label={t('battle.statusEffects')}>
      {effects.map((effect) => {
        const marker = effect.direction === 'up' ? '▲' : effect.direction === 'down' ? '▼' : '×';
        return (
          <span
            key={effect.kind}
            class={`nq-effect nq-effect-${effect.direction}`}
            data-status-effect={effect.kind}
            aria-label={t('battle.statusEffectLabel', {
              name: t(`battle.status.${effect.kind}`),
              direction: t(`battle.statusDirection.${effect.direction}`),
              n: effect.turns,
            })}
          >
            <RubyLabel text={t(`battle.status.${effect.kind}`)} />
            <span aria-hidden="true">{marker}</span>
            <span>{t('battle.statusTurns', { n: effect.turns })}</span>
          </span>
        );
      })}
    </div>
  );
}

export function EnemyWindow({ e }: { e: EnemyView }) {
  return (
    <div class="nq-win nq-foe">
      <div class="nq-foe-heading">
        <RubyLabel text={e.name} class="nq-foe-name" />
        <span class="nq-foe-level">
          {t('battle.lv')} {e.level}
        </span>
      </div>
      <div class="nq-foe-hp">
        <Bar
          value={e.hp}
          max={e.maxHp}
          kind="hp"
          label={`${displayText(e.name)} ${t('battle.hp')}`}
          showValue
        />
      </div>
      <StatusEffects effects={e.effects} />
    </div>
  );
}

export function AllyRow({ a, active }: { a: AllyView; active: boolean }) {
  const down = a.hp <= 0;
  return (
    <div
      class={`nq-ally ${a.isHero ? 'nq-ally-hero' : ''} ${active ? 'nq-ally-active' : ''} ${down ? 'nq-ally-down' : ''}`}
    >
      <div class="nq-ally-heading">
        <span class="nq-ally-cur" aria-hidden="true" />
        <PixelIcon name={a.isHero ? 'hero' : `el-${a.element}`} scale={2} />
        <RubyLabel text={a.name} class="nq-ally-name" />
        <span class="nq-ally-lv">
          {t('battle.lv')} {a.level}
        </span>
      </div>
      <div class="nq-ally-hp">
        {down ? (
          <span class="nq-down">{t('battle.fainted')}</span>
        ) : (
          <Bar
            value={a.hp}
            max={a.maxHp}
            kind="hp"
            label={`${displayText(a.name)} ${t('battle.hp')}`}
            showValue
          />
        )}
      </div>
      <StatusEffects effects={a.effects} />
    </div>
  );
}

export function ComboBadge({ c }: { c: HudState['combo'] }) {
  return (
    <div key={c.count} class="nq-combo">
      <span class="nq-combo-n">{t('battle.comboBadge', { n: c.count })}</span>
      <span class="nq-combo-p">{t('battle.comboPower', { p: c.percent })}</span>
    </div>
  );
}
