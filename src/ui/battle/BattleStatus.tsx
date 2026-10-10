import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import type { AllyView, EnemyView, HudState, SubjectGaugeView } from './store';

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

export function EnemyWindow({ e }: { e: EnemyView }) {
  return (
    <div class={`nq-win nq-foe ${e.isBoss ? 'nq-foe-boss' : ''}`}>
      <div class="nq-foe-heading">
        <RubyLabel text={e.name} class="nq-foe-name" />
        <span class="nq-foe-level">
          {t('battle.lv')} {e.level}
        </span>
        {e.isBoss && (
          <span class="nq-boss-tag">
            <PixelIcon name="boss" scale={2} />
            <RubyLabel text={t('battle.boss')} />
          </span>
        )}
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
        <span class="nq-ally-cur" aria-hidden="true">
          {active ? '▶' : ''}
        </span>
        <PixelIcon name={a.isHero ? 'hero' : `el-${a.element}`} scale={2} />
        <RubyLabel text={a.name} class="nq-ally-name" />
        <span class="nq-ally-lv">
          {t('battle.lv')} {a.level}
        </span>
        {a.passive && (
          <span class="nq-ally-passive">
            <PixelIcon name={`subj-${a.passive}`} scale={2} />
          </span>
        )}
        {a.defMult > 1 && <span class="nq-chip nq-def">{t('battle.defMark')}▲</span>}
      </div>
      <div class="nq-ally-hp">
        {down ? (
          <span class="nq-down">{t('battle.fainted')}</span>
        ) : (
          <>
            <Bar
              value={a.hp}
              max={a.maxHp}
              kind="hp"
              label={`${displayText(a.name)} ${t('battle.hp')}`}
              showValue
            />
          </>
        )}
      </div>
    </div>
  );
}

export function GaugeColumn({ list }: { list: SubjectGaugeView[] }) {
  return (
    <div class="nq-sgauge">
      <span class="nq-sgauge-title">{t('battle.gauge')}</span>
      {list.map((g) => (
        <div
          key={g.subject}
          class={`nq-sg ${g.value >= g.max ? 'nq-sg-full' : ''} ${g.boosted ? 'nq-sg-boost' : ''}`}
          role="meter"
          aria-label={t(`subjects.${g.subject}`)}
          aria-valuemin={0}
          aria-valuenow={g.value}
          aria-valuemax={g.max}
        >
          <PixelIcon name={`subj-${g.subject}`} scale={2} />
          <span class="nq-sg-bar">
            <i class={`nq-subj-${g.subject}`} style={{ width: `${(g.value / g.max) * 100}%` }} />
            {g.marks.map((mark) => (
              <b key={mark} class="nq-sg-mark" style={{ left: `${(mark / g.max) * 100}%` }} />
            ))}
          </span>
          {g.gain && (
            <span key={g.gain.id} class="nq-sg-gain">
              +{g.gain.amount}
            </span>
          )}
        </div>
      ))}
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
