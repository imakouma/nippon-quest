import { getQuizHref } from "@/utils/quizHref";

export type CivicsModeId =
  | "civics-constitution"
  | "civics-politics-election";

export type CivicsQuizUnitId = CivicsModeId;

export interface CivicsMode {
  id: CivicsModeId;
  title: string;
  description: string;
  emoji: string;
  color: string;
  href: string;
}

/** 公民テーマの2分野 */
export const CIVICS_MODES: CivicsMode[] = [
  {
    id: "civics-constitution",
    title: "憲法",
    description: "日本国憲法と三権分立のしくみ",
    emoji: "📜",
    color: "from-indigo-500 to-blue-600",
    href: getQuizHref("civics-constitution"),
  },
  {
    id: "civics-politics-election",
    title: "政治や選挙",
    description: "地方自治・選挙・地域の公共サービス",
    emoji: "🗳️",
    color: "from-violet-500 to-purple-600",
    href: getQuizHref("civics-politics-election"),
  },
];

export const CIVICS_QUIZ_UNITS: CivicsQuizUnitId[] = CIVICS_MODES.map(
  (m) => m.id,
);

export function isCivicsModeId(id: string): id is CivicsModeId {
  return CIVICS_MODES.some((m) => m.id === id);
}

export function isCivicsQuizUnitId(id: string): id is CivicsQuizUnitId {
  return CIVICS_QUIZ_UNITS.includes(id as CivicsQuizUnitId);
}

export function getCivicsModeById(id: string): CivicsMode | undefined {
  return CIVICS_MODES.find((m) => m.id === id);
}

export function isCivicsTopicComplete(completedUnits: string[]): boolean {
  return CIVICS_MODES.every((m) => completedUnits.includes(m.id));
}
