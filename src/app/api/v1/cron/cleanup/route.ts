import { NextRequest, NextResponse } from "next/server";
import { CleanupService } from "@/lib/services/cleanup.service";
import { checkRateLimit } from "@/lib/api/rate-limiter";

function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  // Support Vercel cron header
  const vercelHeader = request.headers.get("x-vercel-cron-secret");
  if (vercelHeader === cronSecret) return true;

  // Support standard Bearer token
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) return true;

  return false;
}

async function handleCleanup(request: NextRequest) {
  const rateLimited = checkRateLimit(request, "strict");
  if (rateLimited) return rateLimited;

  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } },
      { status: 401 }
    );
  }

  try {
    const [tokenResult, cartResult] = await Promise.all([
      CleanupService.purgeExpiredTokens(),
      CleanupService.purgeExpiredCarts(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        tokens: tokenResult,
        carts: cartResult,
      },
    });
  } catch (error) {
    console.error("[CRON] Cleanup failed:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Cleanup job failed" } },
      { status: 500 }
    );
  }
}

export const GET = handleCleanup;
export const POST = handleCleanup;
