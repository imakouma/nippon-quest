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
          </div>
          {m.kind === 'item' && m.action === 'pack' && (
            <RubyLabel text={t('field.bagToolPlace')} class="nq-bag-reason" as="p" />
          )}
          {m.stats && (
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
          {!!m.skills?.length && (
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
          {m.sub && <RubyLabel text={m.sub} class="nq-party-blurb" as="p" />}
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
