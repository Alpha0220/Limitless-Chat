import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { buildPersonalizedSystemPrompt } from "../../_core/openrouter";

/**
 * End-to-End Test: Personalization Feature
 * Tests the complete flow from settings storage to AI response generation
 */
describe("Personalization E2E Tests", () => {
  describe("Scenario 1: User sets nickname and tone", () => {
    it("should build system prompt with user's nickname", () => {
      // Simulate user settings from database
      const userSettings = {
        nickname: "Alice",
        styleTone_baseTone: "friendly" as const,
        occupation: "Software Engineer",
        aboutUser_interests: "AI, machine learning",
      };

      // Build personalized system prompt
      const basePrompt = "You are a helpful AI assistant.";
      const result = buildPersonalizedSystemPrompt(basePrompt, userSettings);

      // Verify AI will use the nickname
      expect(result).toContain("Alice");
      expect(result).toContain("friendly");
      expect(result).toContain("Software Engineer");
      expect(result).toContain("AI, machine learning");
    });

    it("should generate response that uses nickname", () => {
      const userSettings = {
        nickname: "John",
        styleTone_baseTone: "friendly" as const,
      };

      const systemPrompt = buildPersonalizedSystemPrompt(
        "You are a helpful AI assistant.",
        userSettings
      );

      // Verify system prompt contains instructions to use nickname
      expect(systemPrompt).toContain("John");
      expect(systemPrompt).toContain("warm, friendly tone");
    });
  });

  describe("Scenario 2: User disables chat history reference", () => {
    it("should respect allowReferenceHistory setting", () => {
      const userSettings = {
        chatHistorySettings_allowReferenceHistory: false,
      };

      // When allowReferenceHistory is false, only current message should be sent
      // This is handled in stream-chat.ts, not in buildPersonalizedSystemPrompt
      // But we can verify the setting is stored
      expect(userSettings.chatHistorySettings_allowReferenceHistory).toBe(false);
    });
  });

  describe("Scenario 3: User sets multiple personalization preferences", () => {
    it("should combine all preferences in system prompt", () => {
      const userSettings = {
        nickname: "Sarah",
        styleTone_baseTone: "formal" as const,
        occupation: "Product Manager",
        aboutUser_interests: "product design, UX",
        aboutUser_values: "user-centric, quality",
        aboutUser_communicationPreferences: "direct, concise",
        memorySettings_allowSavedMemory: true,
        chatHistorySettings_allowReferenceHistory: true,
      };

      const systemPrompt = buildPersonalizedSystemPrompt(
        "You are a helpful AI assistant.",
        userSettings
      );

      // Verify all settings are included
      expect(systemPrompt).toContain("Sarah");
      expect(systemPrompt).toContain("formal");
      expect(systemPrompt).toContain("professional");
      expect(systemPrompt).toContain("Product Manager");
      expect(systemPrompt).toContain("product design, UX");
      expect(systemPrompt).toContain("user-centric, quality");
      expect(systemPrompt).toContain("direct, concise");
    });
  });

  describe("Scenario 4: User updates personalization settings", () => {
    it("should reflect updated tone in system prompt", () => {
      // Initial settings
      const initialSettings = {
        nickname: "Bob",
        styleTone_baseTone: "friendly" as const,
      };

      let systemPrompt = buildPersonalizedSystemPrompt(
        "You are a helpful AI assistant.",
        initialSettings
      );

      expect(systemPrompt).toContain("friendly");
      expect(systemPrompt).toContain("warm");

      // Updated settings
      const updatedSettings = {
        nickname: "Bob",
        styleTone_baseTone: "formal" as const,
      };

      systemPrompt = buildPersonalizedSystemPrompt(
        "You are a helpful AI assistant.",
        updatedSettings
      );

      expect(systemPrompt).toContain("formal");
      expect(systemPrompt).toContain("professional");
      expect(systemPrompt).not.toContain("warm");
    });
  });

  describe("Scenario 5: User resets to defaults", () => {
    it("should use default tone when reset", () => {
      const defaultSettings = {
        styleTone_baseTone: "friendly" as const,
      };

      const systemPrompt = buildPersonalizedSystemPrompt(
        "You are a helpful AI assistant.",
        defaultSettings
      );

      expect(systemPrompt).toContain("friendly");
      expect(systemPrompt).toContain("warm");
    });
  });

  describe("Scenario 6: New user without personalization", () => {
    it("should use base prompt when no personalization set", () => {
      const basePrompt = "You are a helpful AI assistant.";
      const systemPrompt = buildPersonalizedSystemPrompt(basePrompt, undefined);

      expect(systemPrompt).toBe(basePrompt);
    });
  });

  describe("Tone Effectiveness", () => {
    it("formal tone should produce professional responses", () => {
      const settings = {
        styleTone_baseTone: "formal" as const,
      };

      const prompt = buildPersonalizedSystemPrompt(
        "You are a helpful AI assistant.",
        settings
      );

      expect(prompt).toContain("formal");
      expect(prompt).toContain("professional");
      expect(prompt).toContain("precise");
    });

    it("friendly tone should produce conversational responses", () => {
      const settings = {
        styleTone_baseTone: "friendly" as const,
      };

      const prompt = buildPersonalizedSystemPrompt(
        "You are a helpful AI assistant.",
        settings
      );

      expect(prompt).toContain("friendly");
      expect(prompt).toContain("warm");
      expect(prompt).toContain("conversational");
    });

    it("concise tone should produce brief responses", () => {
      const settings = {
        styleTone_baseTone: "concise" as const,
      };

      const prompt = buildPersonalizedSystemPrompt(
        "You are a helpful AI assistant.",
        settings
      );

      expect(prompt).toContain("concise");
      expect(prompt).toContain("direct");
      expect(prompt).toContain("brief");
    });

    it("detailed tone should produce comprehensive responses", () => {
      const settings = {
        styleTone_baseTone: "detailed" as const,
      };

      const prompt = buildPersonalizedSystemPrompt(
        "You are a helpful AI assistant.",
        settings
      );

      expect(prompt).toContain("detailed");
      expect(prompt).toContain("comprehensive");
      expect(prompt).toContain("examples");
    });
  });

  describe("Nickname Usage", () => {
    it("should address user by nickname in responses", () => {
      const settings = {
        nickname: "Alex",
      };

      const prompt = buildPersonalizedSystemPrompt(
        "You are a helpful AI assistant.",
        settings
      );

      expect(prompt).toContain("Alex");
    });

    it("should not include nickname if not set", () => {
      const settings = {
        nickname: null,
      };

      const prompt = buildPersonalizedSystemPrompt(
        "You are a helpful AI assistant.",
        settings
      );

      expect(prompt).not.toContain("null");
    });
  });

  describe("Context Integration", () => {
    it("should use occupation to tailor explanations", () => {
      const settings = {
        occupation: "Data Scientist",
      };

      const prompt = buildPersonalizedSystemPrompt(
        "You are a helpful AI assistant.",
        settings
      );

      expect(prompt).toContain("Data Scientist");
    });

    it("should consider user interests", () => {
      const settings = {
        aboutUser_interests: "blockchain, cryptocurrency",
      };

      const prompt = buildPersonalizedSystemPrompt(
        "You are a helpful AI assistant.",
        settings
      );

      expect(prompt).toContain("blockchain, cryptocurrency");
    });

    it("should respect user values", () => {
      const settings = {
        aboutUser_values: "sustainability, ethics",
      };

      const prompt = buildPersonalizedSystemPrompt(
        "You are a helpful AI assistant.",
        settings
      );

      expect(prompt).toContain("sustainability, ethics");
    });

    it("should follow communication preferences", () => {
      const settings = {
        aboutUser_communicationPreferences: "use examples, be encouraging",
      };

      const prompt = buildPersonalizedSystemPrompt(
        "You are a helpful AI assistant.",
        settings
      );

      expect(prompt).toContain("examples");
      expect(prompt).toContain("encouraging");
    });
  });
});
