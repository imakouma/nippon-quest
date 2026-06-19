import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const choiceValidator = v.object({
  id: v.string(),
  text: v.string(),
});

const mapRegionValidator = v.object({
  id: v.string(),
  label: v.string(),
  x: v.number(),
  y: v.number(),
});

const questionContentValidator = v.object({
  text: v.string(),
  image_url: v.optional(v.union(v.string(), v.null())),
  choices: v.array(choiceValidator),
  map: v.optional(
    v.object({
      map_id: v.union(
        v.literal("city_district"),
        v.literal("japan_prefectures"),
        v.literal("japan_islands"),
        v.literal("japan_regions"),
      ),
      image_url: v.optional(v.string()),
      regions: v.array(mapRegionValidator),
    }),
  ),
  media: v.optional(
    v.object({
      kind: v.union(v.literal("video"), v.literal("history_animation")),
      title: v.string(),
      description: v.optional(v.string()),
      video_url: v.optional(v.union(v.string(), v.null())),
      slides: v.optional(
        v.array(
          v.object({
            era: v.string(),
            period: v.string(),
            headline: v.string(),
            detail: v.string(),
          }),
        ),
      ),
    }),
  ),
  sort_items: v.optional(v.array(choiceValidator)),
});

export default defineSchema({
  questions: defineTable({
    questionId: v.string(),
    unitId: v.string(),
    type: v.union(
      v.literal("multiple_choice"),
      v.literal("sort_order"),
      v.literal("map_pin"),
      v.literal("matching"),
      v.literal("fill_blank"),
      v.literal("video_intro"),
    ),
    difficulty: v.union(v.literal(1), v.literal(2), v.literal(3)),
    question: questionContentValidator,
    answer: v.object({
      correct_ids: v.array(v.string()),
    }),
    explanation: v.object({
      short: v.string(),
      detail: v.optional(v.string()),
      source_note: v.optional(v.string()),
    }),
    curriculum_ref: v.object({
      grade: v.number(),
      unit_number: v.number(),
      learning_point: v.optional(v.string()),
    }),
    tags: v.optional(v.array(v.string())),
    hint: v.optional(v.string()),
    srs_weight: v.optional(v.number()),
  })
    .index("by_unit", ["unitId"])
    .index("by_question_id", ["questionId"]),

  userProgress: defineTable({
    clientId: v.string(),
    completedUnits: v.array(v.string()),
    unitScores: v.record(v.string(), v.number()),
    wrongQuestions: v.array(v.string()),
    updatedAt: v.string(),
  }).index("by_client", ["clientId"]),
});
