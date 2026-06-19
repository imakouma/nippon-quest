"use client";

import { useEffect, useState } from "react";
import type { HistorySlide } from "@/types/question";

interface HistoryIntroAnimationProps {
  title: string;
  description?: string;
  slides: HistorySlide[];
  onComplete?: () => void;
}

export function HistoryIntroAnimation({
  title,
  description,
  slides,
  onComplete,
}: HistoryIntroAnimationProps) {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) return;
    if (index >= slides.length - 1) {
      const timer = setTimeout(() => {
        setFinished(true);
        onComplete?.();
      }, 2800);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setIndex((i) => i + 1), 2800);
    return () => clearTimeout(timer);
  }, [index, slides.length, finished, onComplete]);

  const slide = slides[index];

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-amber-50">
      <div className="border-b border-indigo-100 bg-indigo-100/60 px-4 py-2">
        <p className="text-xs font-bold text-indigo-700">📽 歴史紹介</p>
        <p className="font-bold text-indigo-900">{title}</p>
        {description && (
          <p className="text-sm text-indigo-700">{description}</p>
        )}
      </div>
      <div
        key={index}
        className="animate-slide-up space-y-2 px-4 py-5"
      >
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-bold text-white">
            {slide.era}
          </span>
          <span className="text-sm font-semibold text-gray-600">
            {slide.period}
          </span>
        </div>
        <p className="text-lg font-black text-gray-800">{slide.headline}</p>
        <p className="leading-relaxed text-gray-600">{slide.detail}</p>
        <div className="flex gap-1 pt-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i <= index ? "bg-indigo-400" : "bg-indigo-100"
              }`}
            />
          ))}
        </div>
      </div>
      {finished && (
        <p className="border-t border-indigo-100 px-4 py-2 text-center text-sm font-bold text-emerald-700">
          ✓ 紹介を見終わりました。下の問題に答えよう！
        </p>
      )}
    </div>
  );
}
