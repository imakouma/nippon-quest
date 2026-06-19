"use client";

import type { MapConfig } from "@/types/question";
import { MapCanvas } from "@/components/maps/MapCanvas";

interface MapPinQuestionProps {
  map: MapConfig;
  selectedId: string | null;
  correctId?: string;
  showResults: boolean;
  disabled?: boolean;
  onSelect: (regionId: string) => void;
}

export function MapPinQuestion({
  map,
  selectedId,
  correctId,
  showResults,
  disabled = false,
  onSelect,
}: MapPinQuestionProps) {
  const getPinClass = (regionId: string) => {
    if (!showResults) {
      return selectedId === regionId
        ? "bg-sky-500 ring-4 ring-sky-300 scale-110"
        : "bg-orange-400 hover:bg-orange-500 hover:scale-105";
    }
    if (regionId === correctId) return "bg-emerald-500 ring-4 ring-emerald-300";
    if (regionId === selectedId) return "bg-red-500 ring-4 ring-red-300";
    return "bg-gray-300 opacity-60";
  };

  const isJapanMap = map.map_id?.startsWith("japan");

  return (
    <div
      className={`relative mx-auto mt-4 w-full max-w-md overflow-hidden rounded-2xl border-2 border-sky-200 shadow-inner ${
        isJapanMap ? "aspect-square bg-black" : "aspect-[4/3] bg-sky-50"
      }`}
    >
      {map.map_id ? (
        <MapCanvas mapId={map.map_id} />
      ) : (
        <div className="flex h-full items-center justify-center p-4 text-center text-sm text-gray-500">
          地図を読み込めませんでした
        </div>
      )}
      {map.regions.map((region) => (
        <button
          key={region.id}
          type="button"
          disabled={disabled || showResults}
          onClick={() => onSelect(region.id)}
          style={{ left: `${region.x}%`, top: `${region.y}%` }}
          className={`absolute z-10 flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg transition-all ${getPinClass(region.id)}`}
          aria-label={region.label}
          title={region.label}
        >
          📍
        </button>
      ))}
      <div className="absolute bottom-1 left-1 right-1 flex flex-wrap justify-center gap-1 px-1">
        {map.regions.map((r) => (
          <span
            key={r.id}
            className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-gray-700 shadow-sm backdrop-blur-sm"
          >
            {r.label}
          </span>
        ))}
      </div>
    </div>
  );
}
