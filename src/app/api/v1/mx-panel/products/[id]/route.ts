import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiNoContent } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { updateProductSchema } from "@/lib/validators/product";
import { ProductService } from "@/lib/services/product.service";
import { AuditService } from "@/lib/services/audit.service";
import { getClientIp, getUserAgent } from "@/lib/api/auth-guard";

export const GET = adminRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const product = await ProductService.getById(id);
  return apiSuccess(product);
});

export const PUT = adminRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, updateProductSchema);
  const product = await ProductService.update(id, input);
  await AuditService.log({
    userId: context.user!.userId,
    action: "UPDATE",
    entity: "Product",
    entityId: id,
    newData: input,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });
  return apiSuccess(product);
});

export const DELETE = adminRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  await ProductService.softDelete(id);
  await AuditService.log({
    userId: context.user!.userId,
    action: "DELETE",
    entity: "Product",
    entityId: id,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });
  return apiNoContent();
});
