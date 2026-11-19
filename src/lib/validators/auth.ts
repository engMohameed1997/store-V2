import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "البريد الإلكتروني طويل جداً")
  .email("البريد الإلكتروني غير صالح");

const otpCode = z.string().regex(/^\d{6}$/, "أدخل الرمز المكوّن من 6 أرقام");

const strongPassword = z
  .string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
  .max(128, "كلمة المرور طويلة جداً")
  .regex(/[a-z]/, "يجب أن تحتوي على حرف صغير")
  .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير")
  .regex(/\d/, "يجب أن تحتوي على رقم")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "يجب أن تحتوي على رمز خاص");

const safeName = z
  .string()
  .min(2, "الاسم يجب أن يكون حرفين على الأقل")
  .max(50, "الاسم طويل جداً")
  .regex(/^[\p{L}\s'-]+$/u, "أحرف غير صالحة في الاسم");

export const registerSchema = z.object({
  email,
  password: strongPassword,
  confirmPassword: strongPassword,
  firstName: safeName,
  lastName: safeName,
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين.",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "البريد الإلكتروني مطلوب").max(254),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  deviceName: z.string().max(100).optional(),
  deviceId: z.string().max(100).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "الرمز مطلوب"),
});

const registrationToken = z.string().min(1, "انتهت صلاحية التسجيل. أعد إنشاء الحساب.").max(2048);

export const verifyEmailSchema = z.object({
  registrationToken,
  code: otpCode,
});

export const resendCodeSchema = z.object({
  registrationToken,
});

export const forgotPasswordSchema = z.object({
  email,
});

export const verifyResetOtpSchema = z.object({
  email,
  code: otpCode,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "الرمز مطلوب"),
  password: strongPassword,
  confirmPassword: strongPassword,
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين.",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: strongPassword,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetOtpInput = z.infer<typeof verifyResetOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
