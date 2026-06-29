import { NextRequest, NextResponse } from "next/server";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { optionalAuth, getClientIp } from "@/lib/api/auth-guard";
import { checkRateLimit } from "@/lib/api/rate-limiter";
import { redis } from "@/lib/redis";
import { getAIModel, isAIConfigured } from "@/lib/chatbot/config";
import { buildTools } from "@/lib/chatbot/tools";
import { buildSystemPrompt } from "@/lib/chatbot/prompt";
import { acquireLock, releaseLock } from "@/lib/chatbot/concurrency";
import { validateMessages, validateCurrentPage, trimMessagesToFit, ChatGuardError } from "@/lib/chatbot/guard";
import { CHAT_LIMITS } from "@/lib/chatbot/config";
import { getCachedUserProfile } from "@/lib/chatbot/cache";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authUser = await optionalAuth(request);
  const ip = getClientIp(request);

  // ── Rate limiting ────────────────────────────────────────────────────────
  const tier = authUser ? "chat_user" : "chat_guest";
  const rateLimitRes = await checkRateLimit(request, tier);
  if (rateLimitRes) return rateLimitRes;

  // ── AI availability guard ────────────────────────────────────────────────
  // Fail fast with a friendly message when no provider credentials are set,
  // instead of surfacing an opaque 500 once streaming has begun.
  if (!isAIConfigured()) {
    return NextResponse.json(
      { success: false, error: { code: "AI_NOT_CONFIGURED", message: "خدمة المساعد الذكي غير متاحة حالياً. يرجى المحاولة لاحقاً." } },
      { status: 503 }
    );
  }

  // Daily quota for authenticated users
  if (authUser) {
    const dailyKey = `rl:chat:daily:${authUser.userId}`;
    const dailyCount = await redis.incr(dailyKey);
    if (dailyCount === 1) await redis.expire(dailyKey, 86400);
    if (dailyCount > 100) {
      return NextResponse.json(
        { success: false, error: { code: "DAILY_QUOTA_EXCEEDED", message: "تجاوزت الحد اليومي (100 رسالة). حاول غداً." } },
        { status: 429 }
      );
    }
  }

  // ── Concurrency guard ────────────────────────────────────────────────────
  const lockId = authUser ? authUser.userId : ip;
  const acquired = await acquireLock(lockId);
  if (!acquired) {
    return NextResponse.json(
      { success: false, error: { code: "CONCURRENT_REQUEST", message: "جاري معالجة رسالتك السابقة، انتظر قليلاً." } },
      { status: 409 }
    );
  }

  try {
    // ── Parse & validate body ──────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: { code: "INVALID_JSON", message: "Invalid JSON body" } }, { status: 400 });
    }

    const rawMessages = body.messages;
    const currentPage = validateCurrentPage(body.currentPage);

    let validatedMessages;
    try {
      validatedMessages = validateMessages(rawMessages);
    } catch (e) {
      if (e instanceof ChatGuardError) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: e.message } },
          { status: e.status }
        );
      }
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid messages" } }, { status: 400 });
    }

    // Trim to fit context window
    const trimmedMessages = trimMessagesToFit(validatedMessages, CHAT_LIMITS.MAX_CONTEXT_TOKENS);

    // Convert to ModelMessage format (AI SDK v6) — use trimmed validated messages
    const modelMessages = await convertToModelMessages(
      trimmedMessages.map((m) => ({
        role: m.role,
        parts: [{ type: "text" as const, text: m.content }],
      } as Omit<UIMessage, "id">))
    );

    // ── Resolve display name for personalization (cached, best-effort) ─────
    let userName: string | undefined;
    if (authUser) {
      try {
        const profile = await getCachedUserProfile(authUser.userId);
        userName = profile.firstName ?? undefined;
      } catch {
        userName = undefined;
      }
    }

    // ── Build system prompt ────────────────────────────────────────────────
    const systemPrompt = buildSystemPrompt({
      isAuthenticated: !!authUser,
      userName,
      currentPage,
    });

    // ── Stream ─────────────────────────────────────────────────────────────
    const tools = buildTools(authUser);

    const result = streamText({
      model: getAIModel(),
      system: systemPrompt,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(3),
      onFinish: () => {
        releaseLock(lockId).catch(() => {});
      },
      onError: (event) => {
        console.error("[Chat API] stream error", event);
        releaseLock(lockId).catch(() => {});
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    await releaseLock(lockId).catch(() => {});
    console.error("[Chat API]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "حدث خطأ غير متوقع." } },
      { status: 500 }
    );
  }
}
