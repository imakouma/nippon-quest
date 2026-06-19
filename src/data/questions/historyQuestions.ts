import type { Question } from "@/types/question";
import type { HistoryQuizUnitId } from "@/data/historyModes";
import { HISTORY_QUIZ_UNITS } from "@/data/historyModes";
import {
  g3Questions,
  g4Questions,
  g6Questions,
} from "./grades";
import { buildHistoryPeriodQuestionsByMode } from "./historyPeriodQuestions";
import { buildHistoryTimelineQuestionsByMode } from "./historyTimelineQuestions";

const HISTORY_MODE_ORDER = HISTORY_QUIZ_UNITS;

const LEGACY_LEARNING_POINT_TO_MODE: Record<string, HistoryQuizUnitId> = {
  人口の変化: "history-showa-postwar",
  くらしの変化: "history-showa-postwar",
  伝統文化: "history-edo",
  古墳時代: "history-kofun",
  飛鳥時代: "history-asuka",
  時代区分: "history-timeline",
  江戸時代: "history-edo",
};

function categorizeLegacyQuestion(q: Question): HistoryQuizUnitId {
  const point = q.curriculum_ref?.learning_point ?? "";
  return LEGACY_LEARNING_POINT_TO_MODE[point] ?? "history-kofun";
}

function assignModeQuestions(
  questions: Question[],
  modeId: HistoryQuizUnitId,
  idPrefix: string,
): Question[] {
  return questions.map((q, i) => ({
    ...q,
    id: `${idPrefix}_q${String(i + 1).padStart(3, "0")}`,
    unit_id: modeId,
  }));
}

function groupLegacyQuestionsByMode(
  questions: Question[],
): Record<HistoryQuizUnitId, Question[]> {
  const grouped = Object.fromEntries(
    HISTORY_MODE_ORDER.map((id) => [id, [] as Question[]]),
  ) as Record<HistoryQuizUnitId, Question[]>;

  for (const q of questions) {
    grouped[categorizeLegacyQuestion(q)].push(q);
  }
  return grouped;
}

const legacyQuestions = [
  ...g3Questions.filter((q) => q.unit_id === "g3_u4"),
  ...g4Questions.filter((q) => q.unit_id === "g4_u4"),
  ...g6Questions.filter((q) => q.unit_id === "g6_u2"),
];

const legacyByMode = groupLegacyQuestionsByMode(legacyQuestions);
const periodByMode = buildHistoryPeriodQuestionsByMode();
const timelineByMode = buildHistoryTimelineQuestionsByMode();

const ID_PREFIX: Record<HistoryQuizUnitId, string> = {
  "history-timeline": "hist_tl",
  "history-jomon": "hist_jm",
  "history-yayoi": "hist_ya",
  "history-kofun": "hist_kf",
  "history-asuka": "hist_as",
  "history-nara": "hist_na",
  "history-heian": "hist_hi",
  "history-kamakura": "hist_km",
  "history-muromachi": "hist_mu",
  "history-sengoku": "hist_sg",
  "history-azuchi-momoyama": "hist_am",
  "history-edo": "hist_ed",
  "history-meiji": "hist_me",
  "history-taisho": "hist_ta",
  "history-showa-prewar": "hist_sp",
  "history-showa-postwar": "hist_sw",
};

function buildModeQuestions(modeId: HistoryQuizUnitId): Question[] {
  const legacy = legacyByMode[modeId] ?? [];
  const timeline = timelineByMode[modeId] ?? [];
  const period = periodByMode[modeId] ?? [];
  const base = assignModeQuestions(legacy, modeId, ID_PREFIX[modeId]);
  const timelineOffset = base.length;
  const withTimeline = [
    ...base,
    ...timeline.map((q, i) => ({
      ...q,
      id: `${ID_PREFIX[modeId]}_q${String(timelineOffset + i + 1).padStart(3, "0")}`,
    })),
  ];
  const periodOffset = withTimeline.length;
  return [
    ...withTimeline,
    ...period.map((q, i) => ({
      ...q,
      id: `${ID_PREFIX[modeId]}_q${String(periodOffset + i + 1).padStart(3, "0")}`,
    })),
  ];
}

/** 歴史テーマの11クイズ単元別問題 */
export function buildHistoryQuestionsByMode(): Record<HistoryQuizUnitId, Question[]> {
  return Object.fromEntries(
    HISTORY_MODE_ORDER.map((modeId) => [modeId, buildModeQuestions(modeId)]),
  ) as Record<HistoryQuizUnitId, Question[]>;
}

export function buildAllHistoryQuestions(): Question[] {
  return Object.values(buildHistoryQuestionsByMode()).flat();
}
