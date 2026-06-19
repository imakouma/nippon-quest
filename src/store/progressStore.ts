import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProgressState {
  completedUnits: string[];
  unitScores: Record<string, number>;
  wrongQuestions: string[];
  completeUnit: (unitId: string, score: number) => void;
  addWrongQuestion: (questionId: string) => void;
  removeWrongQuestion: (questionId: string) => void;
  clearWrongQuestions: () => void;
  hydrateFromServer: (data: {
    completedUnits: string[];
    unitScores: Record<string, number>;
    wrongQuestions: string[];
  }) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedUnits: [],
      unitScores: {},
      wrongQuestions: [],

      completeUnit: (unitId, score) => {
        const { completedUnits, unitScores } = get();
        const nextCompleted = completedUnits.includes(unitId)
          ? completedUnits
          : [...completedUnits, unitId];
        const prevScore = unitScores[unitId] ?? 0;

        set({
          completedUnits: nextCompleted,
          unitScores: {
            ...unitScores,
            [unitId]: Math.max(prevScore, score),
          },
        });
      },

      addWrongQuestion: (questionId) => {
        const { wrongQuestions } = get();
        if (wrongQuestions.includes(questionId)) return;
        set({ wrongQuestions: [...wrongQuestions, questionId] });
      },

      removeWrongQuestion: (questionId) => {
        set({
          wrongQuestions: get().wrongQuestions.filter((id) => id !== questionId),
        });
      },

      clearWrongQuestions: () => set({ wrongQuestions: [] }),

      hydrateFromServer: (data) => {
        const current = get();
        const same =
          JSON.stringify(current.completedUnits) ===
            JSON.stringify(data.completedUnits) &&
          JSON.stringify(current.unitScores) ===
            JSON.stringify(data.unitScores) &&
          JSON.stringify(current.wrongQuestions) ===
            JSON.stringify(data.wrongQuestions);
        if (!same) set(data);
      },
    }),
    {
      name: "nippon-quest-progress",
    },
  ),
);
