import { NextRequest, NextResponse } from "next/server";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { requireAuth, getClientIp, type AuthUser } from "@/lib/api/auth-guard";
import { checkRateLimit } from "@/lib/api/rate-limiter";
import { handleApiError } from "@/lib/api/error-handler";
import { redis } from "@/lib/redis";
import { getAIModel, isAIConfigured, getChatQuotas, CHAT_LIMITS } from "@/lib/chatbot/config";
import { buildTools } from "@/lib/chatbot/tools";
import { buildSystemPrompt } from "@/lib/chatbot/prompt";
import { acquireLock, releaseLock } from "@/lib/chatbot/concurrency";
import { validateMessages, validateCurrentPage, trimMessagesToFit, ChatGuardError } from "@/lib/chatbot/guard";
import { getCachedUserProfile } from "@/lib/chatbot/cache";

export const runtime = "nodejs";
export const maxDuration = 60;

function chatError(code: string, message: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json({ success: false, error: { code, message } }, { status, headers });
}

/**
 * The assistant is only for the store's own website. Browsers always send
 * Origin on POST and can't forge it, so this blocks other sites from calling
 * the endpoint with a visitor's session. Non-browser clients are covered by
 * cookie-only auth and the per-user / per-IP / global quotas below.
 */
function isAllowedOrigin(request: NextRequest): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  const allowed = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV !== "production") {
    allowed.push("http://localhost:3000", "http://127.0.0.1:3000");
  }
  return allowed.includes(origin);
}

/** Baghdad calendar day (UTC+3), so "try again tomorrow" means local midnight. */
function quotaDay(): string {
  return new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
}

/** Increments a daily counter; returns the new count. 0 if the store is unavailable. */
async function bumpDaily(key: string): Promise<number> {
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 2 * 86400);
    return count;
  } catch {
    return 0;
  }
}

/** Returns an error response if any daily quota is exceeded, else the user's remaining count. */
async function enforceQuotas(
  request: NextRequest,
  authUser: AuthUser
): Promise<{ error: NextResponse } | { remaining: number | null }> {
  const q = getChatQuotas();
  const day = quotaDay();
  let remaining: number | null = null;

  if (q.perUserDaily > 0) {
    const n = await bumpDaily(`chat:quota:${day}:u:${authUser.userId}`);
    if (n > q.perUserDaily) {
      return {
        error: chatError(
          "DAILY_QUOTA_EXCEEDED",
          `وصلت للحد اليومي (${q.perUserDaily} رسالة). حاول غداً.`,
          429,
          { "X-Chat-Remaining": "0" }
        ),
      };
    }
    remaining = Math.max(0, q.perUserDaily - n);
  }

  // Caps many accounts created from the same network.
  const ip = getClientIp(request);
  if (q.perIpDaily > 0 && ip !== "unknown") {
    const n = await bumpDaily(`chat:quota:${day}:ip:${ip}`);
    if (n > q.perIpDaily) {
      return { error: chatError("DAILY_QUOTA_EXCEEDED", "تم بلوغ الحد اليومي للمساعد من شبكتك. حاول غداً.", 429) };
    }
  }

  // Hard ceiling on total daily spend across all users.
  if (q.globalDaily > 0) {
    const n = await bumpDaily(`chat:quota:${day}:global`);
    if (n > q.globalDaily) {
      console.warn("[Chat API] global daily quota reached", { day, limit: q.globalDaily });
      return { error: chatError("SERVICE_BUSY", "المساعد الذكي مشغول حالياً. حاول لاحقاً.", 503) };
    }
  }

  return { remaining };
}

export async function POST(request: NextRequest) {
  // ── Origin: only the store's own pages ───────────────────────────────────
  if (!isAllowedOrigin(request)) {
    return chatError("FORBIDDEN_ORIGIN", "غير مسموح.", 403);
  }

  // ── Auth: logged-in users via the site's session cookie only ─────────────
  // Bearer tokens are rejected here so tokens can't be lifted into other apps.
  if (!request.cookies.get("accessToken")?.value) {
    return chatError("UNAUTHORIZED", "يرجى تسجيل الدخول لاستخدام المساعد الذكي.", 401);
  }
  let authUser: AuthUser;
  try {
    authUser = await requireAuth(request);
  } catch (error) {
    return handleApiError(error);
  }

  // ── Burst rate limit (per user, per minute) ──────────────────────────────
  const rateLimitRes = await checkRateLimit(request, "chat_user");
  if (rateLimitRes) return rateLimitRes;

  // ── AI availability guard ────────────────────────────────────────────────
  if (!isAIConfigured()) {
    return chatError("AI_NOT_CONFIGURED", "خدمة المساعد الذكي غير متاحة حالياً. يرجى المحاولة لاحقاً.", 503);
  }

  // ── Parse & validate body (before spending any quota) ────────────────────
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return chatError("INVALID_JSON", "Invalid JSON body", 400);
  }
  if (typeof body !== "object" || body === null) {
    return chatError("INVALID_JSON", "Invalid JSON body", 400);
  }

  const currentPage = validateCurrentPage(body.currentPage);
  let validatedMessages;
  try {
    validatedMessages = validateMessages(body.messages);
  } catch (e) {
    if (e instanceof ChatGuardError) {
      return chatError("VALIDATION_ERROR", e.message, e.status);
    }
    return chatError("VALIDATION_ERROR", "Invalid messages", 400);
  }

  // ── Concurrency guard: one in-flight reply per user ──────────────────────
  const lockId = authUser.userId;
  if (!(await acquireLock(lockId))) {
    return chatError("CONCURRENT_REQUEST", "جاري معالجة رسالتك السابقة، انتظر قليلاً.", 409);
  }

  try {
    // ── Daily quotas ───────────────────────────────────────────────────────
    const quota = await enforceQuotas(request, authUser);
    if ("error" in quota) {
      await releaseLock(lockId).catch(() => {});
      return quota.error;
    }

    const trimmedMessages = trimMessagesToFit(validatedMessages, CHAT_LIMITS.MAX_CONTEXT_CHARS);

    // Convert to ModelMessage format (AI SDK v6) — use trimmed validated messages
    const modelMessages = await convertToModelMessages(
      trimmedMessages.map((m) => ({
        role: m.role,
        parts: [{ type: "text" as const, text: m.content }],
      } as Omit<UIMessage, "id">))
    );

    // ── Resolve display name for personalization (cached, best-effort) ─────
    let userName: string | undefined;
    try {
      const profile = await getCachedUserProfile(authUser.userId);
      userName = profile.firstName ?? undefined;
    } catch {
      userName = undefined;
    }

    const systemPrompt = buildSystemPrompt({
      isAuthenticated: true,
      userName,
      currentPage,
    });

    // ── Stream ─────────────────────────────────────────────────────────────
    const result = streamText({
      model: getAIModel(),
      system: systemPrompt,
      messages: modelMessages,
      tools: buildTools(authUser),
      stopWhen: stepCountIs(3),
      maxOutputTokens: CHAT_LIMITS.MAX_OUTPUT_TOKENS,
      // Stop the upstream model call (and its cost) if the visitor disconnects.
      abortSignal: request.signal,
      onFinish: () => {
        releaseLock(lockId).catch(() => {});
      },
      onAbort: () => {
        releaseLock(lockId).catch(() => {});
      },
      onError: (event) => {
        console.error("[Chat API] stream error", event);
        releaseLock(lockId).catch(() => {});
      },
    });

    return result.toUIMessageStreamResponse({
      headers: quota.remaining !== null ? { "X-Chat-Remaining": String(quota.remaining) } : undefined,
    });
  } catch (error) {
    await releaseLock(lockId).catch(() => {});
    console.error("[Chat API]", error);
    return chatError("INTERNAL_ERROR", "حدث خطأ غير متوقع.", 500);
  }
}
