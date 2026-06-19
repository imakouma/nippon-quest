"use client";

import Link from "next/link";
import {
  HISTORY_PERIODS,
  countHistoryPeriodsCleared,
  getGroupedPeriodUnitIds,
  isHistoryPeriodComplete,
  isHistoryTopicComplete,
} from "@/data/historyModes";
import { getQuestionsByTopic, getQuestionTypeLabel } from "@/data/questions/index";
import { useProgressStore } from "@/store/progressStore";
import { getQuizHref } from "@/utils/quizHref";

export default function HistoryTopicPage() {
  const completedUnits = useProgressStore((s) => s.completedUnits);
  const unitScores = useProgressStore((s) => s.unitScores);

  const clearedCount = countHistoryPeriodsCleared(completedUnits);
  const timelineQuestions = getQuestionsByTopic("history-timeline");
  const timelineTypes = [...new Set(timelineQuestions.map((q) => q.type))];
  const timelineCleared = completedUnits.includes("history-timeline");

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-amber-50 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <Link
            href="/map"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-sky-300 bg-white px-5 py-2 text-sm font-bold text-sky-700 shadow-sm transition hover:bg-sky-50 active:scale-[0.98]"
          >
            ← 探検マップへ
          </Link>
          <div className="mt-6 text-center">
            <p className="text-5xl">⏳</p>
            <h1 className="mt-2 text-3xl font-black text-rose-600">歴史</h1>
            <p className="mt-2 text-sm text-gray-600">
              学びたい時代を選んでね
            </p>
            <p className="mt-1 text-xs text-gray-500">
              クリア済み: {clearedCount} / {HISTORY_PERIODS.length}
            </p>
          </div>
        </div>

        <Link
          href={getQuizHref("history-timeline")}
          className={`mb-6 block rounded-2xl border-2 bg-white p-5 shadow-sm transition active:scale-[0.99] ${
            timelineCleared
              ? "border-emerald-300 bg-emerald-50/50"
              : "border-amber-200 hover:border-amber-400"
          }`}
        >
          <div className="flex items-start gap-4">
            <span className="text-4xl">📅</span>
            <div className="flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-0.5 text-sm font-bold text-white">
                  年表・並べ替え
                </span>
                {timelineCleared && (
                  <span className="text-xs font-bold text-emerald-600">✓ クリア</span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                時代の流れを並べ替えて、歴史全体のつながりを学ぼう
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {timelineTypes.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {getQuestionTypeLabel(t)}
                  </span>
                ))}
                <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                  {timelineQuestions.length}問
                </span>
              </div>
            </div>
          </div>
        </Link>

        <div className="grid gap-4">
          {HISTORY_PERIODS.map((period) => {
            const groupedUnitIds = getGroupedPeriodUnitIds(period.id);
            const isGroupedPeriod = groupedUnitIds !== null;
            const questions = isGroupedPeriod
              ? groupedUnitIds.flatMap((id) => getQuestionsByTopic(id))
              : getQuestionsByTopic(period.id);
            const types = [...new Set(questions.map((q) => q.type))];
            const cleared = isHistoryPeriodComplete(period.id, completedUnits);
            const score = isGroupedPeriod ? undefined : unitScores[period.id];

            return (
              <Link
                key={period.id}
                href={period.href}
                className={`block rounded-2xl border-2 bg-white p-5 shadow-sm transition active:scale-[0.99] ${
                  cleared
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-gray-200 hover:border-sky-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{period.emoji}</span>
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full bg-gradient-to-r px-3 py-0.5 text-sm font-bold text-white ${period.color}`}
                      >
                        {period.title}
                      </span>
                      {cleared && (
                        <span className="text-xs font-bold text-emerald-600">
                          ✓ クリア
                          {!isGroupedPeriod && score !== undefined
                            ? ` ${score}点`
                            : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{period.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {types.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                        >
                          {getQuestionTypeLabel(t)}
                        </span>
                      ))}
                      <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                        {isGroupedPeriod
                          ? `2分野・${questions.length}問`
                          : `${questions.length}問`}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {isHistoryTopicComplete(completedUnits) && (
          <p className="mt-6 text-center text-sm font-bold text-emerald-600">
            歴史の10時代すべてクリア！
          </p>
        )}
      </div>
    </main>
  );
}
