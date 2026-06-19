interface PrefectureShapeImageProps {
  src: string;
  alt?: string;
}

/** 都道府県の形イラスト（下部の県名は加工済みで非表示） */
export function PrefectureShapeImage({
  src,
  alt = "都道府県の形",
}: PrefectureShapeImageProps) {
  return (
    <div className="relative mx-auto mt-4 w-full max-w-sm rounded-2xl border-2 border-amber-200 bg-white p-2 shadow-inner">
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
