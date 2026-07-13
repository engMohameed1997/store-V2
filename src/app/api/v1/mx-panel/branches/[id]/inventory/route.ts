import { NextRequest } from "next/server";
import { warehouseRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { BranchService } from "@/lib/services/branch.service";
import { z } from "zod";

const setInventorySchema = z.object({
  productId: z.string(),
  variantId: z.string().nullable().optional(),
  stock: z.number().int().nonnegative(),
});

export const GET = warehouseRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const inventory = await BranchService.getInventory(id);
  return apiSuccess(inventory);
});

export const POST = warehouseRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, setInventorySchema);
  
  await BranchService.setInventory(
    id,
    input.productId,
    input.variantId || null,
    input.stock
  );
  
  return apiSuccess({ message: "تم تحديث المخزون بالفرع بنجاح" });
});
