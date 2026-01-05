import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../../db";
import { users, userSettings } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { buildPersonalizedSystemPrompt } from "../../_core/openrouter";

describe("Personalization Integration Tests", () => {
  let db: any;
  let testUserId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Create a test user
    const result = await db
      .insert(users)
      .values({
        openId: `test-user-${Date.now()}`,
        name: "Test User",
        email: "test@example.com",
        loginMethod: "test",
      })
      .execute();

    // Get the inserted user ID
    const insertedUsers = await db
      .select()
      .from(users)
      .where(eq(users.openId, `test-user-${Date.now()}`))
      .limit(1)
      .execute();

    if (insertedUsers.length > 0) {
      testUserId = insertedUsers[0].id;
    } else {
      throw new Error("Failed to create test user");
    }
  });

  afterAll(async () => {
    if (db && testUserId) {
      // Clean up test data
      await db
        .delete(userSettings)
        .where(eq(userSettings.userId, testUserId))
        .execute();

      await db
        .delete(users)
        .where(eq(users.id, testUserId))
        .execute();
    }
  });

  describe("Personalization Settings Storage", () => {
    it("should store and retrieve personalization settings", async () => {
      // Insert personalization settings
      await db
        .insert(userSettings)
        .values({
          userId: testUserId,
          styleTone_baseTone: "friendly",
          styleTone_additionalPreferences: JSON.stringify(["use examples"]),
          nickname: "John",
          occupation: "Engineer",
          aboutUser_interests: "AI, music",
          aboutUser_values: "innovation",
          aboutUser_communicationPreferences: "direct",
          memorySettings_allowSavedMemory: true,
          chatHistorySettings_allowReferenceHistory: true,
        })
        .execute();

      // Retrieve settings
      const settings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, testUserId))
        .limit(1)
        .execute();

      expect(settings).toHaveLength(1);
      expect(settings[0].styleTone_baseTone).toBe("friendly");
      expect(settings[0].nickname).toBe("John");
      expect(settings[0].occupation).toBe("Engineer");
      expect(settings[0].memorySettings_allowSavedMemory).toBe(true);
      expect(settings[0].chatHistorySettings_allowReferenceHistory).toBe(true);
    });

    it("should update personalization settings", async () => {
      // Update settings
      await db
        .update(userSettings)
        .set({
          styleTone_baseTone: "formal",
          nickname: "Jane",
        })
        .where(eq(userSettings.userId, testUserId))
        .execute();

      // Verify update
      const settings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, testUserId))
        .limit(1)
        .execute();

      expect(settings[0].styleTone_baseTone).toBe("formal");
      expect(settings[0].nickname).toBe("Jane");
    });

    it("should handle null values for optional fields", async () => {
      // Update with null values
      await db
        .update(userSettings)
        .set({
          nickname: null,
          occupation: null,
        })
        .where(eq(userSettings.userId, testUserId))
        .execute();

      // Verify nulls are stored
      const settings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, testUserId))
        .limit(1)
        .execute();

      expect(settings[0].nickname).toBeNull();
      expect(settings[0].occupation).toBeNull();
    });
  });

  describe("System Prompt Personalization", () => {
    it("should build personalized system prompt with nickname", () => {
      const basePrompt = "You are a helpful AI assistant.";
      const personalization = {
        nickname: "Alice",
        styleTone_baseTone: "friendly",
      };

      const result = buildPersonalizedSystemPrompt(basePrompt, personalization);

      expect(result).toContain("Alice");
      expect(result).toContain("friendly");
      expect(result).toContain("warm, friendly tone");
    });

    it("should build personalized system prompt with occupation", () => {
      const basePrompt = "You are a helpful AI assistant.";
      const personalization = {
        occupation: "Software Engineer",
        styleTone_baseTone: "formal",
      };

      const result = buildPersonalizedSystemPrompt(basePrompt, personalization);

      expect(result).toContain("Software Engineer");
      expect(result).toContain("formal");
      expect(result).toContain("professional tone");
    });

    it("should build personalized system prompt with interests and values", () => {
      const basePrompt = "You are a helpful AI assistant.";
      const personalization = {
        aboutUser_interests: "AI, machine learning",
        aboutUser_values: "innovation, efficiency",
        styleTone_baseTone: "concise",
      };

      const result = buildPersonalizedSystemPrompt(basePrompt, personalization);

      expect(result).toContain("AI, machine learning");
      expect(result).toContain("innovation, efficiency");
      expect(result).toContain("concise");
      expect(result).toContain("direct answers");
    });

    it("should build personalized system prompt with communication preferences", () => {
      const basePrompt = "You are a helpful AI assistant.";
      const personalization = {
        aboutUser_communicationPreferences: "prefer bullet points",
        styleTone_baseTone: "detailed",
      };

      const result = buildPersonalizedSystemPrompt(basePrompt, personalization);

      expect(result).toContain("bullet points");
      expect(result).toContain("detailed");
      expect(result).toContain("comprehensive explanations");
    });

    it("should handle missing personalization gracefully", () => {
      const basePrompt = "You are a helpful AI assistant.";

      const result = buildPersonalizedSystemPrompt(basePrompt, undefined);

      expect(result).toBe(basePrompt);
    });

    it("should handle partial personalization", () => {
      const basePrompt = "You are a helpful AI assistant.";
      const personalization = {
        nickname: "Bob",
        // Only nickname, no tone or other settings
      };

      const result = buildPersonalizedSystemPrompt(basePrompt, personalization);

      expect(result).toContain("Bob");
      expect(result).toContain(basePrompt);
    });

    it("should combine all personalization fields", () => {
      const basePrompt = "You are a helpful AI assistant.";
      const personalization = {
        styleTone_baseTone: "friendly",
        styleTone_additionalPreferences: JSON.stringify(["use examples", "be encouraging"]),
        nickname: "Alex",
        occupation: "Product Manager",
        aboutUser_interests: "product design, user experience",
        aboutUser_values: "user-centric, quality",
        aboutUser_communicationPreferences: "conversational, with examples",
      };

      const result = buildPersonalizedSystemPrompt(basePrompt, personalization);

      expect(result).toContain("Alex");
      expect(result).toContain("Product Manager");
      expect(result).toContain("product design, user experience");
      expect(result).toContain("user-centric, quality");
      expect(result).toContain("conversational, with examples");
      expect(result).toContain("friendly");
    });
  });

  describe("Tone Variations", () => {
    const basePrompt = "You are a helpful AI assistant.";

    it("should apply formal tone", () => {
      const result = buildPersonalizedSystemPrompt(basePrompt, {
        styleTone_baseTone: "formal",
      });

      expect(result).toContain("formal");
      expect(result).toContain("professional");
    });

    it("should apply friendly tone", () => {
      const result = buildPersonalizedSystemPrompt(basePrompt, {
        styleTone_baseTone: "friendly",
      });

      expect(result).toContain("friendly");
      expect(result).toContain("warm");
    });

    it("should apply concise tone", () => {
      const result = buildPersonalizedSystemPrompt(basePrompt, {
        styleTone_baseTone: "concise",
      });

      expect(result).toContain("concise");
      expect(result).toContain("direct");
    });

    it("should apply detailed tone", () => {
      const result = buildPersonalizedSystemPrompt(basePrompt, {
        styleTone_baseTone: "detailed",
      });

      expect(result).toContain("detailed");
      expect(result).toContain("comprehensive");
    });
  });
});
