"use client";

interface BrushBatsuOverlayProps {
  show: boolean;
}

/** 不正解時に画面中央へ毛筆でバツを描くオーバーレイ */
export function BrushBatsuOverlay({ show }: BrushBatsuOverlayProps) {
  if (!show) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
      aria-hidden
    >
      <svg
        viewBox="0 0 200 200"
        className="h-[min(72vw,320px)] w-[min(72vw,320px)] animate-brush-batsu-pop"
        role="img"
        aria-label="不正解"
      >
        {/* にじみ・墨のにごり（左上→右下） */}
        <path
          d="M 46 54 C 78 86, 122 114, 154 146"
          fill="none"
          stroke="#b71c1c"
          strokeWidth="18"
          strokeLinecap="round"
          opacity="0.18"
          pathLength={1}
          className="brush-batsu-ink-1"
        />
        {/* にじみ・墨のにごり（右上→左下） */}
        <path
          d="M 154 54 C 122 86, 78 114, 46 146"
          fill="none"
          stroke="#b71c1c"
          strokeWidth="18"
          strokeLinecap="round"
          opacity="0.18"
          pathLength={1}
          className="brush-batsu-ink-2"
        />
        {/* メインの毛筆バツ（左上→右下） */}
        <path
          d="M 50 50 C 82 82, 118 118, 150 150"
          fill="none"
          stroke="#c62828"
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={1}
          className="brush-batsu-stroke-1"
        />
        {/* メインの毛筆バツ（右上→左下） */}
        <path
          d="M 150 50 C 118 82, 82 118, 50 150"
          fill="none"
          stroke="#c62828"
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={1}
          className="brush-batsu-stroke-2"
        />
        {/* 筆の勢い（左上の入り） */}
        <path
          d="M 42 58 C 36 50, 44 40, 54 46"
          fill="none"
          stroke="#c62828"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.55"
          pathLength={1}
          className="brush-batsu-tail-1"
        />
        {/* 筆の勢い（右上の入り） */}
        <path
          d="M 158 58 C 164 50, 156 40, 146 46"
          fill="none"
          stroke="#c62828"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.55"
          pathLength={1}
          className="brush-batsu-tail-2"
        />
      </svg>
    </div>
  );
}
