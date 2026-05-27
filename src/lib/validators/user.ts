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
  avatar: z.string().url().optional().nullable(),
});

export const adminUpdateUserSchema = z.object({
  role: z.enum(["CUSTOMER", "ADMIN", "SUPER_ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED", "PENDING_VERIFICATION"]).optional(),
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
