import { getQuizHref } from "@/utils/quizHref";

export type HistoryJomonYayoiGroupId = "history-jomon" | "history-yayoi";

export type HistoryKofunAsukaGroupId = "history-kofun" | "history-asuka";

export type HistoryNaraHeianGroupId = "history-nara" | "history-heian";

export type HistoryMuromachiSengokuGroupId =
  | "history-muromachi"
  | "history-sengoku";

export type HistoryMeijiTaishoGroupId = "history-meiji" | "history-taisho";

export type HistoryGroupedPeriodId =
  | "history-jomon-yayoi"
  | "history-kofun-asuka"
  | "history-nara-heian"
  | "history-muromachi-sengoku"
  | "history-meiji-taisho";

export type HistoryQuizUnitId =
  | "history-timeline"
  | HistoryJomonYayoiGroupId
  | HistoryKofunAsukaGroupId
  | HistoryNaraHeianGroupId
  | HistoryMuromachiSengokuGroupId
  | HistoryMeijiTaishoGroupId
  | "history-kamakura"
  | "history-azuchi-momoyama"
  | "history-edo"
  | "history-showa-prewar"
  | "history-showa-postwar";

export type HistoryPeriodId =
  | HistoryGroupedPeriodId
  | Exclude<
      HistoryQuizUnitId,
      | HistoryJomonYayoiGroupId
      | HistoryKofunAsukaGroupId
      | HistoryNaraHeianGroupId
      | HistoryMuromachiSengokuGroupId
      | HistoryMeijiTaishoGroupId
    >;

export interface HistorySubGroup {
  id:
    | HistoryJomonYayoiGroupId
    | HistoryKofunAsukaGroupId
    | HistoryNaraHeianGroupId
    | HistoryMuromachiSengokuGroupId
    | HistoryMeijiTaishoGroupId;
  title: string;
  description: string;
  emoji: string;
  color: string;
  href: string;
}

export interface HistoryJomonYayoiGroup extends HistorySubGroup {
  id: HistoryJomonYayoiGroupId;
}

export interface HistoryKofunAsukaGroup extends HistorySubGroup {
  id: HistoryKofunAsukaGroupId;
}

export interface HistoryNaraHeianGroup extends HistorySubGroup {
  id: HistoryNaraHeianGroupId;
}

export interface HistoryMuromachiSengokuGroup extends HistorySubGroup {
  id: HistoryMuromachiSengokuGroupId;
}

export interface HistoryMeijiTaishoGroup extends HistorySubGroup {
  id: HistoryMeijiTaishoGroupId;
}

export interface HistoryPeriod {
  id: HistoryPeriodId;
  title: string;
  description: string;
  emoji: string;
  color: string;
  href: string;
}

/** 縄文・弥生時代の2分野 */
export const HISTORY_JOMON_YAYOI_GROUPS: HistoryJomonYayoiGroup[] = [
  {
    id: "history-jomon",
    title: "縄文時代",
    description: "狩りや採集、土器の文化",
    emoji: "🏺",
    color: "from-amber-500 to-orange-600",
    href: getQuizHref("history-jomon"),
  },
  {
    id: "history-yayoi",
    title: "弥生時代",
    description: "稲作が広まり、新しいくらしが始まる",
    emoji: "🌾",
    color: "from-lime-500 to-green-600",
    href: getQuizHref("history-yayoi"),
  },
];

/** 古墳・飛鳥時代の2分野 */
export const HISTORY_KOFUN_ASUKA_GROUPS: HistoryKofunAsukaGroup[] = [
  {
    id: "history-kofun",
    title: "古墳時代",
    description: "大和政権の発展と大きな古墳",
    emoji: "🗿",
    color: "from-rose-500 to-red-600",
    href: getQuizHref("history-kofun"),
  },
  {
    id: "history-asuka",
    title: "飛鳥時代",
    description: "遣隋使・大化の改新と飛鳥文化",
    emoji: "⛩️",
    color: "from-orange-500 to-amber-600",
    href: getQuizHref("history-asuka"),
  },
];

/** 奈良・平安時代の2分野 */
export const HISTORY_NARA_HEIAN_GROUPS: HistoryNaraHeianGroup[] = [
  {
    id: "history-nara",
    title: "奈良時代",
    description: "平城京と律令国家の整備",
    emoji: "🦌",
    color: "from-fuchsia-500 to-pink-600",
    href: getQuizHref("history-nara"),
  },
  {
    id: "history-heian",
    title: "平安時代",
    description: "平安京と貴族文化の花開き",
    emoji: "📜",
    color: "from-purple-500 to-violet-600",
    href: getQuizHref("history-heian"),
  },
];

/** 室町・戦国時代の2分野 */
export const HISTORY_MUROMACHI_SENGOKU_GROUPS: HistoryMuromachiSengokuGroup[] =
  [
    {
      id: "history-muromachi",
      title: "室町時代",
      description: "足利尊氏と室町幕府の政治",
      emoji: "🎋",
      color: "from-emerald-500 to-teal-600",
      href: getQuizHref("history-muromachi"),
    },
    {
      id: "history-sengoku",
      title: "戦国時代",
      description: "戦国大名の争いと天下統一",
      emoji: "⚔️",
      color: "from-stone-600 to-slate-700",
      href: getQuizHref("history-sengoku"),
    },
  ];

/** 明治・大正時代の2分野 */
export const HISTORY_MEIJI_TAISHO_GROUPS: HistoryMeijiTaishoGroup[] = [
  {
    id: "history-meiji",
    title: "明治時代",
    description: "明治維新と近代国家のはじまり",
    emoji: "🚂",
    color: "from-indigo-500 to-blue-700",
    href: getQuizHref("history-meiji"),
  },
  {
    id: "history-taisho",
    title: "大正時代",
    description: "大正デモクラシーと文化の変化",
    emoji: "🎩",
    color: "from-blue-500 to-indigo-600",
    href: getQuizHref("history-taisho"),
  },
];

/** 歴史テーマの10時代区分（メニュー） */
export const HISTORY_PERIODS: HistoryPeriod[] = [
  {
    id: "history-jomon-yayoi",
    title: "縄文・弥生時代",
    description: "土器や稲作が始まった日本のはじまり",
    emoji: "🏺",
    color: "from-amber-500 to-orange-600",
    href: "/topics/history/jomon-yayoi",
  },
  {
    id: "history-kofun-asuka",
    title: "古墳・飛鳥時代",
    description: "大和政権の発展と飛鳥文化",
    emoji: "⛩️",
    color: "from-rose-500 to-red-600",
    href: "/topics/history/kofun-asuka",
  },
  {
    id: "history-nara-heian",
    title: "奈良・平安時代",
    description: "律令国家と貴族文化の花開き",
    emoji: "🏯",
    color: "from-fuchsia-500 to-pink-600",
    href: "/topics/history/nara-heian",
  },
  {
    id: "history-kamakura",
    title: "鎌倉時代",
    description: "武士の台頭と幕府の成立",
    emoji: "⚔️",
    color: "from-slate-500 to-gray-700",
    href: getQuizHref("history-kamakura"),
  },
  {
    id: "history-muromachi-sengoku",
    title: "室町・戦国時代",
    description: "将軍の政治と戦国大名の争い",
    emoji: "🎋",
    color: "from-emerald-500 to-teal-600",
    href: "/topics/history/muromachi-sengoku",
  },
  {
    id: "history-azuchi-momoyama",
    title: "安土桃山時代",
    description: "天下統一と海外との交流",
    emoji: "🏰",
    color: "from-violet-500 to-purple-600",
    href: getQuizHref("history-azuchi-momoyama"),
  },
  {
    id: "history-edo",
    title: "江戸時代",
    description: "幕府による政治と町人文化",
    emoji: "🎎",
    color: "from-sky-500 to-blue-600",
    href: getQuizHref("history-edo"),
  },
  {
    id: "history-meiji-taisho",
    title: "明治・大正時代",
    description: "近代国家のはじまりと文化の変化",
    emoji: "🚂",
    color: "from-indigo-500 to-blue-700",
    href: "/topics/history/meiji-taisho",
  },
  {
    id: "history-showa-prewar",
    title: "昭和時代（戦前）",
    description: "戦争と国民生活の変化",
    emoji: "📻",
    color: "from-stone-500 to-neutral-700",
    href: getQuizHref("history-showa-prewar"),
  },
  {
    id: "history-showa-postwar",
    title: "昭和時代（戦後）",
    description: "復興と高度経済成長の時代",
    emoji: "🌱",
    color: "from-lime-500 to-green-600",
    href: getQuizHref("history-showa-postwar"),
  },
];

export const HISTORY_QUIZ_UNITS: HistoryQuizUnitId[] = [
  "history-timeline",
  ...HISTORY_JOMON_YAYOI_GROUPS.map((g) => g.id),
  ...HISTORY_KOFUN_ASUKA_GROUPS.map((g) => g.id),
  ...HISTORY_NARA_HEIAN_GROUPS.map((g) => g.id),
  ...HISTORY_MUROMACHI_SENGOKU_GROUPS.map((g) => g.id),
  ...HISTORY_MEIJI_TAISHO_GROUPS.map((g) => g.id),
  ...HISTORY_PERIODS.filter(
    (p) =>
      p.id !== "history-jomon-yayoi" &&
      p.id !== "history-kofun-asuka" &&
      p.id !== "history-nara-heian" &&
      p.id !== "history-muromachi-sengoku" &&
      p.id !== "history-meiji-taisho",
  ).map((p) => p.id as HistoryQuizUnitId),
];

export function isHistoryJomonYayoiGroupId(
  id: string,
): id is HistoryJomonYayoiGroupId {
  return HISTORY_JOMON_YAYOI_GROUPS.some((g) => g.id === id);
}

export function isHistoryKofunAsukaGroupId(
  id: string,
): id is HistoryKofunAsukaGroupId {
  return HISTORY_KOFUN_ASUKA_GROUPS.some((g) => g.id === id);
}

export function isHistoryNaraHeianGroupId(
  id: string,
): id is HistoryNaraHeianGroupId {
  return HISTORY_NARA_HEIAN_GROUPS.some((g) => g.id === id);
}

export function isHistoryMuromachiSengokuGroupId(
  id: string,
): id is HistoryMuromachiSengokuGroupId {
  return HISTORY_MUROMACHI_SENGOKU_GROUPS.some((g) => g.id === id);
}

export function isHistoryMeijiTaishoGroupId(
  id: string,
): id is HistoryMeijiTaishoGroupId {
  return HISTORY_MEIJI_TAISHO_GROUPS.some((g) => g.id === id);
}

export function isHistoryQuizUnitId(id: string): id is HistoryQuizUnitId {
  return HISTORY_QUIZ_UNITS.includes(id as HistoryQuizUnitId);
}

export function isHistoryPeriodId(id: string): id is HistoryPeriodId {
  return HISTORY_PERIODS.some((p) => p.id === id);
}

export function getHistoryPeriodById(id: string): HistoryPeriod | undefined {
  return HISTORY_PERIODS.find((p) => p.id === id);
}

export function isHistoryJomonYayoiModeComplete(
  completedUnits: string[],
): boolean {
  return HISTORY_JOMON_YAYOI_GROUPS.every((g) => completedUnits.includes(g.id));
}

export function isHistoryKofunAsukaModeComplete(
  completedUnits: string[],
): boolean {
  return HISTORY_KOFUN_ASUKA_GROUPS.every((g) => completedUnits.includes(g.id));
}

export function isHistoryNaraHeianModeComplete(
  completedUnits: string[],
): boolean {
  return HISTORY_NARA_HEIAN_GROUPS.every((g) => completedUnits.includes(g.id));
}

export function isHistoryMuromachiSengokuModeComplete(
  completedUnits: string[],
): boolean {
  return HISTORY_MUROMACHI_SENGOKU_GROUPS.every((g) =>
    completedUnits.includes(g.id),
  );
}

export function isHistoryMeijiTaishoModeComplete(
  completedUnits: string[],
): boolean {
  return HISTORY_MEIJI_TAISHO_GROUPS.every((g) => completedUnits.includes(g.id));
}

export function getGroupedPeriodUnitIds(
  periodId: HistoryPeriodId,
): HistoryQuizUnitId[] | null {
  switch (periodId) {
    case "history-jomon-yayoi":
      return ["history-jomon", "history-yayoi"];
    case "history-kofun-asuka":
      return ["history-kofun", "history-asuka"];
    case "history-nara-heian":
      return ["history-nara", "history-heian"];
    case "history-muromachi-sengoku":
      return ["history-muromachi", "history-sengoku"];
    case "history-meiji-taisho":
      return ["history-meiji", "history-taisho"];
    default:
      return null;
  }
}

export function isHistoryPeriodComplete(
  periodId: HistoryPeriodId,
  completedUnits: string[],
): boolean {
  if (periodId === "history-jomon-yayoi") {
    return isHistoryJomonYayoiModeComplete(completedUnits);
  }
  if (periodId === "history-kofun-asuka") {
    return isHistoryKofunAsukaModeComplete(completedUnits);
  }
  if (periodId === "history-nara-heian") {
    return isHistoryNaraHeianModeComplete(completedUnits);
  }
  if (periodId === "history-muromachi-sengoku") {
    return isHistoryMuromachiSengokuModeComplete(completedUnits);
  }
  if (periodId === "history-meiji-taisho") {
    return isHistoryMeijiTaishoModeComplete(completedUnits);
  }
  return completedUnits.includes(periodId);
}

export function isHistoryTopicComplete(completedUnits: string[]): boolean {
  return HISTORY_QUIZ_UNITS.every((id) => completedUnits.includes(id));
}

export function countHistoryPeriodsCleared(completedUnits: string[]): number {
  return HISTORY_PERIODS.filter((p) =>
    isHistoryPeriodComplete(p.id, completedUnits),
  ).length;
}

/** @deprecated HISTORY_PERIODS を使用 */
export const HISTORY_MODES = HISTORY_PERIODS;

/** @deprecated HistoryQuizUnitId を使用 */
export type HistoryModeId = HistoryQuizUnitId;
