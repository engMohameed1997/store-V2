import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "./auth-guard";
import { apiError } from "./response";
import { db } from "@/lib/db";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: { windowMs: 60_000, maxRequests: 60 },
  auth: { windowMs: 900_000, maxRequests: 10 },
  strict: { windowMs: 60_000, maxRequests: 5 },
  search: { windowMs: 60_000, maxRequests: 30 },
};

// Database-backed rate limiter for serverless compatibility
// Uses a simple table to track request counts per IP/path/tier
async function getRateLimitEntry(
  key: string,
  windowMs: number
): Promise<{ count: number; resetAt: number } | null> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  const entry = await db.rateLimitEntry.findFirst({
    where: {
      key,
      resetAt: { gt: windowStart },
    },
  });

  if (!entry) return null;

  return { count: entry.count, resetAt: entry.resetAt.getTime() };
}

async function createRateLimitEntry(
  key: string,
  windowMs: number
): Promise<void> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  await db.rateLimitEntry.create({
    data: { key, count: 1, resetAt },
  });
}

async function incrementRateLimitEntry(key: string): Promise<void> {
  await db.rateLimitEntry.updateMany({
    where: { key },
    data: { count: { increment: 1 } },
  });
}

// Atomic upsert to prevent race conditions on concurrent requests
async function upsertRateLimitEntry(
  key: string,
  windowMs: number
): Promise<{ count: number; resetAt: number }> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  const entry = await db.rateLimitEntry.upsert({
    where: { key },
    create: { key, count: 1, resetAt },
    update: { count: { increment: 1 } },
  });

  return { count: entry.count, resetAt: entry.resetAt.getTime() };
}

async function cleanupOldEntries(): Promise<void> {
  const now = new Date();
  await db.rateLimitEntry.deleteMany({
    where: { resetAt: { lt: now } },
  });
}

export async function checkRateLimit(
  request: NextRequest,
  tier: keyof typeof RATE_LIMITS = "default"
): Promise<NextResponse | null> {
  const config = RATE_LIMITS[tier];
  const ip = getClientIp(request);
  const path = new URL(request.url).pathname;
  const key = `${ip}:${path}:${tier}`;
  const now = Date.now();

  // Periodic cleanup (run on every request but very lightweight)
  if (Math.random() < 0.01) {
    await cleanupOldEntries().catch(() => {});
  }

  const existing = await getRateLimitEntry(key, config.windowMs);

  // If entry doesn't exist or is expired, use upsert for atomic create/increment
  if (!existing || existing.resetAt <= now) {
    const result = await upsertRateLimitEntry(key, config.windowMs);
    // If this was a new entry (count = 1), allow the request
    if (result.count === 1) {
      return null;
    }
    // If entry existed but was expired, check if we're over limit
    if (result.count > config.maxRequests) {
      const retryAfter = Math.ceil((result.resetAt - now) / 1000);
      const response = apiError(
        "RATE_LIMITED",
        `Too many requests. Retry after ${retryAfter}s`,
        429
      );
      response.headers.set("Retry-After", String(retryAfter));
      response.headers.set("X-RateLimit-Limit", String(config.maxRequests));
      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set("X-RateLimit-Reset", String(result.resetAt));
      return response;
    }
    return null;
  }

  await incrementRateLimitEntry(key);
  const count = existing.count + 1;

  if (count > config.maxRequests) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    const response = apiError(
      "RATE_LIMITED",
      `Too many requests. Retry after ${retryAfter}s`,
      429
    );
    response.headers.set("Retry-After", String(retryAfter));
    response.headers.set("X-RateLimit-Limit", String(config.maxRequests));
    response.headers.set("X-RateLimit-Remaining", "0");
    response.headers.set("X-RateLimit-Reset", String(existing.resetAt));
    return response;
  }

  return null;
}

export async function getRateLimitHeaders(
  request: NextRequest,
  tier: keyof typeof RATE_LIMITS = "default"
): Promise<Record<string, string>> {
  const config = RATE_LIMITS[tier];
  const ip = getClientIp(request);
  const path = new URL(request.url).pathname;
  const key = `${ip}:${path}:${tier}`;

  const existing = await getRateLimitEntry(key, config.windowMs);
  const remaining = existing
    ? Math.max(0, config.maxRequests - existing.count)
    : config.maxRequests;

  return {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(remaining),
  };
}
