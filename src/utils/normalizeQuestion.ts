import type { MapConfig, MapId, Question } from "@/types/question";

function inferMapId(map: MapConfig): MapId {
  if (map.map_id) return map.map_id;

  const url = map.image_url ?? "";
  if (url.includes("city-map")) return "city_district";
  if (url.includes("japan")) {
    const hasHonshu = map.regions.some((r) => r.id === "honshu");
    const hasChubu = map.regions.some((r) => r.id === "chubu");
    if (hasHonshu) return "japan_islands";
    if (hasChubu) return "japan_regions";
    return "japan_prefectures";
  }

  return "city_district";
}

function normalizeMap(map: MapConfig | undefined): MapConfig | undefined {
  if (!map) return undefined;
  return { ...map, map_id: inferMapId(map) };
}

export function normalizeQuestion(question: Question): Question {
  return {
    ...question,
    question: {
      ...question.question,
      choices: question.question.choices ?? [],
      map: normalizeMap(question.question.map),
    },
  };
}

export function normalizeQuestions(questions: Question[]): Question[] {
  return questions.map(normalizeQuestion);
}
