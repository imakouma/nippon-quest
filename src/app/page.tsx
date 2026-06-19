"use client";

import Link from "next/link";
import { TOPICS } from "@/data/topics";
import { useProgressStore } from "@/store/progressStore";

export default function HomePage() {
  const completedUnits = useProgressStore((s) => s.completedUnits);
  const clearedTopics = completedUnits.filter((id) =>
    TOPICS.some((t) => t.id === id),
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-sky-100 via-amber-50 to-emerald-100 px-6 py-12">
      <div className="w-full max-w-md text-center">
        <p className="mb-2 text-lg font-semibold text-sky-700">社会科クイズ</p>
        <h1 className="mb-4 text-4xl font-black leading-tight text-orange-500 drop-shadow-sm sm:text-5xl">
          にっぽん探検たい
        </h1>
        <p className="mb-10 text-base text-gray-600">
          都道府県・世界の国・地図記号・産業・歴史・公民
          <br />
          学年に関係なく、好きなテーマから学べるよ！
        </p>

        <Link
          href="/map"
          className="inline-flex min-h-14 w-full max-w-xs items-center justify-center rounded-2xl bg-orange-400 px-8 text-xl font-bold text-white shadow-lg transition hover:bg-orange-500 active:scale-[0.98]"
        >
          探検マップへ
        </Link>

        <p className="mt-8 text-sm text-gray-500">
          クリア済み: {clearedTopics.length} / {TOPICS.length} テーマ
        </p>
      </div>
    </main>
  );
}
