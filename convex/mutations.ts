import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Updates the file's summary in the database
 */
export const updateFileSummary = internalMutation({
  args: {
    fileId: v.id("files"),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, {
      summary: args.summary,
    });
  },
});