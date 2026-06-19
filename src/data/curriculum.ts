/** @deprecated topics.ts を使用してください */
export {
  TOPICS,
  getTopicById,
  getTopicById as getUnitById,
  type Topic,
  type Topic as CurriculumUnit,
  type TopicId,
} from "./topics";

import { TOPICS } from "./topics";

export const ALL_UNITS = TOPICS;
