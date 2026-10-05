/**
 * バトルの型（ターン制。GDD §4）。
 * 1 ターン ＝ 主人公 → オトモ（前に 立つ 仲間）→ てき の じゅんで 1 回ずつ 動く。
 * 仕様のデータモデルとの対応：
 *  - PlayerState     … 主人公の Combatant（ally.hero：hp / maxHp = stats.hp / mp / maxMp = stats.mp / stats）＋ BattleState.player。
 *                      stats の名前は content とそろえて atk = attack・def = defense・spd = speed・wis = intelligence
 *  - EnemyUnit       … BattleState.enemy（element・weakness・skipTurns）
 *  - Companion       … BattleState.companion（出撃中の仲間モンスター＝オトモ）
 *  - SkillDefinition … content の Skill（subject・costGauge・power・targetType・effect = effectType・flavor = description）
 *  - ActionResult    … 問題の成績。ロジックは score だけを使う（docs/01 §3.3）
 */
import type { Element, Skill, Stats, Subject } from '../content/schemas';

/** ぼうぎょ などの 上げ下げ（倍率と のこりターン数） */
export interface Buff {
  mult: number;
  turns: number;
}

export interface Combatant {
  id: string; // インスタンス id（"hero" / monster instance id）
  refId: string; // monsters の id。主人公は "hero"
  name: string;
  isHero: boolean;
  level: number;
  element: Element;
  /** 地方限定モンスターが得意とする教科。未指定時は技から推定する。 */
  subjectAffinity?: Subject;
  weakness?: Element;
  weaknessRevealed: boolean;
  stats: Stats; // 装備込みの実効値
  hp: number;
  mp: number;
  skills: string[];
  buffs: { def?: Buff; atk?: Buff };
  isBoss: boolean;
  phaseIndex: number; // bossPhases の何番目まで適用済みか（-1 = 初期）
  /** content に のこって いる 値。ターン制では つかわない（だれでも 1 ターン 1 回） */
  actionsPerTurn: number;
  /** 属性わざ倍率（セット装備ボーナス）。key = element */
  elementBoost?: Partial<Record<Element, number>>;
}

/** 敵ユニット */
export interface EnemyUnit extends Combatant {
  /** 「うごきを とめる」で 休む ターンの のこり（1 いじょうなら その ターンは 動かない） */
  skipTurns: number;
}

export interface Party {
  hero: Combatant;
  monsters: Combatant[]; // 控え含む
  activeMonsterIndex: number; // 出撃中
  items: Record<string, number>;
}

/** 教科ごとの ゲージ（0 〜 settings.subjectGauge.max） */
export type SubjectGauges = Record<Subject, number>;

/** プレイヤー（主人公）の バトル中の 状態。hp・stats は ally.hero */
export interface PlayerState {
  subjectGauges: SubjectGauges;
  /** いまの 連続成功数（Streak） */
  comboCount: number;
  /** この バトルで いちばん 長かった 連続成功数（けいけんち・おかねの ボーナス） */
  maxCombo: number;
}

/** オトモ（出撃中の 仲間モンスター）。主人公の あとに 1 回 自動で 動く */
export interface Companion {
  /** ally.monsters の Combatant.id */
  id: string;
  name: string;
  /** パッシブ：この 教科の ゲージが たまりやすい */
  passiveSkill: { kind: 'gaugeBoost'; subject: Subject; mult: number } | null;
  /** 自動で 使う わざ（skills の id）。null なら ふつうの こうげき */
  activeSkill: string | null;
}

export type TargetType = NonNullable<Skill['targetType']>;

/** 問題（行動）の 成績。score 0.0〜1.0 */
export interface ActionResult {
  score: number;
  timeMs: number;
  attempts: number;
}

export type Command =
  | { kind: 'attack' }
  /** 必殺技（effect が scan なら しらべる）。actorId を わたすと オトモが 使う（省略時は 主人公） */
  | { kind: 'skill'; skillId: string; result: ActionResult; actorId?: string }
  | { kind: 'item'; itemId: string }
  | { kind: 'swap'; monsterIndex: number }
  | { kind: 'recruit'; result: ActionResult }
  | { kind: 'flee' }
  /** 主人公が たおれて いる ときなど、主人公は 動かずに ターンを すすめる */
  | { kind: 'wait' };

export type Side = 'ally' | 'enemy';

export interface BattleState {
  /** いまの ターン（1 から） */
  turn: number;
  ally: Party;
  enemy: EnemyUnit;
  player: PlayerState;
  companion: Companion | null;
  rngState: unknown;
  seed: string;
  outcome: 'ongoing' | 'victory' | 'defeat' | 'fled' | 'recruited';
  isBossBattle: boolean;
  /** 開発者モードのとき true：ボス戦でも にげられる（ふだんの ボス戦は にげられない） */
  canFleeBoss?: boolean;
  log: BattleEvent[];
}

export type ScoreBandName = 'perfect' | 'good' | 'weak' | 'miss';

export type BattleEvent =
  /** ターンの はじまり（主人公が 動く 前） */
  | { t: 'turnStart'; turn: number }
  /** auto = オトモの 自動こうげき */
  | {
      t: 'act';
      side: Side;
      actorId: string;
      command: 'attack' | 'skill' | 'scan' | 'defend';
      skillId?: string;
      auto?: boolean;
    }
  | {
      t: 'damage';
      side: Side;
      targetId: string;
      amount: number;
      /** かいしんの いちげき（コンボで 確率が 上がる） */
      critical: boolean;
      elementMult: number;
      weakness: boolean;
      /** 問題の できばえ（CRITICAL / GREAT / GOOD / MISS）。問題の ない こうげきは null */
      scoreBand: ScoreBandName | null;
      comboMult: number;
    }
  | { t: 'heal'; side: Side; targetId: string; amount: number }
  | { t: 'buff'; side: Side; targetId: string; stat: 'def' | 'atk'; mult: number; turns: number }
  /** 敵の うごきを とめた（turns ターン 休む） */
  | { t: 'status'; targetId: string; turns: number }
  /** 休んで いて 動けなかった */
  | { t: 'skipTurn'; targetId: string; remain: number }
  | { t: 'weaknessRevealed'; targetId: string; element: Element }
  | { t: 'scanFailed'; targetId: string }
  /** れんぞく せいかい（2 いじょう） */
  | { t: 'combo'; count: number; bonus: number }
  /** 教科ゲージが たまった。unlocked = この チャージで 打てるように なった 必殺技 */
  | {
      t: 'gaugeCharge';
      subject: Subject;
      amount: number;
      value: number;
      max: number;
      boosted: boolean;
      unlocked: string[];
    }
  | { t: 'gaugeUse'; subject: Subject; amount: number; value: number }
  /** 教科ゲージが たりなくて 打てない（ターンは すすまない） */
  | { t: 'gaugeShort'; subject: Subject; need: number; have: number }
  | { t: 'itemUsed'; itemId: string; targetId: string }
  /** auto = オトモが たおれて、次の 仲間が 自動で 前に 出た */
  | { t: 'swap'; from: string; to: string; auto?: boolean }
  | { t: 'recruitAttempt'; targetId: string; success: boolean; chance: number }
  | { t: 'fleeAttempt'; success: boolean; chance: number }
  | { t: 'ko'; side: Side; targetId: string }
  | { t: 'bossPhase'; phaseIndex: number; line?: string }
  /** xp・gold は コンボ ボーナス（bonus 倍）込み */
  | {
      t: 'victory';
      xp: number;
      gold: number;
      drops: string[];
      recruitOffer: boolean;
      bonus: number;
      maxCombo: number;
    }
  | { t: 'defeat' }
  | { t: 'fled' }
  | { t: 'recruited'; monsterId: string };
