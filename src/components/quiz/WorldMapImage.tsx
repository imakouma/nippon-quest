interface WorldMapImageProps {
  src: string;
  alt?: string;
}

/** 世界地図・地域地図（sekaitizu） */
export function WorldMapImage({
  src,
  alt = "地図",
}: WorldMapImageProps) {
  return (
    <div className="relative mx-auto mt-4 w-full rounded-2xl border-2 border-sky-200 bg-white p-2 shadow-inner">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="mx-auto block h-auto w-full max-h-[min(70vh,520px)] object-contain"
        draggable={false}
      />
    </div>
  );
}
