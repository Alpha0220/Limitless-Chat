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
};

// Credit costs per model (matches frontend)
export const MODEL_CREDITS: Record<string, number> = {
  "gpt-4": 10,
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
  const openrouterModel = MODEL_MAP[model] || MODEL_MAP["gpt-4"];
  
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
  const baseCredits = MODEL_CREDITS[model] || 10;
  
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
