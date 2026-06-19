"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { QuizView } from "@/components/quiz/QuizView";
import { useQuizStore } from "@/store/quizStore";
import { useProgressStore } from "@/store/progressStore";
import type { Question } from "@/types/question";
import { resolveTopicId } from "@/data/topics";
import { getQuestionsByTopic } from "@/data/questions/index";
import { normalizeQuestions } from "@/utils/normalizeQuestion";

function mapConvexQuestions(rows: unknown[]): Question[] {
  return normalizeQuestions(JSON.parse(JSON.stringify(rows)) as Question[]);
}

function loadBundledQuestions(unitId: string): Question[] {
  return normalizeQuestions(getQuestionsByTopic(unitId));
}

/** アプリ内の問題データを優先し、なければ Convex / JSON にフォールバック */
function resolveQuizQuestions(
  unitId: string,
  convexQuestions: unknown[] | undefined,
): Question[] {
  const bundled = loadBundledQuestions(unitId);
  if (bundled.length > 0) return bundled;

  if (convexQuestions && convexQuestions.length > 0) {
    return mapConvexQuestions(convexQuestions);
  }

  return [];
}

function QuizWithConvex({ unitId }: { unitId: string }) {
  const router = useRouter();
  const convexQuestions = useQuery(api.questions.getByUnit, { unitId });
  const syncUnit = useMutation(api.questions.syncUnit);
  const syncedRef = useRef(false);
  const startedRef = useRef(false);

  const questions = useMemo(
    () => resolveQuizQuestions(unitId, convexQuestions),
    [unitId, convexQuestions],
  );

  const reset = useQuizStore((s) => s.reset);
  const startSession = useQuizStore((s) => s.startSession);
  const phase = useQuizStore((s) => s.phase);
  const session = useQuizStore((s) => s.session);
  const completeUnit = useProgressStore((s) => s.completeUnit);

  useEffect(() => {
    reset();
    startedRef.current = false;
    syncedRef.current = false;
  }, [unitId, reset]);

  useEffect(() => {
    if (syncedRef.current) return;
    if (questions.length === 0) return;

    syncedRef.current = true;
    syncUnit({ unitId }).catch(() => {
      syncedRef.current = false;
    });
  }, [questions.length, syncUnit, unitId]);

  useEffect(() => {
    if (startedRef.current) return;
    if (questions.length === 0) return;

    startedRef.current = true;
    startSession(unitId, questions);
  }, [questions, startSession, unitId]);

  useEffect(() => {
    if (phase !== "finished" || !session || session.unitId !== unitId) return;

    const total = session.questions.length;
    const correctCount = total - session.wrongIds.length;
    const score = Math.round((correctCount / total) * 100);
    completeUnit(session.unitId, score);

    const query = new URLSearchParams({
      unitId: session.unitId,
      total: String(total),
      correct: String(correctCount),
      wrong: session.wrongIds.join(","),
    });
    router.push(`/result?${query.toString()}`);
  }, [phase, session, unitId, completeUnit, router]);

  if (questions.length === 0 && convexQuestions === undefined) {
    return <LoadingState />;
  }

  if (questions.length === 0) {
    return <LoadingState message="問題を準備中..." />;
  }

  if (!session || session.unitId !== unitId) {
    return <LoadingState />;
  }

  return <QuizView />;
}

async function fetchQuestionsFromJson(topicId: string): Promise<Question[]> {
  const bundled = loadBundledQuestions(topicId);
  if (bundled.length > 0) return bundled;

  const res = await fetch(`/data/questions/${topicId}.json`);
  if (!res.ok) {
    throw new Error("Failed to load questions");
  }
  const data = (await res.json()) as { questions: Question[] };
  return normalizeQuestions(data.questions);
}

function QuizWithJson({ unitId }: { unitId: string }) {
  const router = useRouter();
  const [loadError, setLoadError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const reset = useQuizStore((s) => s.reset);
  const startSession = useQuizStore((s) => s.startSession);
  const phase = useQuizStore((s) => s.phase);
  const session = useQuizStore((s) => s.session);
  const completeUnit = useProgressStore((s) => s.completeUnit);

  useEffect(() => {
    reset();
    startedRef.current = false;
    setLoadError(null);
  }, [unitId, reset]);

  useEffect(() => {
    if (startedRef.current) return;

    fetchQuestionsFromJson(unitId)
      .then((questions) => {
        if (questions.length === 0) {
          setLoadError("この単元の問題がまだありません");
          return;
        }
        startedRef.current = true;
        startSession(unitId, questions);
      })
      .catch(() => setLoadError("問題の読み込みに失敗しました"));
  }, [startSession, unitId]);

  useEffect(() => {
    if (phase !== "finished" || !session || session.unitId !== unitId) return;

    const total = session.questions.length;
    const correctCount = total - session.wrongIds.length;
    const score = Math.round((correctCount / total) * 100);
    completeUnit(session.unitId, score);

    const query = new URLSearchParams({
      unitId: session.unitId,
      total: String(total),
      correct: String(correctCount),
      wrong: session.wrongIds.join(","),
    });
    router.push(`/result?${query.toString()}`);
  }, [phase, session, unitId, completeUnit, router]);

  if (loadError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-red-600">{loadError}</p>
        <button
          type="button"
          onClick={() => router.push("/map")}
          className="rounded-xl bg-sky-500 px-6 py-3 font-bold text-white"
        >
          探検マップへ
        </button>
      </main>
    );
  }

  if (!session || session.unitId !== unitId) {
    return <LoadingState />;
  }

  return <QuizView />;
}

function LoadingState({ message = "問題を読み込み中..." }: { message?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-lg font-semibold text-sky-700">{message}</p>
    </main>
  );
}

export function QuizPageClient({ unitId: rawId }: { unitId: string }) {
  const topicId = resolveTopicId(rawId);
  const hasConvex = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

  if (!topicId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-red-600">テーマが見つかりません</p>
      </main>
    );
  }

  if (topicId === "prefectures") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-gray-700">
          都道府県は「位置」「形」「県庁所在地」から選んで学べます
        </p>
        <Link
          href="/topics/prefectures"
          className="rounded-xl bg-sky-500 px-6 py-3 font-bold text-white"
        >
          都道府県メニューへ
        </Link>
      </main>
    );
  }

  if (topicId === "prefectures-shape") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-gray-700">
          都道府県の形は6つのエリアに分かれています
        </p>
        <Link
          href="/topics/prefectures/shape"
          className="rounded-xl bg-amber-500 px-6 py-3 font-bold text-white"
        >
          形のメニューへ
        </Link>
      </main>
    );
  }

  if (topicId === "prefectures-capital") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-gray-700">
          県庁所在地は6つのエリアに分かれています
        </p>
        <Link
          href="/topics/prefectures/capital"
          className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white"
        >
          県庁所在地のメニューへ
        </Link>
      </main>
    );
  }

  if (topicId === "industry") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-gray-700">
          産業は「農業」「水産業」「工業」から選んで学べます
        </p>
        <Link
          href="/topics/industry"
          className="rounded-xl bg-violet-500 px-6 py-3 font-bold text-white"
        >
          産業メニューへ
        </Link>
      </main>
    );
  }

  if (topicId === "history-jomon-yayoi") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-gray-700">
          縄文・弥生時代は「縄文時代」「弥生時代」から選んで学べます
        </p>
        <Link
          href="/topics/history/jomon-yayoi"
          className="rounded-xl bg-amber-500 px-6 py-3 font-bold text-white"
        >
          縄文・弥生時代メニューへ
        </Link>
      </main>
    );
  }

  if (topicId === "history-kofun-asuka") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-gray-700">
          古墳・飛鳥時代は「古墳時代」「飛鳥時代」から選んで学べます
        </p>
        <Link
          href="/topics/history/kofun-asuka"
          className="rounded-xl bg-rose-500 px-6 py-3 font-bold text-white"
        >
          古墳・飛鳥時代メニューへ
        </Link>
      </main>
    );
  }

  if (topicId === "history-nara-heian") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-gray-700">
          奈良・平安時代は「奈良時代」「平安時代」から選んで学べます
        </p>
        <Link
          href="/topics/history/nara-heian"
          className="rounded-xl bg-fuchsia-500 px-6 py-3 font-bold text-white"
        >
          奈良・平安時代メニューへ
        </Link>
      </main>
    );
  }

  if (topicId === "history-muromachi-sengoku") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-gray-700">
          室町・戦国時代は「室町時代」「戦国時代」から選んで学べます
        </p>
        <Link
          href="/topics/history/muromachi-sengoku"
          className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white"
        >
          室町・戦国時代メニューへ
        </Link>
      </main>
    );
  }

  if (topicId === "history-meiji-taisho") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-gray-700">
          明治・大正時代は「明治時代」「大正時代」から選んで学べます
        </p>
        <Link
          href="/topics/history/meiji-taisho"
          className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white"
        >
          明治・大正時代メニューへ
        </Link>
      </main>
    );
  }

  if (topicId === "history") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-gray-700">
          歴史は10の時代区分から選んで学べます
        </p>
        <Link
          href="/topics/history"
          className="rounded-xl bg-rose-500 px-6 py-3 font-bold text-white"
        >
          歴史メニューへ
        </Link>
      </main>
    );
  }

  if (topicId === "civics") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-gray-700">
          公民は「憲法」「政治や選挙」から選んで学べます
        </p>
        <Link
          href="/topics/civics"
          className="rounded-xl bg-indigo-500 px-6 py-3 font-bold text-white"
        >
          公民メニューへ
        </Link>
      </main>
    );
  }

  if (hasConvex) {
    return <QuizWithConvex unitId={topicId} />;
  }

  return <QuizWithJson unitId={topicId} />;
}
