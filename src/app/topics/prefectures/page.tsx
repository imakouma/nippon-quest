"use client";

import Link from "next/link";
import {
  PREFECTURE_MODES,
  isPrefectureCapitalModeComplete,
  isPrefectureShapeModeComplete,
} from "@/data/prefectureModes";
import { getQuestionsByTopic, getQuestionTypeLabel } from "@/data/questions/index";
import { useProgressStore } from "@/store/progressStore";

export default function PrefecturesTopicPage() {
  const completedUnits = useProgressStore((s) => s.completedUnits);
  const unitScores = useProgressStore((s) => s.unitScores);

  const clearedCount = PREFECTURE_MODES.filter((m) => {
    if (m.id === "prefectures-shape") {
      return isPrefectureShapeModeComplete(completedUnits);
    }
    if (m.id === "prefectures-capital") {
      return isPrefectureCapitalModeComplete(completedUnits);
    }
    return completedUnits.includes(m.id);
  }).length;

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
            <p className="text-5xl">🗾</p>
            <h1 className="mt-2 text-3xl font-black text-sky-600">都道府県</h1>
            <p className="mt-2 text-sm text-gray-600">
              学びたいことを選んでね
            </p>
            <p className="mt-1 text-xs text-gray-500">
              クリア済み: {clearedCount} / {PREFECTURE_MODES.length}
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {PREFECTURE_MODES.map((mode) => {
            const questions = getQuestionsByTopic(mode.id);
            const types = [...new Set(questions.map((q) => q.type))];
            const cleared =
              mode.id === "prefectures-shape"
                ? isPrefectureShapeModeComplete(completedUnits)
                : mode.id === "prefectures-capital"
                  ? isPrefectureCapitalModeComplete(completedUnits)
                  : completedUnits.includes(mode.id);
            const score = unitScores[mode.id];

            return (
              <Link
                key={mode.id}
                href={mode.href}
                className={`block rounded-2xl border-2 bg-white p-5 shadow-sm transition active:scale-[0.99] ${
                  cleared
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-gray-200 hover:border-sky-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{mode.emoji}</span>
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full bg-gradient-to-r px-3 py-0.5 text-sm font-bold text-white ${mode.color}`}
                      >
                        {mode.title}
                      </span>
                      {cleared && (
                        <span className="text-xs font-bold text-emerald-600">
                          ✓ クリア {score !== undefined ? `${score}点` : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{mode.description}</p>
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
                        {mode.id === "prefectures-shape" ||
                        mode.id === "prefectures-capital"
                          ? `6エリア・${questions.length}問`
                          : `${questions.length}問`}
                      </span>
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
