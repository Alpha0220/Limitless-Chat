import { Router } from "express";
import { getDb } from "../db";
import { chats, messages, users } from "../../drizzle/schema";
import { eq, asc } from "drizzle-orm";
import { streamOpenRouter, calculateCredits, OpenRouterMessage } from "../_core/openrouter";
import { sdk } from "../_core/sdk";
import { COOKIE_NAME } from "@shared/const";

export const streamChatRouter = Router();

streamChatRouter.post("/api/stream-chat", async (req, res) => {
  try {
    // Verify authentication
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const session = await sdk.verifySession(token);
    if (!session || !session.openId) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }

    // Get user from database
    const db = await getDb();
    if (!db) {
      res.status(500).json({ error: "Database not available" });
      return;
    }

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.openId, session.openId))
      .limit(1);

    if (!dbUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const userId = dbUser.id;

    const { chatId, model, content, title } = req.body;

    const user = dbUser;

    const creditsNeeded = calculateCredits(model);

    // Check if user has enough credits (for prepaid users)
    if (user.billingType === "prepaid" && user.credits < creditsNeeded) {
      res.status(403).json({ error: "Insufficient credits" });
      return;
    }

    // Create chat if needed
    let finalChatId = chatId;
    if (!finalChatId) {
      const chatTitle = title || content.slice(0, 50);
      const [newChat] = await db
        .insert(chats)
        .values({
          userId,
          title: chatTitle,
          model,
        })
        .$returningId();
      finalChatId = newChat.id;
    }

    // Verify chat belongs to user
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, finalChatId))
      .limit(1);

    if (!chat || chat.userId !== userId) {
      res.status(403).json({ error: "Chat not found or access denied" });
      return;
    }

    // Save user message
    await db.insert(messages).values({
      chatId: finalChatId,
      role: "user",
      content,
      creditsUsed: 0,
    });

    // Get chat history
    const chatHistory = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, finalChatId))
      .orderBy(asc(messages.createdAt));

    // Prepare messages for OpenRouter
    const openRouterMessages: OpenRouterMessage[] = chatHistory.map((msg) => ({
      role: msg.role as "system" | "user" | "assistant",
      content: msg.content,
    }));

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send initial metadata
    res.write(`data: ${JSON.stringify({ type: "start", chatId: finalChatId })}\n\n`);

    let fullContent = "";

    try {
      // Stream response from OpenRouter
      for await (const chunk of streamOpenRouter(model, openRouterMessages)) {
        fullContent += chunk;
        res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`);
      }

      // Save assistant message
      await db.insert(messages).values({
        chatId: finalChatId,
        role: "assistant",
        content: fullContent,
        creditsUsed: creditsNeeded,
      });

      // Deduct credits
      const newBalance = user.credits - creditsNeeded;
      await db
        .update(users)
        .set({ credits: newBalance })
        .where(eq(users.id, userId));

      // Send completion event
      res.write(
        `data: ${JSON.stringify({
          type: "done",
          creditsUsed: creditsNeeded,
          newBalance,
        })}\n\n`
      );

      res.end();
    } catch (error) {
      console.error("Streaming error:", error);
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: error instanceof Error ? error.message : "Streaming failed",
        })}\n\n`
      );
      res.end();
    }
  } catch (error) {
    console.error("Stream chat error:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    if (!res.headersSent) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
});
