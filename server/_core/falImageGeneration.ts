import { fal } from "@fal-ai/client";
import { ENV } from "./env";

// Set FAL_KEY environment variable for auto-configuration
if (ENV.falAiApiKey && !process.env.FAL_KEY) {
  process.env.FAL_KEY = ENV.falAiApiKey;
  console.log("[FAL AI] Set FAL_KEY environment variable");
}

// Configure FAL client globally
if (ENV.falAiApiKey) {
  console.log("[FAL AI] Configuring with API key:", ENV.falAiApiKey.substring(0, 10) + "...");
  fal.config({
    credentials: ENV.falAiApiKey,
  });
} else {
  console.warn("[FAL AI] No API key found in environment!");
}

export interface ImageGenerationOptions {
  prompt: string;
  imageSize?: "square_hd" | "square" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9";
  numInferenceSteps?: number;
  numImages?: number;
  seed?: number;
}

export interface ImageGenerationResult {
  url: string;
  width: number;
  height: number;
  contentType: string;
}

/**
 * Generate an image using FAL AI's Flux model
 * @param options Image generation options
 * @returns Generated image URL and metadata
 */
export async function generateImageWithFal(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const {
    prompt,
    imageSize = "landscape_4_3",
    numInferenceSteps = 4,
    numImages = 1,
    seed,
  } = options;

  try {
    const input: any = {
      prompt,
      image_size: imageSize,
      num_inference_steps: numInferenceSteps,
      num_images: numImages,
    };
    
    if (seed !== undefined) {
      input.seed = seed;
    }
    
    console.log("[FAL AI] Sending request with input:", JSON.stringify(input));
    
    const result: any = await fal.subscribe("fal-ai/flux/schnell", {
      input,
      logs: true,
      onQueueUpdate: (update: any) => {
        if (update.status === "IN_PROGRESS") {
          console.log("[FAL AI] Image generation in progress...");
        }
      },
    });

    // Extract the first generated image
    const image = result.data.images[0];
    
    if (!image || !image.url) {
      throw new Error("No image generated");
    }

    return {
      url: image.url,
      width: image.width,
      height: image.height,
      contentType: image.content_type || "image/jpeg",
    };
  } catch (error) {
    console.error("[FAL AI] Image generation failed:", error);
    throw new Error(
      `Failed to generate image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
