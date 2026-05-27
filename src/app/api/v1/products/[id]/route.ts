import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { ProductService } from "@/lib/services/product.service";

export const GET = publicRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const product = await ProductService.getById(id);
  return apiSuccess(product);
});
