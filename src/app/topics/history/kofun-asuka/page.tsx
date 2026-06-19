"use client";

import Link from "next/link";
import { HISTORY_KOFUN_ASUKA_GROUPS } from "@/data/historyModes";
import {
  getQuestionsByTopic,
  getQuestionTypeLabel,
} from "@/data/questions/index";
import { useProgressStore } from "@/store/progressStore";

export default function HistoryKofunAsukaPage() {
  const completedUnits = useProgressStore((s) => s.completedUnits);
  const unitScores = useProgressStore((s) => s.unitScores);

  const clearedCount = HISTORY_KOFUN_ASUKA_GROUPS.filter((g) =>
    completedUnits.includes(g.id),
  ).length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-orange-50 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <Link
            href="/topics/history"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-sky-300 bg-white px-5 py-2 text-sm font-bold text-sky-700 shadow-sm transition hover:bg-sky-50 active:scale-[0.98]"
          >
            ← 歴史メニューへ
          </Link>
          <div className="mt-6 text-center">
            <p className="text-5xl">⛩️</p>
            <h1 className="mt-2 text-3xl font-black text-rose-600">
              古墳・飛鳥時代
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              2つの分野に分けて学ぼう
            </p>
            <p className="mt-1 text-xs text-gray-500">
              クリア済み: {clearedCount} / {HISTORY_KOFUN_ASUKA_GROUPS.length}
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {HISTORY_KOFUN_ASUKA_GROUPS.map((group) => {
            const questions = getQuestionsByTopic(group.id);
            const types = [...new Set(questions.map((q) => q.type))];
            const cleared = completedUnits.includes(group.id);
            const score = unitScores[group.id];

            return (
              <Link
                key={group.id}
                href={group.href}
                className={`block rounded-2xl border-2 bg-white p-5 shadow-sm transition active:scale-[0.99] ${
                  cleared
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-gray-200 hover:border-rose-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{group.emoji}</span>
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full bg-gradient-to-r px-3 py-0.5 text-sm font-bold text-white ${group.color}`}
                      >
                        {group.title}
                      </span>
                      {cleared && (
                        <span className="text-xs font-bold text-emerald-600">
                          ✓ クリア {score !== undefined ? `${score}点` : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{group.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {types.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                        >
                          {getQuestionTypeLabel(t)}
                        </span>
                      ))}
                      <span className="rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800">
                        {questions.length}問
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
