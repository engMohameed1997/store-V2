import { NextRequest, NextResponse } from "next/server";
import { AnalyticsService } from "@/lib/services/analytics.service";
import { checkRateLimit } from "@/lib/api/rate-limiter";

function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const vercelHeader = request.headers.get("x-vercel-cron-secret");
  if (vercelHeader === cronSecret) return true;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) return true;

  return false;
}

async function handleCacheInvalidate(request: NextRequest) {
  const rateLimited = checkRateLimit(request, "strict");
  if (rateLimited) return rateLimited;

  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } },
      { status: 401 }
    );
  }

  AnalyticsService.invalidateCache();

  return NextResponse.json({
    success: true,
    data: { message: "Cache invalidated", timestamp: new Date().toISOString() },
  });
}

export const GET = handleCacheInvalidate;
export const POST = handleCacheInvalidate;
