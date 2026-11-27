import type { Element, Stats } from '../../core/content/schemas';
import type { BagCell } from './bagLayout';

export interface BagThing {
  /** 'hero' / 'mon:<uid>' / 'eq:<部位>'（バッグの そうび）/ 'inv:<itemId>'（あずけている そうび） */
  key: string;
  kind: 'hero' | 'monster' | 'equip' | 'item';
  /** 名前（RubyText） */
  name: string;
  /** マス・リストの 小さな 絵（data URL） */
  icon: string | null;
  /** 右の 大きな 絵（data URL）。無ければ icon */
  art: string | null;
  /** つかう マスの数（主人公は 0） */
  cost: number;
  /** 2Dバッグ上の大きさ */
  size?: { w: number; h: number };
  inBag: boolean;
  /** 主人公を含む最大8体の戦闘編成に入っている */
  roster?: boolean;
  /** バトルで さいしょに出る 仲間 */
  leader?: boolean;
  level?: number;
  element?: Element;
  /** あずけている そうびの こすう */
  count?: number;
  stats?: Stats;
  hp?: number;
  experience?: { current: number; total: number; capped: boolean };
  /** 名前の下（そうびの 部位 など） */
  sub?: string;
  lines?: string[];
  effects?: { label: string; value?: string }[];
  skills?: { name: string; gauge: number; scan: boolean }[];
  blurb?: string;
  action?: 'pack';
  /** 入れる操作を実行できない理由（RubyText）。 */
  blockedReason?: string;
  /** フィールドで回復アイテムを使ったとき、いま効果があるか。 */
  usable?: boolean;
  growth?: {
    canUnlock: boolean;
    levelCap: number;
    maximum: number;
    materials?: { name: string; have: number; need: number }[];
  };
  /** しんかできる仲間なら、しんか先と条件。room＝バッグに 入りきるか（extra マス ふえる） */
  evolve?: {
    toName: string;
    itemName: string;
    need: number;
    have: number;
    ok: boolean;
    room: boolean;
    extra: number;
  } | null;
}

export interface BagOverlayProps {
  hero: BagThing;
  /** バッグの 中身（仲間 → そうび。マスの じゅん） */
  inBag: BagThing[];
  /** あずけている 仲間・そうび */
  outside: BagThing[];
  cells: BagCell[];
  cols: number;
  rows: number;
  used: number;
  capacity: number;
  /** マスより 多く 入っている（マスが できる前の セーブ） */
  over: boolean;
  /** つぎに マスが ふえる レベル（もう ふえないなら null） */
  nextLevel: number | null;
  /** さっき えらんでいた もの（いれる・だす・しんかの あとも 同じ ものを えらんだまま） */
  focusKey?: string;
  message: string | null;
  /** しんかした 直後（絵を 光らせる） */
  flashKey?: string;
  onToggle: (key: string, position?: { x: number; y: number }) => void;
  onUse: (key: string) => void;
  onLeader: (key: string) => void;
  onEvolve: (key: string) => void;
  onGrow: (key: string) => void;
  onMove: (key: string, x: number, y: number) => void;
  onRosterRemove: (key: string) => void;
  onClose: () => void;
}
