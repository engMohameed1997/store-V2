import { z } from "zod";

const strongPassword = z
  .string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
  .max(128, "كلمة المرور طويلة جداً")
  .regex(/[a-z]/, "يجب أن تحتوي على حرف صغير")
  .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير")
  .regex(/\d/, "يجب أن تحتوي على رقم")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "يجب أن تحتوي على رمز خاص");

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "البريد الإلكتروني مطلوب").max(254),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  deviceName: z.string().max(100).optional(),
  deviceId: z.string().max(100).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "الرمز مطلوب"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: strongPassword,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
