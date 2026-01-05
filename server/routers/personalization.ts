import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getPersonalizationSettings,
  updatePersonalizationSettings,
  resetPersonalizationToDefaults,
  getSavedMemories,
  clearMemories,
  getSearchPersonalizationStatus,
} from "../db";


/**
 * Security & Access Control Utilities
 */
const validateUserAccess = (requestingUserId: number, targetUserId: number) => {
  if (requestingUserId !== targetUserId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to access this resource",
    });
  }
};

const sanitizeInput = (input: string | null | undefined): string | null => {
  if (!input) return null;
  // Remove potentially harmful characters
  return input.trim().substring(0, 500);
};

/**
 * Validation schemas for personalization settings
 */
const personalizationSettingsSchema = z.object({
  styleTone_baseTone: z.enum(["formal", "friendly", "concise", "detailed"]).optional(),
  styleTone_additionalPreferences: z.string().nullable().optional(),
  nickname: z.string().max(50).nullable().optional(),
  occupation: z.string().max(100).nullable().optional(),
  aboutUser_interests: z.string().max(500).nullable().optional(),
  aboutUser_values: z.string().max(500).nullable().optional(),
  aboutUser_communicationPreferences: z.string().max(500).nullable().optional(),
  memorySettings_allowSavedMemory: z.boolean().optional(),
  chatHistorySettings_allowReferenceHistory: z.boolean().optional(),
});

type PersonalizationSettingsInput = z.infer<typeof personalizationSettingsSchema>;

/**
 * Personalization router for managing user personalization settings
 */
export const personalizationRouter = router({
  /**
   * Get user's personalization settings
   * Security: User can only access their own settings
   */
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const settings = await getPersonalizationSettings(ctx.user.id);
      return {
        success: true,
        data: settings,
      };
    } catch (error) {
      console.error("[Personalization] getSettings error:", error);
      throw error;
    }
  }),

  /**
   * Update user's personalization settings
   * Security: User can only update their own settings
   */
  updateSettings: protectedProcedure
    .input(personalizationSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }

        // Sanitize text inputs
        const sanitizedInput = {
          ...input,
          nickname: sanitizeInput(input.nickname),
          occupation: sanitizeInput(input.occupation),
          aboutUser_interests: sanitizeInput(input.aboutUser_interests),
          aboutUser_values: sanitizeInput(input.aboutUser_values),
          aboutUser_communicationPreferences: sanitizeInput(input.aboutUser_communicationPreferences),
          styleTone_additionalPreferences: sanitizeInput(input.styleTone_additionalPreferences),
        };

        const updated = await updatePersonalizationSettings(ctx.user.id, sanitizedInput);
        return {
          success: true,
          data: updated,
          message: "Personalization settings updated successfully",
        };
      } catch (error) {
        console.error("[Personalization] updateSettings error:", error);
        throw error;
      }
    }),

  /**
   * Reset personalization settings to defaults
   * Security: User can only reset their own settings
   */
  resetToDefaults: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const reset = await resetPersonalizationToDefaults(ctx.user.id);
      return {
        success: true,
        data: reset,
        message: "Personalization settings reset to defaults",
      };
    } catch (error) {
      console.error("[Personalization] resetToDefaults error:", error);
      throw error;
    }
  }),

  /**
   * Get user's saved memories
   * Security: User can only access their own memories
   */
  getMemories: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const memories = await getSavedMemories(ctx.user.id);
      return {
        success: true,
        data: memories,
        count: memories.length,
      };
    } catch (error) {
      console.error("[Personalization] getMemories error:", error);
      throw error;
    }
  }),

  /**
   * Clear all saved memories
   * Security: User can only clear their own memories
   */
  clearMemories: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const success = await clearMemories(ctx.user.id);
      return {
        success,
        message: success ? "All memories cleared successfully" : "Failed to clear memories",
      };
    } catch (error) {
      console.error("[Personalization] clearMemories error:", error);
      throw error;
    }
  }),

  /**
   * Get search personalization status (computed from memory + history settings)
   * Security: User can only access their own status
   */
  getSearchPersonalizationStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const enabled = await getSearchPersonalizationStatus(ctx.user.id);
      return {
        success: true,
        data: {
          enabled,
          description: enabled
            ? "Search personalization is enabled. Both memory and history are allowed."
            : "Search personalization is disabled. Either memory or history is disabled.",
        },
      };
    } catch (error) {
      console.error("[Personalization] getSearchPersonalizationStatus error:", error);
      throw error;
    }
  }),
});
