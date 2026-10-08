/**
 * フィールドメニューの表示契約。
 * Scene が表示データを作り、UI が描画するための中立な境界に置く。
 */
export type MenuTab = 'roadmap' | 'mistakes' | 'monsters' | 'specialties' | 'bag' | 'equip';
export type MenuHomeKey = MenuTab | 'party';

export interface RoadmapNode {
  id: string;
  name: string;
  subject: string;
  subjectLabel: string;
  grade: number;
  mastery: number;
  attempts: number;
  state: 'cleared' | 'current' | 'open' | 'locked';
}

export interface MenuEntry {
  key: string;
  name: string;
  group?: string;
  groupLabel?: string;
  icon?: string;
  art?: string;
  /** バッグ内で占有するマスの形。 */
  bagSize?: { w: number; h: number };
  known: boolean;
  right?: string;
  detailIndex?: string;
  tag?: string;
  sub?: string;
  lines: string[];
  blurb?: string;
  action?: { label: string; ok: boolean } | null;
}
