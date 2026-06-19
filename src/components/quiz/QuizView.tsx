"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BrushBatsuOverlay } from "@/components/ui/BrushBatsuOverlay";
import { BrushMaruOverlay } from "@/components/ui/BrushMaruOverlay";
import { QuestionRenderer } from "@/components/quiz/QuestionRenderer";
import { useQuiz } from "@/hooks/useQuiz";
import { useQuizStore } from "@/store/quizStore";
import { getUnitLabel } from "@/data/topics";

export function QuizView() {
  const router = useRouter();
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const phase = useQuizStore((s) => s.phase);
  const session = useQuizStore((s) => s.session);
  const reset = useQuizStore((s) => s.reset);
  const { currentQuestion, isCorrect, progress } = useQuiz();

  const unitLabel = session ? getUnitLabel(session.unitId) : null;

  const handleQuit = () => {
    reset();
    router.push("/map");
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowQuitConfirm(true)}
            className="min-h-11 rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
          >
            やめる
          </button>
          {unitLabel && (
            <p className="max-w-[60%] text-right text-xs font-semibold text-orange-600">
              {unitLabel.emoji} {unitLabel.title}
              {unitLabel.subtitle ? ` › ${unitLabel.subtitle}` : ""}
            </p>
          )}
        </div>

        {showQuitConfirm && (
          <div className="mb-4 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
            <p className="text-center font-bold text-gray-800">
              ここでやめますか？
            </p>
            <p className="mt-1 text-center text-sm text-gray-600">
              あとからもう一度挑戦できます
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowQuitConfirm(false)}
                className="min-h-11 flex-1 rounded-xl border-2 border-sky-300 bg-white py-2 font-bold text-sky-700"
              >
                つづける
              </button>
              <button
                type="button"
                onClick={handleQuit}
                className="min-h-11 flex-1 rounded-xl bg-gray-500 py-2 font-bold text-white"
              >
                やめる
              </button>
            </div>
          </div>
        )}

        {unitLabel?.subtitle && !showQuitConfirm && (
          <p className="mb-1 text-center text-sm font-bold text-gray-700">
            {unitLabel.subtitle}を学ぼう
          </p>
        )}
        <ProgressBar current={progress.current} total={progress.total} />

        <div className="mt-6 rounded-3xl border-2 border-sky-100 bg-white p-5 shadow-md sm:p-6">
          <p className="mb-2 text-sm font-bold text-sky-600">
            問題 {progress.current}
          </p>
          <QuestionRenderer />
        </div>
      </div>

      <BrushMaruOverlay show={phase === "explanation" && isCorrect === true} />
      <BrushBatsuOverlay show={phase === "explanation" && isCorrect === false} />
    </main>
  );
}
