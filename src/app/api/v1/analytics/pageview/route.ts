import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db";
import { requireAuth, getClientIp } from "@/lib/api/auth-guard";
import { redis } from "@/lib/redis";

export const POST = publicRoute(async (request: NextRequest) => {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { path } = body;

  if (
    !path ||
    typeof path !== "string" ||
    path.length > 500 ||
    !path.startsWith("/")
  ) {
    return apiSuccess({ success: false, error: "Invalid path" });
  }

  // Deduplication: ignore repeated pageviews from the same IP for the same
  // path within a 30-second window to prevent DB flooding.
  const clientIp = getClientIp(request);
  const dedupKey = `pv:${clientIp}:${path.slice(0, 100)}`;
  const isNew = await redis.set(dedupKey, "1", { nx: true, ex: 30 });
  if (!isNew) {
    return apiSuccess({ recorded: false });
  }

  let userId: string | null = null;
  try {
    const authUser = await requireAuth(request);
    userId = authUser.userId;
  } catch {
    // Auth failed = anonymous visit, userId stays null
  }

  // Create page view entry
  const pageView = await db.pageView.create({
    data: {
      path,
      userId,
    },
  });

  return apiSuccess(pageView);
}, "strict");
