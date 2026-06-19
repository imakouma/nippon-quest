import { Suspense } from "react";
import { QuizPageLoader } from "./QuizPageLoader";

function QuizLoadingFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-lg font-semibold text-sky-700">問題を読み込み中...</p>
    </main>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<QuizLoadingFallback />}>
      <QuizPageLoader />
    </Suspense>
  );
}
