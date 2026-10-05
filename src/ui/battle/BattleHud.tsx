/**
 * バトル画面の DOM オーバーレイ（リアルタイム・コマンドゲージバトル）。サイドビュー（敵が左・味方が右）の SFC 風 RPG：
 *  - 上：左に「てき」、右に「なかま」の窓（名前・Lv・HP ゲージ。味方は その下に 時間の ゲージ）
 *  - 敵の 足もと：こうげきタイマー（たまると こうげきして くる。もうすぐなら 赤く 点めつ）
 *  - 右：教科ゲージ（こたえると たまり、ゲージを 使う 必殺技で へる）
 *  - 下：メッセージ窓、コマンドは下の左に 3 列 × 2 段（上の 段に コマンドゲージ）。わざ・どうぐ・いれかえは下から大きな窓
 *  - 問題の あいだは 問題の 枠の 見出しに 敵の こうげきタイマーと HP（問題中も 敵は うごく）
 * 窓は黒＋白い太枠、文字は PixelMplus12（12 / 24 / 36 / 48px）。
 * ロジックは持たない。HudStore を読んで描き、操作は store.dispatch() で Battle シーンへ返す。
 */
import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { ElementChip, SubjectChip } from '../chips';
import { t } from '../i18n';
import { createSpeaker } from '../overlay';
import { PixelIcon } from '../PixelIcon';
import { QuestionFrame } from '../QuestionFrame';
import { RubyLabel } from '../RubyLabel';
import { stripRuby } from '../ruby';
import { playSfx } from '../sfx';
import { TypedText, useTypewriter } from '../typewriter';
import {
  useHud,
  type AllyView,
  type BannerView,
  type EnemyView,
  type HudState,
  type HudStore,
  type PopupView,
  type ResultView,
  type SkillOption,
  type SubjectGaugeView,
} from './store';
import './battle.css';

const speak = createSpeaker();

/** auto メッセージを読み終えてから次へ進むまで */
const AUTO_ADVANCE_MS = 1100;
/** わざ・どうぐ・いれかえ の窓は 2 列、コマンドの窓は 3 列 */
const COLS = 2;
const CMD_COLS = 3;

const EFFECT_HINT = {
  damage: 'battle.powerUpHint',
  scan: 'battle.scanHint',
  heal: 'battle.healHint',
  buff: 'battle.buffHint',
  debuff: 'battle.debuffHint',
  status: 'battle.statusHint',
} as const;

type BarKind = 'hp' | 'mp' | 'xp' | 'cmd' | 'time';

function Bar({ value, max, kind }: { value: number; max: number; kind: BarKind }) {
  const r = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const tone = kind !== 'hp' ? kind : r > 0.5 ? 'hp' : r > 0.2 ? 'hp-mid' : 'hp-low';
  return (
    <div class={`nq-bar nq-bar-${kind}`} role="meter" aria-valuenow={value} aria-valuemax={max}>
      <i class={`nq-fill-${tone}`} style={{ width: `${r * 100}%` }} />
    </div>
  );
}

function Heart({ broken = false }: { broken?: boolean }) {
  return (
    <span class={`nq-heart ${broken ? 'nq-heart-broken' : ''}`} aria-hidden="true">
      ♥
    </span>
  );
}

/** いまの ターン（ターン制の 目じるし） */
function TurnBadge({ turn, class: cls }: { turn: number; class: string }) {
  return <span class={`nq-turn ${cls}`}>{t('battle.turn', { n: turn })}</span>;
}

function EnemyWindow({ e }: { e: EnemyView }) {
  return (
    <div class={`nq-win nq-foe ${e.isBoss ? 'nq-foe-boss' : ''}`}>
      <div class="nq-foe-row">
        <span class="nq-tag">{t('battle.enemies')}</span>
        {e.isBoss && (
          <span class="nq-boss-tag">
            <PixelIcon name="boss" scale={2} />
            {t('battle.boss')}
          </span>
        )}
        <span class="nq-lv">
          {t('battle.lv')}
          {e.level}
        </span>
      </div>
      <RubyLabel text={e.name} class="nq-foe-name" />
      <Bar value={e.hp} max={e.maxHp} kind="hp" />
      <div class="nq-foe-row">
        <ElementChip el={e.element} />
        {e.weakness && e.weaknessRevealed ? (
          <span class={`nq-chip nq-el-${e.weakness} nq-weak-open`}>
            {t('battle.weakness')}
            <PixelIcon name={`el-${e.weakness}`} scale={2} />
            {t(`elements.${e.weakness}`)}
          </span>
        ) : (
          <span class="nq-chip nq-weak">{t('battle.weaknessUnknown')}</span>
        )}
        {e.defMult !== 1 && (
          <span class="nq-chip nq-def">
            {t('battle.defMark')}
            {e.defMult > 1 ? '▲' : '▼'}
          </span>
        )}
      </div>
    </div>
  );
}

function AllyRow({ a, active }: { a: AllyView; active: boolean }) {
  const down = a.hp <= 0;
  return (
    <div class={`nq-ally ${active ? 'nq-ally-active' : ''} ${down ? 'nq-ally-down' : ''}`}>
      <span class="nq-ally-cur" aria-hidden="true">
        {active ? '▶' : ''}
      </span>
      <PixelIcon name={a.isHero ? 'hero' : `el-${a.element}`} scale={2} />
      <RubyLabel text={a.name} class="nq-ally-name" />
      <span class="nq-ally-lv">
        {t('battle.lv')}
        {a.level}
      </span>
      {down ? (
        <span class="nq-down">{t('battle.fainted')}</span>
      ) : (
        <>
          <span class="nq-lbl">{t('battle.hp')}</span>
          <span class="nq-ally-bars">
            <Bar value={a.hp} max={a.maxHp} kind="hp" />
          </span>
        </>
      )}
      <span class="nq-num">
        {a.hp}/{a.maxHp}
      </span>
      {a.passive && (
        <span class="nq-ally-passive">
          <PixelIcon name={`subj-${a.passive}`} scale={2} />
        </span>
      )}
      {a.defMult > 1 && <span class="nq-chip nq-def">{t('battle.defMark')}▲</span>}
    </div>
  );
}

/** 教科ゲージ（右の 窓）。こたえると たまり、目もりまで たまると ゲージを 使う 必殺技が 打てる */
function GaugeColumn({ list }: { list: SubjectGaugeView[] }) {
  return (
    <div class="nq-win nq-sgauge">
      <span class="nq-sgauge-title">{t('battle.gauge')}</span>
      {list.map((g) => (
        <div
          key={g.subject}
          class={`nq-sg ${g.value >= g.max ? 'nq-sg-full' : ''} ${g.boosted ? 'nq-sg-boost' : ''}`}
          role="meter"
          aria-label={t(`subjects.${g.subject}`)}
          aria-valuenow={g.value}
          aria-valuemax={g.max}
        >
          <PixelIcon name={`subj-${g.subject}`} scale={2} />
          <span class="nq-sg-bar">
            <i class={`nq-subj-${g.subject}`} style={{ width: `${(g.value / g.max) * 100}%` }} />
            {g.marks.map((m) => (
              <b key={m} class="nq-sg-mark" style={{ left: `${(m / g.max) * 100}%` }} />
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

/** れんぞく せいかい（2 いじょう）。いりょくの 上乗せも 出す */
function ComboBadge({ c }: { c: HudState['combo'] }) {
  return (
    <div key={c.count} class="nq-combo">
      <span class="nq-combo-n">{t('battle.comboBadge', { n: c.count })}</span>
      <span class="nq-combo-p">{t('battle.comboPower', { p: c.percent })}</span>
    </div>
  );
}

interface Option {
  key: string;
  disabled: boolean;
  action: () => void;
}

function menuOptions(s: HudState, store: HudStore): Option[] {
  switch (s.menu) {
    case 'commands':
      return s.commands.map((c) => ({
        key: c.kind,
        disabled: c.disabled,
        action: () => store.dispatch({ t: 'command', kind: c.kind }),
      }));
    case 'skills':
      return s.skills.map((k) => ({
        key: k.key,
        disabled: k.disabled,
        action: () => store.dispatch({ t: 'skill', key: k.key }),
      }));
    case 'items':
      return s.items.map((it) => ({
        key: it.id,
        disabled: it.count <= 0,
        action: () => store.dispatch({ t: 'item', id: it.id }),
      }));
    case 'swap':
      return s.swaps.map((w) => ({
        key: String(w.index),
        disabled: w.disabled,
        action: () => store.dispatch({ t: 'swap', index: w.index }),
      }));
    case 'none':
      return [];
  }
}

function pick(o: Option | undefined): void {
  if (!o) return;
  if (o.disabled) {
    playSfx('miss');
    return;
  }
  playSfx('select');
  o.action();
}

function Cursor({ on }: { on: boolean }) {
  return <span class="nq-cur">{on ? <Heart /> : null}</span>;
}

/** コマンド窓（3 列 × 2 段）。下のメッセージ窓の左に出る */
function CommandWindow({ s, store }: { s: HudState; store: HudStore }) {
  return (
    <div class="nq-win nq-cmdwin" role="menu">
      {s.commands.map((c, i) => {
        const focused = s.cursor === i;
        return (
          <button
            key={c.kind}
            type="button"
            role="menuitem"
            class={`nq-cmd ${focused ? 'nq-focus' : ''} ${c.glow ? 'nq-cmd-glow' : ''}`}
            aria-disabled={c.disabled}
            data-cmd={c.kind}
            onPointerEnter={() => s.cursor !== i && store.set({ cursor: i })}
            onClick={() =>
              pick({
                key: c.kind,
                disabled: c.disabled,
                action: () => store.dispatch({ t: 'command', kind: c.kind }),
              })
            }
          >
            <Cursor on={focused} />
            <PixelIcon name={`cmd-${c.kind}`} scale={2} />
            <RubyLabel text={t(`cmd.${c.kind}`)} class={`nq-cmd-name ${c.disabled ? 'nq-off' : ''}`} />
          </button>
        );
      })}
    </div>
  );
}

function MenuHead({
  icon,
  title,
  store,
  extra,
}: {
  icon: string;
  title: string;
  store: HudStore;
  extra?: JSX.Element;
}) {
  return (
    <div class="nq-menu-head">
      <span class="nq-menu-title">
        <PixelIcon name={icon} scale={3} />
        <RubyLabel text={title} />
      </span>
      {extra}
      <button
        type="button"
        class="nq-back"
        onClick={() => {
          playSfx('back');
          store.dispatch({ t: 'back' });
        }}
      >
        × {t('ui.back')}
      </button>
    </div>
  );
}

/** 必殺技に 使う 教科ゲージ（たまった ぶんを 教科の 色で） */
function GaugeCost({ k }: { k: SkillOption }) {
  const r = Math.min(1, k.have / k.cost);
  return (
    <span class={`nq-opt-cost ${r >= 1 ? 'nq-opt-cost-ok' : ''}`}>
      <span class="nq-opt-costbar">
        <i class={`nq-subj-${k.subject}`} style={{ width: `${r * 100}%` }} />
      </span>
      {k.cost}
    </span>
  );
}

function SkillList({ s, store }: { s: HudState; store: HudStore }) {
  const focus = s.skills[s.cursor];
  const subject = focus ? t(`subjects.${focus.subject}`) : '';
  return (
    <div class="nq-win nq-menu">
      <MenuHead
        icon="cmd-skill"
        title={t('cmd.skill')}
        store={store}
        extra={s.turn ? <TurnBadge turn={s.turn} class="nq-turn-head" /> : undefined}
      />
      <div class="nq-menu-grid">
        {s.skills.map((k, i) => (
          <button
            key={k.key}
            type="button"
            class={`nq-opt ${s.cursor === i ? 'nq-focus' : ''} ${k.disabled ? 'nq-opt-off' : ''}`}
            data-skill={k.id}
            data-actor={k.actorId}
            onPointerEnter={() => s.cursor !== i && store.set({ cursor: i })}
            onClick={() =>
              pick({
                key: k.key,
                disabled: k.disabled,
                action: () => store.dispatch({ t: 'skill', key: k.key }),
              })
            }
          >
            <Cursor on={s.cursor === i} />
            <SubjectChip subject={k.subject} />
            <RubyLabel text={k.name} class="nq-opt-name" />
            <span class="nq-opt-side">
              {k.reason ? (
                <span class="nq-opt-reason">{k.reason}</span>
              ) : (
                <>
                  <PixelIcon name={`el-${k.element}`} scale={2} />
                  {k.cost > 0 ? (
                    <GaugeCost k={k} />
                  ) : (
                    <span class="nq-opt-charge">{t('battle.gaugeCharge')}</span>
                  )}
                </>
              )}
            </span>
          </button>
        ))}
      </div>
      {focus && (
        <div class="nq-menu-foot nq-menu-foot-skill">
          <div class="nq-menu-foot-row">
            {focus.by && <RubyLabel text={t('battle.skillBy', { name: focus.by })} class="nq-opt-by" />}
            <RubyLabel text={focus.flavor ?? t(EFFECT_HINT[focus.effect])} />
            <span class="nq-menu-grade">
              <span class="nq-menu-stars">{'★'.repeat(focus.stars)}</span>
              {focus.gradeRange[0] === focus.gradeRange[1]
                ? t('battle.gradeOne', { a: focus.gradeRange[0] })
                : t('battle.gradeRange', { a: focus.gradeRange[0], b: focus.gradeRange[1] })}
            </span>
          </div>
          <span class="nq-menu-cost">
            {focus.cost > 0
              ? t('battle.costHint', { subject, n: focus.cost })
              : t('battle.chargeHint', { subject })}
          </span>
        </div>
      )}
    </div>
  );
}

function ItemList({ s, store }: { s: HudState; store: HudStore }) {
  const focus = s.items[s.cursor];
  return (
    <div class="nq-win nq-menu">
      <MenuHead icon="cmd-item" title={t('cmd.item')} store={store} />
      {s.items.length === 0 ? (
        <p class="nq-menu-empty">{t('battle.noItems')}</p>
      ) : (
        <div class="nq-menu-grid">
          {s.items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              class={`nq-opt ${s.cursor === i ? 'nq-focus' : ''}`}
              data-item={it.id}
              onPointerEnter={() => s.cursor !== i && store.set({ cursor: i })}
              onClick={() =>
                pick({
                  key: it.id,
                  disabled: it.count <= 0,
                  action: () => store.dispatch({ t: 'item', id: it.id }),
                })
              }
            >
              <Cursor on={s.cursor === i} />
              <img class="nq-item-icon" src={it.icon} alt="" />
              <RubyLabel text={it.name} class="nq-opt-name" />
              <span class="nq-opt-side">{t('battle.itemCount', { n: it.count })}</span>
            </button>
          ))}
        </div>
      )}
      {focus && (
        <div class="nq-menu-foot">
          <RubyLabel text={focus.blurb} />
        </div>
      )}
    </div>
  );
}

function SwapList({ s, store }: { s: HudState; store: HudStore }) {
  return (
    <div class="nq-win nq-menu">
      <MenuHead icon="cmd-swap" title={t('cmd.swap')} store={store} />
      {s.swaps.length === 0 ? (
        <p class="nq-menu-empty">{t('battle.noPartner')}</p>
      ) : (
        <div class="nq-menu-grid">
          {s.swaps.map((w, i) => (
            <button
              key={w.index}
              type="button"
              class={`nq-opt ${s.cursor === i ? 'nq-focus' : ''} ${w.disabled ? 'nq-opt-off' : ''}`}
              onPointerEnter={() => s.cursor !== i && store.set({ cursor: i })}
              onClick={() =>
                pick({
                  key: String(w.index),
                  disabled: w.disabled,
                  action: () => store.dispatch({ t: 'swap', index: w.index }),
                })
              }
            >
              <Cursor on={s.cursor === i} />
              <PixelIcon name={`el-${w.element}`} scale={2} />
              <RubyLabel text={w.name} class="nq-opt-name" />
              <span class="nq-opt-side nq-opt-swap">
                {w.passive && <PixelIcon name={`subj-${w.passive}`} scale={2} />}
                <span>
                  {t('battle.lv')}
                  {w.level}
                </span>
                <Bar value={w.hp} max={w.maxHp} kind="hp" />
                {w.active ? (
                  <span class="nq-opt-reason">{t('battle.active')}</span>
                ) : w.hp <= 0 ? (
                  <span class="nq-opt-reason">{t('battle.fainted')}</span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Banner({ b }: { b: BannerView }) {
  if (b.kind === 'skill')
    return (
      <div key={b.id} class="nq-banner">
        <div class="nq-win nq-banner-box">
          {b.subject && <SubjectChip subject={b.subject} />}
          <RubyLabel text={b.text} class="nq-banner-name" />
        </div>
        {b.sub && (
          <div class="nq-banner-sub">
            <RubyLabel text={b.sub} />
          </div>
        )}
      </div>
    );
  return (
    <div key={b.id} class={`nq-banner nq-band nq-band-${b.kind}`}>
      <div class="nq-band-text">
        {b.kind === 'perfect' && <PixelIcon name="star" scale={4} />}
        <RubyLabel text={b.text} />
        {b.kind === 'perfect' && <PixelIcon name="star" scale={4} />}
      </div>
      {b.sub && (
        <div class="nq-banner-sub">
          <RubyLabel text={b.sub} />
        </div>
      )}
    </div>
  );
}

function Popups({ list }: { list: PopupView[] }) {
  return (
    <>
      {list.map((p) => (
        <div key={p.id} class={`nq-pop nq-pop-${p.kind}`} style={{ left: `${p.x}px`, top: `${p.y}px` }}>
          {p.text}
        </div>
      ))}
    </>
  );
}

/** 問題の 枠の 見出しに 出す 帯：敵の HP・こうげきタイマー・前に 立つ 味方の HP・うけた ダメージ */
function QuestionStrip({ s }: { s: HudState }) {
  const front = s.allies.find((a) => a.front) ?? s.allies[0];
  return (
    <span key={s.shake} class={`nq-qstrip ${s.shake ? 'nq-qstrip-hit' : ''}`}>
      {s.enemy && (
        <span class="nq-qs-unit">
          <span class="nq-qs-lbl">{t('battle.enemies')}</span>
          <Bar value={s.enemy.hp} max={s.enemy.maxHp} kind="hp" />
        </span>
      )}
      {s.turn && <TurnBadge turn={s.turn} class="nq-turn-strip" />}
      {front && (
        <span class="nq-qs-unit">
          <PixelIcon name={front.isHero ? 'hero' : `el-${front.element}`} scale={2} />
          <Bar value={front.hp} max={front.maxHp} kind="hp" />
          <span class="nq-qs-num">{front.hp}</span>
        </span>
      )}
      {s.stripPops.map((p) => (
        <span key={p.id} class={`nq-qs-pop nq-qs-pop-${p.kind}`}>
          <RubyLabel text={p.text} />
        </span>
      ))}
    </span>
  );
}

// ───────────────────────── 結果画面 ─────────────────────────

function ResultPanel({ r, cursor, store }: { r: ResultView; cursor: number; store: HudStore }) {
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
            <Heart broken />
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
            <div class="nq-result-reward nq-result-reward-xp">
              <div class="nq-result-reward-head">
                <dt>
                  <PixelIcon name="star" scale={3} />
                  {t('battle.gotXp')}
                </dt>
                <dd class="nq-result-amount">+{r.xp}</dd>
              </div>
              <div class="nq-result-xp-progress">
                <Bar value={xpW} max={1} kind="xp" />
                <span class="nq-result-need">{t('battle.nextLevel', { n: r.needNext })}</span>
              </div>
            </div>
            <div class="nq-result-reward">
              <dt>
                <PixelIcon name="coin" scale={3} />
                {t('battle.gotGold')}
              </dt>
              <dd class="nq-result-amount">+{r.gold}G</dd>
            </div>
            <div class="nq-result-reward">
              <dt>
                <PixelIcon name="chest" scale={3} />
                {t('battle.gotItems')}
              </dt>
              <dd class="nq-result-items">
                {r.drops.length === 0
                  ? t('battle.none')
                  : r.drops.map((d) => (
                      <span class="nq-result-drop" key={d.name}>
                        {d.icon && <img class="nq-item-icon" src={d.icon} alt="" />}
                        <RubyLabel text={d.name} /> {t('battle.itemCount', { n: d.count })}
                      </span>
                    ))}
              </dd>
            </div>
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
              {[true, false].map((yes, i) => (
                <button
                  key={String(yes)}
                  type="button"
                  class={`nq-cmd ${cursor === i ? 'nq-focus' : ''}`}
                  onPointerEnter={() => store.set({ cursor: i })}
                  onClick={() => {
                    playSfx('select');
                    store.dispatch({ t: 'recruitAnswer', yes });
                  }}
                >
                  <Cursor on={cursor === i} />
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

// ───────────────────────── ルート ─────────────────────────

const KEY_DIR: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

export function BattleHud({ store }: { store: HudStore }) {
  const s = useHud(store);
  const tw = useTypewriter(s.message ? s.message.id : null, s.message?.text ?? '');
  const menuOpen = s.menu !== 'none';
  const waits = (m: HudState['message']) => !!m && m.mode !== 'prompt' && m.mode !== 'log';

  const advance = () => {
    const m = store.get().message;
    if (!m) return;
    if (!tw.done) {
      tw.complete();
      return;
    }
    if (waits(m)) store.dispatch({ t: 'advance', messageId: m.id });
  };

  // 読み終えた auto メッセージは少し待って自動で次へ
  useEffect(() => {
    const m = s.message;
    if (!m || !tw.done || m.mode !== 'auto') return;
    const id = setTimeout(() => store.dispatch({ t: 'advance', messageId: m.id }), AUTO_ADVANCE_MS);
    return () => clearTimeout(id);
  }, [tw.done, s.message?.id]);

  // キーボード：矢印で ♥ を動かす / Z・Enter・Space で決定 / X・Esc で もどる
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cur = store.get();
      if (cur.question) return; // 問題中はレンダラーにまかせる
      const k = e.key;
      const ok = k === 'Enter' || k === 'z' || k === 'Z' || k === ' ';
      const back = k === 'Escape' || k === 'x' || k === 'X' || k === 'Backspace';
      const dir = KEY_DIR[k];
      if (!ok && !back && !dir) return;
      e.preventDefault();
      if (cur.result) {
        if (cur.result.recruitName) {
          if (dir && dir[0] !== 0) {
            playSfx('move');
            store.set({ cursor: cur.cursor === 0 ? 1 : 0 });
          } else if (ok) {
            playSfx('select');
            store.dispatch({ t: 'recruitAnswer', yes: cur.cursor === 0 });
          }
        } else if (ok) {
          playSfx('select');
          store.dispatch({ t: 'resultClose' });
        }
        return;
      }
      if (cur.menu !== 'none') {
        const opts = menuOptions(cur, store);
        if (dir && opts.length) {
          const next = Math.max(
            0,
            Math.min(
              opts.length - 1,
              cur.cursor + dir[0] + dir[1] * (cur.menu === 'commands' ? CMD_COLS : COLS),
            ),
          );
          if (next !== cur.cursor) {
            playSfx('move');
            store.set({ cursor: next });
          }
        } else if (ok) pick(opts[cur.cursor]);
        else if (back && cur.menu !== 'commands') {
          playSfx('back');
          store.dispatch({ t: 'back' });
        }
        return;
      }
      if (ok) advanceRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store]);

  const onStageClick = (e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (!menuOpen && !s.result && !s.question) advance();
  };

  const bigMenu = s.menu === 'skills' || s.menu === 'items' || s.menu === 'swap';

  return (
    <div class="nq-battle" onClick={onStageClick}>
      {s.message && (
        <div
          class={`nq-win nq-box ${s.menu === 'commands' ? 'nq-box-cmd' : ''}`}
          onClick={() => !bigMenu && advance()}
        >
          <p class="nq-box-text">
            <span class="nq-box-star" aria-hidden="true">
              ＊
            </span>
            <TypedText text={s.message.text} n={tw.n} />
          </p>
          <button
            type="button"
            class="nq-box-speak"
            aria-label={t('ui.speak')}
            onClick={(e) => {
              e.stopPropagation();
              speak(stripRuby(s.message!.text, 'kana'));
            }}
          >
            <PixelIcon name="speaker" scale={3} />
          </button>
          {tw.done && waits(s.message) && (
            <span class="nq-box-next" aria-label={t('battle.tapToAdvance')}>
              ▼
            </span>
          )}
        </div>
      )}

      {s.turn && !s.question && <TurnBadge turn={s.turn} class="nq-turn-stage" />}
      {s.gauges.length > 0 && !s.result && <GaugeColumn list={s.gauges} />}
      {s.combo.count >= 2 && !s.result && <ComboBadge c={s.combo} />}

      <Popups list={s.popups} />
      {s.banner && <Banner b={s.banner} />}

      <div class="nq-panel">
        {s.enemy && <EnemyWindow e={s.enemy} />}
        <div class="nq-win nq-party">
          {s.allies.map((a) => (
            <AllyRow key={a.id} a={a} active={s.actorId === a.id && menuOpen} />
          ))}
        </div>
      </div>

      {s.menu === 'commands' && <CommandWindow s={s} store={store} />}
      {s.menu === 'skills' && <SkillList s={s} store={store} />}
      {s.menu === 'items' && <ItemList s={s} store={store} />}
      {s.menu === 'swap' && <SwapList s={s} store={store} />}

      <button
        type="button"
        class={`nq-win nq-sound ${s.muted ? 'nq-sound-off' : ''}`}
        aria-label={t('battle.sound')}
        onClick={() => store.dispatch({ t: 'toggleSound' })}
      >
        <span class="nq-sound-glyph" aria-hidden="true">
          {s.muted ? '×' : '♪'}
        </span>
      </button>

      {s.question && (
        <QuestionFrame
          host={s.question.host}
          title={s.question.skillName}
          subject={s.question.subject}
          hint={s.question.hint}
          aside={<QuestionStrip s={s} />}
        />
      )}
      {s.question && s.shake > 0 && <div key={s.shake} class="nq-hitflash" aria-hidden="true" />}
      {s.result && <ResultPanel r={s.result} cursor={s.cursor} store={store} />}
    </div>
  );
}
