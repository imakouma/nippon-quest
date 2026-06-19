"use client";

import { useCallback } from "react";
import { useQuizStore, canSubmitQuestion } from "@/store/quizStore";
import { useProgressStore } from "@/store/progressStore";

export function useQuiz() {
  const session = useQuizStore((s) => s.session);
  const phase = useQuizStore((s) => s.phase);
  const selectedChoiceId = useQuizStore((s) => s.selectedChoiceId);
  const selectedOrder = useQuizStore((s) => s.selectedOrder);
  const mediaReady = useQuizStore((s) => s.mediaReady);
  const isCorrect = useQuizStore((s) => s.isCorrect);
  const selectChoice = useQuizStore((s) => s.selectChoice);
  const moveOrderItem = useQuizStore((s) => s.moveOrderItem);
  const setMediaReady = useQuizStore((s) => s.setMediaReady);
  const submitAnswer = useQuizStore((s) => s.submitAnswer);
  const nextQuestion = useQuizStore((s) => s.nextQuestion);
  const addWrongQuestion = useProgressStore((s) => s.addWrongQuestion);
  const removeWrongQuestion = useProgressStore((s) => s.removeWrongQuestion);

  const currentQuestion = session
    ? session.questions[session.currentIndex] ?? null
    : null;

  const progress = {
    current: session ? session.currentIndex + 1 : 0,
    total: session?.questions.length ?? 0,
  };

  const canSubmit = currentQuestion
    ? canSubmitQuestion(
        currentQuestion,
        selectedChoiceId,
        selectedOrder,
        mediaReady,
      )
    : false;

  const handleSelectChoice = useCallback(
    (choiceId: string) => {
      selectChoice(choiceId);
    },
    [selectChoice],
  );

  const handleMoveOrder = useCallback(
    (fromIndex: number, toIndex: number) => {
      moveOrderItem(fromIndex, toIndex);
    },
    [moveOrderItem],
  );

  const handleMediaReady = useCallback(() => {
    setMediaReady(true);
  }, [setMediaReady]);

  const handleSubmit = useCallback(() => {
    if (!session || !currentQuestion) return;

    submitAnswer();

    const correct =
      currentQuestion.type === "sort_order"
        ? currentQuestion.answer.correct_ids.every(
            (id, i) => selectedOrder[i] === id,
          )
        : selectedChoiceId
          ? currentQuestion.answer.correct_ids.includes(selectedChoiceId)
          : false;

    if (correct) {
      removeWrongQuestion(currentQuestion.id);
    } else {
      addWrongQuestion(currentQuestion.id);
    }
  }, [
    session,
    currentQuestion,
    selectedChoiceId,
    selectedOrder,
    submitAnswer,
    addWrongQuestion,
    removeWrongQuestion,
  ]);

  const handleNext = useCallback(() => {
    nextQuestion();
  }, [nextQuestion]);

  return {
    currentQuestion,
    phase,
    selectedChoiceId,
    selectedOrder,
    mediaReady,
    isCorrect,
    progress,
    canSubmit,
    handleSelectChoice,
    handleMoveOrder,
    handleMediaReady,
    handleSubmit,
    handleNext,
  };
}
