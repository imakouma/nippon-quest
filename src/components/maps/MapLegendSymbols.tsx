/** 地図記号のみを大きく表示（4択問題の補助用） */
export function MapLegendSymbols() {
  const symbols = [
    { char: "文", label: "小学校", bg: "#fce7f3", border: "#db2777", color: "#9d174d" },
    { char: "市", label: "市役所", bg: "#fef3c7", border: "#d97706", color: "#92400e" },
    { char: "図", label: "図書館", bg: "#dbeafe", border: "#2563eb", color: "#1e40af" },
    { char: "田", label: "田んぼ", bg: "#bbf7d0", border: "#16a34a", color: "#15803d" },
    { char: "工", label: "工場", bg: "#e5e7eb", border: "#4b5563", color: "#374151" },
  ];

  return (
    <div className="mt-4 grid grid-cols-5 gap-2 rounded-xl border-2 border-slate-200 bg-white p-3">
      {symbols.map((s) => (
        <div key={s.char} className="flex flex-col items-center gap-1">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg border-2 text-lg font-black"
            style={{
              backgroundColor: s.bg,
              borderColor: s.border,
              color: s.color,
            }}
          >
            {s.char}
          </div>
          <span className="text-center text-[10px] font-semibold text-gray-600">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
