/**
 * Multi-model image generation service
 * Supports: FAL AI (Flux), OpenAI (DALL-E 3), Google (Nano Banana)
 */

import { storagePut } from "server/storage";
import { ENV } from "./env";

// Model configuration with costs
export const IMAGE_MODELS = {
  // FAL AI - Flux
  "fal-ai:flux-schnell": {
    provider: "fal-ai",
    displayName: "Flux.1 Schnell",
    cost: 5,
    description: "Fast & Cheap",
  },
  "fal-ai:flux-pro": {
    provider: "fal-ai",
    displayName: "Flux.1 Pro",
    cost: 10,
    description: "High Quality",
  },
  // OpenAI - DALL-E
  "openai:dall-e-3": {
    provider: "openai",
    displayName: "DALL-E 3",
    cost: 10,
    description: "High Quality",
  },
  // Google - Nano Banana (Gemini)
  "google:gemini-2.5-flash-image": {
    provider: "google",
    displayName: "Nano Banana (Gemini 2.5 Flash)",
    cost: 6,
    description: "Fast & Affordable",
  },
  "google:gemini-3-pro-image": {
    provider: "google",
    displayName: "Nano Banana Pro (Gemini 3 Pro)",
    cost: 12,
    description: "Premium Quality",
  },
} as const;

export type ImageModelId = keyof typeof IMAGE_MODELS;

export type GenerateImageOptions = {
  prompt: string;
  modelId: ImageModelId;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url: string;
  modelId: ImageModelId;
};

// FAL AI Adapter
async function generateWithFalAI(
  prompt: string,
  modelId: string
): Promise<string> {
  if (!ENV.falAiApiKey) {
    throw new Error("FAL_AI_API_KEY is not configured");
  }

  // Map model IDs to FAL AI model names
  const falModelMap: Record<string, string> = {
    "fal-ai:flux-schnell": "fal-ai/flux-schnell",
    "fal-ai:flux-pro": "fal-ai/flux-pro",
  };

  const falModel = falModelMap[modelId];
  if (!falModel) {
    throw new Error(`Unknown FAL AI model: ${modelId}`);
  }

  const response = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${ENV.falAiApiKey}`,
    },
    body: JSON.stringify({
      prompt,
      image_size: "landscape_4_3",
      num_inference_steps: 4,
      enable_safety_checker: true,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `FAL AI request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    images: Array<{ url: string }>;
  };

  if (!result.images || result.images.length === 0) {
    throw new Error("No images returned from FAL AI");
  }

  return result.images[0].url;
}

// OpenAI Adapter (DALL-E 3)
async function generateWithOpenAI(prompt: string): Promise<string> {
  if (!ENV.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `OpenAI request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    data: Array<{ url: string }>;
  };

  if (!result.data || result.data.length === 0) {
    throw new Error("No images returned from OpenAI");
  }

  return result.data[0].url;
}

// Google Generative AI Adapter (Nano Banana - Gemini)
async function generateWithGoogle(
  prompt: string,
  modelId: string
): Promise<string> {
  if (!ENV.googleGenaiApiKey) {
    throw new Error("GOOGLE_GENAI_API_KEY is not configured");
  }

  // Map model IDs to Google Generative AI model names
  const googleModelMap: Record<string, string> = {
    "google:gemini-2.5-flash-image": "gemini-2.5-flash",
    "google:gemini-3-pro-image": "gemini-3-pro",
  };

  const googleModel = googleModelMap[modelId];
  if (!googleModel) {
    throw new Error(`Unknown Google model: ${modelId}`);
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${ENV.googleGenaiApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Google Generative AI request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    candidates: Array<{
      content: {
        parts: Array<{
          text?: string;
          inlineData?: {
            mimeType: string;
            data: string;
          };
        }>;
      };
    }>;
  };

  if (!result.candidates || result.candidates.length === 0) {
    throw new Error("No content returned from Google Generative AI");
  }

  const parts = result.candidates[0].content.parts;
  const imagePart = parts.find((p) => p.inlineData);

  if (!imagePart || !imagePart.inlineData) {
    throw new Error("No image data returned from Google Generative AI");
  }

  // Convert base64 to buffer and upload to S3
  const buffer = Buffer.from(imagePart.inlineData.data, "base64");
  const { url } = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    imagePart.inlineData.mimeType
  );

  return url;
}

// Main dispatcher function
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const { prompt, modelId } = options;

  const modelConfig = IMAGE_MODELS[modelId as ImageModelId];
  if (!modelConfig) {
    throw new Error(`Unknown image model: ${modelId}`);
  }

  let imageUrl: string;

  try {
    const provider: string = (modelConfig as any).provider;
    switch (provider) {
      case "fal-ai":
        imageUrl = await generateWithFalAI(prompt, modelId);
        break;
      case "openai":
        imageUrl = await generateWithOpenAI(prompt);
        break;
      case "google":
        imageUrl = await generateWithGoogle(prompt, modelId);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error(
      `[ImageGeneration] Error generating image with ${modelId}:`,
      error
    );
    throw error;
  }

  return {
    url: imageUrl,
    modelId,
  };
}

// Helper function to get model cost
export function getImageModelCost(modelId: ImageModelId): number {
  const config = IMAGE_MODELS[modelId];
  if (!config) {
    throw new Error(`Unknown image model: ${modelId}`);
  }
  return config.cost;
}

// Helper function to group models by provider
export function getModelsByProvider() {
  const grouped: Record<string, typeof IMAGE_MODELS[ImageModelId][]> = {};

  for (const [modelId, config] of Object.entries(IMAGE_MODELS)) {
    if (!grouped[config.provider]) {
      grouped[config.provider] = [];
    }
    grouped[config.provider].push(config);
  }

  return grouped;
}
