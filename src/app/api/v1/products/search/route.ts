import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db";

export const GET = publicRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

  if (q.length < 2) {
    return apiSuccess([]);
  }

  const products = await db.product.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { nameAr: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      nameAr: true,
      price: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
    },
    take: limit,
    orderBy: { soldCount: "desc" },
  });

  return apiSuccess(products);
}, "search");
