import type { Question } from "@/types/question";
import type { PrefectureShapeGroupId } from "@/data/prefectureModes";
import { PREFECTURE_SHAPE_GROUPS } from "@/data/prefectureModes";
import { PREFECTURE_SHAPES } from "@/data/prefectureShapes";

/** 形が特徴的で学習効果の高い都道府県（各グループ内で優先出題） */
const FEATURED_SHAPE_IDS = new Set([
  "chibaken",
  "hyougoken",
  "kagawaken",
  "hokkaidou",
  "toukyouto",
  "okinawaken",
  "tottoriken",
  "kanagawaken",
  "shimaneken",
  "nagasakiken",
  "ooitaken",
  "kouchiken",
]);

/** 各都道府県の誤答候補（近い地域・紛らわしい形） */
const DISTRACTOR_IDS: Record<string, string[]> = {
  chibaken: ["saitamaken", "kanagawaken", "ibarakiken"],
  hyougoken: ["kyoutofu", "naraken", "wakayamaken"],
  kagawaken: ["tokushimaken", "ehimeken", "kouchiken"],
  hokkaidou: ["aomoriken", "iwateken", "niigataken"],
  toukyouto: ["kanagawaken", "saitamaken", "chibaken"],
  okinawaken: ["kagoshimaken", "miyazakiken", "kouchiken"],
  tottoriken: ["shimaneken", "okayamaken", "hyougoken"],
  kanagawaken: ["toukyouto", "saitamaken", "shizuokaken"],
  shimaneken: ["tottoriken", "hiroshimaken", "yamaguchiken"],
  nagasakiken: ["sagaken", "fukuokaken", "kumamotoken"],
  ooitaken: ["miyazakiken", "kumamotoken", "fukuokaken"],
  kouchiken: ["tokushimaken", "ehimeken", "kagawaken"],
};

function nameOf(id: string): string {
  return PREFECTURE_SHAPES.find((s) => s.id === id)?.name ?? id;
}

function buildChoices(correctId: string) {
  const custom = DISTRACTOR_IDS[correctId];
  const distractorIds =
    custom ??
    PREFECTURE_SHAPES.filter((s) => s.id !== correctId)
      .slice(0, 3)
      .map((s) => s.id);

  const options = [
    { id: "a", text: nameOf(correctId), isCorrect: true },
    { id: "b", text: nameOf(distractorIds[0]), isCorrect: false },
    { id: "c", text: nameOf(distractorIds[1]), isCorrect: false },
    { id: "d", text: nameOf(distractorIds[2]), isCorrect: false },
  ];

  const correctChoiceId = options.find((o) => o.isCorrect)!.id;
  return {
    choices: options.map(({ id, text }) => ({ id, text })),
    correctChoiceId,
  };
}

function orderShapeIds(shapeIds: string[]): string[] {
  const featured = shapeIds.filter((id) => FEATURED_SHAPE_IDS.has(id));
  const remaining = shapeIds.filter((id) => !FEATURED_SHAPE_IDS.has(id));
  return [...featured, ...remaining];
}

function buildShapeQuestion(
  shapeId: string,
  unitId: PrefectureShapeGroupId,
  index: number,
  difficulty: 1 | 2 = 1,
): Question {
  const shape = PREFECTURE_SHAPES.find((s) => s.id === shapeId)!;
  const { choices, correctChoiceId } = buildChoices(shapeId);
  const groupNumber = unitId.replace("prefectures-shape-", "");

  return {
    id: `pref_shape_${groupNumber}_q${String(index + 1).padStart(3, "0")}`,
    unit_id: unitId,
    type: "multiple_choice",
    difficulty,
    question: {
      text: "この形はどの都道府県でしょう？",
      image_url: shape.imagePath,
      choices,
    },
    answer: { correct_ids: [correctChoiceId] },
    explanation: {
      short: `正解は${shape.name}です。地図で形の特徴を覚えましょう。`,
    },
    curriculum_ref: { grade: 4, unit_number: 1, learning_point: "形" },
    hint: "形のくびれや半島の形に注目してみよう。",
    tags: ["都道府県の形", shape.id],
  };
}

export function buildPrefectureShapeQuestionsForGroup(
  groupId: PrefectureShapeGroupId,
): Question[] {
  const group = PREFECTURE_SHAPE_GROUPS.find((g) => g.id === groupId);
  if (!group) return [];

  return orderShapeIds(group.shapeIds).map((shapeId, i) =>
    buildShapeQuestion(shapeId, groupId, i, i < 3 ? 1 : 2),
  );
}

export function buildAllPrefectureShapeQuestionsByGroup(): Record<
  PrefectureShapeGroupId,
  Question[]
> {
  return Object.fromEntries(
    PREFECTURE_SHAPE_GROUPS.map((group) => [
      group.id,
      buildPrefectureShapeQuestionsForGroup(group.id),
    ]),
  ) as Record<PrefectureShapeGroupId, Question[]>;
}

/** 都道府県「形」モードの全問題（47都道府県） */
export function buildAllPrefectureShapeQuestions(): Question[] {
  return PREFECTURE_SHAPE_GROUPS.flatMap((group) =>
    buildPrefectureShapeQuestionsForGroup(group.id),
  );
}
