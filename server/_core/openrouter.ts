import { ENV } from "./env";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterStreamChunk {
  id: string;
  model: string;
  choices: Array<{
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

// Model mapping for OpenRouter
export const MODEL_MAP: Record<string, string> = {
  "gpt-4": "openai/gpt-4-turbo-preview",
  "gpt-3.5-turbo": "openai/gpt-3.5-turbo",
  "claude-3-opus": "anthropic/claude-3-opus",
  "claude-3-sonnet": "anthropic/claude-3-sonnet",
  "perplexity": "perplexity/llama-3.1-sonar-large-128k-online",
  "gemini-pro": "google/gemini-pro",
  "google/gemini-2.0-flash-001": "google/gemini-2.0-flash-001", // Direct mapping
};

// Credit costs per model (matches frontend and pricing page)
export const MODEL_CREDITS: Record<string, number> = {
  "openai/gpt-5": 15,
  "openai/gpt-5-pro": 25,
  "gpt-4": 10,
  "anthropic/claude-opus-4.1": 20,
  "anthropic/claude-sonnet-4.5": 12,
  "anthropic/claude-sonnet-4": 10,
  "anthropic/claude-haiku-4.5": 6,
  "anthropic/claude-3.7-sonnet": 8,
  "perplexity/sonar-pro": 8,
  "perplexity/sonar": 3,
  "google/gemini-2.0-flash-001": 2,
  // Legacy mappings for backward compatibility
  "gpt-3.5-turbo": 3,
  "claude-3-opus": 8,
  "claude-3-sonnet": 5,
  "perplexity": 3,
  "gemini-pro": 2,
};

/**
 * Call OpenRouter API for chat completion
 */
export async function callOpenRouter(
  model: string,
  messages: OpenRouterMessage[],
  stream: boolean = false
): Promise<OpenRouterResponse | ReadableStream> {
  // Use full model ID if available in map, otherwise pass through as-is for direct OpenRouter IDs
  const openrouterModel = MODEL_MAP[model] || model || "openai/gpt-4-turbo";
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ENV.openrouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": ENV.appUrl || "https://limitless-chat.manus.space",
      "X-Title": "Limitless Chat",
    },
    body: JSON.stringify({
      model: openrouterModel,
      messages,
      stream,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  if (stream) {
    return response.body as ReadableStream;
  }

  return response.json() as Promise<OpenRouterResponse>;
}

/**
 * Calculate credits needed for a chat completion
 */
export function calculateCredits(model: string, tokenCount?: number): number {
  const baseCredits = MODEL_CREDITS[model] || MODEL_CREDITS["openai/gpt-4-turbo"] || 10;
  
  // If we have token count, we could adjust based on that
  // For now, just return base credits per message
  return baseCredits;
}

/**
 * Stream OpenRouter response
 */
export async function* streamOpenRouter(
  model: string,
  messages: OpenRouterMessage[]
): AsyncGenerator<string, void, unknown> {
  const stream = await callOpenRouter(model, messages, true) as ReadableStream;
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;

          try {
            const parsed: OpenRouterStreamChunk = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON
            continue;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}


/**
 * Build a personalized system prompt based on user preferences
 * This function constructs a system prompt that incorporates the user's personalization settings
 */
export function buildPersonalizedSystemPrompt(
  baseSystemPrompt: string,
  personalization?: {
    styleTone_baseTone?: string;
    styleTone_additionalPreferences?: string | null;
    nickname?: string | null;
    occupation?: string | null;
    aboutUser_interests?: string | null;
    aboutUser_values?: string | null;
    aboutUser_communicationPreferences?: string | null;
  }
): string {
  if (!personalization) {
    return baseSystemPrompt;
  }

  const personalizedInstructions: string[] = [];

  // Add tone preference
  if (personalization.styleTone_baseTone) {
    const toneInstructions: Record<string, string> = {
      formal:
        "Use a formal, professional tone. Be precise and avoid casual language.",
      friendly:
        "Use a warm, friendly tone. Be conversational and approachable.",
      concise:
        "Be concise and to the point. Provide brief, direct answers without unnecessary elaboration.",
      detailed:
        "Provide detailed, comprehensive explanations. Include examples and thorough context.",
    };

    const toneInstruction = toneInstructions[personalization.styleTone_baseTone];
    if (toneInstruction) {
      personalizedInstructions.push(toneInstruction);
    }
  }

  // Add additional preferences
  if (personalization.styleTone_additionalPreferences) {
    try {
      const preferences = JSON.parse(personalization.styleTone_additionalPreferences);
      if (Array.isArray(preferences) && preferences.length > 0) {
        personalizedInstructions.push(
          `Additional preferences: ${preferences.join(", ")}`
        );
      }
    } catch (e) {
      // If not valid JSON, skip
    }
  }

  // Add user context
  const userContext: string[] = [];

  if (personalization.nickname) {
    userContext.push(`The user's name is ${personalization.nickname}.`);
  }

  if (personalization.occupation) {
    userContext.push(`The user works as a ${personalization.occupation}.`);
  }

  if (personalization.aboutUser_interests) {
    userContext.push(
      `User's interests: ${personalization.aboutUser_interests}`
    );
  }

  if (personalization.aboutUser_values) {
    userContext.push(`User's values: ${personalization.aboutUser_values}`);
  }

  if (personalization.aboutUser_communicationPreferences) {
    userContext.push(
      `Communication preferences: ${personalization.aboutUser_communicationPreferences}`
    );
  }

  if (userContext.length > 0) {
    personalizedInstructions.push("User context: " + userContext.join(" "));
  }

  // Combine base prompt with personalized instructions
  if (personalizedInstructions.length > 0) {
    return (
      baseSystemPrompt +
      "\n\n" +
      "Personalization settings:\n" +
      personalizedInstructions.join("\n")
    );
  }

  return baseSystemPrompt;
}
