import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "./auth-guard";
import { apiError } from "./response";
import { redis } from "@/lib/redis";

interface RateLimitConfig {
  windowSec: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: { windowSec: 60, maxRequests: 60 },
  auth: { windowSec: 900, maxRequests: 10 },
  refresh: { windowSec: 300, maxRequests: 30 },
  strict: { windowSec: 60, maxRequests: 5 },
  search: { windowSec: 60, maxRequests: 30 },
  upload: { windowSec: 60, maxRequests: 10 },
  chat_guest: { windowSec: 60, maxRequests: 5 },
  chat_user: { windowSec: 60, maxRequests: 15 },
  chat_daily: { windowSec: 86400, maxRequests: 100 },
};

export async function checkRateLimit(
  request: NextRequest,
  tier: keyof typeof RATE_LIMITS = "default"
): Promise<NextResponse | null> {
  const config = RATE_LIMITS[tier];
  const ip = getClientIp(request);
  const path = new URL(request.url).pathname;
  const key = `rl:${ip}:${path}:${tier}`;

  // Atomic INCR: if key doesn't exist Redis creates it at 0 then increments to 1
  let count: number;
  try {
    count = await redis.incr(key);
  } catch {
    return null;
  }

  // On the first request in a new window, set the TTL
  if (count === 1) {
    await redis.expire(key, config.windowSec);
  } else if (count === 2) {
    // Safety net: if the TTL was never set (e.g. the first INCR and EXPIRE
    // fell in a race window where the key expired between the two calls),
    // recover by setting the TTL now. TTL of -1 means no expiry is set.
    const ttl = await redis.ttl(key);
    if (ttl === -1) await redis.expire(key, config.windowSec);
  }

  if (count > config.maxRequests) {
    const ttl = await redis.ttl(key);
    const retryAfter = ttl > 0 ? ttl : config.windowSec;
    const resetAt = Date.now() + retryAfter * 1000;

    const response = apiError(
      "RATE_LIMITED",
      `Too many requests. Retry after ${retryAfter}s`,
      429
    );
    response.headers.set("Retry-After", String(retryAfter));
    response.headers.set("X-RateLimit-Limit", String(config.maxRequests));
    response.headers.set("X-RateLimit-Remaining", "0");
    response.headers.set("X-RateLimit-Reset", String(resetAt));
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
  const key = `rl:${ip}:${path}:${tier}`;

  const count = await redis.get<number>(key) ?? 0;
  const remaining = Math.max(0, config.maxRequests - count);

  return {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(remaining),
  };
}
