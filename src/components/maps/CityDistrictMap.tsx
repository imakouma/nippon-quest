/** 小学3年「身近な地域」向け 市の模式地図（地図記号つき） */
export function CityDistrictMap() {
  return (
    <svg
      viewBox="0 0 400 300"
      className="h-full w-full"
      role="img"
      aria-label="市の模式地図"
    >
      <rect width="400" height="300" fill="#f0fdf4" />

      {/* 凡例 */}
      <rect x="8" y="8" width="118" height="108" rx="6" fill="white" stroke="#94a3b8" strokeWidth="1.5" />
      <text x="16" y="24" fontSize="11" fontWeight="bold" fill="#334155">
        凡例
      </text>
      <text x="36" y="42" fontSize="10" fill="#334155">
        市 … 市役所
      </text>
      <rect x="16" y="32" width="14" height="14" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
      <text x="16" y="44" fontSize="9" fontWeight="bold" fill="#92400e">
        市
      </text>
      <text x="36" y="58" fontSize="10" fill="#334155">
        図 … 図書館
      </text>
      <rect x="16" y="48" width="14" height="14" fill="#dbeafe" stroke="#2563eb" strokeWidth="1" />
      <text x="16" y="60" fontSize="9" fontWeight="bold" fill="#1e40af">
        図
      </text>
      <text x="36" y="74" fontSize="10" fill="#334155">
        文 … 小学校
      </text>
      <rect x="16" y="64" width="14" height="14" fill="#fce7f3" stroke="#db2777" strokeWidth="1" />
      <text x="16" y="76" fontSize="9" fontWeight="bold" fill="#9d174d">
        文
      </text>
      <text x="36" y="90" fontSize="10" fill="#334155">
        田 … 田んぼ
      </text>
      <rect x="16" y="80" width="14" height="10" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1" />
      <text x="36" y="106" fontSize="10" fill="#334155">
        工 … 工場
      </text>
      <rect x="16" y="96" width="14" height="12" fill="#e5e7eb" stroke="#4b5563" strokeWidth="1" />
      <text x="16" y="106" fontSize="8" fontWeight="bold" fill="#374151">
        工
      </text>

      {/* 方位 */}
      <g transform="translate(370, 28)">
        <polygon points="0,-14 8,6 -8,6" fill="#ef4444" />
        <text x="0" y="-18" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ef4444">
          N
        </text>
      </g>

      {/* 河川 */}
      <path
        d="M 60 300 Q 120 200 200 160 Q 280 120 340 40"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* 北部：田んぼ */}
      <g>
        <rect x="60" y="24" width="280" height="70" rx="8" fill="#dcfce7" stroke="#86efac" strokeWidth="2" />
        <text x="200" y="48" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#166534">
          北部（田んぼ）
        </text>
        {[90, 150, 210, 270].map((x) => (
          <g key={x}>
            <rect x={x} y="56" width="36" height="22" fill="#bbf7d0" stroke="#22c55e" strokeWidth="1" />
            <text x={x + 18} y="71" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#15803d">
              田
            </text>
          </g>
        ))}
      </g>

      {/* 中心部：公共施設 */}
      <g>
        <rect x="80" y="108" width="240" height="84" rx="8" fill="#fef9c3" stroke="#facc15" strokeWidth="2" />
        <text x="200" y="128" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#a16207">
          中心部（公共施設）
        </text>
        <rect x="110" y="138" width="36" height="36" rx="4" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
        <text x="128" y="161" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#92400e">
          市
        </text>
        <text x="128" y="182" textAnchor="middle" fontSize="8" fill="#78350f">
          市役所
        </text>
        <rect x="162" y="138" width="36" height="36" rx="4" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
        <text x="180" y="161" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e40af">
          図
        </text>
        <text x="180" y="182" textAnchor="middle" fontSize="8" fill="#1e3a8a">
          図書館
        </text>
        <rect x="254" y="138" width="36" height="36" rx="4" fill="#fce7f3" stroke="#db2777" strokeWidth="2" />
        <text x="272" y="161" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#9d174d">
          文
        </text>
        <text x="272" y="182" textAnchor="middle" fontSize="8" fill="#831843">
          小学校
        </text>
      </g>

      {/* 南部：住宅 */}
      <g>
        <rect x="60" y="206" width="200" height="80" rx="8" fill="#fff1f2" stroke="#fda4af" strokeWidth="2" />
        <text x="160" y="226" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#be123c">
          南部（住宅）
        </text>
        {[90, 140, 190].map((x, i) => (
          <g key={x} transform={`translate(${x}, 238)`}>
            <polygon points="0,0 14,-12 28,0" fill="#fca5a5" stroke="#e11d48" strokeWidth="1" />
            <rect x="4" y="0" width="20" height="18" fill="#fecdd3" stroke="#e11d48" strokeWidth="1" />
          </g>
        ))}
      </g>

      {/* 東部：工場 */}
      <g>
        <rect x="276" y="108" width="108" height="178" rx="8" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="2" />
        <text x="330" y="128" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#374151">
          東部（工場）
        </text>
        <rect x="296" y="148" width="68" height="48" fill="#d1d5db" stroke="#4b5563" strokeWidth="2" />
        <text x="330" y="178" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1f2937">
          工
        </text>
        <rect x="348" y="140" width="10" height="28" fill="#9ca3af" stroke="#4b5563" strokeWidth="1" />
        <ellipse cx="353" cy="136" rx="8" ry="5" fill="#e5e7eb" opacity="0.8" />
        <ellipse cx="360" cy="130" rx="6" ry="4" fill="#e5e7eb" opacity="0.6" />
      </g>

      {/* 道路 */}
      <line x1="200" y1="94" x2="200" y2="206" stroke="#fbbf24" strokeWidth="4" strokeDasharray="8 4" />
      <line x1="80" y1="150" x2="320" y2="150" stroke="#fbbf24" strokeWidth="4" strokeDasharray="8 4" />
    </svg>
  );
}
