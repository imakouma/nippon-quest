"use client";

import { useRef, useState } from "react";
import type { SortItem } from "@/types/question";

interface SortOrderQuestionProps {
  items: SortItem[];
  order: string[];
  showResults: boolean;
  correctOrder: string[];
  disabled?: boolean;
  onMove: (fromIndex: number, toIndex: number) => void;
}

export function SortOrderQuestion({
  items,
  order,
  showResults,
  correctOrder,
  disabled = false,
  onMove,
}: SortOrderQuestionProps) {
  const itemMap = Object.fromEntries(items.map((i) => [i.id, i.text]));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const canInteract = !disabled && !showResults;

  const getItemClass = (id: string, index: number) => {
    if (!showResults) {
      if (draggingIndex === index) {
        return "border-sky-400 bg-sky-50 opacity-60 shadow-md";
      }
      if (selectedIndex === index) {
        return "border-sky-500 bg-sky-50 ring-2 ring-sky-300";
      }
      return "border-sky-300 bg-white hover:bg-sky-50";
    }
    return correctOrder[index] === id
      ? "border-emerald-500 bg-emerald-50"
      : "border-red-400 bg-red-50";
  };

  const handleItemTap = (index: number) => {
    if (!canInteract) return;
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    if (selectedIndex === null) {
      setSelectedIndex(index);
      return;
    }

    if (selectedIndex === index) {
      setSelectedIndex(null);
      return;
    }

    onMove(selectedIndex, index);
    setSelectedIndex(null);
  };

  const handleDragStart = (index: number) => {
    if (!canInteract) return;
    didDragRef.current = false;
    dragIndexRef.current = index;
    setDraggingIndex(index);
    setSelectedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!canInteract) return;
    e.preventDefault();

    const from = dragIndexRef.current;
    if (from === null || from === index) return;

    didDragRef.current = true;
    onMove(from, index);
    dragIndexRef.current = index;
    setDraggingIndex(index);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDraggingIndex(null);
  };

  return (
    <div className="mt-4 space-y-2">
      {canInteract && (
        <p className="text-sm font-semibold text-gray-600">
          ドラッグするか、2つの項目をタップして入れ替えよう
        </p>
      )}

      {order.map((id, index) => (
        <div
          key={id}
          draggable={canInteract}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          onClick={() => handleItemTap(index)}
          className={`flex min-h-14 cursor-grab items-center gap-2 rounded-xl border-2 px-3 transition-colors active:cursor-grabbing ${getItemClass(id, index)} ${canInteract ? "touch-manipulation select-none" : ""}`}
        >
          {canInteract && (
            <span
              className="flex shrink-0 flex-col gap-0.5 px-1 text-sky-400"
              aria-hidden
            >
              <span className="text-xs leading-none">⠿</span>
            </span>
          )}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
            {index + 1}
          </span>
          <span className="flex-1 text-base font-semibold">{itemMap[id]}</span>
        </div>
      ))}

      {canInteract && selectedIndex !== null && (
        <p className="text-center text-xs font-semibold text-sky-600">
          入れ替えたい場所の項目をタップしてね
        </p>
      )}
    </div>
  );
}
