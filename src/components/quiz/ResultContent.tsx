"use client";

import { useEffect } from "react";
import Link from "next/link";
import { getUnitLabel } from "@/data/topics";
import {
  isPrefectureCapitalGroupId,
  isPrefectureQuizUnitId,
  isPrefectureShapeGroupId,
} from "@/data/prefectureModes";
import { isIndustryQuizUnitId } from "@/data/industryModes";
import {
  isHistoryJomonYayoiGroupId,
  isHistoryKofunAsukaGroupId,
  isHistoryNaraHeianGroupId,
  isHistoryMuromachiSengokuGroupId,
  isHistoryMeijiTaishoGroupId,
  isHistoryQuizUnitId,
} from "@/data/historyModes";
import { isCivicsQuizUnitId } from "@/data/civicsModes";
import { getQuizHref } from "@/utils/quizHref";
import { useProgressStore } from "@/store/progressStore";
import { useQuizStore } from "@/store/quizStore";

type ResultContentProps = {
  unitId: string;
  total: string;
  correct: string;
  wrong: string;
};

export function ResultContent({
  unitId,
  total: totalStr,
  correct: correctStr,
  wrong,
}: ResultContentProps) {
  const reset = useQuizStore((s) => s.reset);

  useEffect(() => {
    reset();
  }, [reset]);

  const wrongQuestions = useProgressStore((s) => s.wrongQuestions);

  const unitLabel = getUnitLabel(unitId);
  const resultBackHref = isPrefectureShapeGroupId(unitId)
    ? "/topics/prefectures/shape"
    : isPrefectureCapitalGroupId(unitId)
      ? "/topics/prefectures/capital"
      : isPrefectureQuizUnitId(unitId)
        ? "/topics/prefectures"
        : isIndustryQuizUnitId(unitId)
          ? "/topics/industry"
        : isHistoryJomonYayoiGroupId(unitId)
          ? "/topics/history/jomon-yayoi"
        : isHistoryKofunAsukaGroupId(unitId)
          ? "/topics/history/kofun-asuka"
        : isHistoryNaraHeianGroupId(unitId)
          ? "/topics/history/nara-heian"
        : isHistoryMuromachiSengokuGroupId(unitId)
          ? "/topics/history/muromachi-sengoku"
        : isHistoryMeijiTaishoGroupId(unitId)
          ? "/topics/history/meiji-taisho"
          : isHistoryQuizUnitId(unitId)
            ? "/topics/history"
            : isCivicsQuizUnitId(unitId)
              ? "/topics/civics"
              : "/map";
  const total = Number(totalStr);
  const correct = Number(correctStr);
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const sessionWrongIds = wrong.split(",").filter(Boolean);
  const isPerfect = total > 0 && correct === total;
  const hasWrong = sessionWrongIds.length > 0;
  const reviewCount = sessionWrongIds.length || wrongQuestions.length;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 via-sky-50 to-amber-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border-2 border-emerald-200 bg-white p-8 text-center shadow-lg">
        <p className="text-5xl">🏆</p>
        <h1
          className={`mt-4 text-3xl font-black ${
            isPerfect ? "text-emerald-600" : "text-sky-600"
          }`}
        >
          {isPerfect ? "クリア！" : "おつかれさま！"}
        </h1>
        <p className="mt-2 text-gray-600">
          {unitLabel.emoji} {unitLabel.title}
          {unitLabel.subtitle ? ` › ${unitLabel.subtitle}` : ""}
        </p>

        <div className="mt-8 space-y-3 rounded-2xl bg-sky-50 p-5">
          <p className="text-lg">
            正解数:{" "}
            <span className="text-2xl font-black text-sky-700">
              {correct} / {total}
            </span>
          </p>
          <p className="text-lg">
            スコア:{" "}
            <span className="text-2xl font-black text-orange-500">
              {score}点
            </span>
          </p>
        </div>

        {hasWrong && (
          <Link
            href={getQuizHref(unitId)}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 font-bold text-amber-800 transition hover:bg-amber-100"
          >
            復習リスト ({reviewCount}問)
          </Link>
        )}

        <Link
          href={resultBackHref}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-3 font-bold text-white transition hover:bg-sky-600 active:scale-[0.98]"
        >
          {isPrefectureShapeGroupId(unitId)
            ? "形のメニューへ"
            : isPrefectureCapitalGroupId(unitId)
              ? "県庁所在地のメニューへ"
              : isPrefectureQuizUnitId(unitId)
                ? "都道府県メニューへ"
                : isIndustryQuizUnitId(unitId)
                  ? "産業メニューへ"
                : isHistoryJomonYayoiGroupId(unitId)
                  ? "縄文・弥生時代メニューへ"
                : isHistoryKofunAsukaGroupId(unitId)
                  ? "古墳・飛鳥時代メニューへ"
                : isHistoryNaraHeianGroupId(unitId)
                  ? "奈良・平安時代メニューへ"
                : isHistoryMuromachiSengokuGroupId(unitId)
                  ? "室町・戦国時代メニューへ"
                : isHistoryMeijiTaishoGroupId(unitId)
                  ? "明治・大正時代メニューへ"
                  : isHistoryQuizUnitId(unitId)
                    ? "歴史メニューへ"
                    : isCivicsQuizUnitId(unitId)
                      ? "公民メニューへ"
                      : "探検マップへ"}
        </Link>
      </div>
    </main>
  );
}
