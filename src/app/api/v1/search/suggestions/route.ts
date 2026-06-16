import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db";

export const GET = publicRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.trim().length < 2) {
    // Return top popular queries
    const popular = await db.searchHistory.groupBy({
      by: ["query"],
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 5,
    });
    return apiSuccess(popular.map((p) => p.query));
  }

  // Find popular queries matching prefix
  const matches = await db.searchHistory.groupBy({
    by: ["query"],
    where: {
      query: {
        contains: q.trim().toLowerCase(),
      },
    },
    _count: { query: true },
    orderBy: { _count: { query: "desc" } },
    take: 5,
  });

  return apiSuccess(matches.map((p) => p.query));
});
