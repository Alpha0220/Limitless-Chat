import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getUserSettings, upsertUserSettings } from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Validation schema for settings update
 */
const updateSettingsSchema = z.object({
  limitlessApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  selectedModel: z.string().optional(),
});

/**
 * Available AI models for selection
 */
const AVAILABLE_MODELS = [
  "google/gemini-2.0-flash-001",
  "openai/gpt-4-turbo",
  "openai/gpt-4o",
  "openai/gpt-5",
  "openai/gpt-5-pro",
  "anthropic/claude-opus-4.1",
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.5-sonnet-20241022",
  "anthropic/claude-3-sonnet",
  "anthropic/claude-3-haiku",
  "perplexity/llama-3.1-sonar-small-128k-online",
  "perplexity/llama-3.1-sonar-large-128k-online",
];

export const settingsRouter = router({
  /**
   * Get current user's settings
   */
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    try {
      const settings = await getUserSettings(ctx.user.id);

      // Return default settings if none exist
      if (!settings) {
        return {
          id: 0,
          userId: ctx.user.id,
          limitlessApiKey: null,
          openaiApiKey: null,
          anthropicApiKey: null,
          selectedModel: "google/gemini-2.0-flash-001",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      return settings;
    } catch (error) {
      console.error("[Settings] Failed to get settings:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve settings",
      });
    }
  }),

  /**
   * Update user's settings
   */
  updateSettings: protectedProcedure
    .input(updateSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Validate model selection if provided
        if (input.selectedModel && !AVAILABLE_MODELS.includes(input.selectedModel)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid model selection",
          });
        }

        // Validate API keys format (basic validation)
        if (input.openaiApiKey && input.openaiApiKey.length < 10) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "OpenAI API key appears to be invalid",
          });
        }

        if (input.anthropicApiKey && input.anthropicApiKey.length < 10) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Anthropic API key appears to be invalid",
          });
        }

        if (input.limitlessApiKey && input.limitlessApiKey.length < 10) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Limitless API key appears to be invalid",
          });
        }

        // Update settings in database
        const updatedSettings = await upsertUserSettings(ctx.user.id, input);

        if (!updatedSettings) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update settings",
          });
        }

        return updatedSettings;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("[Settings] Failed to update settings:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update settings",
        });
      }
    }),

  /**
   * Get available models for selection
   */
  getAvailableModels: protectedProcedure.query(async () => {
    return AVAILABLE_MODELS.map((modelId) => ({
      id: modelId,
      label: formatModelLabel(modelId),
    }));
  }),
});

/**
 * Format model ID to readable label
 */
function formatModelLabel(modelId: string): string {
  const labels: Record<string, string> = {
    "google/gemini-2.0-flash-001": "Gemini 2.0 Flash",
    "openai/gpt-4-turbo": "GPT-4 Turbo",
    "openai/gpt-4o": "GPT-4o",
    "openai/gpt-5": "GPT-5",
    "openai/gpt-5-pro": "GPT-5 Pro",
    "anthropic/claude-opus-4.1": "Claude Opus 4.1",
    "anthropic/claude-3.5-sonnet": "Claude 3.5 Sonnet",
    "anthropic/claude-3.5-sonnet-20241022": "Claude 3.5 Sonnet (Latest)",
    "anthropic/claude-3-sonnet": "Claude 3 Sonnet",
    "anthropic/claude-3-haiku": "Claude 3 Haiku",
    "perplexity/llama-3.1-sonar-small-128k-online": "Perplexity Sonar Small",
    "perplexity/llama-3.1-sonar-large-128k-online": "Perplexity Sonar Large",
  };

  return labels[modelId] || modelId;
}
