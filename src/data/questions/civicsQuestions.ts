import type { Question } from "@/types/question";
import type { CivicsModeId } from "@/data/civicsModes";
import { CIVICS_MODES } from "@/data/civicsModes";
import {
  g3Questions,
  g4Questions,
  g6Questions,
} from "./grades";
import { buildCivicsConstitutionQuestions } from "./civicsConstitutionQuestions";
import { buildCivicsPoliticsElectionQuestions } from "./civicsPoliticsElectionQuestions";

const CIVICS_MODE_ORDER = CIVICS_MODES.map((m) => m.id);

const CONSTITUTION_POINTS = new Set(["三権分立"]);

function categorizeCivicsQuestion(q: Question): CivicsModeId {
  const point = q.curriculum_ref?.learning_point ?? "";
  if (CONSTITUTION_POINTS.has(point)) return "civics-constitution";
  return "civics-politics-election";
}

function assignModeQuestions(
  questions: Question[],
  modeId: CivicsModeId,
  idPrefix: string,
): Question[] {
  return questions.map((q, i) => ({
    ...q,
    id: `${idPrefix}_q${String(i + 1).padStart(3, "0")}`,
    unit_id: modeId,
  }));
}

function groupQuestionsByMode(
  questions: Question[],
): Record<CivicsModeId, Question[]> {
  const grouped = Object.fromEntries(
    CIVICS_MODE_ORDER.map((id) => [id, [] as Question[]]),
  ) as Record<CivicsModeId, Question[]>;

  for (const q of questions) {
    grouped[categorizeCivicsQuestion(q)].push(q);
  }
  return grouped;
}

const legacyCivicsQuestions = [
  ...g3Questions.filter((q) => q.unit_id === "g3_u3"),
  ...g4Questions.filter((q) => ["g4_u2", "g4_u3"].includes(q.unit_id)),
  ...g6Questions.filter((q) => q.unit_id === "g6_u1"),
];

const civicsByMode = groupQuestionsByMode(legacyCivicsQuestions);
const constitutionExtra = buildCivicsConstitutionQuestions();
const politicsElectionExtra = buildCivicsPoliticsElectionQuestions();

const ID_PREFIX: Record<CivicsModeId, string> = {
  "civics-constitution": "civ_const",
  "civics-politics-election": "civ_pol",
};

const MODE_EXTRA: Partial<Record<CivicsModeId, Question[]>> = {
  "civics-constitution": constitutionExtra,
  "civics-politics-election": politicsElectionExtra,
};

function buildModeQuestions(modeId: CivicsModeId): Question[] {
  const legacy = civicsByMode[modeId] ?? [];
  const base = assignModeQuestions(legacy, modeId, ID_PREFIX[modeId]);
  const extra = MODE_EXTRA[modeId];
  if (!extra?.length) return base;

  const offset = base.length;
  return [
    ...base,
    ...extra.map((q, i) => ({
      ...q,
      id: `${ID_PREFIX[modeId]}_q${String(offset + i + 1).padStart(3, "0")}`,
    })),
  ];
}

/** 公民テーマの2分野別問題 */
export function buildCivicsQuestionsByMode(): Record<
  CivicsModeId,
  Question[]
> {
  return Object.fromEntries(
    CIVICS_MODE_ORDER.map((modeId) => [modeId, buildModeQuestions(modeId)]),
  ) as Record<CivicsModeId, Question[]>;
}

export function buildAllCivicsQuestions(): Question[] {
  return Object.values(buildCivicsQuestionsByMode()).flat();
}
