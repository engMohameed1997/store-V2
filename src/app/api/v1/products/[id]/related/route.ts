import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { db } from "@/lib/db";

export const GET = publicRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;

  const product = await db.product.findUnique({
    where: { id, deletedAt: null, isActive: true },
    select: { categoryId: true, brandId: true, price: true },
  });

  if (!product) throw Errors.notFound("Product");

  const related = await db.product.findMany({
    where: {
      id: { not: id },
      deletedAt: null,
      isActive: true,
      OR: [
        ...(product.categoryId ? [{ categoryId: product.categoryId }] : []),
        ...(product.brandId ? [{ brandId: product.brandId }] : []),
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      nameAr: true,
      price: true,
      compareAtPrice: true,
      avgRating: true,
      reviewCount: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
    },
    take: 8,
    orderBy: { soldCount: "desc" },
  });

  return apiSuccess(related);
}, "search");
