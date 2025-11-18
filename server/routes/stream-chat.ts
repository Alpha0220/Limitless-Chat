import { Router } from "express";
import { getDb } from "../db";
import { chats, messages, users } from "../../drizzle/schema";
import { eq, asc } from "drizzle-orm";
import { streamOpenRouter, calculateCredits, OpenRouterMessage } from "../_core/openrouter";
import { sdk } from "../_core/sdk";
import { COOKIE_NAME } from "@shared/const";

export const streamChatRouter = Router();

// Enable credentials for streaming endpoint
streamChatRouter.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

streamChatRouter.post("/api/stream-chat", async (req, res) => {
  try {
    // Verify authentication
    const token = req.cookies[COOKIE_NAME];
    console.log("[Stream Chat] Token present:", !!token);
    if (!token) {
      console.error("[Stream Chat] No token in cookies");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const session = await sdk.verifySession(token);
    console.log("[Stream Chat] Session verified:", !!session);
    if (!session || !session.openId) {
      console.error("[Stream Chat] Invalid session");
      res.status(401).json({ error: "Invalid session" });
      return;
    }

    // Get user from database
    const db = await getDb();
    if (!db) {
      res.status(500).json({ error: "Database not available" });
      return;
    }

    const dbUserResult = await db
      .select()
      .from(users)
      .where(eq(users.openId, session.openId))
      .limit(1)
      .execute();

    console.log("[DEBUG] dbUserResult:", dbUserResult);

    if (!dbUserResult || dbUserResult.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const dbUser = dbUserResult[0];
    const userId = dbUser.id;

    const { chatId, model, content, title } = req.body;

    const user = dbUser;
    console.log("[DEBUG] user:", user);

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
      const newChatResult = await db
        .insert(chats)
        .values({
          userId,
          title: chatTitle,
          model,
        })
        .$returningId()
        .execute();

      console.log("[DEBUG] newChatResult:", newChatResult);
      finalChatId = newChatResult[0].id;
    }

    // Verify chat belongs to user
    const chatResult = await db
      .select()
      .from(chats)
      .where(eq(chats.id, finalChatId))
      .limit(1)
      .execute();

    console.log("[DEBUG] chatResult:", chatResult);

    if (!chatResult || chatResult.length === 0 || chatResult[0].userId !== userId) {
      res.status(403).json({ error: "Chat not found or access denied" });
      return;
    }

    // Save user message
    try {
      const userMsgResult = await db.insert(messages).values({
        chatId: finalChatId,
        role: "user",
        content,
        creditsUsed: 0,
      }).execute();
      console.log("[DEBUG] User message saved:", userMsgResult);
    } catch (msgError) {
      console.error("[ERROR] Failed to save user message:", msgError);
      throw msgError;
    }

    // Get chat history
    const chatHistory = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, finalChatId))
      .orderBy(asc(messages.createdAt))
      .execute();

    console.log("[DEBUG] chatHistory length:", chatHistory.length);

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
      }).execute();

      // Deduct credits
      const newBalance = user.credits - creditsNeeded;
      await db
        .update(users)
        .set({ credits: newBalance })
        .where(eq(users.id, userId))
        .execute();

      console.log("[DEBUG] Credits deducted. New balance:", newBalance);

      // Send completion event
      res.write(
        `data: ${JSON.stringify({
          type: "done",
          creditsUsed: creditsNeeded,
          newBalance,
        })}\n\n`
      );
      res.end();
    } catch (streamError) {
      console.error("[Stream Chat] Streaming error:", streamError);
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: streamError instanceof Error ? streamError.message : "Streaming failed",
        })}\n\n`
      );
      res.end();
    }
  } catch (error) {
    console.error("[Stream Chat] Error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});
