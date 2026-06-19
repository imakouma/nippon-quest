interface MapSymbolImageProps {
  src: string;
  alt?: string;
}

/** 地図記号カード（tizukigou） */
export function MapSymbolImage({
  src,
  alt = "地図記号",
}: MapSymbolImageProps) {
  return (
    <div className="relative mx-auto mt-4 w-full max-w-xs rounded-2xl border-2 border-amber-200 bg-white p-3 shadow-inner">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="mx-auto block h-auto w-full object-contain"
        draggable={false}
      />
    </div>
  );
}
