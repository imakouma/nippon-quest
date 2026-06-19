/**
 * japan-prefectures.png（640×640）上のタップ位置（%）
 * 画像の色分け領域の重心から算出
 */
export const JAPAN_PIN = {
  hokkaido: { id: "hokkaido", label: "北海道", x: 76, y: 15 },
  tohoku: { id: "tohoku", label: "東北", x: 64, y: 45 },
  kanto: { id: "kanto", label: "関東", x: 60, y: 63 },
  chubu: { id: "chubu", label: "中部", x: 50, y: 63 },
  kinki: { id: "kinki", label: "近畿", x: 42, y: 67 },
  honshu: { id: "honshu", label: "本州", x: 62, y: 50 },
  shikoku: { id: "shikoku", label: "四国", x: 27, y: 79 },
  kyushu: { id: "kyushu", label: "九州", x: 15, y: 85 },
  okinawa: { id: "okinawa", label: "沖縄", x: 72, y: 88 },
} as const;
