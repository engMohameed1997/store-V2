import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db";

async function getCuratedKeywords(): Promise<string[]> {
  const setting = await db.storeSetting.findUnique({
    where: { key: "searchKeywords" },
  });
  if (!setting?.value) return [];
  try {
    const parsed = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const GET = publicRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.trim().length < 2) {
    // Return curated keywords first, then top popular queries
    const [curated, popular] = await Promise.all([
      getCuratedKeywords(),
      db.searchHistory.groupBy({
        by: ["query"],
        _count: { query: true },
        orderBy: { _count: { query: "desc" } },
        take: 5,
      }),
    ]);
    const popularQueries = popular.map((p) => p.query);
    // Merge: curated first, then popular (deduplicated)
    const merged = [...curated, ...popularQueries.filter((q) => !curated.includes(q))];
    return apiSuccess(merged.slice(0, 8));
  }

  const term = q.trim().toLowerCase();

  // Find popular queries + matching product names in parallel
  const [historyMatches, productMatches, curated] = await Promise.all([
    db.searchHistory.groupBy({
      by: ["query"],
      where: { query: { contains: term } },
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 5,
    }),
    db.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { nameAr: { contains: term, mode: "insensitive" } },
        ],
      },
      select: { nameAr: true, name: true },
      take: 3,
    }),
    getCuratedKeywords(),
  ]);

  const historyQueries = historyMatches.map((p) => p.query);
  const productNames = productMatches.map((p) => p.nameAr || p.name);
  const curatedMatches = curated.filter((k) => k.toLowerCase().includes(term));

  // Merge: curated matches > history > product names (deduplicated)
  const seen = new Set<string>();
  const results: string[] = [];
  for (const item of [...curatedMatches, ...historyQueries, ...productNames]) {
    const lower = item.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      results.push(item);
    }
  }

  return apiSuccess(results.slice(0, 8));
});
