import type { Choice } from "@/types/question";

interface ChoiceButtonProps {
  choice: Choice;
  status: "default" | "selected" | "correct" | "wrong";
  onClick: () => void;
  disabled?: boolean;
}

const statusStyles: Record<ChoiceButtonProps["status"], string> = {
  default:
    "border-gray-300 bg-white text-gray-800 hover:border-sky-400 hover:bg-sky-50",
  selected: "border-sky-500 bg-sky-100 text-sky-900 ring-2 ring-sky-300",
  correct:
    "border-emerald-500 bg-emerald-100 text-emerald-900 ring-2 ring-emerald-300",
  wrong: "border-red-500 bg-red-100 text-red-900 ring-2 ring-red-300",
};

export function ChoiceButton({
  choice,
  status,
  onClick,
  disabled = false,
}: ChoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-14 w-full rounded-2xl border-2 px-4 py-3 text-left text-base font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${statusStyles[status]}`}
    >
      {choice.text}
    </button>
  );
}
