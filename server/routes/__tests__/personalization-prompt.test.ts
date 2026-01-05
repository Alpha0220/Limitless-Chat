import { describe, it, expect } from "vitest";
import { buildPersonalizedSystemPrompt } from "../../_core/openrouter";

describe("System Prompt Personalization", () => {
  const basePrompt = "You are a helpful AI assistant.";

  describe("Nickname Usage", () => {
    it("should include user's nickname in system prompt", () => {
      const personalization = {
        nickname: "Alice",
      };

      const result = buildPersonalizedSystemPrompt(basePrompt, personalization);

      expect(result).toContain("Alice");
      expect(result).toContain(basePrompt);
    });

    it("should handle null nickname", () => {
      const personalization = {
        nickname: null,
      };

      const result = buildPersonalizedSystemPrompt(basePrompt, personalization);

      expect(result).toBe(basePrompt);
    });
  });

  describe("Tone Preferences", () => {
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

  describe("User Context", () => {
    it("should include occupation", () => {
      const result = buildPersonalizedSystemPrompt(basePrompt, {
        occupation: "Software Engineer",
      });

      expect(result).toContain("Software Engineer");
    });

    it("should include interests", () => {
      const result = buildPersonalizedSystemPrompt(basePrompt, {
        aboutUser_interests: "AI, machine learning",
      });

      expect(result).toContain("AI, machine learning");
    });

    it("should include values", () => {
      const result = buildPersonalizedSystemPrompt(basePrompt, {
        aboutUser_values: "innovation, quality",
      });

      expect(result).toContain("innovation, quality");
    });

    it("should include communication preferences", () => {
      const result = buildPersonalizedSystemPrompt(basePrompt, {
        aboutUser_communicationPreferences: "prefer bullet points",
      });

      expect(result).toContain("bullet points");
    });
  });

  describe("Combined Personalization", () => {
    it("should combine nickname, tone, and context", () => {
      const result = buildPersonalizedSystemPrompt(basePrompt, {
        nickname: "John",
        styleTone_baseTone: "friendly",
        occupation: "Product Manager",
        aboutUser_interests: "product design",
      });

      expect(result).toContain("John");
      expect(result).toContain("friendly");
      expect(result).toContain("Product Manager");
      expect(result).toContain("product design");
    });

    it("should handle partial personalization", () => {
      const result = buildPersonalizedSystemPrompt(basePrompt, {
        nickname: "Bob",
        // Only nickname, no other settings
      });

      expect(result).toContain("Bob");
      expect(result).toContain(basePrompt);
    });

    it("should handle missing personalization", () => {
      const result = buildPersonalizedSystemPrompt(basePrompt, undefined);

      expect(result).toBe(basePrompt);
    });
  });

  describe("Additional Preferences", () => {
    it("should parse and include additional preferences", () => {
      const result = buildPersonalizedSystemPrompt(basePrompt, {
        styleTone_additionalPreferences: JSON.stringify(["use examples", "be encouraging"]),
      });

      expect(result).toContain("use examples");
      expect(result).toContain("be encouraging");
    });

    it("should handle invalid JSON in additional preferences", () => {
      const result = buildPersonalizedSystemPrompt(basePrompt, {
        styleTone_additionalPreferences: "invalid json",
      });

      // Should not crash, just skip the invalid preferences
      expect(result).toBeDefined();
    });
  });

  describe("System Prompt Structure", () => {
    it("should preserve base prompt", () => {
      const result = buildPersonalizedSystemPrompt(basePrompt, {
        nickname: "Test",
      });

      expect(result).toContain(basePrompt);
    });

    it("should add personalization section", () => {
      const result = buildPersonalizedSystemPrompt(basePrompt, {
        nickname: "Test",
        styleTone_baseTone: "friendly",
      });

      expect(result).toContain("Personalization settings:");
    });

    it("should not add personalization section if no settings", () => {
      const result = buildPersonalizedSystemPrompt(basePrompt, undefined);

      expect(result).not.toContain("Personalization settings:");
    });
  });
});
