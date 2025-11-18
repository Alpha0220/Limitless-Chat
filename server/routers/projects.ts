import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { projects, chats, messages } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const projectsRouter = router({
  // List all projects for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, ctx.user.id))
      .orderBy(projects.createdAt);

    return userProjects;
  }),

  // Create a new project
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        icon: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(projects).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        color: input.color || "#3b82f6",
        icon: input.icon || "folder",
      }).execute();

      console.log("[DEBUG] project insert result:", result);
      return { success: true, projectId: (result as any).insertId || 0 };
    }),

  // Update a project
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        icon: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(projects)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.color && { color: input.color }),
          ...(input.icon && { icon: input.icon }),
          updatedAt: new Date(),
        })
        .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)));

      return { success: true };
    }),

  // Delete a project
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(projects)
        .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)));

      return { success: true };
    }),

  // Delete a project with options for chats inside
  deleteWithOptions: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        action: z.enum(["delete", "move"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)))
        .limit(1);

      if (!project) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project not found or access denied",
        });
      }

      if (input.action === "delete") {
        const projectChats = await db
          .select()
          .from(chats)
          .where(eq(chats.projectId, input.projectId));

        for (const chat of projectChats) {
          await db
            .delete(messages)
            .where(eq(messages.chatId, chat.id))
            .execute();
        }

        await db
          .delete(chats)
          .where(eq(chats.projectId, input.projectId))
          .execute();
      } else {
        await db
          .update(chats)
          .set({ projectId: null })
          .where(eq(chats.projectId, input.projectId))
          .execute();
      }

      await db
        .delete(projects)
        .where(eq(projects.id, input.projectId))
        .execute();

      return { success: true };
    }),

  rename: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        name: z.string().min(1).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(projects)
        .set({
          name: input.name,
          updatedAt: new Date(),
        })
        .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)));

      return { success: true };
    }),
});
