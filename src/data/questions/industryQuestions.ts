import type { Question } from "@/types/question";
import type { IndustryModeId } from "@/data/industryModes";
import {
  g4Questions,
  g5Questions,
} from "./grades";
import g3U2Json from "../../../public/data/questions/g3_u2.json";
import { buildIndustryAgricultureQuestions } from "./industryAgricultureQuestions";
import { buildIndustryFisheriesQuestions } from "./industryFisheriesQuestions";

const AGRICULTURE_POINTS = new Set([
  "スーパーの工夫",
  "農業",
  "稲作",
  "生産と販売の流れ",
  "地域と生産",
]);

const FISHERIES_POINTS = new Set(["漁業の流れ"]);

function categorizeG3U2Question(q: Question): IndustryModeId {
  const point = q.curriculum_ref?.learning_point ?? "";
  if (FISHERIES_POINTS.has(point)) return "industry-fisheries";
  if (AGRICULTURE_POINTS.has(point)) return "industry-agriculture";
  return "industry-manufacturing";
}

function categorizeExtraQuestion(q: Question): IndustryModeId {
  if (q.unit_id === "g5_u2") return "industry-agriculture";
  return "industry-manufacturing";
}

function assignModeQuestions(
  questions: Question[],
  unitId: IndustryModeId,
  idPrefix: string,
): Question[] {
  return questions.map((q, i) => ({
    ...q,
    id: `${idPrefix}_q${String(i + 1).padStart(3, "0")}`,
    unit_id: unitId,
  }));
}

function groupQuestionsByMode(
  questions: Question[],
  categorize: (q: Question) => IndustryModeId,
): Record<IndustryModeId, Question[]> {
  const grouped: Record<IndustryModeId, Question[]> = {
    "industry-agriculture": [],
    "industry-fisheries": [],
    "industry-manufacturing": [],
  };
  for (const q of questions) {
    grouped[categorize(q)].push(q);
  }
  return grouped;
}

const g3U2Questions = g3U2Json.questions as Question[];
const extraQuestions = [
  ...g5Questions.filter((q) =>
    ["g5_u2", "g5_u3", "g5_u4", "g5_u5"].includes(q.unit_id),
  ),
  ...g4Questions.filter((q) => q.unit_id === "g4_u5"),
];

const g3U2ByMode = groupQuestionsByMode(g3U2Questions, categorizeG3U2Question);
const extraByMode = groupQuestionsByMode(extraQuestions, categorizeExtraQuestion);

function buildModeQuestions(
  modeId: IndustryModeId,
  idPrefix: string,
): Question[] {
  const g3 = g3U2ByMode[modeId] ?? [];
  const extra = extraByMode[modeId] ?? [];
  const base = assignModeQuestions([...g3, ...extra], modeId, idPrefix);

  if (modeId === "industry-agriculture") {
    const riceQuestions = buildIndustryAgricultureQuestions();
    const offset = base.length;
    return [
      ...base,
      ...riceQuestions.map((q, i) => ({
        ...q,
        id: `${idPrefix}_q${String(offset + i + 1).padStart(3, "0")}`,
      })),
    ];
  }

  if (modeId === "industry-fisheries") {
    const fisheriesQuestions = buildIndustryFisheriesQuestions();
    const offset = base.length;
    return [
      ...base,
      ...fisheriesQuestions.map((q, i) => ({
        ...q,
        id: `${idPrefix}_q${String(offset + i + 1).padStart(3, "0")}`,
      })),
    ];
  }

  return base;
}

/** 産業テーマの3分野別問題 */
export function buildIndustryQuestionsByMode(): Record<
  IndustryModeId,
  Question[]
> {
  return {
    "industry-agriculture": buildModeQuestions(
      "industry-agriculture",
      "ind_agri",
    ),
    "industry-fisheries": buildModeQuestions(
      "industry-fisheries",
      "ind_fish",
    ),
    "industry-manufacturing": buildModeQuestions(
      "industry-manufacturing",
      "ind_mfg",
    ),
  };
}

export function buildAllIndustryQuestions(): Question[] {
  return Object.values(buildIndustryQuestionsByMode()).flat();
}
