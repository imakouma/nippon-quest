/**
 * バトル画面の DOM オーバーレイ（リアルタイム・コマンドゲージバトル）。サイドビュー（敵が左・味方が右）の SFC 風 RPG：
 *  - 上：左に敵、右にメッセージ。下：左にコマンド、右に仲間の窓（名前・Lv・HP ゲージ）
 *  - 敵の 足もと：こうげきタイマー（たまると こうげきして くる。もうすぐなら 赤く 点めつ）
 *  - 下：コマンドの右、味方ステータスの左に教科ゲージ（こたえると たまり、必殺技で へる）
 *  - 下：メッセージ窓、コマンドは下の左に 2 列 × 2 段。わざ・どうぐ・いれかえは下から大きな窓
 *  - 問題の あいだは 問題の 枠の 見出しに 敵の こうげきタイマーと HP（問題中も 敵は うごく）
 * 窓は黒＋白い太枠、文字は PixelMplus12（12 / 24 / 36 / 48px）。
 * ロジックは持たない。HudStore を読んで描き、操作は store.dispatch() で Battle シーンへ返す。
 */
import type { JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { SubjectChip } from '../chips';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { QuestionFrame } from '../QuestionFrame';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';
import { TypedText, useTypewriter } from '../typewriter';
import {
  useHud,
  type BannerView,
  type HudState,
  type HudStore,
  type PopupView,
  type SkillOption,
} from './store';
import { BattleResultPanel } from './BattleResultPanel';
import { AllyRow, Bar, ComboBadge, EnemyWindow, GaugeColumn, TurnBadge } from './BattleStatus';
import { pickBattleHudOption, useBattleHudInput } from './useBattleHudInput';
import './battle.css';

/** auto メッセージを読み終えてから次へ進むまで */
const AUTO_ADVANCE_MS = 1100;

const EFFECT_HINT = {
  damage: 'battle.powerUpHint',
  scan: 'battle.scanHint',
  heal: 'battle.healHint',
  buff: 'battle.buffHint',
  debuff: 'battle.debuffHint',
  status: 'battle.statusHint',
} as const;

// ───────────────────────── 小さな部品 ─────────────────────────

function Heart({ broken = false }: { broken?: boolean }) {
  return (
    <span class={`nq-heart ${broken ? 'nq-heart-broken' : ''}`} aria-hidden="true">
      ♥
    </span>
  );
}

// ───────────────────────── メニュー ─────────────────────────

function Cursor({ on }: { on: boolean }) {
  return <span class="nq-cur">{on ? <Heart /> : null}</span>;
}

/** コマンド窓（2 列 × 2 段）。下のメッセージ窓の左に出る */
function CommandWindow({ s, store }: { s: HudState; store: HudStore }) {
  return (
    <div class="nq-cmdwin" role="menu" aria-label={t('battle.commandMenu')}>
      {s.commands.map((c, i) => {
        const focused = s.cursor === i;
        return (
          <button
            key={c.kind}
            type="button"
            role="menuitem"
            class={`nq-cmd ${focused ? 'nq-focus' : ''} ${c.glow ? 'nq-cmd-glow' : ''}`}
            aria-current={focused ? 'true' : undefined}
            aria-disabled={c.disabled}
            data-cmd={c.kind}
            onPointerEnter={() => s.cursor !== i && store.set({ cursor: i })}
            onClick={() =>
              pickBattleHudOption({
                key: c.kind,
                disabled: c.disabled,
                action: () => store.dispatch({ t: 'command', kind: c.kind }),
                onDisabled:
                  c.kind === 'item' || c.kind === 'swap'
                    ? () => store.dispatch({ t: 'command', kind: c.kind })
                    : undefined,
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
    <span
      class={`nq-opt-cost ${r >= 1 ? 'nq-opt-cost-ok' : ''}`}
      aria-label={t('battle.gaugeCostStatus', { have: k.have, cost: k.cost })}
    >
      <span class="nq-opt-costbar">
        <i class={`nq-subj-${k.subject}`} style={{ width: `${r * 100}%` }} />
      </span>
      <span class="nq-opt-cost-value" aria-hidden="true">
        {k.have}/{k.cost}
      </span>
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
      <div class="nq-menu-grid" role="group" aria-label={t('cmd.skill')}>
        {s.skills.map((k, i) => (
          <button
            key={k.key}
            type="button"
            class={`nq-opt ${s.cursor === i ? 'nq-focus' : ''} ${k.disabled ? 'nq-opt-off' : ''}`}
            aria-current={s.cursor === i ? 'true' : undefined}
            aria-disabled={k.disabled}
            data-skill={k.id}
            data-actor={k.actorId}
            onPointerEnter={() => s.cursor !== i && store.set({ cursor: i })}
            onClick={() =>
              pickBattleHudOption({
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
        <div class="nq-menu-grid" role="group" aria-label={t('cmd.item')}>
          {s.items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              class={`nq-opt ${s.cursor === i ? 'nq-focus' : ''}`}
              aria-current={s.cursor === i ? 'true' : undefined}
              aria-disabled={it.count <= 0}
              data-item={it.id}
              onPointerEnter={() => s.cursor !== i && store.set({ cursor: i })}
              onClick={() =>
                pickBattleHudOption({
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
        <div class="nq-menu-grid" role="group" aria-label={t('cmd.swap')}>
          {s.swaps.map((w, i) => (
            <button
              key={w.index}
              type="button"
              class={`nq-opt ${s.cursor === i ? 'nq-focus' : ''} ${w.disabled ? 'nq-opt-off' : ''}`}
              aria-current={s.cursor === i ? 'true' : undefined}
              aria-disabled={w.disabled}
              onPointerEnter={() => s.cursor !== i && store.set({ cursor: i })}
              onClick={() =>
                pickBattleHudOption({
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
                <Bar
                  value={w.hp}
                  max={w.maxHp}
                  kind="hp"
                  label={`${displayText(w.name)} ${t('battle.hp')}`}
                />
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

// ───────────────────────── 演出（わざの名前・できばえ・数字） ─────────────────────────

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
    <div
      key={b.id}
      class={`nq-banner nq-band nq-band-${b.kind}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
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
        <div
          key={p.id}
          class={`nq-pop nq-pop-${p.kind}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{ left: `${p.x}px`, top: `${p.y}px` }}
        >
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
          <Bar
            value={s.enemy.hp}
            max={s.enemy.maxHp}
            kind="hp"
            label={`${displayText(s.enemy.name)} ${t('battle.hp')}`}
          />
        </span>
      )}
      {s.turn && <TurnBadge turn={s.turn} class="nq-turn-strip" />}
      {front && (
        <span class="nq-qs-unit">
          <PixelIcon name={front.isHero ? 'hero' : `el-${front.element}`} scale={2} />
          <Bar
            value={front.hp}
            max={front.maxHp}
            kind="hp"
            label={`${displayText(front.name)} ${t('battle.hp')}`}
          />
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

// ───────────────────────── ルート ─────────────────────────

export function BattleHud({ store }: { store: HudStore }) {
  const s = useHud(store);
  const battleRef = useRef<HTMLDivElement>(null);
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

  useBattleHudInput(store, advance);

  // 見た目のカーソルだけでなく実フォーカスも同期し、矢印操作中の選択位置を
  // キーボード利用者と読み上げソフトへ確実に伝える。
  useEffect(() => {
    if (s.menu === 'none' || s.question || s.result) return;
    const frame = requestAnimationFrame(() => {
      battleRef.current?.querySelector<HTMLElement>('button.nq-focus')?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [s.cursor, s.menu, s.question, s.result]);

  const onStageClick = (e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (!menuOpen && !s.result && !s.question) advance();
  };

  const bigMenu = s.menu === 'skills' || s.menu === 'items' || s.menu === 'swap';

  return (
    <div ref={battleRef} class="nq-battle" onClick={onStageClick}>
      {s.message && s.menu !== 'commands' && (
        <div class="nq-win nq-box" onClick={() => !bigMenu && advance()}>
          <p class="nq-box-text">
            <span class="nq-box-star" aria-hidden="true">
              ＊
            </span>
            <TypedText text={s.message.text} n={tw.n} />
          </p>
          {tw.done && waits(s.message) && (
            <span class="nq-box-next" aria-label={t('battle.tapToAdvance')}>
              ▼
            </span>
          )}
        </div>
      )}

      {s.turn && !s.question && <TurnBadge turn={s.turn} class="nq-turn-stage" />}
      {s.combo.count >= 2 && !s.result && <ComboBadge c={s.combo} />}

      <Popups list={s.popups} />
      {s.banner && <Banner b={s.banner} />}

      <div class="nq-panel">{s.enemy && <EnemyWindow e={s.enemy} />}</div>
      <div class="nq-bottom-rail">
        <div class="nq-bottom-command-slot">
          {s.menu === 'commands' && <CommandWindow s={s} store={store} />}
        </div>
        {s.gauges.length > 0 && !s.result && <GaugeColumn list={s.gauges} />}
        <div class="nq-party">
          {s.allies.map((a) => (
            <AllyRow key={a.id} a={a} active={s.actorId === a.id && menuOpen} />
          ))}
        </div>
      </div>

      {s.menu === 'skills' && <SkillList s={s} store={store} />}
      {s.menu === 'items' && <ItemList s={s} store={store} />}
      {s.menu === 'swap' && <SwapList s={s} store={store} />}

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
      {s.result && (
        <BattleResultPanel
          key={`${s.result.kind}-${s.result.recruitPhase ? 'recruit' : 'summary'}`}
          r={s.result}
          cursor={s.cursor}
          store={store}
        />
      )}
    </div>
  );
}
