/**
 * バトル画面（DOM オーバーレイ）の表示状態。Battle シーンが書き込み、Preact コンポーネントが読む。
 * ユーザー操作は dispatch(UiAction) でシーンへ返す。
 * リアルタイム：敵の こうげきタイマー・コマンドゲージ・オトモの タイマーは 時間の 1 コマ（tick）ごとに 書きかわる。
 */
import { useEffect, useState } from 'preact/hooks';
import type { Element } from '../../core/content/schemas';

export type CommandKind = 'attack' | 'skill' | 'item' | 'swap' | 'flee' | 'recruit';
export type MenuKind = 'none' | 'commands' | 'skills' | 'items' | 'swap';

export interface EnemyView {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  element: Element;
  weakness?: Element;
  weaknessRevealed: boolean;
  isBoss: boolean;
  defMult: number;
}

export interface AllyView {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  element: Element;
  isHero: boolean;
  /** 次のレベルまでの進み具合 0〜1（主人公だけ） */
  xpRatio?: number;
  defMult: number;
  /** 前に 立って いる（敵に ねらわれる） */
  front: boolean;
  /** オトモの パッシブ（この 教科の ゲージが たまりやすい） */
  passive?: string;
}

/** 教科ゲージ（右の 窓）。こたえると たまり、必殺技で つかう */
export interface SubjectGaugeView {
  subject: string;
  value: number;
  max: number;
  /** この 教科の 必殺技に 要る 量（ゲージの 目もり） */
  marks: number[];
  /** オトモの 教科（たまりやすい） */
  boosted: boolean;
  /** たまった ときの「+n」（id が かわるたびに 出す） */
  gain?: { id: number; amount: number };
}

export interface CommandOption {
  kind: CommandKind;
  disabled: boolean;
  /** 「なかまにさそう」が使えるようになったときなどに光らせる */
  glow?: boolean;
}

export interface SkillOption {
  /** 一覧の 中で 一意（使う 味方の id ＋ わざの id） */
  key: string;
  id: string;
  /** 使う 味方の Combatant.id */
  actorId: string;
  /** オトモが 使う わざなら その 名前 */
  by?: string;
  name: string;
  subject: string;
  gradeRange: [number, number];
  element: Element;
  /** つよさ（★1〜★3） */
  stars: number;
  /** 使う 教科ゲージ（0 は 基本わざ＝こたえると たまる） */
  cost: number;
  /** いまの その教科の ゲージ */
  have: number;
  effect: 'damage' | 'heal' | 'buff' | 'debuff' | 'scan' | 'status';
  flavor?: string;
  disabled: boolean;
  /** 使えない理由（問題じゅんびちゅう）。ゲージ不足は ゲージの 絵で 見せる */
  reason?: string;
}

export interface ItemOption {
  id: string;
  name: string;
  count: number;
  blurb: string;
  /** どうぐの アイコン（data URL） */
  icon: string;
}

export interface SwapOption {
  index: number;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  element: Element;
  /** オトモに したときの パッシブの 教科 */
  passive?: string;
  disabled: boolean;
  active: boolean;
}

export interface MessageView {
  id: number;
  text: string;
  /**
   * auto = 読み終えたら自動で次へ / wait = タップ待ち / prompt = コマンド選択中の問いかけ /
   * log = たたかいの ようす（待たない。次の 文が きたら 入れかわる）
   */
  mode: 'auto' | 'wait' | 'prompt' | 'log';
}

export type BannerKind = 'perfect' | 'good' | 'weak' | 'miss' | 'combo' | 'skill' | 'phase';

export interface BannerView {
  id: number;
  kind: BannerKind;
  text: string;
  sub?: string;
  subject?: string;
}

export interface PopupView {
  id: number;
  x: number;
  y: number;
  text: string;
  kind: 'damage' | 'hurt' | 'crit' | 'heal' | 'info';
}

export interface QuestionView {
  /** ask() に渡す DOM。コンポーネントが問題フレームの中に差し込む */
  host: HTMLElement;
  skillName: string;
  subject: string;
  hint: string;
}

/** 問題の 枠の 上の 帯に 出す「-12」など（問題の あいだに おきた こと） */
export interface StripPopView {
  id: number;
  text: string;
  kind: 'hurt' | 'damage' | 'info';
}

export interface ResultView {
  kind: 'victory' | 'defeat' | 'fled' | 'recruited';
  xp: number;
  gold: number;
  /** てに いれた もの（icon は どうぐの アイコン） */
  drops: { name: string; count: number; icon?: string }[];
  xpFrom: number;
  xpTo: number;
  needNext: number;
  /** 勝利後の仲間化オファー（はい/いいえ） */
  recruitName?: string;
  recruitArt?: string;
  recruitPhase?: boolean;
  goldLost: number;
  /** れんぞく せいかいの ボーナス（けいけんち・おかねの 倍率）と いちばん 長かった コンボ */
  bonus: number;
  maxCombo: number;
}

export interface HudState {
  enemy: EnemyView | null;
  /** いまの ターン（1 から）。ターン制の 目じるし */
  turn: number | null;
  allies: AllyView[];
  actorId: string | null;
  message: MessageView | null;
  menu: MenuKind;
  cursor: number;
  commands: CommandOption[];
  skills: SkillOption[];
  items: ItemOption[];
  swaps: SwapOption[];
  gauges: SubjectGaugeView[];
  /** いまの れんぞく せいかい と いりょくの 上乗せ（%） */
  combo: { count: number; percent: number };
  banner: BannerView | null;
  popups: PopupView[];
  question: QuestionView | null;
  stripPops: StripPopView[];
  /** 問題の あいだに うけた こうげきの 回数（ふえるたびに 帯を ゆらして 赤く 光る） */
  shake: number;
  result: ResultView | null;
}

export type UiAction =
  | { t: 'command'; kind: CommandKind }
  | { t: 'skill'; key: string }
  | { t: 'item'; id: string }
  | { t: 'swap'; index: number }
  | { t: 'back' }
  | { t: 'advance'; messageId: number }
  | { t: 'recruitAnswer'; yes: boolean }
  | { t: 'resultClose' };

export const initialHudState = (): HudState => ({
  enemy: null,
  turn: null,
  allies: [],
  actorId: null,
  message: null,
  menu: 'none',
  cursor: 0,
  commands: [],
  skills: [],
  items: [],
  swaps: [],
  gauges: [],
  combo: { count: 0, percent: 0 },
  banner: null,
  popups: [],
  question: null,
  stripPops: [],
  shake: 0,
  result: null,
});

export class HudStore {
  private state: HudState = initialHudState();
  private readonly subs = new Set<() => void>();
  /** 演出係が差し込む。UI からの操作はすべてここを通る */
  onAction: ((a: UiAction) => void) | null = null;

  get(): HudState {
    return this.state;
  }

  set(patch: Partial<HudState> | ((s: HudState) => Partial<HudState>)): void {
    const p = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = { ...this.state, ...p };
    for (const fn of this.subs) fn();
  }

  subscribe(fn: () => void): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }

  dispatch(a: UiAction): void {
    this.onAction?.(a);
  }
}

export function useHud(store: HudStore): HudState {
  const [s, setS] = useState(store.get());
  useEffect(() => {
    setS(store.get());
    return store.subscribe(() => setS(store.get()));
  }, [store]);
  return s;
}
