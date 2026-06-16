import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { BranchService } from "@/lib/services/branch.service";
import { z } from "zod";

const updateBranchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  nameAr: z.string().min(2).max(100).optional(),
  address: z.string().min(5).max(300).optional(),
  addressAr: z.string().min(5).max(300).optional(),
  phone: z.string().min(8).max(20).optional(),
  isActive: z.boolean().optional(),
});

export const GET = adminRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const branch = await BranchService.get(id);
  return apiSuccess(branch);
});

export const PUT = adminRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, updateBranchSchema);
  const branch = await BranchService.update(id, input);
  return apiSuccess(branch);
});

export const DELETE = adminRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  await BranchService.delete(id);
  return apiSuccess({ message: "تم حذف الفرع بنجاح" });
});
