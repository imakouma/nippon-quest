import { create } from "zustand";
import type { Question, QuizSession } from "@/types/question";

type QuizPhase =
  | "idle"
  | "answering"
  | "checking"
  | "explanation"
  | "finished";

function shuffleIds(ids: string[]): string[] {
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isAnswerCorrect(question: Question, choiceId: string | null, order: string[]): boolean {
  const { correct_ids } = question.answer;

  if (question.type === "sort_order") {
    return (
      order.length === correct_ids.length &&
      order.every((id, i) => id === correct_ids[i])
    );
  }

  if (!choiceId) return false;
  return correct_ids.includes(choiceId);
}

function initOrderForQuestion(question: Question | null): string[] {
  if (!question?.question.sort_items?.length) return [];
  const ids = question.question.sort_items.map((i) => i.id);
  return shuffleIds(ids);
}

interface QuizState {
  session: QuizSession | null;
  phase: QuizPhase;
  selectedChoiceId: string | null;
  selectedOrder: string[];
  mediaReady: boolean;
  isCorrect: boolean | null;
  startSession: (unitId: string, questions: Question[]) => void;
  selectChoice: (choiceId: string) => void;
  moveOrderItem: (fromIndex: number, toIndex: number) => void;
  setMediaReady: (ready: boolean) => void;
  submitAnswer: () => void;
  nextQuestion: () => void;
  finishSession: () => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  session: null,
  phase: "idle",
  selectedChoiceId: null,
  selectedOrder: [],
  mediaReady: true,
  isCorrect: null,

  startSession: (unitId, questions) => {
    const first = questions[0] ?? null;
    set({
      session: {
        unitId,
        questions,
        currentIndex: 0,
        wrongIds: [],
        startedAt: new Date().toISOString(),
      },
      phase: "answering",
      selectedChoiceId: null,
      selectedOrder: initOrderForQuestion(first),
      mediaReady: !first?.question.media,
      isCorrect: null,
    });
  },

  selectChoice: (choiceId) => {
    const { phase } = get();
    if (phase !== "answering") return;
    set({ selectedChoiceId: choiceId });
  },

  moveOrderItem: (fromIndex, toIndex) => {
    const { phase, selectedOrder } = get();
    if (phase !== "answering") return;
    const next = [...selectedOrder];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    set({ selectedOrder: next });
  },

  setMediaReady: (ready) => set({ mediaReady: ready }),

  submitAnswer: () => {
    const { session, selectedChoiceId, selectedOrder, mediaReady, phase } = get();
    if (phase !== "answering" || !session || !mediaReady) return;

    const current = session.questions[session.currentIndex];

    if (current.type === "map_pin" && !selectedChoiceId) return;
    if (current.type === "sort_order" && selectedOrder.length === 0) return;
    if (
      (current.type === "multiple_choice" || current.type === "video_intro") &&
      !selectedChoiceId
    ) {
      return;
    }

    const correct = isAnswerCorrect(current, selectedChoiceId, selectedOrder);
    const wrongIds = correct
      ? session.wrongIds
      : [...session.wrongIds, current.id];

    set({
      session: { ...session, wrongIds },
      phase: "explanation",
      isCorrect: correct,
    });
  },

  nextQuestion: () => {
    const { session } = get();
    if (!session) return;

    const nextIndex = session.currentIndex + 1;
    if (nextIndex >= session.questions.length) {
      set({ phase: "finished" });
      return;
    }

    const nextQ = session.questions[nextIndex];
    set({
      session: { ...session, currentIndex: nextIndex },
      phase: "answering",
      selectedChoiceId: null,
      selectedOrder: initOrderForQuestion(nextQ),
      mediaReady: !nextQ.question.media,
      isCorrect: null,
    });
  },

  finishSession: () => {
    set({ phase: "finished" });
  },

  reset: () => {
    set({
      session: null,
      phase: "idle",
      selectedChoiceId: null,
      selectedOrder: [],
      mediaReady: true,
      isCorrect: null,
    });
  },
}));

export function canSubmitQuestion(
  question: Question,
  selectedChoiceId: string | null,
  selectedOrder: string[],
  mediaReady: boolean,
): boolean {
  if (!mediaReady) return false;
  if (question.type === "sort_order") return selectedOrder.length > 0;
  if (question.type === "map_pin") return Boolean(selectedChoiceId);
  return Boolean(selectedChoiceId);
}
