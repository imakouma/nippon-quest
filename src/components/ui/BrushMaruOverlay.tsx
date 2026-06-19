"use client";

interface BrushMaruOverlayProps {
  show: boolean;
}

/** 正解時に画面中央へ毛筆で丸を描くオーバーレイ */
export function BrushMaruOverlay({ show }: BrushMaruOverlayProps) {
  if (!show) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
      aria-hidden
    >
      <svg
        viewBox="0 0 200 200"
        className="h-[min(72vw,320px)] w-[min(72vw,320px)] animate-brush-maru-pop"
        role="img"
        aria-label="正解"
      >
        {/* にじみ・墨のにごり */}
        <path
          d="M 104 16 C 158 12, 192 54, 188 104 C 184 154, 146 190, 96 186 C 46 182, 10 144, 14 94 C 18 44, 52 18, 104 16 Z"
          fill="none"
          stroke="#b71c1c"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.18"
          pathLength={1}
          className="brush-maru-ink"
        />
        {/* メインの毛筆丸 */}
        <path
          d="M 102 20 C 152 17, 186 56, 183 102 C 180 148, 142 184, 98 181 C 54 178, 18 140, 21 96 C 24 52, 56 22, 102 20 Z"
          fill="none"
          stroke="#c62828"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className="brush-maru-stroke"
        />
        {/* 筆の勢い（右上の入り） */}
        <path
          d="M 138 28 C 152 24, 168 36, 162 48"
          fill="none"
          stroke="#c62828"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.55"
          pathLength={1}
          className="brush-maru-tail"
        />
      </svg>
    </div>
  );
}
