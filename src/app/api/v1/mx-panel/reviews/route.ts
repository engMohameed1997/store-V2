import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { crudList } from "@/lib/api/crud";

export const GET = adminRoute(async (request: NextRequest) => {
  return crudList(request, {
    model: "review",
    searchFields: ["title", "comment"],
    allowedSortFields: ["createdAt", "rating"],
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
  });
});
