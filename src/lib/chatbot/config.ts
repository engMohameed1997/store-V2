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
