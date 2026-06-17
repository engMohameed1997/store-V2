import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api/auth-guard";

export const POST = publicRoute(async (request: NextRequest) => {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { path } = body;

  if (!path || typeof path !== "string") {
    return apiSuccess({ success: false, error: "Path is required" });
  }

  let userId: string | null = null;
  try {
    const authUser = await requireAuth(request);
    userId = authUser.userId;
  } catch {
    // Optionally accept a userId passed from the frontend (if any)
    if (body.userId && typeof body.userId === "string") {
      userId = body.userId;
    }
  }

  // Create page view entry
  const pageView = await db.pageView.create({
    data: {
      path,
      userId,
    },
  });

  return apiSuccess(pageView);
});
