import type { Explanation } from "@/types/question";

interface ExplanationPanelProps {
  explanation: Explanation;
  hint?: string;
  isVisible: boolean;
  onNext: () => void;
}

export function ExplanationPanel({
  explanation,
  hint,
  isVisible,
  onNext,
}: ExplanationPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="animate-slide-up mt-6 rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 shadow-lg">
      {hint && (
        <p className="mb-2 text-sm text-amber-700">
          <span className="font-bold">ヒント：</span>
          {hint}
        </p>
      )}
      <p className="text-lg font-bold leading-relaxed text-gray-800">
        {explanation.short}
      </p>
      {explanation.detail && (
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          {explanation.detail}
        </p>
      )}
      <button
        type="button"
        onClick={onNext}
        className="mt-5 min-h-12 w-full rounded-xl bg-sky-500 px-4 py-3 text-base font-bold text-white transition hover:bg-sky-600 active:scale-[0.98]"
      >
        次の問題へ
      </button>
    </div>
  );
}
