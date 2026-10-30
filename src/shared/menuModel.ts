/**
 * フィールドメニューの表示契約。
 * Scene が表示データを作り、UI が描画するための中立な境界に置く。
 */
export type MenuTab = 'roadmap' | 'mistakes' | 'monsters' | 'specialties' | 'bag' | 'equip';
export type MenuHomeKey = MenuTab | 'party';
export type RoadmapSupportingKind = 'component' | 'transfer' | 'related' | 'chronological';
export type RoadmapPendingReason = 'due-review' | 'weak-prerequisite' | 'unseen-primary' | 'unseen-question';
export type RoadmapCompletedReason = 'review' | 'diagnosis';

export interface RoadmapNode {
  id: string;
  name: string;
  subject: string;
  subjectLabel: string;
  grade: number;
  /** 学校ごとの差を許容した、おすすめの学習時期。variable は学年を通して扱う。 */
  recommendedTerms?: readonly (1 | 2 | 3 | 'variable')[];
  courseKind?: 'required-subject' | 'required-activity' | 'supplementary';
  mastery: number;
  attempts: number;
  retention: number;
  prerequisiteIds: string[];
  /** 学びのつながりを示すが、解放条件には使わない関係。 */
  supportingLinks?: { sourceId: string; kind: RoadmapSupportingKind }[];
  /** まだ身についていない前提単元。 */
  blockedByNames?: string[];
  x: number;
  y: number;
  visibility: 'revealed' | 'frontier' | 'hidden';
  state: 'cleared' | 'review' | 'current' | 'open' | 'locked';
}

export interface RoadmapUnitProgressView {
  mastery: number;
  attempts: number;
  retention: number;
  state: RoadmapNode['state'];
}

interface RoadmapTodayItemBase {
  questionId: string;
  actualUnitId: string;
  unitName: string;
  subject: string;
  subjectLabel: string;
  grade: number;
  conceptIds: readonly string[];
  progress: RoadmapUnitProgressView;
}

export type RoadmapTodayItem =
  | (RoadmapTodayItemBase & { completed: false; reason: RoadmapPendingReason })
  | (RoadmapTodayItemBase & { completed: true; reason: RoadmapCompletedReason });

export interface RoadmapTodayPlanView {
  items: RoadmapTodayItem[];
  allComplete: boolean;
}

export interface RoadmapViewModel {
  nodes: RoadmapNode[];
  todayPlan: RoadmapTodayPlanView;
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
