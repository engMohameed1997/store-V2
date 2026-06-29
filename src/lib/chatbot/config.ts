import { createOpenAI, openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

export type AIProvider = "openai" | "google" | "anthropic" | "local";

export const CHAT_LIMITS = {
  MAX_USER_MESSAGE_LENGTH: 500,
  MAX_MESSAGES_PER_SESSION: 20,
  MAX_CONTEXT_TOKENS: 4000,
  CONCURRENCY_LOCK_TTL_SEC: 30,
} as const;

/**
 * Returns true when the selected AI provider has the credentials it needs.
 * Used to fail fast with a friendly message instead of a 500 at stream time.
 */
export function isAIConfigured(): boolean {
  const provider = (process.env.AI_PROVIDER as AIProvider) ?? "openai";

  switch (provider) {
    case "google":
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    case "anthropic":
      return !!process.env.ANTHROPIC_API_KEY;
    case "local":
      // Local provider talks to a self-hosted endpoint and needs no API key.
      return true;
    case "openai":
    default:
      // A custom base URL implies an OpenAI-compatible gateway that may not need a key.
      return !!process.env.OPENAI_API_KEY || !!process.env.AI_BASE_URL;
  }
}

export function getAIModel(): LanguageModel {
  const provider = (process.env.AI_PROVIDER as AIProvider) ?? "openai";
  const model = process.env.AI_MODEL;
  const baseUrl = process.env.AI_BASE_URL;

  switch (provider) {
    case "google":
      return google(model ?? "gemini-2.0-flash");
    case "anthropic":
      return anthropic(model ?? "claude-3-5-haiku-20241022");
    case "local": {
      const localOpenAI = createOpenAI({
        baseURL: baseUrl ?? "http://127.0.0.1:5000/v1",
        apiKey: process.env.OPENAI_API_KEY || "not-needed",
      });
      return localOpenAI(model ?? "local-model");
    }
    case "openai":
    default: {
      if (baseUrl) {
        const customOpenAI = createOpenAI({
          baseURL: baseUrl,
          apiKey: process.env.OPENAI_API_KEY || "",
        });
        return customOpenAI(model ?? "gpt-4o-mini");
      }
      return openai(model ?? "gpt-4o-mini");
    }
  }
}
