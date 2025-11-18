import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { folders, chats } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const foldersRouter = router({
  // List all folders for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, ctx.user.id))
      .orderBy(folders.createdAt);

    return userFolders;
  }),

  // Get a single folder with all its chats
  getWithChats: protectedProcedure
    .input(z.object({ folderId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify folder belongs to user
      const [folder] = await db
        .select()
        .from(folders)
        .where(and(eq(folders.id, input.folderId), eq(folders.userId, ctx.user.id)))
        .limit(1);

      if (!folder) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Folder not found or access denied",
        });
      }

      // Get all chats in this folder
      const folderChats = await db
        .select()
        .from(chats)
        .where(and(eq(chats.folderId, input.folderId), eq(chats.userId, ctx.user.id)))
        .orderBy(chats.updatedAt);

      return {
        folder,
        chats: folderChats,
      };
    }),

  // Create a new folder
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        icon: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [folder] = await db
        .insert(folders)
        .values({
          userId: ctx.user.id,
          name: input.name,
          icon: input.icon || "folder",
          order: 0,
        })
        .$returningId();

      return { folderId: folder.id };
    }),

  // Update a folder (rename)
  update: protectedProcedure
    .input(
      z.object({
        folderId: z.number(),
        name: z.string().min(1).max(255).optional(),
        icon: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify folder belongs to user
      const [folder] = await db
        .select()
        .from(folders)
        .where(and(eq(folders.id, input.folderId), eq(folders.userId, ctx.user.id)))
        .limit(1);

      if (!folder) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Folder not found or access denied",
        });
      }

      await db
        .update(folders)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.icon && { icon: input.icon }),
          updatedAt: new Date(),
        })
        .where(eq(folders.id, input.folderId))
        .execute();

      return { success: true };
    }),

  // Delete a folder (moves chats to root)
  delete: protectedProcedure
    .input(z.object({ folderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify folder belongs to user
      const [folder] = await db
        .select()
        .from(folders)
        .where(and(eq(folders.id, input.folderId), eq(folders.userId, ctx.user.id)))
        .limit(1);

      if (!folder) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Folder not found or access denied",
        });
      }

      // Move all chats in this folder to root (set folderId to null)
      await db
        .update(chats)
        .set({ folderId: null })
        .where(eq(chats.folderId, input.folderId))
        .execute();

      // Delete the folder
      await db
        .delete(folders)
        .where(eq(folders.id, input.folderId))
        .execute();

      return { success: true };
    }),
});
