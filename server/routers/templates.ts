import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { promptTemplates } from "../../drizzle/schema";
import { eq, and, or } from "drizzle-orm";

export const templatesRouter = router({
  // List all templates (user's private + public templates)
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const templates = await db
      .select()
      .from(promptTemplates)
      .where(
        or(
          eq(promptTemplates.userId, ctx.user.id),
          eq(promptTemplates.isPublic, 1)
        )
      )
      .orderBy(promptTemplates.createdAt);

    return templates;
  }),

  // Create a new template
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        content: z.string().min(1),
        category: z.string().max(100).optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [template] = await db.insert(promptTemplates).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        content: input.content,
        category: input.category,
        isPublic: input.isPublic ? 1 : 0,
      });

      return { success: true, templateId: template.insertId };
    }),

  // Update a template
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        content: z.string().min(1).optional(),
        category: z.string().max(100).optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(promptTemplates)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.content && { content: input.content }),
          ...(input.category !== undefined && { category: input.category }),
          ...(input.isPublic !== undefined && { isPublic: input.isPublic ? 1 : 0 }),
          updatedAt: new Date(),
        })
        .where(and(eq(promptTemplates.id, input.id), eq(promptTemplates.userId, ctx.user.id)));

      return { success: true };
    }),

  // Delete a template
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(promptTemplates)
        .where(and(eq(promptTemplates.id, input.id), eq(promptTemplates.userId, ctx.user.id)));

      return { success: true };
    }),

  // Increment usage count
  incrementUsage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [template] = await db
        .select()
        .from(promptTemplates)
        .where(eq(promptTemplates.id, input.id))
        .limit(1);

      if (template) {
        await db
          .update(promptTemplates)
          .set({ usageCount: (template.usageCount || 0) + 1 })
          .where(eq(promptTemplates.id, input.id));
      }

      return { success: true };
    }),
});
