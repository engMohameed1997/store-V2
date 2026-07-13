import { NextRequest } from "next/server";
import { customerServiceRoute } from "@/lib/api/route-handler";
import { crudList } from "@/lib/api/crud";

export const GET = customerServiceRoute(async (request: NextRequest) => {
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
