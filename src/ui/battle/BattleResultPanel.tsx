import { useEffect, useState } from 'preact/hooks';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { playSfx } from '../sfx';
import type { HudStore, ResultView } from './store';

function Bar({ value, max }: { value: number; max: number }) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div class="nq-bar nq-bar-xp" role="meter" aria-valuenow={value} aria-valuemax={max}>
      <i class="nq-fill-xp" style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}

function Cursor({ on }: { on: boolean }) {
  return on ? (
    <span class="nq-cur nq-heart" aria-hidden="true">
      ♥
    </span>
  ) : (
    <span class="nq-cur" />
  );
}

/** 勝敗・報酬・仲間化の結果画面。入力は HudStore の action のみで返す。 */
export function BattleResultPanel({ r, cursor, store }: { r: ResultView; cursor: number; store: HudStore }) {
  const [xpW, setXpW] = useState(r.xpFrom);
  useEffect(() => {
    const id = setTimeout(() => setXpW(r.xpTo), 350);
    return () => clearTimeout(id);
  }, [r]);
  const title =
    r.kind === 'victory'
      ? t('battle.resultWin')
      : r.kind === 'defeat'
        ? t('battle.resultLose')
        : r.kind === 'fled'
          ? t('battle.resultFled')
          : t('battle.resultRecruited');
  return (
    <div class="nq-result-wrap">
      <div class={`nq-win nq-result nq-result-${r.kind}`} role="dialog" aria-label={title}>
        {r.kind === 'defeat' ? (
          <div class="nq-result-heart">
            <span class="nq-heart nq-heart-broken">♥</span>
          </div>
        ) : null}
        <h2 class="nq-result-title">
          {r.kind === 'victory' && <PixelIcon name="star" scale={4} />}
          {title}
          {r.kind === 'victory' && <PixelIcon name="star" scale={4} />}
        </h2>
        {r.kind === 'victory' && r.bonus > 1 && (
          <p class="nq-result-bonus">
            {t('battle.rewardBonus', { n: r.maxCombo, m: Math.round(r.bonus * 100) / 100 })}
          </p>
        )}
        {r.kind === 'victory' && (
          <dl class="nq-result-list">
            <dt>
              <PixelIcon name="star" scale={3} />
              {t('battle.gotXp')}
            </dt>
            <dd>+{r.xp}</dd>
            <dt class="nq-result-xpbar">
              <Bar value={xpW} max={1} />
            </dt>
            <dd class="nq-result-need">{t('battle.nextLevel', { n: r.needNext })}</dd>
            <dt>
              <PixelIcon name="coin" scale={3} />
              {t('battle.gotGold')}
            </dt>
            <dd>+{r.gold}G</dd>
            <dt>
              <PixelIcon name="chest" scale={3} />
              {t('battle.gotItems')}
            </dt>
            <dd>
              {r.drops.length === 0
                ? t('battle.none')
                : r.drops.map((drop) => (
                    <span class="nq-result-drop" key={drop.name}>
                      {drop.icon && <img class="nq-item-icon" src={drop.icon} alt="" />}
                      <RubyLabel text={drop.name} /> {t('battle.itemCount', { n: drop.count })}
                    </span>
                  ))}
            </dd>
          </dl>
        )}
        {r.kind === 'defeat' && (
          <p class="nq-result-body">
            {r.goldLost > 0 && (
              <>
                {t('battle.goldLost', { n: r.goldLost })}
                <br />
              </>
            )}
            {t('battle.restAtInn')}
          </p>
        )}
        {r.recruitName ? (
          <div class="nq-result-recruit">
            <p>
              <RubyLabel text={t('battle.recruitOffer', { name: r.recruitName })} />
              <br />
              {t('battle.recruitAsk')}
            </p>
            <div class="nq-result-btns">
              {[true, false].map((yes, index) => (
                <button
                  key={String(yes)}
                  type="button"
                  class={`nq-cmd ${cursor === index ? 'nq-focus' : ''}`}
                  onPointerEnter={() => store.set({ cursor: index })}
                  onClick={() => {
                    playSfx('select');
                    store.dispatch({ t: 'recruitAnswer', yes });
                  }}
                >
                  <Cursor on={cursor === index} />
                  {t(yes ? 'battle.yes' : 'battle.no')}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div class="nq-result-btns">
            <button
              type="button"
              class="nq-cmd nq-focus"
              data-result-close
              onClick={() => {
                playSfx('select');
                store.dispatch({ t: 'resultClose' });
              }}
            >
              <Cursor on />
              {t('battle.continue')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
