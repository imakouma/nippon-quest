import type { Stats } from '../../core/content/schemas';
import { ElementChip } from '../chips';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { displayText, stripRuby } from '../ruby';
import { t } from '../i18n';
import type { BagThing, BagOverlayProps } from './bagTypes';
import { Pic } from './BagVisuals';

const STATS: [keyof Stats, string][] = [
  ['hp', 'field.statHp'],
  ['mp', 'field.statMp'],
  ['scienceAtk', 'field.statScienceAtk'],
  ['humanitiesAtk', 'field.statHumanitiesAtk'],
  ['scienceDef', 'field.statScienceDef'],
  ['humanitiesDef', 'field.statHumanitiesDef'],
  ['spd', 'field.statSpd'],
  ['wis', 'field.statWis'],
];

function HeroBar({
  label,
  current,
  total,
  color,
}: {
  label: string;
  current: number;
  total: number;
  color: string;
}) {
  const value = Math.max(0, Math.min(current, total));
  return (
    <div class="nq-bag-hero-bar-row">
      <span class="nq-bag-hero-bar-label">{label}</span>
      <div
        class="nq-bag-hero-bar"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={value}
      >
        <span
          class={`nq-bag-hero-bar-fill ${color}`}
          style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }}
        />
        <span class="nq-bag-hero-bar-value">
          {value}/{total}
        </span>
      </div>
    </div>
  );
}

type Props = Pick<BagOverlayProps, 'onGrow' | 'onUse' | 'onRosterRemove' | 'flashKey'> & {
  m: BagThing;
  message: string | null;
  toggle: () => void;
  leader: () => void;
  evolve: () => void;
};
export function BagDetails({
  m,
  message,
  toggle,
  leader,
  evolve,
  onGrow,
  onUse,
  onRosterRemove,
  flashKey,
}: Props) {
  const isObject = m.kind === 'item' || m.kind === 'equip';
  const reason =
    m.blockedReason ?? (m.kind === 'item' && m.action !== 'pack' ? t('field.bagStorageOnly') : null);
  return (
    <aside class="nq-bag-details" aria-label={displayText(t('field.bagDetails'))}>
      {
        <div class="nq-wmap-info nq-party-info">
          <div class="nq-party-head">
            <div class={`nq-party-art ${flashKey === m.key ? 'nq-party-evolved' : ''}`}>
              <Pic x={m} size={6} />
            </div>
            <div class="nq-party-who">
              <RubyLabel text={m.name} class="nq-party-name" />
              <span class="nq-party-sub">
                {m.level !== undefined && (
                  <>
                    {t('battle.lv')}
                    {m.level}
                    {m.growth && ` / ${m.growth.levelCap}`}
                  </>
                )}
                {m.kind === 'monster' && m.element && <ElementChip el={m.element} />}
              </span>
            </div>
            {m.kind === 'hero' && m.stats && m.hp !== undefined && m.experience && (
              <div class="nq-bag-hero-bars">
                <HeroBar label={t('field.statHp')} current={m.hp} total={m.stats.hp} color="hp" />
                {m.experience.capped ? (
                  <div class="nq-bag-hero-bar-row">
                    <span class="nq-bag-hero-bar-label">{t('field.bagHeroExperience')}</span>
                    <div class="nq-bag-hero-bar">
                      <span class="nq-bag-hero-bar-value">{stripRuby(t('field.bagHeroXpCapped'))}</span>
                    </div>
                  </div>
                ) : (
                  <HeroBar
                    label={t('field.bagHeroExperience')}
                    current={m.experience.current}
                    total={m.experience.total}
                    color="xp"
                  />
                )}
              </div>
            )}
            {isObject && m.count !== undefined && (
              <span class="nq-bag-detail-count" aria-label={displayText(t('field.townHave', { n: m.count }))}>
                ×{m.count}
              </span>
            )}
          </div>
          {isObject && m.sub && <RubyLabel text={m.sub} class="nq-bag-detail-kind" as="p" />}
          {m.kind === 'item' && m.action === 'pack' && (
            <RubyLabel text={t('field.bagToolPlace')} class="nq-bag-reason" as="p" />
          )}
          {!!m.effects?.length && (
            <section class="nq-bag-effects" aria-label={displayText(t('field.bagEffect'))}>
              <RubyLabel text={t('field.bagEffect')} class="nq-bag-effects-title" as="p" />
              {m.effects.map((effect, i) => (
                <div class="nq-bag-effect-row" key={i}>
                  <RubyLabel text={effect.label} />
                  {effect.value && <strong class="nq-bag-effect-value">{effect.value}</strong>}
                </div>
              ))}
            </section>
          )}
          {m.kind === 'hero' && m.stats && (
            <section class="nq-bag-hero-stats" aria-label={displayText(t('field.bagHeroStats'))}>
              <RubyLabel text={t('field.bagHeroStats')} class="nq-bag-hero-heading" as="p" />
              <div class="nq-bag-hero-stat-grid">
                {STATS.slice(2).map(([key, label], i) => (
                  <div class={`nq-bag-hero-stat ${i < 2 ? 'attack' : i < 4 ? 'defense' : 'other'}`} key={key}>
                    <span>{stripRuby(t(label))}</span>
                    <strong>{Math.round(m.stats![key])}</strong>
                  </div>
                ))}
              </div>
            </section>
          )}
          {m.kind === 'hero' && m.growth && (
            <section class="nq-bag-hero-growth">
              <RubyLabel text={t('field.levelCapHeroTitle')} class="nq-bag-hero-heading" as="p" />
              <strong class="nq-bag-hero-cap">{m.growth.levelCap}</strong>
              <RubyLabel
                text={t('field.levelCapHeroMaximum', { n: m.growth.maximum })}
                class="nq-bag-hero-growth-small"
                as="p"
              />
              {m.growth.levelCap < m.growth.maximum && m.growth.materials && (
                <>
                  <RubyLabel
                    text={t('field.levelCapHeroMaterials')}
                    class="nq-bag-hero-growth-small"
                    as="p"
                  />
                  <div class="nq-bag-hero-materials">
                    {m.growth.materials.map((material) => (
                      <div key={material.name}>
                        <RubyLabel text={material.name} />
                        <strong>
                          {material.have}/{material.need}
                        </strong>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
          {m.kind !== 'hero' && m.stats && (
            <div class="nq-party-stats">
              {STATS.map(([k, key]) => (
                <span key={k}>
                  <small>{stripRuby(t(key))}</small>
                  {Math.round(m.stats![k])}
                </span>
              ))}
            </div>
          )}
          {!!m.lines?.length && (
            <div class="nq-bag-facts">
              {m.lines.map((l, i) => (
                <RubyLabel key={i} text={l} class="nq-bag-line" as="p" />
              ))}
            </div>
          )}
          {m.kind !== 'hero' && !!m.skills?.length && (
            <>
              <p class="nq-party-label">
                <RubyLabel text={t('cmd.skill')} />
              </p>
              <ul class="nq-party-skills">
                {m.skills.map((s, i) => (
                  <li key={i}>
                    <RubyLabel text={s.name} />
                    <span class="nq-party-star">{s.scan ? '' : '★'.repeat(s.gauge)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {reason && <RubyLabel text={reason} class="nq-bag-reason" as="p" />}
          {!isObject && m.sub && <RubyLabel text={m.sub} class="nq-party-blurb" as="p" />}
          {m.blurb && <RubyLabel text={m.blurb} class="nq-party-blurb" as="p" />}
        </div>
      }
      {message && (
        <div class="nq-party-msg nq-bag-message" role="status" aria-live="polite">
          <RubyLabel text={message} />
        </div>
      )}
      <div class="nq-bag-actions">
        {m.kind !== 'hero' && (
          <button type="button" class="nq-opt nq-bag-toggle" disabled={!!reason} onClick={toggle}>
            <RubyLabel
              text={t(
                m.inBag
                  ? 'field.bagReturn'
                  : m.kind === 'item'
                    ? 'field.bagPackTool'
                    : m.kind === 'equip'
                      ? 'field.bagEquipAction'
                      : 'field.bagIn',
              )}
            />
          </button>
        )}
        {(m.growth || (m.kind === 'monster' && (m.inBag || m.roster || m.evolve))) && (
          <div class="nq-wmap-foot nq-party-foot">
            {m.growth && (
              <button
                type="button"
                class={`nq-opt nq-wmap-go nq-bag-grow ${m.growth.canUnlock ? 'nq-bag-grow-ready' : ''}`}
                onClick={() => onGrow(m.key)}
              >
                <PixelIcon name="star" scale={3} />
                <RubyLabel text={t('field.levelCapGrow')} />
              </button>
            )}
            {m.kind === 'monster' && m.inBag && !m.leader && (
              <button type="button" class="nq-opt nq-wmap-go" onClick={leader}>
                <PixelIcon name="hero" scale={3} />
                {t('field.partySetLeader')}
              </button>
            )}
            {m.kind === 'monster' && !m.inBag && m.roster && (
              <button type="button" class="nq-opt nq-wmap-go" onClick={() => onRosterRemove(m.key)}>
                <PixelIcon name="cmd-item" scale={3} />
                {t('field.bagRosterRemove')}
              </button>
            )}
            {m.evolve && (
              <button
                type="button"
                class={`nq-opt nq-wmap-go nq-party-evolve ${m.evolve.ok && m.evolve.room ? 'nq-party-evolve-ok' : ''}`}
                disabled={!m.evolve.ok || !m.evolve.room}
                onClick={evolve}
              >
                <PixelIcon name="star" scale={3} />
                {t('field.partyEvolve')}
              </button>
            )}
          </div>
        )}
        {m.kind === 'item' && m.action === 'pack' && (
          <div class="nq-wmap-foot nq-party-foot">
            <button
              type="button"
              class={`nq-opt nq-wmap-go nq-bag-use ${m.usable ? 'nq-party-evolve-ok' : ''}`}
              disabled={!m.usable}
              onClick={() => onUse(m.key)}
            >
              <span class="nq-heart" aria-hidden="true">
                ♥
              </span>
              <RubyLabel text={t('field.bagUse')} />
            </button>
          </div>
        )}
        {m.evolve && (
          <RubyLabel
            class="nq-wmap-keys"
            text={
              m.evolve.ok && !m.evolve.room
                ? t('field.bagEvolveNoRoom', { n: m.evolve.extra })
                : t(m.evolve.ok ? 'field.partyEvolveNeed' : 'field.partyEvolveNo', {
                    item: m.evolve.itemName,
                    to: m.evolve.toName,
                    need: m.evolve.need,
                    n: m.evolve.have,
                  })
            }
          />
        )}
      </div>
    </aside>
  );
}
