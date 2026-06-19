"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QuizPageClient } from "./QuizPageClient";

export function QuizPageLoader() {
  const searchParams = useSearchParams();
  const unitId = searchParams.get("unitId");

  if (!unitId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-gray-700">
          学びたいテーマを選んでください
        </p>
        <Link
          href="/map"
          className="rounded-xl bg-sky-500 px-6 py-3 font-bold text-white"
        >
          探検マップへ
        </Link>
      </main>
    );
  }

  return <QuizPageClient unitId={unitId} />;
}
