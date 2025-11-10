import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { generateImageWithFal } from "../_core/falImageGeneration";
import { getDb } from "../db";
import { generatedImages, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const IMAGE_GENERATION_COST = 5; // credits per image

export const imageGenerationRouter = router({
  /**
   * Generate an image using FAL AI
   */
  generate: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(1, "Prompt is required"),
        imageSize: z
          .enum(["square_hd", "square", "portrait_4_3", "portrait_16_9", "landscape_4_3", "landscape_16_9"])
          .default("landscape_16_9"),
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

      // Check if user has enough credits
      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.credits < IMAGE_GENERATION_COST) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Insufficient credits. You need ${IMAGE_GENERATION_COST} credits to generate an image.`,
        });
      }

      try {
        // Generate image with FAL AI
        const result = await generateImageWithFal({
          prompt: input.prompt,
          imageSize: input.imageSize,
        });

        // Deduct credits
        await db
          .update(users)
          .set({ credits: user.credits - IMAGE_GENERATION_COST })
          .where(eq(users.id, ctx.user.id));

        // Save generated image record
        await db.insert(generatedImages).values({
          userId: ctx.user.id,
          prompt: input.prompt,
          imageUrl: result.url,
          model: "fal-ai/flux/schnell",
          imageSize: input.imageSize,
          width: result.width,
          height: result.height,
          creditsUsed: IMAGE_GENERATION_COST,
        });

        return {
          success: true,
          imageUrl: result.url,
          creditsUsed: IMAGE_GENERATION_COST,
          creditsRemaining: user.credits - IMAGE_GENERATION_COST,
        };
      } catch (error) {
        console.error("[Image Generation] Error:", error);
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
        .offset(input.offset);

      return images;
    }),
});
