import { getQuizHref } from "@/utils/quizHref";

export type PrefectureModeId =
  | "prefectures-location"
  | "prefectures-shape"
  | "prefectures-capital";

export type PrefectureShapeGroupId =
  | "prefectures-shape-1"
  | "prefectures-shape-2"
  | "prefectures-shape-3"
  | "prefectures-shape-4"
  | "prefectures-shape-5"
  | "prefectures-shape-6";

export type PrefectureCapitalGroupId =
  | "prefectures-capital-1"
  | "prefectures-capital-2"
  | "prefectures-capital-3"
  | "prefectures-capital-4"
  | "prefectures-capital-5"
  | "prefectures-capital-6";

export type PrefectureQuizUnitId =
  | "prefectures-location"
  | PrefectureShapeGroupId
  | PrefectureCapitalGroupId;

export interface PrefectureMode {
  id: PrefectureModeId;
  title: string;
  description: string;
  emoji: string;
  color: string;
  href: string;
}

export interface PrefectureRegionGroup {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  shapeIds: string[];
}

export type PrefectureShapeGroup = PrefectureRegionGroup & {
  id: PrefectureShapeGroupId;
};

export type PrefectureCapitalGroup = PrefectureRegionGroup & {
  id: PrefectureCapitalGroupId;
};

/** 都道府県テーマの3つの学習モード（MVP） */
export const PREFECTURE_MODES: PrefectureMode[] = [
  {
    id: "prefectures-location",
    title: "位置",
    description: "地方や島の位置を地図で覚えよう",
    emoji: "📍",
    color: "from-sky-400 to-blue-500",
    href: getQuizHref("prefectures-location"),
  },
  {
    id: "prefectures-shape",
    title: "形",
    description: "都道府県の形を6つのエリアに分けて覚えよう",
    emoji: "🔷",
    color: "from-amber-400 to-orange-500",
    href: "/topics/prefectures/shape",
  },
  {
    id: "prefectures-capital",
    title: "県庁所在地",
    description: "県庁所在地を6つのエリアに分けて覚えよう",
    emoji: "🏙️",
    color: "from-emerald-400 to-teal-500",
    href: "/topics/prefectures/capital",
  },
];

/** 都道府県「形」を6つに分割（地域別） */
export const PREFECTURE_SHAPE_GROUPS: PrefectureShapeGroup[] = [
  {
    id: "prefectures-shape-1",
    title: "北海道・東北",
    description: "北海道と東北6県の形",
    emoji: "❄️",
    color: "from-cyan-400 to-blue-500",
    shapeIds: [
      "hokkaidou",
      "aomoriken",
      "iwateken",
      "miyagiken",
      "akitaken",
      "yamagataken",
      "fukushimaken",
    ],
  },
  {
    id: "prefectures-shape-2",
    title: "関東",
    description: "関東7都県の形",
    emoji: "🗼",
    color: "from-rose-400 to-pink-500",
    shapeIds: [
      "ibarakiken",
      "tochigiken",
      "gunmaken",
      "saitamaken",
      "chibaken",
      "toukyouto",
      "kanagawaken",
    ],
  },
  {
    id: "prefectures-shape-3",
    title: "中部",
    description: "中部9県の形",
    emoji: "🏔️",
    color: "from-violet-400 to-purple-500",
    shapeIds: [
      "niigataken",
      "toyamaken",
      "ishikawaken",
      "fukuiken",
      "yamanashiken",
      "naganoken",
      "gifuken",
      "shizuokaken",
      "aichiken",
    ],
  },
  {
    id: "prefectures-shape-4",
    title: "近畿",
    description: "近畿7府県の形",
    emoji: "⛩️",
    color: "from-amber-400 to-orange-500",
    shapeIds: [
      "mieken",
      "shigaken",
      "kyoutofu",
      "oosakafu",
      "hyougoken",
      "naraken",
      "wakayamaken",
    ],
  },
  {
    id: "prefectures-shape-5",
    title: "中国・四国",
    description: "中国5県と四国4県の形",
    emoji: "🌊",
    color: "from-teal-400 to-emerald-500",
    shapeIds: [
      "tottoriken",
      "shimaneken",
      "okayamaken",
      "hiroshimaken",
      "yamaguchiken",
      "tokushimaken",
      "kagawaken",
      "ehimeken",
      "kouchiken",
    ],
  },
  {
    id: "prefectures-shape-6",
    title: "九州・沖縄",
    description: "九州7県と沖縄県の形",
    emoji: "🌺",
    color: "from-red-400 to-orange-500",
    shapeIds: [
      "fukuokaken",
      "sagaken",
      "nagasakiken",
      "kumamotoken",
      "ooitaken",
      "miyazakiken",
      "kagoshimaken",
      "okinawaken",
    ],
  },
];

/** 都道府県「県庁所在地」を6つに分割（形と同じ地域区分） */
export const PREFECTURE_CAPITAL_GROUPS: PrefectureCapitalGroup[] =
  PREFECTURE_SHAPE_GROUPS.map((group, index) => ({
    id: `prefectures-capital-${index + 1}` as PrefectureCapitalGroupId,
    title: group.title,
    description: `${group.title}の県庁所在地`,
    emoji: group.emoji,
    color: group.color,
    shapeIds: group.shapeIds,
  }));

/** クイズとして出題する都道府県ユニット（形・県庁所在地は6分割） */
export const PREFECTURE_QUIZ_UNITS: PrefectureQuizUnitId[] = [
  "prefectures-location",
  ...PREFECTURE_SHAPE_GROUPS.map((g) => g.id),
  ...PREFECTURE_CAPITAL_GROUPS.map((g) => g.id),
];

export function isPrefectureModeId(id: string): id is PrefectureModeId {
  return PREFECTURE_MODES.some((m) => m.id === id);
}

export function isPrefectureShapeGroupId(
  id: string,
): id is PrefectureShapeGroupId {
  return PREFECTURE_SHAPE_GROUPS.some((g) => g.id === id);
}

export function isPrefectureCapitalGroupId(
  id: string,
): id is PrefectureCapitalGroupId {
  return PREFECTURE_CAPITAL_GROUPS.some((g) => g.id === id);
}

export function isPrefectureQuizUnitId(
  id: string,
): id is PrefectureQuizUnitId {
  return PREFECTURE_QUIZ_UNITS.includes(id as PrefectureQuizUnitId);
}

export function getPrefectureModeById(
  id: string,
): PrefectureMode | undefined {
  return PREFECTURE_MODES.find((m) => m.id === id);
}

export function getPrefectureShapeGroupById(
  id: string,
): PrefectureShapeGroup | undefined {
  return PREFECTURE_SHAPE_GROUPS.find((g) => g.id === id);
}

export function getPrefectureCapitalGroupById(
  id: string,
): PrefectureCapitalGroup | undefined {
  return PREFECTURE_CAPITAL_GROUPS.find((g) => g.id === id);
}

export function isPrefectureShapeModeComplete(
  completedUnits: string[],
): boolean {
  return PREFECTURE_SHAPE_GROUPS.every((g) => completedUnits.includes(g.id));
}

export function isPrefectureCapitalModeComplete(
  completedUnits: string[],
): boolean {
  return PREFECTURE_CAPITAL_GROUPS.every((g) => completedUnits.includes(g.id));
}
