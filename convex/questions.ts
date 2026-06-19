import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { QUESTION_BANK } from "./questionBank";

function toClientQuestion(row: (typeof QUESTION_BANK)[number]) {
  return {
    id: row.questionId,
    unit_id: row.unitId,
    type: row.type,
    difficulty: row.difficulty,
    question: row.question,
    answer: row.answer,
    explanation: row.explanation,
    curriculum_ref: row.curriculum_ref,
    tags: "tags" in row ? row.tags : undefined,
    hint: "hint" in row ? row.hint : undefined,
    srs_weight: "srs_weight" in row ? row.srs_weight : undefined,
  };
}

function uniqueByQuestionId<T extends { id: string }>(questions: T[]): T[] {
  const seen = new Set<string>();
  return questions.filter((q) => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
}

export const getByUnit = query({
  args: { unitId: v.string() },
  handler: async (ctx, { unitId }) => {
    const fromBank = QUESTION_BANK.filter((q) => q.unitId === unitId);
    if (fromBank.length > 0) {
      return uniqueByQuestionId(fromBank.map(toClientQuestion));
    }

    const rows = await ctx.db
      .query("questions")
      .withIndex("by_unit", (q) => q.eq("unitId", unitId))
      .collect();

    return uniqueByQuestionId(
      rows.map((row) => ({
        id: row.questionId,
        unit_id: row.unitId,
        type: row.type,
        difficulty: row.difficulty,
        question: row.question,
        answer: row.answer,
        explanation: row.explanation,
        curriculum_ref: row.curriculum_ref,
        tags: row.tags,
        hint: row.hint,
        srs_weight: row.srs_weight,
      })),
    );
  },
});

export const seedUnit = mutation({
  args: { unitId: v.string() },
  handler: async (ctx, { unitId }) => {
    const toSeed = QUESTION_BANK.filter((q) => q.unitId === unitId);
    if (toSeed.length === 0) {
      return { seeded: false, count: 0 };
    }

    const existing = await ctx.db
      .query("questions")
      .withIndex("by_unit", (q) => q.eq("unitId", unitId))
      .first();

    if (existing) {
      return { seeded: false, count: 0 };
    }

    for (const q of toSeed) {
      await ctx.db.insert("questions", JSON.parse(JSON.stringify(q)));
    }

    return { seeded: true, count: toSeed.length };
  },
});

/** 問題バンクと DB の件数が食い違うときに再同期する */
export const syncUnit = mutation({
  args: { unitId: v.string() },
  handler: async (ctx, { unitId }) => {
    const toSeed = QUESTION_BANK.filter((q) => q.unitId === unitId);
    if (toSeed.length === 0) {
      return { synced: false, count: 0 };
    }

    const existing = await ctx.db
      .query("questions")
      .withIndex("by_unit", (q) => q.eq("unitId", unitId))
      .collect();

    const bankIds = new Set(toSeed.map((q) => q.questionId));
    const existingIds = new Set(existing.map((row) => row.questionId));
    const matchesBank =
      existing.length === toSeed.length &&
      toSeed.every((q) => existingIds.has(q.questionId));

    if (matchesBank) {
      return { synced: false, count: existing.length };
    }

    for (const row of existing) {
      await ctx.db.delete(row._id);
    }

    for (const q of toSeed) {
      await ctx.db.insert("questions", JSON.parse(JSON.stringify(q)));
    }

    return { synced: true, count: toSeed.length };
  },
});
