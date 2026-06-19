import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByClient = query({
  args: { clientId: v.string() },
  handler: async (ctx, { clientId }) => {
    const row = await ctx.db
      .query("userProgress")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .first();

    if (!row) {
      return {
        completedUnits: [] as string[],
        unitScores: {} as Record<string, number>,
        wrongQuestions: [] as string[],
      };
    }

    return {
      completedUnits: row.completedUnits,
      unitScores: row.unitScores,
      wrongQuestions: row.wrongQuestions,
    };
  },
});

export const saveProgress = mutation({
  args: {
    clientId: v.string(),
    completedUnits: v.array(v.string()),
    unitScores: v.record(v.string(), v.number()),
    wrongQuestions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProgress")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .first();

    const payload = {
      clientId: args.clientId,
      completedUnits: args.completedUnits,
      unitScores: args.unitScores,
      wrongQuestions: args.wrongQuestions,
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert("userProgress", payload);
    }

    return { ok: true };
  },
});
