import type { Question } from "@/types/question";
import type { TopicId } from "@/data/topics";
import { isIndustryQuizUnitId } from "@/data/industryModes";
import { isHistoryQuizUnitId } from "@/data/historyModes";
import { isCivicsQuizUnitId } from "@/data/civicsModes";
import { isPrefectureQuizUnitId } from "@/data/prefectureModes";
import {
  QUESTIONS_BY_TOPIC,
  PREFECTURE_MODE_QUESTIONS,
  INDUSTRY_MODE_QUESTIONS,
  HISTORY_MODE_QUESTIONS,
  CIVICS_MODE_QUESTIONS,
  ALL_TOPIC_QUESTIONS,
} from "./byTopic";
import { buildAllPrefectureCapitalQuestions } from "./prefectureCapitalQuestions";
import { buildAllPrefectureShapeQuestions } from "./prefectureShapeQuestions";

export function getQuestionsByTopic(topicId: string): Question[] {
  if (topicId === "prefectures-shape") {
    return buildAllPrefectureShapeQuestions();
  }
  if (topicId === "prefectures-capital") {
    return buildAllPrefectureCapitalQuestions();
  }
  if (isPrefectureQuizUnitId(topicId)) {
    return PREFECTURE_MODE_QUESTIONS[topicId] ?? [];
  }
  if (isIndustryQuizUnitId(topicId)) {
    return INDUSTRY_MODE_QUESTIONS[topicId] ?? [];
  }
  if (isHistoryQuizUnitId(topicId)) {
    return HISTORY_MODE_QUESTIONS[topicId] ?? [];
  }
  if (isCivicsQuizUnitId(topicId)) {
    return CIVICS_MODE_QUESTIONS[topicId] ?? [];
  }
  return QUESTIONS_BY_TOPIC[topicId as TopicId] ?? [];
}

/** @deprecated unit_id 互換。topic id を渡す */
export function getQuestionsByUnit(unitId: string): Question[] {
  return getQuestionsByTopic(unitId);
}

export const ALL_QUESTIONS = ALL_TOPIC_QUESTIONS;

export function getQuestionTypeLabel(type: Question["type"]): string {
  const labels: Record<Question["type"], string> = {
    multiple_choice: "4択",
    map_pin: "地図",
    sort_order: "並べ替え",
    video_intro: "動画・紹介",
    matching: "組み合わせ",
    fill_blank: "穴埋め",
  };
  return labels[type];
}
