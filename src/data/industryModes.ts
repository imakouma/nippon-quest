import { getQuizHref } from "@/utils/quizHref";

export type IndustryModeId =
  | "industry-agriculture"
  | "industry-fisheries"
  | "industry-manufacturing";

export type IndustryQuizUnitId = IndustryModeId;

export interface IndustryMode {
  id: IndustryModeId;
  title: string;
  description: string;
  emoji: string;
  color: string;
  href: string;
}

/** 産業テーマの3分野 */
export const INDUSTRY_MODES: IndustryMode[] = [
  {
    id: "industry-agriculture",
    title: "農業",
    description: "畑や田んぼでの仕事とくらしのつながり",
    emoji: "🌾",
    color: "from-lime-500 to-green-600",
    href: getQuizHref("industry-agriculture"),
  },
  {
    id: "industry-fisheries",
    title: "水産業",
    description: "海での漁と食卓までの流れ",
    emoji: "🐟",
    color: "from-cyan-500 to-blue-600",
    href: getQuizHref("industry-fisheries"),
  },
  {
    id: "industry-manufacturing",
    title: "工業",
    description: "工場・流通・店づくりとくらしのつながり",
    emoji: "🏭",
    color: "from-violet-500 to-purple-600",
    href: getQuizHref("industry-manufacturing"),
  },
];

export const INDUSTRY_QUIZ_UNITS: IndustryQuizUnitId[] = INDUSTRY_MODES.map(
  (m) => m.id,
);

export function isIndustryModeId(id: string): id is IndustryModeId {
  return INDUSTRY_MODES.some((m) => m.id === id);
}

export function isIndustryQuizUnitId(id: string): id is IndustryQuizUnitId {
  return INDUSTRY_QUIZ_UNITS.includes(id as IndustryQuizUnitId);
}

export function getIndustryModeById(id: string): IndustryMode | undefined {
  return INDUSTRY_MODES.find((m) => m.id === id);
}

export function isIndustryTopicComplete(completedUnits: string[]): boolean {
  return INDUSTRY_MODES.every((m) => completedUnits.includes(m.id));
}
