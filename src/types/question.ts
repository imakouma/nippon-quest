export interface Choice {
  id: string;
  text: string;
}

export interface MapRegion {
  id: string;
  label: string;
  x: number;
  y: number;
}

export type MapId =
  | "city_district"
  | "japan_prefectures"
  | "japan_islands"
  | "japan_regions";

export interface MapConfig {
  map_id: MapId;
  regions: MapRegion[];
  /** @deprecated 内蔵SVGを使用。互換用 */
  image_url?: string;
}

export interface HistorySlide {
  era: string;
  period: string;
  headline: string;
  detail: string;
}

export interface MediaContent {
  kind: "video" | "history_animation";
  title: string;
  description?: string;
  video_url?: string | null;
  slides?: HistorySlide[];
}

export interface SortItem {
  id: string;
  text: string;
}

export interface QuestionContent {
  text: string;
  image_url?: string | null;
  choices: Choice[];
  map?: MapConfig;
  media?: MediaContent;
  sort_items?: SortItem[];
}

export interface Answer {
  correct_ids: string[];
}

export interface Explanation {
  short: string;
  detail?: string;
  source_note?: string;
}

export interface CurriculumRef {
  grade: number;
  unit_number: number;
  learning_point?: string;
}

export type QuestionType =
  | "multiple_choice"
  | "sort_order"
  | "map_pin"
  | "matching"
  | "fill_blank"
  | "video_intro";

export interface Question {
  id: string;
  unit_id: string;
  type: QuestionType;
  difficulty: 1 | 2 | 3;
  question: QuestionContent;
  answer: Answer;
  explanation: Explanation;
  curriculum_ref: CurriculumRef;
  tags?: string[];
  hint?: string;
  srs_weight?: number;
}

export interface QuizSession {
  unitId: string;
  questions: Question[];
  currentIndex: number;
  wrongIds: string[];
  startedAt: string;
}

export type QuizResult = {
  unitId: string;
  totalQuestions: number;
  correctCount: number;
  wrongIds: string[];
  finishedAt: string;
};

export interface CurriculumUnit {
  id: string;
  grade: number;
  number: number;
  title: string;
  domain: "geography" | "history" | "civics";
  description: string;
}

export interface CurriculumGrade {
  grade: number;
  label: string;
  units: CurriculumUnit[];
}
