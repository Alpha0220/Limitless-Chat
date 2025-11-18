import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { chats, messages, users } from "../../drizzle/schema";
import { eq, desc, like, or, and } from "drizzle-orm";
import { callOpenRouter, calculateCredits, streamOpenRouter, OpenRouterMessage } from "../_core/openrouter";
import { TRPCError } from "@trpc/server";

export const chatRouter = router({
  // Create a new chat
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        model: z.string(),
        folderId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [chat] = await db
        .insert(chats)
        .values({
          userId: ctx.user.id,
          title: input.title,
          model: input.model,
          folderId: input.folderId,
        })
        .$returningId();

      return { chatId: chat.id };
    }),

  // Get user's chats
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, ctx.user.id))
      .orderBy(desc(chats.updatedAt))
      .limit(50);

    return userChats;
  }),

  // Get messages for a chat
  getMessages: protectedProcedure
    .input(z.object({ chatId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify chat belongs to user
      const [chat] = await db
        .select()
        .from(chats)
        .where(eq(chats.id, input.chatId))
        .limit(1);

      if (!chat || chat.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Chat not found or access denied",
        });
      }

      const chatMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, input.chatId))
        .orderBy(messages.createdAt);

      return chatMessages;
    }),

  // Send a message
  sendMessage: protectedProcedure
    .input(
      z.object({
        chatId: z.number().optional(),
        model: z.string(),
        content: z.string(),
        title: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check user credits
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) throw new Error("User not found");

      const creditsNeeded = calculateCredits(input.model);

      // Check if user has enough credits (for prepaid users)
      if (user.billingType === "prepaid" && user.credits < creditsNeeded) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient credits. Please purchase more credits.",
        });
      }

      // Create chat if needed
      let chatId = input.chatId;
      if (!chatId) {
        const title = input.title || input.content.slice(0, 50);
        const [newChat] = await db
          .insert(chats)
          .values({
            userId: ctx.user.id,
            title,
            model: input.model,
          })
          .$returningId();
        chatId = newChat.id;
      }

      // Verify chat belongs to user
      const [chat] = await db
        .select()
        .from(chats)
        .where(eq(chats.id, chatId))
        .limit(1);

      if (!chat || chat.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Chat not found or access denied",
        });
      }

      // Save user message
      const [userMessage] = await db
        .insert(messages)
        .values({
          chatId,
          role: "user",
          content: input.content,
          creditsUsed: 0,
        })
        .$returningId();

      // Get chat history
      const chatHistory = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(messages.createdAt);

      // Prepare messages for OpenRouter
      const openRouterMessages: OpenRouterMessage[] = chatHistory.map((msg) => ({
        role: msg.role as "system" | "user" | "assistant",
        content: msg.content,
      }));

      // Call OpenRouter
      try {
        const response = await callOpenRouter(input.model, openRouterMessages);
        
        if ('choices' in response) {
          const assistantContent = response.choices[0]?.message?.content || "No response";

          // Save assistant message
          const [assistantMessage] = await db
            .insert(messages)
            .values({
              chatId,
              role: "assistant",
              content: assistantContent,
              creditsUsed: creditsNeeded,
            })
            .$returningId();

          // Deduct credits
          const newBalance = user.credits - creditsNeeded;
          await db
            .update(users)
            .set({ credits: newBalance })
            .where(eq(users.id, ctx.user.id));

          return {
            chatId,
            messageId: assistantMessage.id,
            content: assistantContent,
            creditsUsed: creditsNeeded,
            newBalance,
          };
        }
        
        throw new Error("Invalid response from OpenRouter");
      } catch (error) {
        console.error("OpenRouter error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to get AI response",
        });
      }
    }),

  // Stream a message (for real-time responses)
  streamMessage: protectedProcedure
    .input(
      z.object({
        chatId: z.number().optional(),
        model: z.string(),
        content: z.string(),
        title: z.string().optional(),
      })
    )
    .mutation(async function* ({ ctx, input }) {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check user credits
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) throw new Error("User not found");

      const creditsNeeded = calculateCredits(input.model);

      // Check if user has enough credits (for prepaid users)
      if (user.billingType === "prepaid" && user.credits < creditsNeeded) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient credits. Please purchase more credits.",
        });
      }

      // Create chat if needed
      let chatId = input.chatId;
      if (!chatId) {
        const title = input.title || input.content.slice(0, 50);
        const [newChat] = await db
          .insert(chats)
          .values({
            userId: ctx.user.id,
            title,
            model: input.model,
          })
          .$returningId();
        chatId = newChat.id;
      }

      // Verify chat belongs to user
      const [chat] = await db
        .select()
        .from(chats)
        .where(eq(chats.id, chatId))
        .limit(1);

      if (!chat || chat.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Chat not found or access denied",
        });
      }

      // Save user message
      const [userMessage] = await db
        .insert(messages)
        .values({
          chatId,
          role: "user",
          content: input.content,
          creditsUsed: 0,
        })
        .$returningId();

      // Get chat history
      const chatHistory = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(messages.createdAt);

      // Prepare messages for OpenRouter
      const openRouterMessages: OpenRouterMessage[] = chatHistory.map((msg) => ({
        role: msg.role as "system" | "user" | "assistant",
        content: msg.content,
      }));

      // Stream response
      try {
        let fullContent = "";
        for await (const chunk of streamOpenRouter(input.model, openRouterMessages)) {
          fullContent += chunk;
          yield chunk;
        }

        // Save assistant message
        const [assistantMessage] = await db
          .insert(messages)
          .values({
            chatId,
            role: "assistant",
            content: fullContent,
            creditsUsed: creditsNeeded,
          })
          .$returningId();

        // Deduct credits
        const newBalance = user.credits - creditsNeeded;
        await db
          .update(users)
          .set({ credits: newBalance })
          .where(eq(users.id, ctx.user.id));

        // Yield final metadata
        yield JSON.stringify({
          type: "done",
          messageId: assistantMessage.id,
          creditsUsed: creditsNeeded,
          newBalance,
        });
      } catch (error) {
        console.error("OpenRouter streaming error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to stream AI response",
        });
      }
    }),

  // Delete a chat
  delete: protectedProcedure
    .input(z.object({ chatId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify chat belongs to user
      const [chat] = await db
        .select()
        .from(chats)
        .where(eq(chats.id, input.chatId))
        .limit(1);

      if (!chat || chat.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Chat not found or access denied",
        });
      }

      // Delete messages first
      await db.delete(messages).where(eq(messages.chatId, input.chatId)).execute();

      // Delete chat
      await db.delete(chats).where(eq(chats.id, input.chatId)).execute();

      return { success: true };
    }),

  // Move chat to a folder
  moveToFolder: protectedProcedure
    .input(
      z.object({
        chatId: z.number(),
        folderId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify chat belongs to user
      const [chat] = await db
        .select()
        .from(chats)
        .where(eq(chats.id, input.chatId))
        .limit(1);

      if (!chat || chat.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Chat not found or access denied",
        });
      }

      // Update chat with new folder
      await db
        .update(chats)
        .set({
          folderId: input.folderId || null,
          updatedAt: new Date(),
        })
        .where(eq(chats.id, input.chatId))
        .execute();

      return { success: true };
    }),

  // Update chat title
  updateTitle: protectedProcedure
    .input(
      z.object({
        chatId: z.number(),
        title: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify chat belongs to user
      const [chat] = await db
        .select()
        .from(chats)
        .where(eq(chats.id, input.chatId))
        .limit(1);

      if (!chat || chat.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Chat not found or access denied",
        });
      }

      // Update chat title
      await db
        .update(chats)
        .set({
          title: input.title,
          updatedAt: new Date(),
        })
        .where(eq(chats.id, input.chatId))
        .execute();

      return { success: true };
    }),

  // Search chats by title or message content
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Search in chat titles
      const searchPattern = `%${input.query}%`;

      const matchingChats = await db
        .select()
        .from(chats)
        .where(
          and(
            eq(chats.userId, ctx.user.id),
            like(chats.title, searchPattern)
          )
        )
        .orderBy(desc(chats.updatedAt))
        .limit(input.limit);

      // Also search in message content
      const matchingMessages = await db
        .select()
        .from(messages)
        .where(like(messages.content, searchPattern))
        .limit(input.limit);

      // Get unique chat IDs from matching messages
      const chatIdsFromMessages = new Set(
        matchingMessages.map((msg) => msg.chatId)
      );

      // Get chats from matching messages
      const chatsFromMessages = await Promise.all(
        Array.from(chatIdsFromMessages).map(async (chatId) => {
          const [chat] = await db
            .select()
            .from(chats)
            .where(and(eq(chats.id, chatId), eq(chats.userId, ctx.user.id)))
            .limit(1);
          return chat;
        })
      );

      // Combine and deduplicate results
      const allChats = [...matchingChats, ...chatsFromMessages.filter(Boolean)];
      const uniqueChats = Array.from(
        new Map(allChats.map((chat) => [chat.id, chat])).values()
      );

      return uniqueChats.slice(0, input.limit);
    }),
});
