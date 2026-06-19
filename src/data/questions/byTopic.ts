import type { Question } from "@/types/question";
import type { TopicId } from "@/data/topics";
import { buildAllPrefectureShapeQuestionsByGroup } from "./prefectureShapeQuestions";
import { buildAllPrefectureCapitalQuestionsByGroup } from "./prefectureCapitalQuestions";
import { buildPrefectureLocationQuestions } from "./prefectureLocationQuestions";
import { buildMapSymbolQuestions } from "./mapSymbolQuestions";
import { buildWorldMapQuestions } from "./worldMapQuestions";
import { buildAllIndustryQuestions, buildIndustryQuestionsByMode } from "./industryQuestions";
import { buildAllHistoryQuestions, buildHistoryQuestionsByMode } from "./historyQuestions";
import { buildAllCivicsQuestions, buildCivicsQuestionsByMode } from "./civicsQuestions";
import {
  PREFECTURE_CAPITAL_GROUPS,
  PREFECTURE_SHAPE_GROUPS,
} from "@/data/prefectureModes";

const shapeQuestionsByGroup = buildAllPrefectureShapeQuestionsByGroup();
const capitalQuestionsByGroup = buildAllPrefectureCapitalQuestionsByGroup();
const industryQuestionsByMode = buildIndustryQuestionsByMode();
const historyQuestionsByMode = buildHistoryQuestionsByMode();
const civicsQuestionsByMode = buildCivicsQuestionsByMode();

/** 都道府県テーマの3モード別問題 */
export const PREFECTURE_MODE_QUESTIONS = {
  "prefectures-location": buildPrefectureLocationQuestions(),
  ...Object.fromEntries(
    PREFECTURE_SHAPE_GROUPS.map((group) => [
      group.id,
      shapeQuestionsByGroup[group.id],
    ]),
  ),
  ...Object.fromEntries(
    PREFECTURE_CAPITAL_GROUPS.map((group) => [
      group.id,
      capitalQuestionsByGroup[group.id],
    ]),
  ),
} as Record<string, Question[]>;

/** 産業テーマの3分野別問題 */
export const INDUSTRY_MODE_QUESTIONS = industryQuestionsByMode;

/** 歴史テーマの11時代別問題 */
export const HISTORY_MODE_QUESTIONS = historyQuestionsByMode;

/** 公民テーマの2分野別問題 */
export const CIVICS_MODE_QUESTIONS = civicsQuestionsByMode;

export const QUESTIONS_BY_TOPIC: Record<TopicId, Question[]> = {
  prefectures: [
    ...PREFECTURE_MODE_QUESTIONS["prefectures-location"],
    ...PREFECTURE_SHAPE_GROUPS.flatMap(
      (group) => PREFECTURE_MODE_QUESTIONS[group.id] ?? [],
    ),
    ...PREFECTURE_CAPITAL_GROUPS.flatMap(
      (group) => PREFECTURE_MODE_QUESTIONS[group.id] ?? [],
    ),
  ],

  world: buildWorldMapQuestions(),

  map_symbols: buildMapSymbolQuestions(),

  industry: buildAllIndustryQuestions(),

  history: buildAllHistoryQuestions(),

  civics: buildAllCivicsQuestions(),
};

export const ALL_TOPIC_QUESTIONS: Question[] = Object.values(
  QUESTIONS_BY_TOPIC,
).flat();
