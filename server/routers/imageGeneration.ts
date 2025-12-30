import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  generateImage,
  getImageModelCost,
  IMAGE_MODELS,
  type ImageModelId,
} from "../_core/imageGenerationService";
import { getDb } from "../db";
import { generatedImages, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Model ID validation schema
const ImageModelIdSchema = z.enum(
  Object.keys(IMAGE_MODELS) as [ImageModelId, ...ImageModelId[]]
);

export const imageGenerationRouter = router({
  /**
   * Get available image generation models with costs
   */
  getModels: protectedProcedure.query(async () => {
    return Object.entries(IMAGE_MODELS).map(([modelId, config]) => ({
      modelId,
      displayName: config.displayName,
      provider: config.provider,
      cost: config.cost,
      description: config.description,
    }));
  }),

  /**
   * Generate an image with selected model
   */
  generate: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(1, "Prompt is required"),
        modelId: ImageModelIdSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Get model cost
      const modelCost = getImageModelCost(input.modelId);
      const modelConfig = IMAGE_MODELS[input.modelId];

      // Check if user has enough credits
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1)
        .execute();

      console.log(
        `[ImageGeneration] User ${ctx.user.id} generating with model ${input.modelId}, cost: ${modelCost} credits`
      );

      if (!userResult || userResult.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const user = userResult[0];

      if (user.credits < modelCost) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Insufficient credits. You need ${modelCost} credits to generate an image with ${modelConfig.displayName}. You have ${user.credits} credits.`,
        });
      }

      try {
        // Generate image with selected model
        console.log(
          `[ImageGeneration] Generating image with ${input.modelId}: "${input.prompt}"`
        );
        const result = await generateImage({
          prompt: input.prompt,
          modelId: input.modelId,
        });

        // Deduct credits
        await db
          .update(users)
          .set({ credits: user.credits - modelCost })
          .where(eq(users.id, ctx.user.id))
          .execute();

        // Save generated image record
        await db
          .insert(generatedImages)
          .values({
            userId: ctx.user.id,
            prompt: input.prompt,
            imageUrl: result.url,
            model: input.modelId,
            creditsUsed: modelCost,
          })
          .execute();

        console.log(
          `[ImageGeneration] Image generated successfully. Credits remaining: ${user.credits - modelCost}`
        );

        return {
          success: true,
          imageUrl: result.url,
          model: input.modelId,
          modelName: modelConfig.displayName,
          creditsUsed: modelCost,
          creditsRemaining: user.credits - modelCost,
        };
      } catch (error) {
        console.error(
          `[ImageGeneration] Error generating image with ${input.modelId}:`,
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to generate image",
        });
      }
    }),

  /**
   * Get user's generated images history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return [];
      }

      const images = await db
        .select()
        .from(generatedImages)
        .where(eq(generatedImages.userId, ctx.user.id))
        .orderBy(generatedImages.createdAt)
        .limit(input.limit)
        .offset(input.offset)
        .execute();

      return images;
    }),
});
