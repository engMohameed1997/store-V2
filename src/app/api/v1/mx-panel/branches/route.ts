import { NextRequest } from "next/server";
import { warehouseRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiCreated } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { BranchService } from "@/lib/services/branch.service";
import { z } from "zod";

const createBranchSchema = z.object({
  name: z.string().min(2).max(100),
  nameAr: z.string().min(2).max(100).optional(),
  address: z.string().min(5).max(300),
  addressAr: z.string().min(5).max(300).optional(),
  phone: z.string()
    .regex(/^07\d{9}$/, 'يجب أن يكون رقم عراقي يبدأ بـ 07 ويتكون من 11 رقم'),
  isActive: z.boolean().default(true),
});

export const GET = warehouseRoute(async () => {
  const branches = await BranchService.list(false);
  return apiSuccess(branches);
});

export const POST = warehouseRoute(async (request: NextRequest) => {
  const input = await validateBody(request, createBranchSchema);
  const branch = await BranchService.create(input);
  return apiCreated(branch);
});
