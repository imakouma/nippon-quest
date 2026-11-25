import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';
import { useModalFocus } from '../useModalFocus';
import type { HudStore, ResultView } from './store';

function Bar({ value, max, label, text }: { value: number; max: number; label: string; text: string }) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div
      class="nq-bar nq-bar-xp"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuenow={value}
      aria-valuemax={max}
      aria-valuetext={label}
    >
      <i class="nq-fill-xp" style={{ width: `${ratio * 100}%` }} />
      <span class="nq-bar-value" aria-hidden="true">
        {text}
      </span>
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
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocus(dialogRef, 'button');
  useEffect(() => {
    const id = setTimeout(() => setXpW(r.xpTo), 350);
    return () => clearTimeout(id);
  }, [r]);
  useEffect(() => {
    if (!r.recruitPhase || !r.recruitName) return;
    const frame = requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>('button.nq-focus')?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [cursor, r.recruitName, r.recruitPhase]);
  const title =
    r.kind === 'victory'
      ? t('battle.resultWin')
      : r.kind === 'defeat'
        ? t('battle.resultLose')
        : r.kind === 'fled'
          ? t('battle.resultFled')
          : t('battle.resultRecruited');
  if (r.recruitPhase && r.recruitName) {
    return (
      <div class="nq-result-wrap nq-recruit-wrap">
        <div
          ref={dialogRef}
          class="nq-win nq-recruit-scene"
          role="dialog"
          aria-modal="true"
          aria-label={displayText(t('battle.recruitSceneTitle'))}
        >
          <h2 class="nq-recruit-title">
            <PixelIcon name="star" scale={3} />
            {t('battle.recruitSceneTitle')}
            <PixelIcon name="star" scale={3} />
          </h2>
          <div class="nq-recruit-stage" aria-hidden="true">
            <i class="nq-recruit-glow" />
            <i class="nq-recruit-spark nq-recruit-spark-a">✦</i>
            <i class="nq-recruit-spark nq-recruit-spark-b">◆</i>
            <i class="nq-recruit-spark nq-recruit-spark-c">✦</i>
            {r.recruitArt && <img src={r.recruitArt} alt="" />}
          </div>
          <p class="nq-recruit-message">
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
                onFocus={() => cursor !== index && store.set({ cursor: index })}
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
      </div>
    );
  }
  return (
    <div class="nq-result-wrap">
      <div
        ref={dialogRef}
        class={`nq-win nq-result nq-result-${r.kind}`}
        role="dialog"
        aria-modal="true"
        aria-label={displayText(title)}
      >
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
        {r.kind === 'victory' && (
          <dl class="nq-result-list">
            <dt>
              <PixelIcon name="star" scale={3} />
              {t('battle.gotXp')}
            </dt>
            <dd>+{r.xp}</dd>
            <dt class="nq-result-xpbar">
              <span class="nq-result-level">{t('battle.resultLevel', { lv: r.level ?? 1 })}</span>
              <Bar
                value={xpW}
                max={1}
                label={
                  r.levelXpNeeded === undefined
                    ? t('battle.savedXp', { n: r.levelXp ?? 0 })
                    : t('battle.levelXp', { n: r.levelXp ?? 0, total: r.levelXpNeeded })
                }
                text={
                  r.levelXpNeeded === undefined
                    ? String(r.levelXp ?? 0)
                    : `${r.levelXp ?? 0}/${r.levelXpNeeded}`
                }
              />
            </dt>
            <dd class="nq-result-need">
              {r.levelXpNeeded === undefined
                ? t('battle.levelCapReached')
                : t('battle.nextLevel', { n: r.needNext })}
            </dd>
            <dt>
              <PixelIcon name="coin" scale={3} />
              {t('battle.gotGold')}
            </dt>
            <dd>+{r.gold}G</dd>
            <dt class="nq-result-drops-heading">
              <PixelIcon name="chest" scale={3} />
              {t('battle.gotItems')}
            </dt>
            <dd class="nq-result-drops">
              {r.drops.length === 0
                ? t('battle.none')
                : r.drops.map((drop) => (
                    <span class="nq-result-drop" key={drop.name}>
                      {drop.icon && <img class="nq-item-icon" src={drop.icon} alt="" />}
                      <RubyLabel class="nq-result-drop-name" text={drop.name} />
                      <span class="nq-result-drop-count">{t('battle.itemCount', { n: drop.count })}</span>
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
      </div>
    </div>
  );
}
