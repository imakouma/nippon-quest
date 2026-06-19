"use client";

import { ChoiceButton } from "@/components/quiz/ChoiceButton";
import { ExplanationPanel } from "@/components/quiz/ExplanationPanel";
import { HistoryIntroAnimation } from "@/components/quiz/HistoryIntroAnimation";
import { MapPinQuestion } from "@/components/quiz/MapPinQuestion";
import { PrefectureShapeImage } from "@/components/quiz/PrefectureShapeImage";
import { WorldMapImage } from "@/components/quiz/WorldMapImage";
import { SortOrderQuestion } from "@/components/quiz/SortOrderQuestion";
import { MapLegendSymbols } from "@/components/maps/MapLegendSymbols";
import { MapSymbolImage } from "@/components/quiz/MapSymbolImage";
import { getQuestionTypeLabel } from "@/data/questions/index";
import { useQuiz } from "@/hooks/useQuiz";
import { useQuizStore } from "@/store/quizStore";

export function QuestionRenderer() {
  const phase = useQuizStore((s) => s.phase);
  const {
    currentQuestion,
    selectedChoiceId,
    selectedOrder,
    mediaReady,
    isCorrect,
    canSubmit,
    handleSelectChoice,
    handleMoveOrder,
    handleMediaReady,
    handleSubmit,
    handleNext,
  } = useQuiz();

  if (!currentQuestion) return null;

  const showResults = phase === "explanation";
  const correctId = currentQuestion.answer.correct_ids[0];
  const hasChoices = currentQuestion.question.choices.length > 0;

  const getChoiceStatus = (choiceId: string) => {
    if (phase === "answering") {
      return selectedChoiceId === choiceId ? "selected" : "default";
    }
    if (choiceId === correctId) return "correct";
    if (choiceId === selectedChoiceId && !isCorrect) return "wrong";
    return "default";
  };

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
          {getQuestionTypeLabel(currentQuestion.type)}
        </span>
        <span className="text-xs text-gray-500">
          難易度 {"★".repeat(currentQuestion.difficulty)}
        </span>
      </div>

      <h2 className="text-xl font-bold leading-relaxed text-gray-800 sm:text-2xl">
        {currentQuestion.question.text}
      </h2>

      {currentQuestion.question.image_url &&
        currentQuestion.tags?.includes("地図記号") && (
          <MapSymbolImage src={currentQuestion.question.image_url} />
        )}

      {currentQuestion.tags?.includes("地図記号") &&
        !currentQuestion.question.image_url && <MapLegendSymbols />}

      {currentQuestion.question.image_url &&
        currentQuestion.tags?.includes("都道府県の形") && (
          <PrefectureShapeImage src={currentQuestion.question.image_url} />
        )}

      {currentQuestion.question.image_url &&
        currentQuestion.tags?.includes("世界地図") && (
          <WorldMapImage src={currentQuestion.question.image_url} />
        )}

      {currentQuestion.question.media?.kind === "history_animation" &&
        currentQuestion.question.media.slides && (
          <div className="mt-4">
            <HistoryIntroAnimation
              title={currentQuestion.question.media.title}
              description={currentQuestion.question.media.description}
              slides={currentQuestion.question.media.slides}
              onComplete={handleMediaReady}
            />
            {!mediaReady && (
              <button
                type="button"
                onClick={handleMediaReady}
                className="mt-2 text-sm font-bold text-indigo-600 underline"
              >
                スキップして問題へ
              </button>
            )}
          </div>
        )}

      {currentQuestion.question.media?.kind === "video" &&
        currentQuestion.question.media.video_url && (
          <div className="mt-4 overflow-hidden rounded-2xl border-2 border-indigo-200">
            <iframe
              title={currentQuestion.question.media.title}
              src={currentQuestion.question.media.video_url}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              onLoad={handleMediaReady}
            />
          </div>
        )}

      {currentQuestion.type === "map_pin" && currentQuestion.question.map && (
        <MapPinQuestion
          map={currentQuestion.question.map}
          selectedId={selectedChoiceId}
          correctId={correctId}
          showResults={showResults}
          disabled={!mediaReady}
          onSelect={handleSelectChoice}
        />
      )}

      {currentQuestion.type === "sort_order" &&
        currentQuestion.question.sort_items && (
          <SortOrderQuestion
            items={currentQuestion.question.sort_items}
            order={selectedOrder}
            showResults={showResults}
            correctOrder={currentQuestion.answer.correct_ids}
            disabled={!mediaReady}
            onMove={handleMoveOrder}
          />
        )}

      {hasChoices && (
        <div className="mt-6 space-y-3">
          {currentQuestion.question.choices.map((choice) => (
            <ChoiceButton
              key={choice.id}
              choice={choice}
              status={getChoiceStatus(choice.id)}
              disabled={showResults || !mediaReady}
              onClick={() => {
                if (phase === "answering") handleSelectChoice(choice.id);
              }}
            />
          ))}
        </div>
      )}

      {phase === "answering" && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-6 min-h-12 w-full rounded-xl bg-emerald-500 px-4 py-3 text-base font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300 active:scale-[0.98]"
        >
          答え合わせ
        </button>
      )}

      <ExplanationPanel
        explanation={currentQuestion.explanation}
        hint={currentQuestion.hint}
        isVisible={phase === "explanation"}
        onNext={handleNext}
      />
    </>
  );
}
