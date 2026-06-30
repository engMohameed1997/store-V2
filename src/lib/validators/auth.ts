import { z } from "zod";

const IRAQI_PHONE_REGEX = /^(\+964|00964|0)?(7[3-9]\d{8})$/;

const iraqiPhone = z
  .string()
  .regex(IRAQI_PHONE_REGEX, "رقم هاتف عراقي غير صالح (مثال: 07XXXXXXXXX)")
  .transform((val) => {
    const cleaned = val.replace(/^(\+964|00964|0)/, "");
    return `+964${cleaned}`;
  });

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

export const registerByPhoneSchema = z.object({
  phone: iraqiPhone,
  password: strongPassword,
  confirmPassword: strongPassword,
  firstName: safeName,
  lastName: safeName,
  firebaseIdToken: z.string().min(1, "رمز التحقق مطلوب"),
  preAuthToken: z.string().min(1, "رمز التحقق المسبق مطلوب"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين.",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "البريد أو الهاتف مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  deviceName: z.string().max(100).optional(),
  deviceId: z.string().max(100).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "الرمز مطلوب"),
});

export const verifyPhoneSchema = z.object({
  phone: iraqiPhone,
  firebaseIdToken: z.string().min(1, "رمز التحقق مطلوب"),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "البريد أو الهاتف مطلوب"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "الرمز مطلوب"),
  password: strongPassword,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: strongPassword,
});

export type RegisterByPhoneInput = z.infer<typeof registerByPhoneSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
