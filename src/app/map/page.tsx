"use client";

import Link from "next/link";
import { TOPICS } from "@/data/topics";
import { getQuizHref } from "@/utils/quizHref";
import {
  PREFECTURE_MODES,
  PREFECTURE_QUIZ_UNITS,
  isPrefectureCapitalModeComplete,
  isPrefectureShapeModeComplete,
} from "@/data/prefectureModes";
import {
  INDUSTRY_MODES,
  INDUSTRY_QUIZ_UNITS,
  isIndustryTopicComplete,
} from "@/data/industryModes";
import {
  countHistoryPeriodsCleared,
  HISTORY_PERIODS,
  isHistoryTopicComplete,
} from "@/data/historyModes";
import {
  CIVICS_QUIZ_UNITS,
  isCivicsTopicComplete,
} from "@/data/civicsModes";
import { getQuestionsByTopic, getQuestionTypeLabel } from "@/data/questions/index";
import { useProgressStore } from "@/store/progressStore";

export default function StageMapPage() {
  const completedUnits = useProgressStore((s) => s.completedUnits);
  const unitScores = useProgressStore((s) => s.unitScores);

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-amber-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <div className="mb-4 flex justify-start">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-sky-300 bg-white px-5 py-2 text-sm font-bold text-sky-700 shadow-sm transition hover:bg-sky-50 active:scale-[0.98]"
            >
              ← ホームへ
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-orange-500">探検マップ</h1>
            <p className="mt-1 text-sm text-gray-600">
              好きなテーマを選んで、学年に関係なく学ぼう！
            </p>
            <p className="mt-2 text-xs text-gray-500">
              クリア済み: {completedUnits.length} / {TOPICS.length} テーマ
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {TOPICS.map((topic) => {
            const questions = getQuestionsByTopic(topic.id);
            const types = [...new Set(questions.map((q) => q.type))];
            const isPrefectures = topic.id === "prefectures";
            const isIndustry = topic.id === "industry";
            const isHistory = topic.id === "history";
            const isCivics = topic.id === "civics";
            const prefectureCleared = PREFECTURE_MODES.every((m) => {
              if (m.id === "prefectures-shape") {
                return isPrefectureShapeModeComplete(completedUnits);
              }
              if (m.id === "prefectures-capital") {
                return isPrefectureCapitalModeComplete(completedUnits);
              }
              return completedUnits.includes(m.id);
            });
            const prefectureClearedCount = PREFECTURE_QUIZ_UNITS.filter((id) =>
              completedUnits.includes(id),
            ).length;
            const industryClearedCount = INDUSTRY_QUIZ_UNITS.filter((id) =>
              completedUnits.includes(id),
            ).length;
            const historyClearedCount = countHistoryPeriodsCleared(completedUnits);
            const civicsClearedCount = CIVICS_QUIZ_UNITS.filter((id) =>
              completedUnits.includes(id),
            ).length;
            const cleared = isPrefectures
              ? prefectureCleared
              : isIndustry
                ? isIndustryTopicComplete(completedUnits)
                : isHistory
                  ? isHistoryTopicComplete(completedUnits)
                  : isCivics
                    ? isCivicsTopicComplete(completedUnits)
                    : completedUnits.includes(topic.id);
            const score =
              isPrefectures || isIndustry || isHistory || isCivics
                ? undefined
                : unitScores[topic.id];
            const href = isPrefectures
              ? "/topics/prefectures"
              : isIndustry
                ? "/topics/industry"
                : isHistory
                  ? "/topics/history"
                  : isCivics
                    ? "/topics/civics"
                    : getQuizHref(topic.id);

            return (
              <Link
                key={topic.id}
                href={href}
                className={`block rounded-2xl border-2 bg-white p-5 shadow-sm transition active:scale-[0.99] ${
                  cleared
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-gray-200 hover:border-sky-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-4xl">{topic.emoji}</span>
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full bg-gradient-to-r px-2.5 py-0.5 text-xs font-bold text-white ${topic.color}`}
                      >
                        {topic.title}
                      </span>
                      {cleared && (
                        <span className="text-xs font-bold text-emerald-600">
                          ✓ クリア
                          {!isPrefectures && !isIndustry && !isHistory && !isCivics && score !== undefined
                            ? ` ${score}点`
                            : ""}
                        </span>
                      )}
                      {isPrefectures && prefectureClearedCount > 0 && !cleared && (
                        <span className="text-xs font-bold text-sky-600">
                          {prefectureClearedCount}/{PREFECTURE_QUIZ_UNITS.length} クリア
                        </span>
                      )}
                      {isIndustry && industryClearedCount > 0 && !cleared && (
                        <span className="text-xs font-bold text-sky-600">
                          {industryClearedCount}/{INDUSTRY_QUIZ_UNITS.length} クリア
                        </span>
                      )}
                      {isHistory && historyClearedCount > 0 && !cleared && (
                        <span className="text-xs font-bold text-sky-600">
                          {historyClearedCount}/{HISTORY_PERIODS.length} クリア
                        </span>
                      )}
                      {isCivics && civicsClearedCount > 0 && !cleared && (
                        <span className="text-xs font-bold text-sky-600">
                          {civicsClearedCount}/{CIVICS_QUIZ_UNITS.length} クリア
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{topic.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {types.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                        >
                          {getQuestionTypeLabel(t)}
                        </span>
                      ))}
                      {isPrefectures ? (
                        <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                          位置・形・県庁所在地
                        </span>
                      ) : isIndustry ? (
                        <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                          農業・水産業・工業
                        </span>
                      ) : isHistory ? (
                        <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                          10の時代区分
                        </span>
                      ) : isCivics ? (
                        <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                          憲法・政治や選挙
                        </span>
                      ) : (
                        <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                          {questions.length}問
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
