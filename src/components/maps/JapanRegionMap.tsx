interface JapanRegionMapProps {
  mode?: "prefectures" | "islands" | "regions";
  highlightIds?: string[];
}

const JAPAN_MAP_SRC = "/maps/japan-prefectures.png";

/** 都道府県カラー地図（640×640） */
export function JapanRegionMap({
  mode = "prefectures",
}: JapanRegionMapProps) {
  return (
    <div className="relative h-full w-full bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={JAPAN_MAP_SRC}
        alt="日本地図（47都道府県）"
        className="h-full w-full object-contain"
        draggable={false}
      />
      {mode === "islands" && (
        <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[10px] font-medium text-white/80">
          北海道・本州・四国・九州・沖縄
        </p>
      )}
    </div>
  );
}
