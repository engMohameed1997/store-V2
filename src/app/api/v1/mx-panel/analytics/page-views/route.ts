import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db";

export const GET = adminRoute(async () => {
  // Aggregate pageviews by path
  const topPages = await db.pageView.groupBy({
    by: ["path"],
    _count: {
      path: true,
    },
    orderBy: {
      _count: {
        path: "desc",
      },
    },
    take: 10,
  });

  const formatted = topPages.map((p) => ({
    path: p.path,
    count: p._count.path,
  }));

  return apiSuccess(formatted);
});
