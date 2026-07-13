import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[\p{L}\s'-]+$/u)
    .optional(),
  lastName: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[\p{L}\s'-]+$/u)
    .optional(),
  avatar: z.string().regex(
    /^(\/uploads\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp)|\/minio\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp))$/i,
    "Avatar must be uploaded via the /api/v1/uploads endpoint first"
  ).optional().nullable(),
});

export const adminUpdateUserSchema = z.object({
  role: z.enum(["CUSTOMER", "ADMIN", "SUPER_ADMIN", "SALES", "WAREHOUSE", "CUSTOMER_SERVICE"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED", "PENDING_VERIFICATION"]).optional(),
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
